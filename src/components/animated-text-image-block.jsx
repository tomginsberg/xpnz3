import { motion } from "framer-motion"
import React from "react"
import { cn } from "@/lib/utils"

export default function AnimatedTextImageBlock({ title, subtitle, image, imageAlt, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -200, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1 }}
      className={cn("absolute top-48 items-center justify-center w-full", className)}
    >
      <img src={image} alt={imageAlt} width="32" height="32" className="justify-center w-full px-[40%]" />
      <p className="text-2xl text-muted-foreground text-center">{title}</p>
      <p className="text text-foreground/30 text-center">{subtitle}</p>
    </motion.div>
  )
}
