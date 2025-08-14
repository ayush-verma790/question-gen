"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Palette,
  ClipboardPasteIcon as Paste,
  ImageIcon,
  Video,
  Music,
} from "lucide-react";
import { AdvancedColorPicker } from "@/components/advanced-color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
}: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleSelection = useCallback(() => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = value.substring(start, end);

      setSelectedText(selected);
      setSelectionStart(start);
      setSelectionEnd(end);
    }
  }, [value]);

  const wrapSelection = useCallback(
    (openTag: string, closeTag = "") => {
      if (!textareaRef.current) return;

      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = value.substring(start, end);

      if (selectedText) {
        const newText =
          value.substring(0, start) +
          openTag +
          selectedText +
          closeTag +
          value.substring(end);
        onChange(newText);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
              start + openTag.length,
              end + openTag.length
            );
          }
        }, 0);
      } else {
        const newText =
          value.substring(0, start) + openTag + closeTag + value.substring(end);
        onChange(newText);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
              start + openTag.length,
              start + openTag.length
            );
          }
        }, 0);
      }
    },
    [value, onChange]
  );

  const applyInlineStyle = useCallback(
    (property: string, propertyValue: string) => {
      if (!selectedText) return;

      const styleTag = `<span style="${property}: ${propertyValue};">`;
      wrapSelection(styleTag, "</span>");
    },
    [selectedText, wrapSelection]
  );

  const handlePasteWithFormatting = useCallback(async () => {
    try {
      const clipboardData = await navigator.clipboard.read();

      for (const item of clipboardData) {
        if (item.types.includes("text/html")) {
          const htmlBlob = await item.getType("text/html");
          const html = await htmlBlob.text();
          const cleanedHTML = cleanPasteHTML(html);
          insertAtCursor(cleanedHTML);
          return;
        }

        if (item.types.includes("text/plain")) {
          const textBlob = await item.getType("text/plain");
          const text = await textBlob.text();
          insertAtCursor(text);
          return;
        }
      }
    } catch (error) {
      console.error("Error pasting with formatting:", error);
      // Fallback to regular paste
      try {
        const text = await navigator.clipboard.readText();
        insertAtCursor(text);
      } catch (fallbackError) {
        console.error("Fallback paste also failed:", fallbackError);
      }
    }
  }, []);

  const cleanPasteHTML = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const allowedTags = [
      "span",
      "strong",
      "em",
      "u",
      "br",
      "b",
      "i",
      "p",
      "br",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "img",
      "a",
    ];
    const allowedStyles = [
      "color",
      "background-color",
      "font-size",
      "font-family",
      "font-weight",
      "font-style",
      "text-decoration",
      "text-align",
      "margin",
      "padding",
      "border",
      "border-radius",
      "line-height",
      "letter-spacing",
      "text-transform",
      "box-shadow",
      "width",
      "height",
    ];

    const cleanElement = (element: Element): string => {
      const tagName = element.tagName.toLowerCase();

      if (!allowedTags.includes(tagName)) {
        return element.textContent || "";
      }

      let result = `<${tagName}`;

      // Preserve allowed inline styles
      const style = element.getAttribute("style");
      if (style) {
        const cleanedStyles = style
          .split(";")
          .filter((styleRule) => {
            const property = styleRule.split(":")[0]?.trim();
            return allowedStyles.includes(property);
          })
          .join(";");

        if (cleanedStyles) {
          result += ` style="${cleanedStyles}"`;
        }
      }

      // Preserve certain attributes
      if (tagName === "img") {
        const src = element.getAttribute("src");
        const alt = element.getAttribute("alt");
        const width = element.getAttribute("width");
        const height = element.getAttribute("height");

        if (src) result += ` src="${src}"`;
        if (alt) result += ` alt="${alt}"`;
        if (width) result += ` width="${width}"`;
        if (height) result += ` height="${height}"`;
      }

      if (tagName === "a") {
        const href = element.getAttribute("href");
        if (href) result += ` href="${href}"`;
      }

      result += ">";

      // Process children
      Array.from(element.children).forEach((child) => {
        result += cleanElement(child);
      });

      // Add text nodes
      const textNodes = Array.from(element.childNodes).filter(
        (node) => node.nodeType === Node.TEXT_NODE
      );
      textNodes.forEach((node) => {
        result += node.textContent;
      });

      result += `</${tagName}>`;
      return result;
    };

    return cleanElement(tempDiv);
  };

  const insertAtCursor = useCallback(
    (text: string) => {
      if (!textareaRef.current) return;

      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newText = value.substring(0, start) + text + value.substring(end);

      onChange(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            start + text.length,
            start + text.length
          );
        }
      }, 0);
    },
    [value, onChange]
  );

  const insertMedia = useCallback(
    (type: "image" | "video" | "audio", url: string) => {
      let mediaTag = "";
      switch (type) {
        case "image":
          mediaTag = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`;
          break;
        case "video":
          mediaTag = `<video src="${url}" controls style="max-width: 100%; height: auto;"></video>`;
          break;
        case "audio":
          mediaTag = `<audio src="${url}" controls></audio>`;
          break;
      }
      insertAtCursor(mediaTag);
    },
    [insertAtCursor]
  );

  const formatText = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange]
  );

  const formatButtons = [
    // { icon: Bold, label: "Bold", action: () => formatText("bold") },
    // Removed invalid Linebreak icon entry
    // { icon: Italic, label: "Italic", action: () => formatText("italic") },
    // { icon: Underline, label: "Underline", action: () => formatText("underline") },
    // { icon: List, label: "Bullet List", action: () => formatText("insertUnorderedList") },
    // { icon: ListOrdered, label: "Numbered List", action: () => formatText("insertOrderedList") },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap p-3 border rounded-lg bg-gray-50">
        {formatButtons.map((button) => {
          const IconComponent = button.icon;
          return (
            <Button
              key={button.label}
              variant="outline"
              size="sm"
              onClick={button.action}
              title={button.label}
            >
              <IconComponent className="w-4 h-4" />
            </Button>
          );
        })}
        <div className="h-4 w-px bg-gray-300 mx-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("<strong>", "</strong>")}
        >
          Bold
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("<i>", "</i>")}
        >
          Italic
        </Button>{" "}
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("<u>", "</u>")}
        >
          <Underline/>
        </Button>{" "}
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("<p>", "</p>")}
        >
          P
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("<h1>", "</h1>")}
        >
          H1
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("<h2>", "</h2>")}
        >
          H2
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection("<br/>")}
        >
          Line Break
        </Button>
        <div className="h-4 w-px bg-gray-300 mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={!selectedText}>
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
                <Label>
                  Selected text: "{selectedText.substring(0, 30)}
                  {selectedText.length > 30 ? "..." : ""}"
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <AdvancedColorPicker
                  label="Text Color"
                  color="#000000"
                  onChange={(color) => applyInlineStyle("color", color)}
                />
                <AdvancedColorPicker
                  label="Background"
                  color="transparent"
                  onChange={(color) =>
                    applyInlineStyle("background-color", color)
                  }
                />
              </div>
              <div>
                <Label>Font Size</Label>
                <Select
                  onValueChange={(size) => applyInlineStyle("font-size", size)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10px">10px</SelectItem>
                    <SelectItem value="12px">12px</SelectItem>
                    <SelectItem value="14px">14px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="18px">18px</SelectItem>
                    <SelectItem value="20px">20px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                    <SelectItem value="48px">48px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font Family</Label>
                <Select
                  onValueChange={(family) =>
                    applyInlineStyle("font-family", family)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Times New Roman, serif">
                      Times New Roman
                    </SelectItem>
                    <SelectItem value="Courier New, monospace">
                      Courier New
                    </SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">
                      Helvetica
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font Weight</Label>
                <Select
                  onValueChange={(weight) =>
                    applyInlineStyle("font-weight", weight)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Lighter</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="700">700</SelectItem>
                    <SelectItem value="900">900</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="h-4 w-px bg-gray-300 mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <ImageIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label>Insert Image</Label>
              <Input
                placeholder="Enter image URL"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      insertMedia("image", url);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Video className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label>Insert Video</Label>
              <Input
                placeholder="Enter video URL"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      insertMedia("video", url);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Music className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label>Insert Audio</Label>
              <Input
                placeholder="Enter audio URL"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = (e.target as HTMLInputElement).value;
                    if (url) {
                      insertMedia("audio", url);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <div className="h-4 w-px bg-gray-300 mx-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handlePasteWithFormatting}
          title="Paste with formatting"
        >
          <Paste className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsHtmlMode(!isHtmlMode)}
        >
          {isHtmlMode ? "Visual" : "HTML"}
        </Button>
        <button
          type="button"
          onClick={() => formatText("strikeThrough")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
        >
          <s>S</s>
        </button>
        <button
          type="button"
          onClick={() => formatText("justifyLeft")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => formatText("justifyCenter")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
        >
          ↔
        </button>
        <button
          type="button"
          onClick={() => formatText("justifyRight")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-200"
        >
          →
        </button>
        <input
          type="color"
          onChange={(e) => formatText("foreColor", e.target.value)}
          className="w-8 h-8 border rounded cursor-pointer"
          title="Text Color"
        />
        <input
          type="color"
          onChange={(e) => formatText("hiliteColor", e.target.value)}
          className="w-8 h-8 border rounded cursor-pointer"
          title="Background Color"
        />
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelection}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        placeholder={placeholder}
        className="min-h-72 resize-y"
        style={{ fontFamily: isHtmlMode ? "monospace" : "inherit" }}
      />

      {!isHtmlMode && value && (
        <div className="p-4 border rounded-lg bg-white">
          <p className="text-sm text-gray-600 mb-2">Live Preview:</p>
          <div dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      )}

      {selectedText && (
        <div className="text-xs text-gray-500">
          Selected: "{selectedText.substring(0, 50)}
          {selectedText.length > 50 ? "..." : ""}" (characters {selectionStart}-
          {selectionEnd})
        </div>
      )}
    </div>
  );
}
