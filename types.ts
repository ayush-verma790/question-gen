export interface ContentBlock {
  id: string
  type: "text" | "image" | "video" | "audio" | "html"
  content: string
  styles: {
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    color?: string
    backgroundColor?: string
    padding?: string
    margin?: string
    borderRadius?: string
    border?: string
    boxShadow?: string
    textAlign?: "left" | "center" | "right" | "justify"
    textDecoration?: string
    textTransform?: string
    lineHeight?: string
    letterSpacing?: string
    width?: string
    height?: string
  }
  attributes?: {
    alt?: string
    width?: string
    height?: string
    autoplay?: boolean
    controls?: boolean
    loop?: boolean
    [key: string]: any
  }
}

export interface HottextItem {
  identifier: string
  text: string
  styles: {
    color: string
    backgroundColor: string
    width: string
    height: string
    borderRadius: string
    fontSize: string
    fontFamily: string
    fontWeight?: string
    fontStyle?: string
    textAlign: "left" | "center" | "right"
    textDecoration?: string
    textTransform?: string
    padding: string
    margin: string
    border: string
    boxShadow: string
    lineHeight?: string
    letterSpacing?: string
    hoverColor?: string
    hoverBackgroundColor?: string
    transition?: string
  }
  position: {
    x: number
    y: number
  }
}

export interface HottextQuestion {
  identifier: string
  title: string
  promptBlocks: ContentBlock[]
  contentBlocks: ContentBlock[]
  hottextItems: HottextItem[]
  correctAnswers: string[]
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
  maxChoices: number
  globalStyles: {
    fontFamily: string
    fontSize: string
    backgroundColor: string
    padding: string
    borderRadius: string
    boxShadow: string
  }
  customCSS: string
}

export interface MultipleChoiceOption {
  identifier: string
  text: string
  isCorrect: boolean
}

export interface MultipleChoiceQuestion {
  identifier: string
  title: string
  prompt: string
  options: MultipleChoiceOption[]
  correctFeedback: string
  incorrectFeedback: string
}

export interface TextEntryQuestion {
  identifier: string
  title: string
  prompt: string
  correctAnswers: string[]
  caseSensitive: boolean
  correctFeedback: string
  incorrectFeedback: string
}

export type QuestionType = "hottext" | "choice" | "text-entry"

export interface XMLGenerationRequest {
  type: QuestionType
  data: HottextQuestion | MultipleChoiceQuestion | TextEntryQuestion
}
