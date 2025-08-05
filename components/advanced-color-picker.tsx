"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AdvancedColorPickerProps {
  label: string
  color: string
  onChange: (color: string) => void
}

export function AdvancedColorPicker({ label, color, onChange }: AdvancedColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presetColors = [
    "#000000",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#800000",
    "#008000",
    "#000080",
    "#808000",
    "#800080",
    "#008080",
    "#c0c0c0",
    "#808080",
    "#ff9999",
    "#99ff99",
    "#9999ff",
    "#ffff99",
    "#ff99ff",
    "#99ffff",
    "#ffcc99",
    "#cc99ff",
    "#ff6666",
    "#66ff66",
    "#6666ff",
    "#ffff66",
    "#ff66ff",
    "#66ffff",
    "#ffaa66",
    "#aa66ff",
  ]

  return (
    <div>
      <Label>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal bg-transparent"
            style={{ backgroundColor: color === "transparent" ? "#ffffff" : color }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: color === "transparent" ? "#ffffff" : color }}
              />
              {color === "transparent" ? "Transparent" : color}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <div>
              <Label>Color Value</Label>
              <Input value={color} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
            </div>
            <div>
              <Label>Color Picker</Label>
              <input
                type="color"
                value={color === "transparent" ? "#ffffff" : color}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 border rounded cursor-pointer"
              />
            </div>
            <div>
              <Label>Preset Colors</Label>
              <div className="grid grid-cols-8 gap-1 mt-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    onClick={() => onChange(presetColor)}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>
            <Button variant="outline" onClick={() => onChange("transparent")} className="w-full">
              Transparent
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
