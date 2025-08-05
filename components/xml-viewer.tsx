"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, Eye, EyeOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface XMLViewerProps {
  xml: string
  filename: string
}

export function XMLViewer({ xml, filename }: XMLViewerProps) {
  const [isVisible, setIsVisible] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(xml)
      toast({
        title: "Copied!",
        description: "XML content copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy XML content",
        variant: "destructive",
      })
    }
  }

  const downloadXML = () => {
    const blob = new Blob([xml], { type: "application/xml" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Downloaded!",
      description: `${filename} has been downloaded`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Generated QTI XML
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)}>
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isVisible ? "Hide" : "Show"} XML
            </Button>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button onClick={downloadXML}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {isVisible && (
        <CardContent>
          <Textarea
            value={xml}
            readOnly
            className="min-h-96 font-mono text-sm"
            placeholder="Generated XML will appear here..."
          />
        </CardContent>
      )}
    </Card>
  )
}
