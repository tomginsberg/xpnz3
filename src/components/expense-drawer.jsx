import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {init, SearchIndex} from 'emoji-mart'
import React, {useEffect, useState} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {categories, currencies} from "@/api/client.js";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {MultiSelect} from "@/components/ui/multi-select";
import {Switch} from "@/components/ui/switch";
import CalculatorInput from "./calculator-input";
import {Check, PlusCircle, Save, SquareArrowUpLeft, Trash2} from 'lucide-react';
import {cn} from "@/lib/utils";
import {CalendarIcon} from "@radix-ui/react-icons"
import {format} from "date-fns"
import {Calendar} from "@/components/ui/calendar";
import {ConfettiButton} from "@/components/ui/confetti";
import {Dialog, DialogContent, DialogTrigger} from "@/components/ui/dialog";
import useEmojiSearch from "@/hooks/emoji-search";


export default function ExpenseDrawer({
                                          selectedExpense,
                                          isDrawerOpen,
                                          isEditMode,
                                          handleCloseDrawer,
                                          members,
                                          onDeleteClick
                                      }) {
    const [income, setIncome] = useState(selectedExpense.income);
    const [name, setName] = useState(selectedExpense.name);
    const [amount, setAmount] = useState(selectedExpense.amount);
    const [date, setDate] = useState(selectedExpense.date);
    const [category, setCategory] = useState(selectedExpense.category);
    const [paidBy, setPaidBy] = useState(selectedExpense.paidBy);
    const [splitBetween, setSplitBetween] = useState(selectedExpense.splitBetween);
    const [currency, setCurrency] = useState(selectedExpense.currency);
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [isUnequalSplit, setIsUnequalSplit] = useState(false);
    const id = selectedExpense.id;
    const { emojiSearch } = useEmojiSearch();

    useEffect(() => {
        setIncome(selectedExpense.income);
        setName(selectedExpense.name);
        setAmount(selectedExpense.amount);
        setDate(selectedExpense.date);
        setCategory(selectedExpense.category);
        setPaidBy(selectedExpense.paidBy);
        setSplitBetween(selectedExpense.splitBetween);
        setCurrency(selectedExpense.currency);
    }, [selectedExpense]);

    const onPaidByMembersChange = (values) => {
        setPaidBy(values.map((member) => {
            const existing = paidBy.find((p) => p.member === member);
            return existing || {member, amount: 0};
        }));
    };

    function handlePaidByChange(value, index) {
        setPaidBy((prev) => {
            const paidBy = [...prev];
            paidBy[index] = {...paidBy[index], amount: value};
            return paidBy;
        });
    }

    const sumContributions = (contributions) => {
        return contributions.reduce((acc, curr) => acc + Number(curr.amount), 0);
    };

    useEffect(() => {

        if (paidBy.length === 1) {
            setAmount(paidBy[0].amount);
        } else if (paidBy.length > 1) {
            setAmount(sumContributions(paidBy));
        }
    }, [paidBy]);


    const onSplitBetweenMembersChange = (values) => {
        setSplitBetween(values.map((member) => {
            const existing = splitBetween.find((s) => s.member === member);
            return existing || {member, weight: 1};
        }));
    }


    function getDrawerTitle(edit) {
        let type = income ? "Income" : "Expense"
        return edit ? "Edit " + type : "Add New " + type
    }

    function handleSubmit(e) {
        e.preventDefault();

        const newExpense = {
            name,
            amount,
            date,
            category,
            paidBy,
            splitBetween,
            currency,
            income,
            id
        }
        // setSelectedExpense(newExpense);
        handleCloseDrawer(newExpense);
    }

    function handleSetCategory(category) {
        setCategory(category);
        setIsCategoryDrawerOpen(false);
    }

    const [isNewCategoryDrawerOpen, setIsNewCategoryDrawerOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [selectedEmoji, setSelectedEmoji] = useState('❓')
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

    useEffect(() => {
        if (isNewCategoryDrawerOpen && newCategoryName) {
            const fetchEmoji = async () => {
                const emoji = await emojiSearch(newCategoryName);
                setSelectedEmoji(emoji); // Update the emoji state
            };

            fetchEmoji();
        }
    }, [newCategoryName, isNewCategoryDrawerOpen, emojiSearch]);


    const handleEmojiClick = (emojiData) => {
        console.log(emojiData)
        setSelectedEmoji(emojiData.native)
        setIsEmojiPickerOpen(false)
    }

    const handleCreateCategory = () => {
        const newCategory = `${selectedEmoji} ${newCategoryName}`
        setCategory(newCategory)
        setNewCategoryName('')
        setSelectedEmoji('❓')
        setIsNewCategoryDrawerOpen(false)
        setIsCategoryDrawerOpen(false)
    }



    const handleAddCategory = async () => {
        const selectedEmoji = await emojiSearch(newCategoryName); // Fetch the emoji
        setSelectedEmoji(selectedEmoji); // Update the emoji state
        setIsCategoryDrawerOpen(false);
        setIsNewCategoryDrawerOpen(true);
    };


    return (
        <Drawer open={isDrawerOpen} onClose={handleCloseDrawer}>
            <DrawerContent className="bg-background text-black dark:text-white max-h-[90%] flex flex-col">
                <DrawerHeader className="text-black dark:text-white">
                    <DrawerTitle>{getDrawerTitle(isEditMode)}</DrawerTitle>
                    <DrawerClose/>
                </DrawerHeader>
                <ScrollArea className="flex-grow overflow-y-auto">
                    <form onSubmit={handleSubmit} className="px-4 space-y-4">
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="name">Name</Label>
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="unequal-split">Income</Label>
                                        <Switch
                                            id="income"
                                            checked={income}
                                            onCheckedChange={setIncome}
                                        />
                                    </div>
                                </div>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={"Expense"}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            setTimeout(() => e.target.blur(), 0);
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex flex-row justify-between gap-2">
                                <div className="flex-grow space-y-2">
                                    <div className="flex-1 space-y-2">
                                        <CalculatorInput
                                            value={amount}
                                            onChange={setAmount}
                                            disabled={paidBy.length > 1}
                                            useLabel={true}
                                            isIncome={income}
                                        />
                                    </div>
                                </div>

                                <div className="flex-shrink space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select>
                                        <SelectTrigger id="currency">
                                            <SelectValue placeholder={currencies['CAD']}/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(currencies).map(([code, flag]) => (
                                                <SelectItem key={code} value={code}>{flag}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>


                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="calButton">Date</Label>
                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <Button
                                            id="calButton"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4"/>
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </DrawerTrigger>
                                    <DrawerContent
                                        className="items-center w-auto p-0 rounded-xl text-black dark:text-white"
                                        align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </DrawerContent>
                                </Drawer>
                            </div>


                            <Drawer open={isCategoryDrawerOpen} onClose={() => setIsCategoryDrawerOpen(false)}>
                                <DrawerTrigger asChild className="dark:border-gray-600">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                setIsCategoryDrawerOpen(true);
                                            }
                                            }
                                        >
                                            {category || 'Select a category'}
                                        </Button>
                                    </div>
                                </DrawerTrigger>
                                <DrawerContent side="bottom">
                                    <DrawerHeader>
                                        <DrawerTitle className="text-primary">Select
                                            Category</DrawerTitle>
                                    </DrawerHeader>
                                    <div className="p-4">
                                        <Command className="bg-background">
                                            <div className="relative">
                                                <CommandInput placeholder="Search category..."
                                                              value={newCategoryName}
                                                              onChangeCapture={(e) => setNewCategoryName(e.target.value)}
                                                />
                                                <Button
                                                    onClick={handleAddCategory}
                                                    variant="ghost"
                                                    className="absolute right-[0.175rem] top-[0.175rem] py-2 px-3"><PlusCircle
                                                    className="size-6"/></Button>
                                            </div>
                                            <CommandList>
                                                <CommandEmpty className="flex flex-row justify-center mt-2 hover:bg-card rounded-lg px-2 py-1"
                                                              onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4 mt-1"/>
                                                    Add new category
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {categories.map((opt) => (
                                                        <CommandItem
                                                            key={opt}
                                                            value={opt}
                                                            onSelect={handleSetCategory}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    opt === category ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {opt}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </div>
                                </DrawerContent>
                            </Drawer>

                            <Drawer open={isNewCategoryDrawerOpen} onClose={() => setIsNewCategoryDrawerOpen(false)}>
                                <DrawerContent>
                                    <DrawerHeader>
                                        <DrawerTitle className="text-primary">Create New Category</DrawerTitle>
                                    </DrawerHeader>
                                    <div className="px-4 pb-4">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <Dialog open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-10 h-10 p-0 text-lg"
                                                        onClick={() => setIsEmojiPickerOpen(true)}
                                                    >
                                                        {selectedEmoji}

                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent side="bottom"
                                                               className="p-0 px-0 w-auto border-none rounded-xl items-center justify-center">
                                                    <Picker data={data} onEmojiSelect={handleEmojiClick}/>
                                                </DialogContent>
                                            </Dialog>


                                            <div className="flex-grow">
                                                <Label htmlFor="categoryName" className="sr-only">Category Name</Label>
                                                <Input
                                                    id="categoryName"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="Enter category name"
                                                    required
                                                    className="text-primary"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-primary">
                                            <DrawerClose asChild>
                                                <Button variant="outline"
                                                        onClick={() => setIsNewCategoryDrawerOpen(false)}
                                                >
                                                    <SquareArrowUpLeft className="size-5"/>
                                                </Button>
                                            </DrawerClose>
                                            <Button onClick={handleCreateCategory
                                            } disabled={!newCategoryName} variant="default">
                                                <PlusCircle className="size-5"/>
                                            </Button>
                                        </div>
                                    </div>
                                </DrawerContent>
                            </Drawer>


                            <div className="space-y-2">
                                <Label>Paid By</Label>
                                <MultiSelect
                                    options={members.map((member) => ({label: member, value: member}))}
                                    defaultValue={selectedExpense.paidBy.map((p) => p.member)}
                                    onValueChange={
                                        onPaidByMembersChange
                                    }
                                />


                                {paidBy.length > 1 &&
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                        {paidBy.map((payer, index) => (
                                            <div key={payer.member}
                                                 className="flex items-center space-x-2 space-y-2">
                                                <div className="flex-grow">
                                                    <CalculatorInput
                                                        value={payer.amount}
                                                        useLabel={true}
                                                        label={payer.member}
                                                        onChange={(value) => handlePaidByChange(value, index)}
                                                    />
                                                </div>
                                            </div>
                                        ))} </div>}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Split Between</Label>
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="unequal-split">Unequal Split</Label>
                                        <Switch
                                            id="unequal-split"
                                            checked={isUnequalSplit}
                                            onCheckedChange={setIsUnequalSplit}
                                        />
                                    </div>
                                </div>

                                <MultiSelect
                                    options={members.map((member) => ({label: member, value: member}))}
                                    defaultValue={splitBetween.map((s) => s.member)}
                                    onValueChange={onSplitBetweenMembersChange}
                                />

                                {isUnequalSplit &&
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">{
                                        splitBetween.map((splitter, index) => (
                                            <div key={splitter.member} className="flex items-center space-x-2">
                                                <div className="flex-grow"><CalculatorInput
                                                    value={splitter.weight}
                                                    onChange={
                                                        (value) => {
                                                            setSplitBetween((prev) => {
                                                                const splitBetween = [...prev];
                                                                splitBetween[index] = {
                                                                    ...splitBetween[index],
                                                                    weight: value
                                                                };
                                                                return splitBetween;
                                                            });
                                                        }
                                                    }
                                                    disabled={!isUnequalSplit}
                                                    useLabel={true}
                                                    label={splitter.member}
                                                /></div>
                                            </div>
                                        ))}
                                    </div>
                                }
                            </div>
                        </div>

                        <DrawerFooter>
                            <div className="flex justify-between w-full">
                                <Button type="button" variant="outline" onClick={handleCloseDrawer}>
                                    <span className="mr-2"><SquareArrowUpLeft className="size-4"/></span> Cancel
                                </Button>
                                <div className="space-x-2">
                                    {isEditMode && (
                                        <Button
                                            onClick={onDeleteClick}
                                            variant="outline">
                                            <span className="mr-2"><Trash2 className="size-4"/></span> Delete
                                        </Button>
                                    )}
                                    <ConfettiButton type="submit" variant="outline">
                                        <span className="mr-2"><Save className="size-4"/></span> Save
                                    </ConfettiButton>
                                </div>
                            </div>
                        </DrawerFooter>
                    </form>
                </ScrollArea>

            </DrawerContent>
        </Drawer>);
}