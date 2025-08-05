"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const predefinedColors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 border-2 bg-transparent"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="grid grid-cols-4 gap-2">
          {predefinedColors.map((presetColor) => (
            <button
              key={presetColor}
              className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
              style={{ backgroundColor: presetColor }}
              onClick={() => {
                onChange(presetColor)
                setIsOpen(false)
              }}
            />
          ))}
        </div>
        <div className="mt-4">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 rounded border"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
