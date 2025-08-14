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
} from "lucide-react";
import { ContentBlockEditor } from "@/components/content-block-editor";
import { XMLViewer } from "@/components/xml-viewer";
import { AdvancedColorPicker } from "@/components/advanced-color-picker";
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
  type ButtonStylePreset 
} from "@/components/button-style-presets";

function parseHottextXML(xmlString: string): HottextQuestion {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

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
  const identifier =
    assessmentItem?.getAttribute("identifier") || `hottext-${Date.now()}`;
  const title = assessmentItem?.getAttribute("title") || "Hottext Question";

  // Parse prompt blocks
  const promptBlocks: ContentBlock[] = [];
  const itemBody = xmlDoc.querySelector("qti-item-body");
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

  // Parse hottext items
  const hottextItems: HottextItem[] = [];
  const hottextInteraction = xmlDoc.querySelector("qti-hottext-interaction");
  const maxChoices = parseInt(
    hottextInteraction?.getAttribute("max-choices") || "1"
  );

  hottextInteraction
    ?.querySelectorAll("qti-hottext")
    .forEach((hottext, index) => {
      const identifier = hottext.getAttribute("identifier") || `HT${index + 1}`;
      const span = hottext.querySelector("span");

      if (span) {
        const styles = extractStyles(span);
        hottextItems.push({
          identifier,
          content: {
            type: "text",
            value: span.textContent || "",
          },
          styles: {
            display: styles.display || "inline-block",
            backgroundColor: styles.backgroundColor || "#a94400",
            color: styles.color || "white",
            fontSize: styles.fontSize || "28px",
            width: styles.width || "60px",
            height: styles.height || "60px",
            borderRadius: styles.borderRadius || "10px",
            textAlign: (styles.textAlign === "center" || styles.textAlign === "left" || styles.textAlign === "right") ? styles.textAlign : "center",
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
    fontFamily: promptDiv?.getAttribute("style")?.includes("font-family")
      ? extractStyles(promptDiv).fontFamily
      : "'Canva Sans', sans-serif",
    fontSize: promptDiv?.getAttribute("style")?.includes("font-size")
      ? extractStyles(promptDiv).fontSize
      : "22px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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
    maxChoices,
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
      // {
      //   id: "incorrect_feedback_block_1",
      //   type: "text",
      //   content:
      //     "<div style='font-size: 22px; font-family: Glacial Indifference; padding: 8px; margin: 4px; border-radius: 0px; border: none; boxShadow: none; text-align: left'><span style='font-family: Arial, sans-serif; font-size: 30px; font-weight: bold; color: #FF0000;'>Nice Try!</span><br/><br/><span style='font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; color: #27c94c;'>Correct answer is:</span><span style='display:inline-block;margin-left; background-color:#a94400; color:white; font-size:28px; width:60px; height:60px; border-radius:10px; text-align:center; line-height:60px;'>3</span> <br/><br/>Count the dragons one by one.<br/><br/></div>",
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
      fontSize: "22px",
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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
  const [selectedItemForStyle, setSelectedItemForStyle] = useState<string | null>(null);
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);
  const [isImportExpanded, setIsImportExpanded] = useState(false);

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

    try {
      const parsedQuestion = parseHottextXML(importXML);
      setQuestion(parsedQuestion);
      setImportXML("");
    } catch (error) {
      console.error("Error parsing XML:", error);
      alert("Invalid XML format. Please check your XML and try again.");
    }
  };

  const addHottextItem = (customStyles?: any) => {
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
      contentValue = selectedImage.trim();
    } else {
      contentValue = selectedHTML.trim();
    }

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

    // Use custom styles if provided, otherwise use default
    const finalStyles = customStyles || {
      ...defaultStyles,
      ...typeSpecificStyles[activeTab],
    };

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

    setSelectedText("");
    setSelectedImage("");
    setSelectedHTML("");
    setTextFormat({ bold: false, italic: false, underline: false });
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
    setQuestion((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers.includes(identifier)
        ? prev.correctAnswers.filter((id) => id !== identifier)
        : [...prev.correctAnswers, identifier],
    }));
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
    }
  };

  const saveHottextEdit = (identifier: string) => {
    let contentValue = editingHottextContent;
    if (editingHottextType === "text") {
      if (textFormat.bold) contentValue = `<strong>${contentValue}</strong>`;
      if (textFormat.italic) contentValue = `<em>${contentValue}</em>`;
      if (textFormat.underline) contentValue = `<u>${contentValue}</u>`;
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
              objectFit: (item.styles.objectFit || "contain") as React.CSSProperties['objectFit'],
            }}
          />
        );
      case "html":
        return <div dangerouslySetInnerHTML={{ __html: item.content.value }} />;
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
                  textAlign: item.styles.textAlign as React.CSSProperties['textAlign'],
                  textTransform: item.styles.textTransform as React.CSSProperties['textTransform'],
                  objectFit: item.styles.objectFit as React.CSSProperties['objectFit'],
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
      <div className="w-[60%] mx-auto px-4 py-8">
        <div className="mb-8">
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
                    : "Click to expand and import existing QTI XML files"
                  }
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
                </div>
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

                  <TabsContent value="text" className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          value={selectedText}
                          onChange={(e) => setSelectedText(e.target.value)}
                          placeholder="Enter text content"
                        />
                        <Button
                          onClick={addHottextItem}
                          disabled={!selectedText.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-1">
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
                          onPressedChange={() => toggleTextFormat("underline")}
                          size="sm"
                          aria-label="Toggle underline"
                        >
                          <Underline className="h-4 w-4" />
                        </Toggle>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">Quick Style Presets:</p>
                        <QuickStylePresets
                          onApplyPreset={(preset) => {
                            if (selectedText.trim()) {
                              addHottextItem(preset.styles);
                            }
                          }}
                          maxItems={6}
                          showOnlyCategory="basic"
                        />
                        <div className="mt-2">
                          <QuickStylePresets
                            onApplyPreset={(preset) => {
                              if (selectedText.trim()) {
                                addHottextItem(preset.styles);
                              }
                            }}
                            maxItems={4}
                            showOnlyCategory="gradient"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter text above, then click a style to create a hottext item with that style.
                        </p>
                      </div>
                    </div>
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
                  {question.hottextItems.map((item) => (
                    <Card key={item.identifier} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              question.correctAnswers.includes(item.identifier)
                                ? "default"
                                : "secondary"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleCorrectAnswer(item.identifier)}
                          >
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
                              renderHottextContent(item)
                            )}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            ({item.identifier})
                          </span>
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
                              onClick={() => saveHottextEdit(item.identifier)}
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
                            onClick={() => removeHottextItem(item.identifier)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {renderStyleControls(item)}
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Click on badges to mark as correct answers
                </p>
              </CardContent>
            </Card>

            {/* Style Preset Modal */}
            {showStylePresets && selectedItemForStyle && (
              <ButtonStylePresets
                onApplyPreset={(preset) => applyStylePreset(selectedItemForStyle, preset)}
                onClose={() => {
                  setShowStylePresets(false);
                  setSelectedItemForStyle(null);
                }}
                title="Choose Button Style Preset"
              />
            )}

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

           <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.promptBlocks.length > 0  ? (
                  <div className="space-y-4">
                    {renderPreview()}
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Correct answers:</strong>{" "}
                        {question.correctAnswers.join(", ") || "None selected"}
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

            {generatedXML && (
              <XMLViewer
                xml={generatedXML}
                filename={`${question.identifier || "hottext-question"}.xml`}
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
                    : "Click to expand and copy HTML button styles for feedback blocks"
                  }
                </p>
              </CardHeader>
              {isReferenceExpanded && (
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Copy these HTML button styles to use in your feedback blocks:
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
                          <code>
                            {generateButtonHTML(preset)}
                          </code>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            navigator.clipboard.writeText(generateButtonHTML(preset));
                          }}
                        >
                          Copy HTML
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>How to use:</strong> Copy the HTML code and paste it into your feedback content blocks. 
                      You can change the button text to match your content.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
      
    </div>
  );
}
