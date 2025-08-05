"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false)

  const insertTag = (openTag: string, closeTag = "") => {
    const textarea = document.getElementById("content-editor") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end)

    onChange(newText)
  }

  const formatButtons = [
    { icon: Bold, label: "Bold", openTag: "<strong>", closeTag: "</strong>" },
    { icon: Italic, label: "Italic", openTag: "<em>", closeTag: "</em>" },
    { icon: Underline, label: "Underline", openTag: "<u>", closeTag: "</u>" },
    { icon: List, label: "Bullet List", openTag: "<ul><li>", closeTag: "</li></ul>" },
    { icon: ListOrdered, label: "Numbered List", openTag: "<ol><li>", closeTag: "</li></ol>" },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {formatButtons.map((button) => {
          const IconComponent = button.icon
          return (
            <Button
              key={button.label}
              variant="outline"
              size="sm"
              onClick={() => insertTag(button.openTag, button.closeTag)}
              title={button.label}
            >
              <IconComponent className="w-4 h-4" />
            </Button>
          )
        })}
        <Button variant="outline" size="sm" onClick={() => insertTag("<p>", "</p>")}>
          P
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsHtmlMode(!isHtmlMode)}>
          {isHtmlMode ? "Visual" : "HTML"}
        </Button>
      </div>

      <Textarea
        id="content-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-32 font-mono"
        style={{ fontFamily: isHtmlMode ? "monospace" : "inherit" }}
      />

      {!isHtmlMode && value && (
        <div className="p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      )}
    </div>
  )
}
