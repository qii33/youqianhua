"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  getBigGoal,
  getTransactions,
  settleSprint,
  applyOverspendToBigGoal,
  applyOverspendToNextSprint,
  saveBigGoal,
  saveCurrentSprint,
  type SprintSettlement,
  type Sprint,
  getSprintStage,
  type SprintStage,
} from "@/services/budgetService"
import { PositiveFundDialog } from "@/components/positive-fund-dialog"

type SprintSettlementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SprintSettlementDialog({
  open,
  onOpenChange,
}: SprintSettlementDialogProps) {
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [summary, setSummary] = useState<SprintSettlement | null>(null)
  const [positiveOpen, setPositiveOpen] = useState(false)
  const [stage, setStage] = useState<SprintStage>("none")
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    if (!open) return
    const { sprint: currentSprint, stage: currentStage, daysLeft: currentDaysLeft } =
      getSprintStage()
    setStage(currentStage)
    setDaysLeft(currentDaysLeft)
    if (!currentSprint) {
      setSprint(null)
      setSummary(null)
      return
    }
    const transactions = getTransactions()
    const settlement = settleSprint(currentSprint, transactions)
    setSprint(currentSprint)
    setSummary(settlement)
  }, [open])

  if (!open) {
    return null
  }

  if (!sprint || !summary) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>当前没有进行中的冲刺</AlertDialogTitle>
            <AlertDialogDescription>
              暂时没有可结算的「又赚一笔」冲刺。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>知道了</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  if (stage === "active") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>还没到结算时间</AlertDialogTitle>
            <AlertDialogDescription>
              这次「又赚一笔」还有 {daysLeft} 天才结束，等冲刺结束后再来结算吧。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>知道了</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  const totalIncome = summary.totalAllowance + sprint.savingsGoal
  const actualSavings =
    sprint.savingsGoal + summary.surplus - summary.overspent

  const handleOverspendWithBigGoal = () => {
    if (!summary.overspent) {
      saveCurrentSprint(null)
      onOpenChange(false)
      return
    }
    const bigGoal = getBigGoal()
    if (!bigGoal) {
      saveCurrentSprint(null)
      onOpenChange(false)
      return
    }
    const updated = applyOverspendToBigGoal(bigGoal, summary.overspent)
    saveBigGoal(updated)
    saveCurrentSprint(null)
    onOpenChange(false)
  }

  const handleOverspendCarryToNext = () => {
    if (!summary.overspent) {
      saveCurrentSprint(null)
      onOpenChange(false)
      return
    }
    const template: Sprint = {
      id: "next-template",
      income: 0,
      savingsGoal: 0,
      startDate: sprint.endDate,
      endDate: sprint.endDate,
    }
    applyOverspendToNextSprint(template, summary.overspent)
    saveCurrentSprint(null)
    onOpenChange(false)
  }

  const hasSurplus = summary.surplus > 0
  const hasOverspent = summary.overspent > 0

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本次冲刺结算</AlertDialogTitle>
            <AlertDialogDescription>
              回顾这段时间的收入、支出与储蓄表现。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>
              起始时间：{new Date(sprint.startDate).toLocaleDateString("zh-CN")} 至{" "}
              {new Date(sprint.endDate).toLocaleDateString("zh-CN")}
            </p>
            <p>
              收入预估：¥ {sprint.income.toFixed(2)} · 储蓄目标：¥{" "}
              {sprint.savingsGoal.toFixed(2)}
            </p>
          </div>
          <div className="space-y-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">总收入</span>
              <span className="font-medium">¥ {totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">总支出</span>
              <span className="font-medium">¥ {summary.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">计划储蓄</span>
              <span className="font-medium">¥ {sprint.savingsGoal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">实际储蓄</span>
              <span className="font-medium">¥ {actualSavings.toFixed(2)}</span>
            </div>
            {hasSurplus && (
              <div className="flex justify-between text-lime-500">
                <span>结余</span>
                <span>+ ¥ {summary.surplus.toFixed(2)}</span>
              </div>
            )}
            {hasOverspent && (
              <div className="flex justify-between text-red-500">
                <span>超支</span>
                <span>- ¥ {summary.overspent.toFixed(2)}</span>
              </div>
            )}
          </div>

          {hasSurplus && !hasOverspent && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                这次冲刺有一笔结余，可以继续通过通用正向资金分配给大目标或今日预算。
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setPositiveOpen(true)}
              >
                分配结余 ¥ {summary.surplus.toFixed(2)}
              </Button>
            </div>
          )}

          {hasOverspent && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                超支处理方式
              </p>
              <p className="text-xs text-muted-foreground">
                本次超支 ¥ {summary.overspent.toFixed(2)}，将直接从大目标中扣除。
              </p>
              <div className="grid gap-2 mt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleOverspendWithBigGoal}
                  className="w-full justify-center gap-2"
                >
                  <span>🐷 确认从小猪里扣除</span>
                </Button>
              </div>
            </div>
          )}

          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              onClick={() => {
                if (!hasSurplus && !hasOverspent) {
                  saveCurrentSprint(null)
                }
                onOpenChange(false)
              }}
            >
              关闭
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {hasSurplus && (
        <PositiveFundDialog
          open={positiveOpen}
          onOpenChange={setPositiveOpen}
          initialAmount={summary.surplus}
          allowEditAmount={false}
          sourceLabel="冲刺结余"
          onCompleted={() => {
            saveCurrentSprint(null)
            onOpenChange(false)
          }}
        />
      )}
    </>
  )
}
