"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye, Copy, Upload } from "lucide-react";
import { XMLViewer } from "@/components/xml-viewer";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface GapMatchQuestion {
  identifier: string;
  title: string;
  instructions: string;
  baseText: string;
  gaps: {
    id: string;
    position: number;
    isCorrect: boolean;
  }[];
  gapTexts: {
    id: string;
    text: string;
  }[];
  shuffle: boolean;
  maxAssociations: number;
  correctFeedback: string;
  incorrectFeedback: string;
}

export default function GapMatchBuilder() {
  const [question, setQuestion] = useState<GapMatchQuestion>({
    identifier: "gap-match-" + Date.now(),
    title: "Comma Placement",
    instructions: "Add commas to correct the sentence. The sentence should have three commas.",
    baseText: "My sports bag holds a jersey shorts socks and cleats for practice.",
    gaps: [
      { id: "pos6", position: 6, isCorrect: true },
      { id: "pos7", position: 7, isCorrect: true },
      { id: "pos8", position: 8, isCorrect: true }
    ],
    gapTexts: [{ id: "comma", text: "," }],
    shuffle: false,
    maxAssociations: 0,
    correctFeedback: "<strong>Great job using commas correctly!</strong><br/><br/>...",
    incorrectFeedback: "<strong>Let's fix the commas together.</strong><br/><br/>..."
  });

  const [generatedXML, setGeneratedXML] = useState("");
  const [editingGapId, setEditingGapId] = useState<string | null>(null);
  const [newGapPosition, setNewGapPosition] = useState(0);
  const [activeTab, setActiveTab] = useState<"gaps" | "texts" | "feedback">("gaps");

  // Helper function to get gap text ID for a gap
  const getGapTextId = (gapId: string) => {
    // In this simple implementation, we'll use the first gap text
    // For more complex cases, you might want to map specific gaps to specific texts
    return question.gapTexts[0]?.id || "comma";
  };

  useEffect(() => {
    generateXML();
  }, [question]);

  const generateXML = () => {
    // Split the base text into parts with gaps
    const words = question.baseText.split(" ");
    const gapPositions = question.gaps.map(gap => gap.position);
    
    // Generate the XML structure
    const xml = `<?xml version="1.0"?>
<qti-assessment-item 
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
  identifier="${question.identifier}" 
  title="${question.title}" 
  time-dependent="false" 
  xml:lang="en-US">
  
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      ${question.gaps.filter(g => g.isCorrect).map(g => `<qti-value>${getGapTextId(g.id)} ${g.id}</qti-value>`).join("\n      ")}
    </qti-correct-response>
  </qti-response-declaration>
  
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  
  <qti-item-body>
    <div>
      <h4>${question.instructions}</h4>
    </div>
    
    <qti-gap-match-interaction 
      response-identifier="RESPONSE" 
      shuffle="${question.shuffle}" 
      max-associations="${question.maxAssociations}">
      
      ${question.gapTexts.map(gt => 
        `<qti-gap-text identifier="${gt.id}" match-max="${question.gaps.filter(g => g.isCorrect).length}">${gt.text}</qti-gap-text>`
      ).join("\n      ")}
      
      <p>
        ${words.map((word, index) => {
          const gap = question.gaps.find(g => g.position === index);
          return gap 
            ? `${word}<qti-gap identifier="${gap.id}" />`
            : `${word} `;
        }).join("")}
      </p>
    </qti-gap-match-interaction>
    
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <qti-content-body>
        <p>${question.correctFeedback}</p>
      </qti-content-body>
    </qti-feedback-block>
    
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
      <qti-content-body>
        <p>${question.incorrectFeedback}</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>
  
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

    setGeneratedXML(xml);
  };

  // ... rest of the component code remains the same ...
  const addGap = () => {
    if (newGapPosition < 0 || newGapPosition >= question.baseText.split(" ").length) return;
    
    const newId = `pos${question.gaps.length + 1}`;
    setQuestion(prev => ({
      ...prev,
      gaps: [...prev.gaps, { id: newId, position: newGapPosition, isCorrect: true }]
    }));
    setNewGapPosition(0);
  };

  const removeGap = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      gaps: prev.gaps.filter(g => g.id !== id)
    }));
  };

  const toggleCorrect = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      gaps: prev.gaps.map(g => 
        g.id === id ? { ...g, isCorrect: !g.isCorrect } : g
      )
    }));
  };

  const addGapText = (text: string) => {
    if (!text.trim()) return;
    
    const newId = `gap${question.gapTexts.length + 1}`;
    setQuestion(prev => ({
      ...prev,
      gapTexts: [...prev.gapTexts, { id: newId, text: text.trim() }]
    }));
  };

  const removeGapText = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      gapTexts: prev.gapTexts.filter(gt => gt.id !== id)
    }));
  };

  const renderPreview = () => {
    const words = question.baseText.split(" ");
    return (
      <div className="p-4 border rounded bg-white">
        <h4 className="text-lg font-medium mb-4">{question.instructions}</h4>
        <p className="text-lg">
          {words.map((word, index) => {
            const gap = question.gaps.find(g => g.position === index);
            return (
              <span key={index}>
                {word}
                {gap && (
                  <span className="inline-block mx-1 w-8 h-6 border-b-2 border-gray-400 relative">
                    <span className="absolute -top-5 left-0 text-xs text-gray-500">
                      {gap.id}
                    </span>
                    {gap.isCorrect && (
                      <span className="absolute -bottom-5 left-0 text-xs text-green-600">
                        {question.gapTexts[0]?.text || "[gap]"}
                      </span>
                    )}
                  </span>
                )}
                {" "}
              </span>
            );
          })}
        </p>
        <div className="mt-4">
          <h5 className="font-medium mb-2">Draggable Items:</h5>
          <div className="flex gap-2">
            {question.gapTexts.map(gt => (
              <Badge key={gt.id} variant="outline" className="px-3 py-1">
                {gt.text}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-[70%] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gap Match Interaction Builder
          </h1>
          <p className="text-gray-600">
            Create drag-and-drop gap fill questions
          </p>
        </div>

        <div className="w-full space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Identifier</Label>
                <Input
                  value={question.identifier}
                  onChange={(e) => 
                    setQuestion(prev => ({ ...prev, identifier: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={question.title}
                  onChange={(e) => 
                    setQuestion(prev => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Instructions</Label>
                <Input
                  value={question.instructions}
                  onChange={(e) => 
                    setQuestion(prev => ({ ...prev, instructions: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Base Text</Label>
                <textarea
                  value={question.baseText}
                  onChange={(e) => 
                    setQuestion(prev => ({ ...prev, baseText: e.target.value }))
                  }
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <Toggle
                  pressed={question.shuffle}
                  onPressedChange={() => 
                    setQuestion(prev => ({ ...prev, shuffle: !prev.shuffle }))
                  }
                >
                  Shuffle Gaps
                </Toggle>
                <div>
                  <Label>Max Associations</Label>
                  <Input
                    type="number"
                    value={question.maxAssociations}
                    onChange={(e) => 
                      setQuestion(prev => ({ 
                        ...prev, 
                        maxAssociations: parseInt(e.target.value) || 0 
                      }))
                    }
                    className="w-20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gap Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="gaps">Gap Positions</TabsTrigger>
                  <TabsTrigger value="texts">Gap Texts</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="gaps">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={newGapPosition}
                        onChange={(e) => setNewGapPosition(parseInt(e.target.value) || 0)}
                        min={0}
                        max={question.baseText.split(" ").length - 1}
                        placeholder="Word position"
                        className="w-24"
                      />
                      <Button onClick={addGap}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Gap
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {question.gaps.map(gap => (
                        <div key={gap.id} className="flex items-center gap-4 p-2 border rounded">
                          <Badge 
                            variant={gap.isCorrect ? "default" : "secondary"}
                            onClick={() => toggleCorrect(gap.id)}
                            className="cursor-pointer"
                          >
                            {gap.id} (pos: {gap.position})
                          </Badge>
                          <span>
                            {question.baseText.split(" ")[gap.position]}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeGap(gap.id)}
                            className="ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="texts">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Text to drag (e.g., ',')"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addGapText(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={() => {
                        const input = document.querySelector('input[placeholder="Text to drag"]');
                        if (input) {
                          addGapText((input as HTMLInputElement).value);
                          (input as HTMLInputElement).value = "";
                        }
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Text
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {question.gapTexts.map(gt => (
                        <Badge 
                          key={gt.id} 
                          variant="outline" 
                          className="px-3 py-1 flex items-center gap-2"
                        >
                          {gt.text}
                          <Trash2 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeGapText(gt.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="feedback">
                  <div className="space-y-4">
                    <div>
                      <Label>Correct Feedback</Label>
                      <textarea
                        value={question.correctFeedback}
                        onChange={(e) => 
                          setQuestion(prev => ({ 
                            ...prev, 
                            correctFeedback: e.target.value 
                          }))
                        }
                        className="w-full p-2 border rounded min-h-32"
                      />
                    </div>
                    <div>
                      <Label>Incorrect Feedback</Label>
                      <textarea
                        value={question.incorrectFeedback}
                        onChange={(e) => 
                          setQuestion(prev => ({ 
                            ...prev, 
                            incorrectFeedback: e.target.value 
                          }))
                        }
                        className="w-full p-2 border rounded min-h-32"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderPreview()}
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>Correct gaps:</strong>{" "}
                  {question.gaps.filter(g => g.isCorrect).map(g => g.id).join(", ") || "None"}
                </p>
                <p>
                  <strong>Draggable texts:</strong>{" "}
                  {question.gapTexts.map(gt => gt.text).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>

          {generatedXML && (
            <XMLViewer
              xml={generatedXML}
              filename={`${question.identifier}.xml`}
            />
          )}
        </div>
      </div>
    </div>
  );
}