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
  Sigma,
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
import { Popover as HeadlessPopover } from "@headlessui/react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
  height = "250px",
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

  // Helper to convert line breaks to <br> for internal value
  const linebreaksToBr = (text: string) => {
    return text.replace(/\n/g, '<br/>');
  };

  // Helper to convert <br> back to line breaks for textarea
  const brToLinebreaks = (text: string) => {
    // Only match <br/> or <br /> or <br    />
    return text.replace(/<br\s*\/?>/gi, '\n');
  };

  const handleSelection = useCallback(() => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      // Use brToLinebreaks to get the correct selection
      const plainValue = brToLinebreaks(value);
      const selected = plainValue.substring(start, end);

      setSelectedText(selected);
      setSelectionStart(start);
      setSelectionEnd(end);
    }
  }, [value]);

  const wrapSelection = useCallback(
    (openTag: string, closeTag = "") => {
      if (!textareaRef.current) return;

      // Work with plain text (line breaks instead of <br>)
      const plainValue = brToLinebreaks(value);
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = plainValue.substring(start, end);

      let newText;
      if (selectedText) {
        newText =
          plainValue.substring(0, start) +
          openTag +
          selectedText +
          closeTag +
          plainValue.substring(end);
      } else {
        newText =
          plainValue.substring(0, start) + openTag + closeTag + plainValue.substring(end);
      }
      // Convert line breaks to <br> for internal value
      const brText = linebreaksToBr(newText);
      onChange(brText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            start + openTag.length,
            selectedText ? end + openTag.length : start + openTag.length
          );
        }
      }, 0);
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
          let html = await htmlBlob.text();
          
          // Check if the HTML contains an image
          if (html.includes("<img")) {
            // Create a temporary div to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const images = tempDiv.getElementsByTagName('img');
            
            for (let img of Array.from(images)) {
              const src = img.getAttribute('src');
              if (src) {
                // Prompt for dimensions
                const width = prompt('Enter image width (%) - default 100:', '100');
                const height = prompt('Enter image height (%) - default 100:', '100');
                
                // Replace the image tag with our formatted version
                const newImgTag = `<img src="${src}" alt="Image" style="width: ${width || '40'}%; height: ${height || '100'}%;" />`;
                html = html.replace(img.outerHTML, newImgTag);
              }
            }
          }
          
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

      // Work with plain text (line breaks instead of <br>)
      const plainValue = brToLinebreaks(value);
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newText = plainValue.substring(0, start) + text + plainValue.substring(end);

      // Convert line breaks to <br> for internal value
      const brText = linebreaksToBr(newText);
      onChange(brText);

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

  // No need to override Enter, let textarea handle it
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {}, []);

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

  // MathML generator helpers
  const mathTemplates = {
    fraction: (a: string, b: string) => `<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mfrac><mi>${a}</mi><mi>${b}</mi></mfrac></math>`,
    superscript: (base: string, exp: string) => `<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msup><mi>${base}</mi><mn>${exp}</mn></msup></math>`,
    subscript: (base: string, sub: string) => `<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>${base}</mi><mn>${sub}</mn></msub></math>`,
    sqrt: (x: string) => `<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msqrt><mi>${x}</mi></msqrt></math>`,
    minus: () => `<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mo>&#x2212;</mo></math>`,
    plusminus: () => `<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mo>&#xB1;</mo></math>`,
    pythagoras: () => `<math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><mrow><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup><mo>=</mo><msup><mi>c</mi><mn>2</mn></msup></mrow></math>`,
  };
  const [mathType, setMathType] = useState('');
  const [mathArgs, setMathArgs] = useState<Record<string, string>>({});
  const [customMathML, setCustomMathML] = useState('');
  const insertMathML = (ml: string) => {
    insertAtCursor(ml);
    setMathType('');
    setMathArgs({});
    setCustomMathML('');
  };
  // Math font size state
  const [mathFontSize, setMathFontSize] = useState('24px');
  const [customMathFontSize, setCustomMathFontSize] = useState('');
  function renderMathPopover() {
    return (
      <HeadlessPopover className="relative">
        <HeadlessPopover.Button as={Button} variant="outline" size="sm" type="button">
          <Sigma className="w-4 h-4" /> Math
        </HeadlessPopover.Button>
        <HeadlessPopover.Panel className="absolute z-10 mt-2 left-0 bg-white border rounded shadow-lg p-4 w-80">
          <div className="mb-2 font-semibold">Insert Math Expression</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button size="sm" variant={mathType==='fraction'?"default":"outline"} onClick={()=>{setMathType('fraction');setMathArgs({a:'',b:''});}}>a/b</Button>
            <Button size="sm" variant={mathType==='superscript'?"default":"outline"} onClick={()=>{setMathType('superscript');setMathArgs({base:'',exp:''});}}>a<sup>2</sup></Button>
            <Button size="sm" variant={mathType==='subscript'?"default":"outline"} onClick={()=>{setMathType('subscript');setMathArgs({base:'',sub:''});}}>a<sub>2</sub></Button>
            <Button size="sm" variant={mathType==='sqrt'?"default":"outline"} onClick={()=>{setMathType('sqrt');setMathArgs({x:''});}}>√x</Button>
            <Button size="sm" variant={mathType==='minus'?"default":"outline"} onClick={()=>{setMathType('minus');setMathArgs({}); insertMathML(mathTemplates.minus());}}>−</Button>
            <Button size="sm" variant={mathType==='plusminus'?"default":"outline"} onClick={()=>{setMathType('plusminus');setMathArgs({}); insertMathML(mathTemplates.plusminus());}}>±</Button>
            <Button size="sm" variant={mathType==='pythagoras'?"default":"outline"} onClick={()=>{insertMathML(mathTemplates.pythagoras());}}>a²+b²=c²</Button>
            <Button size="sm" variant={mathType==='custom'?"default":"outline"} onClick={()=>{setMathType('custom');}}>Custom MathML</Button>
          </div>
          {/* Math font size selector and custom input */}
          <div className="mb-3">
            <Label>Math Size</Label>
            <div className="flex gap-2 items-center">
              <Select value={mathFontSize} onValueChange={val => { setMathFontSize(val); setCustomMathFontSize(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16px">Small</SelectItem>
                  <SelectItem value="24px">Normal</SelectItem>
                  <SelectItem value="32px">Large</SelectItem>
                  <SelectItem value="48px">Extra Large</SelectItem>
                </SelectContent>
              </Select>
              <span>or</span>
              <Input
                type="number"
                min="8"
                max="200"
                step="1"
                placeholder="Custom px"
                value={customMathFontSize}
                style={{width:'80px'}}
                onChange={e => {
                  setCustomMathFontSize(e.target.value);
                  setMathFontSize(e.target.value ? e.target.value + 'px' : mathFontSize);
                }}
              />
              <span>px</span>
            </div>
          </div>
          {mathType==='fraction' && (
            <form onSubmit={e=>{e.preventDefault();insertMathML(`<span style=\"font-size: ${mathFontSize};\">${mathTemplates.fraction(mathArgs.a||'a',mathArgs.b||'b')}</span>`);}} className="space-y-2">
              <div className="flex gap-2"><Input size={8} placeholder="a" value={mathArgs.a||''} onChange={e=>setMathArgs(v=>({...v,a:e.target.value}))} /><span>/</span><Input size={8} placeholder="b" value={mathArgs.b||''} onChange={e=>setMathArgs(v=>({...v,b:e.target.value}))} /></div>
              <Button type="submit" size="sm" className="w-full">Insert</Button>
            </form>
          )}
          {mathType==='superscript' && (
            <form onSubmit={e=>{e.preventDefault();insertMathML(`<span style=\"font-size: ${mathFontSize};\">${mathTemplates.superscript(mathArgs.base||'a',mathArgs.exp||'2')}</span>`);}} className="space-y-2">
              <div className="flex gap-2"><Input size={8} placeholder="Base (a)" value={mathArgs.base||''} onChange={e=>setMathArgs(v=>({...v,base:e.target.value}))} /><span>^</span><Input size={8} placeholder="Exponent (2)" value={mathArgs.exp||''} onChange={e=>setMathArgs(v=>({...v,exp:e.target.value}))} /></div>
              <Button type="submit" size="sm" className="w-full">Insert</Button>
            </form>
          )}
          {mathType==='subscript' && (
            <form onSubmit={e=>{e.preventDefault();insertMathML(`<span style=\"font-size: ${mathFontSize};\">${mathTemplates.subscript(mathArgs.base||'a',mathArgs.sub||'2')}</span>`);}} className="space-y-2">
              <div className="flex gap-2"><Input size={8} placeholder="Base (a)" value={mathArgs.base||''} onChange={e=>setMathArgs(v=>({...v,base:e.target.value}))} /><span>_</span><Input size={8} placeholder="Subscript (2)" value={mathArgs.sub||''} onChange={e=>setMathArgs(v=>({...v,sub:e.target.value}))} /></div>
              <Button type="submit" size="sm" className="w-full">Insert</Button>
            </form>
          )}
          {mathType==='sqrt' && (
            <form onSubmit={e=>{e.preventDefault();insertMathML(`<span style=\"font-size: ${mathFontSize};\">${mathTemplates.sqrt(mathArgs.x||'x')}</span>`);}} className="space-y-2">
              <div className="flex gap-2"><span>√</span><Input size={8} placeholder="x" value={mathArgs.x||''} onChange={e=>setMathArgs(v=>({...v,x:e.target.value}))} /></div>
              <Button type="submit" size="sm" className="w-full">Insert</Button>
            </form>
          )}
          {mathType==='custom' && (
            <form onSubmit={e=>{e.preventDefault();insertMathML(`<span style=\"font-size: ${mathFontSize};\">${customMathML}</span>`);}} className="space-y-2">
              <Label>Paste or write MathML below:</Label>
              <div>
                <Textarea value={customMathML} onChange={e=>setCustomMathML(e.target.value)} rows={5} placeholder="<math>...</math>" />
              </div>
              <Button type="submit" size="sm" className="w-full">Insert</Button>
            </form>
          )}
        </HeadlessPopover.Panel>
      </HeadlessPopover>
    );
  }

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
        {renderMathPopover()}
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
        {/* Alignment Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection('<div style="text-align:left;">', '</div>')}
        >
          Left
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection('<div style="text-align:center;">', '</div>')}
        >
          Center
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => wrapSelection('<div style="text-align:right;">', '</div>')}
        >
          Right
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
              <div className="space-y-2">
                <Input
                  placeholder="Enter image URL"
                  id="imageUrl"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width (%)</Label>
                    <Input
                      type="number"
                      defaultValue="100"
                      min="1"
                      max="100"
                      id="imageWidth"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height (%)</Label>
                    <Input
                      type="number"
                      defaultValue="100"
                      min="1"
                      max="100"
                      id="imageHeight"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const url = (document.getElementById('imageUrl') as HTMLInputElement)?.value;
                    const width = (document.getElementById('imageWidth') as HTMLInputElement)?.value || '100';
                    const height = (document.getElementById('imageHeight') as HTMLInputElement)?.value || '100';
                    if (url) {
                      const imgTag = `<img src="${url}" alt="Image" style="width: ${width}%; height: ${height}%;" />`;
                      insertAtCursor(imgTag);
                      (document.getElementById('imageUrl') as HTMLInputElement).value = '';
                      (document.getElementById('imageWidth') as HTMLInputElement).value = '100';
                      (document.getElementById('imageHeight') as HTMLInputElement).value = '100';
                    }
                  }}
                  className="w-full"
                >
                  Insert Image
                </Button>
              </div>
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
        {/* Remove justifyLeft/Center/Right buttons here, replaced above with more robust alignment */}
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
        value={brToLinebreaks(value)}
        onChange={(e) => {
          // Convert line breaks to <br> for internal value
          onChange(linebreaksToBr(e.target.value));
        }}
        onSelect={handleSelection}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        onKeyDown={handleKeyDown}
    
        placeholder={placeholder}
        style={{ 
          height,
          fontFamily: isHtmlMode ? "monospace" : "inherit"
        }}
        className="resize-y"
      />

      {!isHtmlMode && value && (
        <div className="p-4 border rounded-lg bg-white">
          <p className="text-sm text-gray-600 mb-2">Live Preview:</p>
          <div
            className="rich-preview"
            dangerouslySetInnerHTML={{ __html: value }}
          />
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
