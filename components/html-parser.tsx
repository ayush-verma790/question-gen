"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import type { ContentBlock } from "@/lib/types"

interface HTMLParserProps {
  onBlocksGenerated: (blocks: ContentBlock[]) => void
}

export function HTMLParser({ onBlocksGenerated }: HTMLParserProps) {
  const [htmlContent, setHtmlContent] = useState("")

  const parseHTML = () => {
    if (!htmlContent.trim()) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, "text/html")
    const elements = doc.body.children

    const blocks: ContentBlock[] = []

    Array.from(elements).forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element)

      let blockType: ContentBlock["type"] = "html"
      let content = element.outerHTML

      // Detect content type
      if (element.tagName === "IMG") {
        blockType = "image"
        content = (element as HTMLImageElement).src
      } else if (element.tagName === "VIDEO") {
        blockType = "video"
        content = (element as HTMLVideoElement).src
      } else if (element.tagName === "AUDIO") {
        blockType = "audio"
        content = (element as HTMLAudioElement).src
      } else if (element.textContent && !element.querySelector("img, video, audio")) {
        blockType = "text"
        content = element.innerHTML
      }

      const block: ContentBlock = {
        id: `parsed_block_${Date.now()}_${index}`,
        type: blockType,
        content,
        styles: {
          fontSize: computedStyle.fontSize || "16px",
          fontFamily: computedStyle.fontFamily || "Arial, sans-serif",
          color: computedStyle.color || "#000000",
          backgroundColor: computedStyle.backgroundColor || "transparent",
          padding: computedStyle.padding || "8px",
          margin: computedStyle.margin || "4px",
          borderRadius: computedStyle.borderRadius || "4px",
          border: computedStyle.border || "none",
          boxShadow: computedStyle.boxShadow || "none",
          textAlign: (computedStyle.textAlign as any) || "left",
          width: computedStyle.width || "auto",
          height: computedStyle.height || "auto",
          fontWeight: computedStyle.fontWeight || "normal",
          fontStyle: computedStyle.fontStyle || "normal",
          textDecoration: computedStyle.textDecoration || "none",
          lineHeight: computedStyle.lineHeight || "normal",
          letterSpacing: computedStyle.letterSpacing || "normal",
          textTransform: computedStyle.textTransform || "none",
        },
        attributes: {
          width: element.getAttribute("width") || "400",
          height: element.getAttribute("height") || "300",
          alt: element.getAttribute("alt") || "",
          controls: element.hasAttribute("controls"),
          autoplay: element.hasAttribute("autoplay"),
          loop: element.hasAttribute("loop"),
        },
      }

      blocks.push(block)
    })

    onBlocksGenerated(blocks)
    setHtmlContent("")
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <Label>Paste HTML Content</Label>
          <Textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="Paste your HTML content here..."
            className="min-h-24 font-mono"
          />
          <Button onClick={parseHTML} disabled={!htmlContent.trim()}>
            Parse & Add Blocks
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
