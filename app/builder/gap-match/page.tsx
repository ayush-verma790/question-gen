"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye, Copy, Upload, Code, Image as ImageIcon, ChevronDown, ChevronUp, Bold, Italic, Underline, Palette, Type } from "lucide-react";
import { XMLViewer } from "@/components/xml-viewer";
import { PreviewRenderer } from "@/components/preview-renderer";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ButtonSuggestions } from "@/components/button-suggestions";

interface ContentBlock {
  id: string;
  type: "text" | "image" | "html" | "button";
  content: string;
  styles?: Record<string, string>;
}

interface Gap {
  id: string;
  position: number;
  correctGapTextId?: string; // Which gap text should go in this gap
}

interface GapText {
  id: string;
  content: string;
  matchMax: number; // How many times this can be used
  styles?: Record<string, string>;
}

interface GapMatchQuestion {
  identifier: string;
  title: string;
  instructions: ContentBlock[];
  baseContent: ContentBlock[];
  gaps: Gap[];
  gapTexts: GapText[];
  shuffle: boolean;
  maxAssociations: number;
  correctFeedback: ContentBlock[];
  incorrectFeedback: ContentBlock[];
  globalStyles: Record<string, string>;
}

const initialQuestionState: GapMatchQuestion = {
  identifier: `gap-match-${Date.now()}`,
  title: "Gap Match Exercise",
  instructions: [{
    id: "instr-1",
    type: "text",
    content: "Complete the following sentences using the words or phrases provided.",
    styles: { fontSize: "16px", color: "#333" }
  }],
  baseContent: [{
    id: "content-1",
    type: "text",
    content: "One full revolution of [GAP1] around [GAP2] takes 365 days. Because [GAP3] is farther out from the center of the solar system, the planet takes almost 687 days to complete its orbit, far longer than the orbit of [GAP4], which is 88 days."
  }],
  gaps: [
    { id: "t1", position: 1, correctGapTextId: "s1" },
    { id: "t2", position: 2, correctGapTextId: "s5" },
    { id: "t3", position: 3, correctGapTextId: "s2" },
    { id: "t4", position: 4, correctGapTextId: "s3" }
  ],
  gapTexts: [
    { id: "s1", content: "Earth", matchMax: 1 },
    { id: "s2", content: "Mars", matchMax: 1 },
    { id: "s3", content: "Mercury", matchMax: 1 },
    { id: "s4", content: "the Moon", matchMax: 1 },
    { id: "s5", content: "the Sun", matchMax: 1 }
  ],
  shuffle: false,
  maxAssociations: 4,
  correctFeedback: [{
    id: "correct-1",
    type: "text",
    content: "<strong>Excellent!</strong> You've correctly placed all the items."
  }],
  incorrectFeedback: [{
    id: "incorrect-1",
    type: "text",
    content: "<strong>Try again!</strong> Some items are not in the correct positions."
  }],
  globalStyles: {
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px"
  }
};

const predefinedGapTexts = [
  { content: "Earth", label: "Earth" },
  { content: "Mars", label: "Mars" },
  { content: "Mercury", label: "Mercury" },
  { content: "the Moon", label: "The Moon" },
  { content: "the Sun", label: "The Sun" },
  { content: ",", label: "Comma" },
  { content: ".", label: "Period" },
  { content: ";", label: "Semicolon" },
  { content: ":", label: "Colon" },
  { content: "and", label: "And" },
  { content: "or", label: "Or" },
  { content: "but", label: "But" }
];

export default function GapMatchBuilder() {
  const [question, setQuestion] = useState<GapMatchQuestion>(initialQuestionState);
  const [generatedXML, setGeneratedXML] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "gaps" | "feedback" | "styles" | "preview">("content");
  const [importXML, setImportXML] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [showRenderPreview, setShowRenderPreview] = useState(false);
  
  const [expandedPanels, setExpandedPanels] = useState({
    instructions: true,
    content: true,
    gapTexts: true,
    feedback: true,
    styles: true
  });

  const togglePanel = (panel: keyof typeof expandedPanels) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

  const addGap = () => {
    const newGap = {
      id: generateId("gap"),
      position: question.gaps.length + 1,
      correctGapTextId: ""
    };
    
    setQuestion(prev => ({
      ...prev,
      gaps: [...prev.gaps, newGap]
    }));
  };

  const updateGap = (id: string, updates: Partial<Gap>) => {
    setQuestion(prev => ({
      ...prev,
      gaps: prev.gaps.map(gap => 
        gap.id === id ? { ...gap, ...updates } : gap
      )
    }));
  };

  const addGapText = (content: string = "New item") => {
    const newGapText: GapText = {
      id: generateId("gaptext"),
      content,
      matchMax: 1
    };
    
    setQuestion(prev => ({
      ...prev,
      gapTexts: [...prev.gapTexts, newGapText]
    }));
  };

  const updateGapText = (id: string, updates: Partial<GapText>) => {
    setQuestion(prev => ({
      ...prev,
      gapTexts: prev.gapTexts.map(gt => 
        gt.id === id ? { ...gt, ...updates } : gt
      )
    }));
  };

  const removeGapText = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      gapTexts: prev.gapTexts.filter(gt => gt.id !== id),
      gaps: prev.gaps.map(gap => 
        gap.correctGapTextId === id ? { ...gap, correctGapTextId: "" } : gap
      )
    }));
  };

  const removeGap = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      gaps: prev.gaps.filter(gap => gap.id !== id)
    }));
  };

  const generateXML = () => {
    // Convert content blocks to instructions HTML
    const instructionsHTML = question.instructions
      .map(block => {
        if (block.type === "image") return `<img src="${block.content}" style="${styleToString(block.styles)}" />`;
        if (block.type === "html") return block.content;
        return `<span style="${styleToString(block.styles)}">${block.content}</span>`;
      })
      .join("");
    
    // Convert base content blocks to main content HTML
    const baseContentHTML = question.baseContent
      .map(block => {
        if (block.type === "image") return `<img src="${block.content}" style="${styleToString(block.styles)}" />`;
        if (block.type === "html") return block.content;
        return `<span style="${styleToString(block.styles)}">${block.content}</span>`;
      })
      .join("");
    
    let contentWithGaps = baseContentHTML;
    // Replace [GAP1], [GAP2], etc. with qti-gap elements
    question.gaps.forEach((gap) => {
      const gapPattern = new RegExp(`\\[GAP${gap.position}\\]`, 'g');
      contentWithGaps = contentWithGaps.replace(gapPattern, `<qti-gap identifier="${gap.id}" />`);
    });
    
    const correctResponses = question.gaps
      .filter(g => g.correctGapTextId)
      .map(g => `<qti-value>${g.correctGapTextId} ${g.id}</qti-value>`)
      .join("\n      ");
    
    const mapEntries = question.gaps
      .filter(g => g.correctGapTextId)
      .map(g => `<qti-map-entry map-key="${g.correctGapTextId} ${g.id}" mapped-value="1"/>`)
      .join("\n      ");
    
    const gapTextsXML = question.gapTexts
      .map(gt => `<qti-gap-text identifier="${gt.id}" match-max="${gt.matchMax}">${gt.content}</qti-gap-text>`)
      .join("\n      ");
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item 
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" 
  identifier="${question.identifier}" 
  title="${question.title}" 
  adaptive="false" 
  time-dependent="false">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      ${correctResponses}
    </qti-correct-response>
    <qti-mapping default-value="0" lower-bound="0.00" upper-bound="${question.gaps.length}">
      ${mapEntries}
    </qti-mapping>
  </qti-response-declaration>
  
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  
  <qti-item-body>
    <div>
      ${instructionsHTML}
    </div>
    
    <qti-gap-match-interaction 
      response-identifier="RESPONSE" 
      shuffle="true" 
      max-associations="${question.gaps.length}">
      
      ${gapTextsXML}
      
      <div>
        <p>${contentWithGaps}</p>
      </div>
    </qti-gap-match-interaction>
  </qti-item-body>
  
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-is-null><qti-variable identifier="RESPONSE"/></qti-is-null>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0.00</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else-if>
        <qti-gte>
          <qti-map-response identifier="RESPONSE"/>
          <qti-base-value base-type="float">${question.gaps.length}</qti-base-value>
        </qti-gte>
        <qti-set-outcome-value identifier="SCORE">
          <qti-map-response identifier="RESPONSE"/>
        </qti-set-outcome-value>
      </qti-response-else-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0.00</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

    setGeneratedXML(xml);
  };

  const styleToString = (styles?: Record<string, string>) => {
    if (!styles) return "";
    return Object.entries(styles).map(([k, v]) => `${k}:${v}`).join(";");
  };

  const renderContentEditor = (section: keyof Pick<GapMatchQuestion, 'instructions' | 'baseContent' | 'correctFeedback' | 'incorrectFeedback'>) => {
    const content = question[section] || [];

    return (
      <div className="space-y-4">
        {content.map(block => (
          <Card key={block.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="capitalize">
                {block.type}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setQuestion(prev => ({
                    ...prev,
                    [section]: prev[section].filter(b => b.id !== block.id)
                  }));
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            {block.type === "text" && (
              <RichTextEditor
                value={block.content}
                onChange={(newContent) => {
                  setQuestion(prev => ({
                    ...prev,
                    [section]: prev[section].map(b => 
                      b.id === block.id ? { ...b, content: newContent } : b
                    )
                  }));
                }}
                placeholder="Enter your content here. Use [GAP1], [GAP2], etc. to mark where gaps should appear."
              />
            )}
            
            {block.type === "image" && (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={block.content}
                  onChange={(e) => {
                    setQuestion(prev => ({
                      ...prev,
                      [section]: prev[section].map(b => 
                        b.id === block.id ? { ...b, content: e.target.value } : b
                      )
                    }));
                  }}
                  placeholder="https://example.com/image.jpg"
                />
                {/* {block.content && (
                  <div className="mt-2">
                    <img 
                      src={block.content} 
                      alt="Preview" 
                      className="max-w-full h-auto max-h-40 object-contain border rounded"
                      style={block.styles}
                    />
                  </div>
                )} */}
              </div>
            )}
            
            {block.type === "html" && (
              <Textarea
                value={block.content}
                onChange={(e) => {
                  setQuestion(prev => ({
                    ...prev,
                    [section]: prev[section].map(b => 
                      b.id === block.id ? { ...b, content: e.target.value } : b
                    )
                  }));
                }}
                rows={6}
                className="font-mono text-sm min-h-[100px]"
              />
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
                      setQuestion(prev => ({
                        ...prev,
                        [section]: prev[section].map(b => 
                          b.id === block.id ? { ...b, styles } : b
                        )
                      }));
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
            onClick={() => {
              const newBlock: ContentBlock = {
                id: generateId("block"),
                type: "text",
                content: "New text content",
                styles: {}
              };
              setQuestion(prev => ({
                ...prev,
                [section]: [...prev[section], newBlock]
              }));
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Text
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const newBlock: ContentBlock = {
                id: generateId("block"),
                type: "image",
                content: "https://example.com/image.jpg",
                styles: {}
              };
              setQuestion(prev => ({
                ...prev,
                [section]: [...prev[section], newBlock]
              }));
            }}
          >
            <ImageIcon className="w-4 h-4 mr-2" /> Add Image
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const newBlock: ContentBlock = {
                id: generateId("block"),
                type: "html",
                content: "<p>New HTML content</p>",
                styles: {}
              };
              setQuestion(prev => ({
                ...prev,
                [section]: [...prev[section], newBlock]
              }));
            }}
          >
            <Code className="w-4 h-4 mr-2" /> Add HTML
          </Button>
        </div>
      </div>
    );
  };

  const renderGapTextsEditor = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Predefined Items (Quick Add)</Label>
          <div className="flex flex-wrap gap-2">
            {predefinedGapTexts.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  const newGapText: GapText = {
                    id: generateId("gaptext"),
                    content: item.content,
                    matchMax: 1
                  };
                  setQuestion(prev => ({
                    ...prev,
                    gapTexts: [...prev.gapTexts, newGapText]
                  }));
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Button Style Suggestions</Label>
          <ButtonSuggestions
            onSuggestionClick={(buttonHTML) => {
              const newGapText: GapText = {
                id: generateId("gaptext"),
                content: buttonHTML,
                matchMax: 1
              };
              setQuestion(prev => ({
                ...prev,
                gapTexts: [...prev.gapTexts, newGapText]
              }));
            }}
            size="sm"
            defaultCollapsed={true}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Draggable Items</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newGapText: GapText = {
                  id: generateId("gaptext"),
                  content: "New item",
                  matchMax: 1
                };
                setQuestion(prev => ({
                  ...prev,
                  gapTexts: [...prev.gapTexts, newGapText]
                }));
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
          
          {question.gapTexts.map(gapText => (
            <Card key={gapText.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline">
                  Draggable Item
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setQuestion(prev => ({
                      ...prev,
                      gapTexts: prev.gapTexts.filter(gt => gt.id !== gapText.id),
                      gaps: prev.gaps.map(gap => 
                        gap.correctGapTextId === gapText.id ? { ...gap, correctGapTextId: "" } : gap
                      )
                    }));
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Content (supports HTML)</Label>
                  <RichTextEditor
                    value={gapText.content}
                    onChange={(newContent) => {
                      setQuestion(prev => ({
                        ...prev,
                        gapTexts: prev.gapTexts.map(gt => 
                          gt.id === gapText.id ? { ...gt, content: newContent } : gt
                        )
                      }));
                    }}
                    placeholder="Enter item content (text, HTML, or styled button)"
                  />
                </div>
                <div>
                  <Label>Max Uses (0 = unlimited)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={gapText.matchMax}
                    onChange={(e) => {
                      setQuestion(prev => ({
                        ...prev,
                        gapTexts: prev.gapTexts.map(gt => 
                          gt.id === gapText.id ? { ...gt, matchMax: parseInt(e.target.value) || 0 } : gt
                        )
                      }));
                    }}
                  />
                </div>
              </div>
              
             
            </Card>
          ))}
        </div>
      </div>
    );
  };
  const renderGapPositions = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Gap Positions & Correct Answers</Label>
          <div className="space-y-2">
            {question.gaps.map(gap => (
              <div key={gap.id} className="flex items-center gap-2 p-3 border rounded">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Gap {gap.position}:</Label>
                  <Badge variant="outline" className="text-xs">
                    [GAP{gap.position}]
                  </Badge>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-600">Correct Answer:</Label>
                  <select
                    value={gap.correctGapTextId || ""}
                    onChange={(e) => {
                      setQuestion(prev => ({
                        ...prev,
                        gaps: prev.gaps.map(g => 
                          g.id === gap.id ? { ...g, correctGapTextId: e.target.value } : g
                        )
                      }));
                    }}
                    className="w-full p-1 border rounded text-sm"
                  >
                    <option value="">Select correct answer...</option>
                    {question.gapTexts.map(gt => (
                      <option key={gt.id} value={gt.id}>
                        {gt.content.replace(/<[^>]*>/g, '').substring(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setQuestion(prev => ({
                      ...prev,
                      gaps: prev.gaps.filter(g => g.id !== gap.id)
                    }));
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newGap: Gap = {
                id: generateId("gap"),
                position: question.gaps.length + 1,
                correctGapTextId: ""
              };
              setQuestion(prev => ({
                ...prev,
                gaps: [...prev.gaps, newGap]
              }));
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Gap Position
          </Button>
        </div>

        <div className="p-4 border rounded bg-white">
          <h4 className="text-sm font-medium mb-2">Content Preview with Gaps</h4>
          <div className="p-2 bg-gray-50 rounded">
            {question.baseContent.map(block => {
              let content = block.content;
              question.gaps.forEach(gap => {
                const gapText = question.gapTexts.find(gt => gt.id === gap.correctGapTextId);
                const answerPreview = gapText ? 
                  `<span class="bg-green-100 border border-green-300 px-2 py-1 rounded text-sm">${gapText.content}</span>` : 
                  `<span class="bg-gray-200 border border-gray-300 px-2 py-1 rounded text-sm">?</span>`;
                content = content.replace(`[GAP${gap.position}]`, answerPreview);
              });
              return (
                <div key={block.id} dangerouslySetInnerHTML={{ __html: content }} />
              );
            })}
          </div>
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
            Create interactive gap match questions with mixed content types
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
                <Button 
                  onClick={() => {
                    try {
                      setIsImporting(true);
                      const parser = new DOMParser();
                      const xmlDoc = parser.parseFromString(importXML, "text/xml");
                      // Basic validation
                      if (xmlDoc.querySelector("parsererror")) {
                        throw new Error("Invalid XML format");
                      }
                      setImportXML("");
                    } catch (error) {
                      alert("Error parsing XML. Please check the format.");
                    } finally {
                      setIsImporting(false);
                    }
                  }} 
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
                <TabsTrigger value="preview">Preview</TabsTrigger>
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
                    <h3 className="font-medium">Draggable Items</h3>
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
                    {renderGapTextsEditor()}
                  </CollapsibleContent>
                </Collapsible>
                
                <div>
                  <h3 className="font-medium mb-2">Gap Positions & Answers</h3>
                  {renderGapPositions()}
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
              
              <TabsContent value="preview" className="space-y-6">
                <div className="space-y-4">
               
                  
                  <Card className="p-6" style={question.globalStyles}>
                    <div className="space-y-6">
                      {/* Instructions */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Instructions:</h4>
                        <div className="space-y-2">
                          {question.instructions.map(block => (
                            <div key={block.id}>
                              {block.type === "image" ? (
                                <img 
                                  src={block.content} 
                                  alt="Instruction image" 
                                  className="max-w-full h-auto" 
                                  style={block.styles}
                                />
                              ) : (
                                <div 
                                  style={block.styles}
                                  dangerouslySetInnerHTML={{ __html: block.content }} 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Main Content with Gaps */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">Question Content:</h4>
                        <div className="space-y-2">
                          {question.baseContent.map(block => {
                            let content = block.content;
                            
                            // Replace gaps with visual placeholders
                            question.gaps.forEach(gap => {
                              const gapPattern = new RegExp(`\\[GAP${gap.position}\\]`, 'g');
                              const correctAnswer = question.gapTexts.find(gt => gt.id === gap.correctGapTextId);
                              const answerPreview = correctAnswer ? 
                                `<span class="inline-block min-w-[100px] px-3 py-1 mx-1 bg-blue-50 border-2 border-dashed border-blue-300 rounded text-center text-blue-700 font-medium">Drop Zone ${gap.position}</span>` :
                                `<span class="inline-block min-w-[100px] px-3 py-1 mx-1 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-center text-gray-500">Gap ${gap.position}</span>`;
                              content = content.replace(gapPattern, answerPreview);
                            });

                            return (
                              <div key={block.id}>
                                {block.type === "image" ? (
                                  <img 
                                    src={block.content} 
                                    alt="Content image" 
                                    className="max-w-full h-auto" 
                                    style={block.styles}
                                  />
                                ) : (
                                  <div 
                                    style={block.styles}
                                    dangerouslySetInnerHTML={{ __html: content }} 
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Draggable Items */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">Draggable Items:</h4>
                        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                          {question.gapTexts.map(gapText => (
                            <div
                              key={gapText.id}
                              className="cursor-move bg-white border border-gray-300 rounded shadow-sm hover:shadow-md transition-shadow p-2"
                              style={{ 
                                maxWidth: '200px',
                                ...(gapText.styles || {})
                              }}
                            >
                              <div 
                                dangerouslySetInnerHTML={{ __html: gapText.content }} 
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                Max uses: {gapText.matchMax || "Unlimited"}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 italic">
                          Students would drag these items to the drop zones above
                        </p>
                      </div>

                      {/* Feedback Preview */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">Feedback Messages:</h4>
                        
                        <div className="space-y-2">
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="text-sm font-medium text-green-800 mb-1">Correct Answer Feedback:</div>
                            {question.correctFeedback.map(block => (
                              <div 
                                key={block.id}
                                style={block.styles}
                                dangerouslySetInnerHTML={{ __html: block.content }} 
                              />
                            ))}
                          </div>
                          
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="text-sm font-medium text-red-800 mb-1">Incorrect Answer Feedback:</div>
                            {question.incorrectFeedback.map(block => (
                              <div 
                                key={block.id}
                                style={block.styles}
                                dangerouslySetInnerHTML={{ __html: block.content }} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Answer Key */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Answer Key (Teacher View):</h4>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="space-y-1">
                            {question.gaps.map(gap => {
                              const correctAnswer = question.gapTexts.find(gt => gt.id === gap.correctGapTextId);
                              return (
                                <div key={gap.id} className="text-sm">
                                  <span className="font-medium">Gap {gap.position}:</span>{' '}
                                  {correctAnswer ? (
                                    <span dangerouslySetInnerHTML={{ __html: correctAnswer.content }} />
                                  ) : (
                                    <span className="text-red-500">No answer assigned</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        
          <PreviewRenderer
            xmlContent={generatedXML}
            questionType="gap-match"
            disabled={!generatedXML}
          />
      

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