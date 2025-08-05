import { type NextRequest, NextResponse } from "next/server"
import type { XMLGenerationRequest } from "@/lib/types"
import { generateHottextXML, generateMultipleChoiceXML } from "@/lib/xml-generator"

export async function POST(request: NextRequest) {
  try {
    const body: XMLGenerationRequest = await request.json()

    let xmlContent: string

    switch (body.type) {
      case "hottext":
        xmlContent = generateHottextXML(body.data as any)
        break
      case "choice":
        xmlContent = generateMultipleChoiceXML(body.data as any)
        break
      default:
        return NextResponse.json({ error: "Unsupported question type" }, { status: 400 })
    }

    return new NextResponse(xmlContent, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${body.data.identifier}.xml"`,
      },
    })
  } catch (error) {
    console.error("Error generating XML:", error)
    return NextResponse.json({ error: "Failed to generate XML" }, { status: 500 })
  }
}
