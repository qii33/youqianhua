'use client'

import { DailyBudgetCard } from "@/components/daily-budget-card"
import { GoalProgressCard } from "@/components/goal-progress-card"
import { RecentTransactionsCard } from "@/components/recent-transactions-card"
import { SmallWishesCard } from "@/components/small-wishes-card"
import { SettingsButton } from "@/components/settings-button"
import { AiCoachChat } from "@/components/ai-coach-chat"
import { LedgerFlipSection } from "@/components/ledger-flip"
import { DailySurplusHandler } from "@/components/daily-surplus-handler"

export default function DashboardPage() {
  return (
    <main 
      className="min-h-screen bg-background p-2 md:p-4 overflow-hidden h-screen flex flex-col relative"
    >
      <DailySurplusHandler />
      <div className="mx-auto w-full space-y-4 flex flex-col h-full z-10 max-w-[1920px]">
        <header className="flex-none mb-2 flex items-start justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl font-bold text-balance text-foreground">有钱花</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">{"Your money, your way"}</p>
          </div>
          <div className="flex items-center gap-2">
            <AiCoachChat />
            <SettingsButton />
          </div>
        </header>

        {/* Desktop View: Three Columns Layout */}
        <LedgerFlipSection>
          <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 min-h-0 h-full">
            {/* Left Column: Savings & Wishes */}
            <div className="flex flex-col gap-4 h-full">
              <div className="flex-none">
                <GoalProgressCard />
              </div>
              <div className="flex-1 min-h-0">
                <SmallWishesCard />
              </div>
            </div>

            {/* Center Column: Daily Budget */}
            <div className="h-full">
              <DailyBudgetCard className="h-full" />
            </div>

            {/* Right Column: Transactions */}
            <div className="h-full">
              <RecentTransactionsCard />
            </div>
          </div>

          {/* Mobile View: Vertical Stack (Scrollable) */}
          <div className="md:hidden flex-1 min-h-0 overflow-y-auto flex flex-col h-full relative p-3 space-y-3 bg-zinc-50 dark:bg-zinc-950">
            {/* 1. Daily Budget */}
            <div className="flex-none">
              <DailyBudgetCard className="shadow-md border" />
            </div>

            {/* 2. Piggy Bank (Narrower/Shorter) */}
            <div className="flex-none h-[140px]">
              <GoalProgressCard 
                className="h-full shadow-sm border" 
                minimal={true} 
              />
            </div>

            {/* 3. Recent Transactions */}
            <div className="flex-none h-[400px]">
              <RecentTransactionsCard />
            </div>

            {/* 4. Small Wishes */}
            <div className="flex-none h-[240px] mb-6">
              <SmallWishesCard className="h-full shadow-sm border" />
            </div>
          </div>
        </LedgerFlipSection>
      </div>
    </main>
  )
}
