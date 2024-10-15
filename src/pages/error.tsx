import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Error() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[420px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>We apologize, but there was an error while fetching your expense data.</CardDescription>
        </CardHeader>
        {/*<CardContent>*/}
        {/*  <p className="text-sm text-muted-foreground">Error details: {error.message || "Unknown error occurred"}</p>*/}
        {/*</CardContent>*/}
        <CardFooter>
          <Button onClick={() => navigate("/")} className="w-full">
            <Home className="size-5 me-1" /> Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
