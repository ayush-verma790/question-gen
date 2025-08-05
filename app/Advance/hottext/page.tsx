"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Download, Eye } from "lucide-react"
import type { HottextQuestion, HottextItem, ContentBlock } from "@/lib/types"
import { RichTextEditor } from "@/components/rich-text-editor"
import { AdvancedColorPicker } from "@/components/advanced-color-picker"

export default function HottextBuilderPage() {
  const [question, setQuestion] = useState<HottextQuestion>({
    identifier: "",
    title: "",
    promptBlocks: [],
    contentBlocks: [],
    hottextItems: [],
    correctAnswers: [],
    correctFeedbackBlocks: [],
    incorrectFeedbackBlocks: [],
    maxChoices: 1,
    globalStyles: {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    customCSS: "",
  })

  const [selectedText, setSelectedText] = useState("")
  const [prompt, setPrompt] = useState("")
  const [content, setContent] = useState("")
  const [correctFeedback, setCorrectFeedback] = useState("")
  const [incorrectFeedback, setIncorrectFeedback] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  const addHottextItem = () => {
    if (!selectedText.trim()) return

    const newItem: HottextItem = {
      identifier: `H${question.hottextItems.length + 1}`,
      content: {
        type: "text",
        value: selectedText.trim(),
      },
      styles: {
        backgroundColor: "#3b82f6",
        color: "white",
        padding: "2px 4px",
        borderRadius: "3px",
        display: "inline-block",
      },
      position: { x: 0, y: 0 },
    }

    setQuestion((prev) => ({
      ...prev,
      hottextItems: [...prev.hottextItems, newItem],
    }))
    setSelectedText("")
  }

  const removeHottextItem = (identifier: string) => {
    setQuestion((prev) => ({
      ...prev,
      hottextItems: prev.hottextItems.filter((item) => item.identifier !== identifier),
      correctAnswers: prev.correctAnswers.filter((id) => id !== identifier),
    }))
  }

  const toggleCorrectAnswer = (identifier: string) => {
    setQuestion((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers.includes(identifier)
        ? prev.correctAnswers.filter((id) => id !== identifier)
        : [...prev.correctAnswers, identifier],
    }))
  }

  const updateHottextColor = (identifier: string, color: string) => {
    setQuestion((prev) => ({
      ...prev,
      hottextItems: prev.hottextItems.map((item) => 
        item.identifier === identifier 
          ? { ...item, styles: { ...item.styles, backgroundColor: color } } 
          : item
      ),
    }))
  }

  const generateXML = async () => {
    try {
      // Create content blocks from the local state
      const promptBlocks: ContentBlock[] = prompt ? [{
        id: "prompt_1",
        type: "text",
        content: prompt,
        styles: {},
        attributes: {}
      }] : []

      const contentBlocks: ContentBlock[] = content ? [{
        id: "content_1", 
        type: "text",
        content: content,
        styles: {},
        attributes: {}
      }] : []

      const correctFeedbackBlocks: ContentBlock[] = correctFeedback ? [{
        id: "correct_feedback_1",
        type: "text", 
        content: correctFeedback,
        styles: {},
        attributes: {}
      }] : []

      const incorrectFeedbackBlocks: ContentBlock[] = incorrectFeedback ? [{
        id: "incorrect_feedback_1",
        type: "text",
        content: incorrectFeedback, 
        styles: {},
        attributes: {}
      }] : []

      const questionData: HottextQuestion = {
        ...question,
        promptBlocks,
        contentBlocks,
        correctFeedbackBlocks,
        incorrectFeedbackBlocks,
      }

      const response = await fetch("/api/generate-xml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "hottext", data: questionData }),
      })

      if (!response.ok) throw new Error("Failed to generate XML")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${question.identifier || "hottext-question"}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error generating XML:", error)
    }
  }

  const renderPreview = () => {
    let htmlContent = content
    question.hottextItems.forEach((item) => {
      const regex = new RegExp(`\\b${item.content.value}\\b`, "gi")
      htmlContent = htmlContent.replace(
        regex,
        `<span style="background-color: ${item.styles.backgroundColor || '#3b82f6'}; padding: 2px 4px; border-radius: 3px; cursor: pointer;" 
         class="hottext-item" data-identifier="${item.identifier}">${item.content.value}</span>`,
      )
    })
    return { __html: htmlContent }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hottext Question Builder</h1>
          <p className="text-gray-600">Create interactive text with selectable highlighted terms</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Builder Panel */}
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
                    placeholder="e.g., hottext-question-1"
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
                <div>
                  <Label htmlFor="prompt">Instructions</Label>
                  <Input
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Select the highlighted terms..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={content}
                  onChange={(newContent) => setContent(newContent)}
                  placeholder="Enter your question content here..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hottext Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    placeholder="Enter text to highlight"
                  />
                  <Button onClick={addHottextItem} disabled={!selectedText.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {question.hottextItems.map((item) => (
                    <div key={item.identifier} className="flex items-center gap-2 p-2 border rounded">
                      <Badge
                        variant={question.correctAnswers.includes(item.identifier) ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleCorrectAnswer(item.identifier)}
                      >
                        {item.content.value}
                      </Badge>
                      <AdvancedColorPicker
                        label=""
                        color={item.styles.backgroundColor || "#3b82f6"}
                        onChange={(color) => updateHottextColor(item.identifier, color)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeHottextItem(item.identifier)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600">Click on badges to mark as correct answers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="correct-feedback">Correct Answer Feedback</Label>
                  <Textarea
                    id="correct-feedback"
                    value={correctFeedback}
                    onChange={(e) => setCorrectFeedback(e.target.value)}
                    placeholder="Feedback for correct answers"
                  />
                </div>
                <div>
                  <Label htmlFor="incorrect-feedback">Incorrect Answer Feedback</Label>
                  <Textarea
                    id="incorrect-feedback"
                    value={incorrectFeedback}
                    onChange={(e) => setIncorrectFeedback(e.target.value)}
                    placeholder="Feedback for incorrect answers"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content && question.hottextItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded bg-white">
                      <h3 className="font-semibold mb-2">{prompt}</h3>
                      <div dangerouslySetInnerHTML={renderPreview()} />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Correct answers:</strong> {question.correctAnswers.join(", ") || "None selected"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Add content and hottext items to see preview</p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={generateXML}
                className="flex-1"
                disabled={!question.identifier || !content || question.hottextItems.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate XML
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
