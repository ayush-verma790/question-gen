"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Eye, Upload, ChevronDown, ChevronUp } from "lucide-react"
import { ContentBlockEditor } from "@/components/content-block-editor"
import { XMLViewer } from "@/components/xml-viewer"
import { ButtonSuggestions } from "@/components/button-suggestions"
import type { ContentBlock } from "@/lib/types"

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
  promptBlocks: ContentBlock[]
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

// XML Generator for Mixed Questions
const generateMixedXML = (question: MixedQuestion): string => {
  const responseDeclarations = question.interactions.map(interaction => {
    switch (interaction.type) {
      case 'text-entry':
        const textConfig = interaction.config as TextEntryConfig
        return `  <qti-response-declaration identifier="${textConfig.identifier}" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value>${textConfig.expectedText}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>`

      case 'multiple-choice':
        const mcConfig = interaction.config as MultipleChoiceConfig
        const correctChoices = mcConfig.options.filter(opt => opt.isCorrect)
        return `  <qti-response-declaration identifier="${mcConfig.identifier}" cardinality="${mcConfig.maxChoices > 1 ? 'multiple' : 'single'}" base-type="identifier">
    <qti-correct-response>
${correctChoices.map(choice => `      <qti-value>${choice.identifier}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>`

      case 'hottext':
        const htConfig = interaction.config as HottextConfig
        const correctHotspots = htConfig.hotspots.filter(spot => spot.isCorrect)
        return `  <qti-response-declaration identifier="${htConfig.identifier}" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
${correctHotspots.map(spot => `      <qti-value>${spot.identifier}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>`

      case 'match':
        const matchConfig = interaction.config as MatchConfig
        return `  <qti-response-declaration identifier="${matchConfig.identifier}" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
${matchConfig.pairs.map(pair => `      <qti-value>${pair.leftId} ${pair.rightId}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>`

      case 'order':
        const orderConfig = interaction.config as OrderConfig
        const orderedOptions = [...orderConfig.options].sort((a, b) => a.correctOrder - b.correctOrder)
        return `  <qti-response-declaration identifier="${orderConfig.identifier}" cardinality="ordered" base-type="identifier">
    <qti-correct-response>
${orderedOptions.map(opt => `      <qti-value>${opt.identifier}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>`

      case 'gap-match':
        const gapConfig = interaction.config as GapMatchConfig
        const correctGaps = gapConfig.gapChoices.filter(choice => choice.isCorrect)
        return `  <qti-response-declaration identifier="${gapConfig.identifier}" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
${correctGaps.map((choice, index) => `      <qti-value>gap_${index + 1} ${choice.identifier}</qti-value>`).join('\n')}
    </qti-correct-response>
  </qti-response-declaration>`

      default:
        return ''
    }
  }).join('\n\n')

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

  const interactions = question.interactions
    .sort((a, b) => a.order - b.order)
    .map(interaction => {
      switch (interaction.type) {
        case 'text-entry':
          const textConfig = interaction.config as TextEntryConfig
          return `    <qti-text-entry-interaction response-identifier="${textConfig.identifier}"${textConfig.placeholder ? ` placeholder-text="${textConfig.placeholder}"` : ''}${textConfig.maxLength ? ` expected-length="${textConfig.maxLength}"` : ''} />`

        case 'multiple-choice':
          const mcConfig = interaction.config as MultipleChoiceConfig
          return `    <qti-choice-interaction response-identifier="${mcConfig.identifier}" max-choices="${mcConfig.maxChoices}"${mcConfig.shuffle ? ' shuffle="true"' : ''}>
${mcConfig.options.map(option => `      <qti-simple-choice identifier="${option.identifier}">
${renderContentBlocks(option.contentBlocks)}
      </qti-simple-choice>`).join('\n')}
    </qti-choice-interaction>`

        case 'hottext':
          const htConfig = interaction.config as HottextConfig
          const processHottextContent = (blocks: ContentBlock[]): string => {
            return blocks.map(block => {
              let content = block.content
              
              // Process each hotspot
              htConfig.hotspots.forEach(hotspot => {
                let searchText = hotspot.text
                let replaceText = `<qti-hottext identifier="${hotspot.identifier}">`
                
                // Handle different hotspot types
                if (hotspot.type === 'html' && hotspot.displayText) {
                  // For HTML type, use the display HTML inside qti-hottext
                  replaceText += hotspot.displayText
                } else if (hotspot.type === 'button' && hotspot.displayText) {
                  // For button type, use the button HTML inside qti-hottext
                  replaceText += hotspot.displayText
                } else {
                  // For text type, use plain text
                  replaceText += hotspot.text
                }
                
                replaceText += '</qti-hottext>'
                
                // Replace text with qti-hottext element
                // Use word boundaries for exact matches
                const regex = new RegExp(`\\b${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
                content = content.replace(regex, replaceText)
                
                // Also handle HTML matches for display content
                if (hotspot.displayText && hotspot.displayText !== hotspot.text) {
                  const htmlRegex = new RegExp(hotspot.displayText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
                  content = content.replace(htmlRegex, replaceText)
                }
              })
              
              const styleStr = Object.entries(block.styles)
                .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
                .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
                .join('; ')
              return `      <div${styleStr ? ` style="${styleStr}"` : ''}>${content}</div>`
            }).join('\n')
          }

          return `    <qti-hottext-interaction response-identifier="${htConfig.identifier}" max-choices="${htConfig.hotspots.filter(h => h.isCorrect).length}">
${processHottextContent(htConfig.contentBlocks)}
    </qti-hottext-interaction>`

        case 'match':
          const matchConfig = interaction.config as MatchConfig
          return `    <qti-match-interaction response-identifier="${matchConfig.identifier}" max-associations="${matchConfig.maxAssociations}"${matchConfig.shuffle ? ' shuffle="true"' : ''}>
      <qti-simple-match-set>
${matchConfig.pairs.map(pair => `        <qti-simple-associable-choice identifier="${pair.leftId}" match-max="${matchConfig.maxAssociations}">
${renderContentBlocks(pair.leftContentBlocks)}
        </qti-simple-associable-choice>`).join('\n')}
      </qti-simple-match-set>
      <qti-simple-match-set>
${matchConfig.pairs.map(pair => `        <qti-simple-associable-choice identifier="${pair.rightId}" match-max="${matchConfig.maxAssociations}">
${renderContentBlocks(pair.rightContentBlocks)}
        </qti-simple-associable-choice>`).join('\n')}
      </qti-simple-match-set>
    </qti-match-interaction>`

        case 'order':
          const orderConfig = interaction.config as OrderConfig
          return `    <qti-order-interaction response-identifier="${orderConfig.identifier}" orientation="${orderConfig.orientation}"${orderConfig.shuffle ? ' shuffle="true"' : ''}>
${orderConfig.options.map(option => `      <qti-simple-choice identifier="${option.identifier}">
${renderContentBlocks(option.contentBlocks)}
      </qti-simple-choice>`).join('\n')}
    </qti-order-interaction>`

        case 'gap-match':
          const gapConfig = interaction.config as GapMatchConfig
          const processGapText = (text: string): string => {
            return text.replace(/___/g, '<qti-gap identifier="gap_1" />')
          }
          return `    <qti-gap-match-interaction response-identifier="${gapConfig.identifier}">
      <qti-gap-text>
        <p>${processGapText(gapConfig.gapText)}</p>
      </qti-gap-text>
      <qti-simple-associable-choice-group>
${gapConfig.gapChoices.map(choice => `        <qti-simple-associable-choice identifier="${choice.identifier}" match-max="1">
          <span>${choice.text}</span>
        </qti-simple-associable-choice>`).join('\n')}
      </qti-simple-associable-choice-group>
    </qti-gap-match-interaction>`

        default:
          return ''
      }
    }).join('\n\n')

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
${renderContentBlocks(question.promptBlocks)}

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

export default function MixedQuestionBuilder() {
  const [question, setQuestion] = useState<MixedQuestion>({
    identifier: "mixed-question-1",
    title: "Mixed Question Example",
    promptBlocks: [
      {
        id: "prompt_1",
        type: "text",
        content: "<p><strong>Complete the following mixed question:</strong></p>",
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
    interactions: [
      {
        id: "interaction_1",
        type: "text-entry",
        order: 1,
        config: {
          identifier: "text_entry_1",
          expectedText: "example answer",
          caseSensitive: false,
          allowPartial: true,
          placeholder: "Enter your answer...",
          maxLength: 100
        } as TextEntryConfig
      },
      {
        id: "interaction_2",
        type: "multiple-choice",
        order: 2,
        config: {
          identifier: "choice_1",
          options: [
            {
              identifier: "choice_A",
              contentBlocks: [
                {
                  id: "choice_A_block",
                  type: "text",
                  content: "<p>Option A - Correct Answer</p>",
                  styles: { fontSize: "16px", color: "#000" },
                  attributes: {}
                }
              ],
              isCorrect: true
            },
            {
              identifier: "choice_B",
              contentBlocks: [
                {
                  id: "choice_B_block",
                  type: "text",
                  content: "<p>Option B - Incorrect Answer</p>",
                  styles: { fontSize: "16px", color: "#000" },
                  attributes: {}
                }
              ],
              isCorrect: false
            }
          ],
          maxChoices: 1,
          shuffle: false
        } as MultipleChoiceConfig
      },
      {
        id: "interaction_3",
        type: "hottext",
        order: 3,
        config: {
          identifier: "hottext_1",
          contentBlocks: [
            {
              id: "hottext_content",
              type: "text",
              content: "<p>Click on the <strong>correct</strong> words in this sentence to complete the task.</p>",
              styles: { fontSize: "16px", color: "#000" },
              attributes: {}
            }
          ],
          hotspots: [
            {
              identifier: "hotspot_1",
              text: "correct",
              type: "text",
              isCorrect: true
            },
            {
              identifier: "hotspot_2", 
              text: "words",
              type: "text",
              isCorrect: false
            }
          ]
        } as HottextConfig
      }
    ],
    correctFeedbackBlocks: [
      {
        id: "correct_feedback",
        type: "text",
        content: "<p><strong>Excellent work!</strong> You completed all parts correctly.</p>",
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
    ]
  })

  const [generatedXML, setGeneratedXML] = useState("")
  const [importXML, setImportXML] = useState("")
  const [isImportCollapsed, setIsImportCollapsed] = useState(true)

  useEffect(() => {
    if (question.identifier && question.interactions.length > 0) {
      const xml = generateMixedXML(question)
      setGeneratedXML(xml)
    }
  }, [question])

  const addInteraction = (type: MixedInteraction['type']) => {
    const newOrder = Math.max(...question.interactions.map(i => i.order), 0) + 1
    let config: any

    switch (type) {
      case 'text-entry':
        config = {
          identifier: `text_entry_${newOrder}`,
          expectedText: "Enter expected answer",
          caseSensitive: false,
          allowPartial: true,
          placeholder: "Enter your answer...",
          maxLength: 100
        } as TextEntryConfig
        break

      case 'multiple-choice':
        config = {
          identifier: `choice_${newOrder}`,
          options: [
            {
              identifier: "choice_A",
              contentBlocks: [
                {
                  id: `choice_A_${newOrder}`,
                  type: "text",
                  content: "<p>Option A</p>",
                  styles: { fontSize: "16px", color: "#000" },
                  attributes: {}
                }
              ],
              isCorrect: true
            }
          ],
          maxChoices: 1,
          shuffle: false
        } as MultipleChoiceConfig
        break

      case 'hottext':
        config = {
          identifier: `hottext_${newOrder}`,
          contentBlocks: [
            {
              id: `hottext_content_${newOrder}`,
              type: "text",
              content: "<p>Click on the <strong>correct</strong> words in this text.</p>",
              styles: { fontSize: "16px", color: "#000" },
              attributes: {}
            }
          ],
          hotspots: [
            {
              identifier: "hotspot_1",
              text: "correct",
              type: "text",
              isCorrect: true
            }
          ]
        } as HottextConfig
        break

      case 'match':
        config = {
          identifier: `match_${newOrder}`,
          pairs: [
            {
              leftId: "left_1",
              rightId: "right_1",
              leftContentBlocks: [
                {
                  id: `left_content_${newOrder}`,
                  type: "text",
                  content: "<p>Left Item 1</p>",
                  styles: { fontSize: "16px", color: "#000" },
                  attributes: {}
                }
              ],
              rightContentBlocks: [
                {
                  id: `right_content_${newOrder}`,
                  type: "text",
                  content: "<p>Right Item 1</p>",
                  styles: { fontSize: "16px", color: "#000" },
                  attributes: {}
                }
              ]
            }
          ],
          maxAssociations: 1,
          shuffle: false
        } as MatchConfig
        break

      case 'order':
        config = {
          identifier: `order_${newOrder}`,
          options: [
            {
              identifier: "option_1",
              contentBlocks: [
                {
                  id: `order_option_${newOrder}`,
                  type: "text",
                  content: "<p>First item</p>",
                  styles: { fontSize: "16px", color: "#000" },
                  attributes: {}
                }
              ]
            },
            {
              identifier: "option_2",
              contentBlocks: [
                {
                  id: `order_option_2_${newOrder}`,
                  type: "text",
                  content: "<p>Second item</p>",
                  styles: { fontSize: "16px", color: "#000" },
                  attributes: {}
                }
              ]
            }
          ],
          orientation: "vertical",
          shuffle: true
        } as OrderConfig
        break

      case 'gap-match':
        config = {
          identifier: `gap_${newOrder}`,
          gapText: "Fill in the ___ with the correct word.",
          gapChoices: [
            {
              identifier: "gap_choice_1",
              text: "answer"
            },
            {
              identifier: "gap_choice_2", 
              text: "wrong"
            }
          ]
        } as GapMatchConfig
        break

      default:
        return
    }

    const newInteraction: MixedInteraction = {
      id: `interaction_${Date.now()}`,
      type,
      order: newOrder,
      config
    }

    setQuestion(prev => ({
      ...prev,
      interactions: [...prev.interactions, newInteraction]
    }))
  }

  const removeInteraction = (id: string) => {
    setQuestion(prev => ({
      ...prev,
      interactions: prev.interactions.filter(i => i.id !== id)
    }))
  }

  const moveInteraction = (id: string, direction: 'up' | 'down') => {
    const interactions = [...question.interactions]
    const index = interactions.findIndex(i => i.id === id)
    
    if (index === -1) return
    
    if (direction === 'up' && index > 0) {
      [interactions[index], interactions[index - 1]] = [interactions[index - 1], interactions[index]]
    } else if (direction === 'down' && index < interactions.length - 1) {
      [interactions[index], interactions[index + 1]] = [interactions[index + 1], interactions[index]]
    }

    // Reorder the order values
    interactions.forEach((interaction, idx) => {
      interaction.order = idx + 1
    })

    setQuestion(prev => ({ ...prev, interactions }))
  }

  const updateInteractionConfig = (id: string, config: any) => {
    setQuestion(prev => ({
      ...prev,
      interactions: prev.interactions.map(i => 
        i.id === id ? { ...i, config } : i
      )
    }))
  }

  const renderInteractionEditor = (interaction: MixedInteraction) => {
    switch (interaction.type) {
      case 'text-entry':
        const textConfig = interaction.config as TextEntryConfig
        return (
          <div className="space-y-4">
            <div>
              <Label>Expected Answer</Label>
              <Input
                value={textConfig.expectedText}
                onChange={(e) => updateInteractionConfig(interaction.id, { 
                  ...textConfig, 
                  expectedText: e.target.value 
                })}
              />
            </div>
            <div>
              <Label>Placeholder Text</Label>
              <Input
                value={textConfig.placeholder || ''}
                onChange={(e) => updateInteractionConfig(interaction.id, { 
                  ...textConfig, 
                  placeholder: e.target.value 
                })}
                placeholder="Optional placeholder text"
              />
            </div>
            <div>
              <Label>Max Length</Label>
              <Input
                type="number"
                value={textConfig.maxLength || ''}
                onChange={(e) => updateInteractionConfig(interaction.id, { 
                  ...textConfig, 
                  maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Optional max length"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={textConfig.caseSensitive}
                  onCheckedChange={(checked) => updateInteractionConfig(interaction.id, { 
                    ...textConfig, 
                    caseSensitive: !!checked 
                  })}
                />
                Case Sensitive
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={textConfig.allowPartial}
                  onCheckedChange={(checked) => updateInteractionConfig(interaction.id, { 
                    ...textConfig, 
                    allowPartial: !!checked 
                  })}
                />
                Allow Partial Match
              </label>
            </div>
          </div>
        )

      case 'multiple-choice':
        const mcConfig = interaction.config as MultipleChoiceConfig
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Options</Label>
              <Button
                size="sm"
                onClick={() => {
                  const newOption = {
                    identifier: `choice_${String.fromCharCode(65 + mcConfig.options.length)}`,
                    contentBlocks: [
                      {
                        id: `choice_block_${Date.now()}`,
                        type: "text" as const,
                        content: "<p>New Option</p>",
                        styles: { fontSize: "16px", color: "#000" },
                        attributes: {}
                      }
                    ],
                    isCorrect: false
                  }
                  updateInteractionConfig(interaction.id, {
                    ...mcConfig,
                    options: [...mcConfig.options, newOption]
                  })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Choices</Label>
                <Input
                  type="number"
                  min="1"
                  value={mcConfig.maxChoices}
                  onChange={(e) => updateInteractionConfig(interaction.id, {
                    ...mcConfig,
                    maxChoices: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={mcConfig.shuffle}
                    onCheckedChange={(checked) => updateInteractionConfig(interaction.id, {
                      ...mcConfig,
                      shuffle: !!checked
                    })}
                  />
                  Shuffle Options
                </label>
              </div>
            </div>
            {mcConfig.options.map((option, index) => (
              <div key={option.identifier} className="border p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={option.isCorrect}
                      onCheckedChange={(checked) => {
                        const updatedOptions = mcConfig.options.map((opt, idx) =>
                          idx === index ? { ...opt, isCorrect: !!checked } : opt
                        )
                        updateInteractionConfig(interaction.id, {
                          ...mcConfig,
                          options: updatedOptions
                        })
                      }}
                    />
                    Correct Answer - {option.identifier}
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const updatedOptions = mcConfig.options.filter((_, idx) => idx !== index)
                      updateInteractionConfig(interaction.id, {
                        ...mcConfig,
                        options: updatedOptions
                      })
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <ContentBlockEditor
                  blocks={option.contentBlocks}
                  onChange={(blocks) => {
                    const updatedOptions = mcConfig.options.map((opt, idx) =>
                      idx === index ? { ...opt, contentBlocks: blocks } : opt
                    )
                    updateInteractionConfig(interaction.id, {
                      ...mcConfig,
                      options: updatedOptions
                    })
                  }}
                  title={`Option ${option.identifier} Content`}
                />
              </div>
            ))}
          </div>
        )

      case 'hottext':
        const htConfig = interaction.config as HottextConfig
        return (
          <div className="space-y-4">
            <ContentBlockEditor
              blocks={htConfig.contentBlocks}
              onChange={(blocks) => updateInteractionConfig(interaction.id, {
                ...htConfig,
                contentBlocks: blocks
              })}
              title="Hottext Content"
            />
            
            {/* Button Suggestions for Hotspots */}
            <div className="border rounded-lg p-4">
              <Label className="text-lg font-medium mb-3 block">Hotspot Content Suggestions</Label>
              <ButtonSuggestions
                onSuggestionClick={(buttonHTML) => {
                  // Extract button text and create new hotspot
                  const buttonTextMatch = buttonHTML.match(/>([^<]+)</);
                  const buttonText = buttonTextMatch ? buttonTextMatch[1] : 'Button';
                  
                  const newHotspot = {
                    identifier: `hotspot_${htConfig.hotspots.length + 1}`,
                    text: buttonText,
                    displayText: buttonHTML,
                    type: 'button' as const,
                    isCorrect: false
                  };
                  
                  updateInteractionConfig(interaction.id, {
                    ...htConfig,
                    hotspots: [...htConfig.hotspots, newHotspot]
                  });
                }}
                size="sm"
                showTitle={true}
                defaultCollapsed={false}
                className="mb-4"
              />
              
              {/* Custom Content Suggestions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Text Options:</Label>
                <div className="flex flex-wrap gap-2">
                  {['True', 'False', 'Yes', 'No', 'Correct', 'Wrong', 'A', 'B', 'C', 'D'].map((text) => (
                    <Button
                      key={text}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newHotspot = {
                          identifier: `hotspot_${htConfig.hotspots.length + 1}`,
                          text: text,
                          type: 'text' as const,
                          isCorrect: false
                        };
                        updateInteractionConfig(interaction.id, {
                          ...htConfig,
                          hotspots: [...htConfig.hotspots, newHotspot]
                        });
                      }}
                      className="text-xs"
                    >
                      + {text}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-3">
                  <Label className="text-sm font-medium">HTML Elements:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { label: 'Bold Text', html: '<strong>Bold</strong>' },
                      { label: 'Italic Text', html: '<em>Italic</em>' },
                      { label: 'Underline', html: '<u>Underline</u>' },
                      { label: 'Code', html: '<code>Code</code>' },
                      { label: 'Mark', html: '<mark>Highlight</mark>' }
                    ].map((item) => (
                      <Button
                        key={item.label}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const textMatch = item.html.match(/>([^<]+)</);
                          const text = textMatch ? textMatch[1] : item.label;
                          
                          const newHotspot = {
                            identifier: `hotspot_${htConfig.hotspots.length + 1}`,
                            text: text,
                            displayText: item.html,
                            type: 'html' as const,
                            isCorrect: false
                          };
                          updateInteractionConfig(interaction.id, {
                            ...htConfig,
                            hotspots: [...htConfig.hotspots, newHotspot]
                          });
                        }}
                        className="text-xs"
                        title={`Add ${item.label}`}
                      >
                        + {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Hotspots (clickable elements)</Label>
                <Button
                  size="sm"
                  onClick={() => {
                    const newHotspot = {
                      identifier: `hotspot_${htConfig.hotspots.length + 1}`,
                      text: "word",
                      type: 'text' as const,
                      isCorrect: false
                    }
                    updateInteractionConfig(interaction.id, {
                      ...htConfig,
                      hotspots: [...htConfig.hotspots, newHotspot]
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Hotspot
                </Button>
              </div>
              {htConfig.hotspots.map((hotspot, index) => (
                <div key={hotspot.identifier} className="border p-4 rounded mb-2">
                  <div className="space-y-3">
                    {/* Hotspot Type Selector */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium">Type:</Label>
                      <Select
                        value={hotspot.type || 'text'}
                        onValueChange={(value: 'text' | 'html' | 'button') => {
                          const updatedHotspots = htConfig.hotspots.map((h, idx) =>
                            idx === index ? { ...h, type: value } : h
                          )
                          updateInteractionConfig(interaction.id, {
                            ...htConfig,
                            hotspots: updatedHotspots
                          })
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Plain Text</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="button">Button</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Text Content */}
                    <div>
                      <Label className="text-sm">Text Content (for matching in content)</Label>
                      <Input
                        placeholder="Text to match in content"
                        value={hotspot.text}
                        onChange={(e) => {
                          const updatedHotspots = htConfig.hotspots.map((h, idx) =>
                            idx === index ? { ...h, text: e.target.value } : h
                          )
                          updateInteractionConfig(interaction.id, {
                            ...htConfig,
                            hotspots: updatedHotspots
                          })
                        }}
                      />
                    </div>

                    {/* Display Content (for HTML/Button types) */}
                    {(hotspot.type === 'html' || hotspot.type === 'button') && (
                      <div>
                        <Label className="text-sm">Display HTML (how it appears)</Label>
                        <Textarea
                          placeholder="HTML content for display"
                          value={hotspot.displayText || hotspot.text}
                          onChange={(e) => {
                            const updatedHotspots = htConfig.hotspots.map((h, idx) =>
                              idx === index ? { ...h, displayText: e.target.value } : h
                            )
                            updateInteractionConfig(interaction.id, {
                              ...htConfig,
                              hotspots: updatedHotspots
                            })
                          }}
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Preview */}
                    {hotspot.displayText && (
                      <div className="border-l-4 border-blue-200 bg-blue-50 p-3">
                        <Label className="text-sm text-blue-700">Preview:</Label>
                        <div 
                          className="mt-1"
                          dangerouslySetInnerHTML={{ __html: hotspot.displayText }} 
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={hotspot.isCorrect}
                          onCheckedChange={(checked) => {
                            const updatedHotspots = htConfig.hotspots.map((h, idx) =>
                              idx === index ? { ...h, isCorrect: !!checked } : h
                            )
                            updateInteractionConfig(interaction.id, {
                              ...htConfig,
                              hotspots: updatedHotspots
                            })
                          }}
                        />
                        <span className="text-sm">Correct Answer</span>
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const updatedHotspots = htConfig.hotspots.filter((_, idx) => idx !== index)
                          updateInteractionConfig(interaction.id, {
                            ...htConfig,
                            hotspots: updatedHotspots
                          })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'match':
        const matchConfig = interaction.config as MatchConfig
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Associations</Label>
                <Input
                  type="number"
                  min="1"
                  value={matchConfig.maxAssociations}
                  onChange={(e) => updateInteractionConfig(interaction.id, {
                    ...matchConfig,
                    maxAssociations: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={matchConfig.shuffle}
                    onCheckedChange={(checked) => updateInteractionConfig(interaction.id, {
                      ...matchConfig,
                      shuffle: !!checked
                    })}
                  />
                  Shuffle Pairs
                </label>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label>Match Pairs</Label>
              <Button
                size="sm"
                onClick={() => {
                  const newPairIndex = matchConfig.pairs.length + 1
                  const newPair = {
                    leftId: `left_${newPairIndex}`,
                    rightId: `right_${newPairIndex}`,
                    leftContentBlocks: [
                      {
                        id: `left_${Date.now()}`,
                        type: "text" as const,
                        content: `<p>Left Item ${newPairIndex}</p>`,
                        styles: { fontSize: "16px", color: "#000" },
                        attributes: {}
                      }
                    ],
                    rightContentBlocks: [
                      {
                        id: `right_${Date.now()}`,
                        type: "text" as const,
                        content: `<p>Right Item ${newPairIndex}</p>`,
                        styles: { fontSize: "16px", color: "#000" },
                        attributes: {}
                      }
                    ]
                  }
                  updateInteractionConfig(interaction.id, {
                    ...matchConfig,
                    pairs: [...matchConfig.pairs, newPair]
                  })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pair
              </Button>
            </div>
            {matchConfig.pairs.map((pair, index) => (
              <div key={`${pair.leftId}-${pair.rightId}`} className="border p-4 rounded">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg">Pair {index + 1}</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const updatedPairs = matchConfig.pairs.filter((_, idx) => idx !== index)
                      updateInteractionConfig(interaction.id, {
                        ...matchConfig,
                        pairs: updatedPairs
                      })
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Left Side</Label>
                    <ContentBlockEditor
                      blocks={pair.leftContentBlocks}
                      onChange={(blocks) => {
                        const updatedPairs = matchConfig.pairs.map((p, idx) =>
                          idx === index ? { ...p, leftContentBlocks: blocks } : p
                        )
                        updateInteractionConfig(interaction.id, {
                          ...matchConfig,
                          pairs: updatedPairs
                        })
                      }}
                      title={`Left Content - Pair ${index + 1}`}
                    />
                  </div>
                  <div>
                    <Label>Right Side</Label>
                    <ContentBlockEditor
                      blocks={pair.rightContentBlocks}
                      onChange={(blocks) => {
                        const updatedPairs = matchConfig.pairs.map((p, idx) =>
                          idx === index ? { ...p, rightContentBlocks: blocks } : p
                        )
                        updateInteractionConfig(interaction.id, {
                          ...matchConfig,
                          pairs: updatedPairs
                        })
                      }}
                      title={`Right Content - Pair ${index + 1}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'order':
        const orderConfig = interaction.config as OrderConfig
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Orientation</Label>
                <Select
                  value={orderConfig.orientation}
                  onValueChange={(value: "vertical" | "horizontal") => updateInteractionConfig(interaction.id, {
                    ...orderConfig,
                    orientation: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={orderConfig.shuffle}
                    onCheckedChange={(checked) => updateInteractionConfig(interaction.id, {
                      ...orderConfig,
                      shuffle: !!checked
                    })}
                  />
                  Shuffle Options
                </label>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label>Order Options</Label>
              <Button
                size="sm"
                onClick={() => {
                  const newOption = {
                    identifier: `option_${orderConfig.options.length + 1}`,
                    contentBlocks: [
                      {
                        id: `order_option_${Date.now()}`,
                        type: "text" as const,
                        content: `<p>Option ${orderConfig.options.length + 1}</p>`,
                        styles: { fontSize: "16px", color: "#000" },
                        attributes: {}
                      }
                    ]
                  }
                  updateInteractionConfig(interaction.id, {
                    ...orderConfig,
                    options: [...orderConfig.options, newOption]
                  })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
            {orderConfig.options.map((option, index) => (
              <div key={option.identifier} className="border p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <Label>Option {index + 1} - {option.identifier}</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const updatedOptions = orderConfig.options.filter((_, idx) => idx !== index)
                      updateInteractionConfig(interaction.id, {
                        ...orderConfig,
                        options: updatedOptions
                      })
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <ContentBlockEditor
                  blocks={option.contentBlocks}
                  onChange={(blocks) => {
                    const updatedOptions = orderConfig.options.map((opt, idx) =>
                      idx === index ? { ...opt, contentBlocks: blocks } : opt
                    )
                    updateInteractionConfig(interaction.id, {
                      ...orderConfig,
                      options: updatedOptions
                    })
                  }}
                  title={`Option ${option.identifier} Content`}
                />
              </div>
            ))}
          </div>
        )

      case 'gap-match':
        const gapConfig = interaction.config as GapMatchConfig
        return (
          <div className="space-y-4">
            <div>
              <Label>Gap Text (use ___ for gaps)</Label>
              <Textarea
                value={gapConfig.gapText}
                onChange={(e) => updateInteractionConfig(interaction.id, {
                  ...gapConfig,
                  gapText: e.target.value
                })}
                placeholder="Enter text with gaps marked as ___"
                className="min-h-20"
              />
            </div>
            <div className="flex justify-between items-center">
              <Label>Gap Choices</Label>
              <Button
                size="sm"
                onClick={() => {
                  const newChoice = {
                    identifier: `gap_choice_${gapConfig.gapChoices.length + 1}`,
                    text: `Choice ${gapConfig.gapChoices.length + 1}`
                  }
                  updateInteractionConfig(interaction.id, {
                    ...gapConfig,
                    gapChoices: [...gapConfig.gapChoices, newChoice]
                  })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Choice
              </Button>
            </div>
            {gapConfig.gapChoices.map((choice, index) => (
              <div key={choice.identifier} className="border p-3 rounded">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Choice text"
                    value={choice.text}
                    onChange={(e) => {
                      const updatedChoices = gapConfig.gapChoices.map((c, idx) =>
                        idx === index ? { ...c, text: e.target.value } : c
                      )
                      updateInteractionConfig(interaction.id, {
                        ...gapConfig,
                        gapChoices: updatedChoices
                      })
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const updatedChoices = gapConfig.gapChoices.filter((_, idx) => idx !== index)
                      updateInteractionConfig(interaction.id, {
                        ...gapConfig,
                        gapChoices: updatedChoices
                      })
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )

      default:
        return <div className="p-4 text-center text-gray-500">Editor for {interaction.type} interaction coming soon...</div>
    }
  }

  const renderPreview = () => {
    return (
      <div className="space-y-6">
        {/* Prompt */}
        <div className="mb-4">
          {question.promptBlocks.map(block => (
            <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content }} />
          ))}
        </div>

        {/* Interactions */}
        {question.interactions
          .sort((a, b) => a.order - b.order)
          .map((interaction, index) => (
          <div key={interaction.id} className="border p-4 rounded bg-gray-50">
            <h4 className="font-medium mb-2">
              {index + 1}. {interaction.type.replace('-', ' ').toUpperCase()} Interaction
            </h4>
            
            {interaction.type === 'text-entry' && (
              <input 
                type="text" 
                placeholder={(interaction.config as TextEntryConfig).placeholder}
                className="w-full p-2 border rounded"
                disabled
              />
            )}
            
            {interaction.type === 'multiple-choice' && (
              <div className="space-y-2">
                {(interaction.config as MultipleChoiceConfig).options.map(option => (
                  <label key={option.identifier} className="flex items-center gap-2">
                    <input type="checkbox" disabled />
                    <span dangerouslySetInnerHTML={{ __html: option.contentBlocks[0]?.content || '' }} />
                    {option.isCorrect && <span className="text-green-600 text-sm">(Correct)</span>}
                  </label>
                ))}
              </div>
            )}
            
            {interaction.type === 'hottext' && (
              <div>
                {(interaction.config as HottextConfig).contentBlocks.map(block => {
                  let content = block.content
                  ;(interaction.config as HottextConfig).hotspots.forEach(hotspot => {
                    content = content.replace(
                      new RegExp(`\\b${hotspot.text}\\b`, 'g'), 
                      `<mark class="cursor-pointer bg-yellow-200 ${hotspot.isCorrect ? 'border-green-500' : 'border-red-500'}">${hotspot.text}</mark>`
                    )
                  })
                  return <div key={block.id} dangerouslySetInnerHTML={{ __html: content }} />
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mixed Question Builder</h1>
          <p className="text-gray-600">Create comprehensive questions combining multiple interaction types</p>
        </div>

        {/* Main Layout - Single Column with Better Responsive Design */}
        <div className="space-y-6">
          
          {/* Import XML Section */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle 
                className="flex items-center justify-between cursor-pointer text-lg hover:text-blue-600 transition-colors"
                onClick={() => setIsImportCollapsed(!isImportCollapsed)}
              >
                <span>Import XML</span>
                {isImportCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
            {!isImportCollapsed && (
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Paste your mixed question XML here</Label>
                  <textarea
                    value={importXML}
                    onChange={(e) => setImportXML(e.target.value)}
                    placeholder="Paste your mixed question XML here..."
                    className="w-full h-32 p-3 mt-2 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Import XML
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Question Details */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Identifier</Label>
                  <Input
                    value={question.identifier}
                    onChange={(e) => setQuestion(prev => ({ ...prev, identifier: e.target.value }))}
                    placeholder="question_1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <Input
                    value={question.title}
                    onChange={(e) => setQuestion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Mixed Question Title"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Prompt */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Question Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <ContentBlockEditor
                blocks={question.promptBlocks}
                onChange={(blocks) => setQuestion(prev => ({ ...prev, promptBlocks: blocks }))}
                title=""
              />
            </CardContent>
          </Card>

          {/* Interactions */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Question Interactions</span>
                <Select onValueChange={(value) => addInteraction(value as MixedInteraction['type'])}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add Interaction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-entry">📝 Text Entry</SelectItem>
                    <SelectItem value="multiple-choice">☑️ Multiple Choice</SelectItem>
                    <SelectItem value="hottext">🎯 Hottext</SelectItem>
                    <SelectItem value="match">🔗 Match</SelectItem>
                    <SelectItem value="order">📋 Order</SelectItem>
                    <SelectItem value="gap-match">🔤 Gap Match</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {question.interactions.length === 0 ? (
                <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-lg font-medium">No interactions added yet</p>
                  <p className="text-sm">Select an interaction type above to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {question.interactions
                    .sort((a, b) => a.order - b.order)
                    .map((interaction, index) => (
                    <Card key={interaction.id} className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-sm font-semibold">
                              {interaction.order}
                            </div>
                            <div>
                              <Label className="font-semibold capitalize text-base">
                                {interaction.type.replace('-', ' ')} Interaction
                              </Label>
                              <p className="text-sm text-gray-500">
                                {interaction.config.identifier || `${interaction.type}_${interaction.order}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveInteraction(interaction.id, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveInteraction(interaction.id, 'down')}
                              disabled={index === question.interactions.length - 1}
                              className="h-8 w-8 p-0"
                            >
                              ↓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeInteraction(interaction.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {renderInteractionEditor(interaction)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Sections */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Feedback Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ContentBlockEditor
                blocks={question.correctFeedbackBlocks}
                onChange={(blocks) => setQuestion(prev => ({ ...prev, correctFeedbackBlocks: blocks }))}
                title="Correct Answer Feedback"
              />
              <ContentBlockEditor
                blocks={question.incorrectFeedbackBlocks}
                onChange={(blocks) => setQuestion(prev => ({ ...prev, incorrectFeedbackBlocks: blocks }))}
                title="Incorrect Answer Feedback"
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {question.interactions.length > 0 ? (
                <div className="bg-white p-4 rounded-lg border">
                  {renderPreview()}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Add interactions to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* XML Output */}
          {generatedXML && (
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Generated XML</CardTitle>
              </CardHeader>
              <CardContent>
                <XMLViewer xml={generatedXML} filename={`${question.identifier || "mixed-question"}.xml`} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
