import {useState} from 'react'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Calculator} from "./calculator"
import {Banknote, HandCoins, Lock, Calculator as CalculatorIcon} from "lucide-react"
import {Drawer, DrawerContent, DrawerTrigger} from '@/components/ui/drawer';

interface CalculatorInputProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    useLabel?: boolean;
    label?: string;
    isIncome?: boolean;
}

export default function CalculatorInput({
                                            value,
                                            onChange,
                                            disabled,
                                            useLabel = false,
                                            label = 'Amount',
                                            isIncome = false,
                                        }: CalculatorInputProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleCalculatorEnter = (value: number) => {
        onChange(value)
        setIsDialogOpen(false)
    }

    // noinspection RequiredAttributes
    return (
        <div className="space-y-2">
            {useLabel && <Label htmlFor="number-input">{label}</Label>}

            <div className="relative">

                {isIncome ? <HandCoins
                    className="z-20 font-light dark:text-white size-5 absolute left-3 top-1/2 mt-[0.4px] transform -translate-y-1/2"/>
                    : <Banknote
                        className="z-20 font-light dark:text-white size-5 absolute left-3 top-1/2 mt-[0.4px] transform -translate-y-1/2"/>}

                <div className="flex space-x-0">

                    <Input
                        id="number-input"
                        type="number"
                        placeholder={'0.00'}
                        value={value}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                        className="pl-10 rounded-r-none z-10"
                        disabled={disabled}
                    />
                    <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DrawerTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={disabled}
                                className='rounded-l-none border-l-0'
                            >
                                {disabled ? <Lock className="h-4 w-4"/> : <CalculatorIcon className="h-4 w-4"/>}
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent >
                            <Calculator
                                initialValue={value.toString()}
                                onEnter={handleCalculatorEnter}
                            />
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>


        </div>
    )
}
