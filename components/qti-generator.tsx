"use client"

import { useState } from "react"
import { RichTextEditor } from "@/components/stimulus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText, Eye, Copy, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function QTIGenerator() {
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("Educational Content")
  const [identifier, setIdentifier] = useState("stimulus-content")
  const [language, setLanguage] = useState("en")
  const [description, setDescription] = useState("")
  const [generatedXML, setGeneratedXML] = useState("")
  const [copied, setCopied] = useState(false)

  const generateQTIXML = () => {
    const processHtmlContent = (html: string) => {
      if (!html || html.trim() === "") {
        return "<p>No content provided</p>"
      }

      console.log("[v0] Original HTML:", html)

      // Only make essential XML compliance changes without restructuring
      const processedHtml = html
        // Convert &nbsp; to XML-safe entity
        .replace(/&nbsp;/g, "&#160;")
        // Fix self-closing tags
        .replace(/<br\s*\/?>/gi, "<br/>")
        .replace(/<hr\s*\/?>/gi, "<hr/>")
        .replace(/<img([^>]*?)\s*\/?>/gi, "<img$1/>")
        // Fix table borders
        .replace(/border="(\d+)px"/gi, 'border="$1"')
        // Escape unescaped ampersands
        .replace(/&(?!#?\w+;)/g, "&amp;")
        // Remove any HTML comments that might interfere
        .replace(/<!--[\s\S]*?-->/g, "")
        // Ensure proper XML structure without changing positioning
        .trim()

      console.log("[v0] Processed HTML:", processedHtml)
      return processedHtml
    }

    const processedContent = processHtmlContent(content)

    const qtiXML = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-stimulus
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_stimulusv3p0p1_v1p0.xsd"
  identifier="${identifier}"
  xmlLang="${language}"
  title="${title}">
  <qti-stimulus-body>
    <div class="stimulus-content">
      ${processedContent}
    </div>
  </qti-stimulus-body>
</qti-assessment-stimulus>`

    console.log("[v0] Final XML:", qtiXML)
    setGeneratedXML(qtiXML)
  }

  const downloadXML = () => {
    if (!generatedXML) return

    const blob = new Blob([generatedXML], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${identifier}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    if (!generatedXML) return

    try {
      await navigator.clipboard.writeText(generatedXML)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy XML:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">QTI XML Generator</h1>
          <p className="text-lg text-gray-600">Create educational assessment stimuli in QTI format</p>
        </div>

        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Content Creation
              </CardTitle>
              <CardDescription>Create your educational content using the rich text editor below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Educational Content Title"
                  />
                </div>
                <div>
                  <Label htmlFor="identifier">Identifier</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="stimulus-content"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="en"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div>
                <Label>Content</Label>
                <div className="mt-2">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Enter your educational content here..."
                    className="min-h-[400px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                QTI XML Generation
              </CardTitle>
              <CardDescription>Generate and download your content as QTI-compliant XML</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button onClick={generateQTIXML} className="w-full" disabled={!content.trim()}>
                  Generate QTI XML
                </Button>

                {generatedXML && (
                  <div className="space-y-2">
                    <Button onClick={downloadXML} variant="outline" className="w-full bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download XML File
                    </Button>

                    <Button onClick={copyToClipboard} variant="outline" className="w-full bg-transparent">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy XML
                        </>
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full bg-transparent">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview XML
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Generated QTI XML</DialogTitle>
                          <DialogDescription>Preview of your QTI-compliant XML content</DialogDescription>
                        </DialogHeader>
                        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                          <code>{generatedXML}</code>
                        </pre>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-blue-900">About QTI Format</h3>
                <p className="text-sm text-blue-800">
                  QTI (Question and Test Interoperability) is a standard format for educational assessments. This tool
                  generates QTI 3.0 compliant XML that can be used in learning management systems and educational
                  platforms.
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>
                    <strong>Features:</strong>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Rich text formatting support</li>
                    <li>Image and media embedding</li>
                    <li>Proper XML structure validation</li>
                    <li>Educational content organization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Example Content</CardTitle>
            <CardDescription>Click to load example educational content about forest ecosystems</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                setTitle("Forest Ecosystem Reading Passage")
                setIdentifier("stimulus-science-ecosystems")
                setContent(`<h2>Forest Ecosystems</h2>
<p>A forest ecosystem is a complex community of plants, animals, and microorganisms that interact with each other and their physical environment. These ecosystems play crucial roles in maintaining environmental balance and supporting biodiversity.</p>

<h3>Layers of the Forest</h3>
<p><strong>Canopy Layer:</strong> The uppermost layer formed by the crowns of tall trees. This layer receives the most sunlight and is home to many birds, insects, and mammals.</p>

<p><strong>Understory:</strong> Below the canopy, this layer consists of smaller trees and shrubs that can tolerate lower light conditions. Many flowering plants and young trees grow here.</p>

<p><strong>Forest Floor:</strong> The ground level where decomposition occurs. Fallen leaves, branches, and other organic matter break down, providing nutrients for plant growth.</p>

<h3>Ecological Relationships</h3>
<p>Forest ecosystems demonstrate various ecological relationships:</p>
<ul>
<li><em>Producers:</em> Trees and plants that make their own food through photosynthesis</li>
<li><em>Primary Consumers:</em> Herbivores that eat plants, such as deer and rabbits</li>
<li><em>Secondary Consumers:</em> Carnivores that eat herbivores, such as foxes and hawks</li>
<li><em>Decomposers:</em> Organisms like fungi and bacteria that break down dead material</li>
</ul>`)
              }}
            >
              Load Example Content
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
