"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Copy, ClipboardPasteIcon as Paste, FileText } from "lucide-react"
import type { ContentBlock } from "@/lib/types"

interface HTMLParserProps {
  onBlocksGenerated: (blocks: ContentBlock[]) => void
}

export function HTMLParser({ onBlocksGenerated }: HTMLParserProps) {
  const [htmlInput, setHtmlInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const parseHTMLToBlocks = (html: string): ContentBlock[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const blocks: ContentBlock[] = []

    const processElement = (element: Element, index: number) => {
      const computedStyle = window.getComputedStyle ? null : null
      const tagName = element.tagName.toLowerCase()

      // Extract inline styles
      const inlineStyle = element.getAttribute("style") || ""
      const styleObj = parseInlineStyles(inlineStyle)

      // Extract attributes
      const attributes: any = {}
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name !== "style") {
          attributes[attr.name] = attr.value
        }
      })

      let blockType: ContentBlock["type"] = "html"
      let content = ""

      // Determine block type based on element
      switch (tagName) {
        case "img":
          blockType = "image"
          content = attributes.src || ""
          attributes.alt = attributes.alt || "Parsed image"
          attributes.width = attributes.width || styleObj.width?.replace("px", "") || "400"
          attributes.height = attributes.height || styleObj.height?.replace("px", "") || "300"
          break

        case "video":
          blockType = "video"
          content = attributes.src || ""
          attributes.width = attributes.width || styleObj.width?.replace("px", "") || "400"
          attributes.height = attributes.height || styleObj.height?.replace("px", "") || "300"
          attributes.controls = attributes.hasOwnProperty("controls")
          attributes.autoplay = attributes.hasOwnProperty("autoplay")
          attributes.loop = attributes.hasOwnProperty("loop")
          break

        case "audio":
          blockType = "audio"
          content = attributes.src || ""
          attributes.controls = attributes.hasOwnProperty("controls")
          attributes.autoplay = attributes.hasOwnProperty("autoplay")
          attributes.loop = attributes.hasOwnProperty("loop")
          break

        case "p":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
        case "span":
        case "div":
          // Check if it's simple text or complex HTML
          if (
            element.children.length === 0 ||
            (element.children.length === 1 && element.children[0].tagName === "BR")
          ) {
            blockType = "text"
            content = element.textContent || ""
          } else {
            blockType = "html"
            content = element.innerHTML
          }
          break

        default:
          blockType = "html"
          content = element.outerHTML
      }

      // Create the block
      const block: ContentBlock = {
        id: `parsed_${Date.now()}_${index}`,
        type: blockType,
        content,
        styles: {
          fontSize: styleObj.fontSize || extractFontSize(tagName) || "16px",
          fontFamily: styleObj.fontFamily || "Arial",
          color: styleObj.color || "#000000",
          backgroundColor: styleObj.backgroundColor || "transparent",
          padding: styleObj.padding || "8px",
          margin: styleObj.margin || "4px",
          borderRadius: styleObj.borderRadius || "0px",
          border: styleObj.border || "none",
          boxShadow: styleObj.boxShadow || "none",
          textAlign: (styleObj.textAlign as any) || "left",
          width: styleObj.width || "auto",
          height: styleObj.height || "auto",
          fontWeight: styleObj.fontWeight,
          fontStyle: styleObj.fontStyle,
          textDecoration: styleObj.textDecoration,
          lineHeight: styleObj.lineHeight,
          letterSpacing: styleObj.letterSpacing,
          textTransform: styleObj.textTransform,
        },
        attributes,
      }

      blocks.push(block)
    }

    // Process all elements
    const allElements = doc.body.querySelectorAll("*")
    if (allElements.length === 0) {
      // If no HTML elements, treat as plain text
      const textBlock: ContentBlock = {
        id: `parsed_text_${Date.now()}`,
        type: "text",
        content: html,
        styles: {
          fontSize: "16px",
          fontFamily: "Arial",
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
      }
      blocks.push(textBlock)
    } else {
      // Process top-level elements only to avoid nesting
      const topLevelElements = Array.from(doc.body.children)
      topLevelElements.forEach((element, index) => {
        processElement(element, index)
      })
    }

    return blocks
  }

  const parseInlineStyles = (styleString: string): Record<string, string> => {
    const styles: Record<string, string> = {}
    if (!styleString) return styles

    styleString.split(";").forEach((rule) => {
      const [property, value] = rule.split(":").map((s) => s.trim())
      if (property && value) {
        // Convert CSS property names to camelCase
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        styles[camelProperty] = value
      }
    })

    return styles
  }

  const extractFontSize = (tagName: string): string => {
    const fontSizes: Record<string, string> = {
      h1: "32px",
      h2: "28px",
      h3: "24px",
      h4: "20px",
      h5: "18px",
      h6: "16px",
      p: "16px",
      span: "16px",
      div: "16px",
    }
    return fontSizes[tagName] || "16px"
  }

  const handleParseHTML = () => {
    if (!htmlInput.trim()) return

    setIsProcessing(true)
    try {
      const blocks = parseHTMLToBlocks(htmlInput)
      onBlocksGenerated(blocks)
      setHtmlInput("")
    } catch (error) {
      console.error("Error parsing HTML:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardData = await navigator.clipboard.read()

      for (const item of clipboardData) {
        // Try to get HTML first (preserves formatting)
        if (item.types.includes("text/html")) {
          const htmlBlob = await item.getType("text/html")
          const html = await htmlBlob.text()
          setHtmlInput(html)
          return
        }

        // Fallback to plain text
        if (item.types.includes("text/plain")) {
          const textBlob = await item.getType("text/plain")
          const text = await textBlob.text()
          setHtmlInput(text)
          return
        }
      }
    } catch (error) {
      console.error("Error reading clipboard:", error)
      // Fallback to simple text paste
      try {
        const text = await navigator.clipboard.readText()
        setHtmlInput(text)
      } catch (fallbackError) {
        console.error("Fallback clipboard read failed:", fallbackError)
      }
    }
  }

  const sampleHTML = `<div style="background-color: #f0f8ff; padding: 20px; border-radius: 10px; border: 2px solid #4169e1; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <h2 style="color: #ff6347; font-family: 'Georgia', serif; text-align: center; margin-bottom: 15px;">Sample Rich Content</h2>
  <p style="font-size: 18px; color: #2e8b57; font-weight: bold; line-height: 1.6;">This is a <span style="background-color: #ffff00; padding: 2px 4px;">highlighted text</span> with custom styling.</p>
  <img src="https://via.placeholder.com/300x200/ff7f50/ffffff?text=Sample+Image" alt="Sample" style="border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); margin: 10px 0;" width="300" height="200"/>
  <p style="font-style: italic; color: #8b4513; text-decoration: underline;">Styled paragraph with multiple effects</p>
</div>`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          HTML Content Parser
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Paste HTML Content (preserves all styling)</Label>
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-2 bg-transparent"
            >
              <Paste className="w-4 h-4" />
              Paste from Clipboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHtmlInput(sampleHTML)}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Load Sample
            </Button>
          </div>
          <Textarea
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            placeholder="Paste your HTML content here... All styling will be preserved!"
            className="min-h-32 font-mono text-sm"
          />
        </div>

        {htmlInput && (
          <div>
            <Label>Preview of Parsed Content</Label>
            <div
              className="border rounded p-4 bg-white max-h-40 overflow-auto"
              dangerouslySetInnerHTML={{ __html: htmlInput }}
            />
          </div>
        )}

        <Button onClick={handleParseHTML} disabled={!htmlInput.trim() || isProcessing} className="w-full">
          <Wand2 className="w-4 h-4 mr-2" />
          {isProcessing ? "Processing..." : "Convert to Content Blocks"}
        </Button>

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>✅ Supported:</strong> All HTML elements with inline styles
          </p>
          <p>
            <strong>🎨 Preserves:</strong> Colors, fonts, sizes, spacing, borders, shadows
          </p>
          <p>
            <strong>📋 Auto-detects:</strong> Images, videos, audio, text, and complex HTML
          </p>
          <p>
            <strong>🔄 Smart parsing:</strong> Converts to appropriate block types automatically
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
