"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Plus,
  Eye,
  Edit,
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  Video,
  FileText,
  Upload,
  Palette,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Settings,
  Menu,
  HelpCircle,
  Layers,
} from "lucide-react";
import { ContentBlockEditor } from "@/components/content-block-editor";
import { XMLViewer } from "@/components/xml-viewer";
import { PreviewRenderer } from "@/components/preview-renderer";
import { AdvancedColorPicker } from "@/components/advanced-color-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ButtonSuggestions } from "@/components/button-suggestions";
import type { HottextQuestion, HottextItem, ContentBlock } from "@/lib/types";
import { generateHottextXML } from "@/lib/xml-generator";
import {
  ButtonStylePresets,
  QuickStylePresets,
  buttonStylePresets,
  generateButtonHTML,
  type ButtonStylePreset,
} from "@/components/button-style-presets";

function parseHottextXML(xmlString: string): HottextQuestion {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Check for parse errors
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`XML Parse Error: ${parseError.textContent}`);
  }

  // Helper function to extract styles from element
  const extractStyles = (element: Element): Record<string, string> => {
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

  // Get assessment item attributes
  const assessmentItem = xmlDoc.querySelector("qti-assessment-item");
  if (!assessmentItem) {
    throw new Error("No qti-assessment-item element found in XML");
  }

  const identifier =
    assessmentItem?.getAttribute("identifier") || `hottext-${Date.now()}`;
  const title = assessmentItem?.getAttribute("title") || "Hottext Question";

  // Parse prompt blocks
  const promptBlocks: ContentBlock[] = [];
  const itemBody = xmlDoc.querySelector("qti-item-body");
  const hottextInteraction = xmlDoc.querySelector("qti-hottext-interaction");

  // Try to get prompt from qti-prompt element
  const qtiPrompt = hottextInteraction?.querySelector("qti-prompt");
  if (qtiPrompt) {
    promptBlocks.push({
      id: `prompt_text_${Date.now()}`,
      type: "text",
      content: `<p>${qtiPrompt.textContent || ""}</p>`,
      styles: {},
      attributes: {},
    });
  }

  // Also check for paragraph content within the interaction (like your XML structure)
  const paragraphs = hottextInteraction?.querySelectorAll("p");
  paragraphs?.forEach((p, index) => {
    // Clone the paragraph and remove hottext elements to get the surrounding text
    const pClone = p.cloneNode(true) as Element;
    const hottextElements = pClone.querySelectorAll("qti-hottext");
    hottextElements.forEach((ht) => {
      ht.replaceWith(
        document.createTextNode(`[${ht.getAttribute("identifier")}]`)
      );
    });

    const contextText = pClone.textContent || "";
    if (contextText.trim()) {
      promptBlocks.push({
        id: `prompt_context_${Date.now()}_${index}`,
        type: "text",
        content: `<p>${contextText}</p>`,
        styles: {},
        attributes: {},
      });
    }
  });

  // Fallback to looking for div in item body if no prompt found yet
  if (promptBlocks.length === 0) {
    const promptDiv = itemBody?.querySelector("div");
    if (promptDiv) {
      const promptText = promptDiv.childNodes[0]?.textContent?.trim() || "";
      const promptImage = promptDiv.querySelector("img");

      if (promptText) {
        promptBlocks.push({
          id: `prompt_text_${Date.now()}`,
          type: "text",
          content: `<p>${promptText}</p>`,
          styles: extractStyles(promptDiv),
          attributes: {},
        });
      }

      if (promptImage) {
        promptBlocks.push({
          id: `prompt_image_${Date.now()}`,
          type: "image",
          content: promptImage.getAttribute("src") || "",
          styles: {
            width: promptImage.getAttribute("width") || "500px",
            margin: "8px 0",
          },
          attributes: {
            alt: promptImage.getAttribute("alt") || "Question Image",
            width: promptImage.getAttribute("width") || "500",
            height: promptImage.getAttribute("height") || "auto",
          },
        });
      }
    }
  }

  // Parse hottext items
  const hottextItems: HottextItem[] = [];
  const maxChoices = parseInt(
    hottextInteraction?.getAttribute("max-choices") || "0"
  );

  hottextInteraction
    ?.querySelectorAll("qti-hottext")
    .forEach((hottext, index) => {
      const identifier = hottext.getAttribute("identifier") || `HT${index + 1}`;
      let content = "";
      let styles: Record<string, string> = {};

      // Try to find span first, then fallback to direct text content
      const span = hottext.querySelector("span");
      if (span) {
        content = span.textContent || "";
        styles = extractStyles(span);
      } else {
        // Direct text content (like in your XML)
        content = hottext.textContent || "";
        styles = extractStyles(hottext);
      }

      if (content.trim()) {
        hottextItems.push({
          identifier,
          content: {
            type: "text",
            value: content.trim(),
          },
          styles: {
            display: styles.display || "inline-block",
            backgroundColor: styles.backgroundColor || "#a94400",
            color: styles.color || "white",
            fontSize: styles.fontSize || "28px",
            width: styles.width || "60px",
            height: styles.height || "60px",
            borderRadius: styles.borderRadius || "10px",
            textAlign:
              styles.textAlign === "center" ||
              styles.textAlign === "left" ||
              styles.textAlign === "right"
                ? styles.textAlign
                : "center",
            lineHeight: styles.lineHeight || "60px",
            padding: styles.padding || "0px",
            margin: styles.margin || "10px",
            border: styles.border || "none",
            boxShadow: styles.boxShadow || "0 2px 4px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
          },
          position: { x: 0, y: 0 },
        });
      }
    });

  // Parse correct answers
  const correctAnswers: string[] = [];
  xmlDoc.querySelectorAll("qti-correct-response qti-value").forEach((value) => {
    const answer = value.textContent?.trim();
    if (answer) correctAnswers.push(answer);
  });

  // Parse feedback blocks
  const correctFeedbackBlocks: ContentBlock[] = [];
  const incorrectFeedbackBlocks: ContentBlock[] = [];

  const correctFeedback = xmlDoc.querySelector(
    'qti-modal-feedback[identifier="CORRECT"]'
  );
  if (correctFeedback) {
    const feedbackBody = correctFeedback.querySelector("qti-content-body div");
    if (feedbackBody) {
      const text = feedbackBody.querySelector("p")?.outerHTML || "";
      const image = feedbackBody.querySelector("img");

      if (text) {
        correctFeedbackBlocks.push({
          id: `correct_feedback_text_${Date.now()}`,
          type: "text",
          content: text,
          styles: extractStyles(feedbackBody),
          attributes: {},
        });
      }

      if (image) {
        correctFeedbackBlocks.push({
          id: `correct_feedback_image_${Date.now()}`,
          type: "image",
          content: image.getAttribute("src") || "",
          styles: {
            width: image.getAttribute("width") || "400px",
            margin: "8px 0",
          },
          attributes: {
            alt: image.getAttribute("alt") || "Feedback Image",
            width: image.getAttribute("width") || "400",
            height: image.getAttribute("height") || "auto",
          },
        });
      }
    }
  }

  const incorrectFeedback = xmlDoc.querySelector(
    'qti-modal-feedback[identifier="INCORRECT"]'
  );
  if (incorrectFeedback) {
    const feedbackBody = incorrectFeedback.querySelector(
      "qti-content-body div"
    );
    if (feedbackBody) {
      incorrectFeedbackBlocks.push({
        id: `incorrect_feedback_${Date.now()}`,
        type: "text",
        content: feedbackBody.innerHTML,
        styles: extractStyles(feedbackBody),
        attributes: {},
      });
    }
  }

  // Extract global styles from item body
  const globalStyles = {
    fontFamily: "'Canva Sans', sans-serif",
    fontSize: "22px",
    backgroundColor: "",
    padding: "",
    borderRadius: "",
    boxShadow: "",
  };

  return {
    identifier,
    title,
    promptBlocks,
    contentBlocks: [],
    hottextItems,
    correctAnswers,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    maxChoices: maxChoices || hottextItems.length, // Default to allow all items if not specified
    globalStyles,
    customCSS: "",
  };
}

export default function HottextBuilderPage() {
  const [question, setQuestion] = useState<HottextQuestion>({
    identifier: "xml-hottext-item-1",
    title: "Identify the Pencil",
    promptBlocks: [
      // {
      //   id: "prompt_block_1",
      //   type: "text",
      //   content:
      //     "<div style='font-size: 22px; font-family: Canva Sans; color: #000000; padding: 8px; margin: 4px; border-radius: 0px; border: none; box-shadow: none; text-align: left'>How many dragons are there?</div>",
      //   styles: {
      //     fontSize: "22px",
      //     fontFamily: "Canva Sans",
      //     color: "#000000",
      //     backgroundColor: "transparent",
      //     padding: "8px",
      //     margin: "4px",
      //     borderRadius: "0px",
      //     border: "none",
      //     boxShadow: "none",
      //     textAlign: "left",
      //   },
      //   attributes: {},
      // },
      // {
      //   id: "prompt_block_2",
      //   type: "image",
      //   content:
      //     "https://i.postimg.cc/vTqDQbkV/Screenshot-2025-07-28-at-8-04-30-PM.png",
      //   styles: {
      //     padding: "8px",
      //     margin: "4px",
      //     borderRadius: "0px",
      //     border: "none",
      //     boxShadow: "none",
      //     width: "500px",
      //   },
      //   attributes: {
      //     alt: "Dragon counting image",
      //     width: "500",
      //     height: "300",
      //   },
      // },
      {
        id: "prompt_block_default",
        type: "text",
        content: "",
        styles: {},
        attributes: {},
      },
    ],
    contentBlocks: [],
    hottextItems: [
      // {
      //   identifier: "BTN1",
      //   content: {
      //     type: "text",
      //     value: "",
      //   },
      //   styles: {
      //     display: "inline-block",
      //     backgroundColor: "",
      //     color: "",
      //     fontSize: "",
      //     width: "",
      //     height: "",
      //     borderRadius: "",
      //     textAlign: "center",
      //     lineHeight: "",
      //     padding: "0px",
      //     margin: "0px",
      //     border: "none",
      //     boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      //     transition: "all 0.3s ease",
      //   },
      //   position: { x: 0, y: 0 },
      // },
      // {
      //   identifier: "BTN2",
      //   content: {
      //     type: "text",
      //     value: "4",
      //   },
      //   styles: {
      //     display: "inline-block",
      //     backgroundColor: "#a94400",
      //     color: "white",
      //     fontSize: "28px",
      //     width: "60px",
      //     height: "60px",
      //     borderRadius: "10px",
      //     textAlign: "center",
      //     lineHeight: "60px",
      //     padding: "0px",
      //     margin: "10px",
      //     border: "none",
      //     boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      //     transition: "all 0.3s ease",
      //   },
      //   position: { x: 0, y: 0 },
      // },
      // {
      //   identifier: "BTN3",
      //   content: {
      //     type: "text",
      //     value: "3",
      //   },
      //   styles: {
      //     display: "inline-block",
      //     backgroundColor: "#a94400",
      //     color: "white",
      //     fontSize: "28px",
      //     width: "60px",
      //     height: "60px",
      //     borderRadius: "10px",
      //     textAlign: "center",
      //     lineHeight: "60px",
      //     padding: "0px",
      //     margin: "10px",
      //     border: "none",
      //     boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      //     transition: "all 0.3s ease",
      //   },
      //   position: { x: 0, y: 0 },
      // },
    ],
    correctAnswers: [],
    correctFeedbackBlocks: [
      // {
      //   id: "correct_feedback_block_1",
      //   type: "text",
      //   content:
      //     "<div style='font-size: 22px; font-family: Glacial Indifference; color: #27c94c; padding: 8px; margin: 4px; border-radius: 0px; border: none; box-shadow: none; text-align: left'>That's correct!</div>",
      //   styles: {
      //     fontSize: "22px",
      //     fontFamily: "Glacial Indifference",
      //     color: "#27c94c",
      //     backgroundColor: "transparent",
      //     padding: "8px",
      //     margin: "4px",
      //     borderRadius: "0px",
      //     border: "none",
      //     boxShadow: "none",
      //     textAlign: "left",
      //   },
      //   attributes: {},
      // },
      // {
      //   id: "correct_feedback_block_2",
      //   type: "image",
      //   content:
      //     "https://i.postimg.cc/26cpj1cx/Screenshot-2025-07-28-at-5-40-08-PM.png",
      //   styles: {
      //     padding: "8px",
      //     margin: "4px",
      //     borderRadius: "0px",
      //     border: "none",
      //     boxShadow: "none",
      //     width: "400px",
      //   },
      //   attributes: {
      //     alt: "Success image",
      //     width: "400",
      //     height: "300",
      //   },
      // },
    ],
    incorrectFeedbackBlocks: [
      {
        id: "incorrect_feedback_block_1",
        type: "text",
        content: "",
        styles: {
          fontSize: "",
          fontFamily: "Glacial Indifferenc",
          color: "#000000",
          backgroundColor: "transparent",
          padding: "",
          margin: "",
          borderRadius: "",
          border: "none",
          boxShadow: "none",
        },
        attributes: {},
      },
      // {
      //   id: "incorrect_feedback_block_2",
      //   type: "image",
      //   content:
      //     "https://i.postimg.cc/PxdqYCkD/Screenshot-2025-07-28-at-8-04-38-PM.png",
      //   styles: {
      //     padding: "8px",
      //     margin: "4px",
      //     borderRadius: "0px",
      //     border: "none",
      //     boxShadow: "none",
      //     width: "450px",
      //   },
      //   attributes: {
      //     alt: "Explanation image",
      //     width: "450",
      //     height: "300",
      //   },
      // },
      // {
      //   id: "incorrect_feedback_block_3",
      //   type: "text",
      //   content:
      //     "<div style='font-size: 22px; font-family: Glacial Indifference; color: #000000; padding: 8px; margin: 4px; border-radius: 0px; border: none; box-shadow: none; text-align: left'>There are 3 dragons.</div>",
      //   styles: {
      //     fontSize: "22px",
      //     fontFamily: "Glacial Indifference",
      //     color: "#000000",
      //     backgroundColor: "transparent",
      //     padding: "8px",
      //     margin: "4px",
      //     borderRadius: "0px",
      //     border: "none",
      //     boxShadow: "none",
      //     textAlign: "left",
      //   },
      //   attributes: {},
      // },
    ],
    maxChoices: 1,
    globalStyles: {
      fontFamily: "Canva Sans",
      fontSize: "",
      backgroundColor: "",
      padding: "",
      borderRadius: "",
      boxShadow: "",
    },
    customCSS: "",
  });

  const [selectedText, setSelectedText] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedHTML, setSelectedHTML] = useState("");
  const [generatedXML, setGeneratedXML] = useState("");
  const [editingHottextId, setEditingHottextId] = useState<string | null>(null);
  const [editingHottextContent, setEditingHottextContent] = useState("");
  const [editingHottextType, setEditingHottextType] = useState<
    "text" | "image" | "html"
  >("text");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [textFormat, setTextFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [activeTab, setActiveTab] = useState<"text" | "image" | "html">("text");
  const [isImporting, setIsImporting] = useState(false);
  const [importXML, setImportXML] = useState("");
  const [showStylePresets, setShowStylePresets] = useState(false);
  const [selectedItemForStyle, setSelectedItemForStyle] = useState<
    string | null
  >(null);
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);
  const [isImportExpanded, setIsImportExpanded] = useState(false);
  const [showRenderPreview, setShowRenderPreview] = useState(false);
  const [richTextContent, setRichTextContent] = useState("");
  const [selectedButtonStyle, setSelectedButtonStyle] = useState<any>(null);
  const [showContentInput, setShowContentInput] = useState(false);

  // Side navigation state - only one section visible at a time
  const [activeSection, setActiveSection] = useState<
    "question" | "hottext" | "feedback" | "preview"
  >("question");

  const switchToSection = (
    section: "question" | "hottext" | "feedback" | "preview"
  ) => {
    setActiveSection(section);
  };

  useEffect(() => {
    if (
      question.identifier &&
      question.promptBlocks.length > 0 &&
      question.hottextItems.length > 0
    ) {
      const xml = generateHottextXML(question);
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
        const parsedQuestion = parseHottextXML(content);
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

    setIsImporting(true);

    try {
      console.log("Attempting to parse XML...");
      const parsedQuestion = parseHottextXML(importXML);
      console.log("Successfully parsed:", parsedQuestion);

      setQuestion(parsedQuestion);
      setImportXML("");

      alert(`XML imported successfully! 
      - Title: ${parsedQuestion.title}
      - Hottext items: ${parsedQuestion.hottextItems.length}
      - Correct answers: ${parsedQuestion.correctAnswers.length}
      - Prompt blocks: ${parsedQuestion.promptBlocks.length}`);
    } catch (error) {
      console.error("Error parsing XML:", error);
      alert(
        `Invalid XML format. Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please check your XML and try again.`
      );
    } finally {
      setIsImporting(false);
    }
  };

  const addHottextItem = () => {
    let contentValue = "";
    if (activeTab === "text" && !selectedText.trim()) return;
    if (activeTab === "image" && !selectedImage.trim()) return;
    if (activeTab === "html" && !selectedHTML.trim()) return;

    if (activeTab === "text") {
      let formattedText = selectedText.trim();
      if (textFormat.bold) formattedText = `<strong>${formattedText}</strong>`;
      if (textFormat.italic) formattedText = `<em>${formattedText}</em>`;
      if (textFormat.underline) formattedText = `<u>${formattedText}</u>`;
      contentValue = formattedText;
    } else if (activeTab === "image") {
      // Create proper img tag with closing tag
      contentValue = `<img src="${selectedImage.trim()}" alt="Hottext image" />`;
    } else {
      contentValue = selectedHTML.trim();
    }

    let finalStyles;

    // If a button style is selected, use it
    if (selectedButtonStyle) {
      finalStyles = {
        display: "inline-block",
        padding: "0px",
        margin: "10px",
        transition: "all 0.3s ease",
        ...selectedButtonStyle,
      };
    } else {
      // Default styling if no style is selected
      const defaultStyles = {
        display: "inline-block",
        padding: "0px",
        margin: "10px",
        transition: "all 0.3s ease",
      };

      const typeSpecificStyles = {
        text: {
          backgroundColor: "",
          color: "white",
          fontSize: "28px",
          width: "60px",
          height: "60px",
          borderRadius: "10px",
          textAlign: "center" as const,
          lineHeight: "60px",
          border: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        },
        image: {
          width: "auto",
          height: "auto",
          maxWidth: "200px",
          maxHeight: "200px",
          objectFit: "contain" as const,
        },
        html: {
          backgroundColor: "transparent",
          padding: "10px",
          border: "1px dashed #ccc",
        },
      };

      finalStyles = {
        ...defaultStyles,
        ...typeSpecificStyles[activeTab],
      };
    }

    const newItem: HottextItem = {
      identifier: `HT${question.hottextItems.length + 1}`,
      content: {
        type: activeTab,
        value: contentValue,
      },
      styles: finalStyles,
      position: { x: 0, y: 0 },
    };

    setQuestion((prev) => ({
      ...prev,
      hottextItems: [...prev.hottextItems, newItem],
    }));

    // Reset all states
    setSelectedText("");
    setSelectedImage("");
    setSelectedHTML("");
    setSelectedButtonStyle(null);
    setShowContentInput(false);
    setTextFormat({ bold: false, italic: false, underline: false });
  };

  const addRichTextHottext = () => {
    if (!richTextContent.trim()) return;

    const newItem: HottextItem = {
      identifier: `HT${question.hottextItems.length + 1}`,
      content: {
        type: "html",
        value: richTextContent,
      },
      styles: {
        display: "inline-block",
        backgroundColor: "#e3f2fd",
        color: "#1976d2",
        fontSize: "16px",
        width: "auto",
        height: "auto",
        borderRadius: "6px",
        textAlign: "center",
        lineHeight: "1.5",
        padding: "8px 12px",
        margin: "4px",
        border: "2px solid #1976d2",
        boxShadow: "0 2px 8px rgba(25, 118, 210, 0.2)",
        transition: "all 0.3s ease",
      },
      position: { x: 0, y: 0 },
    };

    setQuestion((prev) => ({
      ...prev,
      hottextItems: [...prev.hottextItems, newItem],
    }));

    setRichTextContent("");
  };

  const removeHottextItem = (identifier: string) => {
    setQuestion((prev) => ({
      ...prev,
      hottextItems: prev.hottextItems.filter(
        (item) => item.identifier !== identifier
      ),
      correctAnswers: prev.correctAnswers.filter((id) => id !== identifier),
    }));
  };

  const toggleCorrectAnswer = (identifier: string) => {
    setQuestion((prev) => {
      const isCurrentlySelected = prev.correctAnswers.includes(identifier);
      
      // If already selected, remove it
      if (isCurrentlySelected) {
        return {
          ...prev,
          correctAnswers: prev.correctAnswers.filter((id) => id !== identifier),
        };
      }
      
      // If not selected, check maxChoices constraint
      const maxChoices = prev.maxChoices || 1;
      
      if (maxChoices === 1) {
        // For single choice, replace the current selection
        return {
          ...prev,
          correctAnswers: [identifier],
        };
      } else {
        // For multiple choice, only add if under the limit
        if (prev.correctAnswers.length < maxChoices) {
          return {
            ...prev,
            correctAnswers: [...prev.correctAnswers, identifier],
          };
        }
        // If at limit, don't add (user needs to deselect first)
        return prev;
      }
    });
  };

  const updateHottextStyle = (
    identifier: string,
    styleKey: string,
    value: string
  ) => {
    setQuestion((prev) => ({
      ...prev,
      hottextItems: prev.hottextItems.map((item) =>
        item.identifier === identifier
          ? { ...item, styles: { ...item.styles, [styleKey]: value } }
          : item
      ),
    }));
  };

  const applyStylePreset = (identifier: string, preset: ButtonStylePreset) => {
    setQuestion((prev) => ({
      ...prev,
      hottextItems: prev.hottextItems.map((item) =>
        item.identifier === identifier
          ? { ...item, styles: { ...item.styles, ...preset.styles } }
          : item
      ),
    }));
    setShowStylePresets(false);
    setSelectedItemForStyle(null);
  };

  const startEditingHottext = (item: HottextItem) => {
    setEditingHottextId(item.identifier);
    setEditingHottextContent(item.content.value);
    setEditingHottextType(item.content.type);
    setActiveTab(item.content.type);

    if (item.content.type === "text") {
      const textValue = item.content.value.replace(/<\/?[^>]+(>|$)/g, "");
      setEditingHottextContent(textValue);
      setTextFormat({
        bold:
          item.content.value.includes("<strong>") ||
          item.content.value.includes("<b>"),
        italic:
          item.content.value.includes("<em>") ||
          item.content.value.includes("<i>"),
        underline: item.content.value.includes("<u>"),
      });
    } else if (item.content.type === "image") {
      // Extract URL from img tag if it exists
      const imgSrcMatch = item.content.value.match(/src="([^"]+)"/);
      if (imgSrcMatch) {
        setEditingHottextContent(imgSrcMatch[1]);
      } else {
        // Fallback to raw value if it's just a URL
        setEditingHottextContent(item.content.value);
      }
    }
  };

  const saveHottextEdit = (identifier: string) => {
    let contentValue = editingHottextContent;
    if (editingHottextType === "text") {
      if (textFormat.bold) contentValue = `<strong>${contentValue}</strong>`;
      if (textFormat.italic) contentValue = `<em>${contentValue}</em>`;
      if (textFormat.underline) contentValue = `<u>${contentValue}</u>`;
    } else if (editingHottextType === "image") {
      // Create proper img tag with closing tag for image editing
      contentValue = `<img src="${editingHottextContent.trim()}" alt="Hottext image" />`;
    }

    setQuestion((prev) => ({
      ...prev,
      hottextItems: prev.hottextItems.map((item) =>
        item.identifier === identifier
          ? {
              ...item,
              content: {
                type: editingHottextType,
                value: contentValue,
              },
            }
          : item
      ),
    }));
    setEditingHottextId(null);
    setTextFormat({ bold: false, italic: false, underline: false });
  };

  const toggleTextFormat = (format: keyof typeof textFormat) => {
    setTextFormat((prev) => ({ ...prev, [format]: !prev[format] }));
  };

  const renderHottextContent = (item: HottextItem) => {
    switch (item.content.type) {
      case "text":
        return (
          <span dangerouslySetInnerHTML={{ __html: item.content.value }} />
        );
      case "image":
        return (
          <img
            src={item.content.value || "/placeholder.svg"}
            alt="Hottext image"
            style={{
              maxWidth: item.styles.maxWidth || "200px",
              maxHeight: item.styles.maxHeight || "200px",
              objectFit: (item.styles.objectFit ||
                "contain") as React.CSSProperties["objectFit"],
            }}
          />
        );
      case "html":
        return (
          <span dangerouslySetInnerHTML={{ __html: item.content.value }} />
        );
      default:
        return <span>{item.content.value}</span>;
    }
  };

  const renderStyleControls = (item: HottextItem) => {
    const commonControls = (
      <>
        <AdvancedColorPicker
          label="Background Color"
          color={item.styles.backgroundColor || "transparent"}
          onChange={(color) =>
            updateHottextStyle(item.identifier, "backgroundColor", color)
          }
        />
        <div>
          <Label>Padding</Label>
          <Input
            value={item.styles.padding || "0px"}
            onChange={(e) =>
              updateHottextStyle(item.identifier, "padding", e.target.value)
            }
            placeholder="10px"
          />
        </div>
        <div>
          <Label>Margin</Label>
          <Input
            value={item.styles.margin || "10px"}
            onChange={(e) =>
              updateHottextStyle(item.identifier, "margin", e.target.value)
            }
            placeholder="10px"
          />
        </div>
        <div>
          <Label>Border Radius</Label>
          <Input
            value={item.styles.borderRadius || "10px"}
            onChange={(e) =>
              updateHottextStyle(
                item.identifier,
                "borderRadius",
                e.target.value
              )
            }
            placeholder="10px"
          />
        </div>
        <div>
          <Label>Box Shadow</Label>
          <Input
            value={item.styles.boxShadow || "0 2px 4px rgba(0,0,0,0.2)"}
            onChange={(e) =>
              updateHottextStyle(item.identifier, "boxShadow", e.target.value)
            }
            placeholder="0 2px 4px rgba(0,0,0,0.2)"
          />
        </div>
      </>
    );

    if (item.content.type === "text") {
      return (
        <>
          <AdvancedColorPicker
            label="Text Color"
            color={item.styles.color || "white"}
            onChange={(color) =>
              updateHottextStyle(item.identifier, "color", color)
            }
          />
          <div>
            <Label>Font Size</Label>
            <Input
              value={item.styles.fontSize || "28px"}
              onChange={(e) =>
                updateHottextStyle(item.identifier, "fontSize", e.target.value)
              }
              placeholder="28px"
            />
          </div>
          <div>
            <Label>Width</Label>
            <Input
              value={item.styles.width || "60px"}
              onChange={(e) =>
                updateHottextStyle(item.identifier, "width", e.target.value)
              }
              placeholder="60px"
            />
          </div>
          <div>
            <Label>Height</Label>
            <Input
              value={item.styles.height || "60px"}
              onChange={(e) =>
                updateHottextStyle(item.identifier, "height", e.target.value)
              }
              placeholder="60px"
            />
          </div>
          <div>
            <Label>Line Height</Label>
            <Input
              value={item.styles.lineHeight || "60px"}
              onChange={(e) =>
                updateHottextStyle(
                  item.identifier,
                  "lineHeight",
                  e.target.value
                )
              }
              placeholder="60px"
            />
          </div>
          {commonControls}
        </>
      );
    }

    if (item.content.type === "image") {
      return (
        <>
          <div>
            <Label>Max Width</Label>
            <Input
              value={item.styles.maxWidth || "200px"}
              onChange={(e) =>
                updateHottextStyle(item.identifier, "maxWidth", e.target.value)
              }
              placeholder="200px"
            />
          </div>
          <div>
            <Label>Max Height</Label>
            <Input
              value={item.styles.maxHeight || "200px"}
              onChange={(e) =>
                updateHottextStyle(item.identifier, "maxHeight", e.target.value)
              }
              placeholder="200px"
            />
          </div>
          <div>
            <Label>Object Fit</Label>
            <select
              value={item.styles.objectFit || "contain"}
              onChange={(e) =>
                updateHottextStyle(item.identifier, "objectFit", e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
              <option value="scale-down">Scale Down</option>
            </select>
          </div>
          {commonControls}
        </>
      );
    }

    if (item.content.type === "html") {
      return (
        <>
          <div>
            <Label>Border</Label>
            <Input
              value={item.styles.border || "1px dashed #ccc"}
              onChange={(e) =>
                updateHottextStyle(item.identifier, "border", e.target.value)
              }
              placeholder="1px dashed #ccc"
            />
          </div>
          {commonControls}
        </>
      );
    }

    return null;
  };

  const renderPreview = () => {
    return (
      <div
        className="p-4 border rounded"
        style={{
          fontFamily: question.globalStyles.fontFamily,
          fontSize: question.globalStyles.fontSize,
          backgroundColor: question.globalStyles.backgroundColor,
          padding: question.globalStyles.padding,
          borderRadius: question.globalStyles.borderRadius,
          boxShadow: question.globalStyles.boxShadow,
        }}
      >
        {renderContentBlocks(question.promptBlocks)}
        <div className="flex gap-4 flex-wrap mt-4">
          {question.hottextItems.map((item) => {
            const styleString = Object.entries(item.styles)
              .filter(
                ([_, value]) =>
                  value && value !== "auto" && value !== "transparent"
              )
              .map(
                ([key, value]) =>
                  `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
              )
              .join("; ");

            return (
              <div
                key={item.identifier}
                style={{
                  display: "inline-block",
                  ...item.styles,
                  textAlign: item.styles
                    .textAlign as React.CSSProperties["textAlign"],
                  textTransform: item.styles
                    .textTransform as React.CSSProperties["textTransform"],
                  objectFit: item.styles
                    .objectFit as React.CSSProperties["objectFit"],
                }}
                className="hottext-item"
                data-identifier={item.identifier}
              >
                {renderHottextContent(item)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFeedbackPreview = () => {
    if (!showFeedback) return null;

    const feedbackBlocks = isCorrectAnswer
      ? question.correctFeedbackBlocks
      : question.incorrectFeedbackBlocks;

    return (
      <div className="mt-4 p-4 border rounded">
        <h3 className="font-bold mb-2">
          {isCorrectAnswer
            ? "Correct Answer Feedback"
            : "Incorrect Answer Feedback"}
        </h3>
        {renderContentBlocks(feedbackBlocks)}
      </div>
    );
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
                activeSection === "hottext"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => switchToSection("hottext")}
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
              Incorrect Feedback
            </button>

            <button
              className={`text-left px-4 py-2 rounded font-medium transition-colors ${
                activeSection === "preview"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                switchToSection("preview");
              }}
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
              Hottext Question Builder
            </h1>
            <p className="text-gray-600">
              Create interactive text with selectable highlighted terms
            </p>
          </div>
          <div className="w-full space-y-6">
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setIsImportExpanded(!isImportExpanded)}
              >
                <CardTitle className="flex items-center justify-between">
                  <span>Import QTI XML</span>
                  {isImportExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {isImportExpanded
                    ? "Click to collapse XML import options"
                    : "Click to expand and import existing QTI XML files"}
                </p>
              </CardHeader>
              {isImportExpanded && (
                <CardContent className="space-y-4">
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
              )}
            </Card>

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
                      placeholder="e.g., hottext-question-1"
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
                      placeholder="Question title"
                    />
                  </div> */}
                    <div>
                      <Label>Max Choices</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.maxChoices}
                        onChange={(e) =>
                          setQuestion((prev) => ({
                            ...prev,
                            maxChoices: Number.parseInt(e.target.value) || 1,
                          }))
                        }
                      />
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

            {activeSection === "hottext" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Hottext Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) => setActiveTab(value as any)}
                    >
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="text">
                          <FileText className="w-4 h-4 mr-2" />
                          Text
                        </TabsTrigger>
                        <TabsTrigger value="image">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Image
                        </TabsTrigger>
                        <TabsTrigger value="html">
                          <Video className="w-4 h-4 mr-2" />
                          HTML
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="space-y-4">
                        {/* Rich Text Editor Section */}
                        {/* <div className="border rounded-lg p-4 bg-blue-50">
                        <Label className="text-sm font-medium text-blue-900 mb-2 block">
                          Rich Text Editor (Recommended)
                        </Label>
                        <p className="text-xs text-blue-700 mb-3">
                          Create formatted text with bold, italic, colors, and more. Perfect for complex hottext items.
                        </p>
                        <RichTextEditor
                          value={richTextContent}
                          onChange={setRichTextContent}
                          placeholder="Type and format your hottext content here..."
                          className="min-h-[100px]"
                        />
                        <Button
                          onClick={addRichTextHottext}
                          disabled={!richTextContent.trim()}
                          className="w-full mt-3"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Rich Text Hottext
                        </Button>
                      </div> */}

                        {/* 3-Step Workflow: Content → Style → Add */}
                      </TabsContent>

                      <TabsContent value="image" className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={selectedImage}
                            onChange={(e) => setSelectedImage(e.target.value)}
                            placeholder="Enter image URL"
                          />
                          <Button
                            onClick={addHottextItem}
                            disabled={!selectedImage.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="html" className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={selectedHTML}
                            onChange={(e) => setSelectedHTML(e.target.value)}
                            placeholder="Enter HTML content"
                          />
                          <Button
                            onClick={addHottextItem}
                            disabled={!selectedHTML.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="space-y-4">
                      {question.hottextItems.map((item) => {
                        const isCorrect = question.correctAnswers.includes(item.identifier);
                        const maxChoices = question.maxChoices || 1;
                        const isAtMaxLimit = question.correctAnswers.length >= maxChoices;
                        const canToggle = isCorrect || !isAtMaxLimit;
                        
                        return (
                        <Card key={item.identifier} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={isCorrect ? "default" : "secondary"}
                                className={`
                                ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} px-3 py-1 text-sm font-medium transition-all duration-200
                                ${
                                  isCorrect
                                    ? "bg-green-600 text-white shadow-lg border-2 border-green-500"
                                    : canToggle
                                    ? "bg-gray-400 text-white hover:bg-gray-500 border-2 border-gray-300"
                                    : "bg-gray-300 text-gray-600 border-2 border-gray-200"
                                }
                              `}
                                onClick={() => {
                                  if (canToggle) {
                                    toggleCorrectAnswer(item.identifier);
                                  }
                                }}
                              >
                                {isCorrect
                                  ? "✓ CORRECT ANSWER"
                                  : canToggle
                                  ? "Click to mark as correct"
                                  : `Max ${maxChoices} choice${maxChoices > 1 ? 's' : ''} reached`}
                              </Badge>
                              <Badge className="flex items-center justify-center text-sm font-medium bg-green-500 text-white ml-24">
                                Choice Item :{" "}
                                {item.identifier.replace("HT", "")}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItemForStyle(item.identifier);
                                  setShowStylePresets(true);
                                }}
                                title="Apply Style Preset"
                              >
                                <Palette className="w-4 h-4" />
                              </Button>
                              {editingHottextId === item.identifier ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    saveHottextEdit(item.identifier)
                                  }
                                >
                                  Save
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingHottext(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeHottextItem(item.identifier)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {editingHottextId === item.identifier ? (
                            <>
                              <Tabs
                                value={editingHottextType}
                                onValueChange={(value) =>
                                  setEditingHottextType(value as any)
                                }
                                className="w-full"
                              >
                                <TabsList className="grid grid-cols-3 w-full mb-2">
                                  <TabsTrigger value="text">
                                    <FileText className="w-4 h-4" />
                                  </TabsTrigger>
                                  <TabsTrigger value="image">
                                    <ImageIcon className="w-4 h-4" />
                                  </TabsTrigger>
                                  <TabsTrigger value="html">
                                    <Video className="w-4 h-4" />
                                  </TabsTrigger>
                                </TabsList>
                              </Tabs>
                              {editingHottextType === "text" && (
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-1">
                                    <Toggle
                                      pressed={textFormat.bold}
                                      onPressedChange={() =>
                                        toggleTextFormat("bold")
                                      }
                                      size="sm"
                                      aria-label="Toggle bold"
                                    >
                                      <Bold className="h-4 w-4" />
                                    </Toggle>
                                    <Toggle
                                      pressed={textFormat.italic}
                                      onPressedChange={() =>
                                        toggleTextFormat("italic")
                                      }
                                      size="sm"
                                      aria-label="Toggle italic"
                                    >
                                      <Italic className="h-4 w-4" />
                                    </Toggle>
                                    <Toggle
                                      pressed={textFormat.underline}
                                      onPressedChange={() =>
                                        toggleTextFormat("underline")
                                      }
                                      size="sm"
                                      aria-label="Toggle underline"
                                    >
                                      <Underline className="h-4 w-4" />
                                    </Toggle>
                                  </div>
                                  <Input
                                    value={editingHottextContent}
                                    onChange={(e) =>
                                      setEditingHottextContent(e.target.value)
                                    }
                                    className="h-6 px-2 text-sm"
                                  />
                                </div>
                              )}
                              {editingHottextType === "image" && (
                                <Input
                                  value={editingHottextContent}
                                  onChange={(e) =>
                                    setEditingHottextContent(e.target.value)
                                  }
                                  className="h-6 px-2 text-sm"
                                  placeholder="Enter image URL"
                                />
                              )}
                              {editingHottextType === "html" && (
                                <Input
                                  value={editingHottextContent}
                                  onChange={(e) =>
                                    setEditingHottextContent(e.target.value)
                                  }
                                  className="h-6 px-2 text-sm"
                                  placeholder="Enter HTML content"
                                />
                              )}
                            </>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-2 bg-gray-50 rounded border">
                                {renderHottextContent(item)}
                              </div>

                              {/* Hottext Item Preview */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                  Preview (How it will appear):
                                </Label>
                                <div className="p-4 bg-white border rounded-lg">
                                  <div
                                    style={item.styles as React.CSSProperties}
                                    className="inline-block"
                                  >
                                    {renderHottextContent(item)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* <div className="grid grid-cols-2 gap-3 mt-4">
                          {renderStyleControls(item)}
                        </div> */}
                        </Card>
                      );
                      })}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Click on badges to mark as correct answers
                      </p>
                      <p className="text-xs text-blue-600">
                        {question.maxChoices === 1 
                          ? "Maximum 1 choice allowed - selecting a new answer will replace the current one"
                          : `Maximum ${question.maxChoices} choices allowed - you have selected ${question.correctAnswers.length}/${question.maxChoices}`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <div className="border rounded-lg p-4">
                    <Label className="text-sm font-large text-gray-700 mb-4 block">
                      Create Hottext Item
                    </Label>

                    <div className="space-y-4">
                      {/* Step 1: Content Input */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            1
                          </div>
                          <Label className="text-sm font-medium text-gray-700">
                            Enter your text content
                          </Label>
                        </div>
                        <Input
                          value={selectedText}
                          onChange={(e) => setSelectedText(e.target.value)}
                          placeholder="Type your text here..."
                        />

                        {/* Text Formatting */}
                        <div className="flex gap-1 ml-8">
                          <Toggle
                            pressed={textFormat.bold}
                            onPressedChange={() => toggleTextFormat("bold")}
                            size="sm"
                            aria-label="Toggle bold"
                          >
                            <Bold className="h-4 w-4" />
                          </Toggle>
                          <Toggle
                            pressed={textFormat.italic}
                            onPressedChange={() => toggleTextFormat("italic")}
                            size="sm"
                            aria-label="Toggle italic"
                          >
                            <Italic className="h-4 w-4" />
                          </Toggle>
                          <Toggle
                            pressed={textFormat.underline}
                            onPressedChange={() =>
                              toggleTextFormat("underline")
                            }
                            size="sm"
                            aria-label="Toggle underline"
                          >
                            <Underline className="h-4 w-4" />
                          </Toggle>
                        </div>
                      </div>

                      {/* Step 2: Style Selection (only show when text is entered) */}
                      {selectedText.trim() && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              2
                            </div>
                            <Label className="text-sm font-medium text-gray-700">
                              Choose button style
                            </Label>
                          </div>
                          <div className="ml-8 space-y-3">
                            <QuickStylePresets
                              onApplyPreset={(preset) => {
                                setSelectedButtonStyle(preset.styles);
                              }}
                              maxItems={6}
                              showOnlyCategory="basic"
                            />
                            <QuickStylePresets
                              onApplyPreset={(preset) => {
                                setSelectedButtonStyle(preset.styles);
                              }}
                              maxItems={4}
                              showOnlyCategory="gradient"
                            />
                            {selectedButtonStyle && (
                              <p className="text-sm text-green-600 font-medium">
                                ✓ Style selected
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Add Button (only show when both text and style are selected) */}
                      {selectedText.trim() && selectedButtonStyle && (
                        <div className="space-y-2 ">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              3
                            </div>
                            <Label className="text-sm font-medium text-gray-700">
                              Add to hottext items
                            </Label>
                          </div>
                          <div className="ml-8">
                            <Button
                              onClick={addHottextItem}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Item
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Helper text */}
                      {!selectedText.trim() && (
                        <p className="text-xs text-gray-500 ml-8">
                          Start by entering your text content above
                        </p>
                      )}
                      {selectedText.trim() && !selectedButtonStyle && (
                        <p className="text-xs text-gray-500 ml-8">
                          Now choose a button style for your text
                        </p>
                      )}

                      {/* Button Preview */}
                      {selectedText.trim() && selectedButtonStyle && (
                        <div className="space-y-2 pt-4 border-t border-gray-200">
                          <Label className="text-sm font-medium text-gray-700">
                            Preview:
                          </Label>
                          <div className="p-4 bg-white border rounded-lg">
                            <div
                              style={selectedButtonStyle as React.CSSProperties}
                              className="inline-block"
                            >
                              {selectedText}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Style Preset Modal */}
                {showStylePresets && selectedItemForStyle && (
                  <ButtonStylePresets
                    onApplyPreset={(preset) =>
                      applyStylePreset(selectedItemForStyle, preset)
                    }
                    onClose={() => {
                      setShowStylePresets(false);
                      setSelectedItemForStyle(null);
                    }}
                    title="Choose Button Style Preset"
                  />
                )}
              </>
            )}

            {/* {activeSection === "feedback" && (
            // <ContentBlockEditor
            //   blocks={question.incorrectFeedbackBlocks}
            //   onChange={(blocks) =>
            //     setQuestion((prev) => ({
            //       ...prev,
            //       incorrectFeedbackBlocks: blocks,
            //     }))
            //   }
            //   title="Incorrect Answer Feedback"
            // />
          )} */}

            {/* {activeSection === "preview" && (
            <Card>
              <CardHeader>
                <CardTitle>Global Styles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Font Family</Label>
                    <Input
                      value={question.globalStyles.fontFamily}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          globalStyles: {
                            ...prev.globalStyles,
                            fontFamily: e.target.value,
                          },
                        }))
                      }
                      placeholder="Canva Sans"
                    />
                  </div>
                  <div>
                    <Label>Font Size</Label>
                    <Input
                      value={question.globalStyles.fontSize}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          globalStyles: {
                            ...prev.globalStyles,
                            fontSize: e.target.value,
                          },
                        }))
                      }
                      placeholder="22px"
                    />
                  </div>
                  <AdvancedColorPicker
                    label="Background Color"
                    color={question.globalStyles.backgroundColor}
                    onChange={(color) =>
                      setQuestion((prev) => ({
                        ...prev,
                        globalStyles: {
                          ...prev.globalStyles,
                          backgroundColor: color,
                        },
                      }))
                    }
                  />
                  <div>
                    <Label>Padding</Label>
                    <Input
                      value={question.globalStyles.padding}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          globalStyles: {
                            ...prev.globalStyles,
                            padding: e.target.value,
                          },
                        }))
                      }
                      placeholder="20px"
                    />
                  </div>
                </div>
                <div>
                  <Label>Custom CSS</Label>
                  <textarea
                    value={question.customCSS}
                    onChange={(e) =>
                      setQuestion((prev) => ({
                        ...prev,
                        customCSS: e.target.value,
                      }))
                    }
                    className="w-full min-h-20 p-2 border rounded font-mono text-sm"
                    placeholder="Add custom CSS styles..."
                  />
                </div>
              </CardContent>
            </Card>
          )} */}

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

            {activeSection === "feedback" && (
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
                    {question.promptBlocks.length > 0 ? (
                      <div className="space-y-4">
                        {renderPreview()}
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Correct answers:</strong>{" "}
                            {question.correctAnswers.join(", ") ||
                              "None selected"}
                          </p>
                          <p>
                            <strong>Max choices:</strong> {question.maxChoices}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowFeedback(true);
                              setIsCorrectAnswer(true);
                            }}
                          >
                            Show Correct Feedback
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowFeedback(true);
                              setIsCorrectAnswer(false);
                            }}
                          >
                            Show Incorrect Feedback
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setShowFeedback(false)}
                          >
                            Hide Feedback
                          </Button>
                        </div>

                        {renderFeedbackPreview()}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Add content and hottext items to see preview
                      </p>
                    )}
                  </CardContent>
                </Card>

                <PreviewRenderer
                  xmlContent={generatedXML}
                  questionType="hottext"
                  disabled={!generatedXML}
                />

                {generatedXML && (
                  <XMLViewer
                    xml={generatedXML}
                    filename={`${
                      question.identifier || "hottext-question"
                    }.xml`}
                  />
                )}

                {/* Collapsible Style Presets Reference Card - Moved to bottom */}
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setIsReferenceExpanded(!isReferenceExpanded)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <span>Button Style Presets Reference</span>
                      {isReferenceExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {isReferenceExpanded
                        ? "Click to collapse button style reference"
                        : "Click to expand and copy HTML button styles for feedback blocks"}
                    </p>
                  </CardHeader>
                  {isReferenceExpanded && (
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Copy these HTML button styles to use in your feedback
                        blocks:
                      </p>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {buttonStylePresets.map((preset, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                style={preset.styles as React.CSSProperties}
                                className="pointer-events-none"
                              >
                                {preset.preview}
                              </button>
                              <span className="font-medium">{preset.name}</span>
                            </div>
                            <div className="bg-gray-100 p-2 rounded font-mono text-xs overflow-x-auto">
                              <code>{generateButtonHTML(preset)}</code>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  generateButtonHTML(preset)
                                );
                              }}
                            >
                              Copy HTML
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>How to use:</strong> Copy the HTML code and
                          paste it into your feedback content blocks. You can
                          change the button text to match your content.
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
