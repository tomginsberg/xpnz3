// app/[ledger]/members/page.jsx

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Edit, Trash2, UserRoundCheck, UserRoundPlus } from "lucide-react"
import { useXpnzApi } from "@/hooks/use-xpnz-api.js"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useToast } from "@/hooks/use-toast.ts"
import { useParams } from "react-router-dom"

function MembersRow(props) {
  const { member, onSubmit, onDelete, className } = props
  const { name, balance, paid } = member
  const { toast } = useToast()

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
      console.log("submitting", newName)
      onSubmit && (await onSubmit(member, newName))
      setNewName(name)
    }

    setIsEditing(!isEditing)
  }

  function handleDelete() {
    if (balance !== 0) {
      toast({
        title: "Cannot delete member",
        description: "Balance must be zero.",
        variant: "default"
      })
    } else {
      onDelete(member)
      toast({
        title: "Member deleted",
        description: `${name}`,
        variant: "default"
      })
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`flex ${className} items-center rounded-lg bg-card px-4 py-3`}>
          <form className="flex-row flex items-center justify-end w-full" onSubmit={handleSubmit}>
            <div className="flex-grow">
              <Input
                className="bg-card shadow-none focus-visible:ring-0 text-gray-900 dark:text-white focus-visible:ring-transparent border-none px-0 py-0 focus-visible:ring-offset-0 ring-0 text-2xl font-bold w-full disabled:opacity-100 disabled:cursor-text"
                value={isEditing ? newName : name}
                onChange={(e) => setNewName(e.target.value)}
                ref={inputRef}
                disabled={!isEditing}
              />

              <p className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400">
                {balance === 0 ? "✓ settled up" : balance > 0 ? `↑ ${balanceString}` : `↓ ${balanceString}`}
                {" • "}
                {`${paidString} all time`}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="mx-1" onClick={handleSubmit} type="button">
              <AnimatePresence mode="wait" initial={false}>
                {isEditing ? (
                  <motion.div
                    key="check"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UserRoundCheck className="text-gray-700 dark:text-gray-200" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Edit className="text-gray-700 dark:text-gray-200" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isEditing ? (
          <ContextMenuItem
            onSelect={() => {
              setIsEditing(false)
            }}
          >
            <UserRoundCheck className="mr-2 h-4 w-4" />
            <span>Save</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onSelect={() => {
              setIsEditing(true)
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => handleDelete(member)}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

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
        className={`flex flex-row ${className} justify-between rounded-lg bg-card px-4 py-2 relative
          ${isDuplicate ? "ring-1 ring-red-500" : ""}`}
      >
        <div className="relative flex-1">
          <Input
            className="bg-card shadow-none focus-visible:ring-0 peer text-gray-900 dark:text-white focus-visible:ring-transparent border-none px-0 py-0 focus-visible:ring-offset-0 ring-0 text-2xl font-bold w-full"
            placeholder={placeholder}
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mx-1" disabled={!name.trim() || isDuplicate} type="submit">
            <UserRoundPlus className="text-gray-700 dark:text-gray-200" />
          </Button>
        </div>
      </div>
    </form>
  )
}

export default function MembersPage() {
  const { ledgerName } = useParams()
  const { balance: trueBalance, pushMember, deleteMember, editMember } = useXpnzApi(ledgerName)

  const [balance, setBalance] = useState(trueBalance)

  useEffect(() => {
    setBalance(trueBalance)
  }, [trueBalance])

  async function onDelete({ id }) {
    await deleteMember(id)
  }

  async function onSubmit(member, newName) {
    if (member.name === newName) return

    // optimistically update the name
    // by finding the index of the member in the balance array
    // and updating the name in the balance array
    const index = balance.findIndex((m) => m.id === member.id)
    const newBalance = [...balance]
    newBalance[index] = { ...newBalance[index], name: newName }
    setBalance(newBalance)

    await editMember(member.id, newName)
  }

  async function onAdd(name) {
    await pushMember(name)
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
