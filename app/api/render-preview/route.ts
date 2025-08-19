import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest) {
  try {
    // Read the HTML file
    const htmlPath = join(process.cwd(), "ui/render/render.html")
    const htmlContent = await readFile(htmlPath, "utf-8")
    
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error serving render HTML:", error)
    return NextResponse.json({ error: "Failed to load render page" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { xml } = await request.json()
    
    if (!xml) {
      return NextResponse.json({ error: "XML content is required" }, { status: 400 })
    }

    // Read the HTML file and inject the XML
    const htmlPath = join(process.cwd(), "ui/render/render.html")
    let htmlContent = await readFile(htmlPath, "utf-8")
    
    // Inject the XML content and auto-render script
    const injectedScript = `
    <script>
      // Auto-populate XML and render
      document.addEventListener('DOMContentLoaded', function() {
        const xmlTA = document.getElementById('xml');
        if (xmlTA) {
          xmlTA.value = ${JSON.stringify(xml)};
          // Auto-render after a short delay to ensure everything is loaded
          setTimeout(() => {
            const renderBtn = document.getElementById('renderBtn');
            if (renderBtn) {
              renderBtn.click();
            }
          }, 100);
        }
      });
    </script>
    </body>
    `
    
    // Replace the closing body tag with our script + closing body tag
    htmlContent = htmlContent.replace('</body>', injectedScript)
    
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error generating preview:", error)
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 })
  }
}
