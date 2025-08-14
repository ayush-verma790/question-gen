"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trash2,
  Plus,
  ImageIcon,
  Video,
  Music,
  Type,
  Code,
  Copy,
  Palette,
  ChevronDown,
  ChevronUp,
  Settings,
  MoveUp,
  MoveDown,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { ContentBlock } from "@/lib/types"
import { AdvancedColorPicker } from "@/components/advanced-color-picker"
import { HTMLParser } from "@/components/html-parser"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ButtonSuggestions } from "@/components/button-suggestions"

interface ContentBlockEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  title: string
}

export function ContentBlockEditor({ blocks, onChange, title }: ContentBlockEditorProps) {
  const [selectedBlockType, setSelectedBlockType] = useState<ContentBlock["type"]>("text")
  const [showHTMLParser, setShowHTMLParser] = useState(false)
  const [openDesignPanels, setOpenDesignPanels] = useState<Record<string, boolean>>({})

  const toggleDesignPanel = (blockId: string) => {
    setOpenDesignPanels((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }))
  }

  const addBlock = () => {
    const newBlock: ContentBlock = {
      id: `block_${Date.now()}`,
      type: selectedBlockType,
      content: selectedBlockType === "text" ? "Enter your content here..." : "",
      styles: {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#000000",
        backgroundColor: "transparent",
        padding: "8px",
        margin: "4px",
        borderRadius: "4px",
        border: "none",
        boxShadow: "none",
        textAlign: "left",
        width: "auto",
        height: "auto",
      },
      attributes: {
        width: "400",
        height: "300",
        controls: true,
        autoplay: false,
        loop: false,
      },
    }

    onChange([...blocks, newBlock])
  }

  const addParsedBlocks = (parsedBlocks: ContentBlock[]) => {
    onChange([...blocks, ...parsedBlocks])
    setShowHTMLParser(false)
  }

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...updates } : block)))
  }

  const updateBlockStyle = (id: string, styleKey: string, value: string) => {
    onChange(
      blocks.map((block) => (block.id === id ? { ...block, styles: { ...block.styles, [styleKey]: value } } : block)),
    )
  }

  const updateBlockAttribute = (id: string, attrKey: string, value: any) => {
    onChange(
      blocks.map((block) =>
        block.id === id ? { ...block, attributes: { ...block.attributes, [attrKey]: value } } : block,
      ),
    )
  }

  const removeBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id))
  }

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find((block) => block.id === id)
    if (blockToDuplicate) {
      const duplicatedBlock = {
        ...blockToDuplicate,
        id: `block_${Date.now()}`,
      }
      const index = blocks.findIndex((block) => block.id === id)
      const newBlocks = [...blocks]
      newBlocks.splice(index + 1, 0, duplicatedBlock)
      onChange(newBlocks)
    }
  }

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((block) => block.id === id)
    if (index === -1) return

    const newBlocks = [...blocks]
    if (direction === "up" && index > 0) {
      ;[newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]]
    } else if (direction === "down" && index < blocks.length - 1) {
      ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]
    }
    onChange(newBlocks)
  }

  const copyBlockStyles = async (block: ContentBlock) => {
    const styleData = {
      styles: block.styles,
      attributes: block.attributes,
      type: block.type,
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(styleData, null, 2))
    } catch (error) {
      console.error("Failed to copy styles:", error)
    }
  }

  const pasteBlockStyles = async (id: string) => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      const styleData = JSON.parse(clipboardText)

      if (styleData.styles) {
        onChange(
          blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  styles: { ...block.styles, ...styleData.styles },
                  attributes: styleData.attributes
                    ? { ...block.attributes, ...styleData.attributes }
                    : block.attributes,
                }
              : block,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to paste styles:", error)
    }
  }

  const getBlockIcon = (type: ContentBlock["type"]) => {
    switch (type) {
      case "text":
        return <Type className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "video":
        return <Video className="w-4 h-4" />
      case "audio":
        return <Music className="w-4 h-4" />
      case "html":
        return <Code className="w-4 h-4" />
    }
  }

  const renderBlockPreview = (block: ContentBlock) => {
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
          <div style={style as any}>
            {block.content ? <div dangerouslySetInnerHTML={{ __html: block.content }} /> : "Enter your text here..."}
          </div>
        )
      case "image":
        return (
          <img
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
            src={block.content}
            style={style as any}
            controls={block.attributes?.controls}
            autoPlay={block.attributes?.autoplay}
            loop={block.attributes?.loop}
          />
        )
      case "html":
        return <div style={style as any} dangerouslySetInnerHTML={{ __html: block.content }} />
      default:
        return <div>Unknown block type</div>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHTMLParser(!showHTMLParser)}
            className="flex items-center gap-2"
          >
            <Code className="w-4 h-4" />
            {showHTMLParser ? "Hide" : "Parse HTML"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showHTMLParser && <HTMLParser onBlocksGenerated={addParsedBlocks} />}

        <div className="flex gap-2">
          <Select
            value={selectedBlockType}
            onValueChange={(value: ContentBlock["type"]) => setSelectedBlockType(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Rich Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addBlock}>
            <Plus className="w-4 h-4 mr-2" />
            Add {selectedBlockType}
          </Button>
        </div>

        <div className="space-y-4">
          {blocks.map((block, index) => (
            <Card key={block.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {getBlockIcon(block.type)}
                  <span className="font-medium capitalize">{block.type} Block</span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveBlock(block.id, "up")}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveBlock(block.id, "down")}
                      disabled={index === blocks.length - 1}
                      title="Move down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyBlockStyles(block)} title="Copy styles">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => pasteBlockStyles(block.id)} title="Paste styles">
                      <Palette className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => duplicateBlock(block.id)} title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeBlock(block.id)} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Content</Label>
                      {block.type === "text" ? (
                        <div className="space-y-3">
                          <RichTextEditor
                            value={block.content}
                            onChange={(value) => updateBlock(block.id, { content: value })}
                            placeholder="Enter your rich text content..."
                          />
                          <div className="border-t pt-3 mt-4">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-1 rounded-xl border border-green-100">
                              <ButtonSuggestions
                                onSuggestionClick={(buttonHtml) => {
                                  const currentContent = block.content || "";
                                  const newContent = currentContent + " " + buttonHtml;
                                  updateBlock(block.id, { content: newContent });
                                }}
                                className=""
                                size="md"
                              />
                            </div>
                          </div>
                        </div>
                      ) : block.type === "html" ? (
                        <div className="space-y-3">
                          <Textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Enter HTML content..."
                            className="min-h-20 font-mono"
                          />
                          <div className="border-t pt-3 mt-4">
                            <ButtonSuggestions
                              onSuggestionClick={(buttonHtml) => {
                                const currentContent = block.content || "";
                                const newContent = currentContent + "\n" + buttonHtml;
                                updateBlock(block.id, { content: newContent });
                              }}
                              className=""
                              size="md"
                              defaultCollapsed={true}
                            />
                          </div>
                        </div>
                      ) : (
                        <Input
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder={`Enter ${block.type} URL...`}
                        />
                      )}
                    </div>

                    {(block.type === "image" || block.type === "video") && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Width</Label>
                            <Input
                              value={block.attributes?.width || ""}
                              onChange={(e) => updateBlockAttribute(block.id, "width", e.target.value)}
                              placeholder="400"
                            />
                          </div>
                          <div>
                            <Label>Height</Label>
                            <Input
                              value={block.attributes?.height || ""}
                              onChange={(e) => updateBlockAttribute(block.id, "height", e.target.value)}
                              placeholder="300"
                            />
                          </div>
                        </div>
                        {block.type === "image" && (
                          <div>
                            <Label>Alt Text</Label>
                            <Input
                              value={block.attributes?.alt || ""}
                              onChange={(e) => updateBlockAttribute(block.id, "alt", e.target.value)}
                              placeholder="Image description"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {(block.type === "video" || block.type === "audio") && (
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={block.attributes?.controls || false}
                            onChange={(e) => updateBlockAttribute(block.id, "controls", e.target.checked)}
                          />
                          Controls
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={block.attributes?.autoplay || false}
                            onChange={(e) => updateBlockAttribute(block.id, "autoplay", e.target.checked)}
                          />
                          Autoplay
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={block.attributes?.loop || false}
                            onChange={(e) => updateBlockAttribute(block.id, "loop", e.target.checked)}
                          />
                          Loop
                        </label>
                      </div>
                    )}
                  </div>

                  {/* <div>
                    <Label>Live Preview</Label>
                    <div className="border rounded p-4 bg-white min-h-32">{renderBlockPreview(block)}</div>
                  </div> */}
                </div>

                {/* Collapsible Design Section */}
                <Collapsible open={openDesignPanels[block.id]} onOpenChange={() => toggleDesignPanel(block.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-transparent">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Design Settings
                      </div>
                      {openDesignPanels[block.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Font Size</Label>
                        <Input
                          value={block.styles.fontSize || ""}
                          onChange={(e) => updateBlockStyle(block.id, "fontSize", e.target.value)}
                          placeholder="16px"
                        />
                      </div>
                      <div>
                        <Label>Font Family</Label>
                        <Select
                          value={block.styles.fontFamily || "Arial, sans-serif"}
                          onValueChange={(value) => updateBlockStyle(block.id, "fontFamily", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="Georgia, serif">Georgia</SelectItem>
                            <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                            <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                            <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                            <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Font Weight</Label>
                        <Select
                          value={block.styles.fontWeight || "normal"}
                          onValueChange={(value) => updateBlockStyle(block.id, "fontWeight", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="lighter">Lighter</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                            <SelectItem value="300">300</SelectItem>
                            <SelectItem value="400">400</SelectItem>
                            <SelectItem value="500">500</SelectItem>
                            <SelectItem value="600">600</SelectItem>
                            <SelectItem value="700">700</SelectItem>
                            <SelectItem value="800">800</SelectItem>
                            <SelectItem value="900">900</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Font Style</Label>
                        <Select
                          value={block.styles.fontStyle || "normal"}
                          onValueChange={(value) => updateBlockStyle(block.id, "fontStyle", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="italic">Italic</SelectItem>
                            <SelectItem value="oblique">Oblique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <AdvancedColorPicker
                        label="Text Color"
                        color={block.styles.color || "#000000"}
                        onChange={(color) => updateBlockStyle(block.id, "color", color)}
                      />

                      <AdvancedColorPicker
                        label="Background Color"
                        color={block.styles.backgroundColor || "transparent"}
                        onChange={(color) => updateBlockStyle(block.id, "backgroundColor", color)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Padding</Label>
                        <Input
                          value={block.styles.padding || ""}
                          onChange={(e) => updateBlockStyle(block.id, "padding", e.target.value)}
                          placeholder="8px"
                        />
                      </div>
                      <div>
                        <Label>Margin</Label>
                        <Input
                          value={block.styles.margin || ""}
                          onChange={(e) => updateBlockStyle(block.id, "margin", e.target.value)}
                          placeholder="4px"
                        />
                      </div>
                      <div>
                        <Label>Border Radius</Label>
                        <Input
                          value={block.styles.borderRadius || ""}
                          onChange={(e) => updateBlockStyle(block.id, "borderRadius", e.target.value)}
                          placeholder="4px"
                        />
                      </div>
                      <div>
                        <Label>Border</Label>
                        <Input
                          value={block.styles.border || ""}
                          onChange={(e) => updateBlockStyle(block.id, "border", e.target.value)}
                          placeholder="1px solid #ccc"
                        />
                      </div>
                      <div>
                        <Label>Box Shadow</Label>
                        <Input
                          value={block.styles.boxShadow || ""}
                          onChange={(e) => updateBlockStyle(block.id, "boxShadow", e.target.value)}
                          placeholder="0 2px 4px rgba(0,0,0,0.1)"
                        />
                      </div>
                      <div>
                        <Label>Text Align</Label>
                        <Select
                          value={block.styles.textAlign || "left"}
                          onValueChange={(value) => updateBlockStyle(block.id, "textAlign", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="justify">Justify</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Line Height</Label>
                        <Input
                          value={block.styles.lineHeight || ""}
                          onChange={(e) => updateBlockStyle(block.id, "lineHeight", e.target.value)}
                          placeholder="1.5"
                        />
                      </div>
                      <div>
                        <Label>Letter Spacing</Label>
                        <Input
                          value={block.styles.letterSpacing || ""}
                          onChange={(e) => updateBlockStyle(block.id, "letterSpacing", e.target.value)}
                          placeholder="0px"
                        />
                      </div>
                      <div>
                        <Label>Text Decoration</Label>
                        <Select
                          value={block.styles.textDecoration || "none"}
                          onValueChange={(value) => updateBlockStyle(block.id, "textDecoration", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="underline">Underline</SelectItem>
                            <SelectItem value="overline">Overline</SelectItem>
                            <SelectItem value="line-through">Line Through</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Text Transform</Label>
                        <Select
                          value={block.styles.textTransform || "none"}
                          onValueChange={(value) => updateBlockStyle(block.id, "textTransform", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="uppercase">Uppercase</SelectItem>
                            <SelectItem value="lowercase">Lowercase</SelectItem>
                            <SelectItem value="capitalize">Capitalize</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Width</Label>
                        <Input
                          value={block.styles.width || ""}
                          onChange={(e) => updateBlockStyle(block.id, "width", e.target.value)}
                          placeholder="auto"
                        />
                      </div>
                      <div>
                        <Label>Height</Label>
                        <Input
                          value={block.styles.height || ""}
                          onChange={(e) => updateBlockStyle(block.id, "height", e.target.value)}
                          placeholder="auto"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
