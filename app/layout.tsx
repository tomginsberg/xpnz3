"use client";
import type {Metadata} from "next";
import localFont from "next/font/local";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider"

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <head>
            <meta charSet="UTF-8"/>
            <link
                rel="icon"
                type="image/svg+xml"
                href="https://www.svgrepo.com/show/397523/money-with-wings.svg"
            />
            <meta property="og:title" content="xpnz"/>
            <meta property="og:description" content="Group Tabs Made Easy!"/>
            <meta property="og:image" content="https://xpnz.titanium.ddns.me/og.svg"/>
            <meta property="og:type" content="website"/>
            <meta property="og:url" content="https://xpnz.titanium.ddns.me"/>

            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>xpnz</title>
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black`}
        >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
