import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckIcon, XCircle, ChevronDown, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput
} from "@/components/ui/command"

const multiSelectVariants = cva("m-1 transition ease-in-out delay-150", {
  variants: {
    variant: {
      default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
      secondary: "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      inverted: "inverted"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

interface MultiSelectOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  options: MultiSelectOption[]
  value: string[] // Now we rely on the parent to control this
  onValueChange: (value: string[]) => void
  placeholder?: string
  maxCount?: number
  className?: string
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      variant,
      placeholder = "Select options",
      maxCount = 3,
      className,
      ...props
    },
    ref
  ) => {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

    const toggleOption = (option: string) => {
      const newSelectedValues = value.includes(option) ? value.filter((v) => v !== option) : [...value, option]
      onValueChange(newSelectedValues)
    }

    const handleClear = () => {
      onValueChange([])
    }

    const handleToggleDrawer = () => {
      setIsDrawerOpen((prev) => !prev)
    }

    const clearExtraOptions = () => {
      const newSelectedValues = value.slice(0, maxCount)
      onValueChange(newSelectedValues)
    }

    const toggleAll = () => {
      if (value.length === options.length) {
        handleClear()
      } else {
        const allValues = options.map((option) => option.value)
        onValueChange(allValues)
      }
    }

    return (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}  onClose={() => setIsDrawerOpen(false)}>
        <DrawerTrigger asChild>
          <Button
            ref={ref}
            {...props}
            onClick={handleToggleDrawer}
            className={cn(
              "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
              className
            )}
          >
            {value.length > 0 ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap items-center">
                  {value.slice(0, maxCount).map((val) => {
                    const option = options.find((o) => o.value === val)
                    const IconComponent = option?.icon
                    return (
                      <Badge
                        key={val}
                        className={cn(
                          multiSelectVariants({ variant }),
                          "bg-background"
                        )}
                      >
                        {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                        {option?.label}
                        <XCircle
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleOption(val)
                          }}
                        />
                      </Badge>
                    )
                  })}
                  {value.length > maxCount && (
                    <Badge
                      className={cn(multiSelectVariants({ variant }))}
                    >
                      {`+ ${value.length - maxCount} more`}
                      <XCircle
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation()
                          clearExtraOptions()
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <XIcon
                    className="h-4 mx-2 cursor-pointer text-muted-foreground"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleClear()
                    }}
                  />
                  <Separator orientation="vertical" className="flex min-h-6 h-full" />
                  <ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full mx-auto">
                <span className="text-sm text-muted-foreground mx-3">{placeholder}</span>
                <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
              </div>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent aria-describedby="category picker creator">
                  <DrawerHeader>
                    <DrawerTitle className="text-primary hidden">Select Members</DrawerTitle>
                  </DrawerHeader>
          <Command className="bg-background px-2">
            
                <CommandInput placeholder="Search members..." className="w-full" autoFocus={false}/>
        
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem key="all" onSelect={toggleAll} className="cursor-pointer">
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          value.length === options.length
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <span>(Select All)</span>
                    </CommandItem>
                    {options.map((option) => {
                      const isSelected = value.includes(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => toggleOption(option.value)}
                          className="cursor-pointer"
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                          <span>{option.label}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
          </Command>
        </DrawerContent>
      </Drawer>
    )
  }
)

MultiSelect.displayName = "MultiSelect"
