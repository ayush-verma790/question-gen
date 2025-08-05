"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Download } from "lucide-react"
import type { MultipleChoiceQuestion, MultipleChoiceOption } from "@/lib/types"

export default function ChoiceBuilderPage() {
  const [question, setQuestion] = useState<MultipleChoiceQuestion>({
    identifier: "",
    title: "",
    prompt: "",
    options: [],
    correctFeedback: "",
    incorrectFeedback: "",
  })

  const [newOptionText, setNewOptionText] = useState("")

  const addOption = () => {
    if (!newOptionText.trim()) return

    const newOption: MultipleChoiceOption = {
      identifier: `CHOICE_${question.options.length + 1}`,
      text: newOptionText.trim(),
      isCorrect: false,
    }

    setQuestion((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
    setNewOptionText("")
  }

  const removeOption = (identifier: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.identifier !== identifier),
    }))
  }

  const toggleCorrect = (identifier: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.identifier === identifier ? { ...opt, isCorrect: !opt.isCorrect } : opt)),
    }))
  }

  const generateXML = async () => {
    try {
      const response = await fetch("/api/generate-xml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "choice", data: question }),
      })

      if (!response.ok) throw new Error("Failed to generate XML")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${question.identifier || "choice-question"}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error generating XML:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Multiple Choice Question Builder</h1>
          <p className="text-gray-600">Create questions with multiple choice answers</p>
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
                    placeholder="e.g., choice-question-1"
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
                  <Label htmlFor="prompt">Question Text</Label>
                  <Textarea
                    id="prompt"
                    value={question.prompt}
                    onChange={(e) => setQuestion((prev) => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Enter your question here..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Answer Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Enter answer option"
                  />
                  <Button onClick={addOption} disabled={!newOptionText.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div key={option.identifier} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox checked={option.isCorrect} onCheckedChange={() => toggleCorrect(option.identifier)} />
                      <span className="flex-1">{option.text}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeOption(option.identifier)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
                    value={question.correctFeedback}
                    onChange={(e) => setQuestion((prev) => ({ ...prev, correctFeedback: e.target.value }))}
                    placeholder="Feedback for correct answers"
                  />
                </div>
                <div>
                  <Label htmlFor="incorrect-feedback">Incorrect Answer Feedback</Label>
                  <Textarea
                    id="incorrect-feedback"
                    value={question.incorrectFeedback}
                    onChange={(e) => setQuestion((prev) => ({ ...prev, incorrectFeedback: e.target.value }))}
                    placeholder="Feedback for incorrect answers"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {question.prompt && question.options.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded bg-white">
                      <h3 className="font-semibold mb-4">{question.prompt}</h3>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div key={option.identifier} className="flex items-center gap-2">
                            <input type="radio" name="preview" disabled />
                            <span className={option.isCorrect ? "text-green-600 font-medium" : ""}>{option.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Correct answers:</strong>{" "}
                        {question.options
                          .filter((opt) => opt.isCorrect)
                          .map((opt) => opt.text)
                          .join(", ") || "None selected"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Add question text and options to see preview</p>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={generateXML}
              className="w-full"
              disabled={!question.identifier || !question.prompt || question.options.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Generate XML
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
