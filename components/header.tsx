"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">Q</span>
            </div>
            <span className="text-xl font-bold text-gray-900">QTI Generator</span>
          </Link>

          {/* Upload Button */}
          <Link href="/upload">
            <Button className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
