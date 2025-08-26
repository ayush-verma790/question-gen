"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AdvancedColorPickerProps {
  color: string
  onChange: (color: string) => void
  label: string
}

 function AdvancedColorPicker({ color, onChange, label }: AdvancedColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color)

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
  ]

  const handleColorChange = (newColor: string) => {
    setCurrentColor(newColor)
    onChange(newColor)
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 p-1 bg-transparent"
            style={{ backgroundColor: currentColor === "transparent" ? "#ffffff" : currentColor }}
          >
            <div className="w-full h-full rounded border-2 border-gray-300 flex items-center justify-center">
              {currentColor === "transparent" && <span className="text-xs text-gray-500">Transparent</span>}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Color Input</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={currentColor === "transparent" ? "#ffffff" : currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 h-8"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Preset Colors</Label>
              <div className="grid grid-cols-8 gap-1 mt-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: presetColor }}
                    onClick={() => handleColorChange(presetColor)}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleColorChange("transparent")} className="flex-1">
                Transparent
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleColorChange("#000000")} className="flex-1">
                Reset
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
export default AdvancedColorPicker
