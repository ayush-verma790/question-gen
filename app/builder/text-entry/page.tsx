"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Plus,
  Eye,
  TextCursorInput,
  Upload,
  FileText,
} from "lucide-react";
import {
  Image,
  Video,
  Music,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Pilcrow,
  Type,
  List,
  ListOrdered,
  Link,
  Palette,
} from "lucide-react";
import { ButtonSuggestions } from "@/components/button-suggestions";
import { PreviewRenderer } from "@/components/preview-renderer";
import { useXMLGeneration } from "@/hooks/use-xml-generation"; // Types
type ContentBlock = {
  id: string;
  type: "text" | "image" | "video" | "audio";
  content: string;
  styles: Record<string, string>;
  attributes?: Record<string, string>;
};

type TextEntryBox = {
  id: string;
  responseId: string;
  expectedLength?: number;
  patternMask?: string;
  widthClass?: string;
};

type TextEntryQuestion = {
  identifier: string;
  title: string;
  promptBlocks: ContentBlock[];
  textEntryBoxes: TextEntryBox[];
  correctAnswers: string[];
  caseSensitive: boolean;
  correctFeedbackBlocks: ContentBlock[];
  incorrectFeedbackBlocks: ContentBlock[];
};

// ContentBlockEditor Component
const ContentBlockEditor = memo(
  ({
    blocks,
    onChange,
    title,
    allowTextBox,
    onInsertTextBox,
  }: {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
    title: string;
    allowTextBox?: boolean;
    onInsertTextBox?: (blockId: string) => void;
  }) => {
    // State for each component instance
    const [selectedText, setSelectedText] = useState("");
    const [selectionRange, setSelectionRange] = useState<{
      start: number;
      end: number;
    } | null>(null);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaType, setMediaType] = useState<"image" | "video" | "audio">(
      "image"
    );
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaAlt, setMediaAlt] = useState("");
    const [activeTextareaIndex, setActiveTextareaIndex] = useState<
      number | null
    >(null);
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    // Image editing state
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [selectedImageTag, setSelectedImageTag] = useState("");
    const [imageEditProps, setImageEditProps] = useState({
      src: "",
      alt: "",
      width: "",
      height: "",
      className: "max-w-full h-auto",
    });

    const updateBlock = (index: number, updatedBlock: ContentBlock) => {
      const newBlocks = [...blocks];
      newBlocks[index] = updatedBlock;
      onChange(newBlocks);
    };

    const addBlock = () => {
      const newIndex = blocks.length;
      onChange([
        ...blocks,
        {
          id: `block_${Date.now()}_${newIndex}`,
          type: "text",
          content: "New content block",
          styles: {},
          attributes: {},
        },
      ]);
    };

    const removeBlock = (index: number) => {
      const newBlocks = [...blocks];
      newBlocks.splice(index, 1);
      onChange(newBlocks);
    };

    // Handle text selection
    const handleTextSelection = (index: number) => {
      if (typeof window === "undefined") return; // Skip during SSR

      const textarea = textareaRefs.current[index];
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Always set the active textarea index when user interacts with it
      setActiveTextareaIndex(index);

      if (start !== end) {
        const selectedText = textarea.value.substring(start, end);
        setSelectedText(selectedText);
        setSelectionRange({ start, end });

        // Check if selected text is an img tag
        const imgTagRegex = /<img[^>]*>/i;
        if (imgTagRegex.test(selectedText)) {
          handleImageSelection(selectedText, index, start, end);
        }
      } else {
        setSelectedText("");
        setSelectionRange(null);
      }
    };

    // Handle image tag selection for editing
    const handleImageSelection = (
      imgTag: string,
      textareaIndex: number,
      start: number,
      end: number
    ) => {
      setSelectedImageTag(imgTag);
      setActiveTextareaIndex(textareaIndex);
      setSelectionRange({ start, end });

      // Parse image attributes
      const srcMatch = imgTag.match(/src="([^"]*)"/);
      const altMatch = imgTag.match(/alt="([^"]*)"/);
      const widthMatch = imgTag.match(/width="([^"]*)"/);
      const heightMatch = imgTag.match(/height="([^"]*)"/);
      const classMatch = imgTag.match(/class="([^"]*)"/);

      setImageEditProps({
        src: srcMatch ? srcMatch[1] : "",
        alt: altMatch ? altMatch[1] : "",
        width: widthMatch ? widthMatch[1] : "",
        height: heightMatch ? heightMatch[1] : "",
        className: classMatch ? classMatch[1] : "max-w-full h-auto",
      });

      setShowImageEditor(true);
    };

    // Handle image property updates
    const handleUpdateImage = () => {
      if (activeTextareaIndex === null || !selectionRange) return;

      const block = blocks[activeTextareaIndex];
      const { src, alt, width, height, className } = imageEditProps;

      let newImageTag = `<img src="${src}" alt="${alt}"`;
      if (className) newImageTag += ` class="${className}"`;
      if (width) newImageTag += ` width="${width}"`;
      if (height) newImageTag += ` height="${height}"`;
      newImageTag += " />";

      const before = block.content.substring(0, selectionRange.start);
      const after = block.content.substring(selectionRange.end);

      updateBlock(activeTextareaIndex, {
        ...block,
        content: before + newImageTag + after,
      });

      setShowImageEditor(false);
      setSelectedImageTag("");
      setSelectionRange(null);
    };

    // Simple function to insert tags at cursor or wrap selection
    const insertHtmlTag = (
      tag: string,
      extraAttrs = "",
      isSelfClosing = false
    ) => {
      // Find which textarea to use
      let textareaIndex = activeTextareaIndex;

      // If no active textarea, try to find the last clicked one
      if (textareaIndex === null) {
        // Use the first textarea as fallback
        textareaIndex = 0;
      }

      if (textareaIndex === null || !textareaRefs.current[textareaIndex]) {
        alert("Please click in a text area first");
        return;
      }

      const textarea = textareaRefs.current[textareaIndex];
      const block = blocks[textareaIndex];

      // Get current cursor position and selection
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const hasSelection = start !== end;

      // Get text parts
      const beforeCursor = block.content.substring(0, start);
      const selectedOrEmpty = hasSelection
        ? block.content.substring(start, end)
        : "";
      const afterCursor = block.content.substring(end);

      // Create the HTML tag to insert
      let htmlToInsert = "";
      let newCursorPosition = start;

      if (isSelfClosing) {
        // For self-closing tags like <br />, <hr />
        htmlToInsert = extraAttrs ? `<${tag} ${extraAttrs} />` : `<${tag} />`;
        newCursorPosition = start + htmlToInsert.length;
      } else if (hasSelection) {
        // If text is selected, wrap it
        htmlToInsert = extraAttrs
          ? `<${tag} ${extraAttrs}>${selectedOrEmpty}</${tag}>`
          : `<${tag}>${selectedOrEmpty}</${tag}>`;
        newCursorPosition = start + htmlToInsert.length;
      } else {
        // If no selection, insert opening and closing tags
        htmlToInsert = extraAttrs
          ? `<${tag} ${extraAttrs}></${tag}>`
          : `<${tag}></${tag}>`;
        // Place cursor between the tags
        const openingTagLength = extraAttrs
          ? `<${tag} ${extraAttrs}>`.length
          : `<${tag}>`.length;
        newCursorPosition = start + openingTagLength;
      }

      // Create new content
      const newContent = beforeCursor + htmlToInsert + afterCursor;

      // Update the block
      updateBlock(textareaIndex, {
        ...block,
        content: newContent,
      });

      // Focus and position cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 50);
    };

    // Insert HTML tag at cursor position
    const insertTag = (tag: string, isSelfClosing = false) => {
      if (activeTextareaIndex === null) return;

      const block = blocks[activeTextareaIndex];
      const textarea = textareaRefs.current[activeTextareaIndex];
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const before = block.content.substring(0, cursorPos);
      const after = block.content.substring(cursorPos);

      const tagToInsert = isSelfClosing ? `<${tag} />` : `<${tag}></${tag}>`;

      updateBlock(activeTextareaIndex, {
        ...block,
        content: before + tagToInsert + after,
      });
    };

    // Handle media insertion
    const handleInsertMedia = () => {
      if (activeTextareaIndex === null) return;

      const block = blocks[activeTextareaIndex];
      const textarea = textareaRefs.current[activeTextareaIndex];
      if (!textarea) return;

      const cursorPos = textarea.selectionStart || 0;
      const before = block.content.substring(0, cursorPos);
      const after = block.content.substring(cursorPos);

      let mediaTag = "";

      switch (mediaType) {
        case "image":
          mediaTag = `<img src="${mediaUrl}" alt="${mediaAlt}" class="max-w-full h-auto" />`;
          break;
        case "video":
          mediaTag = `<video src="${mediaUrl}" controls class="max-w-full"></video>`;
          break;
        case "audio":
          mediaTag = `<audio src="${mediaUrl}" controls></audio>`;
          break;
      }

      updateBlock(activeTextareaIndex, {
        ...block,
        content: before + mediaTag + after,
      });

      // Focus back to textarea and position cursor after inserted content
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = before.length + mediaTag.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);

      setShowMediaModal(false);
      setMediaUrl("");
      setMediaAlt("");
    };

    // Handle button suggestion insertion
    const handleButtonSuggestion = (buttonHTML: string) => {
      if (activeTextareaIndex === null) return;

      const block = blocks[activeTextareaIndex];
      const textarea = textareaRefs.current[activeTextareaIndex];
      if (!textarea) return;

      const cursorPos = textarea.selectionStart || 0;
      const before = block.content.substring(0, cursorPos);
      const after = block.content.substring(cursorPos);

      updateBlock(activeTextareaIndex, {
        ...block,
        content: before + buttonHTML + after,
      });

      // Focus back to textarea and position cursor after inserted content
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = before.length + buttonHTML.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{title}</span>
            <Button variant="outline" size="sm" onClick={addBlock}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="border rounded-lg p-4 relative group"
            >
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlock(index)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {block.type === "text" ? (
                <div className="space-y-2">
                  {allowTextBox && onInsertTextBox && (
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onInsertTextBox(block.id)}
                        className="flex items-center gap-1"
                      >
                        <TextCursorInput className="w-4 h-4" />
                        Add Text Box
                      </Button>
                    </div>
                  )}

                  {/* Enhanced Formatting Toolbar */}
                  <div className="mb-2 space-y-2">
                    {/* Text Formatting */}
                    <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag("strong")}
                        className="p-1 h-8 w-8"
                        title="Bold - Wrap selection or insert tags"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag("em")}
                        className="p-1 h-8 w-8"
                        title="Italic - Wrap selection or insert tags"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag("u")}
                        className="p-1 h-8 w-8"
                        title="Underline - Wrap selection or insert tags"
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          insertHtmlTag("mark", 'class="highlight"')
                        }
                        className="px-2 py-1 text-xs"
                        title="Highlight - Wrap selection or insert tags"
                      >
                        Mark
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          insertHtmlTag("span", 'style="color: red;"')
                        }
                        className="px-2 py-1 text-xs"
                        title="Red Text - Wrap selection or insert tags"
                      >
                        Red
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("h1")}
                      className="p-1 h-8 w-8"
                      title="Heading 1 - Wrap selection or insert tags"
                    >
                      <Heading1 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("h2")}
                      className="p-1 h-8 w-8"
                      title="Heading 2 - Wrap selection or insert tags"
                    >
                      <Heading2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("p")}
                      className="p-1 h-8 w-8"
                      title="Paragraph - Wrap selection or insert tags"
                    >
                      <Pilcrow className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("br", "", true)}
                      className="px-2 py-1 text-xs"
                      title="Line Break - Insert at cursor"
                    >
                      BR
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("hr", "", true)}
                      className="px-2 py-1 text-xs"
                      title="Horizontal Rule - Insert at cursor"
                    >
                      HR
                    </Button>

                    {/* Lists and Links */}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("ul")}
                      className="p-1 h-8 w-8"
                      title="Unordered List - Wrap selection or insert tags"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("ol")}
                      className="p-1 h-8 w-8"
                      title="Ordered List - Wrap selection or insert tags"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("li")}
                      className="px-2 py-1 text-xs"
                      title="List Item - Wrap selection or insert tags"
                    >
                      LI
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertHtmlTag("a", 'href="#"')}
                      className="p-1 h-8 w-8"
                      title="Link - Wrap selection or insert tags"
                    >
                      <Link className="w-4 h-4" />
                    </Button>

                    {/* Media Insert */}
                    <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                      <span className="text-xs text-gray-600 mr-2">Media:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTextareaIndex(index);
                          setMediaType("image");
                          setShowMediaModal(true);
                        }}
                        className="px-2 py-1 text-xs flex items-center gap-1"
                      >
                        <Image className="w-4 h-4" /> Image
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTextareaIndex(index);
                          setMediaType("video");
                          setShowMediaModal(true);
                        }}
                        className="px-2 py-1 text-xs flex items-center gap-1"
                      >
                        <Video className="w-4 h-4" /> Video
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTextareaIndex(index);
                          setMediaType("audio");
                          setShowMediaModal(true);
                        }}
                        className="px-2 py-1 text-xs flex items-center gap-1"
                      >
                        <Music className="w-4 h-4" /> Audio
                      </Button>
                    </div>
                  </div>

                  {/* Media Modal */}
                  {showMediaModal && (
                    <div className="absolute top-0 left-0 right-0 bg-white border rounded-lg shadow-lg p-4 z-50">
                      <h3 className="font-medium mb-2">Insert {mediaType}</h3>
                      <input
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder={`Enter ${mediaType} URL`}
                        className="w-full p-2 border rounded mb-2"
                      />
                      {mediaType === "image" && (
                        <input
                          type="text"
                          value={mediaAlt}
                          onChange={(e) => setMediaAlt(e.target.value)}
                          placeholder="Alt text (optional)"
                          className="w-full p-2 border rounded mb-2"
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMediaModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleInsertMedia}
                          disabled={!mediaUrl}
                        >
                          Insert
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Image Editor Modal */}
                  {showImageEditor && (
                    <div className="absolute top-0 left-0 right-0 bg-white border rounded-lg shadow-lg p-4 z-50">
                      <h3 className="font-medium mb-2">
                        Edit Image Properties
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Image URL
                          </label>
                          <input
                            type="text"
                            value={imageEditProps.src}
                            onChange={(e) =>
                              setImageEditProps((prev) => ({
                                ...prev,
                                src: e.target.value,
                              }))
                            }
                            placeholder="Image URL"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Alt Text
                          </label>
                          <input
                            type="text"
                            value={imageEditProps.alt}
                            onChange={(e) =>
                              setImageEditProps((prev) => ({
                                ...prev,
                                alt: e.target.value,
                              }))
                            }
                            placeholder="Alt text"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Width
                            </label>
                            <input
                              type="text"
                              value={imageEditProps.width}
                              onChange={(e) =>
                                setImageEditProps((prev) => ({
                                  ...prev,
                                  width: e.target.value,
                                }))
                              }
                              placeholder="e.g., 300px or 50%"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Height
                            </label>
                            <input
                              type="text"
                              value={imageEditProps.height}
                              onChange={(e) =>
                                setImageEditProps((prev) => ({
                                  ...prev,
                                  height: e.target.value,
                                }))
                              }
                              placeholder="e.g., 200px or auto"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            CSS Classes
                          </label>
                          <input
                            type="text"
                            value={imageEditProps.className}
                            onChange={(e) =>
                              setImageEditProps((prev) => ({
                                ...prev,
                                className: e.target.value,
                              }))
                            }
                            placeholder="CSS classes"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowImageEditor(false)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdateImage}>
                          Update Image
                        </Button>
                      </div>
                    </div>
                  )}

                  <textarea
                    ref={(el) => {
                      textareaRefs.current[index] = el;
                    }}
                    value={block.content.replace(/<br\s*\/?>/gi, "\n")}
                    placeholder="Enter text content here [1]"
                    onChange={(e) =>
                      updateBlock(index, {
                        ...block,
                        content: e.target.value.replace(/\n/g, "<br/>"),
                      })
                    }
                    onSelect={() => handleTextSelection(index)}
                    onFocus={() => setActiveTextareaIndex(index)}
                    onClick={() => setActiveTextareaIndex(index)}
                    className="w-full min-h-[100px] border p-2 rounded bg-white"
                  />

                  {/* Button Suggestions Section */}
                  <div className="mt-4">
                    <ButtonSuggestions
                      onSuggestionClick={handleButtonSuggestion}
                      className=""
                      size="md"
                      defaultCollapsed={true}
                    />
                  </div>

                  <div className="text-xs text-gray-500 mt-3 bg-gray-50 px-3 py-2 rounded-lg border-l-4 border-gray-300">
                    <strong>💡 Pro Tips:</strong> Use HTML tags like &lt;br&gt;,
                    &lt;strong&gt;, &lt;p&gt;, etc. • Select text and click
                    formatting buttons to wrap it • Click buttons without
                    selection to insert empty tags at cursor • Use button
                    suggestions above for quick interactive elements •
                    <strong>
                      {" "}
                      Select an &lt;img&gt; tag to edit its properties
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Content URL</Label>
                      <Input
                        value={block.content.replace(/<br\s*\/?>/gi, " ")}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            content: e.target.value.replace(/ +/g, "<br/>"),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select
                        value={block.type}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            type: e.target.value as any,
                          })
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Width</Label>
                      <Input
                        value={block.attributes?.width || ""}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            attributes: {
                              ...block.attributes,
                              width: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., 300"
                      />
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        value={block.attributes?.height || ""}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            attributes: {
                              ...block.attributes,
                              height: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., 200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
);

ContentBlockEditor.displayName = "ContentBlockEditor";

// QuestionPreview Component
const QuestionPreview = memo(
  ({
    promptBlocks,
    textEntryBoxes,
    correctAnswers,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    onAnswerChange,
  }: {
    promptBlocks: ContentBlock[];
    textEntryBoxes: TextEntryBox[];
    correctAnswers: string[];
    correctFeedbackBlocks: ContentBlock[];
    incorrectFeedbackBlocks: ContentBlock[];
    onAnswerChange: (index: number, value: string) => void;
  }) => {
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleAnswerChange = (index: number, value: string) => {
      const newAnswers = [...userAnswers];
      newAnswers[index] = value;
      setUserAnswers(newAnswers);
      onAnswerChange(index, value);
    };

    const checkAnswers = () => {
      const allCorrect = textEntryBoxes.every((_, index) => {
        const userAnswer = userAnswers[index] || "";
        const correctAnswer = correctAnswers[index] || "";
        return (
          userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        );
      });
      setIsCorrect(allCorrect);
      setShowFeedback(true);
    };

    const resetAnswers = () => {
      setUserAnswers([]);
      setShowFeedback(false);
      textEntryBoxes.forEach((_, index) => onAnswerChange(index, ""));
    };
    const renderedBlocks = useMemo(() => {
      return promptBlocks.map((block) => {
        const style: React.CSSProperties = {
          fontSize: block.styles.fontSize,
          fontFamily: block.styles.fontFamily,
          color: block.styles.color,
          backgroundColor: block.styles.backgroundColor,
          padding: block.styles.padding,
          margin: block.styles.margin,
          borderRadius: block.styles.borderRadius,
          border: block.styles.border,
          textAlign: block.styles.textAlign as React.CSSProperties["textAlign"],
        };

        if (block.type === "text") {
          const elements: (string | React.ReactNode)[] = [];
          let lastIndex = 0;
          const regex = /\[(\d+)\]/g;
          let match;
          let htmlContent = block.content;

          while ((match = regex.exec(htmlContent)) !== null) {
            const idx = parseInt(match[1], 10) - 1;
            const box = textEntryBoxes[idx];
            const widthClass = box?.widthClass || "qti-input-width-5";
            const value = userAnswers[idx] || "";

            const preceding = htmlContent.slice(lastIndex, match.index);
            if (preceding) {
              elements.push(
                <span
                  key={lastIndex}
                  dangerouslySetInnerHTML={{ __html: preceding }}
                />
              );
            }

            elements.push(
              <input
                key={"input-" + idx}
                type="text"
                className={`${widthClass} border-b-2 border-gray-400 bg-white px-1 mx-1 focus:border-blue-500 outline-none`}
                style={{
                  display: "inline-block",
                  height: 24,
                  verticalAlign: "middle",
                }}
                value={value}
                onChange={(e) => handleAnswerChange(idx, e.target.value)}
                placeholder={`Answer ${idx + 1}`}
              />
            );
            lastIndex = match.index + match[0].length;
          }

          const trailing = htmlContent.slice(lastIndex);
          if (trailing) {
            elements.push(
              <span
                key={lastIndex}
                dangerouslySetInnerHTML={{ __html: trailing }}
              />
            );
          }

          return (
            <div key={block.id} style={style} className="whitespace-pre-wrap">
              {elements}
            </div>
          );
        } else if (block.type === "image") {
          return (
            <img
              key={block.id}
              src={block.content || "/placeholder.svg"}
              alt={block.attributes?.alt || "Image"}
              style={style}
              width={block.attributes?.width}
              height={block.attributes?.height}
            />
          );
        } else if (block.type === "video") {
          return (
            <video
              key={block.id}
              src={block.content}
              style={style}
              width={block.attributes?.width}
              height={block.attributes?.height}
              controls={
                block.attributes?.controls === undefined
                  ? true
                  : String(block.attributes?.controls) === "true"
              }
              autoPlay={String(block.attributes?.autoplay) === "true"}
              loop={String(block.attributes?.loop) === "true"}
            />
          );
        } else if (block.type === "audio") {
          return (
            <audio
              key={block.id}
              src={block.content}
              style={style}
              controls={
                block.attributes?.controls === undefined
                  ? true
                  : String(block.attributes?.controls) === "true"
              }
              autoPlay={String(block.attributes?.autoplay) === "true"}
              loop={String(block.attributes?.loop) === "true"}
            />
          );
        }
        return null;
      });
    }, [promptBlocks, textEntryBoxes, userAnswers, handleAnswerChange]);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Interactive Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {promptBlocks.length > 0 ? (
            <div className="space-y-4">
              {renderedBlocks}

              {/* Interactive Controls */}
              {textEntryBoxes.length > 0 && (
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button
                    onClick={checkAnswers}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Check Answers
                  </Button>
                  <Button variant="outline" onClick={resetAnswers}>
                    Reset
                  </Button>
                </div>
              )}

              {/* Feedback Display */}
              {showFeedback && (
                <div
                  className={`mt-4 p-4 rounded-lg border ${
                    isCorrect
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <h3 className="font-medium mb-2">
                    {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                  </h3>
                  <div>
                    {isCorrect
                      ? correctFeedbackBlocks.map((block) => (
                          <div
                            key={block.id}
                            dangerouslySetInnerHTML={{
                              __html: block.content.replace(
                                /<br\s*\/?>/gi,
                                "<br/>"
                              ),
                            }}
                          />
                        ))
                      : incorrectFeedbackBlocks.map((block) => (
                          <div
                            key={block.id}
                            dangerouslySetInnerHTML={{
                              __html: block.content.replace(
                                /<br\s*\/?>/gi,
                                "<br/>"
                              ),
                            }}
                          />
                        ))}
                  </div>
                </div>
              )}

              {/* Configuration Summary */}
              {textEntryBoxes.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <h3 className="font-medium mb-3">
                    📋 Configuration Summary:
                  </h3>
                  <div className="grid gap-3">
                    {textEntryBoxes.map((box, index) => (
                      <div
                        key={box.id}
                        className="text-sm bg-white p-3 rounded border"
                      >
                        <div className="font-medium text-blue-700">
                          Text Box {index + 1}:
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-gray-600">
                          <div>Length: {box.expectedLength || "Not set"}</div>
                          <div>Pattern: {box.patternMask || "None"}</div>
                          <div>Width: {box.widthClass || "Default"}</div>
                          <div className="col-span-2">
                            Correct Answer:
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-2 text-green-700">
                              {correctAnswers[index] || "[not set]"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Add content to see preview</p>
          )}
        </CardContent>
      </Card>
    );
  }
);

QuestionPreview.displayName = "QuestionPreview";

// TextBoxConfiguration Component
const TextBoxConfiguration = memo(
  ({
    textEntryBoxes,
    correctAnswers,
    onUpdateBox,
    onRemoveBox,
    onUpdateAnswer,
  }: {
    textEntryBoxes: TextEntryBox[];
    correctAnswers: string[];
    onUpdateBox: (box: TextEntryBox) => void;
    onRemoveBox: (boxId: string) => void;
    onUpdateAnswer: (index: number, value: string) => void;
  }) => {
    const widthOptions = Array.from({ length: 20 }, (_, i) => i + 1);

    if (textEntryBoxes.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Text Box Configuration</CardTitle>
          <p className="text-sm text-gray-600">
            {textEntryBoxes.length} text box
            {textEntryBoxes.length !== 1 ? "es" : ""} in question
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {textEntryBoxes.map((box, index) => (
            <div key={box.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Text Box {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveBox(box.id)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expected Length</Label>
                  <Input
                    type="number"
                    min="1"
                    value={box.expectedLength || ""}
                    onChange={(e) =>
                      onUpdateBox({
                        ...box,
                        expectedLength: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Pattern Mask</Label>
                  <Input
                    value={box.patternMask || ""}
                    onChange={(e) =>
                      onUpdateBox({
                        ...box,
                        patternMask: e.target.value,
                      })
                    }
                    placeholder="e.g., [A-Za-z]+"
                  />
                </div>
              </div>

              <div>
                <Label>Width Class</Label>
                <select
                  value={box.widthClass || "qti-input-width-5"}
                  onChange={(e) =>
                    onUpdateBox({
                      ...box,
                      widthClass: e.target.value,
                    })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {widthOptions.map((width) => (
                    <option key={width} value={`qti-input-width-${width}`}>
                      Width {width} ({(width * 0.5).toFixed(1)}rem)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Correct Answer</Label>
                <Input
                  value={correctAnswers[index] || ""}
                  onChange={(e) => onUpdateAnswer(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
);

TextBoxConfiguration.displayName = "TextBoxConfiguration";

// XML Generation Utilities
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function renderContentBlockToXML(block: ContentBlock): string {
  switch (block.type) {
    case "text":
      return block.content;
    case "image":
      return `<img src="${block.content}" ${
        block.attributes?.width ? `width="${block.attributes.width}"` : ""
      } ${
        block.attributes?.height ? `height="${block.attributes.height}"` : ""
      } alt="${block.attributes?.alt || ""}"/>`;
    case "video":
      return `<video src="${block.content}" ${
        block.attributes?.width ? `width="${block.attributes.width}"` : ""
      } ${
        block.attributes?.height ? `height="${block.attributes.height}"` : ""
      } ${block.attributes?.controls ? "controls" : ""} ${
        block.attributes?.autoplay ? "autoplay" : ""
      } ${block.attributes?.loop ? "loop" : ""}/>`;
    case "audio":
      return `<audio src="${block.content}" ${
        block.attributes?.controls ? "controls" : ""
      } ${block.attributes?.autoplay ? "autoplay" : ""} ${
        block.attributes?.loop ? "loop" : ""
      }/>`;
    default:
      return "";
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateTextEntryXML(question: TextEntryQuestion): string {
  const {
    identifier,
    title,
    promptBlocks,
    textEntryBoxes,
    correctAnswers,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
  } = question;

  const responseDeclarations = textEntryBoxes
    .map(
      (box, index) => `      <qti-response-declaration identifier="${
        box.responseId
      }" cardinality="single" base-type="string">
        <qti-correct-response>
          <qti-value>${escapeXml(correctAnswers[index] || "")}</qti-value>
        </qti-correct-response>
      </qti-response-declaration>`
    )
    .join("\n");

  let promptContent = "";
  promptBlocks.forEach((block) => {
    if (block.type === "text") {
      let content = block.content;
      textEntryBoxes.forEach((box, index) => {
        const placeholder = `[${index + 1}]`;
        const widthClass = box.widthClass ? ` class="${box.widthClass}"` : "";
        const interaction = `<qti-text-entry-interaction response-identifier="${
          box.responseId
        }"${widthClass}${
          box.expectedLength ? ` expected-length="${box.expectedLength}"` : ""
        }${box.patternMask ? ` pattern-mask="${box.patternMask}"` : ""} />`;
        content = content.replace(
          new RegExp(escapeRegExp(placeholder), "g"),
          interaction
        );
      });
      promptContent += content;
    } else {
      promptContent += renderContentBlockToXML(block);
    }
  });

  const correctFeedbackContent = correctFeedbackBlocks
    .map((block) => (block.type === "text" ? block.content : ""))
    .join("\n");

  const incorrectFeedbackContent = incorrectFeedbackBlocks
    .map((block) => (block.type === "text" ? block.content : ""))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  adaptive="false"
  time-dependent="false">

  <!-- Response declarations -->
${responseDeclarations}

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-item-body>
${promptContent}

    <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <qti-content-body>
${correctFeedbackContent}
      </qti-content-body>
    </qti-modal-feedback>

    <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
      <qti-content-body>
${incorrectFeedbackContent}
      </qti-content-body>
    </qti-modal-feedback>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;
}

// XML Parsing Function
function parseTextEntryXML(xmlString: string): TextEntryQuestion {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Invalid XML format");
    }

    // Get assessment item attributes
    const assessmentItem = xmlDoc.querySelector("qti-assessment-item");
    if (!assessmentItem) {
      throw new Error("No qti-assessment-item found");
    }

    const identifier =
      assessmentItem.getAttribute("identifier") || `text-entry-${Date.now()}`;
    const title =
      assessmentItem.getAttribute("title") || "Imported Text Entry Question";

    // Parse response declarations
    const responseDeclarations = xmlDoc.querySelectorAll(
      "qti-response-declaration"
    );
    const correctAnswers: string[] = [];
    const textEntryBoxes: TextEntryBox[] = [];

    responseDeclarations.forEach((decl, index) => {
      const responseId =
        decl.getAttribute("identifier") || `RESPONSE${index + 1}`;
      const correctValue = decl.querySelector("qti-correct-response qti-value");

      correctAnswers.push(correctValue?.textContent || "");
      textEntryBoxes.push({
        id: `box${index + 1}`,
        responseId: responseId,
        expectedLength: undefined,
        patternMask: undefined,
        widthClass: "qti-input-width-5",
      });
    });

    // Parse item body content
    const itemBody = xmlDoc.querySelector("qti-item-body");
    let promptContent = "";
    let textEntryIndex = 0;

    if (itemBody) {
      // Get all child nodes and process them
      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || "";
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          if (element.tagName === "qti-text-entry-interaction") {
            textEntryIndex++;
            const responseId = element.getAttribute("response-identifier");
            const expectedLength = element.getAttribute("expected-length");
            const patternMask = element.getAttribute("pattern-mask");
            const className = element.getAttribute("class");

            // Update corresponding text entry box
            const boxIndex = textEntryBoxes.findIndex(
              (box) => box.responseId === responseId
            );
            if (boxIndex >= 0) {
              textEntryBoxes[boxIndex] = {
                ...textEntryBoxes[boxIndex],
                expectedLength: expectedLength
                  ? parseInt(expectedLength)
                  : undefined,
                patternMask: patternMask || undefined,
                widthClass: className || "qti-input-width-5",
              };
            }

            return `[${textEntryIndex}]`;
          } else if (element.tagName === "qti-modal-feedback") {
            // Skip feedback elements as they're processed separately
            return "";
          } else if (element.tagName === "qti-content-body") {
            // Process content body children
            return Array.from(element.childNodes).map(processNode).join("");
          } else {
            // For other elements, recreate the HTML
            const attributes = Array.from(element.attributes)
              .map((attr) => `${attr.name}="${attr.value}"`)
              .join(" ");
            const innerHTML = Array.from(element.childNodes)
              .map(processNode)
              .join("");
            return `<${element.tagName}${
              attributes ? " " + attributes : ""
            }>${innerHTML}</${element.tagName}>`;
          }
        }
        return "";
      };

      // Process all child nodes of item-body, excluding feedback
      const childNodes = Array.from(itemBody.childNodes).filter((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          return element.tagName !== "qti-modal-feedback";
        }
        return true;
      });

      promptContent = childNodes.map(processNode).join("");
    }

    // Parse feedback blocks
    const correctFeedback = xmlDoc.querySelector(
      'qti-modal-feedback[identifier="CORRECT"]'
    );
    const incorrectFeedback = xmlDoc.querySelector(
      'qti-modal-feedback[identifier="INCORRECT"]'
    );

    const correctFeedbackBlocks: ContentBlock[] = [];
    const incorrectFeedbackBlocks: ContentBlock[] = [];

    if (correctFeedback) {
      const feedbackContent =
        correctFeedback.querySelector("qti-content-body")?.innerHTML ||
        correctFeedback.textContent ||
        "";
      correctFeedbackBlocks.push({
        id: "correct_feedback_block",
        type: "text",
        content: feedbackContent,
        styles: {
          fontSize: "16px",
          color: "#27ae60",
          backgroundColor: "#d5f5e6",
          padding: "16px",
          borderRadius: "8px",
          textAlign: "center",
        },
        attributes: {},
      });
    }

    if (incorrectFeedback) {
      const feedbackContent =
        incorrectFeedback.querySelector("qti-content-body")?.innerHTML ||
        incorrectFeedback.textContent ||
        "";
      incorrectFeedbackBlocks.push({
        id: "incorrect_feedback_block",
        type: "text",
        content: feedbackContent,
        styles: {
          fontSize: "16px",
          color: "#e74c3c",
          backgroundColor: "#fdf2f2",
          padding: "16px",
          borderRadius: "8px",
          textAlign: "center",
        },
        attributes: {},
      });
    }

    // Create prompt blocks
    const promptBlocks: ContentBlock[] = [
      {
        id: "prompt_block_1",
        type: "text",
        content: promptContent,
        styles: {
          fontSize: "18px",
          fontFamily: "Arial, sans-serif",
          color: "#2c3e50",
          backgroundColor: "#f8f9fa",
          padding: "16px",
          margin: "8px",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
          textAlign: "left",
        },
        attributes: {},
      },
    ];

    return {
      identifier,
      title,
      promptBlocks,
      textEntryBoxes,
      correctAnswers,
      caseSensitive: false,
      correctFeedbackBlocks,
      incorrectFeedbackBlocks,
    };
  } catch (error) {
    console.error("Error parsing XML:", error);
    throw new Error(
      `Failed to parse XML: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Main Component
export default function TextEntryBuilderPage() {
  // ...existing state and logic...
  const [xmlInput, setXmlInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [showXmlImport, setShowXmlImport] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "question" | "feedbacks" | "textentry" | "preview"
  >("question");

  // XML Generation Hook
  const { xmlContent, isGenerating, generateXML, clearXML } =
    useXMLGeneration();

  const [question, setQuestion] = useState<TextEntryQuestion>({
    identifier: "text-entry-question-1",
    title: "Sample Text Entry Question",
    promptBlocks: [
      {
        id: "prompt_block_1",
        type: "text",
        content: "",
        styles: {
          fontSize: "18px",
          fontFamily: "Arial, sans-serif",
          color: "#2c3e50",
          backgroundColor: "#f8f9fa",
          padding: "16px",
          margin: "8px",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
          textAlign: "left",
        },
        attributes: {},
      },
    ],
    textEntryBoxes: [],
    correctAnswers: ["", ""],
    caseSensitive: false,
    correctFeedbackBlocks: [
      {
        id: "correct_feedback_block",
        type: "text",
        content: "",
        styles: {
          fontSize: "16px",
          color: "#27ae60",
          backgroundColor: "#d5f5e6",
          padding: "16px",
          borderRadius: "8px",
          textAlign: "center",
        },
        attributes: {},
      },
    ],
    incorrectFeedbackBlocks: [
      {
        id: "incorrect_feedback_block",
        type: "text",
        content: "",
        styles: {
          fontSize: "16px",
          color: "#e74c3c",
          backgroundColor: "#fdf2f2",
          padding: "16px",
          borderRadius: "8px",
          textAlign: "center",
        },
        attributes: {},
      },
    ],
  });
  const [generatedXML, setGeneratedXML] = useState("");
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // ...existing handlers (handleParseXML, handleClearXMLInput, insertTextEntryBox, updateBoxConfig, removeBox, updateAnswer, etc.)...
  // (No changes to logic, just move them above)

  const handleParseXML = useCallback(() => {
    try {
      const parsedQuestion = parseTextEntryXML(xmlInput);
      setQuestion(parsedQuestion);
      setParseError("");
      setShowXmlImport(false);
      setXmlInput("");
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Unknown parsing error"
      );
    }
  }, [xmlInput]);

  const handleClearXMLInput = useCallback(() => {
    setXmlInput("");
    setParseError("");
  }, []);

  const insertTextEntryBox = useCallback(
    (blockId: string) => {
      setQuestion((prev) => {
        const newIndex = prev.textEntryBoxes.length;
        const newId = `RESPONSE${newIndex + 1}`;
        const boxId = `box${newIndex + 1}`;
        const placeholder = `[${newIndex + 1}]`;
        const defaultWidthClass = `qti-input-width-5`;

        return {
          ...prev,
          promptBlocks: prev.promptBlocks.map((block) => {
            if (block.id !== blockId) return block;

            let newContent = block.content;
            if (cursorPosition !== null) {
              newContent =
                block.content.slice(0, cursorPosition) +
                placeholder +
                block.content.slice(cursorPosition);
            } else {
              newContent += placeholder;
            }

            return { ...block, content: newContent };
          }),
          textEntryBoxes: [
            ...prev.textEntryBoxes,
            {
              id: boxId,
              responseId: newId,
              expectedLength: 4,
              widthClass: defaultWidthClass,
            },
          ],
          correctAnswers: [...prev.correctAnswers, ""],
        };
      });
    },
    [cursorPosition]
  );

  const updateBoxConfig = useCallback((updatedBox: TextEntryBox) => {
    setQuestion((prev) => ({
      ...prev,
      textEntryBoxes: prev.textEntryBoxes.map((box) =>
        box.id === updatedBox.id ? updatedBox : box
      ),
    }));
  }, []);

  const removeBox = useCallback((boxId: string) => {
    setQuestion((prev) => {
      const boxIndex = prev.textEntryBoxes.findIndex((b) => b.id === boxId);
      const placeholderRegex = new RegExp(`\\[${boxIndex + 1}\\]`, "g");

      return {
        ...prev,
        promptBlocks: prev.promptBlocks.map((block) => ({
          ...block,
          content: block.content.replace(placeholderRegex, ""),
        })),
        textEntryBoxes: prev.textEntryBoxes.filter((b) => b.id !== boxId),
        correctAnswers: prev.correctAnswers.filter((_, i) => i !== boxIndex),
      };
    });
  }, []);

  const updateAnswer = useCallback((index: number, value: string) => {
    setQuestion((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers.map((answer, i) =>
        i === index ? value : answer
      ),
    }));
  }, []);

  const xml = useMemo(() => {
    if (question.identifier && question.promptBlocks.length > 0) {
      return generateTextEntryXML(question);
    }
    return "";
  }, [question]);

  useEffect(() => {
    setGeneratedXML(xml);
  }, [xml]);

  // Auto-generate XML for preview when question changes
  const handleGenerateXMLForPreview = useCallback(async () => {
    if (!xml) return;

    try {
      await generateXML({
        type: "text-entry",
        data: question,
      });
    } catch (error) {
      console.error("Failed to generate XML for preview:", error);
    }
  }, [xml, question, generateXML]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${Array.from({ length: 100 }, (_, i) => i + 1)
        .map(
          (width) => `
        .qti-input-width-${width} {
          width: ${width * 0.5}rem !important;
          min-width: ${width * 0.5}rem !important;
        }
      `
        )
        .join("\n")}
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // --- UI with left-side vertical tabs ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 flex">
        {/* Left vertical nav */}
        <div className="w-56 flex-shrink-0 pr-6">
          <div className="flex flex-col gap-2">
            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeTab === "question"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("question")}
            >
              Question
            </button>
            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeTab === "textentry"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("textentry")}
            >
              Text Entry
            </button>
            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeTab === "feedbacks"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("feedbacks")}
            >
              Feedbacks
            </button>

            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("preview");
                // Auto-generate XML when preview tab is accessed
                if (xml && !xmlContent) {
                  handleGenerateXMLForPreview();
                }
              }}
            >
              Preview
            </button>
          </div>
        </div>
        {/* Right content area */}
        <div className="flex-1">
          {/* XML Import Section always on top */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Import from XML
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setShowXmlImport(!showXmlImport)}
                  >
                    {showXmlImport ? "Hide Import" : "Show Import"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showXmlImport && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="xml-input">Paste QTI Text Entry XML</Label>
                    <Textarea
                      id="xml-input"
                      value={xmlInput}
                      onChange={(e) => setXmlInput(e.target.value)}
                      placeholder="Paste your QTI XML here..."
                      className="min-h-32 font-mono text-sm"
                    />
                  </div>
                  {parseError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-700">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Parse Error:</span>
                      </div>
                      <p className="text-red-600 text-sm mt-1">{parseError}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleParseXML}
                      disabled={!xmlInput.trim()}
                    >
                      Parse & Load XML
                    </Button>
                    <Button variant="outline" onClick={handleClearXMLInput}>
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuestion({
                          identifier: "text-entry-demo",
                          title: "Math Problem - Fill in the Blanks",
                          promptBlocks: [
                            {
                              id: "prompt_block_1",
                              type: "text",
                              content:
                                "Complete this math equation:<br/><strong>[1] + [2] = 10</strong><br/>What two numbers add up to 10?",
                              styles: {
                                fontSize: "18px",
                                fontFamily: "Arial, sans-serif",
                                color: "#2c3e50",
                                backgroundColor: "#f8f9fa",
                                padding: "16px",
                                margin: "8px",
                                borderRadius: "8px",
                                border: "1px solid #e9ecef",
                                textAlign: "left",
                              },
                              attributes: {},
                            },
                          ],
                          textEntryBoxes: [
                            {
                              id: "box1",
                              responseId: "RESPONSE1",
                              expectedLength: 2,
                              widthClass: "qti-input-width-3",
                            },
                            {
                              id: "box2",
                              responseId: "RESPONSE2",
                              expectedLength: 2,
                              widthClass: "qti-input-width-3",
                            },
                          ],
                          correctAnswers: ["3", "7"],
                          caseSensitive: false,
                          correctFeedbackBlocks: [
                            {
                              id: "correct_feedback_block",
                              type: "text",
                              content:
                                "Excellent! You got it right. 3 + 7 = 10",
                              styles: {
                                fontSize: "16px",
                                color: "#27ae60",
                                backgroundColor: "#d5f5e6",
                                padding: "16px",
                                borderRadius: "8px",
                                textAlign: "center",
                              },
                              attributes: {},
                            },
                          ],
                          incorrectFeedbackBlocks: [
                            {
                              id: "incorrect_feedback_block",
                              type: "text",
                              content:
                                "Not quite right. Try again! Remember, the two numbers should add up to 10.",
                              styles: {
                                fontSize: "16px",
                                color: "#e74c3c",
                                backgroundColor: "#fdf2f2",
                                padding: "16px",
                                borderRadius: "8px",
                                textAlign: "center",
                              },
                              attributes: {},
                            },
                          ],
                        });
                      }}
                    >
                      Load Sample
                    </Button>
                    <div className="text-sm text-gray-500 flex items-center ml-auto">
                      💡 This will replace your current question with the
                      imported one
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Main content by tab */}
          {activeTab === "question" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Question Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="identifier">Question ID</Label>
                    <Input
                      id="identifier"
                      value={question.identifier}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          identifier: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={question.title}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="case-sensitive"
                      checked={question.caseSensitive}
                      onCheckedChange={(checked) =>
                        setQuestion((prev) => ({
                          ...prev,
                          caseSensitive: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="case-sensitive">Case sensitive</Label>
                  </div>
                </CardContent>
              </Card>
              {/* Question Prompt and Preview */}
              <ContentBlockEditor
                blocks={question.promptBlocks}
                onChange={(blocks) =>
                  setQuestion((prev) => ({ ...prev, promptBlocks: blocks }))
                }
                title="Question Prompt"
                allowTextBox={true}
                onInsertTextBox={insertTextEntryBox}
              />
              <QuestionPreview
                promptBlocks={question.promptBlocks}
                textEntryBoxes={question.textEntryBoxes}
                correctAnswers={question.correctAnswers}
                correctFeedbackBlocks={question.correctFeedbackBlocks}
                incorrectFeedbackBlocks={question.incorrectFeedbackBlocks}
                onAnswerChange={updateAnswer}
              />
            </div>
          )}
          {activeTab === "feedbacks" && (
            <div className="space-y-6">
              <ContentBlockEditor
                blocks={question.correctFeedbackBlocks}
                onChange={(blocks) =>
                  setQuestion((prev) => ({
                    ...prev,
                    correctFeedbackBlocks: blocks,
                  }))
                }
                title="Correct Feedback"
              />
              {/* Preview for Correct Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Eye className="w-4 h-4" /> Correct Feedback Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {question.correctFeedbackBlocks.length > 0 &&
                  question.correctFeedbackBlocks[0].content ? (
                    question.correctFeedbackBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="mb-2 p-2 bg-green-50 rounded border border-green-100"
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: block.content.replace(
                              /<br\s*\/?>/gi,
                              "<br/>"
                            ),
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">
                      No correct feedback content.
                    </span>
                  )}
                </CardContent>
              </Card>
              <ContentBlockEditor
                blocks={question.incorrectFeedbackBlocks}
                onChange={(blocks) =>
                  setQuestion((prev) => ({
                    ...prev,
                    incorrectFeedbackBlocks: blocks,
                  }))
                }
                title="Incorrect Feedback"
              />
              {/* Preview for Incorrect Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Eye className="w-4 h-4" /> Incorrect Feedback Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {question.incorrectFeedbackBlocks.length > 0 &&
                  question.incorrectFeedbackBlocks[0].content ? (
                    question.incorrectFeedbackBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="mb-2 p-2 bg-red-50 rounded border border-red-100"
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: block.content.replace(
                              /<br\s*\/?>/gi,
                              "<br/>"
                            ),
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">
                      No incorrect feedback content.
                    </span>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === "textentry" && (
            <div className="space-y-6">
              <TextBoxConfiguration
                textEntryBoxes={question.textEntryBoxes}
                correctAnswers={question.correctAnswers}
                onUpdateBox={updateBoxConfig}
                onRemoveBox={removeBox}
                onUpdateAnswer={updateAnswer}
              />
            </div>
          )}
          {activeTab === "preview" && (
            <div className="space-y-6">
              {/* QTI Renderer Preview */}

              {/* Interactive Preview */}
              <QuestionPreview
                promptBlocks={question.promptBlocks}
                textEntryBoxes={question.textEntryBoxes}
                correctAnswers={question.correctAnswers}
                correctFeedbackBlocks={question.correctFeedbackBlocks}
                incorrectFeedbackBlocks={question.incorrectFeedbackBlocks}
                onAnswerChange={updateAnswer}
              />

              {/* Auto-generate XML button */}
              <Card>
                <CardHeader>
                  <CardTitle>XML Generation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateXMLForPreview}
                      disabled={isGenerating || !xml}
                    >
                      {isGenerating
                        ? "Generating..."
                        : "Generate XML for Preview"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(xml)}
                      disabled={!xml}
                    >
                      Copy XML
                    </Button>
                  </div>
                  {xml && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium mb-2">
                        Show Generated XML
                      </summary>
                      <pre className="text-xs p-4 bg-gray-800 text-gray-100 rounded overflow-auto max-h-[300px]">
                        {xml}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>

              {/* Feedback Previews */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* Incorrect Feedback Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Eye className="w-4 h-4" />
                      Incorrect Feedback Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {question.incorrectFeedbackBlocks.length > 0 &&
                    question.incorrectFeedbackBlocks[0].content ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        {question.incorrectFeedbackBlocks.map((block) => (
                          <div
                            key={block.id}
                            className="text-red-800"
                            dangerouslySetInnerHTML={{
                              __html: block.content.replace(
                                /<br\s*\/?>/gi,
                                "<br/>"
                              ),
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <div className="text-lg mb-2">📝</div>
                        <p>No incorrect feedback content added yet.</p>
                        <p className="text-sm mt-1">
                          Add content in the Feedbacks tab to see preview here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <PreviewRenderer
                xmlContent={xmlContent || xml}
                questionType="Text Entry"
                disabled={!xml}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
