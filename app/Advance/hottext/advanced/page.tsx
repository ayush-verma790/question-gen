"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Download, Eye, Palette } from "lucide-react"
import type { HottextQuestion, HottextItem, ContentBlock } from "@/lib/types"
import { ContentBlockEditor } from "@/components/content-block-editor"
import { AdvancedColorPicker } from "@/components/advanced-color-picker"

export default function AdvancedHottextBuilderPage() {
  const [question, setQuestion] = useState<HottextQuestion>({
    identifier: "xml-hottext-item-1",
    title: "Identify the Pencil",
    promptBlocks: [
      {
        id: "prompt_1",
        type: "text",
        content: "How many dragons are there?",
        styles: {
          fontSize: "22px",
          fontFamily: "Canva Sans",
          color: "#000000",
          backgroundColor: "transparent",
          padding: "8px",
          margin: "4px",
          borderRadius: "0px",
          border: "none",
          boxShadow: "none",
          textAlign: "left",
          width: "auto",
          height: "auto",
        },
      },
      {
        id: "prompt_2",
        type: "image",
        content: "https://i.postimg.cc/vTqDQbkV/Screenshot-2025-07-28-at-8-04-30-PM.png",
        styles: {
          padding: "8px",
          margin: "4px",
          borderRadius: "0px",
          border: "none",
          boxShadow: "none",
          width: "500px",
          height: "auto",
        },
        attributes: {
          width: "500",
          alt: "Dragon counting image",
        },
      },
    ],
    contentBlocks: [],
    hottextItems: [
      {
        identifier: "BTN1",
        text: "2",
        styles: {
          color: "white",
          backgroundColor: "#a94400",
          width: "60px",
          height: "60px",
          borderRadius: "10px",
          fontSize: "28px",
          fontFamily: "Arial",
          textAlign: "center",
          padding: "0px",
          margin: "10px",
          border: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        },
        position: { x: 0, y: 0 },
      },
      {
        identifier: "BTN2",
        text: "4",
        styles: {
          color: "white",
          backgroundColor: "#a94400",
          width: "60px",
          height: "60px",
          borderRadius: "10px",
          fontSize: "28px",
          fontFamily: "Arial",
          textAlign: "center",
          padding: "0px",
          margin: "10px",
          border: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        },
        position: { x: 0, y: 0 },
      },
      {
        identifier: "BTN3",
        text: "3",
        styles: {
          color: "white",
          backgroundColor: "#a94400",
          width: "60px",
          height: "60px",
          borderRadius: "10px",
          fontSize: "28px",
          fontFamily: "Arial",
          textAlign: "center",
          padding: "0px",
          margin: "10px",
          border: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        },
        position: { x: 0, y: 0 },
      },
    ],
    correctAnswers: ["BTN3"],
    correctFeedbackBlocks: [
      {
        id: "correct_1",
        type: "text",
        content: "That's correct!",
        styles: {
          fontSize: "22px",
          fontFamily: "Glacial Indifference",
          color: "#27c94c",
          backgroundColor: "transparent",
          padding: "8px",
          margin: "4px",
          borderRadius: "0px",
          border: "none",
          boxShadow: "none",
          textAlign: "left",
          width: "auto",
          height: "auto",
        },
      },
      {
        id: "correct_2",
        type: "image",
        content: "https://i.postimg.cc/26cpj1cx/Screenshot-2025-07-28-at-5-40-08-PM.png",
        styles: {
          padding: "8px",
          margin: "4px",
          borderRadius: "0px",
          border: "none",
          boxShadow: "none",
          width: "400px",
          height: "auto",
        },
        attributes: {
          width: "400",
          alt: "Success image",
        },
      },
    ],
    incorrectFeedbackBlocks: [
      {
        id: "incorrect_1",
        type: "html",
        content: `<span style="font-family: Arial, sans-serif; font-size: 30px; font-weight: bold; color: #FF0000;">Nice Try!</span><br/><br/>
<span style="font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; color: #27c94c;">Correct answer is:</span>
<span style="display:inline-block;margin-left; background-color:#a94400; color:white; font-size:28px; width:60px; height:60px; border-radius:10px; text-align:center; line-height:60px;">3</span> <br/>
<br/>Count the dragons one by one.<br/><br/>`,
        styles: {
          fontSize: "22px",
          fontFamily: "Glacial Indifference",
          padding: "8px",
          margin: "4px",
          borderRadius: "0px",
          border: "none",
          boxShadow: "none",
          textAlign: "left",
          width: "auto",
          height: "auto",
        },
      },
      {
        id: "incorrect_2",
        type: "image",
        content: "https://i.postimg.cc/PxdqYCkD/Screenshot-2025-07-28-at-8-04-38-PM.png",
        styles: {
          padding: "8px",
          margin: "4px",
          borderRadius: "0px",
          border: "none",
          boxShadow: "none",
          width: "450px",
          height: "auto",
        },
        attributes: {
          width: "450",
          alt: "Explanation image",
        },
      },
      {
        id: "incorrect_3",
        type: "text",
        content: "There are 3 dragons.",
        styles: {
          fontSize: "22px",
          fontFamily: "Glacial Indifference",
          color: "#000000",
          backgroundColor: "transparent",
          padding: "8px",
          margin: "4px",
          borderRadius: "0px",
          border: "none",
          boxShadow: "none",
          textAlign: "left",
          width: "auto",
          height: "auto",
        },
      },
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
  })

  const [selectedText, setSelectedText] = useState("")

  const addHottextItem = () => {
    if (!selectedText.trim()) return

    const newItem: HottextItem = {
      identifier: `BTN${question.hottextItems.length + 1}`,
      text: selectedText.trim(),
      styles: {
        color: "white",
        backgroundColor: "#a94400",
        width: "60px",
        height: "60px",
        borderRadius: "10px",
        fontSize: "28px",
        fontFamily: "Arial",
        textAlign: "center",
        padding: "0px",
        margin: "10px",
        border: "none",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        transition: "all 0.3s ease",
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

  const updateHottextProperty = (identifier: string, property: string, value: any) => {
    setQuestion((prev) => ({
      ...prev,
      hottextItems: prev.hottextItems.map((item) =>
        item.identifier === identifier ? { ...item, styles: { ...item.styles, [property]: value } } : item,
      ),
    }))
  }

  const generateXML = async () => {
    try {
      const response = await fetch("/api/generate-xml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "hottext", data: question }),
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
      }

      switch (block.type) {
        case "text":
          return (
            <div key={block.id} style={style as any}>
              {block.content}
            </div>
          )
        case "image":
          return (
            <img
              key={block.id}
              src={block.content || "/placeholder.svg"}
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

  const renderHottextButtons = () => {
    return question.hottextItems.map((item) => {
      const style = {
        display: "inline-block",
        color: item.styles.color,
        backgroundColor: item.styles.backgroundColor,
        width: item.styles.width,
        height: item.styles.height,
        borderRadius: item.styles.borderRadius,
        fontSize: item.styles.fontSize,
        fontFamily: item.styles.fontFamily,
        textAlign: item.styles.textAlign,
        padding: item.styles.padding,
        margin: item.styles.margin,
        border: item.styles.border,
        boxShadow: item.styles.boxShadow,
        lineHeight: item.styles.height,
        cursor: "pointer",
        transition: item.styles.transition,
      }

      return (
        <span key={item.identifier} style={style as any} className="hottext-item" data-identifier={item.identifier}>
          {item.text}
        </span>
      )
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
        <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Dynamic Dragon Question Loaded!</h2>
        <p className="text-green-700">
          Fully customizable with content blocks, advanced styling, and multimedia support
        </p>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dynamic Advanced Hottext Builder</h1>
          <p className="text-gray-600">
            Create fully customizable interactive questions with unlimited styling options
          </p>
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
                  <Label htmlFor="max-choices">Max Choices</Label>
                  <Select
                    value={question.maxChoices.toString()}
                    onValueChange={(value) => setQuestion((prev) => ({ ...prev, maxChoices: Number.parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single Choice</SelectItem>
                      <SelectItem value="2">2 Choices</SelectItem>
                      <SelectItem value="3">3 Choices</SelectItem>
                      <SelectItem value="4">4 Choices</SelectItem>
                      <SelectItem value="5">5 Choices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Global Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Font Family</Label>
                    <Input
                      value={question.globalStyles.fontFamily}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          globalStyles: { ...prev.globalStyles, fontFamily: e.target.value },
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
                          globalStyles: { ...prev.globalStyles, fontSize: e.target.value },
                        }))
                      }
                      placeholder="22px"
                    />
                  </div>
                </div>
                <AdvancedColorPicker
                  label="Background Color"
                  color={question.globalStyles.backgroundColor}
                  onChange={(color) =>
                    setQuestion((prev) => ({
                      ...prev,
                      globalStyles: { ...prev.globalStyles, backgroundColor: color },
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Padding</Label>
                    <Input
                      value={question.globalStyles.padding}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          globalStyles: { ...prev.globalStyles, padding: e.target.value },
                        }))
                      }
                      placeholder="20px"
                    />
                  </div>
                  <div>
                    <Label>Border Radius</Label>
                    <Input
                      value={question.globalStyles.borderRadius}
                      onChange={(e) =>
                        setQuestion((prev) => ({
                          ...prev,
                          globalStyles: { ...prev.globalStyles, borderRadius: e.target.value },
                        }))
                      }
                      placeholder="8px"
                    />
                  </div>
                </div>
                <div>
                  <Label>Box Shadow</Label>
                  <Input
                    value={question.globalStyles.boxShadow}
                    onChange={(e) =>
                      setQuestion((prev) => ({
                        ...prev,
                        globalStyles: { ...prev.globalStyles, boxShadow: e.target.value },
                      }))
                    }
                    placeholder="0 4px 6px rgba(0,0,0,0.1)"
                  />
                </div>
                <div>
                  <Label>Custom CSS</Label>
                  <Textarea
                    value={question.customCSS}
                    onChange={(e) => setQuestion((prev) => ({ ...prev, customCSS: e.target.value }))}
                    placeholder="Add custom CSS here..."
                    className="min-h-20 font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            <ContentBlockEditor
              title="Question Prompt Blocks"
              blocks={question.promptBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, promptBlocks: blocks }))}
            />

            <Card>
              <CardHeader>
                <CardTitle>Hottext Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    placeholder="Enter button text"
                  />
                  <Button onClick={addHottextItem} disabled={!selectedText.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {question.hottextItems.map((item) => (
                    <Card key={item.identifier} className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge
                          variant={question.correctAnswers.includes(item.identifier) ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleCorrectAnswer(item.identifier)}
                        >
                          {item.text} {question.correctAnswers.includes(item.identifier) && "✓"}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => removeHottextItem(item.identifier)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <Label>Text</Label>
                            <Input
                              value={item.text}
                              onChange={(e) => updateHottextProperty(item.identifier, "text", e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Width</Label>
                              <Input
                                value={item.styles.width}
                                onChange={(e) => updateHottextProperty(item.identifier, "width", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Height</Label>
                              <Input
                                value={item.styles.height}
                                onChange={(e) => updateHottextProperty(item.identifier, "height", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Font Size</Label>
                              <Input
                                value={item.styles.fontSize}
                                onChange={(e) => updateHottextProperty(item.identifier, "fontSize", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Font Family</Label>
                              <Input
                                value={item.styles.fontFamily}
                                onChange={(e) => updateHottextProperty(item.identifier, "fontFamily", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Padding</Label>
                              <Input
                                value={item.styles.padding}
                                onChange={(e) => updateHottextProperty(item.identifier, "padding", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Margin</Label>
                              <Input
                                value={item.styles.margin}
                                onChange={(e) => updateHottextProperty(item.identifier, "margin", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Border Radius</Label>
                              <Input
                                value={item.styles.borderRadius}
                                onChange={(e) => updateHottextProperty(item.identifier, "borderRadius", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Text Align</Label>
                              <Select
                                value={item.styles.textAlign}
                                onValueChange={(value) => updateHottextProperty(item.identifier, "textAlign", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="center">Center</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <AdvancedColorPicker
                            label="Text Color"
                            color={item.styles.color}
                            onChange={(color) => updateHottextProperty(item.identifier, "color", color)}
                          />

                          <AdvancedColorPicker
                            label="Background Color"
                            color={item.styles.backgroundColor}
                            onChange={(color) => updateHottextProperty(item.identifier, "backgroundColor", color)}
                          />

                          <div>
                            <Label>Border</Label>
                            <Input
                              value={item.styles.border}
                              onChange={(e) => updateHottextProperty(item.identifier, "border", e.target.value)}
                              placeholder="1px solid #ccc"
                            />
                          </div>

                          <div>
                            <Label>Box Shadow</Label>
                            <Input
                              value={item.styles.boxShadow}
                              onChange={(e) => updateHottextProperty(item.identifier, "boxShadow", e.target.value)}
                              placeholder="0 2px 4px rgba(0,0,0,0.2)"
                            />
                          </div>

                          <div>
                            <Label>Transition</Label>
                            <Input
                              value={item.styles.transition}
                              onChange={(e) => updateHottextProperty(item.identifier, "transition", e.target.value)}
                              placeholder="all 0.3s ease"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Preview</Label>
                          <div className="border rounded p-4 bg-white">
                            <span
                              style={
                                {
                                  display: "inline-block",
                                  color: item.styles.color,
                                  backgroundColor: item.styles.backgroundColor,
                                  width: item.styles.width,
                                  height: item.styles.height,
                                  borderRadius: item.styles.borderRadius,
                                  fontSize: item.styles.fontSize,
                                  fontFamily: item.styles.fontFamily,
                                  textAlign: item.styles.textAlign,
                                  padding: item.styles.padding,
                                  margin: item.styles.margin,
                                  border: item.styles.border,
                                  boxShadow: item.styles.boxShadow,
                                  lineHeight: item.styles.height,
                                  cursor: "pointer",
                                  transition: item.styles.transition,
                                } as any
                              }
                            >
                              {item.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="text-sm text-gray-600">Click on badges to mark as correct answers</p>
              </CardContent>
            </Card>

            <ContentBlockEditor
              title="Correct Feedback Blocks"
              blocks={question.correctFeedbackBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, correctFeedbackBlocks: blocks }))}
            />

            <ContentBlockEditor
              title="Incorrect Feedback Blocks"
              blocks={question.incorrectFeedbackBlocks}
              onChange={(blocks) => setQuestion((prev) => ({ ...prev, incorrectFeedbackBlocks: blocks }))}
            />
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border rounded bg-white"
                  style={{
                    fontFamily: question.globalStyles.fontFamily,
                    fontSize: question.globalStyles.fontSize,
                    backgroundColor: question.globalStyles.backgroundColor,
                    padding: question.globalStyles.padding,
                    borderRadius: question.globalStyles.borderRadius,
                    boxShadow: question.globalStyles.boxShadow,
                  }}
                >
                  {/* Render prompt blocks */}
                  <div className="mb-4">{renderContentBlocks(question.promptBlocks)}</div>

                  {/* Render content blocks */}
                  {question.contentBlocks.length > 0 && (
                    <div className="mb-4">{renderContentBlocks(question.contentBlocks)}</div>
                  )}

                  {/* Render hottext buttons */}
                  <div className="flex gap-2 flex-wrap">{renderHottextButtons()}</div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <strong>Correct answers:</strong> {question.correctAnswers.join(", ") || "None selected"}
                  </p>
                  <p>
                    <strong>Max choices:</strong> {question.maxChoices}
                  </p>
                  <p>
                    <strong>Content blocks:</strong> {question.promptBlocks.length + question.contentBlocks.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={generateXML}
                className="flex-1"
                disabled={!question.identifier || question.hottextItems.length === 0}
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
