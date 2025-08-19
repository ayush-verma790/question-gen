"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

interface ParsedXMLData {
  type: string;
  data: any;
}

export default function XMLParserPage() {
  const [xmlContent, setXmlContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const detectXMLType = (xmlString: string): string | null => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Invalid XML format");
    }

    const root = xmlDoc.documentElement;
    
    // Check for different QTI interaction types (both QTI 2.1 and 3.0 formats)
    if (root.querySelector("choiceInteraction, qti-choice-interaction")) {
      return "choice";
    } else if (root.querySelector("orderInteraction, qti-order-interaction")) {
      return "order";
    } else if (root.querySelector("associateInteraction, qti-associate-interaction")) {
      return "match";
    } else if (root.querySelector("gapMatchInteraction, qti-gap-match-interaction")) {
      return "gap-match";
    } else if (root.querySelector("textEntryInteraction, qti-text-entry-interaction")) {
      return "text-entry";
    } else if (root.querySelector("hottextInteraction, qti-hottext-interaction")) {
      return "hottext";
    } else if (
      (root.querySelector("hottextInteraction, qti-hottext-interaction") && 
       root.querySelector("choiceInteraction, qti-choice-interaction"))
    ) {
      return "hottext-interaction";
    } else if (root.querySelector("assessmentItem, qti-assessment-item")) {
      // If it's a general assessmentItem, try to detect by other means
      return "mix"; // Default to mix for complex items
    }
    
    return null;
  };

  const handleParse = async () => {
    if (!xmlContent.trim()) {
      setError("Please enter XML content");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const xmlType = detectXMLType(xmlContent);
      
      if (!xmlType) {
        throw new Error("Could not detect XML type. Please ensure it's a valid QTI XML.");
      }

      setSuccess(`Detected ${xmlType} interaction. Redirecting...`);
      
      // Store XML data in sessionStorage for the target component to use
      sessionStorage.setItem('parsedXML', xmlContent);
      sessionStorage.setItem('xmlType', xmlType);
      
      // Redirect to the appropriate builder route
      setTimeout(() => {
        router.push(`/builder/${xmlType}?fromXML=true`);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse XML");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setXmlContent("");
    setError("");
    setSuccess("");
  };

  const exampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v3p0" 
                identifier="choice-example" 
                title="Sample Multiple Choice Question" 
                adaptive="false" 
                timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>choice_A</value>
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>
  <itemBody>
    <p>What is the capital of France?</p>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
      <simpleChoice identifier="choice_A">Paris</simpleChoice>
      <simpleChoice identifier="choice_B">London</simpleChoice>
      <simpleChoice identifier="choice_C">Berlin</simpleChoice>
      <simpleChoice identifier="choice_D">Madrid</simpleChoice>
    </choiceInteraction>
  </itemBody>
</assessmentItem>`;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          XML Parser & Router
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Paste your QTI XML code below and we'll automatically detect the interaction type and redirect you to the appropriate builder with prefilled data.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              XML Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="xml-content">Paste your QTI XML here:</Label>
              <Textarea
                id="xml-content"
                placeholder="Paste your XML content here..."
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={handleParse} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Parse & Redirect
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Interaction Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Choice Interaction
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Order Interaction
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Match Interaction
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Gap Match
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Text Entry
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Hottext
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                Hottext Interaction
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Mixed/Complex
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example XML</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Here's an example of a multiple choice question XML you can use to test:
            </p>
            <div className="relative">
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto">
                <code>{exampleXML}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setXmlContent(exampleXML)}
              >
                Use Example
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
