import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  const items = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    height: Math.floor(Math.random() * 3) + 2 // Random height between 2 and 4
  }))

  return (
    <div className="px-4 pt-[120px]">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[50px]">
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
