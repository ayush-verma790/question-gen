"use client";

import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Eye, TextCursorInput } from "lucide-react";

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
                    <div className="flex items-center gap-2">
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
                  <textarea
                    value={block.content}
                    placeholder="Enter text content here [1]"
                    onChange={(e) =>
                      updateBlock(index, { ...block, content: e.target.value })
                    }
                    className="w-full min-h-[100px] border p-2 rounded bg-white"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    You can use HTML tags like &lt;br&gt;, &lt;strong&gt;, etc.
                    in the content.
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

// Main Component
export default function TextEntryBuilderPage() {
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
              expectedLength: 20,
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
