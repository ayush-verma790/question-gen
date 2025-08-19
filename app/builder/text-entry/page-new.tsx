"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Trash2,
  Plus,
  Eye,
  TextCursorInput,
  Upload,
  FileText,
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

// Types
type ContentBlock = {
  id: string;
  type: "text" | "image" | "video" | "audio";
  content: string;
  styles: Record<string, string>;
  attributes?: Record<string, string>;
};

type Question = {
  id: string;
  title: string;
  prompt: string;
  blocks: ContentBlock[];
  correctAnswers: { id: string; content: string }[];
  feedback: {
    correct: string;
    incorrect: string;
  };
  scoring: {
    points: number;
    partial: boolean;
  };
};

export default function TextEntryBuilder() {
  // Question state
  const [question, setQuestion] = useState<Question>({
    id: "text-entry-1",
    title: "Text Entry Question",
    prompt: "Enter your answer in the text field below.",
    blocks: [
      {
        id: "block-1",
        type: "text",
        content: "",
        styles: {},
      },
    ],
    correctAnswers: [{ id: "answer-1", content: "" }],
    feedback: {
      correct: "Correct! Well done.",
      incorrect: "Incorrect. Please try again.",
    },
    scoring: {
      points: 1,
      partial: false,
    },
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);

  // Refs
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Helper function to update a block
  const updateBlock = useCallback((index: number, updates: Partial<ContentBlock>) => {
    setQuestion(prev => ({
      ...prev,
      blocks: prev.blocks.map((block, i) => 
        i === index ? { ...block, ...updates } : block
      )
    }));
  }, []);

  // Add new block
  const addBlock = useCallback(() => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: "text",
      content: "",
      styles: {},
    };
    
    setQuestion(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  }, []);

  // Remove block
  const removeBlock = useCallback((index: number) => {
    if (question.blocks.length > 1) {
      setQuestion(prev => ({
        ...prev,
        blocks: prev.blocks.filter((_, i) => i !== index)
      }));
      
      if (activeBlockIndex === index) {
        setActiveBlockIndex(null);
      }
    }
  }, [question.blocks.length, activeBlockIndex]);

  // Handle textarea focus
  const handleTextareaFocus = useCallback((index: number) => {
    setActiveBlockIndex(index);
  }, []);

  // Simple and reliable tag insertion function
  const insertTag = useCallback((tag: string, attributes: string = "") => {
    if (activeBlockIndex === null) return;

    const textarea = textareaRefs.current[activeBlockIndex];
    if (!textarea) return;

    const block = question.blocks[activeBlockIndex];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = block.content.substring(start, end);

    let tagToInsert = "";
    let newCursorPos = start;

    // Self-closing tags
    const selfClosingTags = ['br', 'hr', 'img', 'input'];
    const isSelfClosing = selfClosingTags.includes(tag);

    if (isSelfClosing) {
      // Always insert self-closing tags at cursor position
      tagToInsert = attributes ? `<${tag} ${attributes} />` : `<${tag} />`;
      newCursorPos = start + tagToInsert.length;
    } else if (start === end) {
      // No selection - insert empty tag pair
      const openTag = attributes ? `<${tag} ${attributes}>` : `<${tag}>`;
      const closeTag = `</${tag}>`;
      tagToInsert = openTag + closeTag;
      newCursorPos = start + openTag.length; // Cursor between tags
    } else {
      // Has selection - only wrap if it's plain text (no HTML)
      const isPlainText = !selectedText.includes('<') || !selectedText.includes('>');
      
      if (isPlainText) {
        // Wrap plain text
        const openTag = attributes ? `<${tag} ${attributes}>` : `<${tag}>`;
        const closeTag = `</${tag}>`;
        tagToInsert = openTag + selectedText + closeTag;
        newCursorPos = start + tagToInsert.length;
      } else {
        // Don't wrap HTML - insert at start of selection
        const openTag = attributes ? `<${tag} ${attributes}>` : `<${tag}>`;
        const closeTag = `</${tag}>`;
        tagToInsert = openTag + closeTag;
        newCursorPos = start + tagToInsert.length;
      }
    }

    // Update content
    const before = block.content.substring(0, start);
    const after = block.content.substring(start === end ? start : (selectedText.includes('<') ? start : end));
    const newContent = before + tagToInsert + after;

    updateBlock(activeBlockIndex, { content: newContent });

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  }, [activeBlockIndex, question.blocks, updateBlock]);

  // Handle media insertion
  const handleInsertMedia = useCallback(() => {
    if (activeBlockIndex === null) return;

    let attributes = "";
    switch (mediaType) {
      case "image":
        attributes = `src="${mediaUrl}" alt="${mediaAlt}" class="max-w-full h-auto" width="40%" height="auto"`;
        insertTag("img", attributes);
        break;
      case "video":
        attributes = `src="${mediaUrl}" controls class="max-w-full"`;
        insertTag("video", attributes);
        break;
      case "audio":
        attributes = `src="${mediaUrl}" controls`;
        insertTag("audio", attributes);
        break;
    }

    setShowMediaModal(false);
    setMediaUrl("");
    setMediaAlt("");
  }, [activeBlockIndex, mediaType, mediaUrl, mediaAlt, insertTag]);

  // Add correct answer
  const addCorrectAnswer = useCallback(() => {
    setQuestion(prev => ({
      ...prev,
      correctAnswers: [
        ...prev.correctAnswers,
        { id: `answer-${Date.now()}`, content: "" }
      ]
    }));
  }, []);

  // Remove correct answer
  const removeCorrectAnswer = useCallback((index: number) => {
    if (question.correctAnswers.length > 1) {
      setQuestion(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers.filter((_, i) => i !== index)
      }));
    }
  }, [question.correctAnswers.length]);

  // Generate XML
  const generateXML = useCallback(() => {
    const textEntryXML = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${question.id}"
                title="${question.title}"
                adaptive="false"
                timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">
    <correctResponse>
      <value>${question.correctAnswers[0]?.content || ""}</value>
    </correctResponse>
  </responseDeclaration>
  
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  
  <itemBody>
    <div class="prompt">
      <p>${question.prompt}</p>
    </div>
    
    <div class="content-blocks">
      ${question.blocks.map(block => {
        if (block.type === "text" && block.content) {
          return `<div class="content-block">${block.content}</div>`;
        }
        return "";
      }).join("\n      ")}
    </div>
    
    <div class="interaction">
      <textEntryInteraction responseIdentifier="RESPONSE" expectedLength="100" />
    </div>
  </itemBody>
  
  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>
</assessmentItem>`;

    return textEntryXML;
  }, [question]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "builder" ? "default" : "outline"}
                onClick={() => setActiveTab("builder")}
              >
                <TextCursorInput className="w-4 h-4 mr-2" />
                Builder
              </Button>
              <Button
                variant={activeTab === "preview" ? "default" : "outline"}
                onClick={() => setActiveTab("preview")}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>

          {activeTab === "builder" && (
            <div className="space-y-6">
              {/* Question Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Question Title</Label>
                    <Input
                      id="title"
                      value={question.title}
                      onChange={(e) => setQuestion(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter question title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prompt">Question Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={question.prompt}
                      onChange={(e) => setQuestion(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Enter question prompt"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Blocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {question.blocks.map((block, index) => (
                      <div key={block.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`block-${index}`}>Block {index + 1}</Label>
                          {question.blocks.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeBlock(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Formatting Toolbar */}
                        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("strong")}
                            title="Bold"
                          >
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("em")}
                            title="Italic"
                          >
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("u")}
                            title="Underline"
                          >
                            <Underline className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("h1")}
                            title="Heading 1"
                          >
                            <Heading1 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("h2")}
                            title="Heading 2"
                          >
                            <Heading2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("p")}
                            title="Paragraph"
                          >
                            <Pilcrow className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("br")}
                            title="Line Break"
                          >
                            <Type className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("ul")}
                            title="Unordered List"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("ol")}
                            title="Ordered List"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("li")}
                            title="List Item"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => insertTag("a", 'href="#"')}
                            title="Link"
                          >
                            <Link className="w-4 h-4" />
                          </Button>

                          {/* Media Buttons */}
                          <div className="border-l pl-2 ml-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMediaType("image");
                                setShowMediaModal(true);
                              }}
                              title="Insert Image"
                            >
                              <Image className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMediaType("video");
                                setShowMediaModal(true);
                              }}
                              title="Insert Video"
                            >
                              <Video className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMediaType("audio");
                                setShowMediaModal(true);
                              }}
                              title="Insert Audio"
                            >
                              <Music className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <Textarea
                          ref={(el) => {
                            textareaRefs.current[index] = el;
                          }}
                          id={`block-${index}`}
                          value={block.content}
                          onChange={(e) => updateBlock(index, { content: e.target.value })}
                          onFocus={() => handleTextareaFocus(index)}
                          placeholder="Enter content with HTML tags..."
                          rows={6}
                          className="font-mono text-sm"
                        />

                        {/* Preview */}
                        <div className="p-3 bg-gray-50 rounded border">
                          <div className="text-xs text-gray-500 mb-2">Preview:</div>
                          <div dangerouslySetInnerHTML={{ __html: block.content }} />
                        </div>
                      </div>
                    ))}

                    <Button onClick={addBlock} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Content Block
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Correct Answers */}
              <Card>
                <CardHeader>
                  <CardTitle>Correct Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {question.correctAnswers.map((answer, index) => (
                      <div key={answer.id} className="flex gap-2">
                        <Input
                          value={answer.content}
                          onChange={(e) => {
                            setQuestion(prev => ({
                              ...prev,
                              correctAnswers: prev.correctAnswers.map((ans, i) =>
                                i === index ? { ...ans, content: e.target.value } : ans
                              )
                            }));
                          }}
                          placeholder={`Correct answer ${index + 1}`}
                          className="flex-1"
                        />
                        {question.correctAnswers.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCorrectAnswer(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button onClick={addCorrectAnswer} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Answer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="correct-feedback">Correct Feedback</Label>
                    <Textarea
                      id="correct-feedback"
                      value={question.feedback.correct}
                      onChange={(e) => setQuestion(prev => ({
                        ...prev,
                        feedback: { ...prev.feedback, correct: e.target.value }
                      }))}
                      placeholder="Feedback for correct answers"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="incorrect-feedback">Incorrect Feedback</Label>
                    <Textarea
                      id="incorrect-feedback"
                      value={question.feedback.incorrect}
                      onChange={(e) => setQuestion(prev => ({
                        ...prev,
                        feedback: { ...prev.feedback, incorrect: e.target.value }
                      }))}
                      placeholder="Feedback for incorrect answers"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "preview" && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
                    <p className="mb-4">{question.prompt}</p>
                  </div>

                  <div className="space-y-3">
                    {question.blocks.map((block, index) => (
                      <div key={block.id} className="p-3 border rounded">
                        <div dangerouslySetInnerHTML={{ __html: block.content }} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="preview-input">Your Answer:</Label>
                    <Input
                      id="preview-input"
                      placeholder="Type your answer here..."
                      className="mt-2"
                    />
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium mb-2">Expected Answers:</h4>
                    <ul className="list-disc list-inside">
                      {question.correctAnswers.map((answer, index) => (
                        <li key={answer.id}>{answer.content}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* XML Output Sidebar */}
        <div className="w-80">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>XML Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-3 rounded max-h-96 overflow-auto">
                {generateXML()}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Media Modal */}
      <Dialog open={showMediaModal} onOpenChange={setShowMediaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="media-url">URL</Label>
              <Input
                id="media-url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={`Enter ${mediaType} URL`}
              />
            </div>
            {mediaType === "image" && (
              <div>
                <Label htmlFor="media-alt">Alt Text</Label>
                <Input
                  id="media-alt"
                  value={mediaAlt}
                  onChange={(e) => setMediaAlt(e.target.value)}
                  placeholder="Enter alt text for accessibility"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMediaModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleInsertMedia}>
                Insert {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
