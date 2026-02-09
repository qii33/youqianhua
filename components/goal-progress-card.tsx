'use client'

import { useEffect, useState } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BigGoal, getBigGoal, ensureDemoData, saveBigGoal } from "@/services/budgetService"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function CircularProgress({ value, size = 80, strokeWidth = 8, showPercentage = true }: { value: number; size?: number; strokeWidth?: number, showPercentage?: boolean }) {
  // If size is undefined, we use 100% of parent. We need to handle this via CSS mostly, but SVG needs explicit viewBox.
  // Let's assume a standard coordinate system of 100x100 for scaling if size is not provided.
  const viewBoxSize = 100
  const radius = (viewBoxSize - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn("relative flex items-center justify-center", !size && "w-full h-full")} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <circle
          className="text-zinc-200 dark:text-zinc-700/50"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
        />
        <circle
          className="text-lime-500 transition-all duration-1000 ease-[var(--ease-apple)]"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
            {Math.round(value)}<span className="text-[0.6em]">%</span>
          </span>
        </div>
      )}
    </div>
  )
}

export function GoalProgressCard({ className, minimal = false }: { className?: string, minimal?: boolean }) {
  const [goal, setGoal] = useState<BigGoal | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState("🐖小猪存钱罐")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [targetAmount, setTargetAmount] = useState("")

  useEffect(() => {
    ensureDemoData()
    const current = getBigGoal()
    setGoal(current)
    if (current) {
      setName(current.name || "🐖小猪存钱罐")
      setTargetAmount(String(current.targetAmount || ""))
      if (current.startDate) {
        setStartDate(new Date(current.startDate).toISOString().slice(0, 10))
      }
      if (current.endDate) {
        setEndDate(new Date(current.endDate).toISOString().slice(0, 10))
      }
    } else {
      const today = new Date()
      setStartDate(today.toISOString().slice(0, 10))
      const end = new Date(today.getFullYear(), 11, 31)
      setEndDate(end.toISOString().slice(0, 10))
    }
  }, [])

  if (!goal) {
    // Empty state: Show the full card structure but with "Start Goal" prompt
    const emptyProgress = 0
    return (
      <>
      <Card className={cn(
        "p-4 border-0 shadow-sm flex flex-col justify-between relative overflow-hidden group bg-white dark:bg-zinc-900",
        className, minimal && "cursor-pointer"
      )}
      onClick={() => minimal && setEditOpen(true)}
      >
        {minimal ? (
          <>
            <CardHeader className="pb-0 flex-none p-4 relative z-10">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <span className="text-xl" role="img" aria-label="piggy bank">
                     🐷
                   </span>
                   <div>
                     <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">小猪存钱罐</h2>
                   </div>
                 </div>
                 <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditOpen(true)
                    }}
                  >
                    <span className="text-lg">⚙️</span>
                  </Button>
               </div>
            </CardHeader>
            <div className="flex-1 flex flex-col px-4 pb-3 relative z-10 w-full min-h-0 justify-end">
               <div className="w-full mb-2">
                 <div className="flex items-end justify-between w-full">
                   <div className="flex items-baseline gap-1">
                     <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">
                        快来定个大目标，<br/>
                        喂养小猪吧！
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="w-full shrink-0">
                  <Progress value={0} className="h-1.5 bg-zinc-200 dark:bg-zinc-700 w-full" indicatorClassName="bg-lime-500" />
               </div>
            </div>
          </>
        ) : (
            // Non-minimal empty state (rarely used in carousel but kept for completeness)
          <>
            <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label="piggy bank">
                  🐷
                </span>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">小猪存钱罐</h2>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setEditOpen(true)}
              >
                <span className="text-lg">⚙️</span>
              </Button>
            </div>

            <div className="flex-1 flex flex-col justify-center relative z-10 w-full min-h-0 items-center">
                 <div className="text-center space-y-2">
                     <p className="text-zinc-400 dark:text-zinc-500 font-medium">还没有目标哦</p>
                     <Button onClick={() => setEditOpen(true)} variant="outline" className="border-dashed">
                        建立第一个目标
                     </Button>
                 </div>
            </div>
          </>
        )}
        </Card>

        <GoalEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          goal={goal}
          name={name}
          startDate={startDate}
          endDate={endDate}
          targetAmount={targetAmount}
          onNameChange={setName}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onTargetAmountChange={setTargetAmount}
          onGoalSaved={(g) => setGoal(g)}
        />
      </>
    )
  }

  const progress =
    goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0

  return (
    <>
      <Card 
        className={cn("p-4 border-0 shadow-sm flex flex-col justify-between relative overflow-hidden group bg-white dark:bg-zinc-900", className, minimal && "cursor-pointer")}
        onClick={() => minimal && setEditOpen(true)}
      >
        {minimal ? (
          <>
            <CardHeader className="pb-0 flex-none p-4 relative z-10">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <span className="text-xl" role="img" aria-label="piggy bank">
                     🐷
                   </span>
                   <div>
                     <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">小猪存钱罐</h2>
                   </div>
                 </div>
                 <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditOpen(true)
                    }}
                  >
                    <span className="text-lg">⚙️</span>
                  </Button>
               </div>
            </CardHeader>
            <div className="flex-1 flex flex-col px-4 pb-3 relative z-10 w-full min-h-0 justify-end">
               <div className="w-full mb-2">
                 <div className="flex items-end justify-between w-full">
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none">
                       <span className="text-xl align-top font-medium mr-1">¥</span>
                       {goal.savedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                   </div>
                   
                   <div className="text-[10px] text-zinc-500 font-medium mb-1.5">
                     <span>目标 ¥{goal.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                   </div>
                 </div>
               </div>
               
               <div className="w-full shrink-0">
                  <Progress value={progress} className="h-1.5 bg-zinc-200 dark:bg-zinc-700 w-full" indicatorClassName="bg-lime-500" />
               </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-1 mb-2 md:mb-6 relative z-10">
              <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                <div className="p-0 shrink-0">
                  <span className="text-xl md:text-3xl" role="img" aria-label="piggy bank">
                    🐷
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-2xl font-black text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                    {goal.name || "小猪存钱罐"}
                  </h2>
                   <p className="text-[10px] md:text-xs text-zinc-500 hidden md:block font-medium truncate">
                    {progress >= 100 ? "Goal reached! 🎉" : "Keep feeding..."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-black/5 text-zinc-400 hover:text-zinc-900 transition-all duration-300 ease-[var(--ease-apple)] active:scale-90"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditOpen(true)
                }}
              >
                <Settings className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>

            <div className="flex flex-col flex-1 min-h-0 relative z-10 mt-2">
               <div className="flex flex-col items-center justify-center flex-none mb-2">
                 <span className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                   ¥{goal.savedAmount.toLocaleString()}
                 </span>
                 <span className="text-xs md:text-base text-zinc-500 font-medium mt-1 truncate">
                   目标 ¥{goal.targetAmount.toLocaleString()}
                 </span>
               </div>
               
               <div className="flex-1 min-h-0 flex items-center justify-center w-full pb-2">
                 <div className="aspect-square h-full max-h-[220px] w-auto relative mx-auto">
                    <CircularProgress value={progress} size={undefined} strokeWidth={12} />
                 </div>
               </div>
            </div>
          </>
        )}
      </Card>
      <GoalEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        goal={goal}
        name={name}
        startDate={startDate}
        endDate={endDate}
        targetAmount={targetAmount}
        onNameChange={setName}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onTargetAmountChange={setTargetAmount}
        onGoalSaved={(g) => setGoal(g)}
      />
    </>
  )
}

type GoalEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: BigGoal | null
  name: string
  startDate: string
  endDate: string
  targetAmount: string
  onNameChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onTargetAmountChange: (value: string) => void
  onGoalSaved: (goal: BigGoal) => void
}

function GoalEditDialog({
  open,
  onOpenChange,
  goal,
  name,
  startDate,
  endDate,
  targetAmount,
  onNameChange,
  onStartDateChange,
  onEndDateChange,
  onTargetAmountChange,
  onGoalSaved,
}: GoalEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置小猪存钱罐</DialogTitle>
          <DialogDescription>
            给你的大目标起个名字，设定一个起点日期和想要存到的金额。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="goal-name">存钱罐名称</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="例如：旅行基金、年度缓冲金..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-start">起始时间</Label>
            <Input
              id="goal-start"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-end">结束时间</Label>
            <Input
              id="goal-end"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-target">大目标金额（元）</Label>
            <Input
              id="goal-target"
              type="number"
              min={0}
              value={targetAmount}
              onChange={(e) => onTargetAmountChange(e.target.value)}
              placeholder="例如 10000"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              先等等
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-lime-500 text-white hover:bg-lime-600"
              onClick={() => {
                const trimmedName = name.trim() || "🐖小猪存钱罐"
                const target = Number(targetAmount)
                if (!target || target <= 0) {
                  return
                }
                const start =
                  startDate || new Date().toISOString().slice(0, 10)
                const effectiveEnd =
                  endDate ||
                  goal?.endDate ||
                  new Date(new Date(start).getFullYear(), 11, 31)
                    .toISOString()
                const updated: BigGoal = {
                  id: goal?.id || `big-${Date.now()}`,
                  name: trimmedName,
                  targetAmount: target,
                  savedAmount: goal?.savedAmount ?? 0,
                  startDate: start,
                  endDate: effectiveEnd,
                }
                saveBigGoal(updated)
                onGoalSaved(updated)
                onOpenChange(false)
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
