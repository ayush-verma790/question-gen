"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, ArrowRight, Eye, Upload } from "lucide-react"
import { ContentBlockEditor } from "@/components/content-block-editor"
import { XMLViewer } from "@/components/xml-viewer"
import type { MatchQuestion, MatchPair, ContentBlock } from "@/lib/types"
import { generateMatchXML } from "@/lib/xml-generator"

// Helper function to parse XML string and extract content blocks

// Update the parseMatchXML function to handle QTI format
const parseMatchXML = (xmlString: string): MatchQuestion | null => {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, "text/xml")
    
    const itemElement = xmlDoc.querySelector('qti-assessment-item')
    if (!itemElement) return null

    const identifier = itemElement.getAttribute('identifier') || `match-question-${Date.now()}`
    const title = itemElement.getAttribute('title') || 'Untitled Match Question'
    
    // Get max associations from match interaction
    const matchInteraction = xmlDoc.querySelector('qti-match-interaction')
    const maxAssociations = parseInt(matchInteraction?.getAttribute('max-associations') || '3')
    const shuffle = matchInteraction?.getAttribute('shuffle') === 'true'

    // Get correct pairs from response declaration
    const pairs: MatchPair[] = []
    const correctResponses = xmlDoc.querySelectorAll('qti-response-declaration qti-correct-response qti-value')
    const leftItems = xmlDoc.querySelectorAll('qti-simple-match-set:first-child qti-simple-associable-choice')
    const rightItems = xmlDoc.querySelectorAll('qti-simple-match-set:last-child qti-simple-associable-choice')

    // Create a map of left and right items
    const leftMap = new Map<string, Element>()
    const rightMap = new Map<string, Element>()

    leftItems.forEach(item => {
      const id = item.getAttribute('identifier') || ''
      leftMap.set(id, item)
    })

    rightItems.forEach(item => {
      const id = item.getAttribute('identifier') || ''
      rightMap.set(id, item)
    })

    // Process correct responses to create pairs
    correctResponses.forEach(response => {
      const [leftId, rightId] = response.textContent?.trim().split(' ') || []
      if (leftId && rightId && leftMap.has(leftId) && rightMap.has(rightId)) {
        const leftElement = leftMap.get(leftId) as any
        const rightElement = rightMap.get(rightId) as any

        pairs.push({
          leftId,
          leftContentBlocks: parseContentBlocks(leftElement),
          rightId,
          rightContentBlocks: parseContentBlocks(rightElement)
        })
      }
    })

    // If no correct responses found (invalid QTI), just use all left and right items
    if (pairs.length === 0) {
      leftItems.forEach((leftItem, index) => {
        const leftId = leftItem.getAttribute('identifier') || `left_${index + 1}`
        const rightItem = rightItems[index]
        const rightId = rightItem?.getAttribute('identifier') || `right_${index + 1}`

        if (leftItem && rightItem) {
          pairs.push({
            leftId,
            leftContentBlocks: parseContentBlocks(leftItem),
            rightId,
            rightContentBlocks: parseContentBlocks(rightItem)
          })
        }
      })
    }

    // Get prompt from item body (first div before match interaction)
    const promptElement = xmlDoc.querySelector('qti-item-body > div:first-of-type')
    
    // Get feedback blocks
    const correctFeedbackElement = xmlDoc.querySelector('qti-feedback-block[identifier="CORRECT"] div')
    const incorrectFeedbackElement = xmlDoc.querySelector('qti-feedback-block[identifier="INCORRECT"] div')

    return {
      identifier,
      title,
      promptBlocks: parseContentBlocks(promptElement),
      pairs,
      correctFeedbackBlocks: parseContentBlocks(correctFeedbackElement),
      incorrectFeedbackBlocks: parseContentBlocks(incorrectFeedbackElement),
      maxAssociations,
      shuffle
    }
  } catch (error) {
    console.error('Error parsing QTI XML:', error)
    return null
  }
}

// Update the parseContentBlocks function to handle QTI content
const parseContentBlocks = (element: Element | null): ContentBlock[] => {
  if (!element) return []
  
  // For QTI elements, we want to get their inner content
  const contentElement = element.tagName.toLowerCase().startsWith('qti-') ? 
    element.querySelector('div') || element : 
    element

  const styles: Record<string, string> = {}
  const styleAttr = contentElement.getAttribute('style')
  if (styleAttr) {
    styleAttr.split(';').forEach(style => {
      const [key, value] = style.split(':').map(s => s.trim())
      if (key && value) {
        styles[key] = value
      }
    })
  }

  const attributes: Record<string, string> = {}
  Array.from(contentElement.attributes).forEach(attr => {
    if (attr.name !== 'style') {
      attributes[attr.name] = attr.value
    }
  })

  // Get the HTML content, handling both direct content and qti-content-body
  let content = contentElement.innerHTML
  if (contentElement.querySelector('qti-content-body')) {
    content = contentElement.querySelector('qti-content-body')?.innerHTML || ''
  }

  return [{
    id: `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'text', // Default to text for QTI content
    content,
    styles,
    attributes
  }]
}

export default function MatchBuilderPage() {
  const [question, setQuestion] = useState<MatchQuestion>({
    identifier: "match-question-1",
    title: "Sample Match Question",
    promptBlocks: [
      {
        id: "prompt_block_1",
        type: "text",
        content: "<p><strong>Match each programming concept with its correct definition:</strong></p>",
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
    pairs: [
      {
        leftId: "left_1",
        leftContentBlocks: [
          {
            id: "left_1_block",
            type: "text",
            content: "<p><strong>Variable</strong></p>",
            styles: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
              color: "#3498db",
              padding: "12px",
              backgroundColor: "#ebf3fd",
              borderRadius: "6px",
              textAlign: "center",
            },
            attributes: {},
          },
        ],
        rightId: "right_1",
        rightContentBlocks: [
          {
            id: "right_1_block",
            type: "text",
            content: "<p>A storage location with an associated name that contains data</p>",
            styles: {
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              color: "#2c3e50",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
            },
            attributes: {},
          },
        ],
      },
      {
        leftId: "left_2",
        leftContentBlocks: [
          {
            id: "left_2_block",
            type: "text",
            content: "<p><strong>Function</strong></p>",
            styles: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
              color: "#e67e22",
              padding: "12px",
              backgroundColor: "#fdf2e9",
              borderRadius: "6px",
              textAlign: "center",
            },
            attributes: {},
          },
        ],
        rightId: "right_2",
        rightContentBlocks: [
          {
            id: "right_2_block",
            type: "text",
            content: "<p>A reusable block of code that performs a specific task</p>",
            styles: {
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              color: "#2c3e50",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
            },
            attributes: {},
          },
        ],
      },
      {
        leftId: "left_3",
        leftContentBlocks: [
          {
            id: "left_3_block",
            type: "text",
            content: "<p><strong>Loop</strong></p>",
            styles: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
              color: "#27ae60",
              padding: "12px",
              backgroundColor: "#eafaf1",
              borderRadius: "6px",
              textAlign: "center",
            },
            attributes: {},
          },
        ],
        rightId: "right_3",
        rightContentBlocks: [
          {
            id: "right_3_block",
            type: "text",
            content: "<p>A control structure that repeats a block of code</p>",
            styles: {
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              color: "#2c3e50",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
            },
            attributes: {},
          },
        ],
      },
    ],
    correctFeedbackBlocks: [
      {
        id: "correct_feedback_block",
        type: "text",
        content: "<p><strong>Excellent!</strong> You have a solid understanding of programming concepts.</p>",
        styles: {
          fontSize: "16px",
          color: "#27ae60",
          backgroundColor: "#d5f4e6",
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
        content: "<p><strong>Not quite right.</strong> Review the programming concepts and try again.</p>",
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
    maxAssociations: 3,
    shuffle: true,
  })

  const [generatedXML, setGeneratedXML] = useState("")
  const [importXML, setImportXML] = useState("")

  useEffect(() => {
    if (question.identifier && question.promptBlocks.length > 0 && question.pairs.length > 0) {
      const xml = generateMatchXML(question)
      setGeneratedXML(xml)
    }
  }, [question])

  const handleImportXML = () => {
    if (!importXML.trim()) return
    
    const parsedQuestion = parseMatchXML(importXML)
    if (parsedQuestion) {
      setQuestion(parsedQuestion)
      setImportXML("")
    } else {
      alert("Invalid XML format. Please check your XML and try again.")
    }
  }

  const addPair = () => {
    const newPair: MatchPair = {
      leftId: `left_${question.pairs.length + 1}`,
      leftContentBlocks: [
        {
          id: `left_block_${Date.now()}`,
          type: "text",
          content: "Enter left item...",
          styles: {
            fontSize: "16px",
            fontFamily: "Arial, sans-serif",
            color: "#000000",
            backgroundColor: "transparent",
            padding: "8px",
            margin: "4px",
            borderRadius: "4px",
            textAlign: "left",
          },
          attributes: {},
        },
      ],
      rightId: `right_${question.pairs.length + 1}`,
      rightContentBlocks: [
        {
          id: `right_block_${Date.now()}`,
          type: "text",
          content: "Enter right item...",
          styles: {
            fontSize: "16px",
            fontFamily: "Arial, sans-serif",
            color: "#000000",
            backgroundColor: "transparent",
            padding: "8px",
            margin: "4px",
            borderRadius: "4px",
            textAlign: "left",
          },
          attributes: {},
        },
      ],
    }

    setQuestion((prev) => ({
      ...prev,
      pairs: [...prev.pairs, newPair],
    }))
  }

  const removePair = (leftId: string) => {
    setQuestion((prev) => ({
      ...prev,
      pairs: prev.pairs.filter((pair) => pair.leftId !== leftId),
    }))
  }

  const updateLeftBlocks = (leftId: string, blocks: ContentBlock[]) => {
    setQuestion((prev) => ({
      ...prev,
      pairs: prev.pairs.map((pair) => (pair.leftId === leftId ? { ...pair, leftContentBlocks: blocks } : pair)),
    }))
  }

  const updateRightBlocks = (leftId: string, blocks: ContentBlock[]) => {
    setQuestion((prev) => ({
      ...prev,
      pairs: prev.pairs.map((pair) => (pair.leftId === leftId ? { ...pair, rightContentBlocks: blocks } : pair)),
    }))
  }

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
      }

      switch (block.type) {
        case "text":
          return (
            <div key={block.id} style={style as any}>
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
          )
        case "image":
          return (
            <img
              key={block.id}
              src={block.content || "/placeholder.svg?height=200&width=300&text=Image"}
              alt={block.attributes?.alt || "Image"}
              style={style as any}
              width={block.attributes?.width}
              height={block.attributes?.height}
            />
          )
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
          )
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
          )
        case "html":
          return <div key={block.id} style={style as any} dangerouslySetInnerHTML={{ __html: block.content }} />
        default:
          return null
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-[80%]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Match Question Builder</h1>
          <p className="text-gray-600">Create matching pair questions with rich multimedia content</p>
        </div>

        <div className="grid lg:grid-cols-1 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import XML</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="import-xml">Paste your XML here</Label>
                  <textarea
                    id="import-xml"
                    value={importXML}
                    onChange={(e) => setImportXML(e.target.value)}
                    placeholder="Paste your match question XML here..."
                    className="w-full h-40 p-2 border rounded-md font-mono text-sm"
                  />
                </div>
                <Button onClick={handleImportXML}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import XML
                </Button>
              </CardContent>
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
                    onChange={(e) => setQuestion((prev) => ({ ...prev, identifier: e.target.value }))}
                    placeholder="e.g., match-question-1"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={question.title}
                    onChange={(e) => setQuestion((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Question title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Associations</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.maxAssociations}
                      onChange={(e) =>
                        setQuestion((prev) => ({ ...prev, maxAssociations: Number.parseInt(e.target.value) || 1 }))
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={question.shuffle}
                        onCheckedChange={(checked) => setQuestion((prev) => ({ ...prev, shuffle: !!checked }))}
                      />
                      <span>Shuffle options</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ContentBlockEditor
              blocks={question.promptBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, promptBlocks: blocks }))}
              title="Question Prompt"
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Matching Pairs
                  <Button onClick={addPair}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pair
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {question.pairs.map((pair, index) => (
                  <Card key={pair.leftId} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="font-medium">Pair {index + 1}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removePair(pair.leftId)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <ContentBlockEditor
                          blocks={pair.leftContentBlocks}
                          onChange={(blocks) => updateLeftBlocks(pair.leftId, blocks)}
                          title="Left Item"
                        />
                      </div>

                      <div>
                        <ContentBlockEditor
                          blocks={pair.rightContentBlocks}
                          onChange={(blocks) => updateRightBlocks(pair.leftId, blocks)}
                          title="Right Item"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center mt-4">
                      <ArrowRight className="w-6 h-6 text-green-600" />
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* <ContentBlockEditor
              blocks={question.correctFeedbackBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, correctFeedbackBlocks: blocks }))}
              title="Correct Answer Feedback"
            /> */}

            <ContentBlockEditor
              blocks={question.incorrectFeedbackBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, incorrectFeedbackBlocks: blocks }))}
              title="Incorrect Answer Feedback"
            />
          </div>

         
        </div>
         <div className="space-y-6 mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.promptBlocks.length > 0 && question.pairs.length > 0 ? (
                  <div className="space-y-4">
                    <div>{renderContentBlocks(question.promptBlocks)}</div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Left Items:</p>
                        <div className="space-y-2">
                          {question.pairs
                            .slice()
                            .sort(() => (question.shuffle ? Math.random() - 0.5 : 0))
                            .map((pair) => (
                              <div key={pair.leftId} className="p-2 border rounded bg-blue-50 cursor-pointer">
                                {renderContentBlocks(pair.leftContentBlocks)}
                              </div>
                            ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Right Items:</p>
                        <div className="space-y-2">
                          {question.pairs
                            .slice()
                            .sort(() => (question.shuffle ? Math.random() - 0.5 : 0))
                            .map((pair) => (
                              <div key={pair.rightId} className="p-2 border rounded bg-green-50 cursor-pointer">
                                {renderContentBlocks(pair.rightContentBlocks)}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong>Correct matches:</strong>
                      {question.pairs.map((pair, index) => (
                        <div key={pair.leftId} className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{index + 1}.</span>
                          <div className="flex items-center gap-2">
                            <div className="text-sm">{renderContentBlocks(pair.leftContentBlocks)}</div>
                            <ArrowRight className="w-3 h-3" />
                            <div className="text-sm">{renderContentBlocks(pair.rightContentBlocks)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Add question prompt and matching pairs to see preview</p>
                )}
              </CardContent>
            </Card>

            {generatedXML && (
              <XMLViewer xml={generatedXML} filename={`${question.identifier || "match-question"}.xml`} />
            )}
          </div>
      </div>
    </div>
  )
}