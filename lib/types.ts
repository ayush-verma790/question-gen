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
    textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | "initial" | "inherit"
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
  content: {
    type: "text" | "image" | "html"
    value: string
  }
  styles: {
    color?: string
    backgroundColor?: string
    width?: string
    height?: string
    borderRadius?: string
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: "left" | "center" | "right"
    textDecoration?: string
    textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | "initial" | "inherit"
    padding?: string
    margin?: string
    border?: string
    boxShadow?: string
    lineHeight?: string
    letterSpacing?: string
    hoverColor?: string
    hoverBackgroundColor?: string
    transition?: string
    display?: string
    maxWidth?: string
    maxHeight?: string
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
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
  contentBlocks: ContentBlock[]
  isCorrect: boolean
  inlineFeedbackBlocks: ContentBlock[]
}

export interface MultipleChoiceQuestion {
  identifier: string
  title: string
  promptBlocks: ContentBlock[]
  options: MultipleChoiceOption[]
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
  maxChoices: number
  shuffle: boolean
  orientation: "vertical" | "horizontal"
}

export interface OrderOption {
  identifier: string
  contentBlocks: ContentBlock[]
  correctOrder: number
}

export interface OrderQuestion {
  identifier: string
  title: string
  promptBlocks: ContentBlock[]
  options: OrderOption[]
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
  shuffle: boolean
  orientation: "vertical" | "horizontal"
}

export interface MatchPair {
  leftId: string
  leftContentBlocks: ContentBlock[]
  rightId: string
  rightContentBlocks: ContentBlock[]
}

export interface MatchQuestion {
  identifier: string
  title: string
  promptBlocks: ContentBlock[]
  pairs: MatchPair[]
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
  maxAssociations: number
  shuffle: boolean
}

export interface TextEntryQuestion {
  identifier: string
  title: string
  promptBlocks: ContentBlock[]
  correctAnswers: string[]
  caseSensitive: boolean
  correctFeedbackBlocks: ContentBlock[]
  incorrectFeedbackBlocks: ContentBlock[]
  expectedLength?: number
  patternMask?: string
}

export type QuestionType = "hottext" | "choice" | "order" | "match" | "text-entry"

export interface XMLGenerationRequest {
  type: QuestionType
  data: HottextQuestion | MultipleChoiceQuestion | OrderQuestion | MatchQuestion | TextEntryQuestion
}
