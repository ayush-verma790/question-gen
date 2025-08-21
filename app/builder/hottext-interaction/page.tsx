"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, Eye, Download, Upload, Image, FileText, CheckSquare, MessageSquare } from "lucide-react"
import { XMLViewer } from "@/components/xml-viewer"
import { PreviewRenderer } from "@/components/preview-renderer"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ContentBlockEditor } from "@/components/content-block-editor"
import { AdvancedColorPicker } from "@/components/advanced-color-picker"
import { ButtonSuggestions } from "@/components/button-suggestions"
import type { ContentBlock } from "@/lib/types"

interface HottextOption {
  id: string
  identifier: string
  imageUrl: string
  altText: string
  isCorrect: boolean
  style?: {
    padding?: string
    margin?: string
    backgroundColor?: string
    border?: string
    borderRadius?: string
  }
}

interface QuestionData {
  identifier: string
  title: string
  questionText: string
  questionBlocks: ContentBlock[]
  mainImageUrl?: string
  mainImageAlt?: string
  mainImageStyle?: {
    width?: string
    height?: string
    margin?: string
  }
  options: HottextOption[]
  correctFeedback: string
  incorrectFeedback: string
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
  containerStyle?: {
    fontFamily?: string
    fontSize?: string
    backgroundColor?: string
    padding?: string
    borderRadius?: string
    boxShadow?: string
  }
}

export default function ImageHottextBuilder() {
  const [activeTab, setActiveTab] = useState("question")
  const [question, setQuestion] = useState<QuestionData>({
    identifier: "",
    title: "",
    questionText: "",
    questionBlocks: [],
    mainImageUrl: "",
    mainImageAlt: "",
    mainImageStyle: {
      width: "",
      height: "",
      margin: ""
    },
    options: [],
    correctFeedback: "",
    incorrectFeedback: "",
    correctFeedbackBlocks: [],
    incorrectFeedbackBlocks: [],
    containerStyle: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "18px",
      backgroundColor: "#ffffff",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
    }
  })

  const [generatedXML, setGeneratedXML] = useState("")
  const [importXML, setImportXML] = useState("")
  const [showRenderPreview, setShowRenderPreview] = useState(false)

  // Helper function to parse XML and extract data
  const parseXMLToQuestion = (xmlString: string): Partial<QuestionData> => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, "text/xml")
      
      // Check for parsing errors
      const parseError = xmlDoc.getElementsByTagName("parsererror")
      if (parseError.length > 0) {
        throw new Error("Invalid XML format")
      }

      const assessmentItem = xmlDoc.getElementsByTagName("qti-assessment-item")[0]
      if (!assessmentItem) {
        throw new Error("No qti-assessment-item found")
      }

      // Extract basic info
      const identifier = assessmentItem.getAttribute("identifier") || ""
      const title = assessmentItem.getAttribute("title") || ""

      // Extract correct response
      const correctResponseElement = xmlDoc.getElementsByTagName("qti-correct-response")[0]
      const correctIdentifiers = []
      if (correctResponseElement) {
        const values = correctResponseElement.getElementsByTagName("qti-value")
        for (let i = 0; i < values.length; i++) {
          correctIdentifiers.push(values[i].textContent || "")
        }
      }

      // Extract question text and main image
      const itemBody = xmlDoc.getElementsByTagName("qti-item-body")[0]
      let questionText = ""
      let mainImageUrl = ""
      let mainImageAlt = ""
      let mainImageStyle = { width: "", height: "", margin: "" }

      if (itemBody) {
        // Find question text div
        const divs = itemBody.getElementsByTagName("div")
        for (let i = 0; i < divs.length; i++) {
          if (divs[i].style && divs[i].style.fontSize) {
            questionText = divs[i].innerHTML || ""
            break
          }
        }

        // Find main image (not inside hottext)
        const images = itemBody.getElementsByTagName("img")
        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          // Check if image is not inside a qti-hottext element
          let isInsideHottext = false
          let parent = img.parentElement
          while (parent && parent !== itemBody) {
            if (parent.tagName === "qti-hottext") {
              isInsideHottext = true
              break
            }
            parent = parent.parentElement
          }
          
          if (!isInsideHottext) {
            mainImageUrl = img.getAttribute("src") || ""
            mainImageAlt = img.getAttribute("alt") || ""
            
            // Extract style attributes
            const style = img.getAttribute("style") || ""
            const widthMatch = style.match(/width:\s*([^;]+)/)
            const heightMatch = style.match(/height:\s*([^;]+)/)
            const marginMatch = style.match(/margin:\s*([^;]+)/)
            
            mainImageStyle = {
              width: widthMatch ? widthMatch[1].trim() : "",
              height: heightMatch ? heightMatch[1].trim() : "",
              margin: marginMatch ? marginMatch[1].trim() : ""
            }
            break
          }
        }
      }

      // Extract hottext options
      const hottextElements = xmlDoc.getElementsByTagName("qti-hottext")
      const options: HottextOption[] = []

      for (let i = 0; i < hottextElements.length; i++) {
        const hottext = hottextElements[i]
        const identifier = hottext.getAttribute("identifier") || `HT${i + 1}`
        
        // Find image inside hottext
        const img = hottext.getElementsByTagName("img")[0]
        if (img) {
          const imageUrl = img.getAttribute("src") || ""
          const altText = img.getAttribute("alt") || `Option ${i + 1}`
          const isCorrect = correctIdentifiers.includes(identifier)

          // Extract styling from span or parent elements
          const span = hottext.getElementsByTagName("span")[0]
          let style = {
            padding: "15px",
            margin: "5px", 
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px"
          }

          if (span && span.getAttribute("style")) {
            const styleAttr = span.getAttribute("style") || ""
            const paddingMatch = styleAttr.match(/padding:\s*([^;]+)/)
            const marginMatch = styleAttr.match(/margin:\s*([^;]+)/)
            const bgMatch = styleAttr.match(/background-color:\s*([^;]+)/)
            const borderMatch = styleAttr.match(/border:\s*([^;]+)/)
            const borderRadiusMatch = styleAttr.match(/border-radius:\s*([^;]+)/)

            style = {
              padding: paddingMatch ? paddingMatch[1].trim() : style.padding,
              margin: marginMatch ? marginMatch[1].trim() : style.margin,
              backgroundColor: bgMatch ? bgMatch[1].trim() : style.backgroundColor,
              border: borderMatch ? borderMatch[1].trim() : style.border,
              borderRadius: borderRadiusMatch ? borderRadiusMatch[1].trim() : style.borderRadius
            }
          }

          options.push({
            id: (Date.now() + i).toString(),
            identifier,
            imageUrl,
            altText,
            isCorrect,
            style
          })
        }
      }

      // Extract feedback
      const feedbackElements = xmlDoc.getElementsByTagName("qti-modal-feedback")
      let correctFeedback = ""
      let incorrectFeedback = ""

      for (let i = 0; i < feedbackElements.length; i++) {
        const feedback = feedbackElements[i]
        const identifier = feedback.getAttribute("identifier")
        const contentBody = feedback.getElementsByTagName("qti-content-body")[0]
        
        if (contentBody) {
          if (identifier === "CORRECT") {
            correctFeedback = contentBody.innerHTML || ""
          } else if (identifier === "INCORRECT") {
            incorrectFeedback = contentBody.innerHTML || ""
          }
        }
      }

      return {
        identifier,
        title,
        questionText,
        mainImageUrl,
        mainImageAlt,
        mainImageStyle,
        options,
        correctFeedback,
        incorrectFeedback,
        questionBlocks: [],
        correctFeedbackBlocks: [],
        incorrectFeedbackBlocks: []
      }

    } catch (error) {
      console.error("Error parsing XML:", error)
      throw error
    }
  }

  // Handle XML import
  const handleImportXML = () => {
    if (!importXML.trim()) {
      alert("Please enter XML content to import")
      return
    }

    try {
      const parsedData = parseXMLToQuestion(importXML)
      
      // Merge parsed data with current question state
      setQuestion(prev => ({
        ...prev,
        ...parsedData,
        // Ensure arrays exist even if not parsed
        questionBlocks: parsedData.questionBlocks || [],
        correctFeedbackBlocks: parsedData.correctFeedbackBlocks || [],
        incorrectFeedbackBlocks: parsedData.incorrectFeedbackBlocks || [],
        options: parsedData.options || []
      }))

      // Clear import field and show success
      setImportXML("")
      alert("XML imported successfully!")

    } catch (error: any) {
      alert(`Error importing XML: ${error.message}`)
    }
  }

  // Helper function to render content blocks as HTML
  const renderContentBlocks = (blocks: ContentBlock[]): string => {
    return blocks.map(block => {
      const styleStr = block.styles ? Object.entries(block.styles)
        .filter(([_, value]) => value)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
        .join('; ') : ''

      switch (block.type) {
        case 'text':
          return `<div style="${styleStr}">${block.content || ''}</div>`
        case 'image':
          return `<img src="${block.content || ''}" alt="${block.attributes?.alt || ''}" style="${styleStr}" />`
        case 'video':
          return `<video controls style="${styleStr}"><source src="${block.content || ''}" /></video>`
        case 'audio':
          return `<audio controls style="${styleStr}"><source src="${block.content || ''}" /></audio>`
        case 'html':
          return block.content || ''
        default:
          return block.content || ''
      }
    }).join('')
  }

  // Helper function to get combined content (text + blocks)
  const getCombinedContent = (text: string, blocks: ContentBlock[]): string => {
    const blocksHTML = renderContentBlocks(blocks)
    return text + (blocksHTML ? `<div class="content-blocks">${blocksHTML}</div>` : '')
  }

  const addOption = () => {
    const newOption: HottextOption = {
      id: Date.now().toString(),
      identifier: `HT${question.options.length + 1}`,
      imageUrl: "",
      altText: `Option ${question.options.length + 1}`,
      isCorrect: false,
      style: {
        padding: "35px 15px 15px 15px",
        margin: "0px",
        backgroundColor: "#ffffff",
        border: "0px",
        borderRadius: "4px"
      }
    }
    setQuestion(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }))
  }

  const removeOption = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }))
  }

  const updateOption = (id: string, field: string, value: any) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const updateOptionStyle = (id: string, styleField: string, value: string) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === id ? { 
          ...opt, 
          style: { ...opt.style, [styleField]: value }
        } : opt
      )
    }))
  }

  const generateXML = () => {
    const correctOptions = question.options.filter(opt => opt.isCorrect)
    const correctValue = correctOptions.length > 0 ? correctOptions[0].identifier : ""

    const containerStyleStr = question.containerStyle ? 
      Object.entries(question.containerStyle)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ') : ""

    const mainImageStyleStr = question.mainImageStyle ?
      Object.entries(question.mainImageStyle)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ') : ""

    const hottextElements = question.options.map(option => {
      const styleStr = option.style ?
        Object.entries(option.style)
          .filter(([_, value]) => value)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
          .join('; ') : ""

      return `          <qti-hottext identifier="${option.identifier}"><span style="display: inline-block; ${styleStr}"><img src="${option.imageUrl}" alt="${option.altText}"/></span>
          </qti-hottext>`
    }).join('\n')

    // Combine question text with content blocks
    const questionContent = getCombinedContent(question.questionText, question.questionBlocks)
    const correctFeedbackContent = getCombinedContent(question.correctFeedback, question.correctFeedbackBlocks)
    const incorrectFeedbackContent = getCombinedContent(question.incorrectFeedback, question.incorrectFeedbackBlocks)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
  identifier="${question.identifier}"
  title="${question.title}"
  adaptive="false"
  time-dependent="false">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>${correctValue}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-item-body>
    <div style="${containerStyleStr}">
      <div style="font-size: 20px; font-family: Arial, sans-serif; color: #000000; padding: 8px; margin: 4px; border-radius: 4px; border: none; box-shadow: none; text-align: left">${questionContent}</div>
      ${question.mainImageUrl ? `<img src="${question.mainImageUrl}" alt="${question.mainImageAlt}" style="${mainImageStyleStr}"/>` : ''}

      <qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
${hottextElements}
        </div>
      </qti-hottext-interaction>
    </div>
  </qti-item-body>

  <qti-response-processing template="match_correct">
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-base-value base-type="identifier">CORRECT</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-base-value base-type="identifier">INCORRECT</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>

  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show" title="Great Job!">
    ${correctFeedbackContent ? `<qti-content-body>${correctFeedbackContent}</qti-content-body>` : ''}
  </qti-modal-feedback>

  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show" title="Try Again">
    <qti-content-body>
      <div style="${containerStyleStr}">
        ${incorrectFeedbackContent}
      </div>
    </qti-content-body>
  </qti-modal-feedback>

</qti-assessment-item>`

    setGeneratedXML(xml)
  }

  React.useEffect(() => {
    generateXML()
  }, [question])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-14 p-1 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <TabsTrigger 
              value="question" 
              className="flex items-center gap-2 h-12 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all"
            >
              <FileText className="w-4 h-4" />
              Question Setup
            </TabsTrigger>
            <TabsTrigger 
              value="choices" 
              className="flex items-center gap-2 h-12 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-md transition-all"
            >
              <CheckSquare className="w-4 h-4" />
              Image Choices
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="flex items-center gap-2 h-12 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Feedback & Hints
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="flex items-center gap-2 h-12 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md transition-all"
            >
              <Eye className="w-4 h-4" />
              Preview & Export
            </TabsTrigger>
          </TabsList>

          {/* Question Tab */}
          <TabsContent value="question" className="space-y-8">
            <div className="grid lg:grid-cols-1 max-w-5xl mx-auto">
              {/* XML Import Section */}
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden mb-8">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50 pb-4">
                  <CardTitle className="text-xl font-bold text-emerald-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Upload className="w-4 h-4 text-emerald-600" />
                    </div>
                    Import Existing XML
                  </CardTitle>
                  <p className="text-sm text-emerald-700 mt-2">Paste your existing QTI XML to automatically populate all form fields</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">QTI XML Content</Label>
                    <Textarea
                      value={importXML}
                      onChange={(e) => setImportXML(e.target.value)}
                      placeholder="Paste your QTI XML content here to automatically populate the form..."
                      className="min-h-32 border-2 border-gray-200 focus:border-emerald-400 rounded-xl resize-y"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleImportXML}
                      disabled={!importXML.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import XML
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setImportXML("")}
                      className="border-2 border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2"
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 pb-4">
                  <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Question Identifier</Label>
                      <Input
                        value={question.identifier}
                        onChange={(e) => setQuestion(prev => ({...prev, identifier: e.target.value}))}
                        className="h-11 border-2 border-gray-200 focus:border-blue-400 rounded-xl"
                        placeholder="e.g., xml-hottext-item-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Question Title</Label>
                      <Input
                        value={question.title}
                        onChange={(e) => setQuestion(prev => ({...prev, title: e.target.value}))}
                        className="h-11 border-2 border-gray-200 focus:border-blue-400 rounded-xl"
                        placeholder="e.g., Identify the Pictures"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Question Text</Label>
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-colors">
                      <RichTextEditor
                        value={question.questionText}
                        onChange={(value) => setQuestion(prev => ({...prev, questionText: value}))}
                        placeholder="Enter your question text with rich formatting..."
                        className="border-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Content Blocks */}
              {/* <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden mt-8">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50 pb-4">
                  <CardTitle className="text-xl font-bold text-purple-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-purple-600" />
                    </div>
                    Additional Question Content
                  </CardTitle>
                  <p className="text-sm text-purple-700 mt-2">Add images, videos, HTML content, and more to enhance your question</p>
                </CardHeader>
                <CardContent className="p-6">
                  <ContentBlockEditor
                    blocks={question.questionBlocks}
                    onChange={(blocks) => setQuestion(prev => ({...prev, questionBlocks: blocks}))}
                    title="Question Content Blocks"
                  />
                </CardContent>
              </Card> */}

              {/* Main Question Image */}
              {/* <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden mt-8">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 pb-4">
                  <CardTitle className="text-xl font-bold text-green-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Image className="w-4 h-4 text-green-600" />
                    </div>
                    Main Question Image
                  </CardTitle>
                  <p className="text-sm text-green-700 mt-2">Optional: Add a main context image for your question</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Image URL</Label>
                    <Input
                      value={question.mainImageUrl || ""}
                      onChange={(e) => setQuestion(prev => ({...prev, mainImageUrl: e.target.value}))}
                      placeholder="https://example.com/image.png"
                      className="h-11 border-2 border-gray-200 focus:border-green-400 rounded-xl"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Width (px)</Label>
                      <Input
                        value={question.mainImageStyle?.width || ""}
                        onChange={(e) => setQuestion(prev => ({
                          ...prev, 
                          mainImageStyle: {...prev.mainImageStyle, width: e.target.value}
                        }))}
                        placeholder="400"
                        className="h-11 border-2 border-gray-200 focus:border-green-400 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Height (px)</Label>
                      <Input
                        value={question.mainImageStyle?.height || ""}
                        onChange={(e) => setQuestion(prev => ({
                          ...prev,
                          mainImageStyle: {...prev.mainImageStyle, height: e.target.value}
                        }))}
                        placeholder="200"
                        className="h-11 border-2 border-gray-200 focus:border-green-400 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Margin</Label>
                      <Input
                        value={question.mainImageStyle?.margin || ""}
                        onChange={(e) => setQuestion(prev => ({
                          ...prev,
                          mainImageStyle: {...prev.mainImageStyle, margin: e.target.value}
                        }))}
                        placeholder="20px auto"
                        className="h-11 border-2 border-gray-200 focus:border-green-400 rounded-xl"
                      />
                    </div>
                  </div>
                  {question.mainImageUrl && (
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
                      <Label className="text-sm font-semibold text-gray-600 mb-2 block">Preview:</Label>
                      <div className="flex justify-center">
                        <img 
                          src={question.mainImageUrl} 
                          alt={question.mainImageAlt}
                          style={{
                            width: question.mainImageStyle?.width ? `${question.mainImageStyle.width}px` : 'auto',
                            height: question.mainImageStyle?.height ? `${question.mainImageStyle.height}px` : 'auto',
                            maxWidth: '100%',
                            borderRadius: '8px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card> */}
            </div>
          </TabsContent>

          {/* Choices Tab */}
          <TabsContent value="choices" className="space-y-8">
            <div className="grid lg:grid-cols-1 max-w-5xl mx-auto">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 pb-4">
                  <CardTitle className="flex items-center justify-between text-xl font-bold text-green-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                      Image Options & Choices
                    </div>
                    <Button 
                      onClick={addOption} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 shadow-md"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </CardTitle>
                  <p className="text-sm text-green-700 mt-2">Configure your image-based answer choices with custom styling</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {question.options.map((option, index) => (
                    <Card key={option.id} className="border-2 border-gray-100 hover:border-gray-200 transition-colors rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              option.isCorrect ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <Image className={`w-4 h-4 ${option.isCorrect ? 'text-green-600' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">Option {index + 1}</span>
                              <span className="text-sm text-gray-500 ml-2">({option.identifier})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={option.isCorrect}
                                onCheckedChange={(checked) => updateOption(option.id, 'isCorrect', checked)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <Label className="text-sm font-medium text-green-700">Correct Answer</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(option.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Image URL</Label>
                            <Input
                              value={option.imageUrl}
                              onChange={(e) => updateOption(option.id, 'imageUrl', e.target.value)}
                              placeholder="https://example.com/option.png"
                              className="h-11 border-2 border-gray-200 focus:border-blue-400 rounded-xl"
                            />
                            <div className="mt-3">
                              <Label className="text-xs font-medium text-gray-500 mb-2 block">Quick Placeholder Images:</Label>
                              <ButtonSuggestions 
                                onSuggestionClick={(suggestion) => {
                                  const placeholderImages = [
                                    "https://via.placeholder.com/120x120/ef4444/ffffff?text=Option+A",
                                    "https://via.placeholder.com/120x120/22c55e/ffffff?text=Option+B", 
                                    "https://via.placeholder.com/120x120/3b82f6/ffffff?text=Option+C",
                                    "https://via.placeholder.com/120x120/f59e0b/ffffff?text=Option+D",
                                    "https://via.placeholder.com/120x120/8b5cf6/ffffff?text=True",
                                    "https://via.placeholder.com/120x120/ec4899/ffffff?text=False"
                                  ];
                                  const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
                                  updateOption(option.id, 'imageUrl', randomImage);
                                }}
                                size="sm"
                                showTitle={false}
                                defaultCollapsed={true}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Alt Text</Label>
                            <Input
                              value={option.altText}
                              onChange={(e) => updateOption(option.id, 'altText', e.target.value)}
                              className="h-11 border-2 border-gray-200 focus:border-blue-400 rounded-xl"
                              placeholder="Descriptive alt text"
                            />
                          </div>
                        </div>
                        
                        {/* Enhanced Styling Options */}
                        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-4 border border-blue-100">
                          <Label className="text-sm font-semibold text-blue-900 mb-4 block flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-600 rounded"></div>
                            </div>
                            Styling Options
                          </Label>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-gray-600 mb-2 block">Padding</Label>
                              <Input
                                value={option.style?.padding || ""}
                                onChange={(e) => updateOptionStyle(option.id, 'padding', e.target.value)}
                                placeholder="15px"
                                className="text-xs h-9 border border-gray-200 rounded-lg"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600 mb-2 block">Background Color</Label>
                              <div className="flex gap-2 items-center">
                                <Input
                                  value={option.style?.backgroundColor || ""}
                                  onChange={(e) => updateOptionStyle(option.id, 'backgroundColor', e.target.value)}
                                  placeholder="#ffffff"
                                  className="text-xs h-9 flex-1 border border-gray-200 rounded-lg"
                                />
                                <AdvancedColorPicker
                                  label="Background"
                                  color={option.style?.backgroundColor || "#ffffff"}
                                  onChange={(color) => updateOptionStyle(option.id, 'backgroundColor', color)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600 mb-2 block">Border Radius</Label>
                              <Input
                                value={option.style?.borderRadius || ""}
                                onChange={(e) => updateOptionStyle(option.id, 'borderRadius', e.target.value)}
                                placeholder="12px"
                                className="text-xs h-9 border border-gray-200 rounded-lg"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600 mb-2 block">Margin</Label>
                              <Input
                                value={option.style?.margin || ""}
                                onChange={(e) => updateOptionStyle(option.id, 'margin', e.target.value)}
                                placeholder="5px"
                                className="text-xs h-9 border border-gray-200 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced Preview */}
                        {option.imageUrl && (
                          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                            <Label className="text-xs font-semibold text-gray-600 mb-3 block flex items-center gap-2">
                              <Eye className="w-3 h-3" />
                              Live Preview
                            </Label>
                            <div className="flex justify-center">
                              <div 
                                style={{
                                  display: 'inline-block',
                                  padding: option.style?.padding || '0px',
                                  margin: option.style?.margin || '0px',
                                  backgroundColor: option.style?.backgroundColor || 'transparent',
                                  borderRadius: option.style?.borderRadius || '0px',
                                  border: option.isCorrect ? '2px solid #22c55e' : '1px solid #e5e7eb',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                className="transition-transform hover:scale-105"
                              >
                                <img 
                                  src={option.imageUrl} 
                                  alt={option.altText}
                                  style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }}
                                />
                              </div>
                            </div>
                            {option.isCorrect && (
                              <div className="text-center mt-2">
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                  ✓ Correct Answer
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="grid lg:grid-cols-1 max-w-4xl mx-auto">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Feedback Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* <div>
                    <Label className="text-sm font-medium">Correct Answer Feedback (Rich HTML Editor)</Label>
                    <RichTextEditor
                      value={question.correctFeedback}
                      onChange={(value) => setQuestion(prev => ({...prev, correctFeedback: value}))}
                      placeholder="Enter feedback for correct answers with rich formatting, images, videos..."
                      className="mt-1"
                    />
                    
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Additional Correct Feedback Content (Images, Videos, HTML)</Label>
                      <div className="mt-2">
                        <ContentBlockEditor
                          blocks={question.correctFeedbackBlocks}
                          onChange={(blocks) => setQuestion(prev => ({...prev, correctFeedbackBlocks: blocks}))}
                          title="Correct Feedback Content"
                        />
                      </div>
                    </div>
                  </div> */}
                  
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium">Incorrect Answer Feedback (Rich HTML Editor)</Label>
                    <RichTextEditor
                      value={question.incorrectFeedback}
                      onChange={(value) => setQuestion(prev => ({...prev, incorrectFeedback: value}))}
                      placeholder="Enter feedback for incorrect answers with rich formatting, images, videos..."
                      className="mt-1"
                    />
                    
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Additional Incorrect Feedback Content (Images, Videos, HTML)</Label>
                      <div className="mt-2">
                        <ContentBlockEditor
                          blocks={question.incorrectFeedbackBlocks}
                          onChange={(blocks) => setQuestion(prev => ({...prev, incorrectFeedbackBlocks: blocks}))}
                          title="Incorrect Feedback Content"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className="grid lg:grid-cols-1 gap-6">
              {/* Live Preview */}
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
              
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-4 rounded-lg border min-h-48">
                    <div style={{
                      fontFamily: question.containerStyle?.fontFamily || 'Canva Sans',
                      fontSize: question.containerStyle?.fontSize || '22px',
                      backgroundColor: question.containerStyle?.backgroundColor || '#ffffff',
                      padding: question.containerStyle?.padding || '20px',
                      borderRadius: question.containerStyle?.borderRadius || '8px',
                      boxShadow: question.containerStyle?.boxShadow || '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#000000',
                        padding: '8px',
                        margin: '4px',
                        borderRadius: '4px',
                        textAlign: 'left'
                      }}
                      dangerouslySetInnerHTML={{ __html: getCombinedContent(question.questionText, question.questionBlocks) }}
                      />
                      
                      {question.mainImageUrl && (
                        <img 
                          src={question.mainImageUrl} 
                          alt={question.mainImageAlt}
                          style={{
                            width: question.mainImageStyle?.width ? `${question.mainImageStyle.width}px` : 'auto',
                            height: question.mainImageStyle?.height ? `${question.mainImageStyle.height}px` : 'auto',
                            margin: question.mainImageStyle?.margin || '10px 0'
                          }}
                        />
                      )}

                      <div style={{
                        display: 'flex',
                        gap: '20px',
                        flexWrap: 'wrap',
                        marginTop: '20px'
                      }}>
                        {question.options.map(option => (
                          <div
                            key={option.id}
                            style={{
                              display: 'inline-block',
                              padding: option.style?.padding || '0px',
                              margin: option.style?.margin || '0px',
                              backgroundColor: option.style?.backgroundColor || 'transparent',
                              border: option.style?.border || '0px',
                              borderRadius: option.style?.borderRadius || '0px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            className={`hover:opacity-75 ${option.isCorrect ? 'ring-2 ring-green-400' : ''}`}
                            title={option.isCorrect ? 'Correct Answer' : 'Option'}
                          >
                            {option.imageUrl ? (
                              <img src={option.imageUrl} alt={option.altText} style={{ maxWidth: '100px' }} />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Preview */}
              {(question.correctFeedback || question.incorrectFeedback || question.correctFeedbackBlocks.length > 0 || question.incorrectFeedbackBlocks.length > 0) && (
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Feedback Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(question.correctFeedback || question.correctFeedbackBlocks.length > 0) && (
                      <div>
                        <Label className="text-sm font-medium text-green-600 mb-2 block">Correct Answer Feedback:</Label>
                        <div 
                          className="bg-green-50 border border-green-200 p-4 rounded-lg"
                          dangerouslySetInnerHTML={{ __html: getCombinedContent(question.correctFeedback, question.correctFeedbackBlocks) }}
                        />
                      </div>
                    )}
                    {(question.incorrectFeedback || question.incorrectFeedbackBlocks.length > 0) && (
                      <div>
                        <Label className="text-sm font-medium text-red-600 mb-2 block">Incorrect Answer Feedback:</Label>
                        <div 
                          className="bg-red-50 border border-red-200 p-4 rounded-lg"
                          dangerouslySetInnerHTML={{ __html: getCombinedContent(question.incorrectFeedback, question.incorrectFeedbackBlocks) }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* XML Output */}
              {generatedXML && (
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Generated QTI XML</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <XMLViewer xml={generatedXML} filename={`${question.identifier}.xml`} />
                  </CardContent>
                </Card>
              )}

              {/* XML Preview Renderer */}
            
                <PreviewRenderer xmlContent={generatedXML} questionType="hottext-interaction" />
      
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
