"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye, Copy, Upload, Code, Image as ImageIcon, ChevronDown, ChevronUp, Bold, Italic, Underline } from "lucide-react";
import { XMLViewer } from "@/components/xml-viewer";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface ContentBlock {
  id: string;
  type: "text" | "image" | "html" | "button";
  content: string;
  styles?: Record<string, string>;
}

interface GapMatchQuestion {
  identifier: string;
  title: string;
  instructions: ContentBlock[];
  baseContent: ContentBlock[];
  gaps: {
    id: string;
    position: number;
    isCorrect: boolean;
  }[];
  gapTexts: ContentBlock[];
  shuffle: boolean;
  maxAssociations: number;
  correctFeedback: ContentBlock[];
  incorrectFeedback: ContentBlock[];
  globalStyles: Record<string, string>;
}

const initialQuestionState: GapMatchQuestion = {
  identifier: `gap-match-${Date.now()}`,
  title: "Comma Placement Exercise",
  instructions: [{
    id: "instr-1",
    type: "text",
    content: "Add commas to correct the sentence. The sentence should have <b>three</b> commas.",
    styles: { fontSize: "16px", color: "#333" }
  }],
  baseContent: [{
    id: "content-1",
    type: "text",
    content: "My sports bag holds a jersey shorts socks and cleats for practice."
  }],
  gaps: [
    { id: "pos6", position: 6, isCorrect: true },
    { id: "pos7", position: 7, isCorrect: true },
    { id: "pos8", position: 8, isCorrect: true }
  ],
  gapTexts: [{
    id: "comma",
    type: "button",
    content: ",",
    styles: { 
      fontSize: "18px", 
      fontWeight: "bold",
      padding: "8px 16px",
      borderRadius: "4px",
      backgroundColor: "#e2e8f0",
      border: "1px solid #cbd5e1"
    }
  }],
  shuffle: false,
  maxAssociations: 0,
  correctFeedback: [{
    id: "correct-1",
    type: "text",
    content: "<strong>Great job!</strong> You placed all commas correctly."
  }],
  incorrectFeedback: [{
    id: "incorrect-1",
    type: "text",
    content: "<strong>Try again!</strong> Remember to place commas between list items."
  }],
  globalStyles: {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px"
  }
};

const predefinedButtons = [
  { content: ",", label: "Comma" },
  { content: ".", label: "Period" },
  { content: ";", label: "Semicolon" },
  { content: ":", label: "Colon" },
  { content: "(", label: "Open Parenthesis" },
  { content: ")", label: "Close Parenthesis" },
  { content: "[", label: "Open Bracket" },
  { content: "]", label: "Close Bracket" }
];

export default function GapMatchBuilder() {
  const [question, setQuestion] = useState<GapMatchQuestion>(initialQuestionState);
  const [generatedXML, setGeneratedXML] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "gaps" | "feedback" | "styles">("content");
  const [importXML, setImportXML] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [expandedPanels, setExpandedPanels] = useState({
    instructions: true,
    content: true,
    gapTexts: true,
    feedback: true,
    styles: true
  });

  // Add predefined button to gapTexts
  const addPredefinedButton = (content: string) => {
    const newBlock: ContentBlock = {
      id: generateId("gap-text"),
      type: "button",
      content,
      styles: { 
        fontSize: "18px", 
        fontWeight: "bold",
        padding: "8px 16px",
        borderRadius: "4px",
        backgroundColor: "#e2e8f0",
        border: "1px solid #cbd5e1"
      }
    };
    setQuestion(prev => ({
      ...prev,
      gapTexts: [...prev.gapTexts, newBlock]
    }));
  };

  const togglePanel = (panel: keyof typeof expandedPanels) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const extractStyles = (element: Element): Record<string, string> => {
    const styleAttr = element.getAttribute("style");
    const styles: Record<string, string> = {};
    if (styleAttr) {
      styleAttr.split(";").forEach(style => {
        const [key, value] = style.split(":").map(s => s.trim());
        if (key && value) styles[key] = value;
      });
    }
    return styles;
  };

  const parseXML = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      const assessmentItem = xmlDoc.querySelector("qti-assessment-item");
      const identifier = assessmentItem?.getAttribute("identifier") || generateId("gap-match");
      const title = assessmentItem?.getAttribute("title") || "Gap Match Question";
      
      const instructions: ContentBlock[] = [];
      const instructionDiv = xmlDoc.querySelector("qti-item-body > div");
      if (instructionDiv) {
        instructions.push({
          id: generateId("instr"),
          type: "html",
          content: instructionDiv.innerHTML,
          styles: extractStyles(instructionDiv)
        });
      }
      
      const baseContent: ContentBlock[] = [];
      const interaction = xmlDoc.querySelector("qti-gap-match-interaction");
      const paragraphs = interaction?.querySelectorAll("p");
      
      paragraphs?.forEach(p => {
        baseContent.push({
          id: generateId("para"),
          type: "html",
          content: p.innerHTML,
          styles: extractStyles(p)
        });
      });
      
      const gaps: GapMatchQuestion["gaps"] = [];
      const gapElements = interaction?.querySelectorAll("qti-gap");
      gapElements?.forEach((gap, index) => {
        gaps.push({
          id: gap.getAttribute("identifier") || `pos${index}`,
          position: index,
          isCorrect: true
        });
      });
      
      const gapTexts: ContentBlock[] = [];
      const gapTextElements = interaction?.querySelectorAll("qti-gap-text");
      gapTextElements?.forEach(gt => {
        gapTexts.push({
          id: gt.getAttribute("identifier") || generateId("gap-text"),
          type: "text",
          content: gt.textContent || "",
          styles: extractStyles(gt)
        });
      });
      
      const correctFeedback: ContentBlock[] = [];
      const incorrectFeedback: ContentBlock[] = [];
      
      const correctBlock = xmlDoc.querySelector("qti-feedback-block[identifier='CORRECT']");
      if (correctBlock) {
        const content = correctBlock.querySelector("qti-content-body");
        if (content) {
          correctFeedback.push({
            id: generateId("feedback"),
            type: "html",
            content: content.innerHTML,
            styles: extractStyles(content)
          });
        }
      }
      
      const incorrectBlock = xmlDoc.querySelector("qti-feedback-block[identifier='INCORRECT']");
      if (incorrectBlock) {
        const content = incorrectBlock.querySelector("qti-content-body");
        if (content) {
          incorrectFeedback.push({
            id: generateId("feedback"),
            type: "html",
            content: content.innerHTML,
            styles: extractStyles(content)
          });
        }
      }
      
      setQuestion({
        identifier,
        title,
        instructions,
        baseContent,
        gaps,
        gapTexts,
        shuffle: interaction?.getAttribute("shuffle") === "true",
        maxAssociations: parseInt(interaction?.getAttribute("max-associations") || "0"),
        correctFeedback,
        incorrectFeedback,
        globalStyles: {
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "8px"
        }
      });
      
    } catch (error) {
      console.error("Error parsing XML:", error);
      alert("Error parsing XML. Please check the format.");
    }
  };

  const generateXML = () => {
    const instructionsHTML = question.instructions
      .map(i => i.content)
      .join("");
    
    let contentWithGaps = "";
    if (question.baseContent.length > 0) {
      const firstContent = question.baseContent[0];
      const words = firstContent.content.split(" ");
      
      contentWithGaps = words.map((word, index) => {
        const gap = question.gaps.find(g => g.position === index);
        return gap ? `${word}<qti-gap identifier="${gap.id}" />` : `${word} `;
      }).join("");
    }
    
    const correctResponses = question.gaps
      .filter(g => g.isCorrect)
      .map(g => `<qti-value>${question.gapTexts[0]?.id || "comma"} ${g.id}</qti-value>`)
      .join("\n      ");
    
    const gapTextsXML = question.gapTexts
      .map(gt => `<qti-gap-text identifier="${gt.id}" match-max="${question.gaps.filter(g => g.isCorrect).length}">${gt.content}</qti-gap-text>`)
      .join("\n      ");
    
    const correctFeedback = question.correctFeedback
      .map(f => f.content)
      .join("");
    const incorrectFeedback = question.incorrectFeedback
      .map(f => f.content)
      .join("");
    
    const xml = `<?xml version="1.0"?>
<qti-assessment-item 
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
  identifier="${question.identifier}" 
  title="${question.title}" 
  time-dependent="false" 
  xml:lang="en-US">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      ${correctResponses}
    </qti-correct-response>
  </qti-response-declaration>
  
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  
  <qti-item-body>
    <div>
      ${instructionsHTML}
    </div>
    
    <qti-gap-match-interaction 
      response-identifier="RESPONSE" 
      shuffle="${question.shuffle}" 
      max-associations="${question.maxAssociations}">
      
      ${gapTextsXML}
      
      <p>
        ${contentWithGaps}
      </p>
    </qti-gap-match-interaction>
    
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <qti-content-body>
        <p>${correctFeedback}</p>
      </qti-content-body>
    </qti-feedback-block>
    
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
      <qti-content-body>
        <p>${incorrectFeedback}</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>
  
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

    setGeneratedXML(xml);
  };

  const addContentBlock = (type: "text" | "image" | "html" | "button", section: keyof Pick<GapMatchQuestion, 'instructions' | 'baseContent' | 'correctFeedback' | 'incorrectFeedback' | 'gapTexts'>) => {
    const newBlock: ContentBlock = {
      id: generateId("block"),
      type,
      content: type === "text" ? "New text content" : 
               type === "image" ? "https://example.com/image.jpg" : 
               type === "button" ? "Button" :
               "<p>New HTML content</p>",
      styles: type === "button" ? { 
        fontSize: "18px", 
        fontWeight: "bold",
        padding: "8px 16px",
        borderRadius: "4px",
        backgroundColor: "#e2e8f0",
        border: "1px solid #cbd5e1"
      } : {}
    };
    
    setQuestion(prev => ({
      ...prev,
      [section]: [...prev[section], newBlock]
    }));
  };

  const updateContentBlock = (id: string, updates: Partial<ContentBlock>, section: keyof Pick<GapMatchQuestion, 'instructions' | 'baseContent' | 'correctFeedback' | 'incorrectFeedback' | 'gapTexts'>) => {
    setQuestion(prev => ({
      ...prev,
      [section]: prev[section].map(block => 
        block.id === id ? { ...block, ...updates } : block
      )
    }));
  };

  const removeContentBlock = (id: string, section: keyof Pick<GapMatchQuestion, 'instructions' | 'baseContent' | 'correctFeedback' | 'incorrectFeedback' | 'gapTexts'>) => {
    setQuestion(prev => ({
      ...prev,
      [section]: prev[section].filter(block => block.id !== id)
    }));
  };

  const handleImport = () => {
    setIsImporting(true);
    try {
      parseXML(importXML);
      setImportXML("");
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import XML. Please check the format.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        parseXML(content);
      } catch (error) {
        console.error("Error parsing XML:", error);
        alert("Error parsing XML file. Please check the format.");
      } finally {
        setIsImporting(false);
        if (event.target) event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const RichTextEditor = ({ content, onChange }: { content: string, onChange: (value: string) => void }) => {
    const [value, setValue] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const applyFormat = (tag: string) => {
      if (!textareaRef.current) return;
      
      const { selectionStart, selectionEnd } = textareaRef.current;
      const selectedText = value.substring(selectionStart, selectionEnd);
      
      if (selectionStart === selectionEnd) {
        const newValue = 
          value.substring(0, selectionStart) + 
          `<${tag}></${tag}>` + 
          value.substring(selectionEnd);
        
        setValue(newValue);
        onChange(newValue);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = selectionStart + tag.length + 2;
            textareaRef.current.selectionEnd = selectionStart + tag.length + 2;
          }
        }, 0);
      } else {
        const newValue = 
          value.substring(0, selectionStart) + 
          `<${tag}>${selectedText}</${tag}>` + 
          value.substring(selectionEnd);
        
        setValue(newValue);
        onChange(newValue);
      }
    };

    return (
      <div className="space-y-2">
        <TooltipProvider>
          <div className="flex gap-1 p-1 border rounded">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyFormat("b")}
                >
                  <Bold className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyFormat("i")}
                >
                  <Italic className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => applyFormat("u")}
                >
                  <Underline className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          rows={4}
          className="min-h-[100px]"
        />
      </div>
    );
  };

  const renderContentEditor = (section: keyof Pick<GapMatchQuestion, 'instructions' | 'baseContent' | 'correctFeedback' | 'incorrectFeedback' | 'gapTexts'>) => {
    const content = question[section] || [];
    const isGapTexts = section === "gapTexts";

    return (
      <div className="space-y-4">
        {isGapTexts && (
          <div className="space-y-2">
            <Label>Predefined Buttons</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedButtons.map((btn, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addPredefinedButton(btn.content)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {content.map(block => (
          <Card key={block.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="capitalize">
                {block.type}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeContentBlock(block.id, section)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            {block.type === "text" && (
              <RichTextEditor
                content={block.content}
                onChange={(newContent) => updateContentBlock(block.id, { content: newContent }, section)}
              />
            )}
            
            {block.type === "image" && (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={block.content}
                  onChange={(e) => updateContentBlock(block.id, { content: e.target.value }, section)}
                  placeholder="https://example.com/image.jpg"
                />
                {block.content && (
                  <div className="mt-2">
                    <img 
                      src={block.content} 
                      alt="Preview" 
                      className="max-w-full h-auto max-h-40 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            )}
            
            {block.type === "html" && (
              <Textarea
                value={block.content}
                onChange={(e) => updateContentBlock(block.id, { content: e.target.value }, section)}
                rows={6}
                className="font-mono text-sm min-h-[100px]"
              />
            )}

            {block.type === "button" && (
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={block.content}
                  onChange={(e) => updateContentBlock(block.id, { content: e.target.value }, section)}
                />
                <div className="mt-2">
                  <div 
                    style={block.styles}
                    className="inline-flex items-center justify-center"
                  >
                    {block.content}
                  </div>
                </div>
              </div>
            )}
            
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 mt-4 text-sm font-medium">
                {expandedPanels.styles ? (
                  <>
                    <ChevronUp className="w-4 h-4" /> Hide Style Options
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" /> Show Style Options
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-2">
                  <Label>Custom Styles (CSS)</Label>
                  <Input
                    value={Object.entries(block.styles || {}).map(([k, v]) => `${k}: ${v}`).join("; ")}
                    onChange={(e) => {
                      const styles = e.target.value.split(";").reduce((acc, style) => {
                        const [k, v] = style.split(":").map(s => s.trim());
                        if (k && v) acc[k] = v;
                        return acc;
                      }, {} as Record<string, string>);
                      updateContentBlock(block.id, { styles }, section);
                    }}
                    placeholder="font-size: 16px; color: #333;"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addContentBlock("text", section)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Text
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addContentBlock("image", section)}
          >
            <ImageIcon className="w-4 h-4 mr-2" /> Add Image
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addContentBlock("html", section)}
          >
            <Code className="w-4 h-4 mr-2" /> Add HTML
          </Button>
          {isGapTexts && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addContentBlock("button", section)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Button
            </Button>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    generateXML();
  }, [question]);

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Gap Match Question Builder</h1>
          <p className="text-gray-600">
            Create interactive gap match questions with rich text editing
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Import existing QTI XML or start with a blank template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Import QTI XML</Label>
              <Textarea
                value={importXML}
                onChange={(e) => setImportXML(e.target.value)}
                placeholder="Paste QTI XML here..."
                rows={6}
                className="font-mono text-sm"
              />
              <div className="mt-2 flex justify-between">
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
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !importXML.trim()}
                >
                  {isImporting ? "Importing..." : "Import XML"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Question Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="gaps">Gaps & Buttons</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Question ID</Label>
                    <Input
                      value={question.identifier}
                      onChange={(e) => setQuestion(prev => ({ ...prev, identifier: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={question.title}
                      onChange={(e) => setQuestion(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                </div>
                
                <Collapsible open={expandedPanels.instructions} onOpenChange={() => togglePanel("instructions")}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Instructions</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {expandedPanels.instructions ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    {renderContentEditor("instructions")}
                  </CollapsibleContent>
                </Collapsible>
                
                <Collapsible open={expandedPanels.content} onOpenChange={() => togglePanel("content")}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Main Content</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {expandedPanels.content ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    {renderContentEditor("baseContent")}
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
              
              <TabsContent value="gaps" className="space-y-6">
                <Collapsible open={expandedPanels.gapTexts} onOpenChange={() => togglePanel("gapTexts")}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Draggable Buttons</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {expandedPanels.gapTexts ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    {renderContentEditor("gapTexts")}
                  </CollapsibleContent>
                </Collapsible>
                
                <div>
                  <h3 className="font-medium mb-2">Gap Positions</h3>
                  <div className="space-y-4">
                    {question.baseContent.length > 0 && (
                      <div className="p-4 border rounded bg-white">
                        <h4 className="text-sm font-medium mb-2">Content Preview with Gaps</h4>
                        <div className="p-2 bg-gray-50 rounded">
                          {question.baseContent[0].content.split(" ").map((word, index) => {
                            const gap = question.gaps.find(g => g.position === index);
                            return (
                              <span key={index} className="inline-flex items-baseline mx-1">
                                {word}
                                {gap && (
                                  <span className="relative mx-1">
                                    <span className="inline-block w-6 h-4 border-b-2 border-red-400">
                                      <span className="absolute -top-4 left-0 text-xs text-red-500">
                                        {gap.id}
                                      </span>
                                    </span>
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Shuffle Gaps</Label>
                        <Toggle
                          pressed={question.shuffle}
                          onPressedChange={() => setQuestion(prev => ({ ...prev, shuffle: !prev.shuffle }))}
                          className="w-full"
                        >
                          {question.shuffle ? "Enabled" : "Disabled"}
                        </Toggle>
                      </div>
                      <div>
                        <Label>Max Associations</Label>
                        <Input
                          type="number"
                          value={question.maxAssociations}
                          onChange={(e) => setQuestion(prev => ({ 
                            ...prev, 
                            maxAssociations: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="space-y-6">
                <Collapsible open={expandedPanels.feedback} onOpenChange={() => togglePanel("feedback")}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Feedback Messages</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {expandedPanels.feedback ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Correct Answer Feedback</h4>
                      {renderContentEditor("correctFeedback")}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Incorrect Answer Feedback</h4>
                      {renderContentEditor("incorrectFeedback")}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
              
              <TabsContent value="styles" className="space-y-4">
                <Collapsible open={expandedPanels.styles} onOpenChange={() => togglePanel("styles")}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Global Styles</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {expandedPanels.styles ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Font Family</Label>
                        <Input
                          value={question.globalStyles.fontFamily}
                          onChange={(e) => setQuestion(prev => ({
                            ...prev,
                            globalStyles: { ...prev.globalStyles, fontFamily: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Font Size</Label>
                        <Input
                          value={question.globalStyles.fontSize}
                          onChange={(e) => setQuestion(prev => ({
                            ...prev,
                            globalStyles: { ...prev.globalStyles, fontSize: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Background Color</Label>
                        <Input
                          value={question.globalStyles.backgroundColor}
                          onChange={(e) => setQuestion(prev => ({
                            ...prev,
                            globalStyles: { ...prev.globalStyles, backgroundColor: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Padding</Label>
                        <Input
                          value={question.globalStyles.padding}
                          onChange={(e) => setQuestion(prev => ({
                            ...prev,
                            globalStyles: { ...prev.globalStyles, padding: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Custom CSS</Label>
                      <Textarea
                        value={Object.entries(question.globalStyles)
                          .filter(([k]) => !["fontFamily", "fontSize", "backgroundColor", "padding"].includes(k))
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(";\n")}
                        onChange={(e) => {
                          const newStyles = e.target.value.split(";\n").reduce((acc, line) => {
                            const [k, v] = line.split(":").map(s => s.trim());
                            if (k && v) acc[k] = v;
                            return acc;
                          }, {} as Record<string, string>);
                          
                          setQuestion(prev => ({
                            ...prev,
                            globalStyles: {
                              ...prev.globalStyles,
                              ...newStyles
                            }
                          }));
                        }}
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {generatedXML && (
          <Card>
            <CardHeader>
              <CardTitle>Generated QTI XML</CardTitle>
              <CardDescription>
                Copy this XML or download it for use in your LMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <XMLViewer xml={generatedXML} filename={`${question.identifier}.xml`} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}