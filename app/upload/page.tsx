import { Header } from "@/components/header";
import { UploadFiles } from "@/components/upload-files";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Files
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your files and get shareable URLs to use in your QTI questions. 
            Supports images, videos, audio, documents, and more.
          </p>
        </div>
        
        <UploadFiles />
      </div>
    </div>
  );
}
