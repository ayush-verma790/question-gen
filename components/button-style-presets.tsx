"use client"

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ButtonStylePreset {
  name: string;
  styles: Record<string, string>;
  preview: string;
  category: "basic" | "gradient" | "special";
}

export const buttonStylePresets: ButtonStylePreset[] = [
  // Basic styles
  {
    name: "Clean White Box",
    category: "basic",
    styles: {
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "10px 18px",
      fontSize: "16px",
      backgroundColor: "white",
      color: "#000000",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "80px",
      minHeight: "40px",
    },
    preview: "is greater than"
  },
  {
    name: "Glossy Blue Pill",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #1e90ff, #005cbf)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "70px",
      minHeight: "45px",
    },
    preview: "23"
  },
  {
    name: "Minimal Number Box",
    category: "basic",
    styles: {
      border: "1px solid #bbb",
      borderRadius: "8px",
      padding: "10px 18px",
      background: "white",
      backgroundColor: "white",
      color: "#000000",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 2px 3px rgba(0,0,0,0.1)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "50px",
      minHeight: "40px",
    },
    preview: "1"
  },
  {
    name: "Aqua Gradient Pill",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #00d2ff, #3a7bd5)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 3px 7px rgba(0,0,0,0.15)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "70px",
      minHeight: "45px",
    },
    preview: "23"
  },
  {
    name: "Circular Glow",
    category: "special",
    styles: {
      background: "linear-gradient(145deg, #4facfe, #007bff)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "60px",
      height: "60px",
      fontSize: "20px",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      lineHeight: "60px",
    },
    preview: "3"
  },
  {
    name: "Clean White Box Alt",
    category: "basic",
    styles: {
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "10px 18px",
      background: "white",
      backgroundColor: "white",
      color: "#000000",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "50px",
      minHeight: "40px",
    },
    preview: "4"
  },
  {
    name: "Soft Blue Outline",
    category: "basic",
    styles: {
      border: "1px solid #1e90ff",
      borderRadius: "18px",
      padding: "10px 18px",
      background: "white",
      backgroundColor: "white",
      color: "#1e90ff",
      fontSize: "15px",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "100px",
      minHeight: "40px",
    },
    preview: "what is the"
  },
  // New gradient styles
  {
    name: "Sunset",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #ff7e5f, #feb47b)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "80px",
      minHeight: "45px",
    },
    preview: "Sunset"
  },
  {
    name: "Purple Blue",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #6a11cb, #2575fc)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "100px",
      minHeight: "45px",
    },
    preview: "Purple Blue"
  },
  {
    name: "Green Mint",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #11998e, #38ef7d)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "95px",
      minHeight: "45px",
    },
    preview: "Green Mint"
  },
  {
    name: "Pink Blue",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #fc5c7d, #6a82fb)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "85px",
      minHeight: "45px",
    },
    preview: "Pink Blue"
  },
  {
    name: "Hot Pink",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #ff512f, #dd2476)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "80px",
      minHeight: "45px",
    },
    preview: "Hot Pink"
  },
  {
    name: "Orange",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #f7971e, #ffd200)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "70px",
      minHeight: "45px",
    },
    preview: "Orange"
  },
  {
    name: "Dark Navy",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #141e30, #243b55)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "90px",
      minHeight: "45px",
    },
    preview: "Dark Navy"
  },
  {
    name: "Wine Red",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #c31432, #240b36)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "80px",
      minHeight: "45px",
    },
    preview: "Wine Red"
  },
  {
    name: "Magenta",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #f953c6, #b91d73)",
      color: "white",
      border: "none",
      borderRadius: "25px",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "80px",
      minHeight: "45px",
    },
    preview: "Magenta"
  },
  {
    name: "Green Success",
    category: "gradient",
    styles: {
      background: "linear-gradient(135deg, #56ab2f, #a8e6cf)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      padding: "12px 24px",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      display: "inline-block",
      textAlign: "center",
      minWidth: "80px",
      minHeight: "45px",
    },
    preview: "Success"
  }
];

interface ButtonStylePresetsProps {
  onApplyPreset: (preset: ButtonStylePreset) => void;
  onClose: () => void;
  title?: string;
  showCategories?: boolean;
}

export function ButtonStylePresets({ 
  onApplyPreset, 
  onClose, 
  title = "Choose Button Style Preset",
  showCategories = true
}: ButtonStylePresetsProps) {
  const categories = showCategories ? ['basic', 'gradient', 'special'] as const : ['all'] as const;

  const getPresetsByCategory = (category: string) => {
    if (category === 'all') return buttonStylePresets;
    return buttonStylePresets.filter(preset => preset.category === category);
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'basic': return 'Basic Styles';
      case 'gradient': return 'Gradient Styles';
      case 'special': return 'Special Styles';
      default: return 'All Styles';
    }
  };

  return (
    <Card className="border-2 border-blue-500 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {categories.map((category) => {
          const presets = getPresetsByCategory(category);
          if (presets.length === 0) return null;

          return (
            <div key={category} className="mb-6">
              {showCategories && (
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">
                  {getCategoryTitle(category)}
                </h3>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {presets.map((preset, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="text-center p-2 border rounded-lg hover:bg-white cursor-pointer transition-colors"
                    onClick={() => onApplyPreset(preset)}
                  >
                    <div className="mb-2">
                      <button
                        style={preset.styles as React.CSSProperties}
                        className="pointer-events-none text-xs"
                      >
                        {preset.preview}
                      </button>
                    </div>
                    <p className="text-xs font-medium text-gray-700 truncate" title={preset.name}>
                      {preset.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <p className="text-sm text-gray-600 mt-4">
          Click on any style to apply it to the selected item.
        </p>
      </CardContent>
    </Card>
  );
}

// Quick preview component for inline use
interface QuickStylePresetsProps {
  onApplyPreset: (preset: ButtonStylePreset) => void;
  maxItems?: number;
  showOnlyCategory?: 'basic' | 'gradient' | 'special';
}

export function QuickStylePresets({ 
  onApplyPreset, 
  maxItems = 4,
  showOnlyCategory 
}: QuickStylePresetsProps) {
  const presets = showOnlyCategory 
    ? buttonStylePresets.filter(p => p.category === showOnlyCategory).slice(0, maxItems)
    : buttonStylePresets.slice(0, maxItems);

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset, index) => (
        <button
          key={index}
          style={{...preset.styles, transform: 'scale(0.8)'} as React.CSSProperties}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onApplyPreset(preset)}
          title={`Click to apply ${preset.name} style`}
        >
          {preset.preview}
        </button>
      ))}
    </div>
  );
}

// HTML code generator for feedback blocks
export function generateButtonHTML(preset: ButtonStylePreset, customText?: string): string {
  const text = customText || preset.preview;
  const styleString = Object.entries(preset.styles)
    .filter(([_, value]) => value && value !== 'auto')
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
    .join('; ');

  return `<button style="${styleString}">${text}</button>`;
}
