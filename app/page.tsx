"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MousePointer,
  List,
  Shuffle,
  Type,
  ArrowRight,
  Upload,
  Copy,
  CheckCircle,
  Loader2,
  ImageIcon,
  VideoIcon,
  Music,
  FileText,
  CodeIcon,
  File,
  ArrowUpRight,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider } from "@radix-ui/react-tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";

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
];

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Add all selected files to FormData
      Array.from(selectedFiles).forEach((file, index) => {
        formData.append(`file`, file);
      });

      const response = await fetch(
        "https://work.vaidikedu.com/api/v1/ixl/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Assuming the API returns an array of URLs or a single URL
      const urls = Array.isArray(data.urls) ? data.urls : [data.url];
      setUploadedUrls(urls);

      toast({
        title: "Upload successful",
        description: `${urls.length} file(s) uploaded successfully`,
      });

      // Reset file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setSelectedFiles(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

        {/* Upload Section */}

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

        <div className="mt-16 text-center">
          {/* <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Rich Content</h3>
                  <p className="text-gray-600">
                    Add text, images, videos, audio, and HTML with full
                    formatting control
                  </p>
                </div>
                <div>
                 
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">QTI 3.0 Ready</h3>
                  <p className="text-gray-600">
                    Generate standards-compliant XML for all assessment
                    platforms
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">File Upload</h3>
                  <p className="text-gray-600">
                    Upload multiple files and get shareable URLs with easy
                    copy functionality
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
          <Card className="mb-12 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload your files and get shareable URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select Files</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="text-sm text-gray-600">
                  {selectedFiles.length} file(s) selected
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFiles || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </>
                )}
              </Button>

              {/* Display uploaded URLs */}
              {uploadedUrls.length > 0 && (
                <div className="mt-6 space-y-5">
                  <Label className="text-lg font-medium text-gray-700">
                    Your Uploaded Files
                  </Label>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {uploadedUrls.map((url, index) => {
                      const fileExt = url
                        .split(".")
                        .pop()
                        .split("?")[0]
                        .toLowerCase();
                      const isImage = [
                        "png",
                        "jpg",
                        "jpeg",
                        "gif",
                        "webp",
                        "svg",
                      ].includes(fileExt);
                      const isVideo = ["mp4", "webm", "mov", "avi"].includes(
                        fileExt
                      );
                      const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(
                        fileExt
                      );
                      const isPDF = fileExt === "pdf";
                      const isHTML = fileExt === "html";
                      const isDocument = ["doc", "docx", "txt"].includes(
                        fileExt
                      );

                      return (
                        <div
                          key={index}
                          className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                        >
                          {/* Preview Card */}
                          <div className="p-4">
                            <div className="mb-3 flex items-center space-x-2">
                              {isImage && (
                                <ImageIcon className="h-5 w-5 text-rose-500" />
                              )}
                              {isVideo && (
                                <VideoIcon className="h-5 w-5 text-blue-500" />
                              )}
                              {isAudio && (
                                <Music className="h-5 w-5 text-purple-500" />
                              )}
                              {isPDF && (
                                <FileText className="h-5 w-5 text-red-500" />
                              )}
                              {isHTML && (
                                <CodeIcon className="h-5 w-5 text-indigo-500" />
                              )}
                              {isDocument && (
                                <File className="h-5 w-5 text-gray-500" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {fileExt.toUpperCase()} File
                              </span>
                            </div>

                            <div className="relative flex h-40 items-center justify-center rounded-lg bg-gray-50">
                              {isImage ? (
                                <img
                                  src={url}
                                  alt="Preview"
                                  className="max-h-full max-w-full object-contain transition-opacity hover:opacity-90"
                                />
                              ) : isVideo ? (
                                <video
                                  controls
                                  className="h-full w-full rounded-lg bg-black object-contain"
                                >
                                  <source src={url} type={`video/${fileExt}`} />
                                </video>
                              ) : isAudio ? (
                                <div className="w-full px-4">
                                  <audio controls className="w-full">
                                    <source
                                      src={url}
                                      type={`audio/${fileExt}`}
                                    />
                                  </audio>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center p-4 text-center">
                                  {isPDF && (
                                    <FileText className="h-12 w-12 text-red-500" />
                                  )}
                                  {isHTML && (
                                    <CodeIcon className="h-12 w-12 text-indigo-500" />
                                  )}
                                  {isDocument && (
                                    <File className="h-12 w-12 text-gray-500" />
                                  )}
                                  <span className="mt-2 text-sm font-medium text-gray-600">
                                    {fileExt.toUpperCase()} Preview
                                  </span>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    Open Full View
                                    <ArrowUpRight className="ml-1 h-4 w-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* URL Section with Copy Button */}
                          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Input
                                value={url}
                                readOnly
                                className="flex-1 truncate rounded-md bg-white text-sm font-mono text-gray-700"
                              />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        copyToClipboard(url, index)
                                      }
                                      className="shrink-0 hover:bg-gray-200"
                                    >
                                      {copiedIndex === index ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4 text-gray-500" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {copiedIndex === index
                                      ? "Copied!"
                                      : "Copy URL"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
