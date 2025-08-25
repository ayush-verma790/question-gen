"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Eye, Upload, ChevronDown, Badge } from "lucide-react";
import { ContentBlockEditor } from "@/components/content-block-editor";
import { XMLViewer } from "@/components/xml-viewer";
import { PreviewRenderer } from "@/components/preview-renderer";
import type {
  MultipleChoiceQuestion,
  MultipleChoiceOption,
  ContentBlock,
} from "@/lib/types";
import { generateMultipleChoiceXML } from "@/lib/xml-generator";

function parseMultipleChoiceXML(xmlString: string): MultipleChoiceQuestion {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Helper function to extract styles from element
  const extractStyles = (element: Element | null): Record<string, string> => {
    if (!element) return {};
    const styleAttr = element.getAttribute("style");
    const styles: Record<string, string> = {};
    if (styleAttr) {
      styleAttr.split(";").forEach((style) => {
        const [key, value] = style.split(":").map((s) => s.trim());
        if (key && value) {
          styles[key] = value;
        }
      });
    }
    return styles;
  };

  // Helper function to parse content blocks
  const parseContentBlocks = (element: Element | null): ContentBlock[] => {
    if (!element) return [];

    // If element has children, process them
    if (element.children.length > 0) {
      return Array.from(element.children).map((child) => {
        if (child.tagName.toLowerCase() === "img") {
          return {
            id: `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: "image" as const,
            content: child.getAttribute("src") || "",
            styles: extractStyles(child),
            attributes: {
              alt: child.getAttribute("alt") || "",
              width: child.getAttribute("width") || "",
              height: child.getAttribute("height") || "",
            },
          };
        } else {
          return {
            id: `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: "text" as const,
            content: child.outerHTML,
            styles: extractStyles(child),
            attributes: {},
          };
        }
      });
    }

    // For elements with direct content
    return [
      {
        id: `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: "text" as const,
        content: element.innerHTML,
        styles: extractStyles(element),
        attributes: {},
      },
    ];
  };

  // Get assessment item attributes
  const assessmentItem = xmlDoc.querySelector("qti-assessment-item");
  const identifier =
    assessmentItem?.getAttribute("identifier") || `choice-${Date.now()}`;
  const title =
    assessmentItem?.getAttribute("title") || "Multiple Choice Question";

  // Parse prompt blocks
  const promptBlocks: ContentBlock[] = [];
  const itemBody = xmlDoc.querySelector("qti-item-body");

  // Get prompt from choice interaction if it exists
  const choiceInteraction = xmlDoc.querySelector("qti-choice-interaction");
  const promptElement = choiceInteraction?.querySelector("qti-prompt");

  if (promptElement) {
    promptBlocks.push(...parseContentBlocks(promptElement));
  }

  // Get other content in item body
  const otherContent = Array.from(itemBody?.children || []).filter(
    (child) => !child.tagName.toLowerCase().includes("choice-interaction")
  );

  otherContent.forEach((element) => {
    promptBlocks.push(...parseContentBlocks(element));
  });

  // Parse choice interaction
  const maxChoices = parseInt(
    choiceInteraction?.getAttribute("max-choices") || "1"
  );
  const orientation =
    choiceInteraction?.getAttribute("orientation") === "horizontal"
      ? "horizontal"
      : "vertical";
  const shuffle = choiceInteraction?.getAttribute("shuffle") === "true";

  // Parse options
  const options: MultipleChoiceOption[] = [];
  const correctResponses = new Set(
    Array.from(xmlDoc.querySelectorAll("qti-correct-response qti-value"))
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
  );

  xmlDoc.querySelectorAll("qti-simple-choice").forEach((choice, index) => {
    const identifier =
      choice.getAttribute("identifier") || `choice_${index + 1}`;
    const isCorrect = correctResponses.has(identifier);

    options.push({
      identifier,
      contentBlocks: parseContentBlocks(choice),
      isCorrect,
      inlineFeedbackBlocks: [],
    });
  });

  // Parse feedback
  const correctFeedbackBlocks: ContentBlock[] = [];
  const incorrectFeedbackBlocks: ContentBlock[] = [];

  const correctFeedback = xmlDoc.querySelector(
    'qti-modal-feedback[identifier="CORRECT"]'
  );
  if (correctFeedback) {
    const feedbackBody = correctFeedback.querySelector("qti-content-body");
    if (feedbackBody) {
      correctFeedbackBlocks.push(...parseContentBlocks(feedbackBody));
    }
  }

  const incorrectFeedback = xmlDoc.querySelector(
    'qti-modal-feedback[identifier="INCORRECT"]'
  );
  if (incorrectFeedback) {
    const feedbackBody = incorrectFeedback.querySelector("qti-content-body");
    if (feedbackBody) {
      incorrectFeedbackBlocks.push(...parseContentBlocks(feedbackBody));
    }
  }

  return {
    identifier,
    title,
    promptBlocks,
    options,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    maxChoices,
    shuffle,
    orientation,
  };
}

export default function ChoiceBuilderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChoiceBuilder />
    </Suspense>
  );
}

function ChoiceBuilder() {
  const searchParams = useSearchParams();
  const fromXML = searchParams.get("fromXML");
  
  // Side navigation state - only one section visible at a time
  const [activeSection, setActiveSection] = useState<
    "question" | "options" | "feedback" | "preview"
  >("question");

  const switchToSection = (
    section: "question" | "options" | "feedback" | "preview"
  ) => {
    setActiveSection(section);
  };
  
  const [question, setQuestion] = useState<MultipleChoiceQuestion>({
    identifier: "choice-question-1",
    title: "Sample Multiple Choice Question",
    promptBlocks: [
      {
        id: "prompt_block_1",
        type: "text",
        content: "",
        styles: {},
        attributes: {},
      },
    ],
    options: [
     
    ],
    correctFeedbackBlocks: [
      {
        id: "correct_feedback_block",
        type: "text",
        content:
          "",
        styles: {},
        attributes: {},
      },
    ],
    incorrectFeedbackBlocks: [
      {
        id: "incorrect_feedback_block",
        type: "text",
        content:
          "",
        styles: {},
        attributes: {},
      },
    ],
    maxChoices: 1,
    shuffle: false,
    orientation: "vertical",
  });

  const [generatedXML, setGeneratedXML] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importXML, setImportXML] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  // Handle XML data from XML parser route
  useEffect(() => {
    if (fromXML === "true") {
      const parsedXML = sessionStorage.getItem("parsedXML");
      const xmlType = sessionStorage.getItem("xmlType");
      
      if (parsedXML && xmlType === "choice") {
        try {
          const parsedQuestion = parseMultipleChoiceXML(parsedXML);
          setQuestion(parsedQuestion);
          // Clear the stored data
          sessionStorage.removeItem("parsedXML");
          sessionStorage.removeItem("xmlType");
        } catch (error) {
          console.error("Error parsing XML from router:", error);
          alert("Error parsing the XML data. Please check the format.");
        }
      }
    }
  }, [fromXML]);

  useEffect(() => {
    if (
      question.identifier &&
      question.promptBlocks.length > 0 &&
      question.options.length > 0
    ) {
      const xml = generateMultipleChoiceXML(question);
      setGeneratedXML(xml);
    }
  }, [question]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedQuestion = parseMultipleChoiceXML(content);
        setQuestion(parsedQuestion);
      } catch (error) {
        console.error("Error parsing XML:", error);
        alert("Error parsing XML file. Please check the format.");
      } finally {
        setIsImporting(false);
        event.target.value = ""; // Reset file input
      }
    };
    reader.readAsText(file);
  };

  const handleImportXML = () => {
    if (!importXML.trim()) return;

    try {
      const parsedQuestion = parseMultipleChoiceXML(importXML);
      setQuestion(parsedQuestion);
      setImportXML("");
    } catch (error) {
      console.error("Error parsing XML:", error);
      alert("Invalid XML format. Please check your XML and try again.");
    }
  };

  const addOption = () => {
    const newOption: MultipleChoiceOption = {
      identifier: `choice_${question.options.length + 1}`,
      contentBlocks: [
        {
          id: `option_block_${Date.now()}`,
          type: "text",
          content: "Enter option text...",
          styles: {},
          attributes: {},
        },
      ],
      isCorrect: false,
      inlineFeedbackBlocks: [],
    };

    setQuestion((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }));
  };

  const removeOption = (identifier: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.identifier !== identifier),
    }));
  };

  const toggleCorrect = (identifier: string) => {
    setQuestion((prev) => {
      // Count how many correct answers we currently have
      const currentCorrectCount = prev.options.filter(opt => opt.isCorrect).length;
      const targetOption = prev.options.find(opt => opt.identifier === identifier);

      // If we're unchecking, always allow it
      if (targetOption?.isCorrect) {
        return {
          ...prev,
          options: prev.options.map(opt =>
            opt.identifier === identifier ? { ...opt, isCorrect: false } : opt
          )
        };
      }

      // If we're checking and already at max choices, prevent it
      if (currentCorrectCount >= prev.maxChoices) {
        alert(`You can only select up to ${prev.maxChoices} correct answer${prev.maxChoices > 1 ? 's' : ''}`);
        return prev;
      }

      // Apply the changes
      return {
        ...prev,
        options: prev.options.map(opt => {
          if (opt.identifier === identifier) {
            return { ...opt, isCorrect: true };
          }
          // Only clear other selections if it's single choice
          if (prev.maxChoices === 1) {
            return { ...opt, isCorrect: false };
          }
          return opt;
        })
      };
    });
  };

  const updateOptionBlocks = (identifier: string, blocks: ContentBlock[]) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.identifier === identifier ? { ...opt, contentBlocks: blocks } : opt
      ),
    }));
  };

  const updateOptionFeedbackBlocks = (
    identifier: string,
    blocks: ContentBlock[]
  ) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.identifier === identifier
          ? { ...opt, inlineFeedbackBlocks: blocks }
          : opt
      ),
    }));
  };

  const getQuestionType = () => {
    if (question.maxChoices === 1) return "Single Choice";
    if (question.maxChoices === question.options.length)
      return "Multiple Choice (All)";
    return `Multiple Choice (Max ${question.maxChoices})`;
  };

  const renderContentBlocks = (blocks: ContentBlock[]) => {
    return blocks.map((block) => {
      const style = {
        fontSize: block.styles.fontSize,
        fontFamily: block.styles.fontFamily,
        color: block.styles.color,
        backgroundColor: block.styles.backgroundColor,
        padding: block.styles.padding,
        margin: block.styles.margin,
        borderRadius: block.styles.borderRadius,
        border: block.styles.border,
        boxShadow: block.styles.boxShadow,
        textAlign: block.styles.textAlign,
        width: block.styles.width,
        height: block.styles.height,
        fontWeight: block.styles.fontWeight,
        fontStyle: block.styles.fontStyle,
        textDecoration: block.styles.textDecoration,
        lineHeight: block.styles.lineHeight,
        letterSpacing: block.styles.letterSpacing,
        textTransform: block.styles.textTransform,
      };

      switch (block.type) {
        case "text":
          return (
            <div key={block.id} style={style as any}>
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
          );
        case "image":
          return (
            <img
              key={block.id}
              src={
                block.content ||
                "/placeholder.svg?height=200&width=300&text=Image"
              }
              alt={block.attributes?.alt || "Image"}
              style={style as any}
              width={block.attributes?.width}
              height={block.attributes?.height}
            />
          );
        case "video":
          return (
            <video
              key={block.id}
              src={block.content}
              style={style as any}
              width={block.attributes?.width}
              height={block.attributes?.height}
              controls={block.attributes?.controls}
              autoPlay={block.attributes?.autoplay}
              loop={block.attributes?.loop}
            />
          );
        case "audio":
          return (
            <audio
              key={block.id}
              src={block.content}
              style={style as any}
              controls={block.attributes?.controls}
              autoPlay={block.attributes?.autoplay}
              loop={block.attributes?.loop}
            />
          );
        case "html":
          return (
            <div
              key={block.id}
              style={style as any}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Compact Vertical Tab Buttons - Left Side */}
        <div className="w-56 flex-shrink-0 pr-6 position: static;">
          <div className="flex flex-col gap-2">
            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeSection === "question"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => switchToSection("question")}
            >
              Question
            </button>
            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeSection === "options"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => switchToSection("options")}
            >
              Options
            </button>
            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeSection === "feedback"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => switchToSection("feedback")}
            >
              Feedback
            </button>
            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeSection === "preview"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => switchToSection("preview")}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Multiple Choice Question Builder
            </h1>
            <p className="text-gray-600">
              Create single or multiple choice questions with rich multimedia
              content
            </p>
          </div>
          <div className="w-full space-y-6">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import QTI XML
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card>
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="import-xml">Paste your QTI XML here</Label>
                      <textarea
                        id="import-xml"
                        value={importXML}
                        onChange={(e) => setImportXML(e.target.value)}
                        placeholder="Paste your QTI XML content here..."
                        className="w-full h-40 p-2 border rounded-md font-mono text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={handleImportXML}
                        disabled={!importXML.trim() || isImporting}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isImporting ? "Importing..." : "Import XML"}
                      </Button>
                      <Label htmlFor="xml-upload" className="cursor-pointer">
                        <Button variant="outline" disabled={isImporting}>
                          <Upload className="w-4 h-4 mr-2" />
                          {isImporting ? "Importing..." : "Upload XML File"}
                        </Button>
                      </Label>
                      <Input
                        id="xml-upload"
                        type="file"
                        accept=".xml"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isImporting}
                      />
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {activeSection === "question" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Question Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* <div>
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
                        placeholder="e.g., choice-question-1"
                      />
                    </div> */}
                    {/* <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={question.title}
                        onChange={(e) =>
                          setQuestion((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Question title"
                      />
                    </div> */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Max Choices</Label>
                        <Input
                          type="number"
                          min="1"
                          value={question.maxChoices}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value);
                            if (value === "") {
                              setQuestion(prev => ({ ...prev, maxChoices: 1 }));
                            } else if (!isNaN(numValue) && numValue >= 1) {
                              setQuestion(prev => ({ ...prev, maxChoices: numValue }));
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label>Orientation</Label>
                        <Select
                          value={question.orientation}
                          onValueChange={(value: "vertical" | "horizontal") =>
                            setQuestion((prev) => ({ ...prev, orientation: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vertical">Vertical</SelectItem>
                            <SelectItem value="horizontal">Horizontal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={question.shuffle}
                            onCheckedChange={(checked) =>
                              setQuestion((prev) => ({ ...prev, shuffle: !!checked }))
                            }
                          />
                          <span>Shuffle</span>
                        </label>
                      </div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <strong>Type:</strong> {getQuestionType()}
                    </div>
                  </CardContent>
                </Card>

                <ContentBlockEditor
                  blocks={question.promptBlocks}
                  onChange={(blocks) =>
                    setQuestion((prev) => ({ ...prev, promptBlocks: blocks }))
                  }
                  title="Question Prompt"
                />
              </>
            )}

            {activeSection === "options" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Answer Options
                    <Button onClick={addOption}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {question.options.map((option) => (
                    <Card
                      key={option.identifier}
                      className={`p-4 ${
                        option.isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={option.isCorrect}
                              onCheckedChange={() =>
                                toggleCorrect(option.identifier)
                              }
                            />
                            <Label className="font-medium">
                              Option {option.identifier}
                            </Label>
                          </div>
                        <div className="border border-1-green p-2 rounded-md bg-green-300">
{`Choice Item: ${option.identifier.replace("choice_", "")}`

}
                        </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(option.identifier)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <ContentBlockEditor
                          blocks={option.contentBlocks}
                          onChange={(blocks) =>
                            updateOptionBlocks(option.identifier, blocks)
                          }
                          title="Option Content"
                        />

                        {/* <ContentBlockEditor
                          blocks={option.inlineFeedbackBlocks}
                          onChange={(blocks) =>
                            updateOptionFeedbackBlocks(option.identifier, blocks)
                          }
                          title="Inline Feedback (Optional)"
                        /> */}
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeSection === "feedback" && (
              <>
                {/* <ContentBlockEditor
                  blocks={question.correctFeedbackBlocks}
                  onChange={(blocks) =>
                    setQuestion((prev) => ({
                      ...prev,
                      correctFeedbackBlocks: blocks,
                    }))
                  }
                  title="Correct Answer Feedback"
                /> */}

                <ContentBlockEditor
                  blocks={question.incorrectFeedbackBlocks}
                  onChange={(blocks) =>
                    setQuestion((prev) => ({
                      ...prev,
                      incorrectFeedbackBlocks: blocks,
                    }))
                  }
                  title="Incorrect Answer Feedback"
                />
              </>
            )}

            {activeSection === "preview" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {question.promptBlocks.length > 0 &&
                    question.options.length > 0 ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded bg-white">
                          <div className="mb-4">
                            {renderContentBlocks(question.promptBlocks)}
                          </div>
                          <div
                            className={`space-y-2 ${
                              question.orientation === "horizontal"
                                ? "flex flex-wrap gap-4"
                                : ""
                            }`}
                          >
                            {question.options.map((option) => (
                              <div
                                key={option.identifier}
                                className={`flex items-start gap-2 p-3 rounded border ${
                                  option.isCorrect
                                    ? "bg-green-100 border-green-300"
                                    : "bg-gray-50"
                                } ${
                                  question.orientation === "horizontal"
                                    ? "flex-1 min-w-[200px]"
                                    : ""
                                }`}
                              >
                                <input
                                  type={
                                    question.maxChoices === 1 ? "radio" : "checkbox"
                                  }
                                  name="preview"
                                  disabled
                                  checked={option.isCorrect}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div>
                                    {renderContentBlocks(option.contentBlocks)}
                                  </div>
                                  {option.inlineFeedbackBlocks.length > 0 && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm border-l-4 border-blue-300">
                                      <strong>Feedback:</strong>
                                      <div>
                                        {renderContentBlocks(
                                          option.inlineFeedbackBlocks
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Correct answers:</strong>{" "}
                            {question.options
                              .filter((opt) => opt.isCorrect)
                              .map((opt) => opt.identifier)
                              .join(", ") || "None selected"}
                          </p>
                          <p>
                            <strong>Question type:</strong> {getQuestionType()}
                          </p>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowFeedback(!showFeedback)}
                          >
                            {showFeedback ? "Hide Feedback" : "Show Feedback"}
                          </Button>
                        </div>
                        {showFeedback && (
                          <div className="mt-4 space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded">
                              <h3 className="font-bold mb-2">
                                Correct Answer Feedback
                              </h3>
                              {question.correctFeedbackBlocks.length > 0 ? (
                                renderContentBlocks(question.correctFeedbackBlocks)
                              ) : (
                                <p className="text-gray-500">
                                  No feedback configured
                                </p>
                              )}
                            </div>
                            <div className="p-4 bg-red-50 border border-red-200 rounded">
                              <h3 className="font-bold mb-2">
                                Incorrect Answer Feedback
                              </h3>
                              {question.incorrectFeedbackBlocks.length > 0 ? (
                                renderContentBlocks(question.incorrectFeedbackBlocks)
                              ) : (
                                <p className="text-gray-500">
                                  No feedback configured
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Add question content and options to see preview
                      </p>
                    )}
                  </CardContent>
                </Card>

                <PreviewRenderer
                  xmlContent={generatedXML}
                  questionType="choice"
                  disabled={!generatedXML}
                />

                {generatedXML && (
                  <XMLViewer
                    xml={generatedXML}
                    filename={`${question.identifier || "choice-question"}.xml`}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}