import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, MousePointer, CheckSquare } from "lucide-react"

export default function HomePage() {
  const questionTypes = [
    {
      id: "hottext",
      title: "Hottext Question",
      description: "Create interactive text with selectable highlighted terms",
      icon: MousePointer,
      href: "/builder/hottext",
    },
    {
      id: "hottext-advanced",
      title: "Advanced Hottext",
      description: "Create rich styled questions with images and custom buttons",
      icon: MousePointer,
      href: "/builder/hottext/advanced",
    },
    {
      id: "choice",
      title: "Multiple Choice",
      description: "Create questions with multiple choice answers",
      icon: CheckSquare,
      href: "/builder/choice",
    },
    {
      id: "text-entry",
      title: "Text Entry",
      description: "Create questions requiring text input",
      icon: FileText,
      href: "/builder/text-entry",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">QTI XML Generator</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create interactive assessment items with our visual builder. Generate QTI-compliant XML without coding
            knowledge.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {questionTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <Card key={type.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={type.href}>
                    <Button className="w-full">Create {type.title}</Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>What is QTI?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Question and Test Interoperability (QTI) is an international standard for creating and sharing
                assessment content. Our generator creates QTI 3.0 compliant XML that works with major learning
                management systems.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
