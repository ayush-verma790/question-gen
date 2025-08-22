"use client"

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { buttonStylePresets } from "@/components/button-style-presets";

interface ButtonSuggestionsProps {
  onSuggestionClick: (buttonHTML: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  defaultCollapsed?: boolean;
}

export function ButtonSuggestions({ 
  onSuggestionClick, 
  className,
  size = "md",
  showTitle = true,
  defaultCollapsed = true
}: ButtonSuggestionsProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const suggestions = [
    { text: "1", preset: buttonStylePresets.find(p => p.name === "Clean White Box") },
    { text: "2", preset: buttonStylePresets.find(p => p.name === "Glossy Blue Pill") },
    { text: "3", preset: buttonStylePresets.find(p => p.name === "Aqua Gradient Pill") },
    { text: "4", preset: buttonStylePresets.find(p => p.name === "Green Mint") },
    { text: "True", preset: buttonStylePresets.find(p => p.name === "Green Success") },
    { text: "False", preset: buttonStylePresets.find(p => p.name === "Wine Red") },
    { text: "A", preset: buttonStylePresets.find(p => p.name === "Purple Blue") },
    { text: "B", preset: buttonStylePresets.find(p => p.name === "Sunset") },
  ];

  const generateButtonHTML = (text: string, styles: Record<string, string>) => {
    const styleString = Object.entries(styles)
      .filter(([_, value]) => value && value !== 'auto')
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
    
    return `<button style="${styleString}">${text}</button>`;
  };

  const handleSuggestionClick = (text: string, preset: any) => {
    if (preset) {
      const buttonHTML = generateButtonHTML(text, preset.styles);
      onSuggestionClick(buttonHTML);
    }
  };

  const getSizeMultiplier = () => {
    switch (size) {
      case "sm": return 0.7;
      case "lg": return 1.3;
      default: return 1;
    }
  };

  const multiplier = getSizeMultiplier();

  return (
    <div className={className}>
      {showTitle && (
        <div 
          className="mb-2 cursor-pointer flex items-center justify-between p-2 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Quick Style Presets</span>
            <span className="text-xs text-gray-400">({suggestions.length} buttons)</span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </div>
      )}
      
      {!isCollapsed && (
        <>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => 
              suggestion.preset ? (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text, suggestion.preset)}
                  style={{
                    ...suggestion.preset.styles,
                    transform: `scale(${multiplier * 0.8})`,
                  } as React.CSSProperties}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title={`Click to apply ${suggestion.preset.name} style`}
                >
                  {suggestion.text}
                </button>
              ) : null
            )}
          </div>
          
          {showTitle && (
            <p className="text-xs text-gray-500 mt-1">
              Click any button above to insert it into your content with professional styling.
            </p>
          )}
        </>
      )}
    </div>
  );
}
