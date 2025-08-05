"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

interface AdvancedColorPickerProps {
  color: string
  onChange: (color: string) => void
  label?: string
}

export function AdvancedColorPicker({ color, onChange, label }: AdvancedColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(50)
  const [alpha, setAlpha] = useState(1)

  const predefinedColors = [
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
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#dda0dd",
    "#98d8c8",
    "#f7dc6f",
  ]

  const gradientColors = [
    "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
    "linear-gradient(45deg, #667eea, #764ba2)",
    "linear-gradient(45deg, #f093fb, #f5576c)",
    "linear-gradient(45deg, #4facfe, #00f2fe)",
    "linear-gradient(45deg, #43e97b, #38f9d7)",
    "linear-gradient(45deg, #fa709a, #fee140)",
  ]

  const handleHslChange = () => {
    const hslColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
    onChange(hslColor)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-12 h-8 p-0 border-2 bg-transparent"
              style={{ background: color }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label>Predefined Colors</Label>
                <div className="grid grid-cols-8 gap-1 mt-2">
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
              </div>

              <div>
                <Label>Gradients</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {gradientColors.map((gradient, index) => (
                    <button
                      key={index}
                      className="w-full h-8 rounded border-2 hover:scale-105 transition-transform"
                      style={{ background: gradient }}
                      onClick={() => {
                        onChange(gradient)
                        setIsOpen(false)
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Hue: {hue}</Label>
                  <Slider
                    value={[hue]}
                    onValueChange={(value) => {
                      setHue(value[0])
                      handleHslChange()
                    }}
                    max={360}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Saturation: {saturation}%</Label>
                  <Slider
                    value={[saturation]}
                    onValueChange={(value) => {
                      setSaturation(value[0])
                      handleHslChange()
                    }}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Lightness: {lightness}%</Label>
                  <Slider
                    value={[lightness]}
                    onValueChange={(value) => {
                      setLightness(value[0])
                      handleHslChange()
                    }}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Alpha: {alpha}</Label>
                  <Slider
                    value={[alpha]}
                    onValueChange={(value) => {
                      setAlpha(value[0])
                      handleHslChange()
                    }}
                    max={1}
                    step={0.01}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Custom Color</Label>
                <input
                  type="color"
                  value={color.startsWith("#") ? color : "#000000"}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full h-10 rounded border mt-2"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter color value"
          className="flex-1"
        />
      </div>
    </div>
  )
}
