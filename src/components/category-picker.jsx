import { useEffect, useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { PlusCircle, SquareArrowUpLeft } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Picker from "@emoji-mart/react"
import emojiData from "@emoji-mart/data"

import useEmojiSearch from "@/hooks/emoji-search"

import { Slot } from "@radix-ui/react-slot"

function CategoryPickerSelector({
  categories,
  inputValue,
  onChangeCapture,
  onPlusButtonClick,
  onCategorySelect,
  className
}) {
  return (
    <Command className={cn("bg-background", className)}>
      <div className="relative">
        <CommandInput placeholder="Search category..." value={inputValue} onChangeCapture={onChangeCapture} />
        <Button
          onClick={onPlusButtonClick}
          variant="ghost"
          className="absolute right-[0.175rem] top-[0.175rem] py-2 px-3"
        >
          <PlusCircle className="size-6" />
        </Button>
      </div>
      <CommandList>
        <CommandEmpty
          className="flex flex-row justify-center mt-2 hover:bg-card rounded-lg px-2 py-1"
          onClick={onPlusButtonClick}
        >
          <PlusCircle className="mr-2 h-4 w-4 mt-1" />
          Add new category
        </CommandEmpty>
        <CommandGroup>
          {categories.map((category, index) => (
            <CommandItem key={index} value={category} onSelect={onCategorySelect}>
              {category}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function CategoryPickerCreator({
  inputValue,
  emojiValue,
  onInputChange,
  onEmojiChange,
  onBackButtonClick,
  onAddButtonClick,
  className
}) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const handleEmojiChange = (emoji) => {
    onEmojiChange(emoji)
    setEmojiPickerOpen(false)
  }

  return (
    <div className={cn("px-4 pb-4", className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Dialog open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-10 h-10 p-0 text-lg" onClick={() => setEmojiPickerOpen(true)}>
              {emojiValue}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="p-0 w-auto border-none rounded-xl items-center justify-center"
            aria-describedby="emoji picker"
          >
            <DialogTitle className="sr-only">Emoji Picker</DialogTitle>
            <Picker data={emojiData} onEmojiSelect={handleEmojiChange} />
          </DialogContent>
        </Dialog>

        <div className="flex-grow">
          <Label htmlFor="categoryName" className="sr-only">
            Category Name
          </Label>
          <Input
            value={inputValue}
            onChange={onInputChange}
            placeholder="Enter category name"
            required
            className="text-primary"
          />
        </div>
      </div>
      <div className="flex justify-between text-primary">
        <Button variant="outline" onClick={onBackButtonClick}>
          <SquareArrowUpLeft className="size-5" />
        </Button>
        <Button onClick={onAddButtonClick} disabled={inputValue.length === 0}>
          <PlusCircle className="size-5" />
        </Button>
      </div>
    </div>
  )
}

export function CategoryPicker({
  categories,
  selectedCategory,
  onSelectedCategoryChange,
  onAddCategory,
  asChild,
  ...props
}) {
  const { emojiSearch } = useEmojiSearch()

  const [isSelectDrawerOpen, setIsSelectDrawerOpen] = useState(false)
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)

  const [inputValue, setInputValue] = useState("")
  const [emojiValue, setEmojiValue] = useState("❓")

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  useEffect(() => {
    ;(async () => {
      if (inputValue.length !== 0) {
        setEmojiValue(await emojiSearch(inputValue))
      }
    })()
  }, [emojiSearch, inputValue])

  useEffect(() => {
    setEmojiValue("❓")
    setInputValue("")
  }, [selectedCategory])

  const handlePlusButtonClick = () => {
    setIsSelectDrawerOpen(false)
    setIsCreateDrawerOpen(true)
  }

  const handleEmojiChange = (emoji) => {
    setEmojiValue(emoji.native)
  }

  const handleBackButtonClick = () => {
    setIsCreateDrawerOpen(false)
    setIsSelectDrawerOpen(true)
  }

  const handleAddButtonClick = () => {
    const newCategory = `${emojiValue} ${inputValue}`

    onAddCategory && onAddCategory(newCategory)
    setIsCreateDrawerOpen(false)
    setIsSelectDrawerOpen(false)
  }

  const handleCategorySelect = (category) => {
    onSelectedCategoryChange && onSelectedCategoryChange(category)
    setIsSelectDrawerOpen(false)
  }

  const CategoryPickerButton = (props) => (
    <Button type="button" variant="outline" className="w-full justify-start" {...props}>
      {selectedCategory ? selectedCategory : <span className="text-muted-foreground">Select a category</span>}
    </Button>
  )

  const CategoryPickerTrigger = asChild ? Slot : CategoryPickerButton

  return (
    <>
      <CategoryPickerTrigger {...props} onClick={() => setIsSelectDrawerOpen(true)} />
      <Drawer open={isSelectDrawerOpen} onClose={() => setIsSelectDrawerOpen(false)}>
        <DrawerContent aria-describedby="category picker">
          <DrawerHeader>
            <DrawerTitle className="text-primary">Select Category</DrawerTitle>
          </DrawerHeader>
          <CategoryPickerSelector
            categories={categories}
            inputValue={inputValue}
            selectedCategory={selectedCategory}
            onChangeCapture={handleInputChange}
            onPlusButtonClick={handlePlusButtonClick}
            onCategorySelect={handleCategorySelect}
            className="px-4"
          />
        </DrawerContent>
      </Drawer>
      <Drawer open={isCreateDrawerOpen} onClose={() => setIsCreateDrawerOpen(false)}>
        <DrawerContent aria-describedby="category picker creator">
          <DrawerHeader>
            <DrawerTitle className="text-primary ">Create Category</DrawerTitle>
          </DrawerHeader>
          <CategoryPickerCreator
            inputValue={inputValue}
            emojiValue={emojiValue}
            onInputChange={handleInputChange}
            onEmojiChange={handleEmojiChange}
            onBackButtonClick={handleBackButtonClick}
            onAddButtonClick={handleAddButtonClick}
            className="mx-4"
          />
        </DrawerContent>
      </Drawer>
    </>
  )
}
