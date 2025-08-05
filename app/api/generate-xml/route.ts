import { type NextRequest, NextResponse } from "next/server"
import {
  generateHottextXML,
  generateMultipleChoiceXML,
  generateOrderXML,
  generateMatchXML,
  generateTextEntryXML,
} from "@/lib/xml-generator"
import type { XMLGenerationRequest } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: XMLGenerationRequest = await request.json()
    const { type, data } = body

    let xml: string

    switch (type) {
      case "hottext":
        xml = generateHottextXML(data as any)
        break
      case "choice":
        xml = generateMultipleChoiceXML(data as any)
        break
      case "order":
        xml = generateOrderXML(data as any)
        break
      case "match":
        xml = generateMatchXML(data as any)
        break
      case "text-entry":
        xml = generateTextEntryXML(data as any)
        break
      default:
        return NextResponse.json({ error: "Invalid question type" }, { status: 400 })
    }

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${data.identifier || "question"}.xml"`,
      },
    })
  } catch (error) {
    console.error("Error generating XML:", error)
    return NextResponse.json({ error: "Failed to generate XML" }, { status: 500 })
  }
}
