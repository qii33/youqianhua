"use client"

import type React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getTransactions,
  type Transaction as CoreTransaction,
} from "@/services/budgetService"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  format,
  isSameMonth,
  getDate
} from "date-fns"
import { zhCN } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { FlipContext } from "@/components/flip-context"

type LedgerViewProps = {
  onBack: () => void
}

function LedgerView({ onBack }: LedgerViewProps) {
  const [items, setItems] = useState<CoreTransaction[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Dialogs State
  const [detailsOpen, setDetailsOpen] = useState(false)
  
  // Loading State
  const [isLoading, setIsLoading] = useState(false)

  // Load Data
  const loadData = useCallback(() => {
    setIsLoading(true)
    const list = getTransactions()
    // Sort by date desc
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setItems(list)
    setTimeout(() => setIsLoading(false), 300)
  }, [])

  useEffect(() => {
    loadData()
    // Listen for updates
    const handleUpdate = () => loadData()
    window.addEventListener("budget-updated", handleUpdate)
    return () => window.removeEventListener("budget-updated", handleUpdate)
  }, [loadData])

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") setCurrentMonth(prev => subMonths(prev, 1))
    else setCurrentMonth(prev => addMonths(prev, 1))
  }

  // Derived Data
  const dayItems = useMemo(() => {
    return items.filter((tx) => isSameDay(new Date(tx.date), selectedDate))
  }, [items, selectedDate])

  const dailyDataMap = useMemo(() => items.reduce<Record<string, { income: number; expense: number }>>(
    (acc, tx) => {
      const d = new Date(tx.date)
      const key = format(d, "yyyy-MM-dd")
      if (!acc[key]) acc[key] = { income: 0, expense: 0 }
      
      if (tx.type === "expense") {
        acc[key].expense += tx.amount
      } else {
        acc[key].income += tx.amount
      }
      return acc
    },
    {},
  ), [items])

  const monthlyStats = useMemo(() => {
    return items.reduce(
      (acc, tx) => {
        if (isSameMonth(new Date(tx.date), currentMonth)) {
          if (tx.type === "expense") {
            acc.expense += tx.amount
          } else {
            acc.income += tx.amount
          }
        }
        return acc
      },
      { income: 0, expense: 0 }
    )
  }, [items, currentMonth])

  const renderCalendarGrid = () => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    const days = eachDayOfInterval({ start, end })

    return (
      <div className="grid grid-cols-7 gap-2 w-full p-2">
        {["周日", "周一", "周二", "周三", "周四", "周五", "周六"].map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-2 font-medium">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const data = dailyDataMap[dateKey]
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = isSameDay(day, new Date())
          const isSelected = isSameDay(day, selectedDate)

          return (
            <div 
              key={idx} 
              className={cn(
              "relative aspect-[0.85] rounded-xl cursor-pointer transition-all duration-300 select-none overflow-hidden group",
              isCurrentMonth ? "bg-secondary/50 hover:bg-secondary hover:shadow-md" : "bg-transparent text-muted-foreground/30",
              isToday && isCurrentMonth && !isSelected && "bg-zinc-200 dark:bg-zinc-700 shadow-inner ring-1 ring-black/10 dark:ring-white/10",
              isSelected && isCurrentMonth && "bg-foreground text-background shadow-xl scale-[1.02] ring-2 ring-offset-2 ring-foreground z-10"
            )}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDate(day)
                setDetailsOpen(true)
              }}
            >
              {/* Expense (Top) - Red */}
              <div className="absolute top-1.5 left-0 w-full flex justify-center px-0.5">
                {data?.expense > 0 && (
                   <span className={cn(
                     "text-[9px] leading-none font-bold tabular-nums truncate max-w-full text-center transition-colors duration-300",
                     isSelected && isCurrentMonth ? "text-background/90" : "text-rose-600"
                   )}>
                      {data.expense > 9999 ? (data.expense/10000).toFixed(1) + 'w' : Number(data.expense).toString()}
                   </span>
                )}
              </div>

              {/* Date (Center) - Black/Static */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-full h-full pointer-events-none">
                <span className={cn(
                  "text-sm font-bold transition-colors duration-300", 
                  isSelected && isCurrentMonth ? "text-background" : "text-foreground",
                  !isCurrentMonth && "text-muted-foreground/30"
                )}>
                  {getDate(day)}
                </span>
              </div>

              {/* Income (Bottom) - Green */}
              <div className="absolute bottom-1.5 left-0 w-full flex justify-center px-0.5">
                 {data?.income > 0 && (
                   <span className={cn(
                     "text-[9px] leading-none font-bold tabular-nums truncate max-w-full text-center transition-colors duration-300",
                     isSelected && isCurrentMonth ? "text-background/90" : "text-lime-600"
                   )}>
                      {data.income > 9999 ? (data.income/10000).toFixed(1) + 'w' : Number(data.income).toString()}
                   </span>
                 )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="h-full bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden relative">

      {/* 1. Header Area matching design */}
      <div className="flex-none px-4 pt-4 pb-2 bg-transparent z-20 flex items-center justify-between">
         <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            onClick={onBack}
         >
            <ChevronLeft className="h-5 w-5" />
         </Button>
         
         <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-full border border-border/50 shadow-sm">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:bg-background" onClick={() => handleMonthChange("prev")}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold tabular-nums tracking-tight px-2 min-w-[5rem] text-center">
                {format(currentMonth, "yyyy年M月", { locale: zhCN })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:bg-background" onClick={() => handleMonthChange("next")}>
                <ChevronRight className="h-4 w-4" />
            </Button>
         </div>
      </div>

      {/* Monthly Summary */}
      <div className="flex-none px-6 py-4 bg-transparent z-20 grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center p-3 bg-secondary rounded-2xl shadow-sm">
            <span className="text-xs text-muted-foreground font-medium mb-1">本月收入</span>
            <span className="text-lg font-black text-lime-600 tracking-tight">+{monthlyStats.income.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-secondary rounded-2xl shadow-sm">
            <span className="text-xs text-muted-foreground font-medium mb-1">本月支出</span>
            <span className="text-lg font-black text-rose-600 tracking-tight">-{monthlyStats.expense.toLocaleString()}</span>
        </div>
      </div>

      {/* 2. Calendar Grid */}
      <div className="flex-1 overflow-y-auto bg-transparent px-4 pb-4 scrollbar-hide">
          {renderCalendarGrid()}
      </div>

      {/* 3. Details Dialog (Pops up when date clicked) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-0">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="flex items-center justify-between">
                    <span className="text-xl font-bold">{format(selectedDate, "yyyy年M月d日", { locale: zhCN })}</span>
                </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-[300px] p-6 pt-2">
                {dayItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 gap-2 min-h-[200px]">
                        <div className="text-4xl">📭</div>
                        <p className="font-medium">今日无账单</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {dayItems.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner",
                                        tx.type === "income" ? "bg-lime-100 text-lime-600" : "bg-rose-100 text-rose-600"
                                    )}>
                                        {tx.type === "income" ? "💰" : "💸"}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-foreground">{tx.category}</span>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {format(new Date(tx.date), "HH:mm")} · {tx.allocation === "bigGoal" ? "存大目标" : tx.allocation?.startsWith("wish") ? "存心愿" : "日常"}
                                        </span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "font-bold tabular-nums text-base",
                                    tx.type === "income" ? "text-lime-600" : "text-rose-600"
                                )}>
                                    {tx.type === "income" ? "+" : "-"} {tx.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function LedgerFlipSection({ children }: { children: React.ReactNode }) {
  const [showLedger, setShowLedger] = useState(false)

  return (
    <FlipContext.Provider value={{ isFlipped: showLedger, setFlipped: setShowLedger }}>
      <div className="h-full w-full" style={{ perspective: "1200px" }}>
        <div
          className="relative h-full w-full transition-transform duration-700 ease-[var(--ease-spring)]"
          style={{
            transformStyle: "preserve-3d",
            transform: showLedger ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden", // Safari support
              zIndex: showLedger ? 0 : 1,
            }}
          >
            {children}
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 w-full h-full bg-background"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden", // Safari support
              zIndex: showLedger ? 1 : 0,
            }}
          >
            <LedgerView onBack={() => setShowLedger(false)} />
          </div>
        </div>
      </div>
    </FlipContext.Provider>
  )
}
