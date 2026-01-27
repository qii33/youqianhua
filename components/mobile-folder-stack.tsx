"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StackItem {
  id: string
  color: string
  component: React.ReactNode
}

interface MobileFolderStackProps {
  items: StackItem[]
}

export function MobileFolderStack({ items }: MobileFolderStackProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="w-full h-full flex flex-col gap-4 relative z-0" ref={containerRef}>
      <div className="relative w-full flex flex-col items-center pt-4 isolate">
        {items.map((item, index) => {
          // Calculate stack offset
          // We want them to overlap, so negative margin
          // But since they are in a flex col, we can use negative gap or margin-top
          // Framer motion is better with absolute positioning for the stack to control z-index perfectly
          
          const isExpanded = activeId === item.id
          
          return (
            <motion.div
              key={item.id}
              layoutId={`card-container-${item.id}`}
              onClick={() => !activeId && setActiveId(item.id)}
              className={cn(
                "w-full relative bg-card rounded-3xl overflow-hidden shadow-lg border border-border/50",
                // Stack styles
                !activeId && "cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform",
                // Hide non-active cards when one is expanded (optional, or just let them stay behind)
                activeId && !isExpanded && "opacity-0 pointer-events-none"
              )}
              initial={false}
              animate={{
                marginTop: index === 0 ? 0 : -180, // Large negative margin for tight stacking
                scale: 1 - (items.length - 1 - index) * 0.05, // Back items are smaller
                zIndex: index, // Front items are on top
                y: 0, 
              }}
              style={{
                // If expanded, this specific element in the stack flow becomes invisible 
                // because we render the expanded version in the overlay.
                opacity: isExpanded ? 0 : 1
              }}
            >
              {/* Header Strip for color/identity */}
              <div 
                className={cn("h-4 w-full opacity-80", item.color)} 
              />
              
              {/* Content Preview */}
              <div className={cn(
                "overflow-hidden pointer-events-none p-1 bg-card",
                index === items.length - 1 ? "h-[400px]" : "h-[220px]"
              )}>
                 {item.component}
              </div>
              
              {/* Glass overlay on bottom of card to suggest more content (only for non-last items) */}
              {index !== items.length - 1 && (
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Expanded Overlay */}
      <AnimatePresence>
        {activeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 isolate">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setActiveId(null)}
            />

            {/* Expanded Card */}
            {items.map((item) => {
              if (item.id !== activeId) return null
              
              return (
                <motion.div
                  key={item.id}
                  layoutId={`card-container-${item.id}`}
                  className="w-full max-w-lg h-[85vh] bg-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-border/50"
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (offset.y > 100 || velocity.y > 500) {
                      setActiveId(null)
                    }
                  }}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full z-50 opacity-50" />
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-50 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveId(null)
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>

                  {/* Full Content */}
                  <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
                    {item.component}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
