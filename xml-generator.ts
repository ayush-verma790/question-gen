import type { HottextQuestion, MultipleChoiceQuestion, ContentBlock } from "./types"

function renderContentBlocksToXML(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      const styleString = Object.entries(block.styles)
        .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
        .join("; ")

      const style = styleString ? ` style="${styleString}"` : ""

      switch (block.type) {
        case "text":
          return `      <p${style}>${block.content}</p>`
        case "image":
          return `      <img src="${block.content}" alt="${block.attributes?.alt || "Image"}" width="${
            block.attributes?.width || "400"
          }"${style}/>`
        case "video":
          return `      <video src="${block.content}" width="${block.attributes?.width || "400"}" height="${
            block.attributes?.height || "300"
          }"${block.attributes?.controls ? " controls" : ""}${block.attributes?.autoplay ? " autoplay" : ""}${
            block.attributes?.loop ? " loop" : ""
          }${style}></video>`
        case "audio":
          return `      <audio src="${block.content}"${block.attributes?.controls ? " controls" : ""}${
            block.attributes?.autoplay ? " autoplay" : ""
          }${block.attributes?.loop ? " loop" : ""}${style}></audio>`
        case "html":
          return `      <div${style}>${block.content}</div>`
        default:
          return ""
      }
    })
    .join("\n")
}

export function generateHottextXML(question: HottextQuestion): string {
  const {
    identifier,
    title,
    promptBlocks,
    contentBlocks,
    hottextItems,
    correctAnswers,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    maxChoices,
    globalStyles,
    customCSS,
  } = question

  const correctResponseValues = correctAnswers.map((id) => `      <qti-value>${id}</qti-value>`).join("\n")

  const promptContent = renderContentBlocksToXML(promptBlocks)
  const contentContent = renderContentBlocksToXML(contentBlocks)
  const correctFeedbackContent = renderContentBlocksToXML(correctFeedbackBlocks)
  const incorrectFeedbackContent = renderContentBlocksToXML(incorrectFeedbackBlocks)

  const hottextElements = hottextItems
    .map((item) => {
      const styleString = Object.entries(item.styles)
        .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
        .join("; ")

      return `          <qti-hottext identifier="${item.identifier}">
            <span style="${styleString}">${item.text}</span>
          </qti-hottext>`
    })
    .join("\n")

  const globalStyleString = Object.entries(globalStyles)
    .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
    .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
    .join("; ")

  const customStyles = customCSS ? `\n      <style>${customCSS}</style>` : ""

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  adaptive="false"
  time-dependent="false">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
${correctResponseValues}
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-item-body>
    <div style="${globalStyleString}">
${customStyles}
${promptContent}
${contentContent}
      <qti-hottext-interaction response-identifier="RESPONSE" max-choices="${maxChoices}">
        <p style="display: flex; gap: 20px; flex-wrap: wrap;">
${hottextElements}
        </p>
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
    <qti-content-body>
      <div style="${globalStyleString}">
${correctFeedbackContent}
      </div>
    </qti-content-body>
  </qti-modal-feedback>

  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show" title="Try Again">
    <qti-content-body>
      <div style="${globalStyleString}">
${incorrectFeedbackContent}
      </div>
    </qti-content-body>
  </qti-modal-feedback>

</qti-assessment-item>`
}

export function generateMultipleChoiceXML(question: MultipleChoiceQuestion): string {
  const { identifier, title, prompt, options, correctFeedback, incorrectFeedback } = question

  const correctAnswers = options.filter((opt) => opt.isCorrect).map((opt) => opt.identifier)
  const correctResponseValues = correctAnswers.map((id) => `      <qti-value>${id}</qti-value>`).join("\n")

  const choiceElements = options
    .map((option) => `        <qti-simple-choice identifier="${option.identifier}">${option.text}</qti-simple-choice>`)
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  adaptive="false"
  time-dependent="false">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
${correctResponseValues}
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-prompt>${prompt}</qti-prompt>
${choiceElements}
    </qti-choice-interaction>
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

  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show" title="Correct!">
    <qti-content-body>
      <p>${correctFeedback}</p>
    </qti-content-body>
  </qti-modal-feedback>

  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show" title="Incorrect">
    <qti-content-body>
      <p>${incorrectFeedback}</p>
    </qti-content-body>
  </qti-modal-feedback>

</qti-assessment-item>`
}
