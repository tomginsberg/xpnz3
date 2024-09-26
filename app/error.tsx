'use client'

import {useEffect} from 'react'
import {Button} from "@/components/ui/button"
import {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from "@/components/ui/card"
import {AlertCircle} from 'lucide-react'

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[420px]">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-destructive"/>
                        <CardTitle>Something went wrong!</CardTitle>
                    </div>
                    <CardDescription>
                        We apologize, but there was an error while fetching your expense data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Error details: {error.message || "Unknown error occurred"}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={() => reset()}
                        className="w-full"
                    >
                        Try again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}