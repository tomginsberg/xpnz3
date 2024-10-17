// app/[ledger]/members/page.jsx

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { UserRoundCheck, UserRoundPen, UserRoundPlus, UserRoundX } from "lucide-react"
import { useXpnzApi } from "@/hooks/use-xpnz-api.js"

function MembersRow(props) {
  const { member, onSubmit, onDelete, className } = props
  const { name, balance, paid } = member

  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(name)

  const inputRef = useRef(null)

  const balanceString = `$${Math.abs(balance).toLocaleString()}`
  const paidString = `$${Math.abs(paid).toLocaleString()}`

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Optionally, move the cursor to the end
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isEditing) {
      onSubmit && (await onSubmit(member, newName))
      setNewName(name)
    }

    setIsEditing(!isEditing)
  }

  return (
    <div className={`flex ${className} items-center rounded-lg bg-card px-4 py-3`}>
      <form className="flex-1 flex items-center" onSubmit={handleSubmit}>
        <div className="flex-1">
          {isEditing ? (
            <Input
              className="bg-card tracking-tight shadow-none focus-visible:ring-0 text-gray-900 dark:text-white border-none p-0 ring-0 text-2xl font-bold w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              ref={inputRef}
            />
          ) : (
            <h2 className="flex-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white py-[2px]">{name}</h2>
          )}
          <p className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400">
            {balance === 0 ? "✓ settled up" : balance > 0 ? `↑ ${balanceString}` : `↓ ${balanceString}`}
            {" • "}
            {`${paidString} all time`}
          </p>
        </div>
        <Button variant="outline" size="icon" className="mx-1">
          {isEditing ? (
            <UserRoundCheck className="text-gray-700 dark:text-gray-200" />
          ) : (
            <UserRoundPen className="text-gray-700 dark:text-gray-200" />
          )}
        </Button>
      </form>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block mx-1">
              <Button
                variant="destructive"
                size="icon"
                disabled={member.balance !== 0}
                onClick={async () => onDelete && (await onDelete(member))}
              >
                <UserRoundX />
              </Button>
            </div>
          </TooltipTrigger>
          {member.balance !== 0 && (
            <TooltipContent>
              <p>Balance must be zero.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// relies on animate-blink defined in tailwind.config.js
const FakeCursor = () => (
  <span className="absolute focus:hidden peer-focus:hidden flex top-[0.3rem] left-0 h-[1.6rem] w-px bg-white animate-blink"></span>
)

function MembersAdd(props) {
  const { onAdd, placeholder, existingMembers, className } = props
  const [name, setName] = useState("")

  const isDuplicate = existingMembers ? existingMembers.includes(name.trim()) : false

  const handleAdd = async (e) => {
    e.preventDefault()
    onAdd && (await onAdd(name))
    setName("")
  }

  return (
    <form onSubmit={handleAdd}>
      <div
        className={`flex flex-row ${className} justify-between rounded-lg bg-linear-foreground px-4 py-2 relative
          ${isDuplicate ? "ring-1 ring-red-500" : ""}`}
      >
        <div className="relative flex-1">
          <Input
            className="bg-linear-foreground shadow-none focus-visible:ring-0 peer text-gray-900 dark:text-white focus-visible:ring-transparent border-none px-0 py-0 focus-visible:ring-offset-0 ring-0 text-2xl font-bold w-full"
            placeholder={placeholder}
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </div>
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mx-1" disabled={!name.trim() || isDuplicate} type="submit">
            <UserRoundPlus className="text-gray-700 dark:text-gray-200" />
          </Button>
        </div>
      </div>
    </form>
  )
}

export default function MembersPage({ ledgerName }) {
  const { balance, pushMember, deleteMember, editMember } = useXpnzApi(ledgerName)

  async function onDelete({ id }) {
    await deleteMember(id)
  }

  async function onSubmit(member, newName) {
    if (member.name === newName) return
    await editMember(member.id, newName)
  }

  const MembersRows = () => {
    if (balance === undefined) return <></>

    return balance.map((m) => (
      <MembersRow key={m.id} className="mt-3" member={m} onDelete={onDelete} onSubmit={onSubmit} />
    ))
  }

  return (
    <div className="mt-[73px] p-3">
      <MembersAdd
        placeholder="Add member"
        onAdd={pushMember}
        existingMembers={balance ? balance.map((m) => m.name) : []}
      />
      <MembersRows />
    </div>
  )
}
