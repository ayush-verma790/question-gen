import type {
  HottextQuestion,
  MultipleChoiceQuestion,
  OrderQuestion,
  MatchQuestion,
  TextEntryQuestion,
  ContentBlock,
  MatchPair,
} from "./types"

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
          return `      <div${style}>${block.content}</div>`
        case "image":
          return `      <img src="${block.content}" alt="${block.attributes?.alt || "Image"}" width="${
            block.attributes?.width || "400"
          }" height="${block.attributes?.height || "300"}"${style}/>`
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

export function generateMultipleChoiceXML(question: MultipleChoiceQuestion): string {
  const {
    identifier,
    title,
    promptBlocks,
    options,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    maxChoices,
    shuffle,
    orientation,
  } = question

  const correctAnswers = options.filter((opt) => opt.isCorrect).map((opt) => opt.identifier)
  const correctResponseValues = correctAnswers.map((id) => `      <qti-value>${id}</qti-value>`).join("\n")

  const cardinality = maxChoices === 1 ? "single" : "multiple"

  const promptContent = renderContentBlocksToXML(promptBlocks)
  const correctFeedbackContent = renderContentBlocksToXML(correctFeedbackBlocks)
  const incorrectFeedbackContent = renderContentBlocksToXML(incorrectFeedbackBlocks)

  const choiceElements = options
    .map((option) => {
      const optionContent = renderContentBlocksToXML(option.contentBlocks)
      const inlineFeedback =
        option.inlineFeedbackBlocks.length > 0
          ? `
        <qti-feedback-inline outcome-identifier="FEEDBACK-INLINE" identifier="${option.identifier}" show-hide="show">
${renderContentBlocksToXML(option.inlineFeedbackBlocks)}
        </qti-feedback-inline>`
          : ""

      return `      <qti-simple-choice identifier="${option.identifier}">
${optionContent}${inlineFeedback}
      </qti-simple-choice>`
    })
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

  <qti-response-declaration identifier="RESPONSE" cardinality="${cardinality}" base-type="identifier">
    <qti-correct-response>
${correctResponseValues}
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="FEEDBACK-INLINE" cardinality="single" base-type="identifier"/>

  <qti-item-body>
    <div>
${promptContent}
    </div>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="${maxChoices}"${shuffle ? ' shuffle="true"' : ""}${orientation ? ` orientation="${orientation}"` : ""}>
${choiceElements}
    </qti-choice-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <qti-content-body>
${correctFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
      <qti-content-body>
${incorrectFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-base-value base-type="identifier">CORRECT</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-base-value base-type="identifier">INCORRECT</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>

</qti-assessment-item>`
}

export function generateOrderXML(question: OrderQuestion): string {
  const {
    identifier,
    title,
    promptBlocks,
    options,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    shuffle,
    orientation,
  } = question

  const correctResponseValues = options
    .sort((a, b) => a.correctOrder - b.correctOrder)
    .map((option) => `      <qti-value>${option.identifier}</qti-value>`)
    .join("\n")

  const promptContent = renderContentBlocksToXML(promptBlocks)
  const correctFeedbackContent = renderContentBlocksToXML(correctFeedbackBlocks)
  const incorrectFeedbackContent = renderContentBlocksToXML(incorrectFeedbackBlocks)

  const choiceElements = options
    .map((option) => {
      const optionContent = renderContentBlocksToXML(option.contentBlocks)
      return `      <qti-simple-choice identifier="${option.identifier}">
${optionContent}
      </qti-simple-choice>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  time-dependent="false"
  xml:lang="en-US">

  <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier">
    <qti-correct-response>
${correctResponseValues}
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier">
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="FEEDBACK-INLINE" cardinality="ordered" base-type="identifier">
  </qti-outcome-declaration>

  <qti-item-body>
${promptContent}
    <qti-order-interaction response-identifier="RESPONSE"${shuffle ? ' shuffle="true"' : ""} orientation="${orientation}">
${choiceElements}
    </qti-order-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <qti-content-body>
${correctFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
      <qti-content-body>
${incorrectFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>

</qti-assessment-item>`
}

export function generateMatchXML(question: MatchQuestion): string {
  const {
    identifier,
    title,
    promptBlocks,
    pairs,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    maxAssociations,
    shuffle,
  } = question

  const correctResponseValues = pairs
    .map((pair) => `      <qti-value>${pair.leftId} ${pair.rightId}</qti-value>`)
    .join("\n")

  const promptContent = renderContentBlocksToXML(promptBlocks)
  const correctFeedbackContent = renderContentBlocksToXML(correctFeedbackBlocks)
  const incorrectFeedbackContent = renderContentBlocksToXML(incorrectFeedbackBlocks)

  const leftChoices = pairs
    .map((pair) => {
      const leftContent = renderContentBlocksToXML(pair.leftContentBlocks)
      return `        <qti-simple-associable-choice identifier="${pair.leftId}" match-max="1">
${leftContent}
        </qti-simple-associable-choice>`
    })
    .join("\n")

  const rightChoices = pairs
    .map((pair) => {
      const rightContent = renderContentBlocksToXML(pair.rightContentBlocks)
      return `        <qti-simple-associable-choice identifier="${pair.rightId}" match-max="2">
${rightContent}
        </qti-simple-associable-choice>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  time-dependent="false"
  xml:lang="en-US">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
${correctResponseValues}
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier">
  </qti-outcome-declaration>

  <qti-outcome-declaration identifier="FEEDBACK-INLINE" cardinality="multiple" base-type="identifier">
  </qti-outcome-declaration>

  <qti-item-body>
${promptContent}
    <qti-match-interaction max-associations="${maxAssociations}" response-identifier="RESPONSE"${shuffle ? ' shuffle="true"' : ""}>
      <qti-simple-match-set>
${leftChoices}
      </qti-simple-match-set>
      <qti-simple-match-set>
${rightChoices}
      </qti-simple-match-set>
    </qti-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <qti-content-body>
${correctFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
      <qti-content-body>
${incorrectFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>

</qti-assessment-item>`
}
export function parseMatchXML(xmlString: string): MatchQuestion | null {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, "text/xml")
    
    // Parse the XML document and extract all the necessary data
    // This is just a basic example - you'll need to adjust it based on your actual XML structure
    
    const identifier = xmlDoc.querySelector('matchInteraction')?.getAttribute('responseIdentifier') || ''
    const title = xmlDoc.querySelector('prompt')?.textContent || ''
    
    // Parse prompt blocks
    const promptBlocks: ContentBlock[] = [
      {
        id: `prompt_block_${Date.now()}`,
        type: "text",
        content: xmlDoc.querySelector('prompt')?.innerHTML || '',
        styles: {},
        attributes: {}
      }
    ]
    
    // Parse pairs
    const pairs: MatchPair[] = []
    const simpleMatchSets = xmlDoc.querySelectorAll('simpleMatchSet')
    
    if (simpleMatchSets.length >= 2) {
      const leftItems = simpleMatchSets[0].querySelectorAll('simpleAssociableChoice')
      const rightItems = simpleMatchSets[1].querySelectorAll('simpleAssociableChoice')
      
      leftItems.forEach((leftItem, index) => {
        const rightItem = rightItems[index]
        if (rightItem) {
          pairs.push({
            leftId: leftItem.getAttribute('identifier') || `left_${index + 1}`,
            leftContentBlocks: [{
              id: `left_block_${index + 1}`,
              type: "text",
              content: leftItem.innerHTML,
              styles: {},
              attributes: {}
            }],
            rightId: rightItem.getAttribute('identifier') || `right_${index + 1}`,
            rightContentBlocks: [{
              id: `right_block_${index + 1}`,
              type: "text",
              content: rightItem.innerHTML,
              styles: {},
              attributes: {}
            }]
          })
        }
      })
    }
    
    // Parse feedback
    const correctFeedbackBlocks: ContentBlock[] = []
    const incorrectFeedbackBlocks: ContentBlock[] = []
    
    // Return the parsed question object
    return {
      identifier,
      title,
      promptBlocks,
      pairs,
      correctFeedbackBlocks,
      incorrectFeedbackBlocks,
      maxAssociations: 1, // Default value, adjust as needed
      shuffle: true // Default value, adjust as needed
    }
  } catch (error) {
    console.error("Error parsing XML:", error)
    return null
  }
}
export function generateTextEntryXML(question: TextEntryQuestion): string {
  const {
    identifier,
    title,
    promptBlocks,
    correctAnswers,
    caseSensitive,
    correctFeedbackBlocks,
    incorrectFeedbackBlocks,
    expectedLength,
    patternMask,
  } = question

  const correctResponseValues = correctAnswers.map((answer) => `      <qti-value>${answer}</qti-value>`).join("\n")

  const promptContent = renderContentBlocksToXML(promptBlocks)
  const correctFeedbackContent = renderContentBlocksToXML(correctFeedbackBlocks)
  const incorrectFeedbackContent = renderContentBlocksToXML(incorrectFeedbackBlocks)

  let textEntryAttributes = 'response-identifier="RESPONSE"'
  if (expectedLength) {
    textEntryAttributes += ` expected-length="${expectedLength}" class="qti-input-width-${Math.min(expectedLength, 25)}"`
  }
  if (patternMask) {
    textEntryAttributes += ` pattern-mask="${patternMask}"`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
  identifier="${identifier}"
  title="${title}"
  time-dependent="false"
  xml:lang="en-US">

  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
${correctResponseValues}
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>

  <qti-outcome-declaration identifier="FEEDBACK-INLINE" cardinality="single" base-type="identifier"/>

  <qti-item-body>
${promptContent}
    <div id="reference_text">
      <qti-text-entry-interaction ${textEntryAttributes} />
    </div>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="CORRECT" show-hide="show">
      <qti-content-body>
${correctFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show">
      <qti-content-body>
${incorrectFeedbackContent}
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>

</qti-assessment-item>`
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
  } = question;

  const correctResponseValues = correctAnswers
    .map((id) => `      <qti-value>${id}</qti-value>`)
    .join("\n");

  const promptContent = renderContentBlocksToXML(promptBlocks);
  const contentContent = renderContentBlocksToXML(contentBlocks);
  const correctFeedbackContent = renderContentBlocksToXML(correctFeedbackBlocks);
  const incorrectFeedbackContent = renderContentBlocksToXML(incorrectFeedbackBlocks);

  const hottextElements = hottextItems
    .map((item) => {
      const styleString = Object.entries(item.styles)
        .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
        .join("; ");
    // @ts-ignore
      return `          <qti-hottext identifier="${item.identifier}"><span style="${styleString}">${item?.content?.value}</span>
          </qti-hottext>`;
    })
    .join("\n");

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
    <div style="font-family: ${globalStyles.fontFamily}; font-size: ${globalStyles.fontSize}; background-color: ${globalStyles.backgroundColor}; padding: ${globalStyles.padding}; border-radius: ${globalStyles.borderRadius}; box-shadow: ${globalStyles.boxShadow}">
${promptContent}
${contentContent}
      <qti-hottext-interaction response-identifier="RESPONSE" max-choices="${maxChoices}">
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
    <qti-content-body>
      <div style="font-family: ${globalStyles.fontFamily}; font-size: ${globalStyles.fontSize}; background-color: ${globalStyles.backgroundColor}; padding: ${globalStyles.padding}; border-radius: ${globalStyles.borderRadius}; box-shadow: ${globalStyles.boxShadow}">
${correctFeedbackContent}
      </div>
    </qti-content-body>
  </qti-modal-feedback>

  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="INCORRECT" show-hide="show" title="Try Again">
    <qti-content-body>
      <div style="font-family: ${globalStyles.fontFamily}; font-size: ${globalStyles.fontSize}; background-color: ${globalStyles.backgroundColor}; padding: ${globalStyles.padding}; border-radius: ${globalStyles.borderRadius}; box-shadow: ${globalStyles.boxShadow}">
${incorrectFeedbackContent}
      </div>
    </qti-content-body>
  </qti-modal-feedback>

</qti-assessment-item>`;
}

// export function renderContentBlocksToXML(blocks: ContentBlock[]): string {
//   return blocks
//     .map((block) => {
//       const style = Object.entries(block.styles)
//         .filter(([_, value]) => value && value !== "auto" && value !== "transparent")
//         .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
//         .join("; ");

//       switch (block.type) {
//         case "text":
//           return `      <div style="${style}">${block.content}</div>`;
//         case "image":
//           return `      <img src="${block.content}" alt="${block.attributes?.alt || ""}" width="${block.attributes?.width || ""}" height="${block.attributes?.height || ""}" style="${style}"/>`;
//         case "video":
//           return `      <video src="${block.content}" width="${block.attributes?.width || ""}" height="${block.attributes?.height || ""}" controls="${block.attributes?.controls}" autoplay="${block.attributes?.autoplay}" loop="${block.attributes?.loop}" style="${style}"/>`;
//         case "audio":
//           return `      <audio src="${block.content}" controls="${block.attributes?.controls}" autoplay="${block.attributes?.autoplay}" loop="${block.attributes?.loop}" style="${style}"/>`;
//         case "html":
//           return `      <div style="${style}">${block.content}</div>`;
//         default:
//           return "";
//       }
//     })
//     .join("\n");
// }

