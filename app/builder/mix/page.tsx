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
} from 'lucide-react';
import { ButtonSuggestions } from "@/components/button-suggestions";

// Types
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

type MultipleChoiceOption = {
  identifier: string;
  contentBlocks: ContentBlock[];
  isCorrect: boolean;
  inlineFeedbackBlocks: ContentBlock[];
};

type MultipleChoiceQuestion = {
  id: string;
  responseId: string;
  placeholder: string;
  maxChoices: number;
  shuffle: boolean;
  orientation: "vertical" | "horizontal";
  options: MultipleChoiceOption[];
};

type MixedQuestion = {
  identifier: string;
  title: string;
  promptBlocks: ContentBlock[];
  textEntryBoxes: TextEntryBox[];
  multipleChoiceQuestions: MultipleChoiceQuestion[];
  correctAnswers: string[];
  caseSensitive: boolean;
  correctFeedbackBlocks: ContentBlock[];
  incorrectFeedbackBlocks: ContentBlock[];
};

// ContentBlockEditor Component with Text Box Insertion
const ContentBlockEditor = memo(
  ({
    blocks,
    onChange,
    title,
    allowTextBox,
    onInsertTextBox,
    allowMultipleChoice,
    onInsertMultipleChoice,
  }: {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
    title: string;
    allowTextBox?: boolean;
    onInsertTextBox?: (blockId: string) => void;
    allowMultipleChoice?: boolean;
    onInsertMultipleChoice?: (blockId: string) => void;
  }) => {
    // State for each component instance
    const [selectedText, setSelectedText] = useState('');
    const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaAlt, setMediaAlt] = useState('');
    const [activeTextareaIndex, setActiveTextareaIndex] = useState<number | null>(null);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
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

    // Handle text selection and cursor tracking
    const handleTextSelection = (index: number) => {
      if (typeof window === 'undefined') return; // Skip during SSR
      
      const textarea = textareaRefs.current[index];
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Always set the active textarea index when user interacts with it
      setActiveTextareaIndex(index);
      setCursorPosition(start);
      
      if (start !== end) {
        setSelectedText(textarea.value.substring(start, end));
        setSelectionRange({ start, end });
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    };

    // Enhanced text box insertion with cursor position awareness
    const handleInsertTextBoxAtCursor = (blockId: string) => {
      const blockIndex = blocks.findIndex(block => block.id === blockId);
      if (blockIndex === -1) return;

      const textarea = textareaRefs.current[blockIndex];
      if (!textarea) {
        alert('Please click in the text area first and try again');
        return;
      }

      // Get current cursor position from the textarea directly
      const currentCursorPosition = textarea.selectionStart || 0;
      
      // Call the parent's text box insertion handler with cursor position
      if (onInsertTextBox) {
        onInsertTextBox(blockId);
        
        // Store cursor position for the parent component to use
        setCursorPosition(currentCursorPosition);
        setActiveTextareaIndex(blockIndex);
      }
    };

    // Simple function to insert tags at cursor or wrap selection
    const insertHtmlTag = (tag: string, extraAttrs = '', isSelfClosing = false) => {
      // Find which textarea to use
      let textareaIndex = activeTextareaIndex;
      
      // If no active textarea, try to find the last clicked one
      if (textareaIndex === null) {
        // Use the first textarea as fallback
        textareaIndex = 0;
      }
      
      if (textareaIndex === null || !textareaRefs.current[textareaIndex]) {
        alert('Please click in a text area first');
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
      const selectedOrEmpty = hasSelection ? block.content.substring(start, end) : '';
      const afterCursor = block.content.substring(end);
      
      // Create the HTML tag to insert
      let htmlToInsert = '';
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
        content: newContent
      });
      
      // Focus and position cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 50);
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
        content: before + buttonHTML + after
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
                  {(allowTextBox || allowMultipleChoice) && (
                    <div className="flex items-center gap-2 mb-2">
                      {allowTextBox && onInsertTextBox && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInsertTextBoxAtCursor(block.id)}
                          className="flex items-center gap-1"
                        >
                          <TextCursorInput className="w-4 h-4" />
                          Add Text Box at Cursor
                        </Button>
                      )}
                      {allowMultipleChoice && onInsertMultipleChoice && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onInsertMultipleChoice(block.id)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Insert Multiple Choice
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Enhanced Formatting Toolbar */}
                  <div className="mb-2 space-y-2">
                    {/* Text Formatting */}
                    <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('strong')}
                        className="p-1 h-8 w-8"
                        title="Bold - Wrap selection or insert tags"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('em')}
                        className="p-1 h-8 w-8"
                        title="Italic - Wrap selection or insert tags"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('u')}
                        className="p-1 h-8 w-8"
                        title="Underline - Wrap selection or insert tags"
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('mark', 'class="highlight"')}
                        className="px-2 py-1 text-xs"
                        title="Highlight - Wrap selection or insert tags"
                      >
                        Mark
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('span', 'style="color: red;"')}
                        className="px-2 py-1 text-xs"
                        title="Red Text - Wrap selection or insert tags"
                      >
                        Red
                      </Button>
                    </div>

                    {/* Structure and Layout */}
                    <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('h1')}
                        className="p-1 h-8 w-8"
                        title="Heading 1 - Wrap selection or insert tags"
                      >
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('h2')}
                        className="p-1 h-8 w-8"
                        title="Heading 2 - Wrap selection or insert tags"
                      >
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('p')}
                        className="p-1 h-8 w-8"
                        title="Paragraph - Wrap selection or insert tags"
                      >
                        <Pilcrow className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('br', '', true)}
                        className="px-2 py-1 text-xs"
                        title="Line Break - Insert at cursor"
                      >
                        BR
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('hr', '', true)}
                        className="px-2 py-1 text-xs"
                        title="Horizontal Rule - Insert at cursor"
                      >
                        HR
                      </Button>
                    </div>

                    {/* Lists and Links */}
                    <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('ul')}
                        className="p-1 h-8 w-8"
                        title="Unordered List - Wrap selection or insert tags"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('ol')}
                        className="p-1 h-8 w-8"
                        title="Ordered List - Wrap selection or insert tags"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('li')}
                        className="px-2 py-1 text-xs"
                        title="List Item - Wrap selection or insert tags"
                      >
                        LI
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlTag('a', 'href="#"')}
                        className="p-1 h-8 w-8"
                        title="Link - Wrap selection or insert tags"
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </div>

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
                    value={block.content.replace(/<br\s*\/?>/gi, '\n')}
                    placeholder="Click here and then use 'Add Text Box at Cursor' to insert [1], [2], etc."
                    onChange={(e) =>
                      updateBlock(index, { ...block, content: e.target.value.replace(/\n/g, '<br/>') })
                    }
                    onSelect={() => handleTextSelection(index)}
                    onFocus={() => setActiveTextareaIndex(index)}
                    onClick={() => handleTextSelection(index)}
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
                    <strong>💡 Pro Tips:</strong> Click in the text area to position cursor • 
                    Use 'Add Text Box at Cursor' to insert [1], [2], etc. placeholders • 
                    Select text and click formatting buttons to wrap it • 
                    Use button suggestions above for quick interactive elements
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Content URL</Label>
                      <Input
                        value={block.content.replace(/<br\s*\/?>/gi, ' ')}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            content: e.target.value.replace(/ +/g, '<br/>'),
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
    multipleChoiceQuestions,
    correctAnswers,
    onAnswerChange,
  }: {
    promptBlocks: ContentBlock[];
    textEntryBoxes: TextEntryBox[];
    multipleChoiceQuestions: MultipleChoiceQuestion[];
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
          let htmlContent = block.content;

          // Handle text entry boxes
          const textBoxRegex = /\[(\d+)\]/g;
          let match;

          while ((match = textBoxRegex.exec(htmlContent)) !== null) {
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

          // Handle multiple choice placeholders
          multipleChoiceQuestions.forEach((mcQuestion) => {
            const mcIndex = htmlContent.indexOf(mcQuestion.placeholder);
            
            if (mcIndex !== -1) {
              // Add content before multiple choice
              const beforeMC = htmlContent.slice(lastIndex, mcIndex);
              if (beforeMC) {
                elements.push(
                  <span
                    key={`before-mc-${lastIndex}-${mcQuestion.id}`}
                    dangerouslySetInnerHTML={{ __html: beforeMC }}
                  />
                );
              }

              // Add multiple choice component
              elements.push(
                <div key={`mc-${mcQuestion.id}`} className="my-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Choose your answer:</h4>
                  <div className={`space-y-2 ${mcQuestion.orientation === 'horizontal' ? 'flex flex-wrap gap-4 space-y-0' : ''}`}>
                    {mcQuestion.options.map((option, optionIndex) => (
                      <label key={option.identifier} className={`flex items-center space-x-2 cursor-pointer ${mcQuestion.orientation === 'horizontal' ? 'min-w-fit' : ''}`}>
                        <input
                          type={mcQuestion.maxChoices === 1 ? "radio" : "checkbox"}
                          name={`mc-${mcQuestion.id}`}
                          value={option.identifier}
                          className="form-radio"
                        />
                        <span>
                          {option.contentBlocks.map((contentBlock, blockIndex) => (
                            <span
                              key={blockIndex}
                              dangerouslySetInnerHTML={{ __html: contentBlock.content }}
                            />
                          ))}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );

              lastIndex = mcIndex + mcQuestion.placeholder.length;
              // Update htmlContent to remove the processed placeholder
              htmlContent = htmlContent.replace(mcQuestion.placeholder, '');
            }
          });

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
                  <h3 className="font-medium mb-2">Text Boxes Summary:</h3>
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

    if (textEntryBoxes.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Text Box Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">No text boxes added yet. Use the "Add Text Box at Cursor" button in the Question tab to add text boxes.</p>
          </CardContent>
        </Card>
      );
    }

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

// MultipleChoiceConfiguration Component
const MultipleChoiceConfiguration = memo(
  ({
    multipleChoiceQuestions,
    onUpdateQuestion,
    onRemoveQuestion,
    onAddQuestion,
  }: {
    multipleChoiceQuestions: MultipleChoiceQuestion[];
    onUpdateQuestion: (index: number, updatedQuestion: MultipleChoiceQuestion) => void;
    onRemoveQuestion: (index: number) => void;
    onAddQuestion: () => void;
  }) => {
    const addOptionToQuestion = (questionIndex: number) => {
      const question = multipleChoiceQuestions[questionIndex];
      const newOption: MultipleChoiceOption = {
        identifier: `choice_${questionIndex + 1}_${question.options.length + 1}`,
        contentBlocks: [
          {
            id: `choice_block_${Date.now()}_${question.options.length}`,
            type: "text",
            content: `Option ${question.options.length + 1}`,
            styles: {},
            attributes: {},
          },
        ],
        isCorrect: false,
        inlineFeedbackBlocks: [],
      };

      onUpdateQuestion(questionIndex, {
        ...question,
        options: [...question.options, newOption],
      });
    };

    const removeOptionFromQuestion = (questionIndex: number, optionIndex: number) => {
      const question = multipleChoiceQuestions[questionIndex];
      onUpdateQuestion(questionIndex, {
        ...question,
        options: question.options.filter((_, i) => i !== optionIndex),
      });
    };

    const updateOption = (questionIndex: number, optionIndex: number, updatedOption: MultipleChoiceOption) => {
      const question = multipleChoiceQuestions[questionIndex];
      onUpdateQuestion(questionIndex, {
        ...question,
        options: question.options.map((option, i) =>
          i === optionIndex ? updatedOption : option
        ),
      });
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Multiple Choice Questions ({multipleChoiceQuestions.length})</span>
              <Button onClick={onAddQuestion} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add MC Question
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {multipleChoiceQuestions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No multiple choice questions yet. Use "Insert Multiple Choice" in the content editor to add them at specific positions.
              </p>
            ) : (
              multipleChoiceQuestions.map((mcQuestion, questionIndex) => (
                <div key={mcQuestion.id} className="border rounded-lg p-6 space-y-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">MC Question {questionIndex + 1}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveQuestion(questionIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Placeholder in Text</Label>
                      <Input
                        value={mcQuestion.placeholder}
                        readOnly
                        className="bg-gray-100"
                        title="This is auto-generated and shows where the question appears in your content"
                      />
                    </div>
                    <div>
                      <Label>Response ID</Label>
                      <Input
                        value={mcQuestion.responseId}
                        onChange={(e) => {
                          onUpdateQuestion(questionIndex, {
                            ...mcQuestion,
                            responseId: e.target.value,
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Max Choices</Label>
                      <Input
                        type="number"
                        min="1"
                        value={mcQuestion.maxChoices}
                        onChange={(e) => {
                          onUpdateQuestion(questionIndex, {
                            ...mcQuestion,
                            maxChoices: parseInt(e.target.value) || 1,
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Orientation</Label>
                      <select
                        value={mcQuestion.orientation}
                        onChange={(e) => {
                          onUpdateQuestion(questionIndex, {
                            ...mcQuestion,
                            orientation: e.target.value as "vertical" | "horizontal",
                          });
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`shuffle-${questionIndex}`}
                        checked={mcQuestion.shuffle}
                        onCheckedChange={(checked) => {
                          onUpdateQuestion(questionIndex, {
                            ...mcQuestion,
                            shuffle: !!checked,
                          });
                        }}
                      />
                      <Label htmlFor={`shuffle-${questionIndex}`}>Shuffle Options</Label>
                    </div>
                  </div>

                  {/* Options for this question */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Options ({mcQuestion.options.length})</h4>
                      <Button 
                        onClick={() => addOptionToQuestion(questionIndex)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    </div>

                    {mcQuestion.options.map((option, optionIndex) => (
                      <div key={option.identifier} className="border rounded-lg p-4 space-y-4 bg-white">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium">Option {optionIndex + 1}</h5>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`correct-${questionIndex}-${optionIndex}`}
                                checked={option.isCorrect}
                                onCheckedChange={(checked) => {
                                  updateOption(questionIndex, optionIndex, {
                                    ...option,
                                    isCorrect: !!checked,
                                  });
                                }}
                              />
                              <Label htmlFor={`correct-${questionIndex}-${optionIndex}`}>Correct Answer</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOptionFromQuestion(questionIndex, optionIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Identifier</Label>
                          <Input
                            value={option.identifier}
                            onChange={(e) => {
                              updateOption(questionIndex, optionIndex, {
                                ...option,
                                identifier: e.target.value,
                              });
                            }}
                            placeholder="e.g., choice_a"
                          />
                        </div>

                        <div>
                          <Label>Content</Label>
                          <ContentBlockEditor
                            blocks={option.contentBlocks}
                            onChange={(blocks) => {
                              updateOption(questionIndex, optionIndex, {
                                ...option,
                                contentBlocks: blocks,
                              });
                            }}
                            title={`Option ${optionIndex + 1} Content`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

MultipleChoiceConfiguration.displayName = "MultipleChoiceConfiguration";

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

function generateMixedXML(question: MixedQuestion): string {
  const {
    identifier,
    title,
    promptBlocks,
    textEntryBoxes,
    multipleChoiceQuestions,
    correctAnswers,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
  } = question;

  // Generate response declarations for text entry boxes
  const textEntryResponseDeclarations = textEntryBoxes
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

  // Generate response declarations for multiple choice questions
  const mcResponseDeclarations = multipleChoiceQuestions
    .map((mcQuestion) => {
      const correctValues = mcQuestion.options
        .filter(option => option.isCorrect)
        .map(option => option.identifier);
        
      return `      <qti-response-declaration identifier="${mcQuestion.responseId}" cardinality="single" base-type="identifier">
        <qti-correct-response>
          <qti-value>${correctValues[0] || ""}</qti-value>
        </qti-correct-response>
      </qti-response-declaration>`;
    })
    .join("\n");

  const allResponseDeclarations = [textEntryResponseDeclarations, mcResponseDeclarations]
    .filter(Boolean)
    .join("\n");

  let promptContent = "";
  promptBlocks.forEach((block) => {
    if (block.type === "text") {
      let content = block.content;
      
      // Replace text entry placeholders
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

      // Replace multiple choice placeholders
      multipleChoiceQuestions.forEach((mcQuestion) => {
        const mcChoicesHtml = mcQuestion.options
          .map(option => {
            const choiceContent = option.contentBlocks
              .map(block => block.content)
              .join("");
            return `      <qti-simple-choice identifier="${option.identifier}">${choiceContent}</qti-simple-choice>`;
          })
          .join("\n");
          
        const mcInteraction = `    <qti-choice-interaction response-identifier="${mcQuestion.responseId}" max-choices="${mcQuestion.maxChoices}"${
          mcQuestion.shuffle ? ' shuffle="true"' : ''
        }${mcQuestion.orientation === 'horizontal' ? ' orientation="horizontal"' : ''}>
${mcChoicesHtml}
    </qti-choice-interaction>`;
        
        content = content.replace(mcQuestion.placeholder, mcInteraction);
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

  // Generate response processing based on whether we have both types
  const hasTextEntry = textEntryBoxes.length > 0;
  const hasMultipleChoice = multipleChoiceQuestions.length > 0;
  
  let responseProcessing = '';
  
  if (hasTextEntry && hasMultipleChoice) {
    // Both text entry and multiple choice - need custom processing
    const mcMatches = multipleChoiceQuestions.map(mcQuestion => `          <qti-match>
            <qti-variable identifier="${mcQuestion.responseId}"/>
            <qti-correct identifier="${mcQuestion.responseId}"/>
          </qti-match>`).join('\n');
          
    responseProcessing = `  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
${mcMatches}
${textEntryBoxes.map(box => `          <qti-match>
            <qti-variable identifier="${box.responseId}"/>
            <qti-correct identifier="${box.responseId}"/>
          </qti-match>`).join('\n')}
        </qti-and>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">${textEntryBoxes.length + multipleChoiceQuestions.length}</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>`;
  } else if (hasMultipleChoice) {
    // Only multiple choice
    responseProcessing = `  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>`;
  } else {
    // Only text entry
    responseProcessing = `  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>`;
  }

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
${allResponseDeclarations}

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

${responseProcessing}
</qti-assessment-item>`;
}

// Main Component
export default function MixedQuestionBuilderPage() {
  const [activeTab, setActiveTab] = useState<'question'|'feedbacks'|'textentry'|'multiplechoice'|'preview'>('question');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const [question, setQuestion] = useState<MixedQuestion>({
    identifier: "mixed-question-1",
    title: "Mixed Question with Text Boxes",
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
    multipleChoiceQuestions: [],
    correctAnswers: [],
    caseSensitive: false,
    correctFeedbackBlocks: [
      {
        id: "correct_feedback_block",
        type: "text",
        content: "Correct! Well done.",
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
        content: "Incorrect. Please try again.",
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

  // Generate XML function
  const generateXML = useCallback(() => {
    if (question.identifier && question.promptBlocks.length > 0) {
      const xml = generateMixedXML(question);
      setGeneratedXML(xml);
    }
  }, [question]);

  // Auto-generate XML when question changes
  useEffect(() => {
    if (question.identifier && question.promptBlocks.length > 0) {
      const xml = generateMixedXML(question);
      setGeneratedXML(xml);
    }
  }, [question]);

  // Handle cursor-aware text box insertion
  const insertTextEntryBox = useCallback(
    (blockId: string) => {
      setQuestion((prev) => {
        const newIndex = prev.textEntryBoxes.length;
        const newId = `RESPONSE${newIndex + 1}`;
        const boxId = `box${newIndex + 1}`;
        const placeholder = `[${newIndex + 1}]`;
        const defaultWidthClass = `qti-input-width-5`;

        // Find the textarea for this block and get cursor position
        const blockIndex = prev.promptBlocks.findIndex(block => block.id === blockId);
        if (blockIndex === -1) return prev;

        const block = prev.promptBlocks[blockIndex];
        let newContent = block.content;

        // Insert at cursor position if available, otherwise append
        if (cursorPosition !== null) {
          newContent =
            block.content.slice(0, cursorPosition) +
            placeholder +
            block.content.slice(cursorPosition);
        } else {
          newContent += placeholder;
        }

        return {
          ...prev,
          promptBlocks: prev.promptBlocks.map((block) => {
            if (block.id !== blockId) return block;
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

  // Multiple Choice Functions
  const addMultipleChoiceQuestion = useCallback(() => {
    setQuestion((prev) => {
      const newIndex = prev.multipleChoiceQuestions.length;
      const newQuestion: MultipleChoiceQuestion = {
        id: `mc_question_${Date.now()}_${newIndex}`,
        responseId: `MC_RESPONSE_${newIndex + 1}`,
        placeholder: `[MC_${newIndex + 1}]`,
        maxChoices: 1,
        shuffle: false,
        orientation: "vertical",
        options: [
          {
            identifier: `choice_${newIndex + 1}_1`,
            contentBlocks: [
              {
                id: `choice_block_${Date.now()}_1`,
                type: "text",
                content: "Option 1",
                styles: {},
                attributes: {},
              },
            ],
            isCorrect: true,
            inlineFeedbackBlocks: [],
          },
          {
            identifier: `choice_${newIndex + 1}_2`,
            contentBlocks: [
              {
                id: `choice_block_${Date.now()}_2`,
                type: "text",
                content: "Option 2",
                styles: {},
                attributes: {},
              },
            ],
            isCorrect: false,
            inlineFeedbackBlocks: [],
          },
        ],
      };

      return {
        ...prev,
        multipleChoiceQuestions: [...prev.multipleChoiceQuestions, newQuestion],
      };
    });
  }, []);

  const updateMultipleChoiceQuestion = useCallback((questionIndex: number, updatedQuestion: MultipleChoiceQuestion) => {
    setQuestion((prev) => ({
      ...prev,
      multipleChoiceQuestions: prev.multipleChoiceQuestions.map((question, i) =>
        i === questionIndex ? updatedQuestion : question
      ),
    }));
  }, []);

  const removeMultipleChoiceQuestion = useCallback((questionIndex: number) => {
    setQuestion((prev) => {
      const questionToRemove = prev.multipleChoiceQuestions[questionIndex];
      return {
        ...prev,
        promptBlocks: prev.promptBlocks.map((block) => ({
          ...block,
          content: block.content.replace(
            new RegExp(escapeRegExp(questionToRemove.placeholder), "g"),
            ""
          ),
        })),
        multipleChoiceQuestions: prev.multipleChoiceQuestions.filter((_, i) => i !== questionIndex),
      };
    });
  }, []);

  const insertMultipleChoice = useCallback((blockId: string) => {
    setQuestion((prev) => {
      const blockIndex = prev.promptBlocks.findIndex(block => block.id === blockId);
      if (blockIndex === -1) return prev;

      // Create new multiple choice question
      const newIndex = prev.multipleChoiceQuestions.length;
      const newQuestion: MultipleChoiceQuestion = {
        id: `mc_question_${Date.now()}_${newIndex}`,
        responseId: `MC_RESPONSE_${newIndex + 1}`,
        placeholder: `[MC_${newIndex + 1}]`,
        maxChoices: 1,
        shuffle: false,
        orientation: "vertical",
        options: [
          {
            identifier: `choice_${newIndex + 1}_1`,
            contentBlocks: [
              {
                id: `choice_block_${Date.now()}_1`,
                type: "text",
                content: "Option 1",
                styles: {},
                attributes: {},
              },
            ],
            isCorrect: true,
            inlineFeedbackBlocks: [],
          },
          {
            identifier: `choice_${newIndex + 1}_2`,
            contentBlocks: [
              {
                id: `choice_block_${Date.now()}_2`,
                type: "text",
                content: "Option 2",
                styles: {},
                attributes: {},
              },
            ],
            isCorrect: false,
            inlineFeedbackBlocks: [],
          },
        ],
      };

      const block = prev.promptBlocks[blockIndex];
      let newContent = block.content;

      // Insert at cursor position if available, otherwise append
      if (cursorPosition !== null) {
        newContent =
          block.content.slice(0, cursorPosition) +
          newQuestion.placeholder +
          block.content.slice(cursorPosition);
      } else {
        newContent += newQuestion.placeholder;
      }

      return {
        ...prev,
        promptBlocks: prev.promptBlocks.map((block) => {
          if (block.id !== blockId) return block;
          return { ...block, content: newContent };
        }),
        multipleChoiceQuestions: [...prev.multipleChoiceQuestions, newQuestion],
      };
    });
  }, [cursorPosition]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Mixed Question Builder</h1>
        <Button onClick={generateXML} disabled={!question.promptBlocks.length}>
          <FileText className="w-4 h-4 mr-2" />
          Generate XML
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={activeTab === 'question' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setActiveTab('question')}
              >
                Question
              </Button>
              <Button
                variant={activeTab === 'textentry' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setActiveTab('textentry')}
              >
                Text Boxes ({question.textEntryBoxes.length})
              </Button>
              <Button
                variant={activeTab === 'multiplechoice' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setActiveTab('multiplechoice')}
              >
                Multiple Choice ({question.multipleChoiceQuestions.length})
              </Button>
              <Button
                variant={activeTab === 'feedbacks' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setActiveTab('feedbacks')}
              >
                Feedbacks
              </Button>
              <Button
                variant={activeTab === 'preview' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setActiveTab('preview')}
              >
                Preview & XML
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main content by tab */}
          {activeTab === 'question' && (
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
                allowMultipleChoice={true}
                onInsertMultipleChoice={insertMultipleChoice}
              />
              <QuestionPreview
                promptBlocks={question.promptBlocks}
                textEntryBoxes={question.textEntryBoxes}
                multipleChoiceQuestions={question.multipleChoiceQuestions}
                correctAnswers={question.correctAnswers}
                onAnswerChange={updateAnswer}
              />
            </div>
          )}
          {activeTab === 'feedbacks' && (
            <div className="space-y-6">
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
                  {question.incorrectFeedbackBlocks.length > 0 ? (
                    question.incorrectFeedbackBlocks.map((block) => (
                      <div key={block.id} className="mb-2 p-2 bg-red-50 rounded border border-red-100">
                        <span dangerouslySetInnerHTML={{ __html: block.content.replace(/<br\s*\/?>/gi, '<br/>') }} />
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">No incorrect feedback content.</span>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'textentry' && (
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
          {activeTab === 'multiplechoice' && (
            <div className="space-y-6">
              <MultipleChoiceConfiguration
                multipleChoiceQuestions={question.multipleChoiceQuestions}
                onUpdateQuestion={updateMultipleChoiceQuestion}
                onRemoveQuestion={removeMultipleChoiceQuestion}
                onAddQuestion={addMultipleChoiceQuestion}
              />
            </div>
          )}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <QuestionPreview
                promptBlocks={question.promptBlocks}
                textEntryBoxes={question.textEntryBoxes}
                multipleChoiceQuestions={question.multipleChoiceQuestions}
                correctAnswers={question.correctAnswers}
                onAnswerChange={updateAnswer}
              />
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
          )}
        </div>
      </div>
    </div>
  );
}

