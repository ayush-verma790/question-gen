"use client";

import React, { useState, useCallback, useMemo, useEffect, memo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Eye, TextCursorInput, Upload, FileText } from "lucide-react";
import {
  Image, Video, Music, Bold, Italic, Underline,
  Heading1, Heading2, Pilcrow, Type, List, ListOrdered,
  Link, Palette
} from 'lucide-react';// Types
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
    const [selectedText, setSelectedText] = useState('');
    const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaAlt, setMediaAlt] = useState('');
    const [activeTextareaIndex, setActiveTextareaIndex] = useState<number | null>(null);
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

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
      if (typeof window === 'undefined') return; // Skip during SSR
      
      const textarea = textareaRefs.current[index];
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        setSelectedText(textarea.value.substring(start, end));
        setSelectionRange({ start, end });
        setActiveTextareaIndex(index);
      } else {
        setSelectedText('');
        setSelectionRange(null);
        setActiveTextareaIndex(null);
      }
    };

    // Wrap selected text with tags
    const wrapSelection = (tag: string, extraAttrs = '') => {
      if (!selectedText || !selectionRange || activeTextareaIndex === null) return;
      
      const block = blocks[activeTextareaIndex];
      const { start, end } = selectionRange;
      const before = block.content.substring(0, start);
      const after = block.content.substring(end);
      const wrappedText = extraAttrs 
        ? `<${tag} ${extraAttrs}>${selectedText}</${tag}>`
        : `<${tag}>${selectedText}</${tag}>`;
      
      updateBlock(activeTextareaIndex, {
        ...block,
        content: before + wrappedText + after
      });
      
      // Reset selection
      setSelectedText('');
      setSelectionRange(null);
      setActiveTextareaIndex(null);
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
        content: before + tagToInsert + after
      });
    };

    // Handle media insertion
    const handleInsertMedia = () => {
      if (activeTextareaIndex === null) return;
      
      const block = blocks[activeTextareaIndex];
      let mediaTag = '';
      
      switch (mediaType) {
        case 'image':
          mediaTag = `<img src="${mediaUrl}" alt="${mediaAlt}" class="max-w-full h-auto" />`;
          break;
        case 'video':
          mediaTag = `<video src="${mediaUrl}" controls class="max-w-full"></video>`;
          break;
        case 'audio':
          mediaTag = `<audio src="${mediaUrl}" controls></audio>`;
          break;
      }
      
      updateBlock(activeTextareaIndex, {
        ...block,
        content: block.content + mediaTag
      });
      
      setShowMediaModal(false);
      setMediaUrl('');
      setMediaAlt('');
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
                        onClick={() => wrapSelection('strong')}
                        className="p-1 h-8 w-8"
                        title="Bold"
                        disabled={!selectedText}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('em')}
                        className="p-1 h-8 w-8"
                        title="Italic"
                        disabled={!selectedText}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('u')}
                        className="p-1 h-8 w-8"
                        title="Underline"
                        disabled={!selectedText}
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('mark', 'class="highlight"')}
                        className="px-2 py-1 text-xs"
                        title="Highlight"
                        disabled={!selectedText}
                      >
                        Mark
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('span', 'style="color: red;"')}
                        className="px-2 py-1 text-xs"
                        title="Red Text"
                        disabled={!selectedText}
                      >
                        Red
                      </Button>
                    </div>

                  
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('h1')}
                        className="p-1 h-8 w-8"
                        title="Heading 1"
                        disabled={!selectedText}
                      >
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('h2')}
                        className="p-1 h-8 w-8"
                        title="Heading 2"
                        disabled={!selectedText}
                      >
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('p')}
                        className="p-1 h-8 w-8"
                        title="Paragraph"
                        disabled={!selectedText}
                      >
                        <Pilcrow className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertTag('br', true)}
                        className="px-2 py-1 text-xs"
                        title="Line Break"
                      >
                        BR
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertTag('hr', true)}
                        className="px-2 py-1 text-xs"
                        title="Horizontal Rule"
                      >
                        HR
                      </Button>
                

                    {/* Lists and Links */}
                   
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('ul')}
                        className="p-1 h-8 w-8"
                        title="Unordered List"
                        disabled={!selectedText}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('ol')}
                        className="p-1 h-8 w-8"
                        title="Ordered List"
                        disabled={!selectedText}
                      >
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('li')}
                        className="px-2 py-1 text-xs"
                        title="List Item"
                        disabled={!selectedText}
                      >
                        LI
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wrapSelection('a', 'href="#"')}
                        className="p-1 h-8 w-8"
                        title="Link"
                        disabled={!selectedText}
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
                          setMediaType('image');
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
                          setMediaType('video');
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
                          setMediaType('audio');
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
                      {mediaType === 'image' && (
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


                  <textarea
                    ref={(el) => {
                      textareaRefs.current[index] = el;
                    }}
                    value={block.content}
                    placeholder="Enter text content here [1]"
                    onChange={(e) =>
                      updateBlock(index, { ...block, content: e.target.value })
                    }
                    onSelect={() => handleTextSelection(index)}
                    onFocus={() => setActiveTextareaIndex(index)}
                    className="w-full min-h-[100px] border p-2 rounded bg-white"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    You can use HTML tags like &lt;br&gt;, &lt;strong&gt;, &lt;p&gt;, etc.
                    Select text to format it, or use toolbar buttons to insert tags.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Content URL</Label>
                      <Input
                        value={block.content}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            content: e.target.value,
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
    onAnswerChange,
  }: {
    promptBlocks: ContentBlock[];
    textEntryBoxes: TextEntryBox[];
    correctAnswers: string[];
    onAnswerChange: (index: number, value: string) => void;
  }) => {
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
            const value = correctAnswers[idx] || "";

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
                className={`${widthClass} border-b-2 border-red-500 bg-white px-1 mx-1`}
                style={{
                  display: "inline-block",
                  height: 24,
                  verticalAlign: "middle",
                }}
                value={value}
                onChange={(e) => onAnswerChange(idx, e.target.value)}
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
    }, [promptBlocks, textEntryBoxes, correctAnswers, onAnswerChange]);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {promptBlocks.length > 0 ? (
            <div className="space-y-4">
              {renderedBlocks}
              {textEntryBoxes.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-medium mb-2">Configuration Summary:</h3>
                  <ul className="space-y-2">
                    {textEntryBoxes.map((box, index) => (
                      <li key={box.id} className="text-sm">
                        <div className="font-medium">Box {index + 1}:</div>
                        <div>Length: {box.expectedLength || "Not set"}</div>
                        <div>Pattern: {box.patternMask || "None"}</div>
                        <div>Width: {box.widthClass || "Default"}</div>
                        <div>
                          Answer:{" "}
                          <span className="font-mono bg-gray-100 px-1 rounded">
                            {correctAnswers[index] || "[not set]"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
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

    const identifier = assessmentItem.getAttribute("identifier") || `text-entry-${Date.now()}`;
    const title = assessmentItem.getAttribute("title") || "Imported Text Entry Question";

    // Parse response declarations
    const responseDeclarations = xmlDoc.querySelectorAll("qti-response-declaration");
    const correctAnswers: string[] = [];
    const textEntryBoxes: TextEntryBox[] = [];

    responseDeclarations.forEach((decl, index) => {
      const responseId = decl.getAttribute("identifier") || `RESPONSE${index + 1}`;
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
            const boxIndex = textEntryBoxes.findIndex(box => box.responseId === responseId);
            if (boxIndex >= 0) {
              textEntryBoxes[boxIndex] = {
                ...textEntryBoxes[boxIndex],
                expectedLength: expectedLength ? parseInt(expectedLength) : undefined,
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
              .map(attr => `${attr.name}="${attr.value}"`)
              .join(" ");
            const innerHTML = Array.from(element.childNodes).map(processNode).join("");
            return `<${element.tagName}${attributes ? " " + attributes : ""}>${innerHTML}</${element.tagName}>`;
          }
        }
        return "";
      };

      // Process all child nodes of item-body, excluding feedback
      const childNodes = Array.from(itemBody.childNodes).filter(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          return element.tagName !== "qti-modal-feedback";
        }
        return true;
      });

      promptContent = childNodes.map(processNode).join("");
    }

    // Parse feedback blocks
    const correctFeedback = xmlDoc.querySelector('qti-modal-feedback[identifier="CORRECT"]');
    const incorrectFeedback = xmlDoc.querySelector('qti-modal-feedback[identifier="INCORRECT"]');

    const correctFeedbackBlocks: ContentBlock[] = [];
    const incorrectFeedbackBlocks: ContentBlock[] = [];

    if (correctFeedback) {
      const feedbackContent = correctFeedback.querySelector("qti-content-body")?.innerHTML || 
                             correctFeedback.textContent || "";
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
      const feedbackContent = incorrectFeedback.querySelector("qti-content-body")?.innerHTML || 
                             incorrectFeedback.textContent || "";
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
    throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main Component
export default function TextEntryBuilderPage() {
  const [xmlInput, setXmlInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [showXmlImport, setShowXmlImport] = useState(false);
  
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
    textEntryBoxes: [
      // {
      //   id: "box1",
      //   responseId: "RESPONSE1",
      //   expectedLength: 20,
      //   widthClass: "qti-input-width-5",
      // },
      // {
      //   id: "box2",
      //   responseId: "RESPONSE2",
      //   expectedLength: 2,
      //   widthClass: "qti-input-width-3",
      // },
    ],
    correctAnswers: ["", ""],
    caseSensitive: false,
    correctFeedbackBlocks: [
      {
        id: "correct_feedback_block",
        type: "text",
        content: "<p><strong>Correct!</strong> Well done.</p>",
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
        content: "<p><strong>Incorrect.</strong> Please try again.</p>",
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

  // XML Import handlers
  const handleParseXML = useCallback(() => {
    try {
      const parsedQuestion = parseTextEntryXML(xmlInput);
      setQuestion(parsedQuestion);
      setParseError("");
      setShowXmlImport(false);
      setXmlInput("");
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Unknown parsing error");
    }
  }, [xmlInput]);

  const handleClearXMLInput = useCallback(() => {
    setXmlInput("");
    setParseError("");
  }, []);

  // Optimized text box insertion
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

  // Update box configuration
  const updateBoxConfig = useCallback((updatedBox: TextEntryBox) => {
    setQuestion((prev) => ({
      ...prev,
      textEntryBoxes: prev.textEntryBoxes.map((box) =>
        box.id === updatedBox.id ? updatedBox : box
      ),
    }));
  }, []);

  // Remove box
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

  // Update answers
  const updateAnswer = useCallback((index: number, value: string) => {
    setQuestion((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers.map((answer, i) =>
        i === index ? value : answer
      ),
    }));
  }, []);

  // Generate XML when question changes
  const xml = useMemo(() => {
    if (question.identifier && question.promptBlocks.length > 0) {
      return generateTextEntryXML(question);
    }
    return "";
  }, [question]);

  useEffect(() => {
    setGeneratedXML(xml);
  }, [xml]);

  // Add CSS for width classes
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Text Entry Question Builder
          </h1>
          <p className="text-gray-600">
            Create questions with inline text entry boxes
          </p>
        </div>

        {/* XML Import Section */}
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
                  <Button onClick={handleParseXML} disabled={!xmlInput.trim()}>
                    Parse & Load XML
                  </Button>
                  <Button variant="outline" onClick={handleClearXMLInput}>
                    Clear
                  </Button>
                  <div className="text-sm text-gray-500 flex items-center ml-auto">
                    💡 This will replace your current question with the imported one
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Question Details */}
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

            {/* Question Prompt */}
            <ContentBlockEditor
              blocks={question.promptBlocks}
              onChange={(blocks) =>
                setQuestion((prev) => ({ ...prev, promptBlocks: blocks }))
              }
              title="Question Prompt"
              allowTextBox={true}
              onInsertTextBox={insertTextEntryBox}
            />

            {/* Text Box Configuration */}
            <TextBoxConfiguration
              textEntryBoxes={question.textEntryBoxes}
              correctAnswers={question.correctAnswers}
              onUpdateBox={updateBoxConfig}
              onRemoveBox={removeBox}
              onUpdateAnswer={updateAnswer}
            />

            {/* Feedback Blocks */}
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
          </div>

          <div className="space-y-6">
            {/* Preview */}
            <QuestionPreview
              promptBlocks={question.promptBlocks}
              textEntryBoxes={question.textEntryBoxes}
              correctAnswers={question.correctAnswers}
              onAnswerChange={updateAnswer}
            />

            {/* XML Output */}
            {generatedXML && (
              <Card>
                <CardHeader>
                  <CardTitle>QTI XML Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs p-4 bg-gray-800 text-gray-100 rounded overflow-auto max-h-[500px]">
                    {generatedXML}
                  </pre>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedXML);
                    }}
                  >
                    Copy XML
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
