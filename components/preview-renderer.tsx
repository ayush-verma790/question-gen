"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PreviewRendererProps {
  xmlContent: string
  questionType: string
  disabled?: boolean
}

export function PreviewRenderer({ xmlContent, questionType, disabled = false }: PreviewRendererProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const generatePreview = async () => {
    if (!xmlContent.trim()) {
      toast({
        title: "No Content",
        description: "Please generate XML content first",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/render-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ xml: xmlContent }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate preview")
      }

      const htmlContent = await response.text()
      
      // Create a blob URL for the HTML content
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      toast({
        title: "Preview Ready",
        description: "Question preview has been generated",
      })
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between max-w-full">
          Question Preview
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePreview}
              disabled={disabled || isLoading || !xmlContent.trim()}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isLoading ? "Generating..." : "Generate Preview"}
            </Button>
            {previewUrl && (
              <Button variant="outline" size="sm" onClick={openInNewTab}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {previewUrl && (
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              className="w-full h-[800px] border-0"
              title={`${questionType} Question Preview`}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
