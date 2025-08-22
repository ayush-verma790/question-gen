"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MousePointer,
  List,
  Shuffle,
  Type,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Header } from "@/components/header";

const questionTypes = [
  {
    id: "hottext",
    title: "Hottext Questions",
    description:
      "Interactive clickable text elements with rich formatting and styling",
    icon: MousePointer,
    href: "/builder/hottext",
    color: "bg-blue-500",
  },
  {
    id: "hottext-interaction",
    title: "Hottext Interaction",
    description:
      "Interactive clickable text elements with rich formatting and styling",
    icon: MousePointer,
    href: "/builder/hottext-interaction",
    color: "bg-blue-500",
  },
  {
    id: "choice",
    title: "Multiple Choice",
    description:
      "Single or multiple choice questions with rich content and inline feedback",
    icon: List,
    href: "/builder/choice",
    color: "bg-green-500",
  },
  {
    id: "order",
    title: "Order Questions",
    description: "Drag-and-drop ordering questions with multimedia content",
    icon: Shuffle,
    href: "/builder/order",
    color: "bg-purple-500",
  },
  {
    id: "match",
    title: "Match Questions",
    description: "Matching pairs with images, text, and rich formatting",
    icon: ArrowRight,
    href: "/builder/match",
    color: "bg-orange-500",
  },
  {
    id: "text-entry",
    title: "Text Entry",
    description:
      "Fill-in-the-blank and short answer questions with pattern validation",
    icon: Type,
    href: "/builder/text-entry",
    color: "bg-red-500",
  },
  {
    id: "gap-match",
    title: "Gap Match",
    description: "Gap Match questions with rich content and flexible layouts",
    icon: Type,
    href: "/builder/gap-match",
    color: "bg-red-500",
  },
  {
    id: "ALL",
    title: "All Questions",
    description: "All question types with rich content and flexible layouts",
    icon: Type,
    href: "/builder/mix",
    color: "bg-red-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            QTI XML Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create interactive assessment questions with rich content,
            multimedia support, and perfect formatting preservation. Generate
            QTI 3.0 compliant XML for all major question types.
          </p>
        </div>

        {/* XML Parser Section */}
        {/* <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-600 text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-900">
                    XML Parser & Router
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Already have QTI XML? Paste it and get automatically redirected to the appropriate builder with prefilled data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/xml-parser">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Parse XML & Redirect
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div> */}

        {/* <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Or Create New Questions
          </h2>
          <p className="text-gray-600">
            Choose a question type to start building from scratch
          </p>
        </div> */}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {questionTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <Card
                key={type.id}
                className="hover:shadow-lg transition-shadow duration-200 group"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg ${type.color} text-white group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {type.description}
                  </CardDescription>
                  <Link href={type.href}>
                    <Button className="w-full group-hover:bg-gray-900 transition-colors">
                      Create Question
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-12">
          <iframe
            src="https://app.alphalearn.school/question-preview?type=gap-match&q=0&tab=xml"
            width="100%"
            height="600px"
            style={{ border: "none" }}
            title="Embedded Google"
          />
        </Card>
      </div>
    </div>
  );
}
