import {useState, useEffect} from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {Button} from "@/components/ui/button";
import {PlusCircle, SquareArrowUpLeft} from "lucide-react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";

import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";

import useEmojiSearch from "@/hooks/emoji-search";

function CategoryPickerSelector (
  {
    categories,
    inputValue,
    selectedCategory,
    onChangeCapture,
    onPlusButtonClick,
    onCategorySelect,
  }
) {

  return (
    <Command className="bg-background">
      <div className="relative">
        <CommandInput placeholder="Search category..." value={inputValue} onChangeCapture={onChangeCapture}/>
        <Button onClick={onPlusButtonClick} variant="ghost" className="absolute right-[0.175rem] top-[0.175rem] py-2 px-3">
          <PlusCircle className="size-6" />
        </Button>
      </div>
      <CommandList>
        <CommandEmpty className="flex flex-row justify-center mt-2 hover:bg-card rounded-lg px-2 py-1" onClick={onPlusButtonClick}>
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
  );
};

function CategoryPickerCreator (
  {
    inputValue,
    emojiValue,
    onInputChange,
    onEmojiChange,
    onBackButtonClick,
    onAddButtonClick,
  }
) {

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleEmojiChange = (emoji) => {
    onEmojiChange(emoji);
    setEmojiPickerOpen(false);
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center space-x-2 mb-4">
        <Dialog open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-10 h-10 p-0 text-lg" onClick={() => setEmojiPickerOpen(true)}>
              {emojiValue}
            </Button>
          </DialogTrigger>
          <DialogContent side="bottom" className="p-0 w-auto border-none rounded-xl items-center justify-center">
            <Picker data={emojiData} onEmojiSelect={handleEmojiChange} />
          </DialogContent>
        </Dialog>

        <div className="flex-grow">
          <Label htmlFor="categoryName" className="sr-only">Category Name</Label>
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
  );
};

export function CategoryPicker 
(
  {
    categories,
    selectedCategory,
    onSelectedCategoryChange,
    onAddCategory,
  }
) {
  const {emojiSearch} = useEmojiSearch();

  const [isSelectDrawerOpen, setIsSelectDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [emojiValue, setEmojiValue] = useState('❓');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    (async () => {
      if (inputValue.length !== 0) {
        setEmojiValue(await emojiSearch(inputValue));
      }
    })();
  }, [inputValue]);

  useEffect(() => {
    setEmojiValue('❓')
    setInputValue('');
  }, [selectedCategory]);

  const handlePlusButtonClick = () => {
    setIsSelectDrawerOpen(false);
    setIsCreateDrawerOpen(true);
  };

  const handleEmojiChange = (emoji) => {
    setEmojiValue(emoji.native);
  };

  const handleBackButtonClick = () => {
    setIsCreateDrawerOpen(false);
    setIsSelectDrawerOpen(true);
  };

  const handleAddButtonClick = () => {
    const newCategory = `${emojiValue} ${inputValue}`;

    onAddCategory && onAddCategory(newCategory);
    setIsCreateDrawerOpen(false);
    setIsSelectDrawerOpen(false);
  };

  const handleCategorySelect = (category) => {
    onSelectedCategoryChange && onSelectedCategoryChange(category);
    setIsSelectDrawerOpen(false);
  };

  return (
    <>
    <Drawer open={isSelectDrawerOpen} onClose={() => setIsSelectDrawerOpen(false)}>
      <div className="space-y-2">
        <Label>Category</Label>
        <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setIsSelectDrawerOpen(true)}>
          {selectedCategory}
        </Button>
      </div>
      <DrawerContent side="bottom">
        <DrawerHeader><DrawerTitle>Select Category</DrawerTitle></DrawerHeader>
        <CategoryPickerSelector
          categories={categories}
          inputValue={inputValue}
          selectedCategory={selectedCategory}
          onChangeCapture={handleInputChange}
          onPlusButtonClick={handlePlusButtonClick}
          onCategorySelect={handleCategorySelect}
        />
      </DrawerContent>
    </Drawer>
    <Drawer open={isCreateDrawerOpen} onClose={() => setIsCreateDrawerOpen(false)}>
      <DrawerContent side="bottom">
        <CategoryPickerCreator
          inputValue={inputValue}
          emojiValue={emojiValue}
          onInputChange={handleInputChange}
          onEmojiChange={handleEmojiChange}
          onBackButtonClick={handleBackButtonClick}
          onAddButtonClick={handleAddButtonClick}
        />
      </DrawerContent>
    </Drawer>
    </>
  );
}
