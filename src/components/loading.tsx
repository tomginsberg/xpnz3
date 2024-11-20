import { Skeleton } from "@/components/ui/skeleton"
import { useLocation } from "react-router-dom"

export function MasonaryLoading() {
  const items = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    height: Math.floor(Math.random() * 3) + 2 // Random height between 2 and 4
  }))

  return (
    <div className="px-4 mt-[150px]">
      <Skeleton className="rounded-lg w-full h-12 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 auto-rows-[50px]">
        {items.map((item) => (
          <Skeleton
            key={item.id}
            className="rounded-lg w-full h-full"
            style={{
              gridRow: `span ${item.height}`
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function FlatLoading() {
  const items = Array.from({ length: 6 }, (_, i) => ({
    id: i
  }))

  return (
    <div className="px-2 mt-[85px]">
      {items.map((item) => (
        <Skeleton key={item.id} className="rounded-lg w-full h-20 p-4 my-3" />
      ))}
    </div>
  )
}

export default function Loading() {
  const location = useLocation()
  const pathSegments = location.pathname.split("/")
  const pageType = pathSegments[2] || "expenses"

  return <>{pageType == "expenses" ? MasonaryLoading() : FlatLoading()}</>
}
