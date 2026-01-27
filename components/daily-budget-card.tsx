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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)
  const [pendingSprint, setPendingSprint] = useState<Sprint | null>(null)
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
    const sprint: Sprint = {
      id: `sprint-${Date.now()}`,
      income: incomeNumber,
      savingsGoal: savingsNumber,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    }
    setPendingSprint(sprint)
    setConfirmOpen(true)
  }

  const handleConfirm = (feedSavingsToBigGoal: boolean) => {
    if (!pendingSprint) return
    startSprint(pendingSprint, { feedSavingsToBigGoal })
    setConfirmOpen(false)
    setCreateOpen(false)
    setPendingSprint(null)
  }

  const showHelperText = !status && sprintInfo.stage === "none"

  return (
    <>
      <Card className={cn(
      "p-6 md:p-12 border-0 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col justify-between relative overflow-hidden group bg-lime-600",
      className
    )}>
        <div className="flex items-center gap-3 mb-4 md:mb-6 relative z-10">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xl md:text-3xl" role="img" aria-label="money-bag">
                💰
              </span>
              <div>
                <h2 className="text-xl md:text-3xl font-bold text-white whitespace-nowrap">今日可花</h2>
              {showHelperText && (
                <p className="mt-1 text-xs md:text-sm text-white/80 hidden md:block">
                  开启冲刺，算出每日安心额度。
                </p>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center">
            {sprintInfo.stage === "none" && (
              <Button
                type="button"
                size="sm"
                className="h-9 px-4 rounded-full shadow-sm hover:shadow-md transition-all duration-300 ease-[var(--ease-apple)] active:scale-90 bg-white text-lime-600 hover:bg-white/90"
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
                className="h-7 px-3 text-xs rounded-full bg-white/20 border-white/40 text-white hover:bg-purple-500/20 hover:border-purple-300/50 hover:text-white active:bg-purple-500/30 transition-all duration-300 ease-[var(--ease-apple)] active:scale-90"
                onClick={() => setDetailOpen(true)}
              >
                <span>🔥 努力赚钱中</span>
                {sprintInfo.daysLeft > 0 && (
                  <span className="ml-1 text-[10px] text-white/80">
                    剩{sprintInfo.daysLeft}天
                  </span>
                )}
              </Button>
            )}
            {sprintInfo.stage === "ended" && (
              <Button
                type="button"
                size="sm"
                className="h-9 px-4 rounded-full bg-white text-lime-600 hover:bg-white/90 transition-all duration-300 ease-[var(--ease-apple)] active:scale-90"
                onClick={() => setSettlementOpen(true)}
              >
                🏁 结算冲刺
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 md:mt-8 relative z-10">
          <div className="relative inline-block">
            <p className={cn(
              "text-6xl md:text-9xl font-black tracking-tighter transition-all duration-500 leading-none text-white",
              status?.mode === "throttling" ? "opacity-90" :
              status?.mode === "boosting" ? "opacity-100 drop-shadow-md" :

              "text-foreground"
            )}>
              <span className="text-2xl md:text-5xl align-top font-medium text-white mr-1 md:mr-2">¥</span>
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投喂小猪吗？</AlertDialogTitle>
            <AlertDialogDescription>
              是否将 {savingsGoal || 0} 元立即「投喂」给小猪？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleConfirm(false)}>
              暂时不投喂
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleConfirm(true)}>
              立即投喂
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
