import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Error({ message }: { message?: string }) {
  const defaultMsg = "We apologize, but there was an error while fetching your expense data."
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-[420px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>{message || defaultMsg}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate("/")} className="w-full">
            <Home className="size-5 me-1" /> Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
