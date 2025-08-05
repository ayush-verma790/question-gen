"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Eye } from "lucide-react"
import { ContentBlockEditor } from "@/components/content-block-editor"
import { XMLViewer } from "@/components/xml-viewer"
import type { TextEntryQuestion, ContentBlock } from "@/lib/types"
import { generateTextEntryXML } from "@/lib/xml-generator"

export default function TextEntryBuilderPage() {
  const [question, setQuestion] = useState<TextEntryQuestion>({
    identifier: "text-entry-question-1",
    title: "Sample Text Entry Question",
    promptBlocks: [
      {
        id: "prompt_block_1",
        type: "text",
        content:
          "<p><strong>What is the capital city of France?</strong></p><p>Please enter your answer in the text box below:</p>",
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
      {
        id: "prompt_block_2",
        type: "image",
        content: "/placeholder.svg?height=200&width=300&text=France+Map",
        styles: {
          margin: "16px auto",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        },
        attributes: {
          width: "300",
          height: "200",
          alt: "Map of France",
        },
      },
    ],
    correctAnswers: ["Paris", "paris", "PARIS"],
    caseSensitive: false,
    correctFeedbackBlocks: [
      {
        id: "correct_feedback_block",
        type: "text",
        content: "<p><strong>Correct!</strong> Paris is indeed the capital of France. 🇫🇷</p>",
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
        content: "<p><strong>Not quite right.</strong> Think about the most famous city in France.</p>",
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
    expectedLength: 20,
    patternMask: "",
  })

  const [newAnswer, setNewAnswer] = useState("")
  const [generatedXML, setGeneratedXML] = useState("")

  useEffect(() => {
    if (question.identifier && question.promptBlocks.length > 0 && question.correctAnswers.length > 0) {
      const xml = generateTextEntryXML(question)
      setGeneratedXML(xml)
    }
  }, [question])

  const addAnswer = () => {
    if (!newAnswer.trim()) return

    setQuestion((prev) => ({
      ...prev,
      correctAnswers: [...prev.correctAnswers, newAnswer.trim()],
    }))
    setNewAnswer("")
  }

  const removeAnswer = (index: number) => {
    setQuestion((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers.filter((_, i) => i !== index),
    }))
  }

  const updateAnswer = (index: number, value: string) => {
    setQuestion((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers.map((answer, i) => (i === index ? value : answer)),
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Entry Question Builder</h1>
          <p className="text-gray-600">Create fill-in-the-blank and short answer questions with rich content</p>
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
                    placeholder="e.g., text-entry-question-1"
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
                    <Label>Expected Length (characters)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.expectedLength || ""}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          expectedLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Pattern/Mask</Label>
                    <Input
                      value={question.patternMask || ""}
                      onChange={(e) => setQuestion((prev) => ({ ...prev, patternMask: e.target.value }))}
                      placeholder="e.g., [0-9]{4} for 4 digits"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={question.caseSensitive}
                    onCheckedChange={(checked) => setQuestion((prev) => ({ ...prev, caseSensitive: !!checked }))}
                  />
                  <Label>Case sensitive</Label>
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
                <CardTitle>Correct Answers</CardTitle>
                <p className="text-sm text-gray-600">Add multiple acceptable answers</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Enter correct answer"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addAnswer()
                      }
                    }}
                  />
                  <Button onClick={addAnswer} disabled={!newAnswer.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {question.correctAnswers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <Input
                        value={answer}
                        onChange={(e) => updateAnswer(index, e.target.value)}
                        placeholder="Correct answer"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeAnswer(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {question.correctAnswers.length === 0 && (
                  <p className="text-gray-500 text-sm">Add at least one correct answer</p>
                )}
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
                {question.promptBlocks.length > 0 && question.correctAnswers.length > 0 ? (
                  <div className="space-y-4">
                    <div>{renderContentBlocks(question.promptBlocks)}</div>
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded">
                      <Input
                        placeholder="Student would type answer here..."
                        maxLength={question.expectedLength}
                        disabled
                        className="bg-white"
                      />
                      {question.expectedLength && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expected length: {question.expectedLength} characters
                        </p>
                      )}
                      {question.patternMask && <p className="text-xs text-gray-500">Pattern: {question.patternMask}</p>}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Acceptable answers:</strong>
                      </p>
                      <ul className="list-disc list-inside">
                        {question.correctAnswers.map((answer, index) => (
                          <li key={index} className="text-green-600">
                            "{answer}" {!question.caseSensitive && "(case insensitive)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Add question prompt and correct answers to see preview</p>
                )}
              </CardContent>
            </Card>

            {generatedXML && (
              <XMLViewer xml={generatedXML} filename={`${question.identifier || "text-entry-question"}.xml`} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
