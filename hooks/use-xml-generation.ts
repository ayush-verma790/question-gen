import { useState, useCallback } from "react"
import type { XMLGenerationRequest } from "@/lib/types"

export function useXMLGeneration() {
  const [xmlContent, setXmlContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateXML = useCallback(async (request: XMLGenerationRequest) => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch("/api/generate-xml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error("Failed to generate XML")
      }

      const xml = await response.text()
      setXmlContent(xml)
      return xml
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const clearXML = useCallback(() => {
    setXmlContent("")
    setError(null)
  }, [])

  return {
    xmlContent,
    isGenerating,
    error,
    generateXML,
    clearXML,
    setXmlContent,
  }
}
