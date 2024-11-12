"use client"

import React, { KeyboardEvent, useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TagInputProps {
  tags: string[]
  setTags: React.Dispatch<React.SetStateAction<string[]>>
  placeholder?: string
  maxTags?: number
  onTagAdd?: (tag: string) => void
  onTagRemove?: (tag: string) => void
}

export function TagInput({
  tags,
  setTags,
  placeholder = "Enter a tag...",
  maxTags = Infinity,
  onTagAdd,
  onTagRemove
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue !== "" && !tags.includes(trimmedValue) && tags.length < maxTags) {
      const newTags = [...tags, trimmedValue]
      setTags(newTags)
      setInputValue("")
      onTagAdd?.(trimmedValue)
    }
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const removeTag = (indexToRemove: number) => {
    const removedTag = tags[indexToRemove]
    setTags(tags.filter((_, index) => index !== indexToRemove))
    onTagRemove?.(removedTag)
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Input
          type="text"
          autoFocus={true}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="w-full pr-10 text-primary"
          aria-label="Tag input"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-primary"
          onClick={addTag}
          disabled={inputValue.trim() === "" || tags.includes(inputValue.trim()) || tags.length >= maxTags}
          aria-label="Add tag"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-primary text-primary-foreground rounded-md"
          >
            <span>{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-4 h-4 p-0 hover:bg-primary-foreground/20"
              onClick={() => removeTag(index)}
            >
              <X className="w-3 h-3" />
              <span className="sr-only">Remove {tag}</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
