"use client"

/**
 * Enhanced Mixed Question Builder with Cursor-Based Text Box Insertion
 * 
 * Features:
 * - Click anywhere in text content to position cursor
 * - Insert text boxes at exact cursor position using [1], [2], etc. placeholders
 * - Advanced HTML formatting toolbar with cursor awareness
 * - Button suggestions that insert at cursor position
 * - Text box management with expected answers
 * - Support for multiple question types in unified blocks
 * 
 * Based on the sophisticated text-entry builder reference implementation.
 */

import React, { useState, useCallback, useMemo, useEffect, memo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, Eye, Upload, ChevronDown, ChevronUp, TextCursorInput } from "lucide-react"
import {
  Image, Video, Music, Bold, Italic, Underline,
  Heading1, Heading2, Pilcrow, Type, List, ListOrdered,
  Link, Palette
} from 'lucide-react'
import { ContentBlockEditor } from "@/components/content-block-editor"
import { XMLViewer } from "@/components/xml-viewer"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ButtonSuggestions } from "@/components/button-suggestions"
import type { ContentBlock } from "@/lib/types"

// Enhanced Content Block with cursor position tracking
interface EnhancedContentBlock extends ContentBlock {
  type: "text" | "textEntry" | "image" | "video" | "audio" | "html"
  textEntryBoxes?: TextEntryBox[]
  textEntryConfig?: TextEntryBlockConfig
}

// Text Entry Box for inline insertion
interface TextEntryBox {
  id: string
  placeholder: string
  expectedText: string
  caseSensitive: boolean
  allowPartial: boolean
  maxLength?: number
  blockId: string
}

// Dedicated Text Entry Block Configuration
interface TextEntryBlockConfig {
  textEntries: TextEntryField[]
  allowMultipleAttempts: boolean
  showCorrectAnswers: boolean
  layout: 'vertical' | 'horizontal' | 'grid'
}

// Individual Text Entry Field within a Text Entry Block
interface TextEntryField {
  id: string
  label: string
  expectedAnswer: string
  placeholder: string
  maxLength: number
  width: 'small' | 'medium' | 'large' | 'full'
  caseSensitive: boolean
  allowPartial: boolean
  required: boolean
}

// Mixed Question Types
interface MixedInteraction {
  id: string
  type: 'text-entry' | 'multiple-choice' | 'hottext' | 'match' | 'order' | 'gap-match'
  order: number
  config: any
}

interface MixedQuestion {
  identifier: string
  title: string
  promptBlocks: EnhancedContentBlock[]
  textEntryBoxes: TextEntryBox[]
  correctAnswers: string[]
  interactions: MixedInteraction[]
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
}

// Text Entry Config
interface TextEntryConfig {
  identifier: string
  expectedText: string
  caseSensitive: boolean
  allowPartial: boolean
  placeholder?: string
  maxLength?: number
}

// Multiple Choice Config
interface MultipleChoiceConfig {
  identifier: string
  options: Array<{
    identifier: string
    contentBlocks: ContentBlock[]
    isCorrect: boolean
  }>
  maxChoices: number
  shuffle: boolean
}

// Hottext Config
interface HottextConfig {
  identifier: string
  contentBlocks: ContentBlock[]
  hotspots: Array<{
    identifier: string
    text: string
    isCorrect: boolean
    displayText?: string  // For HTML formatted display
    type?: 'text' | 'html' | 'button'  // Type of hotspot content
  }>
}

// Match Config
interface MatchConfig {
  identifier: string
  pairs: Array<{
    leftId: string
    leftContentBlocks: ContentBlock[]
    rightId: string
    rightContentBlocks: ContentBlock[]
  }>
  maxAssociations: number
  shuffle: boolean
}

// Order Config
interface OrderConfig {
  identifier: string
  options: Array<{
    identifier: string
    contentBlocks: ContentBlock[]
    correctOrder: number
  }>
  orientation: 'vertical' | 'horizontal'
  shuffle: boolean
}

// Gap Match Config
interface GapMatchConfig {
  identifier: string
  gapText: string
  gapChoices: Array<{
    identifier: string
    text: string
    isCorrect: boolean
  }>
}

// XML Generator for Simplified Mixed Questions
const generateSimplifiedXML = (question: SimplifiedQuestion): string => {
  let responseDeclarations = ''
  let interactions = ''
  let interactionCount = 0

  // Add response declarations for inline text boxes
  if (question.textEntryBoxes && question.textEntryBoxes.length > 0) {
    question.textEntryBoxes.forEach((textBox, idx) => {
      const identifier = `inline_text_${idx + 1}`
      const expectedAnswer = question.correctAnswers?.[idx] || 'expected answer'
      
      responseDeclarations += `  <qti-response-declaration identifier="${identifier}" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>${expectedAnswer}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>\n\n`
    })
  }

  // Process each content block and extract interactions
  question.contentBlocks.forEach((block, index) => {
    if (block.type === 'text-entry') {
      // Handle new text entry block structure with multiple fields
      if (block.config?.textEntries && Array.isArray(block.config.textEntries)) {
        block.config.textEntries.forEach((entry: any, entryIndex: number) => {
          interactionCount++
          const identifier = `text_entry_${interactionCount}`
          
          responseDeclarations += `  <qti-response-declaration identifier="${identifier}" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>${entry.expectedAnswer || 'expected answer'}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>\n\n`

          interactions += `    <!-- Text Entry Field: ${entry.label} -->
    <div class="text-entry-field" data-label="${entry.label}" data-width="${entry.width}">
      <label>${entry.label}${entry.required ? ' *' : ''}</label>
      <qti-text-entry-interaction response-identifier="${identifier}"${entry.placeholder ? ` placeholder-text="${entry.placeholder}"` : ''}${entry.maxLength ? ` expected-length="${entry.maxLength}"` : ''} />
    </div>\n\n`
        })
      } else {
        // Fallback for old structure
        interactionCount++
        const identifier = `text_entry_${interactionCount}`
        const expectedText = block.config?.expectedText || 'expected answer'
        
        responseDeclarations += `  <qti-response-declaration identifier="${identifier}" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>${expectedText}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>\n\n`

        interactions += `    <qti-text-entry-interaction response-identifier="${identifier}"${block.config?.placeholder ? ` placeholder-text="${block.config.placeholder}"` : ''}${block.config?.maxLength ? ` expected-length="${block.config.maxLength}"` : ''} />\n\n`
      }
    } else if (block.type === 'multiple-choice') {
      interactionCount++
      const identifier = `choice_${interactionCount}`
      const options = block.config?.options || []
      const correctChoices = options.filter((opt: any) => opt.isCorrect)
      
      responseDeclarations += `  <qti-response-declaration identifier="${identifier}" cardinality="${block.config?.maxChoices > 1 ? 'multiple' : 'single'}" base-type="identifier">
    <qti-correct-response>
${correctChoices.map((choice: any) => `      <qti-value>${choice.identifier}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>\n\n`

      interactions += `    <qti-choice-interaction response-identifier="${identifier}" max-choices="${block.config?.maxChoices || 1}"${block.config?.shuffle ? ' shuffle="true"' : ''}>
${options.map((option: any) => `      <qti-simple-choice identifier="${option.identifier}">
        <p>${option.text}</p>
      </qti-simple-choice>`).join('\n')}
    </qti-choice-interaction>\n\n`
    
    } else if (block.type === 'hottext') {
      interactionCount++
      const identifier = `hottext_${interactionCount}`
      const hotspots = block.config?.hotspots || []
      const correctHotspots = hotspots.filter((spot: any) => spot.isCorrect)
      
      responseDeclarations += `  <qti-response-declaration identifier="${identifier}" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
${correctHotspots.map((spot: any) => `      <qti-value>${spot.identifier}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>\n\n`

      let processedContent = block.content
      hotspots.forEach((hotspot: any) => {
        const regex = new RegExp(`\\b${hotspot.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
        processedContent = processedContent.replace(regex, `<qti-hottext identifier="${hotspot.identifier}">${hotspot.text}</qti-hottext>`)
      })

      interactions += `    <qti-hottext-interaction response-identifier="${identifier}" max-choices="${correctHotspots.length}">
      <div>${processedContent}</div>
    </qti-hottext-interaction>\n\n`
    }
  })

  const renderContentBlocks = (blocks: ContentBlock[]): string => {
    return blocks.map(block => {
      const styleStr = Object.entries(block.styles)
        .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
        .join('; ')

      switch (block.type) {
        case 'text':
          return `      <div${styleStr ? ` style="${styleStr}"` : ''}>${block.content}</div>`
        case 'image':
          return `      <img src="${block.content}"${styleStr ? ` style="${styleStr}"` : ''} alt="${block.attributes?.alt || 'Image'}" />`
        case 'video':
          return `      <video src="${block.content}"${styleStr ? ` style="${styleStr}"` : ''} controls></video>`
        case 'audio':
          return `      <audio src="${block.content}"${styleStr ? ` style="${styleStr}"` : ''} controls></audio>`
        default:
          return `      <div${styleStr ? ` style="${styleStr}"` : ''}>${block.content}</div>`
      }
    }).join('\n')
  }

  const renderUnifiedContentBlocks = (blocks: UnifiedContentBlock[]): string => {
    return blocks.map(block => {
      const styleStr = Object.entries(block.styles)
        .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
        .join('; ')

      switch (block.type) {
        case 'text':
          // Handle inline text boxes for text blocks
          let processedContent = block.content
          if (question.textEntryBoxes && question.textEntryBoxes.length > 0) {
            question.textEntryBoxes.forEach((textBox, idx) => {
              const placeholder = `[${textBox.placeholder}]`
              const textEntryXML = `<qti-text-entry-interaction response-identifier="inline_text_${idx + 1}" placeholder-text="${textBox.placeholder}" expected-length="${textBox.maxLength || 100}" />`
              processedContent = processedContent.replace(placeholder, textEntryXML)
            })
          }
          return `      <div${styleStr ? ` style="${styleStr}"` : ''}>${processedContent}</div>`
        
        case 'text-entry':
          // Handle dedicated text entry blocks
          let entryBlockHTML = `      <div${styleStr ? ` style="${styleStr}"` : ''}>${block.content}</div>\n`
          if (block.config?.textEntries && Array.isArray(block.config.textEntries)) {
            const layoutClass = {
              horizontal: 'display: flex; flex-wrap: wrap; gap: 1rem;',
              grid: 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;',
              vertical: 'display: flex; flex-direction: column; gap: 1rem;'
            }[block.config.layout] || 'display: flex; flex-direction: column; gap: 1rem;'
            
            entryBlockHTML += `      <div style="${layoutClass}">\n`
            block.config.textEntries.forEach((entry: any, idx: number) => {
              const widthStyle = {
                small: 'width: 6rem;',
                medium: 'width: 12rem;',
                large: 'width: 16rem;',
                full: 'width: 100%;'
              }[entry.width] || 'width: 12rem;'
              
              entryBlockHTML += `        <div class="text-entry-field">
          <label style="display: block; font-weight: 500; margin-bottom: 0.25rem;">${entry.label}${entry.required ? ' *' : ''}</label>
          <qti-text-entry-interaction response-identifier="text_entry_${block.id}_${idx + 1}" placeholder-text="${entry.placeholder}" expected-length="${entry.maxLength}" style="${widthStyle}" />
        </div>\n`
            })
            entryBlockHTML += `      </div>`
          }
          return entryBlockHTML
        
        case 'multiple-choice':
        case 'hottext':
          return `      <div${styleStr ? ` style="${styleStr}"` : ''}>${block.content}</div>`
        case 'image':
          return `      <img src="${block.content}"${styleStr ? ` style="${styleStr}"` : ''} alt="${block.attributes?.alt || 'Image'}" />`
        case 'video':
          return `      <video src="${block.content}"${styleStr ? ` style="${styleStr}"` : ''} controls></video>`
        case 'audio':
          return `      <audio src="${block.content}"${styleStr ? ` style="${styleStr}"` : ''} controls></audio>`
        default:
          return `      <div${styleStr ? ` style="${styleStr}"` : ''}>${block.content}</div>`
      }
    }).join('\n')
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
                     identifier="${question.identifier}" 
                     title="${question.title}" 
                     adaptive="false" 
                     time-dependent="false">

${responseDeclarations}

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier">
  </qti-outcome-declaration>

  <qti-item-body>
${renderUnifiedContentBlocks(question.contentBlocks)}

${interactions}

  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/mixed_response.xml" />

  <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
    <qti-content-body>
${renderContentBlocks(question.correctFeedbackBlocks)}
    </qti-content-body>
  </qti-feedback-block>

  <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
    <qti-content-body>
${renderContentBlocks(question.incorrectFeedbackBlocks)}
    </qti-content-body>
  </qti-feedback-block>

</qti-assessment-item>`
}

// Unified Content Interface
interface UnifiedContentBlock {
  id: string
  type: 'text' | 'text-entry' | 'multiple-choice' | 'hottext' | 'image' | 'video' | 'audio'
  content: string
  styles: Record<string, any>
  attributes: Record<string, any>
  config?: any
}

interface SimplifiedQuestion {
  identifier: string
  title: string
  contentBlocks: UnifiedContentBlock[]
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
  textEntryBoxes?: TextEntryBox[]
  correctAnswers?: string[]
}

export default function MixedQuestionBuilder() {
  const [question, setQuestion] = useState<SimplifiedQuestion>({
    identifier: "mixed-question-1",
    title: "Mixed Question Example",
    contentBlocks: [
      {
        id: "block_1",
        type: "text",
        content: "<p><strong>Welcome to the unified question builder!</strong></p><p>You can add text, input boxes, multiple choice, hottext, images, and more all in this single block.</p>",
        styles: {
          fontSize: "18px",
          fontFamily: "Arial, sans-serif",
          color: "#2c3e50",
          backgroundColor: "#f8f9fa",
          padding: "16px",
          margin: "8px",
          borderRadius: "8px",
          textAlign: "left",
        },
        attributes: {},
      },
    ],
    correctFeedbackBlocks: [
      {
        id: "correct_feedback",
        type: "text",
        content: "<p><strong>Excellent work!</strong> You completed everything correctly.</p>",
        styles: { color: "#27ae60", backgroundColor: "#d5f4e6", padding: "12px", borderRadius: "6px" },
        attributes: {}
      }
    ],
    incorrectFeedbackBlocks: [
      {
        id: "incorrect_feedback",
        type: "text",
        content: "<p><strong>Try again!</strong> Review your answers and try once more.</p>",
        styles: { color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "12px", borderRadius: "6px" },
        attributes: {}
      }
    ],
    textEntryBoxes: [],
    correctAnswers: []
  })

  const [generatedXML, setGeneratedXML] = useState("")
  const [importXML, setImportXML] = useState("")
  const [isImportCollapsed, setIsImportCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState("content")

  // State for text box management and cursor tracking
  const [activeTextareaIndex, setActiveTextareaIndex] = useState<number | null>(null)
  const [cursorPosition, setCursorPosition] = useState<number | null>(null)
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])

  useEffect(() => {
    if (question.identifier && question.contentBlocks.length > 0) {
      const xml = generateSimplifiedXML(question)
      setGeneratedXML(xml)
    }
  }, [question])

  // Text Box Management Functions
  const handleInsertTextBox = (blockId: string, cursorPosition: number) => {
    console.log('handleInsertTextBox called with:', { blockId, cursorPosition })
    const blockIndex = question.contentBlocks.findIndex(block => block.id === blockId)
    if (blockIndex === -1) {
      console.log('Block not found for id:', blockId)
      return
    }

    const block = question.contentBlocks[blockIndex]
    const nextBoxNumber = (question.textEntryBoxes?.length || 0) + 1
    const placeholder = `[${nextBoxNumber}]`

    console.log('Inserting placeholder:', placeholder, 'at position:', cursorPosition)

    // Insert placeholder at cursor position
    const before = block.content.substring(0, cursorPosition)
    const after = block.content.substring(cursorPosition)
    const newContent = before + placeholder + after

    console.log('New content will be:', newContent)

    // Create new text entry box
    const newTextBox: TextEntryBox = {
      id: `textbox_${Date.now()}`,
      placeholder: nextBoxNumber.toString(),
      expectedText: "",
      caseSensitive: false,
      allowPartial: false,
      maxLength: 100,
      blockId: blockId,
    }

    console.log('Creating new text box:', newTextBox)

    // Update state
    setQuestion(prev => {
      const updated = {
        ...prev,
        contentBlocks: prev.contentBlocks.map((b, i) => 
          i === blockIndex ? { ...b, content: newContent } : b
        ),
        textEntryBoxes: [...(prev.textEntryBoxes || []), newTextBox],
        correctAnswers: [...(prev.correctAnswers || []), ""]
      }
      console.log('Updated question state:', updated)
      return updated
    })
  }

  const handleUpdateTextBox = (updatedBox: TextEntryBox) => {
    setQuestion(prev => ({
      ...prev,
      textEntryBoxes: (prev.textEntryBoxes || []).map(box => 
        box.id === updatedBox.id ? updatedBox : box
      )
    }))
  }

  const handleRemoveTextBox = (boxId: string) => {
    const boxToRemove = question.textEntryBoxes?.find(box => box.id === boxId)
    if (!boxToRemove) return

    const placeholder = `[${boxToRemove.placeholder}]`

    // Remove from content blocks
    const updatedBlocks = question.contentBlocks.map(block => ({
      ...block,
      content: block.content.replace(placeholder, ""),
    }))

    // Remove from state
    const boxIndex = question.textEntryBoxes?.findIndex(box => box.id === boxId) || -1
    const newTextBoxes = (question.textEntryBoxes || []).filter(box => box.id !== boxId)
    const newAnswers = [...(question.correctAnswers || [])]
    if (boxIndex !== -1) {
      newAnswers.splice(boxIndex, 1)
    }

    setQuestion(prev => ({
      ...prev,
      contentBlocks: updatedBlocks,
      textEntryBoxes: newTextBoxes,
      correctAnswers: newAnswers
    }))
  }

  const handleUpdateAnswer = (index: number, value: string) => {
    const newAnswers = [...(question.correctAnswers || [])]
    newAnswers[index] = value
    setQuestion(prev => ({
      ...prev,
      correctAnswers: newAnswers
    }))
  }

  // Add a new content element to the unified block
  const addContentElement = (type: UnifiedContentBlock['type']) => {
    const newBlock: UnifiedContentBlock = {
      id: `block_${Date.now()}`,
      type,
      content: getDefaultContent(type),
      styles: {
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#000000",
        margin: "8px",
        padding: "8px"
      },
      attributes: {},
      config: getDefaultConfig(type)
    }

    setQuestion(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock]
    }))
  }

  const getDefaultContent = (type: UnifiedContentBlock['type']): string => {
    switch (type) {
      case 'text':
        return '<p>Enter your text here...</p>'
      case 'text-entry':
        return '<p>Enter your question text above the text entry fields:</p>'
      case 'multiple-choice':
        return '<p>Multiple choice question:</p>'
      case 'hottext':
        return '<p>Click on the <strong>correct</strong> words in this text.</p>'
      case 'image':
        return 'https://via.placeholder.com/400x300'
      case 'video':
        return 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      case 'audio':
        return 'https://sample-audio.com/sample.mp3'
      default:
        return '<p>New content block</p>'
    }
  }

  const getDefaultConfig = (type: UnifiedContentBlock['type']): any => {
    switch (type) {
      case 'text-entry':
        return {
          textEntries: [
            {
              id: `entry_${Date.now()}`,
              label: 'Answer 1',
              expectedAnswer: 'expected answer',
              placeholder: 'Enter your answer...',
              maxLength: 100,
              width: 'medium',
              caseSensitive: false,
              allowPartial: false,
              required: true
            }
          ],
          allowMultipleAttempts: true,
          showCorrectAnswers: false,
          layout: 'vertical'
        }
      case 'multiple-choice':
        return {
          options: [
            { identifier: 'choice_A', text: 'Option A', isCorrect: true },
            { identifier: 'choice_B', text: 'Option B', isCorrect: false }
          ],
          maxChoices: 1,
          shuffle: false
        }
      case 'hottext':
        return {
          hotspots: [
            { identifier: 'hotspot_1', text: 'correct', isCorrect: true }
          ]
        }
      default:
        return {}
    }
  }

  const updateContentBlock = (id: string, updates: Partial<UnifiedContentBlock>) => {
    setQuestion(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      )
    }))
  }

  const removeContentBlock = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(block => block.id !== id)
    }))
  }

  const moveContentBlock = (id: string, direction: 'up' | 'down') => {
    const blocks = [...question.contentBlocks]
    const index = blocks.findIndex(b => b.id === id)
    
    if (index === -1) return
    
    if (direction === 'up' && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]]
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]]
    }

    setQuestion(prev => ({ ...prev, contentBlocks: blocks }))
  }

  const renderContentBlockEditor = (block: UnifiedContentBlock, blockIndex: number) => {
    // Handle text selection and cursor position for this specific block
    const handleTextSelection = () => {
      if (typeof window === 'undefined') return // Skip during SSR
      
      const textarea = textareaRefs.current[blockIndex]
      if (!textarea) {
        console.log('No textarea found for block index:', blockIndex)
        return
      }
      
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      console.log('Text selection changed:', { blockIndex, start, end })
      
      // Always set the active textarea index when user interacts with it
      setActiveTextareaIndex(blockIndex)
      setCursorPosition(start)
    }

    // Insert text box at cursor position for this block
    const handleInsertTextBoxForBlock = () => {
      const textarea = textareaRefs.current[blockIndex]
      console.log(textarea)
      if (!textarea) {
        alert('Please click in the text area first')
        return
      }
      
      // Get current cursor position from the textarea directly
      const currentCursorPosition = textarea.selectionStart || 0
      handleInsertTextBox(block.id, currentCursorPosition)
      
      // Update the cursor position state for consistency
      setCursorPosition(currentCursorPosition)
      setActiveTextareaIndex(blockIndex)
    }

    // Insert HTML tag at cursor position for this block
    const insertHtmlTag = (tag: string, extraAttrs = '', isSelfClosing = false) => {
      const textarea = textareaRefs.current[blockIndex]
      if (!textarea) {
        alert('Please click in the text area first')
        return
      }
      
      // Get current cursor position and selection
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const hasSelection = start !== end
      
      // Get text parts
      const beforeCursor = block.content.substring(0, start)
      const selectedOrEmpty = hasSelection ? block.content.substring(start, end) : ''
      const afterCursor = block.content.substring(end)
      
      // Create the HTML tag to insert
      let htmlToInsert = ''
      let newCursorPosition = start
      
      if (isSelfClosing) {
        // For self-closing tags like <br />, <hr />
        htmlToInsert = extraAttrs ? `<${tag} ${extraAttrs} />` : `<${tag} />`
        newCursorPosition = start + htmlToInsert.length
      } else if (hasSelection) {
        // If text is selected, wrap it
        htmlToInsert = extraAttrs 
          ? `<${tag} ${extraAttrs}>${selectedOrEmpty}</${tag}>`
          : `<${tag}>${selectedOrEmpty}</${tag}>`
        newCursorPosition = start + htmlToInsert.length
      } else {
        // If no selection, insert opening and closing tags
        htmlToInsert = extraAttrs 
          ? `<${tag} ${extraAttrs}></${tag}>`
          : `<${tag}></${tag}>`
        // Place cursor between the tags
        const openingTagLength = extraAttrs 
          ? `<${tag} ${extraAttrs}>`.length 
          : `<${tag}>`.length
        newCursorPosition = start + openingTagLength
      }
      
      // Create new content
      const newContent = beforeCursor + htmlToInsert + afterCursor
      
      // Update the block
      updateContentBlock(block.id, { content: newContent })
      
      // Focus and position cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      }, 50)
    }

    // Handle button suggestion insertion for this block
    const handleButtonSuggestion = (buttonHTML: string) => {
      const textarea = textareaRefs.current[blockIndex]
      if (!textarea) return

      const cursorPos = textarea.selectionStart || 0
      const before = block.content.substring(0, cursorPos)
      const after = block.content.substring(cursorPos)
      
      updateContentBlock(block.id, { content: before + buttonHTML + after })
      
      // Focus back to textarea and position cursor after inserted content
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = before.length + buttonHTML.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 50)
    }

    return (
      <Card key={block.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg capitalize">
              {block.type.replace('-', ' ')} Block
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveContentBlock(block.id, 'up')}
                disabled={question.contentBlocks.findIndex(b => b.id === block.id) === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveContentBlock(block.id, 'down')}
                disabled={question.contentBlocks.findIndex(b => b.id === block.id) === question.contentBlocks.length - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeContentBlock(block.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Editor with Enhanced Features */}
          <div>
            <Label>Content</Label>
            
            {/* Add Text Box Button */}
            {block.type === 'text' && (
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Button clicked for block:', block.id)
                    console.log('Current cursor position:', cursorPosition)
                    console.log('Active textarea index:', activeTextareaIndex)
                    handleInsertTextBoxForBlock()
                  }}
                  className="flex items-center gap-1"
                >
                  <TextCursorInput className="w-4 h-4" />
                  Add Text Box at Cursor
                </Button>
                <span className="text-xs text-gray-500">
                  Click in the text area to position cursor, then click this button
                </span>
              </div>
            )}

            {/* Enhanced Formatting Toolbar for text blocks */}
            {block.type === 'text' && (
              <div className="mb-2 space-y-2">
                {/* Text Formatting */}
                <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('strong')}
                    className="p-1 h-8 w-8"
                    title="Bold - Wrap selection or insert tags"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('em')}
                    className="p-1 h-8 w-8"
                    title="Italic - Wrap selection or insert tags"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('u')}
                    className="p-1 h-8 w-8"
                    title="Underline - Wrap selection or insert tags"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('mark', 'class="highlight"')}
                    className="px-2 py-1 text-xs"
                    title="Highlight - Wrap selection or insert tags"
                  >
                    Mark
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('span', 'style="color: red;"')}
                    className="px-2 py-1 text-xs"
                    title="Red Text - Wrap selection or insert tags"
                  >
                    Red
                  </Button>
                </div>

                {/* Structure Tags */}
                <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('h1')}
                    className="p-1 h-8 w-8"
                    title="Heading 1"
                  >
                    <Heading1 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('h2')}
                    className="p-1 h-8 w-8"
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('p')}
                    className="p-1 h-8 w-8"
                    title="Paragraph"
                  >
                    <Pilcrow className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('br', '', true)}
                    className="px-2 py-1 text-xs"
                    title="Line Break"
                  >
                    BR
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('ul')}
                    className="p-1 h-8 w-8"
                    title="Unordered List"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('ol')}
                    className="p-1 h-8 w-8"
                    title="Ordered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertHtmlTag('a', 'href="#"')}
                    className="p-1 h-8 w-8"
                    title="Link"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Content Editor - Use RichTextEditor for text blocks, Textarea for others */}
            {block.type === 'text' ? (
              <RichTextEditor
                value={block.content}
                onChange={(content) => updateContentBlock(block.id, { content })}
                placeholder={`Enter ${block.type} content...`}
                className="min-h-[120px]"
              />
            ) : (
              <Textarea
                ref={(el) => {
                  textareaRefs.current[blockIndex] = el
                }}
                value={block.content}
                onChange={(e) => updateContentBlock(block.id, { content: e.target.value })}
                onSelect={handleTextSelection}
                onFocus={() => setActiveTextareaIndex(blockIndex)}
                onClick={handleTextSelection}
                placeholder={`Enter ${block.type} content...`}
                rows={4}
              />
            )}
            
            {/* Button Suggestions for text blocks */}
            {block.type === 'text' && (
              <div className="mt-4">
                <ButtonSuggestions 
                  onSuggestionClick={(buttonHTML: string) => {
                    // For RichTextEditor, append the button HTML
                    updateContentBlock(block.id, { content: block.content + buttonHTML })
                  }}
                  size="sm"
                  defaultCollapsed={true}
                />
              </div>
            )}
            
            {block.type === 'text' && (
              <div className="text-xs text-gray-500 mt-3 bg-gray-50 px-3 py-2 rounded-lg border-l-4 border-gray-300">
                <strong>💡 Enhanced Text Block Features:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <strong>Rich Text Editor:</strong> Paste HTML directly or use formatting tools</li>
                  <li>• <strong>Inline Text Boxes:</strong> Click "Add Text Box at Cursor" to insert [1], [2], etc. anywhere</li>
                  <li>• <strong>Button Suggestions:</strong> Use styled buttons from the suggestions below</li>
                  <li>• <strong>HTML Support:</strong> Full HTML rendering with proper XML generation</li>
                </ul>
              </div>
            )}
            
            {block.type === 'text-entry' && (
              <div className="text-xs text-gray-500 mt-3 bg-blue-50 px-3 py-2 rounded-lg border-l-4 border-blue-300">
                <strong>📝 Text Entry Block Features:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <strong>Multiple Fields:</strong> Add as many text input fields as needed</li>
                  <li>• <strong>Layout Options:</strong> Vertical, Horizontal, or Grid layout</li>
                  <li>• <strong>Field Settings:</strong> Custom width, validation, and expected answers</li>
                  <li>• <strong>QTI XML:</strong> Generates proper QTI 3.0 text-entry-interaction elements</li>
                </ul>
              </div>
            )}
          </div>

          {/* Type-specific Configuration */}
          {block.type === 'text-entry' && (
            <div className="space-y-4 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Text Entry Block Configuration</Label>
                <Button
                  size="sm"
                  onClick={() => {
                    const textEntries = block.config?.textEntries || []
                    const newEntry = {
                      id: `entry_${Date.now()}`,
                      label: `Answer ${textEntries.length + 1}`,
                      expectedAnswer: '',
                      placeholder: 'Enter your answer...',
                      maxLength: 100,
                      width: 'medium',
                      caseSensitive: false,
                      allowPartial: false,
                      required: true
                    }
                    updateContentBlock(block.id, {
                      config: { 
                        ...block.config, 
                        textEntries: [...textEntries, newEntry] 
                      }
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Text Field
                </Button>
              </div>

              {/* Layout Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Layout</Label>
                  <Select
                    value={block.config?.layout || 'vertical'}
                    onValueChange={(value) => updateContentBlock(block.id, {
                      config: { ...block.config, layout: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Vertical</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={block.config?.showCorrectAnswers || false}
                      onCheckedChange={(checked) => updateContentBlock(block.id, {
                        config: { ...block.config, showCorrectAnswers: !!checked }
                      })}
                    />
                    Show Correct Answers
                  </label>
                </div>
              </div>

              {/* Text Entry Fields */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Text Entry Fields</Label>
                {(block.config?.textEntries || []).map((entry: any, index: number) => (
                  <div key={entry.id} className="border p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Field {index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const textEntries = (block.config?.textEntries || []).filter((_: any, idx: number) => idx !== index)
                          updateContentBlock(block.id, {
                            config: { ...block.config, textEntries }
                          })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Field Basic Settings */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={entry.label}
                          onChange={(e) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, label: e.target.value }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                          placeholder="Field label"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Expected Answer</Label>
                        <Input
                          value={entry.expectedAnswer}
                          onChange={(e) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, expectedAnswer: e.target.value }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                          placeholder="Correct answer"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    {/* Field Appearance Settings */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={entry.placeholder}
                          onChange={(e) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, placeholder: e.target.value }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                          placeholder="Placeholder text"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Length</Label>
                        <Input
                          type="number"
                          value={entry.maxLength}
                          onChange={(e) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, maxLength: parseInt(e.target.value) || 100 }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Select
                          value={entry.width}
                          onValueChange={(value) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, width: value }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="full">Full Width</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Field Validation Settings */}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={entry.caseSensitive}
                          onCheckedChange={(checked) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, caseSensitive: !!checked }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                        />
                        Case Sensitive
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={entry.allowPartial}
                          onCheckedChange={(checked) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, allowPartial: !!checked }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                        />
                        Allow Partial
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={entry.required}
                          onCheckedChange={(checked) => {
                            const textEntries = [...(block.config?.textEntries || [])]
                            textEntries[index] = { ...entry, required: !!checked }
                            updateContentBlock(block.id, {
                              config: { ...block.config, textEntries }
                            })
                          }}
                        />
                        Required
                      </label>
                    </div>
                  </div>
                ))}

                {/* Show message if no fields */}
                {(!block.config?.textEntries || block.config.textEntries.length === 0) && (
                  <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                    <p className="text-sm">No text entry fields added yet.</p>
                    <p className="text-xs">Click "Add Text Field" to create your first field.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text Box Management Section */}
          {block.type === 'text' && question.textEntryBoxes && question.textEntryBoxes.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm font-medium">Text Entry Boxes</Label>
              <div className="space-y-2">
                {question.textEntryBoxes.map((textBox, index) => (
                  <div key={textBox.id} className="border p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Text Box [{textBox.placeholder}]</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTextBox(textBox.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Expected Answer</Label>
                        <Input
                          value={question.correctAnswers?.[index] || ''}
                          onChange={(e) => handleUpdateAnswer(index, e.target.value)}
                          placeholder="Expected answer"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Length</Label>
                        <Input
                          type="number"
                          value={textBox.maxLength || 100}
                          onChange={(e) => handleUpdateTextBox({
                            ...textBox,
                            maxLength: parseInt(e.target.value) || 100
                          })}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={textBox.caseSensitive}
                          onCheckedChange={(checked) => handleUpdateTextBox({
                            ...textBox,
                            caseSensitive: !!checked
                          })}
                        />
                        Case Sensitive
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={textBox.allowPartial}
                          onCheckedChange={(checked) => handleUpdateTextBox({
                            ...textBox,
                            allowPartial: !!checked
                          })}
                        />
                        Allow Partial
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {block.type === 'multiple-choice' && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Multiple Choice Configuration</Label>
                <Button
                  size="sm"
                  onClick={() => {
                    const options = block.config?.options || []
                    const newOption = {
                      identifier: `choice_${String.fromCharCode(65 + options.length)}`,
                      text: `Option ${String.fromCharCode(65 + options.length)}`,
                      isCorrect: false
                    }
                    updateContentBlock(block.id, {
                      config: { ...block.config, options: [...options, newOption] }
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Max Choices</Label>
                  <Input
                    type="number"
                    min="1"
                    value={block.config?.maxChoices || 1}
                    onChange={(e) => updateContentBlock(block.id, {
                      config: { ...block.config, maxChoices: parseInt(e.target.value) || 1 }
                    })}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={block.config?.shuffle || false}
                      onCheckedChange={(checked) => updateContentBlock(block.id, {
                        config: { ...block.config, shuffle: !!checked }
                      })}
                    />
                    Shuffle Options
                  </label>
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-2">
                {(block.config?.options || []).map((option: any, index: number) => (
                  <div key={option.identifier} className="border p-2 rounded flex items-center gap-3">
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const options = [...(block.config?.options || [])]
                        options[index] = { ...option, text: e.target.value }
                        updateContentBlock(block.id, {
                          config: { ...block.config, options }
                        })
                      }}
                      placeholder="Option text"
                      className="flex-1"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={option.isCorrect}
                        onCheckedChange={(checked) => {
                          const options = [...(block.config?.options || [])]
                          options[index] = { ...option, isCorrect: !!checked }
                          updateContentBlock(block.id, {
                            config: { ...block.config, options }
                          })
                        }}
                      />
                      Correct
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const options = (block.config?.options || []).filter((_: any, idx: number) => idx !== index)
                        updateContentBlock(block.id, {
                          config: { ...block.config, options }
                        })
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {block.type === 'hottext' && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Hottext Configuration</Label>
                <Button
                  size="sm"
                  onClick={() => {
                    const hotspots = block.config?.hotspots || []
                    const newHotspot = {
                      identifier: `hotspot_${hotspots.length + 1}`,
                      text: 'word',
                      isCorrect: false
                    }
                    updateContentBlock(block.id, {
                      config: { ...block.config, hotspots: [...hotspots, newHotspot] }
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Hotspot
                </Button>
              </div>

              {/* Hotspots List */}
              <div className="space-y-2">
                {(block.config?.hotspots || []).map((hotspot: any, index: number) => (
                  <div key={hotspot.identifier} className="border p-2 rounded flex items-center gap-3">
                    <Input
                      value={hotspot.text}
                      onChange={(e) => {
                        const hotspots = [...(block.config?.hotspots || [])]
                        hotspots[index] = { ...hotspot, text: e.target.value }
                        updateContentBlock(block.id, {
                          config: { ...block.config, hotspots }
                        })
                      }}
                      placeholder="Word to make clickable"
                      className="flex-1"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={hotspot.isCorrect}
                        onCheckedChange={(checked) => {
                          const hotspots = [...(block.config?.hotspots || [])]
                          hotspots[index] = { ...hotspot, isCorrect: !!checked }
                          updateContentBlock(block.id, {
                            config: { ...block.config, hotspots }
                          })
                        }}
                      />
                      Correct
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const hotspots = (block.config?.hotspots || []).filter((_: any, idx: number) => idx !== index)
                        updateContentBlock(block.id, {
                          config: { ...block.config, hotspots }
                        })
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Style Configuration */}
          <div className="border-t pt-3">
            <Label className="text-sm font-medium mb-2 block">Styling</Label>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <Label className="text-xs">Font Size</Label>
                <Input
                  value={block.styles.fontSize || '16px'}
                  onChange={(e) => updateContentBlock(block.id, {
                    styles: { ...block.styles, fontSize: e.target.value }
                  })}
                  placeholder="16px"
                />
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={block.styles.color || '#000000'}
                  onChange={(e) => updateContentBlock(block.id, {
                    styles: { ...block.styles, color: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label className="text-xs">Background</Label>
                <Input
                  type="color"
                  value={block.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateContentBlock(block.id, {
                    styles: { ...block.styles, backgroundColor: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPreview = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        {question.contentBlocks.map((block, index) => {
          const style = {
            fontSize: block.styles.fontSize || '16px',
            color: block.styles.color || '#000000',
            backgroundColor: block.styles.backgroundColor || 'transparent',
            padding: block.styles.padding || '8px',
            margin: block.styles.margin || '4px 0',
            borderRadius: block.styles.borderRadius || '4px'
          }

          return (
            <div key={block.id} className="border p-4 rounded bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">
                {index + 1}. {block.type.replace('-', ' ').toUpperCase()}
                {block.type === 'text-entry' && block.config?.textEntries && ` (${block.config.textEntries.length} fields)`}
                {block.type === 'multiple-choice' && ` (${(block.config?.options || []).filter((opt: any) => opt.isCorrect).length} correct)`}
                {block.type === 'hottext' && ` (${(block.config?.hotspots || []).filter((spot: any) => spot.isCorrect).length} correct)`}
                {block.type === 'text' && question.textEntryBoxes && question.textEntryBoxes.length > 0 && ` (${question.textEntryBoxes.length} text boxes)`}
              </div>
              
              {block.type === 'text-entry' ? (
                <div>
                  <div style={style} dangerouslySetInnerHTML={{ __html: block.content }} />
                  {/* Render text entry fields based on layout */}
                  <div className={`mt-3 ${
                    block.config?.layout === 'horizontal' ? 'flex flex-wrap gap-4' :
                    block.config?.layout === 'grid' ? 'grid grid-cols-2 gap-3' :
                    'space-y-3'
                  }`}>
                    {(block.config?.textEntries || []).map((entry: any, fieldIndex: number) => {
                      const widthClass = {
                        small: 'w-24',
                        medium: 'w-48',
                        large: 'w-64',
                        full: 'w-full'
                      }[entry.width] || 'w-48'
                      
                      return (
                        <div key={entry.id} className={block.config?.layout === 'vertical' ? 'space-y-1' : ''}>
                          <label className="text-sm font-medium text-gray-700">
                            {entry.label} {entry.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={entry.placeholder}
                            maxLength={entry.maxLength}
                            className={`p-2 border rounded ${widthClass} ${block.config?.layout === 'horizontal' ? '' : 'block'}`}
                            disabled
                          />
                          {block.config?.showCorrectAnswers && entry.expectedAnswer && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Expected: "{entry.expectedAnswer}"
                              {entry.caseSensitive && " (case sensitive)"}
                              {entry.allowPartial && " (partial answers allowed)"}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Field summary */}
                  {block.config?.textEntries && block.config.textEntries.length > 0 && (
                    <div className="mt-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      <strong>Settings:</strong> Layout: {block.config?.layout || 'vertical'} | 
                      Show Correct Answers: {block.config?.showCorrectAnswers ? 'Yes' : 'No'} |
                      Fields: {block.config.textEntries.length}
                    </div>
                  )}
                </div>
              ) : block.type === 'text' ? (
                <div>
                  {/* Replace text box placeholders with actual input fields */}
                  <div 
                    style={style} 
                    dangerouslySetInnerHTML={{ 
                      __html: (question.textEntryBoxes || []).reduce((content: string, textBox, idx) => {
                        const placeholder = `[${textBox.placeholder}]`
                        const inputHTML = `<input type="text" placeholder="Enter answer for [${textBox.placeholder}]..." class="mx-1 px-2 py-1 border rounded text-sm" style="display: inline-block; min-width: 120px;" disabled />`
                        return content.replace(placeholder, inputHTML)
                      }, block.content)
                    }} 
                  />
                  {/* Show expected answers below */}
                  {question.textEntryBoxes && question.textEntryBoxes.length > 0 && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                      <strong>Expected Answers:</strong> {question.textEntryBoxes.map((box, idx) => 
                        `[${box.placeholder}]: "${question.correctAnswers?.[idx] || 'Not set'}"`
                      ).join(', ')}
                    </div>
                  )}
                </div>
              ) : block.type === 'multiple-choice' ? (
                <div>
                  <div style={style} dangerouslySetInnerHTML={{ __html: block.content }} />
                  <div className="mt-2 space-y-1">
                    {(block.config?.options || []).map((option: any) => (
                      <label key={option.identifier} className="flex items-center gap-2">
                        <input 
                          type={block.config?.maxChoices > 1 ? 'checkbox' : 'radio'} 
                          name={`preview_${block.id}`}
                          disabled 
                        />
                        <span>{option.text}</span>
                        {option.isCorrect && <span className="text-green-600 text-xs">(✓)</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ) : block.type === 'hottext' ? (
                <div>
                  <div 
                    style={style}
                    dangerouslySetInnerHTML={{ 
                      __html: (block.config?.hotspots || []).reduce((content: string, hotspot: any) => {
                        const regex = new RegExp(`\\b${hotspot.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
                        return content.replace(regex, `<span class="bg-blue-200 px-1 cursor-pointer" title="${hotspot.isCorrect ? 'Correct' : 'Incorrect'}">${hotspot.text}</span>`)
                      }, block.content)
                    }} 
                  />
                </div>
              ) : (
                <div style={style} dangerouslySetInnerHTML={{ __html: block.content }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced Mixed Question Builder
          </h1>
          <p className="text-gray-600 mt-2">
            Create sophisticated questions with embedded text, input boxes, multiple choice, hottext, and more - all with cursor-based insertion and rich text editing
          </p>
        </div>

        {/* Question Settings */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Question Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Question ID</Label>
              <Input
                value={question.identifier}
                onChange={(e) => setQuestion(prev => ({ ...prev, identifier: e.target.value }))}
                placeholder="unique-question-id"
              />
            </div>
            <div>
              <Label>Question Title</Label>
              <Input
                value={question.title}
                onChange={(e) => setQuestion(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Question Title"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vertical Tabs Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-6">
          {/* Left Sidebar - Vertical Tabs List */}
          <div className="w-64 flex-shrink-0">
            <TabsList className="grid w-full grid-rows-4 h-auto gap-2 bg-white/80 backdrop-blur-sm p-2">
              <TabsTrigger 
                value="content" 
                className="justify-start px-4 py-3 text-left data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                    📝
                  </div>
                  <div>
                    <div className="font-medium">Content Blocks</div>
                    <div className="text-xs text-gray-500">Add text, inputs, choices</div>
                  </div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="feedback" 
                className="justify-start px-4 py-3 text-left data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm font-medium">
                    💬
                  </div>
                  <div>
                    <div className="font-medium">Feedback</div>
                    <div className="text-xs text-gray-500">Correct & incorrect responses</div>
                  </div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="preview" 
                className="justify-start px-4 py-3 text-left data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-medium">
                    👁️
                  </div>
                  <div>
                    <div className="font-medium">Preview</div>
                    <div className="text-xs text-gray-500">Test your question</div>
                  </div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="xml" 
                className="justify-start px-4 py-3 text-left data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-medium">
                    🗂️
                  </div>
                  <div>
                    <div className="font-medium">XML Output</div>
                    <div className="text-xs text-gray-500">Generated QTI code</div>
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right Content Area */}
          <div className="flex-1">
            {/* Content Blocks Tab */}
            <TabsContent value="content" className="mt-0">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>Content Blocks</span>
                    <Select onValueChange={(value) => addContentElement(value as UnifiedContentBlock['type'])}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Add Content" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">📝 Text</SelectItem>
                        <SelectItem value="text-entry">✏️ Text Input</SelectItem>
                        <SelectItem value="multiple-choice">☑️ Multiple Choice</SelectItem>
                        <SelectItem value="hottext">🎯 Hottext</SelectItem>
                        <SelectItem value="image">🖼️ Image</SelectItem>
                        <SelectItem value="video">🎥 Video</SelectItem>
                        <SelectItem value="audio">🎵 Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.contentBlocks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <p className="text-lg mb-2">No content blocks yet</p>
                      <p className="text-sm">Select a content type above to get started</p>
                    </div>
                  ) : (
                    question.contentBlocks.map((block, index) => renderContentBlockEditor(block, index))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="mt-0">
              <div className="space-y-6">
                {/* Correct Feedback */}
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-700">Correct Answer Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContentBlockEditor
                      blocks={question.correctFeedbackBlocks}
                      onChange={(blocks) => setQuestion(prev => ({ ...prev, correctFeedbackBlocks: blocks }))}
                      title="Feedback for correct answers"
                    />
                  </CardContent>
                </Card>

                {/* Incorrect Feedback */}
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-red-700">Incorrect Answer Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContentBlockEditor
                      blocks={question.incorrectFeedbackBlocks}
                      onChange={(blocks) => setQuestion(prev => ({ ...prev, incorrectFeedbackBlocks: blocks }))}
                      title="Feedback for incorrect answers"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-0">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-700">Question Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPreview()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* XML Tab */}
            <TabsContent value="xml" className="mt-0">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-700">Generated QTI XML</CardTitle>
                </CardHeader>
                <CardContent>
                  <XMLViewer xml={generatedXML} filename="question.xml" />
                  
                  {/* Import XML Section */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Import Question</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportCollapsed(!isImportCollapsed)}
                      >
                        {isImportCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        {isImportCollapsed ? 'Show' : 'Hide'} Import
                      </Button>
                    </div>
                    
                    {!isImportCollapsed && (
                      <div className="space-y-3">
                        <Textarea
                          value={importXML}
                          onChange={(e) => setImportXML(e.target.value)}
                          placeholder="Paste QTI XML here to import..."
                          rows={8}
                          className="font-mono text-sm"
                        />
                        <Button 
                          onClick={() => {
                            // TODO: Implement XML import functionality
                            alert('XML import functionality will be implemented')
                          }}
                          disabled={!importXML.trim()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Import XML
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
