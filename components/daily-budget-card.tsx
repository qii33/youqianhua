"use client"

import { useEffect, useState } from "react"
import { addDays, startOfDay } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  calculateDailyBudget,
  calculateSprintRemainingBudget,
  getTransactions,
  DailyBudgetStatus,
  ensureDemoData,
  startSprint,
  getSprintStage,
  type Sprint,
  type SprintStage,
  BUDGET_EVENT,
} from "@/services/budgetService"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

import { SprintSettlementDialog } from "@/components/sprint-settlement-dialog"
import { cn } from "@/lib/utils"

type SprintInfo = {
  sprint: Sprint | null
  stage: SprintStage
  daysLeft: number
}

interface DailyBudgetCardProps {
  className?: string
}

export function DailyBudgetCard({ className }: DailyBudgetCardProps) {
  const [status, setStatus] = useState<DailyBudgetStatus | null>(null)
  const [sprintInfo, setSprintInfo] = useState<SprintInfo>({
    sprint: null,
    stage: "none",
    daysLeft: 0,
  })
  const [sprintRemainingBudget, setSprintRemainingBudget] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)
  const [income, setIncome] = useState<string>("")
  const [savingsGoal, setSavingsGoal] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  useEffect(() => {
    ensureDemoData()
    const recalculate = () => {
      const transactions = getTransactions()
      const sprintStage = getSprintStage()
      setSprintInfo(sprintStage)
      if (sprintStage.sprint) {
        const result = calculateDailyBudget(sprintStage.sprint, transactions)
        const remaining = calculateSprintRemainingBudget(sprintStage.sprint, transactions)
        setStatus(result)
        setSprintRemainingBudget(remaining)
      } else {
        setStatus(null)
        setSprintRemainingBudget(0)
      }
    }
    recalculate()
    if (typeof window !== "undefined") {
      window.addEventListener(BUDGET_EVENT, recalculate)
      return () => {
        window.removeEventListener(BUDGET_EVENT, recalculate)
      }
    }
  }, [])

  const displayAmount = status ? Math.max(0, status.amount) : 0
  const formattedAmount = displayAmount.toFixed(2)
  const handleOpenCreate = () => {
    const today = startOfDay(new Date())
    setStartDate(today.toISOString().slice(0, 10))
    const defaultEnd = addDays(today, 6)
    setEndDate(defaultEnd.toISOString().slice(0, 10))
    setIncome("")
    setSavingsGoal("")
    setCreateOpen(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const incomeNumber = Number(income)
    const savingsNumber = Number(savingsGoal)
    if (!incomeNumber || !savingsNumber || !startDate || !endDate) {
      return
    }

    // Validation: Income must be greater than savings
    if (incomeNumber < savingsNumber) {
        toast.error("存钱金额不能超过总收入哦！")
        return
    }

    const sprint: Sprint = {
      id: `sprint-${Date.now()}`,
      income: incomeNumber,
      savingsGoal: savingsNumber,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    }
    
    startSprint(sprint)
    
    // Toast notification
    toast.success(`已为小猪存入 ¥${savingsNumber.toFixed(2)}`)

    setCreateOpen(false)
  }

  const showHelperText = !status && sprintInfo.stage === "none"

  return (
    <>
      <Card className={cn(
        "p-4 border-0 shadow-sm flex flex-col justify-between relative overflow-hidden group bg-lime-600",
        className
      )}>
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="money-bag">
                💰
              </span>
              <div>
                <h2 className="text-xl font-bold text-white whitespace-nowrap">今日可花</h2>
            </div>
          </div>
          <div className="ml-auto flex items-center">
            {sprintInfo.stage === "none" && (
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs rounded-full shadow-sm bg-white text-lime-600 hover:bg-white/90"
                onClick={handleOpenCreate}
              >
                🚀 开启冲刺
              </Button>
            )}
            {sprintInfo.stage === "active" && sprintInfo.sprint && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px] rounded-full bg-white/20 border-white/40 text-white hover:bg-white/30"
                onClick={() => setDetailOpen(true)}
              >
                <span>🔥 冲刺中</span>
                {sprintInfo.daysLeft > 0 && (
                  <span className="ml-1 opacity-80">
                    剩{sprintInfo.daysLeft}天
                  </span>
                )}
              </Button>
            )}
            {sprintInfo.stage === "ended" && (
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 rounded-full bg-white text-lime-600 hover:bg-white/90"
                onClick={() => setSettlementOpen(true)}
              >
                🏁 结算
              </Button>
            )}
          </div>
        </div>

        <div className="mt-2 mb-3 relative z-10">
          <div className="relative inline-block">
            <p className={cn(
              "text-5xl font-black tracking-tighter transition-all duration-500 leading-none text-white",
              status?.mode === "throttling" ? "opacity-90" :
              status?.mode === "boosting" ? "opacity-100 drop-shadow-md" :
              "text-foreground"
            )}>
              <span className="text-2xl align-top font-medium text-white mr-1">¥</span>
              {formattedAmount}
            </p>
          </div>
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>开启一次「又赚一笔」冲刺</DialogTitle>
            <DialogDescription>
              设定这段时间的收入与储蓄目标。
              <span className="block mt-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                注意：这笔收入不会直接计入余额，而是作为接下来几天的“每日预算”基数，分摊到每一天供你使用。
              </span>
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 mt-2" onSubmit={handleCreateSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sprint-income">本次总收入预估（元）</Label>
              <Input
                id="sprint-income"
                type="number"
                min={0}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="例如 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-savings">本次储蓄目标（元）</Label>
              <Input
                id="sprint-savings"
                type="number"
                min={0}
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                placeholder="例如 2000"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-start">开始日期</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-end">结束日期</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">
                下一步
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {sprintInfo.sprint && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>「又赚一笔」冲刺详情</DialogTitle>
              <DialogDescription>
                当前这段冲刺期间的基础信息和进度概览。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">起始时间</span>
                <span className="font-medium">
                  {new Date(sprintInfo.sprint.startDate).toLocaleDateString("zh-CN")} 至{" "}
                  {new Date(sprintInfo.sprint.endDate).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">收入预估</span>
                <span className="font-medium">¥ {sprintInfo.sprint.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">储蓄目标</span>
                <span className="font-medium">¥ {sprintInfo.sprint.savingsGoal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-secondary/30 p-2 rounded">
                <span className="text-muted-foreground">剩余总预算</span>
                <span className={cn(
                  "font-bold text-lg",
                  sprintRemainingBudget < 0 ? "text-red-500" : "text-lime-500"
                )}>
                  ¥ {sprintRemainingBudget.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">剩余天数</span>
                <span className="font-medium">
                  {sprintInfo.stage === "ended" ? "本次冲刺已结束" : `${sprintInfo.daysLeft} 天`}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <SprintSettlementDialog
        open={settlementOpen}
        onOpenChange={(open) => {
          setSettlementOpen(open)
        }}
      />
    </>
  )
}
