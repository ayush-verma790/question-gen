"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye, Copy, Upload, Code, Image as ImageIcon } from "lucide-react";
import { XMLViewer } from "@/components/xml-viewer";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ContentBlock {
  id: string;
  type: "text" | "image" | "html";
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

export default function GapMatchBuilder() {
  const [question, setQuestion] = useState<GapMatchQuestion>({
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
      type: "text",
      content: ",",
      styles: { fontSize: "18px", fontWeight: "bold" }
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
  });

  const [generatedXML, setGeneratedXML] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "gaps" | "feedback" | "styles">("content");
  const [importXML, setImportXML] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Helper to generate unique IDs
  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Parse XML and update state
  const parseXML = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      // Extract basic info
      const assessmentItem = xmlDoc.querySelector("qti-assessment-item");
      const identifier = assessmentItem?.getAttribute("identifier") || generateId("gap-match");
      const title = assessmentItem?.getAttribute("title") || "Gap Match Question";
      
      // Extract instructions
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
      
      // Extract base content with gaps
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
      
      // Extract gaps
      const gaps: GapMatchQuestion["gaps"] = [];
      const gapElements = interaction?.querySelectorAll("qti-gap");
      gapElements?.forEach((gap, index) => {
        gaps.push({
          id: gap.getAttribute("identifier") || `pos${index}`,
          position: index, // This needs more sophisticated position detection
          isCorrect: true // Would need to check correct responses
        });
      });
      
      // Extract gap texts
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
      
      // Extract feedback
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
      
      // Update state
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

  // Helper to extract styles from element
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

  // Generate QTI XML
  const generateXML = () => {
    // Generate instructions
    const instructionsHTML = question.instructions
      .map(i => i.content)
      .join("");
    
    // Generate base content with gaps
    let contentWithGaps = "";
    if (question.baseContent.length > 0) {
      const firstContent = question.baseContent[0];
      const words = firstContent.content.split(" ");
      
      contentWithGaps = words.map((word, index) => {
        const gap = question.gaps.find(g => g.position === index);
        return gap ? `${word}<qti-gap identifier="${gap.id}" />` : `${word} `;
      }).join("");
    }
    
    // Generate correct responses
    const correctResponses = question.gaps
      .filter(g => g.isCorrect)
      .map(g => `<qti-value>${question.gapTexts[0]?.id || "comma"} ${g.id}</qti-value>`)
      .join("\n      ");
    
    // Generate gap texts
    const gapTextsXML = question.gapTexts
      .map(gt => `<qti-gap-text identifier="${gt.id}" match-max="${question.gaps.filter(g => g.isCorrect).length}">${gt.content}</qti-gap-text>`)
      .join("\n      ");
    
    // Generate feedback
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

  // Add new content block
  const addContentBlock = (type: "text" | "image" | "html", section: "instructions" | "content" | "correctFeedback" | "incorrectFeedback") => {
    const newBlock: ContentBlock = {
      id: generateId("block"),
      type,
      content: type === "text" ? "New text content" : 
               type === "image" ? "https://example.com/image.jpg" : 
               "<p>New HTML content</p>",
      styles: {}
    };
    
    setQuestion(prev => ({
      ...prev,
      [section]: [...prev[section], newBlock]
    }));
  };

  // Update content block
  const updateContentBlock = (id: string, updates: Partial<ContentBlock>, section: "instructions" | "content" | "correctFeedback" | "incorrectFeedback") => {
    setQuestion(prev => ({
      ...prev,
      [section]: prev[section].map(block => 
        block.id === id ? { ...block, ...updates } : block
      )
    }));
  };

  // Remove content block
  const removeContentBlock = (id: string, section: "instructions" | "content" | "correctFeedback" | "incorrectFeedback") => {
    setQuestion(prev => ({
      ...prev,
      [section]: prev[section].filter(block => block.id !== id)
    }));
  };

  // Handle XML import
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

  // Generate XML on changes
  useEffect(() => {
    generateXML();
  }, [question]);

  // Render content editor for a section
  const renderContentEditor = (section: "instructions" | "content" | "correctFeedback" | "incorrectFeedback") => {
    return (
      <div className="space-y-4">
        {question[section].map(block => (
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
              <Textarea
                value={block.content}
                onChange={(e) => updateContentBlock(block.id, { content: e.target.value }, section)}
                rows={3}
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
                className="font-mono text-sm"
              />
            )}
            
            <div className="mt-4">
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
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Gap Match Question Builder</h1>
          <p className="text-gray-600">
            Create interactive gap match questions with full HTML support
          </p>
        </div>
        
        {/* Import/Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Import/Export</CardTitle>
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
              <div className="mt-2 flex justify-end">
                <Button onClick={handleImport} disabled={isImporting || !importXML.trim()}>
                  {isImporting ? "Importing..." : "Import XML"}
                </Button>
              </div>
            </div>
            
            {generatedXML && (
              <div>
                <Label>Generated QTI XML</Label>
                <XMLViewer xml={generatedXML} filename={`${question.identifier}.xml`} />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Main Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Question Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="gaps">Gaps</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Question Identification</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Identifier</Label>
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
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Instructions</h3>
                  {renderContentEditor("instructions")}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Main Content</h3>
                  {renderContentEditor("content")}
                </div>
              </TabsContent>
              
              <TabsContent value="gaps" className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Gap Texts (Draggable Items)</h3>
                  {renderContentEditor("gapTexts")}
                </div>
                
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
                    
                    <div className="space-y-2">
                      <Label>Current Gaps</Label>
                      {question.gaps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {question.gaps.map(gap => (
                            <div key={gap.id} className="flex items-center p-2 border rounded">
                              <Badge 
                                variant={gap.isCorrect ? "default" : "secondary"}
                                className="mr-2"
                              >
                                {gap.id}
                              </Badge>
                              <span className="text-sm">
                                Position: {gap.position} ({question.baseContent[0]?.content.split(" ")[gap.position]})
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-auto"
                                onClick={() => setQuestion(prev => ({
                                  ...prev,
                                  gaps: prev.gaps.filter(g => g.id !== gap.id)
                                }))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No gaps defined yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Correct Answer Feedback</h3>
                  {renderContentEditor("correctFeedback")}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Incorrect Answer Feedback</h3>
                  {renderContentEditor("incorrectFeedback")}
                </div>
              </TabsContent>
              
              <TabsContent value="styles" className="space-y-4">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
