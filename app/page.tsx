'use client'

import { DailyBudgetCard } from "@/components/daily-budget-card"
import { GoalProgressCard } from "@/components/goal-progress-card"
import { RecentTransactionsCard } from "@/components/recent-transactions-card"
import { SmallWishesCard } from "@/components/small-wishes-card"
import { SettingsButton } from "@/components/settings-button"
import { AiCoachChat } from "@/components/ai-coach-chat"
import { LedgerFlipSection } from "@/components/ledger-flip"
import { DailySurplusHandler } from "@/components/daily-surplus-handler"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

export default function DashboardPage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft
      const width = carouselRef.current.offsetWidth
      // Use 0.5 threshold for snapping indication
      const index = Math.round(scrollLeft / width)
      setActiveSlide(index)
    }
  }

  // Smooth scroll to slide
  const scrollToSlide = (index: number) => {
    if (carouselRef.current) {
      const width = carouselRef.current.offsetWidth
      carouselRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      })
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex justify-center overflow-hidden">
      <DailySurplusHandler />
      
      {/* Mobile Container - Fixed 375px */}
      <div className="w-full max-w-[375px] h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative shadow-2xl overflow-hidden border-x border-zinc-800">
        
        {/* Header */}
        <header className="flex-none p-4 pb-2 flex items-center justify-between z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0">
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">有钱花</h1>
          </div>
          <div className="flex items-center gap-2">
             <AiCoachChat />
             <SettingsButton />
          </div>
        </header>

        <LedgerFlipSection>
           <div className="flex flex-col h-full overflow-hidden">
              
              {/* Top Carousel Area - Reduced Height */}
          <div className="flex-none relative h-[200px] mb-2">
            <div 
              ref={carouselRef}
              className="w-full h-full overflow-x-auto snap-x snap-mandatory flex [&::-webkit-scrollbar]:hidden touch-pan-x"
              onScroll={handleScroll}
            >
              {/* Slide 1: Daily Budget */}
              <div className="min-w-full h-full p-4 pr-2 snap-center">
                <DailyBudgetCard className="h-full shadow-lg border-0" />
              </div>

              {/* Slide 2: Piggy Bank */}
              <div className="min-w-full h-full p-4 pl-2 snap-center">
                <GoalProgressCard className="h-full shadow-lg border-0" minimal={true} /> 
              </div>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none z-20">
              <div 
                className={cn("h-1 rounded-full transition-all duration-300 shadow-sm", activeSlide === 0 ? "bg-white w-4" : "bg-white/40 w-1")} 
              />
              <div 
                className={cn("h-1 rounded-full transition-all duration-300 shadow-sm", activeSlide === 1 ? "bg-zinc-800 dark:bg-white w-4" : "bg-zinc-300 dark:bg-white/40 w-1")} 
              />
            </div>
          </div>

          {/* Bottom Scroll Area - Flex Column - Clean Layout */}
          <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 space-y-1 overflow-hidden">
            
            {/* Wishes (Middle, Compact, Transparent) */}
          <div className="flex-none h-[110px] flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden rounded-2xl">
              <SmallWishesCard limit={3} className="shadow-none border-0 h-full" />
            </div>
          </div>

          {/* Transactions (Bottom) */}
          <div className="flex-1 min-h-[140px] flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <RecentTransactionsCard limit={5} />
            </div>
          </div>

          </div>

           </div>
        </LedgerFlipSection>

      </div>
    </main>
  )
}
