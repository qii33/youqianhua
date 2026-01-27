"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  allocatePositiveFund,
  getBigGoal,
  getCurrentSprint,
  getTransactions,
  type PositiveFundAllocationOption,
} from "@/services/budgetService"

type PositiveFundDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAmount: number
  allowEditAmount?: boolean
  sourceLabel?: string
  onCompleted?: () => void
}

type AllocationMode = "bigGoal" | "sprint" | "mixed"

export function PositiveFundDialog({
  open,
  onOpenChange,
  initialAmount,
  allowEditAmount,
  sourceLabel,
  onCompleted,
}: PositiveFundDialogProps) {
  const [mode, setMode] = useState<AllocationMode>("bigGoal")
  const [amount, setAmount] = useState<string>("0")
  const [mixedRatio, setMixedRatio] = useState([50]) // 0-100 for Big Goal

  useEffect(() => {
    setAmount(initialAmount.toString())
  }, [initialAmount])

  const handleConfirm = () => {
    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      return
    }
    const bigGoal = getBigGoal()
    const sprint = getCurrentSprint()
    const transactions = getTransactions()
    let allocation: PositiveFundAllocationOption
    if (mode === "bigGoal") {
      allocation = { type: "bigGoal" }
    } else if (mode === "sprint") {
      allocation = { type: "sprint" }
    } else {
      allocation = {
        type: "mixed",
        toBigGoalRatio: mixedRatio[0],
        toSprintRatio: 100 - mixedRatio[0],
      }
    }
    
    allocatePositiveFund({
      amount: parsedAmount,
      allocation,
      bigGoal,
      sprint,
      allTransactions: transactions,
    })
    onCompleted?.()
    onOpenChange(false)
  }

  const label = sourceLabel || "通用正向资金"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>这笔钱想怎么安排？</AlertDialogTitle>
          <AlertDialogDescription>
            已识别到一笔来自「{label}」的资金。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="positive-amount">金额（元）</Label>
            <Input
              id="positive-amount"
              type="number"
              min={0}
              disabled={!allowEditAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">分配方式</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant={mode === "bigGoal" ? "default" : "outline"}
                className="justify-start gap-2"
                onClick={() => setMode("bigGoal")}
              >
                <span>🐷 喂给小猪</span>
                <span className="text-xs text-muted-foreground">
                  全部存入大目标存钱罐
                </span>
              </Button>
              <Button
                type="button"
                variant={mode === "sprint" ? "default" : "outline"}
                className="justify-start gap-2"
                onClick={() => setMode("sprint")}
              >
                <span>🥂 过好日子</span>
                <span className="text-xs text-muted-foreground">
                  作为「通用正向资金」加入当前冲刺
                </span>
              </Button>
              <Button
                type="button"
                variant={mode === "mixed" ? "default" : "outline"}
                className="justify-start gap-2"
                onClick={() => setMode("mixed")}
              >
                <span>⚖️ 混合搭配</span>
                <span className="text-xs text-muted-foreground">
                  自定义大目标与冲刺之间的比例
                </span>
              </Button>
            </div>
          </div>

          {mode === "mixed" && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>🐷 喂给小猪: {mixedRatio[0]}%</span>
                <span>🥂 过好日子: {100 - mixedRatio[0]}%</span>
              </div>
              <Slider
                value={mixedRatio}
                onValueChange={setMixedRatio}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>¥{((Number(amount) * mixedRatio[0]) / 100).toFixed(1)}</span>
                <span>¥{((Number(amount) * (100 - mixedRatio[0])) / 100).toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>确认分配</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

