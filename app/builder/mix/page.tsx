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
  createdAt?: number;
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
  createdAt?: number;
};

type HottextItem = {
  identifier: string;
  content: {
    type: "text" | "image" | "html";
    value: string;
  };
  styles: {
    display?: string;
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: "left" | "center" | "right";
    textDecoration?: string;
    textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | "initial" | "inherit";
    padding?: string;
    margin?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    lineHeight?: string;
    letterSpacing?: string;
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    transition?: string;
  };
  position: {
    x: number;
    y: number;
  };
};

type HottextQuestion = {
  id: string;
  responseId: string;
  placeholder: string;
  maxChoices: number;
  textContent: string;
  hottextItems: HottextItem[];
  correctAnswers: string[];
  createdAt?: number;
};

type MixedQuestion = {
  identifier: string;
  title: string;
  promptBlocks: ContentBlock[];
  textEntryBoxes: TextEntryBox[];
  multipleChoiceQuestions: MultipleChoiceQuestion[];
  hottextQuestions: HottextQuestion[];
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
    allowHottext,
    onInsertHottext,
    autoDetectHottextTags,
  }: {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
    title: string;
    allowTextBox?: boolean;
    onInsertTextBox?: (blockId: string) => void;
    allowMultipleChoice?: boolean;
    onInsertMultipleChoice?: (blockId: string) => void;
    allowHottext?: boolean;
    onInsertHottext?: (blockId: string) => void;
    autoDetectHottextTags?: (content: string) => void;
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
                  {(allowTextBox || allowMultipleChoice || allowHottext) && (
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
                      {allowHottext && onInsertHottext && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onInsertHottext(block.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Insert Hottext
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
                  
                  {/* Hottext Auto-Detection */}
                  {block.content.includes('<hottext>') && (
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-orange-700">
                          🔥 <strong>Hottext detected!</strong> Click to create hottext question configuration.
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => autoDetectHottextTags(block.content)}
                          className="bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200"
                        >
                          Configure Hottext
                        </Button>
                      </div>
                    </div>
                  )}
                  
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
    hottextQuestions,
    correctAnswers,
    onAnswerChange,
  }: {
    promptBlocks: ContentBlock[];
    textEntryBoxes: TextEntryBox[];
    multipleChoiceQuestions: MultipleChoiceQuestion[];
    hottextQuestions: HottextQuestion[];
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
          // Create a combined list of all interactive elements with their positions
          let htmlContent = block.content;
          const interactiveElements: Array<{
            type: 'textentry' | 'multiplechoice' | 'hottext';
            position: number;
            length: number;
            data: any;
          }> = [];

          // Find text entry boxes
          const textBoxRegex = /\[(\d+)\]/g;
          let match;
          while ((match = textBoxRegex.exec(htmlContent)) !== null) {
            const idx = parseInt(match[1], 10) - 1;
            const box = textEntryBoxes[idx];
            if (box) {
              interactiveElements.push({
                type: 'textentry',
                position: match.index,
                length: match[0].length,
                data: { index: idx, box, match: match[0] }
              });
            }
          }

          // Find multiple choice placeholders
          multipleChoiceQuestions.forEach((mcQuestion) => {
            const mcIndex = htmlContent.indexOf(mcQuestion.placeholder);
            if (mcIndex !== -1) {
              interactiveElements.push({
                type: 'multiplechoice',
                position: mcIndex,
                length: mcQuestion.placeholder.length,
                data: mcQuestion
              });
            }
          });

          // Find hottext placeholders  
          hottextQuestions.forEach((hottextQuestion) => {
            const hottextIndex = htmlContent.indexOf(hottextQuestion.placeholder);
            if (hottextIndex !== -1) {
              interactiveElements.push({
                type: 'hottext',
                position: hottextIndex,
                length: hottextQuestion.placeholder.length,
                data: hottextQuestion
              });
            }
          });

          // Sort elements by position for proper rendering order
          interactiveElements.sort((a, b) => a.position - b.position);

          // Build the final rendered content
          const elements: (string | React.ReactNode)[] = [];
          let lastIndex = 0;

          interactiveElements.forEach((element, elementIndex) => {
            // Add content before this element
            const preceding = htmlContent.slice(lastIndex, element.position);
            if (preceding) {
              elements.push(
                <span
                  key={`text-${lastIndex}-${element.position}`}
                  dangerouslySetInnerHTML={{ __html: preceding }}
                />
              );
            }

            // Add the interactive element
            if (element.type === 'textentry') {
              const { index: idx, box } = element.data;
              const widthClass = box?.widthClass || "qti-input-width-5";
              const value = correctAnswers[idx] || "";

              elements.push(
                <input
                  key={`input-${idx}`}
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
            } else if (element.type === 'multiplechoice') {
              const mcQuestion = element.data;
              elements.push(
                <div key={`mc-${mcQuestion.id}`} className="my-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3 text-gray-700">Choose your answer:</h4>
                  <div className={`space-y-2 ${mcQuestion.orientation === 'horizontal' ? 'flex flex-wrap gap-4 space-y-0' : ''}`}>
                    {mcQuestion.options.map((option, optionIndex) => (
                      <label key={option.identifier} className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded ${mcQuestion.orientation === 'horizontal' ? 'min-w-fit' : ''}`}>
                        <input
                          type={mcQuestion.maxChoices === 1 ? "radio" : "checkbox"}
                          name={`mc-${mcQuestion.id}`}
                          value={option.identifier}
                          className="form-radio"
                        />
                        <span className="flex-1">
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
            } else if (element.type === 'hottext') {
              const hottextQuestion = element.data;
              elements.push(
                <div key={`hottext-${hottextQuestion.id}`} className="my-4 p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-medium mb-3 text-blue-800">
                    Select the correct words: 
                    {hottextQuestion.maxChoices > 0 && ` (Choose up to ${hottextQuestion.maxChoices})`}
                  </h4>
                  <div className="text-lg leading-relaxed">
                    {hottextQuestion.textContent.split(/(<hottext>.*?<\/hottext>)/g).map((segment, segmentIndex) => {
                      const hottextMatch = segment.match(/<hottext>(.*?)<\/hottext>/);
                      if (hottextMatch) {
                        const word = hottextMatch[1];
                        const correspondingItem = hottextQuestion.hottextItems.find(item => item.content.value === word);
                        const isCorrect = hottextQuestion.correctAnswers.includes(correspondingItem?.identifier || '');
                        return (
                          <span
                            key={segmentIndex}
                            className="hottext-item cursor-pointer px-2 py-1 mx-1 rounded bg-yellow-200 hover:bg-yellow-300 border-2 border-transparent hover:border-yellow-400 transition-all"
                            style={{
                              display: 'inline-block',
                              ...correspondingItem?.styles
                            }}
                            title={`Click to select${isCorrect ? ' (Correct Answer)' : ''}`}
                          >
                            {correspondingItem?.content.type === 'html' ? (
                              <span dangerouslySetInnerHTML={{ __html: word }} />
                            ) : (
                              word
                            )}
                          </span>
                        );
                      } else {
                        return (
                          <span key={segmentIndex} dangerouslySetInnerHTML={{ __html: segment }} />
                        );
                      }
                    })}
                  </div>
                </div>
              );
            }

            lastIndex = element.position + element.length;
          });

          // Add remaining content after all elements
          const remaining = htmlContent.slice(lastIndex);
          if (remaining) {
            elements.push(
              <span
                key={`remaining-${lastIndex}`}
                dangerouslySetInnerHTML={{ __html: remaining }}
              />
            );
          }

          return (
            <div key={block.id} style={style}>
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
    }, [promptBlocks, textEntryBoxes, multipleChoiceQuestions, hottextQuestions, correctAnswers, onAnswerChange]);

    return (
      <details className="border rounded-lg" open>
        <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Preview
        </summary>
        <div className="p-4 border-t bg-white">
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
        </div>
      </details>
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
        <details className="border rounded-lg" open>
          <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50">
            Text Box Configuration (0 text boxes in question)
          </summary>
          <div className="p-4 border-t bg-white">
            <p className="text-gray-500">No text boxes added yet. Use the "Add Text Box at Cursor" button in the Question tab to add text boxes.</p>
          </div>
        </details>
      );
    }

    return (
      <details className="border rounded-lg" open>
        <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50">
          Text Box Configuration ({textEntryBoxes.length} text box{textEntryBoxes.length !== 1 ? "es" : ""} in question)
        </summary>
        <div className="p-4 border-t bg-white space-y-4">
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
        </div>
      </details>
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
        <details className="border rounded-lg" open>
          <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50 flex justify-between items-center">
            <span>Multiple Choice Questions ({multipleChoiceQuestions.length})</span>
            <Button onClick={onAddQuestion} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add MC Question
            </Button>
          </summary>
          <div className="p-4 border-t bg-white space-y-6">
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
          </div>
        </details>
      </div>
    );
  }
);

MultipleChoiceConfiguration.displayName = "MultipleChoiceConfiguration";

// Hottext Configuration Component
const HottextConfiguration = memo(
  ({
    hottextQuestions,
    onUpdateQuestion,
    onRemoveQuestion,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
  }: {
    hottextQuestions: HottextQuestion[];
    onUpdateQuestion: (index: number, updates: Partial<HottextQuestion>) => void;
    onRemoveQuestion: (index: number) => void;
    onAddItem: (questionIndex: number) => void;
    onUpdateItem: (questionIndex: number, itemIndex: number, updates: Partial<HottextItem>) => void;
    onRemoveItem: (questionIndex: number, itemIndex: number) => void;
  }) => {
    return (
      <div className="space-y-6">
        <details className="border rounded-lg" open>
          <summary className="p-4 font-semibold cursor-pointer hover:bg-gray-50 flex justify-between items-center">
            <span>Hottext Questions Configuration</span>
            <div className="text-sm text-gray-500">
              {hottextQuestions.length} hottext question{hottextQuestions.length !== 1 ? 's' : ''}
            </div>
          </summary>
          <div className="p-4 border-t bg-white">
            {hottextQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hottext questions added yet.</p>
                <p className="text-sm">Add hottext placeholders to your question prompt above.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {hottextQuestions.map((question, questionIndex) => (
                  <Card key={question.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Hottext Question {questionIndex + 1}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Placeholder: {question.placeholder}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveQuestion(questionIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Response ID and Max Choices */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`hottext-response-${questionIndex}`}>Response Identifier</Label>
                          <Input
                            id={`hottext-response-${questionIndex}`}
                            value={question.responseId}
                            onChange={(e) => onUpdateQuestion(questionIndex, { responseId: e.target.value })}
                            placeholder="HOT_RESPONSE_1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`hottext-max-choices-${questionIndex}`}>
                            Max Choices (0 = unlimited)
                          </Label>
                          <Input
                            id={`hottext-max-choices-${questionIndex}`}
                            type="number"
                            min="0"
                            value={question.maxChoices}
                            onChange={(e) => onUpdateQuestion(questionIndex, { maxChoices: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      {/* Text Content */}
                      <div>
                        <Label htmlFor={`hottext-content-${questionIndex}`}>
                          Hottext Content (HTML supported - Mark words with &lt;hottext&gt; tags)
                        </Label>
                        <Textarea
                          id={`hottext-content-${questionIndex}`}
                          value={question.textContent}
                          onChange={(e) => onUpdateQuestion(questionIndex, { textContent: e.target.value })}
                          placeholder="Programming is a <hottext>creative</hottext> process that involves <hottext><b>problem-solving</b></hottext> and <hottext><em>logical thinking</em></hottext>."
                          rows={6}
                        />
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <p>• Wrap words in &lt;hottext&gt; tags to make them selectable</p>
                          <p>• Use HTML inside hottext tags: &lt;hottext&gt;&lt;b&gt;bold word&lt;/b&gt;&lt;/hottext&gt;</p>
                          <p>• Configure each hottext item below to set correct answers and styling</p>
                        </div>
                        
                        {/* Live Preview */}
                        <div className="mt-3 p-4 bg-blue-50 border rounded-lg">
                          <Label className="text-sm font-semibold text-blue-800 mb-2 block">Live Preview:</Label>
                          <div 
                            className="text-lg leading-relaxed"
                            dangerouslySetInnerHTML={{ 
                              __html: question.textContent.replace(
                                /<hottext>(.*?)<\/hottext>/g, 
                                '<span class="bg-yellow-200 px-2 py-1 rounded cursor-pointer border-2 border-yellow-400 mx-1">$1</span>'
                              )
                            }}
                          />
                        </div>
                      </div>

                      {/* Hottext Items */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-base font-semibold">Hottext Items</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddItem(questionIndex)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                        
                        {question.hottextItems.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <p>No hottext items defined.</p>
                            <p className="text-sm">Add items to configure which words are correct answers.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {question.hottextItems.map((item, itemIndex) => (
                              <div key={item.identifier} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Item {itemIndex + 1}</span>
                                    <Checkbox
                                      checked={hottextQuestions[questionIndex].correctAnswers.includes(item.identifier)}
                                      onCheckedChange={(checked) => {
                                        const currentCorrectAnswers = hottextQuestions[questionIndex].correctAnswers;
                                        const newCorrectAnswers = checked 
                                          ? [...currentCorrectAnswers, item.identifier]
                                          : currentCorrectAnswers.filter(id => id !== item.identifier);
                                        onUpdateQuestion(questionIndex, { correctAnswers: newCorrectAnswers });
                                      }}
                                    />
                                    <Label className="text-sm">Correct Answer</Label>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoveItem(questionIndex, itemIndex)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor={`item-id-${questionIndex}-${itemIndex}`}>Identifier</Label>
                                    <Input
                                      id={`item-id-${questionIndex}-${itemIndex}`}
                                      value={item.identifier}
                                      onChange={(e) => 
                                        onUpdateItem(questionIndex, itemIndex, { identifier: e.target.value })
                                      }
                                      placeholder="H1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`item-content-${questionIndex}-${itemIndex}`}>
                                      Content (HTML supported)
                                    </Label>
                                    <Textarea
                                      id={`item-content-${questionIndex}-${itemIndex}`}
                                      value={item.content.value}
                                      onChange={(e) => 
                                        onUpdateItem(questionIndex, itemIndex, { 
                                          content: { ...item.content, value: e.target.value }
                                        })
                                      }
                                      placeholder="word or <b>bold word</b> or <i>italic</i>"
                                      rows={2}
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                      💡 Use HTML tags like &lt;b&gt;, &lt;i&gt;, &lt;span style="color:red"&gt;, etc.
                                    </div>
                                  </div>
                                  
                                  {/* Content Type Selector */}
                                  <div>
                                    <Label htmlFor={`item-type-${questionIndex}-${itemIndex}`}>Content Type</Label>
                                    <select
                                      id={`item-type-${questionIndex}-${itemIndex}`}
                                      value={item.content.type}
                                      onChange={(e) => 
                                        onUpdateItem(questionIndex, itemIndex, { 
                                          content: { ...item.content, type: e.target.value as "text" | "image" | "html" }
                                        })
                                      }
                                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                      <option value="text">Plain Text</option>
                                      <option value="html">HTML Content</option>
                                      <option value="image">Image URL</option>
                                    </select>
                                  </div>
                                </div>
                                
                                {/* Live Preview */}
                                <div className="mt-3 p-3 bg-white border rounded">
                                  <Label className="text-xs text-gray-600 mb-2 block">Live Preview:</Label>
                                  <div 
                                    className="min-h-[24px] px-2 py-1 border rounded bg-yellow-100"
                                    style={{
                                      ...item.styles,
                                      display: 'inline-block'
                                    }}
                                  >
                                    {item.content.type === 'html' ? (
                                      <span dangerouslySetInnerHTML={{ __html: item.content.value }} />
                                    ) : item.content.type === 'image' ? (
                                      <img src={item.content.value} alt="Hottext" className="max-h-6 inline" />
                                    ) : (
                                      <span>{item.content.value}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
    );
  }
);

HottextConfiguration.displayName = "HottextConfiguration";

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
    hottextQuestions,
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

  // Generate response declarations for hottext questions
  const hottextResponseDeclarations = hottextQuestions
    .map((hottextQuestion) => {
      const correctValues = hottextQuestion.hottextItems
        .filter(item => hottextQuestion.correctAnswers.includes(item.identifier))
        .map(item => item.identifier);
        
      return `      <qti-response-declaration identifier="${hottextQuestion.responseId}" cardinality="multiple" base-type="identifier">
        <qti-correct-response>
${correctValues.map(value => `          <qti-value>${value}</qti-value>`).join('\n')}
        </qti-correct-response>
      </qti-response-declaration>`;
    })
    .join("\n");

  const allResponseDeclarations = [textEntryResponseDeclarations, mcResponseDeclarations, hottextResponseDeclarations]
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

      // Replace hottext placeholders
      hottextQuestions.forEach((hottextQuestion) => {
        let hottextContent = hottextQuestion.textContent;
        
        // Replace <hottext> tags with actual qti-hottext elements
        hottextQuestion.hottextItems.forEach(item => {
          // Handle both HTML and plain text content
          const contentValue = item.content.type === 'html' ? item.content.value : escapeXml(item.content.value);
          const hottextRegex = new RegExp(`<hottext>${escapeRegExp(item.content.value)}</hottext>`, 'g');
          hottextContent = hottextContent.replace(hottextRegex, `<qti-hottext identifier="${item.identifier}">${contentValue}</qti-hottext>`);
        });

        // Ensure proper XML structure for hottext interaction
        const hottextInteraction = `    <qti-hottext-interaction response-identifier="${hottextQuestion.responseId}"${
          hottextQuestion.maxChoices > 0 ? ` max-choices="${hottextQuestion.maxChoices}"` : ''
        }>
      <p>${hottextContent}</p>
    </qti-hottext-interaction>`;
        
        content = content.replace(hottextQuestion.placeholder, hottextInteraction);
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

  // Generate response processing based on whether we have interaction types
  const hasTextEntry = textEntryBoxes.length > 0;
  const hasMultipleChoice = multipleChoiceQuestions.length > 0;
  const hasHottext = hottextQuestions.length > 0;
  
  let responseProcessing = '';
  
  if (hasTextEntry || hasMultipleChoice || hasHottext) {
    // Custom processing for mixed interactions
    const allMatches = [];
    
    // Add text entry matches
    if (hasTextEntry) {
      allMatches.push(...textEntryBoxes.map(box => `          <qti-match>
            <qti-variable identifier="${box.responseId}"/>
            <qti-correct identifier="${box.responseId}"/>
          </qti-match>`));
    }
    
    // Add multiple choice matches
    if (hasMultipleChoice) {
      allMatches.push(...multipleChoiceQuestions.map(mcQuestion => `          <qti-match>
            <qti-variable identifier="${mcQuestion.responseId}"/>
            <qti-correct identifier="${mcQuestion.responseId}"/>
          </qti-match>`));
    }
    
    // Add hottext matches
    if (hasHottext) {
      allMatches.push(...hottextQuestions.map(hottextQuestion => `          <qti-match>
            <qti-variable identifier="${hottextQuestion.responseId}"/>
            <qti-correct identifier="${hottextQuestion.responseId}"/>
          </qti-match>`));
    }

    const totalScore = textEntryBoxes.length + multipleChoiceQuestions.length + hottextQuestions.length;
          
    responseProcessing = `  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-and>
${allMatches.join('\n')}
        </qti-and>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">${totalScore}</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>`;
  } else {
    // Use standard template if no interactions
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
  const [activeTab, setActiveTab] = useState<'question'|'feedbacks'|'textentry'|'multiplechoice'|'hottext'|'preview'>('question');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const [question, setQuestion] = useState<MixedQuestion>({
    identifier: "mixed-question-1",
    title: "Technology and Programming Quiz",
    promptBlocks: [
      {
        id: "prompt_block_1",
        type: "text",
        content: "Complete this interactive quiz about programming concepts. Fill in the blanks, select the correct options, and identify key terms. <br/><br/>Programming is a <hottext>creative</hottext> process that involves <hottext>problem-solving</hottext> and <hottext>logical thinking</hottext>. <br/><br/>What is the primary purpose of a compiler? [1] <br/><br/>Which programming paradigm emphasizes functions as first-class citizens? [MC_1] <br/><br/>The most popular version control system is [2].",
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
        id: "text_entry_1",
        responseId: "RESPONSE_1",
        expectedLength: 25,
        widthClass: "w-64",
      },
      {
        id: "text_entry_2", 
        responseId: "RESPONSE_2",
        expectedLength: 10,
        widthClass: "w-32",
      }
    ],
    multipleChoiceQuestions: [],
    hottextQuestions: [],
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
  const [xmlParserOpen, setXmlParserOpen] = useState(false);
  const [pastedXML, setPastedXML] = useState("");

  // XML Parser Function
  const parseQTIXML = useCallback((xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        alert("Invalid XML format. Please check your XML and try again.");
        return;
      }

      // Extract identifier and title
      const assessmentItem = xmlDoc.querySelector("qti-assessment-item");
      const identifier = assessmentItem?.getAttribute("identifier") || "imported-question";
      const title = assessmentItem?.getAttribute("title") || "Imported Question";

      // Extract content from qti-item-body
      const itemBody = xmlDoc.querySelector("qti-item-body");
      let extractedContent = "";
      
      if (itemBody) {
        // Extract all content including interactions
        const children = Array.from(itemBody.children);
        children.forEach((child) => {
          if (child.tagName === "qti-hottext-interaction") {
            // Convert hottext interaction back to our format
            const responseId = child.getAttribute("response-identifier") || "";
            const hottextElements = child.querySelectorAll("qti-hottext");
            let text = child.textContent || "";
            
            // Replace qti-hottext elements with our hottext format
            hottextElements.forEach((hottext) => {
              const id = hottext.getAttribute("identifier") || "";
              const content = hottext.textContent || "";
              text = text.replace(content, `<hottext>${content}</hottext>`);
            });
            
            extractedContent += `[HOTTEXT_${responseId}] `;
          } else if (child.tagName === "qti-choice-interaction") {
            const responseId = child.getAttribute("response-identifier") || "";
            extractedContent += `[MC_${responseId}] `;
          } else if (child.tagName === "qti-text-entry-interaction") {
            const responseId = child.getAttribute("response-identifier") || "";
            extractedContent += `[${responseId}] `;
          } else {
            extractedContent += child.textContent || "";
          }
        });
      }

      // Update the question state
      setQuestion(prev => ({
        ...prev,
        identifier,
        title,
        promptBlocks: [{
          id: "imported_block_1",
          type: "text",
          content: extractedContent.trim(),
          styles: {
            fontSize: "16px",
            fontFamily: "Arial, sans-serif",
            color: "#333",
            padding: "16px",
          },
          attributes: {},
        }],
        // Reset other fields - you can enhance this to parse more details
        textEntryBoxes: [],
        multipleChoiceQuestions: [],
        hottextQuestions: [],
        correctAnswers: []
      }));

      alert("XML parsed successfully! Check the Question tab to see imported content.");
      setPastedXML("");
      setXmlParserOpen(false);
      setActiveTab('question');
      
    } catch (error) {
      console.error("XML parsing error:", error);
      alert("Error parsing XML. Please check the format and try again.");
    }
  }, []);

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

  // Insert Hottext function
  const insertHottext = useCallback((blockId: string) => {
    setQuestion((prev) => {
      const blockIndex = prev.promptBlocks.findIndex(block => block.id === blockId);
      if (blockIndex === -1) return prev;

      // Create new hottext question
      const newIndex = prev.hottextQuestions.length;
      const newQuestion: HottextQuestion = {
        id: `hottext_question_${Date.now()}_${newIndex}`,
        responseId: `HOT_RESPONSE_${newIndex + 1}`,
        placeholder: `[HOT_${newIndex + 1}]`,
        maxChoices: 0, // Multiple selection allowed by default
        textContent: "Click here to edit hottext content and mark words as hottext items",
        hottextItems: [],
        correctAnswers: [],
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
        hottextQuestions: [...prev.hottextQuestions, newQuestion],
      };
    });
  }, [cursorPosition]);

  // Hottext Management Functions
  const updateHottextQuestion = useCallback((questionIndex: number, updates: Partial<HottextQuestion>) => {
    setQuestion((prev) => ({
      ...prev,
      hottextQuestions: prev.hottextQuestions.map((q, index) =>
        index === questionIndex ? { ...q, ...updates } : q
      ),
    }));
  }, []);

  // Auto-detect hottext tags and create questions
  const autoDetectHottextTags = useCallback((content: string) => {
    const hottextRegex = /<hottext>(.*?)<\/hottext>/g;
    const matches = [...content.matchAll(hottextRegex)];
    
    if (matches.length === 0) return;

    // Check if we already have a hottext question for this content
    const existingQuestion = question.hottextQuestions.find(q => 
      q.textContent === content || content.includes(q.placeholder)
    );

    if (existingQuestion) {
      // Update existing question with new hottext items
      const newItems: HottextItem[] = matches.map((match, index) => ({
        identifier: `H${index + 1}`,
        content: {
          type: "text" as const,
          value: match[1]
        },
        styles: {
          backgroundColor: "#fef3c7",
          color: "#92400e",
          padding: "2px 4px",
          borderRadius: "4px",
          cursor: "pointer"
        },
        position: { x: 0, y: 0 }
      }));

      const questionIndex = question.hottextQuestions.findIndex(q => q.id === existingQuestion.id);
      updateHottextQuestion(questionIndex, {
        textContent: content,
        hottextItems: newItems,
        correctAnswers: [] // Reset correct answers when items change
      });
    } else {
      // Create new hottext question
      const newIndex = question.hottextQuestions.length;
      const newQuestion: HottextQuestion = {
        id: `hottext_question_auto_${Date.now()}`,
        responseId: `HOT_RESPONSE_${newIndex + 1}`,
        placeholder: `[HOT_AUTO_${newIndex + 1}]`,
        maxChoices: 0,
        textContent: content,
        hottextItems: matches.map((match, index) => ({
          identifier: `H${index + 1}`,
          content: {
            type: "text" as const,
            value: match[1]
          },
          styles: {
            backgroundColor: "#fef3c7",
            color: "#92400e", 
            padding: "2px 4px",
            borderRadius: "4px",
            cursor: "pointer"
          },
          position: { x: 0, y: 0 }
        })),
        correctAnswers: []
      };

      setQuestion(prev => ({
        ...prev,
        hottextQuestions: [...prev.hottextQuestions, newQuestion]
      }));

      // Show notification
      alert(`🔥 Auto-detected ${matches.length} hottext items! Go to the Hottext tab to configure correct answers.`);
    }
  }, [question.hottextQuestions, updateHottextQuestion]);

  const removeHottextQuestion = useCallback((questionIndex: number) => {
    setQuestion((prev) => {
      const question = prev.hottextQuestions[questionIndex];
      const placeholderRegex = new RegExp(question.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g");

      return {
        ...prev,
        promptBlocks: prev.promptBlocks.map((block) => ({
          ...block,
          content: block.content.replace(placeholderRegex, ""),
        })),
        hottextQuestions: prev.hottextQuestions.filter((_, index) => index !== questionIndex),
      };
    });
  }, []);

  const addHottextItem = useCallback((questionIndex: number) => {
    setQuestion((prev) => {
      const question = prev.hottextQuestions[questionIndex];
      const newItem: HottextItem = {
        identifier: `H${question.hottextItems.length + 1}`,
        content: {
          type: "text",
          value: `hottext${question.hottextItems.length + 1}`
        },
        styles: {},
        position: { x: 0, y: 0 },
      };

      return {
        ...prev,
        hottextQuestions: prev.hottextQuestions.map((q, index) =>
          index === questionIndex
            ? { ...q, hottextItems: [...q.hottextItems, newItem] }
            : q
        ),
      };
    });
  }, []);

  const updateHottextItem = useCallback((questionIndex: number, itemIndex: number, updates: Partial<HottextItem>) => {
    setQuestion((prev) => ({
      ...prev,
      hottextQuestions: prev.hottextQuestions.map((q, qIndex) =>
        qIndex === questionIndex
          ? {
              ...q,
              hottextItems: q.hottextItems.map((item, iIndex) =>
                iIndex === itemIndex ? { ...item, ...updates } : item
              ),
            }
          : q
      ),
    }));
  }, []);

  const removeHottextItem = useCallback((questionIndex: number, itemIndex: number) => {
    setQuestion((prev) => ({
      ...prev,
      hottextQuestions: prev.hottextQuestions.map((q, qIndex) =>
        qIndex === questionIndex
          ? { ...q, hottextItems: q.hottextItems.filter((_, iIndex) => iIndex !== itemIndex) }
          : q
      ),
    }));
  }, []);

  // Example data functions
  const loadChoiceExample = useCallback(() => {
    const now = Date.now();
    setQuestion({
      identifier: "choice-example-1",
      title: "Multiple Choice Programming Quiz with HTML",
      promptBlocks: [
        {
          id: "prompt_block_1",
          type: "text",
          content: "Which programming language is known for its <strong style='color: #4f46e5;'>simplicity</strong> and <em style='color: #059669;'>readability</em>? [MC_1]",
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
      multipleChoiceQuestions: [
        {
          id: "mc_question_1",
          responseId: "MC_RESPONSE_1",
          placeholder: "[MC_1]",
          maxChoices: 1,
          shuffle: false,
          orientation: "vertical",
          createdAt: now,
          options: [
            {
              identifier: "A",
              contentBlocks: [
                {
                  id: "option_a_1",
                  type: "text",
                  content: "<span style='color: #4f46e5; font-weight: bold;'>🐍 Python</span> - Easy to learn and very readable",
                  styles: {},
                  attributes: {},
                }
              ],
              isCorrect: true,
              inlineFeedbackBlocks: [],
            },
            {
              identifier: "B", 
              contentBlocks: [
                {
                  id: "option_b_1",
                  type: "text",
                  content: "<span style='color: #dc2626; font-weight: bold;'>⚡ C++</span> - Fast but <u>complex syntax</u>",
                  styles: {},
                  attributes: {},
                }
              ],
              isCorrect: false,
              inlineFeedbackBlocks: [],
            },
            {
              identifier: "C",
              contentBlocks: [
                {
                  id: "option_c_1", 
                  type: "text",
                  content: "<span style='color: #059669; font-weight: bold;'>🔧 Assembly</span> - <small>Low-level programming</small>",
                  styles: {},
                  attributes: {},
                }
              ],
              isCorrect: false,
              inlineFeedbackBlocks: [],
            }
          ],
        }
      ],
      hottextQuestions: [],
      correctAnswers: [],
      caseSensitive: false,
      correctFeedbackBlocks: [],
      incorrectFeedbackBlocks: [],
    });
    setActiveTab('multiplechoice');
  }, []);

  const loadTextEntryExample = useCallback(() => {
    const now = Date.now();
    setQuestion({
      identifier: "textentry-example-1",
      title: "Programming Fill-in-the-Blanks with HTML",
      promptBlocks: [
        {
          id: "prompt_block_1",
          type: "text",
          content: "The most popular <strong>version control system</strong> is [1] and it was created by [2]. <br/><br/><em>Python</em> was first released in the year [3].",
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
          id: "text_entry_1",
          responseId: "RESPONSE_1",
          expectedLength: 3,
          widthClass: "w-24",
          createdAt: now,
        },
        {
          id: "text_entry_2", 
          responseId: "RESPONSE_2",
          expectedLength: 15,
          widthClass: "w-48",
          createdAt: now + 1,
        },
        {
          id: "text_entry_3", 
          responseId: "RESPONSE_3",
          expectedLength: 4,
          widthClass: "w-20",
          createdAt: now + 2,
        }
      ],
      multipleChoiceQuestions: [],
      hottextQuestions: [],
      correctAnswers: [],
      caseSensitive: false,
      correctFeedbackBlocks: [],
      incorrectFeedbackBlocks: [],
    });
    setActiveTab('textentry');
  }, []);

  const loadHottextExample = useCallback(() => {
    const now = Date.now();
    setQuestion({
      identifier: "hottext-example-1",
      title: "Interactive Hottext with Rich HTML Content",
      promptBlocks: [
        {
          id: "prompt_block_1",
          type: "text",
          content: "Programming is a <hottext>creative</hottext> process that involves <hottext><strong>problem-solving</strong></hottext> and <hottext><em>logical thinking</em></hottext>. Good programmers need <hottext>patience</hottext>, <hottext><u>attention to detail</u></hottext>, and <hottext><mark>continuous learning</mark></hottext>. <br/><br/>Select the <strong>three most important</strong> qualities:",
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
      hottextQuestions: [
        {
          id: "hottext_question_1",
          responseId: "HOT_RESPONSE_1", 
          placeholder: "[HOT_1]",
          maxChoices: 3,
          createdAt: now,
          textContent: "Programming is a <hottext>creative</hottext> process that involves <hottext><strong>problem-solving</strong></hottext> and <hottext><em>logical thinking</em></hottext>. Good programmers need <hottext>patience</hottext>, <hottext><u>attention to detail</u></hottext>, and <hottext><mark>continuous learning</mark></hottext>.",
          hottextItems: [
            {
              identifier: "H1",
              content: {
                type: "html",
                value: "creative"
              },
              styles: {
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            },
            {
              identifier: "H2",
              content: {
                type: "html", 
                value: "<strong>problem-solving</strong>"
              },
              styles: {
                backgroundColor: "#e8f5e8",
                color: "#2e7d32", 
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            },
            {
              identifier: "H3",
              content: {
                type: "html",
                value: "<em>logical thinking</em>"
              },
              styles: {
                backgroundColor: "#fff3e0",
                color: "#f57c00",
                padding: "2px 6px", 
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            },
            {
              identifier: "H4",
              content: {
                type: "text",
                value: "patience"
              },
              styles: {
                backgroundColor: "#fce4ec",
                color: "#c2185b",
                padding: "2px 6px", 
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            },
            {
              identifier: "H5",
              content: {
                type: "html",
                value: "<u>attention to detail</u>"
              },
              styles: {
                backgroundColor: "#f3e5f5",
                color: "#7b1fa2",
                padding: "2px 6px", 
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            },
            {
              identifier: "H6",
              content: {
                type: "html",
                value: "<mark>continuous learning</mark>"
              },
              styles: {
                backgroundColor: "#e0f2f1",
                color: "#00695c",
                padding: "2px 6px", 
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            }
          ],
          correctAnswers: ["H1", "H2", "H3"],
        }
      ],
      correctAnswers: [],
      caseSensitive: false,
      correctFeedbackBlocks: [],
      incorrectFeedbackBlocks: [],
    });
    setActiveTab('hottext');
  }, []);

  const loadMixedExample = useCallback(() => {
    const now = Date.now();
    setQuestion({
      identifier: "mixed-example-1",
      title: "Complete Programming Knowledge Test with Rich HTML",
      promptBlocks: [
        {
          id: "prompt_block_1",
          type: "text",
          content: "Programming is a <hottext>creative</hottext> process that involves <hottext><strong>problem-solving</strong></hottext> and <hottext><em>logical thinking</em></hottext>. <br/><br/>The most popular <u>version control system</u> is [1]. <br/><br/>Which programming paradigm emphasizes <strong>functions</strong> as first-class citizens? [MC_1] <br/><br/>The primary benefit of version control is [2].",
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
          id: "text_entry_1",
          responseId: "RESPONSE_1",
          expectedLength: 3,
          widthClass: "w-24",
          createdAt: now + 10,
        },
        {
          id: "text_entry_2", 
          responseId: "RESPONSE_2",
          expectedLength: 20,
          widthClass: "w-64",
          createdAt: now + 30,
        }
      ],
      multipleChoiceQuestions: [
        {
          id: "mc_question_1",
          responseId: "MC_RESPONSE_1",
          placeholder: "[MC_1]",
          maxChoices: 1,
          shuffle: false,
          orientation: "vertical",
          createdAt: now + 20,
          options: [
            {
              identifier: "A",
              contentBlocks: [
                {
                  id: "option_a_1",
                  type: "text",
                  content: "<span style='color: #dc2626;'>❌ Object-Oriented Programming</span>",
                  styles: {},
                  attributes: {},
                }
              ],
              isCorrect: false,
              inlineFeedbackBlocks: [],
            },
            {
              identifier: "B", 
              contentBlocks: [
                {
                  id: "option_b_1",
                  type: "text",
                  content: "<span style='color: #059669; font-weight: bold;'>✅ Functional Programming</span>",
                  styles: {},
                  attributes: {},
                }
              ],
              isCorrect: true,
              inlineFeedbackBlocks: [],
            },
            {
              identifier: "C",
              contentBlocks: [
                {
                  id: "option_c_1", 
                  type: "text",
                  content: "<span style='color: #dc2626;'>❌ Procedural Programming</span>",
                  styles: {},
                  attributes: {},
                }
              ],
              isCorrect: false,
              inlineFeedbackBlocks: [],
            }
          ],
        }
      ],
      hottextQuestions: [
        {
          id: "hottext_question_1",
          responseId: "HOT_RESPONSE_1", 
          placeholder: "[HOT_1]",
          maxChoices: 2,
          createdAt: now,
          textContent: "Programming is a <hottext>creative</hottext> process that involves <hottext><strong>problem-solving</strong></hottext> and <hottext><em>logical thinking</em></hottext>.",
          hottextItems: [
            {
              identifier: "H1",
              content: {
                type: "text",
                value: "creative"
              },
              styles: {
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            },
            {
              identifier: "H2",
              content: {
                type: "html", 
                value: "<strong>problem-solving</strong>"
              },
              styles: {
                backgroundColor: "#e8f5e8",
                color: "#2e7d32", 
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            },
            {
              identifier: "H3",
              content: {
                type: "html",
                value: "<em>logical thinking</em>"
              },
              styles: {
                backgroundColor: "#fff3e0",
                color: "#f57c00",
                padding: "2px 6px", 
                borderRadius: "4px",
                fontWeight: "bold"
              },
              position: { x: 0, y: 0 },
            }
          ],
          correctAnswers: ["H1", "H2"],
        }
      ],
      correctAnswers: [],
      caseSensitive: false,
      correctFeedbackBlocks: [],
      incorrectFeedbackBlocks: [],
    });
    setActiveTab('preview');
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Mixed Question Builder</h1>
        <Button onClick={generateXML} disabled={!question.promptBlocks.length}>
          <FileText className="w-4 h-4 mr-2" />
          Generate XML
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setXmlParserOpen(!xmlParserOpen)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Import QTI XML
        </Button>
      </div>

      {/* XML Parser Section - Collapsible */}
      {xmlParserOpen && (
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Upload className="w-5 h-5" />
              Import Existing QTI XML
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="xml-input" className="text-sm font-medium mb-2 block">
                Paste your QTI XML content here:
              </Label>
              <Textarea
                id="xml-input"
                value={pastedXML}
                onChange={(e) => setPastedXML(e.target.value)}
                placeholder="<?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?>&#10;<qti-assessment-item identifier=&quot;example&quot; title=&quot;Example&quot;>&#10;  <!-- Your QTI XML content here -->&#10;</qti-assessment-item>"
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => parseQTIXML(pastedXML)}
                disabled={!pastedXML.trim()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Parse & Import XML
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPastedXML("");
                  setXmlParserOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
            <div className="text-xs text-gray-600 bg-white p-3 rounded border">
              <strong>💡 Tip:</strong> Paste valid QTI XML with hottext, choice, or text-entry interactions. 
              The parser will extract content and convert it to our builder format.
            </div>
          </CardContent>
        </Card>
      )}

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
                variant={activeTab === 'hottext' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setActiveTab('hottext')}
              >
                Hottext ({question.hottextQuestions.length})
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
          
          {/* Examples Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Quick Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                Try these interactive examples with rich HTML content:
              </div>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3 hover:bg-blue-50"
                onClick={loadChoiceExample}
              >
                <div className="flex flex-col items-start">
                  <div className="font-medium text-blue-600">📊 Multiple Choice</div>
                  <div className="text-xs text-gray-500 mt-1">Programming quiz with styled HTML options</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3 hover:bg-green-50"
                onClick={loadTextEntryExample}
              >
                <div className="flex flex-col items-start">
                  <div className="font-medium text-green-600">✏️ Text Entry</div>
                  <div className="text-xs text-gray-500 mt-1">Fill-in-the-blanks with HTML formatting</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3 hover:bg-orange-50"
                onClick={loadHottextExample}
              >
                <div className="flex flex-col items-start">
                  <div className="font-medium text-orange-600">🖱️ Hottext Interactive</div>
                  <div className="text-xs text-gray-500 mt-1">Clickable text with rich HTML styling</div>
                </div>
              </Button>
              
              <div className="border-t pt-3 mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">🎯 Combined Example:</div>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-3 hover:bg-purple-50"
                  onClick={loadMixedExample}
                >
                  <div className="flex flex-col items-start">
                    <div className="font-medium text-purple-600">🔀 All Types Mixed</div>
                    <div className="text-xs text-gray-500 mt-1">Hottext + Multiple Choice + Text Entry with HTML</div>
                  </div>
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 italic mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded">
                💡 <strong>HTML Features:</strong> Use &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;mark&gt;, colors, and more!
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main content by tab */}
          {activeTab === 'question' && (
            <div className="space-y-6">
              {/* Question Details - Collapsible */}
              <details className="border border-gray-200 rounded-lg bg-white" open>
                <summary className="p-4 bg-gray-50 cursor-pointer text-lg font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  📝 Question Details
                  <span className="text-sm text-gray-500 font-normal">(Click to expand/collapse)</span>
                </summary>
                <div className="p-6 space-y-4">
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
                </div>
              </details>
              
              {/* Question Prompt and Preview - Collapsible */}
              <details className="border border-gray-200 rounded-lg bg-white" open>
                <summary className="p-4 bg-gray-50 cursor-pointer text-lg font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  ✏️ Question Content & Interactions
                  <span className="text-sm text-gray-500 font-normal">(Click to expand/collapse)</span>
                </summary>
                <div className="p-6">
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
                    allowHottext={true}
                    onInsertHottext={insertHottext}
                    autoDetectHottextTags={autoDetectHottextTags}
                  />
                  <QuestionPreview
                    promptBlocks={question.promptBlocks}
                    textEntryBoxes={question.textEntryBoxes}
                    multipleChoiceQuestions={question.multipleChoiceQuestions}
                    hottextQuestions={question.hottextQuestions}
                    correctAnswers={question.correctAnswers}
                    onAnswerChange={updateAnswer}
                  />
                </div>
              </details>
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
          {activeTab === 'hottext' && (
            <div className="space-y-6">
              <HottextConfiguration
                hottextQuestions={question.hottextQuestions}
                onUpdateQuestion={updateHottextQuestion}
                onRemoveQuestion={removeHottextQuestion}
                onAddItem={addHottextItem}
                onUpdateItem={updateHottextItem}
                onRemoveItem={removeHottextItem}
              />
            </div>
          )}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <QuestionPreview
                promptBlocks={question.promptBlocks}
                textEntryBoxes={question.textEntryBoxes}
                multipleChoiceQuestions={question.multipleChoiceQuestions}
                hottextQuestions={question.hottextQuestions}
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

