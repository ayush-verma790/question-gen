"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, GripVertical, Eye } from "lucide-react"
import { ContentBlockEditor } from "@/components/content-block-editor"
import { XMLViewer } from "@/components/xml-viewer"
import type { OrderQuestion, OrderOption, ContentBlock } from "@/lib/types"
import { generateOrderXML } from "@/lib/xml-generator"

export default function OrderBuilderPage() {
  const [question, setQuestion] = useState<OrderQuestion>({
    identifier: "order-question-1",
    title: "Sample Order Question",
    promptBlocks: [
      {
        id: "prompt_block_1",
        type: "text",
        content:
          "<p><strong>Arrange the following steps of the software development lifecycle in the correct order:</strong></p>",
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
    options: [
      {
        identifier: "option_1",
        contentBlocks: [
          {
            id: "option_1_block",
            type: "text",
            content: "<p><strong>Requirements Analysis</strong> - Gather and analyze user needs</p>",
            styles: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
              color: "#3498db",
              padding: "12px",
              backgroundColor: "#ecf0f1",
              borderRadius: "6px",
            },
            attributes: {},
          },
        ],
        correctOrder: 1,
      },
      {
        identifier: "option_2",
        contentBlocks: [
          {
            id: "option_2_block",
            type: "text",
            content: "<p><strong>Design</strong> - Create system architecture and UI/UX designs</p>",
            styles: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
              color: "#9b59b6",
              padding: "12px",
              backgroundColor: "#f4ecf7",
              borderRadius: "6px",
            },
            attributes: {},
          },
        ],
        correctOrder: 2,
      },
      {
        identifier: "option_3",
        contentBlocks: [
          {
            id: "option_3_block",
            type: "text",
            content: "<p><strong>Implementation</strong> - Write and develop the actual code</p>",
            styles: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
              color: "#e67e22",
              padding: "12px",
              backgroundColor: "#fdf2e9",
              borderRadius: "6px",
            },
            attributes: {},
          },
        ],
        correctOrder: 3,
      },
      {
        identifier: "option_4",
        contentBlocks: [
          {
            id: "option_4_block",
            type: "text",
            content: "<p><strong>Testing</strong> - Verify functionality and fix bugs</p>",
            styles: {
              fontSize: "16px",
              fontFamily: "Arial, sans-serif",
              color: "#27ae60",
              padding: "12px",
              backgroundColor: "#eafaf1",
              borderRadius: "6px",
            },
            attributes: {},
          },
        ],
        correctOrder: 4,
      },
    ],
    correctFeedbackBlocks: [
      {
        id: "correct_feedback_block",
        type: "text",
        content: "<p><strong>Perfect!</strong> You understand the software development lifecycle correctly.</p>",
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
        content: "<p><strong>Not quite right.</strong> Think about the logical flow of software development.</p>",
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
    shuffle: true,
    orientation: "vertical",
  })

  const [generatedXML, setGeneratedXML] = useState("")

  useEffect(() => {
    if (question.identifier && question.promptBlocks.length > 0 && question.options.length > 0) {
      const xml = generateOrderXML(question)
      setGeneratedXML(xml)
    }
  }, [question])

  const addOption = () => {
    const newOption: OrderOption = {
      identifier: `option_${question.options.length + 1}`,
      contentBlocks: [
        {
          id: `option_block_${Date.now()}`,
          type: "text",
          content: "Enter option content...",
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
      correctOrder: question.options.length + 1,
    }

    setQuestion((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
  }

  const removeOption = (identifier: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options
        .filter((opt) => opt.identifier !== identifier)
        .map((opt, index) => ({ ...opt, correctOrder: index + 1 })),
    }))
  }

  const moveOption = (identifier: string, direction: "up" | "down") => {
    const options = [...question.options]
    const index = options.findIndex((opt) => opt.identifier === identifier)

    if (index === -1) return

    if (direction === "up" && index > 0) {
      ;[options[index], options[index - 1]] = [options[index - 1], options[index]]
    } else if (direction === "down" && index < options.length - 1) {
      ;[options[index], options[index + 1]] = [options[index + 1], options[index]]
    }

    const reorderedOptions = options.map((opt, idx) => ({
      ...opt,
      correctOrder: idx + 1,
    }))

    setQuestion((prev) => ({
      ...prev,
      options: reorderedOptions,
    }))
  }

  const updateOptionBlocks = (identifier: string, blocks: ContentBlock[]) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.identifier === identifier ? { ...opt, contentBlocks: blocks } : opt)),
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Question Builder</h1>
          <p className="text-gray-600">Create drag-and-drop ordering questions with rich multimedia content</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
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
                    placeholder="e.g., order-question-1"
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
                  Order Options
                  <Button onClick={addOption}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-600">Arrange in the correct order (first to last)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {question.options.map((option, index) => (
                  <Card key={option.identifier} className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveOption(option.identifier, "up")}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveOption(option.identifier, "down")}
                          disabled={index === question.options.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium min-w-[2rem] text-center">
                        {option.correctOrder}
                      </div>
                      <Label className="font-medium flex-1">Option {option.identifier}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removeOption(option.identifier)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <ContentBlockEditor
                      blocks={option.contentBlocks}
                      onChange={(blocks) => updateOptionBlocks(option.identifier, blocks)}
                      title="Option Content"
                    />
                  </Card>
                ))}
              </CardContent>
            </Card>

            <ContentBlockEditor
              blocks={question.correctFeedbackBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, correctFeedbackBlocks: blocks }))}
              title="Correct Answer Feedback"
            />

            <ContentBlockEditor
              blocks={question.incorrectFeedbackBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, incorrectFeedbackBlocks: blocks }))}
              title="Incorrect Answer Feedback"
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.promptBlocks.length > 0 && question.options.length > 0 ? (
                  <div className="space-y-4">
                    <div>{renderContentBlocks(question.promptBlocks)}</div>
                    <div className={`space-y-2 ${question.orientation === "horizontal" ? "flex flex-wrap gap-2" : ""}`}>
                      <p className="text-sm text-gray-600 mb-2">Items to order:</p>
                      {question.options
                        .slice()
                        .sort(() => (question.shuffle ? Math.random() - 0.5 : 0))
                        .map((option) => (
                          <div
                            key={option.identifier}
                            className={`p-3 border rounded bg-gray-50 cursor-move ${
                              question.orientation === "horizontal" ? "flex-1 min-w-[200px]" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <div className="flex-1">{renderContentBlocks(option.contentBlocks)}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-4">
                      <strong>Correct order:</strong>
                      <div className="mt-1">
                        {question.options.map((opt, index) => (
                          <div key={opt.identifier} className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{opt.correctOrder}.</span>
                            <div className="text-sm">{renderContentBlocks(opt.contentBlocks)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Add question prompt and options to see preview</p>
                )}
              </CardContent>
            </Card>

            {generatedXML && (
              <XMLViewer xml={generatedXML} filename={`${question.identifier || "order-question"}.xml`} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
