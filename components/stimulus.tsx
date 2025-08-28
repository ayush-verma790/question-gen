"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  Palette,
  ImageIcon,
  Video,
  Music,
  Type,
  Strikethrough,
  Link,
  Table,
  Smile,
  Undo,
  Redo,
  Heading1,
  Heading2,
  FileText,
  Upload,
  Sparkles,
  Eraser,
  Quote,
  Code,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import  AdvancedColorPicker  from "../components/ui/colorpcker"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const [showImageStyler, setShowImageStyler] = useState(false)
  const [showTableStyler, setShowTableStyler] = useState(false)
  const [imageStyles, setImageStyles] = useState({
    width: "50%",
    height: "auto",
    textAlign: "left" as "left" | "center" | "right",
    display: "inline" as "inline" | "block" | "flex-row",
  })
  const [tableStyles, setTableStyles] = useState({
    borderColor: "#ccc",
    borderWidth: "1px",
    backgroundColor: "#f5f5f5",
    cellPadding: "8px",
  })
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)
  const [isA4Mode, setIsA4Mode] = useState(true)
  const [resizingImage, setResizingImage] = useState<HTMLImageElement | null>(null)
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })

  const commonEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👏",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "⭐",
    "🌟",
    "✨",
    "⚡",
    "💥",
    "💯",
    "🔥",
    "💪",
    "👑",
    "🎉",
  ]

  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      if (value) {
        editorRef.current.innerHTML = value
        setHtmlValue(value)
        setUndoStack([value])
      }
      setIsInitialized(true)
    }
  }, [value, isInitialized])

  useEffect(() => {
    if (editorRef.current && isInitialized && value !== htmlValue) {
      const selection = window.getSelection()
      const hadSelection = selection && selection.rangeCount > 0
      let savedRange: Range | null = null

      if (hadSelection) {
        savedRange = selection.getRangeAt(0).cloneRange()
      }

      editorRef.current.innerHTML = value
      setHtmlValue(value)

      if (savedRange && hadSelection) {
        setTimeout(() => {
          const newSelection = window.getSelection()
          if (newSelection) {
            try {
              newSelection.removeAllRanges()
              newSelection.addRange(savedRange)
            } catch (e) {
              // Selection restoration failed, ignore
            }
          }
        }, 0)
      }
    }
  }, [value, isInitialized])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      let newValue = editorRef.current.innerHTML

      // Clean the HTML to ensure proper formatting
      newValue = cleanPasteHTML(newValue)

      setHtmlValue(newValue)
      onChange(newValue)

      setUndoStack((prev) => [...prev.slice(-19), newValue])
      setRedoStack([])
    }
  }, [onChange])

  const insertHtmlAtCursor = useCallback(
    (html: string) => {
      if (!editorRef.current) return

      console.log("[v0] Inserting HTML at cursor, savedSelection:", !!savedSelection)

      editorRef.current.focus()
      const selection = window.getSelection()
      let range: Range | null = null

      // First priority: use saved selection (from when popover opened)
      if (savedSelection) {
        try {
          // Validate that the saved selection is still valid
          if (savedSelection.startContainer.isConnected && savedSelection.endContainer.isConnected) {
            range = savedSelection.cloneRange()
            selection?.removeAllRanges()
            selection?.addRange(range)
            console.log("[v0] Using saved selection")
          } else {
            throw new Error("Saved selection is invalid")
          }
        } catch (e) {
          console.log("[v0] Saved selection failed, falling back")
          range = null
        }
      }

      // Second priority: use current selection
      if (!range && selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
        console.log("[v0] Using current selection")
      }

      // Last resort: place at end of content, not beginning
      if (!range) {
        range = document.createRange()
        const lastChild = editorRef.current.lastChild
        if (lastChild) {
          if (lastChild.nodeType === Node.TEXT_NODE) {
            range.setStart(lastChild, lastChild.textContent?.length || 0)
            range.setEnd(lastChild, lastChild.textContent?.length || 0)
          } else {
            range.setStartAfter(lastChild)
            range.setEndAfter(lastChild)
          }
        } else {
          range.setStart(editorRef.current, 0)
          range.setEnd(editorRef.current, 0)
        }
        console.log("[v0] Created range at end of content")
      }

      if (range) {
        // Delete any selected content
        if (!range.collapsed) {
          range.deleteContents()
        }

        // Create and insert the HTML content
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = html

        // Insert each node from the HTML
        const nodes: Node[] = []
        while (tempDiv.firstChild) {
          const node = tempDiv.firstChild
          range.insertNode(node)
          nodes.push(node)
          range.setStartAfter(node)
          range.setEndAfter(node)
        }

        // Position cursor after inserted content
        if (nodes.length > 0) {
          range.setStartAfter(nodes[nodes.length - 1])
          range.setEndAfter(nodes[nodes.length - 1])
        }

        // Update selection
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }

      // Clear saved selection after use
      setSavedSelection(null)

      const newValue = editorRef.current.innerHTML
      setHtmlValue(newValue)
      onChange(newValue)
    },
    [onChange, savedSelection],
  )

  const insertTextAtCursor = useCallback(
    (text: string) => {
      if (!editorRef.current) return

      editorRef.current.focus()
      const selection = window.getSelection()

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(text))
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editorRef.current.appendChild(document.createTextNode(text))
      }

      const newValue = editorRef.current.innerHTML
      setHtmlValue(newValue)
      onChange(newValue)
    },
    [onChange],
  )

  const execCommand = useCallback(
    (command: string, value?: string) => {
      if (!editorRef.current) return

      editorRef.current.focus()


      try {
        if (["bold", "italic", "underline", "strikeThrough"].includes(command)) {
          document.execCommand(command, false, value)
        } else if (command === "formatBlock") {
          // For headings and paragraphs (h1-h6, p)
          document.execCommand("formatBlock", false, value)
        } else if (["justifyLeft", "justifyCenter", "justifyRight"].includes(command)) {
          document.execCommand(command, false, value)
        } else {
          console.log(`[v0] Using modern approach for command: ${command}`)
          return false
        }
      } catch (e) {
        console.log(`[v0] execCommand failed for ${command}`, e)
        return false
      }

      const newValue = editorRef.current.innerHTML
      setHtmlValue(newValue)
      onChange(newValue)
      return true
    },
    [onChange],
  )

  const formatText = useCallback(
    (command: string, value?: string) => {
      execCommand(command, value)
    },
    [execCommand],
  )

  const applyTextColor = useCallback(
    (color: string) => {
      if (!editorRef.current) return
      editorRef.current.focus()

      try {
        document.execCommand("styleWithCSS", false, "true")
        document.execCommand("foreColor", false, color)

        const newValue = editorRef.current.innerHTML
        setHtmlValue(newValue)
        onChange(newValue)
      } catch (e) {
        console.log("[v0] Text color application failed")
      }
    },
    [onChange],
  )

  const applyBackgroundColor = useCallback(
    (color: string) => {
      if (!editorRef.current) return
      editorRef.current.focus()

      try {
        document.execCommand("styleWithCSS", false, "true")
        document.execCommand("hiliteColor", false, color)

        const newValue = editorRef.current.innerHTML
        setHtmlValue(newValue)
        onChange(newValue)
      } catch (e) {
        console.log("[v0] Background color application failed")
      }
    },
    [onChange],
  )

  const applyFontFamily = useCallback(
    (fontFamily: string) => {
      if (!editorRef.current) return
      editorRef.current.focus()

      try {
        document.execCommand("styleWithCSS", false, "true")
        document.execCommand("fontName", false, fontFamily)

        const newValue = editorRef.current.innerHTML
        setHtmlValue(newValue)
        onChange(newValue)
      } catch (e) {
        console.log("[v0] Font family application failed")
      }
    },
    [onChange],
  )

  const applyFontSize = useCallback(
    (size: string) => {
      if (!editorRef.current) return
      editorRef.current.focus()

      try {
        document.execCommand("styleWithCSS", false, "true")
        document.execCommand("fontSize", false, size)

        const newValue = editorRef.current.innerHTML
        setHtmlValue(newValue)
        onChange(newValue)
      } catch (e) {
        console.log("[v0] Font size application failed")
      }
    },
    [onChange],
  )

  const applyTextShadow = useCallback(
    (shadow: string) => {
      if (!editorRef.current) return
      editorRef.current.focus()

      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        if (!range.collapsed) {
          const span = document.createElement("span")
          span.style.textShadow = shadow

          try {
            range.surroundContents(span)
            const newValue = editorRef.current.innerHTML
            setHtmlValue(newValue)
            onChange(newValue)
          } catch (e) {
            console.log("[v0] Text shadow application failed")
          }
        }
      }
    },
    [onChange],
  )

  const clearFormatting = useCallback(() => {
    if (!editorRef.current) return
    editorRef.current.focus()

    try {
      document.execCommand("removeFormat", false, "")
      const newValue = editorRef.current.innerHTML
      setHtmlValue(newValue)
      onChange(newValue)
    } catch (e) {
      console.log("[v0] Clear formatting failed")
    }
  }, [onChange])

  const handleUndo = useCallback(() => {
    if (undoStack.length > 1) {
      const currentState = undoStack[undoStack.length - 1]
      const previousState = undoStack[undoStack.length - 2]

      setRedoStack((prev) => [...prev, currentState])
      setUndoStack((prev) => prev.slice(0, -1))

      if (editorRef.current) {
        editorRef.current.innerHTML = previousState
        setHtmlValue(previousState)
        onChange(previousState)
      }
    }
  }, [undoStack, onChange])

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]

      setUndoStack((prev) => [...prev, nextState])
      setRedoStack((prev) => prev.slice(0, -1))

      if (editorRef.current) {
        editorRef.current.innerHTML = nextState
        setHtmlValue(nextState)
        onChange(nextState)
      }
    }
  }, [redoStack, undoStack, onChange])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()

      const items = Array.from(e.clipboardData.items)
      const text = e.clipboardData.getData("text/plain")
      const html = e.clipboardData.getData("text/html")

      const imageFile = items.find((item) => item.type.startsWith("image/"))
      if (imageFile) {
        const file = imageFile.getAsFile()
        if (file) {
          handleFileUpload(file)
          return
        }
      }

      if (html) {
        const cleanHtml = cleanPasteHTML(html)
        insertHtmlAtCursor(cleanHtml)
      } else if (text) {
        insertTextAtCursor(text)
      }
    },
    [insertHtmlAtCursor, insertTextAtCursor],
  )

  const cleanPasteHTML = (html: string): string => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html

    const scripts = tempDiv.querySelectorAll("script, object, embed, iframe")
    scripts.forEach((script) => script.remove())

    // Fix invalid nesting: remove p tags inside span elements
    const spans = tempDiv.querySelectorAll("span")
    spans.forEach((span) => {
      const pTags = span.querySelectorAll("p")
      pTags.forEach((p) => {
        // Replace p with span to maintain content but fix invalid nesting
        const newSpan = document.createElement("span")
        newSpan.innerHTML = p.innerHTML
        // Copy allowed attributes
        const style = p.getAttribute("style")
        if (style) newSpan.setAttribute("style", style)
        p.parentNode?.replaceChild(newSpan, p)
      })
    })

    // Convert all <br> to <br/> and fix self-closing tags
    const brTags = tempDiv.querySelectorAll("br")
    brTags.forEach((br) => {
      const selfClosingBr = document.createElement("br")
      br.parentNode?.replaceChild(selfClosingBr, br)
    })

    // Fix div nesting issues and remove unnecessary wrappers
    const divs = Array.from(tempDiv.querySelectorAll("div"))
    divs.forEach((div) => {
      // Remove empty divs with no content
      if (div.children.length === 0 && !div.textContent?.trim()) {
        div.remove()
        return
      }

      // Replace div containing only a single br with just the br
      if (div.children.length === 1 && div.children[0].tagName === "BR" && !div.textContent?.trim()) {
        div.parentNode?.replaceChild(div.children[0], div)
        return
      }

      // Replace div containing only a single span with just the span
      if (div.children.length === 1 && div.children[0].tagName === "SPAN" && !div.textContent?.trim()) {
        const span = div.children[0] as HTMLElement
        div.parentNode?.replaceChild(span, div)
        return
      }
    })

    // Ensure proper tag closure and structure
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ELEMENT, null)

    const allowedAttributes = ["style", "href", "src", "alt", "title", "width", "height"]
    const allowedTags = [
      "p",
      "div",
      "span",
      "strong",
      "em",
      "u",
      "b",
      "i",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "video",
      "audio",
      "table",
      "tr",
      "td",
      "th",
      "thead",
      "tbody",
    ]

    let node
    while ((node = walker.nextNode())) {
      const element = node as Element

      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        element.outerHTML = element.innerHTML
        continue
      }

      const attributes = Array.from(element.attributes)
      attributes.forEach((attr) => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name)
        }
      })
    }

    // Final cleanup: ensure all br tags are properly self-closing and fix any remaining issues
    let cleanedHTML = tempDiv.innerHTML
    cleanedHTML = cleanedHTML.replace(/<br\s*>/gi, "<br/>")
    cleanedHTML = cleanedHTML.replace(/<br\s+\/>/gi, "<br/>")

    // Fix any remaining unclosed tags by ensuring proper structure
    cleanedHTML = cleanedHTML.replace(/<div><br\/><\/div>/gi, "<br/>")
    cleanedHTML = cleanedHTML.replace(/<div>\s*<br\/>\s*<\/div>/gi, "<br/>")

    return cleanedHTML
  }

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:")
    if (url) {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
      insertHtmlAtCursor(linkHtml)
    }
  }, [insertHtmlAtCursor])

  const handleImageMouseDown = (e: React.MouseEvent, img: HTMLImageElement) => {
    if (e.target === img) {
      e.preventDefault()
      setResizingImage(img)
      setResizeStartPos({ x: e.clientX, y: e.clientY })
      setResizeStartSize({
        width: img.offsetWidth,
        height: img.offsetHeight,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (resizingImage) {
      const deltaX = e.clientX - resizeStartPos.x
      const deltaY = e.clientY - resizeStartPos.y

      const newWidth = Math.max(50, resizeStartSize.width + deltaX)
      const newHeight = Math.max(50, resizeStartSize.height + deltaY)

      resizingImage.style.width = `${newWidth}px`
      resizingImage.style.height = `${newHeight}px`
    }
  }

  const handleMouseUp = () => {
    setResizingImage(null)
  }

  useEffect(() => {
    if (resizingImage) {
      const handleMouseMove = (e: MouseEvent) => {
        if (resizingImage) {
          const deltaX = e.clientX - resizeStartPos.x
          const deltaY = e.clientY - resizeStartPos.y

          const newWidth = Math.max(50, resizeStartSize.width + deltaX)
          const newHeight = Math.max(50, resizeStartSize.height + deltaY)

          resizingImage.style.width = `${newWidth}px`
          resizingImage.style.height = `${newHeight}px`
        }
      }

      const handleMouseUp = () => {
        setResizingImage(null)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [resizingImage])

  const insertImage = useCallback(
    (src: string) => {
      if (editorRef.current) {
        const img = document.createElement("img")
        img.src = src
        img.alt = "Inserted image"
        img.style.maxWidth = "100%"
        img.style.height = "auto"
        img.style.cursor = "nw-resize"
        img.draggable = false

        if (imageStyles.display === "flex-row") {
          // Create or find existing flex container
          const selection = window.getSelection()
          let flexContainer: HTMLDivElement

          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const parentElement =
              range.commonAncestorContainer.nodeType === Node.TEXT_NODE
                ? range.commonAncestorContainer.parentElement
                : (range.commonAncestorContainer as Element)

            // Check if we're already in a flex container
            const existingFlexContainer = parentElement?.closest(".image-row-container") as HTMLDivElement

            if (existingFlexContainer) {
              flexContainer = existingFlexContainer
            } else {
              // Create new flex container
              flexContainer = document.createElement("div")
              flexContainer.className = "image-row-container"
              flexContainer.style.display = "flex"
              flexContainer.style.gap = "10px"
              flexContainer.style.alignItems = "flex-start"
              flexContainer.style.flexWrap = "wrap"
              flexContainer.style.margin = "10px 0"

              range.insertNode(flexContainer)
            }
          } else {
            // Fallback: create container at end
            flexContainer = document.createElement("div")
            flexContainer.className = "image-row-container"
            flexContainer.style.display = "flex"
            flexContainer.style.gap = "10px"
            flexContainer.style.alignItems = "flex-start"
            flexContainer.style.flexWrap = "wrap"
            flexContainer.style.margin = "10px 0"
            editorRef.current.appendChild(flexContainer)
          }

          // Style image for flex container
          img.style.display = "block"
          img.style.flexShrink = "0"
          img.style.width = imageStyles.width
          img.style.height = imageStyles.height

          flexContainer.appendChild(img)
        } else {
          // Original inline/block logic
          if (imageStyles.display === "inline") {
            img.style.display = "inline"
            img.style.verticalAlign = "middle"
          } else {
            img.style.display = "block"
          }
        }

        // Add resize functionality
        img.addEventListener("mousedown", (e) => {
          e.preventDefault()
          setResizingImage(img)
          setResizeStartPos({ x: e.clientX, y: e.clientY })
          setResizeStartSize({
            width: img.offsetWidth,
            height: img.offsetHeight,
          })
        })

        if (imageStyles.display !== "flex-row") {
          if (savedSelection) {
            try {
              const selection = window.getSelection()
              if (selection) {
                selection.removeAllRanges()
                selection.addRange(savedSelection)
                const range = savedSelection.cloneRange()
                range.deleteContents()
                range.insertNode(img)
                range.setStartAfter(img)
                range.setEndAfter(img)
                selection.removeAllRanges()
                selection.addRange(range)
              }
            } catch (e) {
              console.log("[v0] Error with saved selection, inserting at current position")
              const selection = window.getSelection()
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                range.insertNode(img)
                range.setStartAfter(img)
                range.setEndAfter(img)
                selection.removeAllRanges()
                selection.addRange(range)
              } else {
                editorRef.current.appendChild(img)
              }
            }
          } else {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              range.insertNode(img)
              range.setStartAfter(img)
              range.setEndAfter(img)
              selection.removeAllRanges()
              selection.addRange(range)
            } else {
              editorRef.current.appendChild(img)
            }
          }
        }

        // Clear saved selection after use
        setSavedSelection(null)

        const newValue = editorRef.current.innerHTML
        setHtmlValue(newValue)
        onChange(newValue)
      }
    },
    [savedSelection, onChange, imageStyles, resizingImage, resizeStartPos, resizeStartSize],
  )

  const insertVideo = useCallback(
    (url: string) => {
      if (url) {
        console.log("[v0] Inserting video:", url)
        const video = `<video src="${url}" controls style="max-width: 100%; height: auto; display: block; margin: 8px 0;" preload="metadata"></video>`
        insertHtmlAtCursor(video)
      }
    },
    [insertHtmlAtCursor],
  )

  const insertAudio = useCallback(
    (url: string) => {
      if (url) {
        console.log("[v0] Inserting audio:", url)
        const audio = `<audio src="${url}" controls style="display: block; margin: 8px 0; width: 100%; max-width: 400px;"></audio>`
        insertHtmlAtCursor(audio)
      }
    },
    [insertHtmlAtCursor],
  )

  const insertTable = useCallback(
    (rows: number, cols: number, customStyles?: any) => {
      console.log(`[v0] Inserting ${rows}x${cols} table with styling`)
      const styles = customStyles || tableStyles
      let tableHTML = `<table border="${styles.borderWidth}" style="border-collapse: collapse; width: 100%; margin: 8px 0; border: ${styles.borderWidth} solid ${styles.borderColor};">`

      for (let i = 0; i < rows; i++) {
        tableHTML += "<tr>"
        for (let j = 0; j < cols; j++) {
          if (i === 0) {
            tableHTML += `<th style="border: ${styles.borderWidth} solid ${styles.borderColor}; padding: ${styles.cellPadding}; background-color: ${styles.backgroundColor};">Header ${j + 1}</th>`
          } else {
            tableHTML += `<td style="border: ${styles.borderWidth} solid ${styles.borderColor}; padding: ${styles.cellPadding};">Cell ${i}-${j + 1}</td>`
          }
        }
        tableHTML += "</tr>"
      }

      tableHTML += "</table>"
      insertHtmlAtCursor(tableHTML)
    },
    [insertHtmlAtCursor, tableStyles],
  )

  const insertEmoji = useCallback(
    (emoji: string) => {
      insertTextAtCursor(emoji)
    },
    [insertTextAtCursor],
  )

  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const result = e.target?.result as string

        if (file.type.startsWith("image/")) {
          insertImage(result)
        } else if (file.type.startsWith("video/")) {
          insertVideo(result)
        } else if (file.type.startsWith("audio/")) {
          insertAudio(result)
        }
      }

      reader.readAsDataURL(file)
    },
    [insertAudio, insertImage, insertVideo],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      files.forEach((file) => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/")) {
          handleFileUpload(file)
        }
      })
    },
    [handleFileUpload],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault()
            formatText("bold")
            break
          case "i":
            e.preventDefault()
            formatText("italic")
            break
          case "u":
            e.preventDefault()
            formatText("underline")
            break
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
        }
      }
    },
    [formatText, handleUndo, handleRedo],
  )

  const handleToolbarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const handleEditorClick = useCallback(() => {
    // Don't clear saved selection immediately - let it be used for insertion first
    // setSavedSelection(null)
  }, [])

  const applyImageStyles = useCallback(() => {
    if (selectedElement && selectedElement.tagName === "IMG") {
      const img = selectedElement as HTMLImageElement
      img.style.width = imageStyles.width
      img.style.height = imageStyles.height

      if (imageStyles.display === "flex-row") {
        // Check if already in flex container
        const flexContainer = img.closest(".image-row-container")
        if (!flexContainer) {
          // Create new flex container and move image into it
          const newContainer = document.createElement("div")
          newContainer.className = "image-row-container"
          newContainer.style.display = "flex"
          newContainer.style.gap = "10px"
          newContainer.style.alignItems = "flex-start"
          newContainer.style.flexWrap = "wrap"
          newContainer.style.margin = "10px 0"

          img.parentNode?.insertBefore(newContainer, img)
          newContainer.appendChild(img)
        }
        img.style.display = "block"
        img.style.flexShrink = "0"
      } else if (imageStyles.display === "inline") {
        img.style.display = "inline"
        img.style.verticalAlign = "middle"
        // Remove from flex container if switching to inline
        const flexContainer = img.closest(".image-row-container")
        if (flexContainer) {
          flexContainer.parentNode?.insertBefore(img, flexContainer)
          if (flexContainer.children.length === 0) {
            flexContainer.remove()
          }
        }
      } else {
        img.style.display = "block"
        // Remove from flex container if switching to block
        const flexContainer = img.closest(".image-row-container")
        if (flexContainer) {
          flexContainer.parentNode?.insertBefore(img, flexContainer)
          if (flexContainer.children.length === 0) {
            flexContainer.remove()
          }
        }
        // Wrap in div for alignment if not already wrapped
        const parent = img.parentElement
        if (!parent || parent.tagName !== "DIV" || parent.children.length > 1) {
          const wrapper = document.createElement("div")
          wrapper.style.textAlign = imageStyles.textAlign
          img.parentNode?.insertBefore(wrapper, img)
          wrapper.appendChild(img)
        } else {
          parent.style.textAlign = imageStyles.textAlign
        }
      }

      // Update the HTML value
      if (editorRef.current) {
        const newValue = editorRef.current.innerHTML
        setHtmlValue(newValue)
        onChange(newValue)
      }
    }
  }, [selectedElement, imageStyles, onChange])

  const handlePopoverOpen = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange()
      setSavedSelection(range)
      console.log("[v0] Saved selection for popover")
    } else {
      // If no selection, create one at the end of content
      if (editorRef.current) {
        const range = document.createRange()
        const lastChild = editorRef.current.lastChild
        if (lastChild) {
          if (lastChild.nodeType === Node.TEXT_NODE) {
            range.setStart(lastChild, lastChild.textContent?.length || 0)
            range.setEnd(lastChild, lastChild.textContent?.length || 0)
          } else {
            range.setStartAfter(lastChild)
            range.setEndAfter(lastChild)
          }
        } else {
          range.setStart(editorRef.current, 0)
          range.setEnd(editorRef.current, 0)
        }
        setSavedSelection(range)
        console.log("[v0] Created and saved selection at end of content")
      }
    }
  }, [])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  const applyTableStyles = useCallback(() => {
    if (selectedElement && selectedElement.tagName === "TABLE") {
      const table = selectedElement as HTMLTableElement
      table.style.border = `${tableStyles.borderWidth} solid ${tableStyles.borderColor}`

      // Apply styles to header cells
      const headerCells = table.querySelectorAll("th")
      headerCells.forEach((th) => {
        th.style.border = `${tableStyles.borderWidth} solid ${tableStyles.borderColor}`
        th.style.padding = tableStyles.cellPadding
        th.style.backgroundColor = tableStyles.backgroundColor
      })

      // Apply styles to data cells
      const dataCells = table.querySelectorAll("td")
      dataCells.forEach((td) => {
        td.style.border = `${tableStyles.borderWidth} solid ${tableStyles.borderColor}`
        td.style.padding = tableStyles.cellPadding
      })

      // Update the HTML value
      if (editorRef.current) {
        const newValue = editorRef.current.innerHTML
        setHtmlValue(newValue)
        onChange(newValue)
      }
    }
  }, [selectedElement, tableStyles, onChange])

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(handleFileUpload)
          e.target.value = ""
        }}
      />

      <header className="sticky top-0 z-20 bg-white/90 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-1 flex-wrap p-3 bg-gray-50/50">
        <Button
          variant={isA4Mode ? "default" : "outline"}
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => setIsA4Mode(!isA4Mode)}
          title="A4 Page Mode"
        >
          📄
        </Button>

        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={handleUndo}
          disabled={undoStack.length <= 1}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Headings">
              <Heading1 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => formatText("formatBlock", "h1")}> <Heading1 className="w-4 h-4 mr-2" /> Heading 1 </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => formatText("formatBlock", "h2")}> <Heading2 className="w-4 h-4 mr-2" /> Heading 2 </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => formatText("formatBlock", "h3")}> <FileText className="w-4 h-4 mr-2" /> Heading 3 </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => formatText("formatBlock", "h4")}> <span className="w-4 h-4 mr-2 font-bold">H4</span> Heading 4 </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => formatText("formatBlock", "h5")}> <span className="w-4 h-4 mr-2 font-bold">H5</span> Heading 5 </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => formatText("formatBlock", "h6")}> <span className="w-4 h-4 mr-2 font-bold">H6</span> Heading 6 </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => formatText("formatBlock", "p")}> <Type className="w-4 h-4 mr-2" /> Normal Text </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Alignment Buttons */}
        <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} onClick={() => formatText("justifyLeft")} title="Align Left">
          <span className="w-4 h-4 mr-1">L</span>
        </Button>
        <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} onClick={() => formatText("justifyCenter")} title="Align Center">
          <span className="w-4 h-4 mr-1">C</span>
        </Button>
        <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} onClick={() => formatText("justifyRight")} title="Align Right">
          <span className="w-4 h-4 mr-1">R</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => formatText("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => formatText("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => formatText("underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => formatText("strikeThrough")}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={insertLink}
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </Button>

        <Popover onOpenChange={(open) => open && handlePopoverOpen()}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Insert Image">
              <ImageIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Insert Image</Label>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && imageUrl) {
                          console.log("[v0] Inserting image via Enter key:", imageUrl)
                          insertImage(imageUrl)
                          setImageUrl("")
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (imageUrl) {
                          insertImage(imageUrl)
                          setImageUrl("")
                        }
                      }}
                      disabled={!imageUrl}
                    >
                      Insert
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-xs font-medium">Image Styling</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label className="text-xs">Size</Label>
                      <div className="flex gap-2">
                        <Select
                          value={imageStyles.width}
                          onValueChange={(value) => setImageStyles((prev) => ({ ...prev, width: value }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25%">25%</SelectItem>
                            <SelectItem value="50%">50%</SelectItem>
                            <SelectItem value="75%">75%</SelectItem>
                            <SelectItem value="100%">100%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <div className="flex gap-2">
                        <Select
                          value={imageStyles.height}
                          onValueChange={(value) => setImageStyles((prev) => ({ ...prev, height: value }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="25%">25%</SelectItem>
                            <SelectItem value="50%">50%</SelectItem>
                            <SelectItem value="75%">75%</SelectItem>
                            <SelectItem value="100%">100%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-xs">Position</Label>
                      <Select
                        value={imageStyles.display}
                        onValueChange={(value: "inline" | "block" | "flex-row") =>
                          setImageStyles((prev) => ({ ...prev, display: value }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inline">Inline (at cursor)</SelectItem>
                          <SelectItem value="block">Block (new line)</SelectItem>
                          <SelectItem value="flex-row">Row Layout (side by side)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {imageStyles.display === "block" && (
                      <div>
                        <Label className="text-xs">Alignment</Label>
                        <Select
                          value={imageStyles.textAlign}
                          onValueChange={(value: "left" | "center" | "right") =>
                            setImageStyles((prev) => ({ ...prev, textAlign: value }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover onOpenChange={(open) => open && handlePopoverOpen()}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Insert Video">
              <Video className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Insert Video</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Enter video URL"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const url = (e.target as HTMLInputElement).value
                      if (url) {
                        insertVideo(url)
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                />
                <div className="text-center text-sm text-gray-500">or</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "video/*"
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Insert Audio">
              <Music className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Insert Audio</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Enter audio URL"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const url = (e.target as HTMLInputElement).value
                      if (url) {
                        insertAudio(url)
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                />
                <div className="text-center text-sm text-gray-500">or</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "audio/*"
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover onOpenChange={(open) => open && handlePopoverOpen()}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Insert Table">
              <Table className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Insert Table</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Rows</Label>
                  <Select value={tableRows.toString()} onValueChange={(value) => setTableRows(Number.parseInt(value))}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Columns</Label>
                  <Select value={tableCols.toString()} onValueChange={(value) => setTableCols(Number.parseInt(value))}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-3">
                <Label className="text-xs font-medium">Table Styling</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs">Border Color</Label>
                    <AdvancedColorPicker
                      color={tableStyles.borderColor}
                      onChange={(color) => setTableStyles((prev) => ({ ...prev, borderColor: color }))}
                      label=""
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Header Background</Label>
                    <AdvancedColorPicker
                      color={tableStyles.backgroundColor}
                      onChange={(color) => setTableStyles((prev) => ({ ...prev, backgroundColor: color }))}
                      label=""
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Border Width</Label>
                    <div className="flex gap-1">
                      <Select
                        value={tableStyles.borderWidth}
                        onValueChange={(value) => setTableStyles((prev) => ({ ...prev, borderWidth: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1px">1px</SelectItem>
                          <SelectItem value="2px">2px</SelectItem>
                          <SelectItem value="3px">3px</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="px"
                        className="h-8 text-xs w-16"
                        onChange={(e) => setTableStyles((prev) => ({ ...prev, borderWidth: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Cell Padding</Label>
                    <div className="flex gap-1">
                      <Select
                        value={tableStyles.cellPadding}
                        onValueChange={(value) => setTableStyles((prev) => ({ ...prev, cellPadding: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4px">Small</SelectItem>
                          <SelectItem value="8px">Medium</SelectItem>
                          <SelectItem value="12px">Large</SelectItem>
                          <SelectItem value="16px">X-Large</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="px"
                        className="h-8 text-xs w-16"
                        onChange={(e) => setTableStyles((prev) => ({ ...prev, cellPadding: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={() => insertTable(tableRows, tableCols)} className="w-full" size="sm">
                Insert Table ({tableRows}×{tableCols})
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover onOpenChange={(open) => open && handlePopoverOpen()}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Insert Emoji">
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Insert Emoji</Label>
              <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                {commonEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => formatText("formatBlock", "blockquote")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => formatText("formatBlock", "pre")}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Text Color">
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Text Color</Label>
                <div className="mt-2">
                  <AdvancedColorPicker color="#000000" onChange={applyTextColor} label="Text Color" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Background Color</Label>
                <div className="mt-2">
                  <AdvancedColorPicker color="transparent" onChange={applyBackgroundColor} label="Background Color" />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Font Styling">
              <Type className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Font Family</Label>
                <Select onValueChange={applyFontFamily}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                    <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="'Comic Sans MS', cursive">Comic Sans MS</SelectItem>
                    <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                    <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Font Size</Label>
                <div className="flex gap-2 mt-2">
                  <Select onValueChange={applyFontSize}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">8px</SelectItem>
                      <SelectItem value="2">10px</SelectItem>
                      <SelectItem value="3">12px</SelectItem>
                      <SelectItem value="4">14px</SelectItem>
                      <SelectItem value="5">18px</SelectItem>
                      <SelectItem value="6">24px</SelectItem>
                      <SelectItem value="7">36px</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Custom"
                    className="w-20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const size = (e.target as HTMLInputElement).value
                        if (size) {
                          applyFontSize(size.replace("px", ""))
                          ;(e.target as HTMLInputElement).value = ""
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onMouseDown={handleToolbarMouseDown} title="Text Effects">
              <Sparkles className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Text Shadow</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => applyTextShadow("2px 2px 4px rgba(0,0,0,0.3)")}>
                    Soft Shadow
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTextShadow("1px 1px 2px rgba(0,0,0,0.8)")}>
                    Hard Shadow
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTextShadow("0 0 10px rgba(255,255,255,0.8)")}>
                    Glow
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTextShadow("none")}>
                    No Shadow
                  </Button>
                </div>

                <div className="mt-3">
                  <Label className="text-xs text-gray-600">Custom Shadow</Label>
                  <Input
                    placeholder="e.g., 2px 2px 4px #ff0000"
                    className="mt-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const shadow = (e.target as HTMLInputElement).value
                        if (shadow) {
                          applyTextShadow(shadow)
                          ;(e.target as HTMLInputElement).value = ""
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={clearFormatting}
          title="Clear Formatting"
        >
          <Eraser className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant={isHtmlMode ? "default" : "outline"}
          size="sm"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => setIsHtmlMode(!isHtmlMode)}
          title="Toggle HTML Mode"
        >
          {isHtmlMode ? "Visual" : "HTML"}
        </Button>
        </div>
      </header>

      {isHtmlMode ? (
        <Textarea
          value={htmlValue}
          onChange={(e) => {
            setHtmlValue(e.target.value)
            onChange(e.target.value)
          }}
          className="w-full min-h-72 p-4 border rounded-lg resize-y font-mono text-sm"
          placeholder="Edit HTML directly..."
        />
      ) : (
        <div className={`${isA4Mode ? "bg-gray-100 p-8" : ""}`}> 
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleEditorClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`$
              isA4Mode
                ? "w-[210mm] h-[297mm] mx-auto bg-white shadow-lg p-[25.4mm] border"
                : "min-h-72 p-4 border rounded-lg bg-white"
            } resize-y overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDragOver ? "border-blue-500 bg-blue-50" : ""
            }`}
            style={{
              minHeight: isA4Mode ? "297mm" : "200px",
              fontFamily: "Times New Roman, serif",
              fontSize: "12pt",
              lineHeight: "1.5",
            }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
          />
        </div>
      )}

      {showImageStyler && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white border rounded-lg shadow-lg z-10 min-w-80">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="text"
                value={imageStyles.width}
                onChange={(e) => setImageStyles((prev) => ({ ...prev, width: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="e.g., 50%, 200px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <select
                value={imageStyles.display}
                onChange={(e) =>
                  setImageStyles((prev) => ({ ...prev, display: e.target.value as "inline" | "block" | "flex-row" }))
                }
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="inline">Inline (at cursor)</option>
                <option value="block">Block (new line)</option>
                <option value="flex-row">Row Layout (side by side)</option>
              </select>
            </div>

            {imageStyles.display === "block" && (
              <div>
                <label className="block text-sm font-medium mb-1">Alignment</label>
                <select
                  value={imageStyles.textAlign}
                  onChange={(e) =>
                    setImageStyles((prev) => ({ ...prev, textAlign: e.target.value as "left" | "center" | "right" }))
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowImageStyler(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTableStyler && selectedElement && (
        <div className="fixed top-4 right-4 bg-white border rounded-lg shadow-lg p-4 z-50 w-80">
          <div className="flex items-center justify-between mb-3">
            <Label className="font-medium">Table Styling</Label>
            <Button variant="ghost" size="sm" onClick={() => setShowTableStyler(false)}>
              ×
            </Button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Border Color</Label>
                <AdvancedColorPicker
                  color={tableStyles.borderColor}
                  onChange={(color) => setTableStyles((prev) => ({ ...prev, borderColor: color }))}
                  label=""
                />
              </div>
              <div>
                <Label className="text-xs">Header Background</Label>
                <AdvancedColorPicker
                  color={tableStyles.backgroundColor}
                  onChange={(color) => setTableStyles((prev) => ({ ...prev, backgroundColor: color }))}
                  label=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Border Width</Label>
                <div className="flex gap-1">
                  <Select
                    value={tableStyles.borderWidth}
                    onValueChange={(value) => setTableStyles((prev) => ({ ...prev, borderWidth: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1px">1px</SelectItem>
                      <SelectItem value="2px">2px</SelectItem>
                      <SelectItem value="3px">3px</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="px"
                    className="h-8 text-xs w-16"
                    onChange={(e) => setTableStyles((prev) => ({ ...prev, borderWidth: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Cell Padding</Label>
                <div className="flex gap-1">
                  <Select
                    value={tableStyles.cellPadding}
                    onValueChange={(value) => setTableStyles((prev) => ({ ...prev, cellPadding: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4px">Small</SelectItem>
                      <SelectItem value="8px">Medium</SelectItem>
                      <SelectItem value="12px">Large</SelectItem>
                      <SelectItem value="16px">X-Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="px"
                    className="h-8 text-xs w-16"
                    onChange={(e) => setTableStyles((prev) => ({ ...prev, cellPadding: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <Button onClick={applyTableStyles} className="w-full mt-3" size="sm">
            Apply Styles
          </Button>
        </div>
      )}

      {!isHtmlMode && (
        <div className="text-xs text-gray-500 p-3 border rounded-lg bg-gray-50/50">
          <div className="space-y-1">
            <div>
              <strong>Features:</strong> Drag & drop images/videos, paste from clipboard, full formatting toolbar
            </div>
            <div>
              <strong>Shortcuts:</strong> <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+B</kbd> Bold •{" "}
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+I</kbd> Italic •{" "}
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+U</kbd> Underline •{" "}
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Z</kbd> Undo
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
