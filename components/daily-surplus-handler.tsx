"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  getTransactions,
  getCurrentSprint,
  calculatePreviousDayNetSurplus,
  wasSurplusHandledForDate,
  markSurplusHandledForDate,
  applyDailySurplusToWish,
  getBigGoal,
  saveBigGoal,
  getWishes,
  type Wish,
  notifyBudgetChanged,
  addTransaction,
} from "@/services/budgetService"
import { startOfDay, parseISO, isSameDay, differenceInCalendarDays } from "date-fns"

export function DailySurplusHandler() {
  const [open, setOpen] = useState(false)
  const [surplus, setSurplus] = useState(0)
  const [expense, setExpense] = useState(0)
  const [recoveryAmount, setRecoveryAmount] = useState(0)
  const [handlingDate, setHandlingDate] = useState<Date | null>(null)
  const [action, setAction] = useState<"wish" | "bigGoal" | "rollover">("wish")
  const [selectedWishId, setSelectedWishId] = useState<string>("")
  const [wishes, setWishes] = useState<Wish[]>([])

  useEffect(() => {
    // Check for yesterday's surplus
    const checkSurplus = () => {
      const now = new Date()
      const yesterday = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000))
      
      if (wasSurplusHandledForDate(yesterday)) {
        return
      }

      const sprint = getCurrentSprint()
      if (!sprint) return

      const transactions = getTransactions()
      const net = calculatePreviousDayNetSurplus(sprint, transactions, now)

      // Calculate yesterday's total expenses
      const yesterdayExpenses = transactions.filter(tx => {
        if (tx.type !== 'expense') return false
        const txDate = startOfDay(parseISO(tx.date))
        return isSameDay(txDate, yesterday)
      }).reduce((sum, tx) => sum + tx.amount, 0)

      setSurplus(net)
      setExpense(yesterdayExpenses)
      setHandlingDate(yesterday)
      
      if (net > 0) {
        setWishes(getWishes())
        setOpen(true)
      } else {
        // Handle overspend logic
        const sprintEnd = parseISO(sprint.endDate)
        let remainingDays = differenceInCalendarDays(sprintEnd, now) + 1
        if (remainingDays < 1) remainingDays = 1
        
        const recovery = Math.abs(net) / remainingDays
        setRecoveryAmount(recovery)
        setOpen(true)
      }
    }

    // Run check on mount and when window gets focus (in case date changed)
    checkSurplus()
    window.addEventListener("focus", checkSurplus)
    return () => window.removeEventListener("focus", checkSurplus)
  }, [])

  const handleConfirm = () => {
    if (!handlingDate) return

    if (surplus > 0) {
      if (action === "bigGoal") {
        const bigGoal = getBigGoal()
        if (bigGoal) {
          saveBigGoal({
            ...bigGoal,
            savedAmount: bigGoal.savedAmount + surplus,
          })
        }
      } else if (action === "wish" && selectedWishId) {
        applyDailySurplusToWish(selectedWishId, surplus)
      }
      // "rollover" simply marks as handled without moving funds
    }

    markSurplusHandledForDate(handlingDate)
    notifyBudgetChanged()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>昨日账单日报</DialogTitle>
          <DialogDescription className="text-base">
            {surplus > 0 ? (
              <>
                昨日支出 <span className="font-medium text-foreground">¥ {expense.toFixed(2)}</span>，
                成功结余 <span className="font-bold text-primary text-lg">¥ {surplus.toFixed(2)}</span> 🎉
                <br />
                这笔钱你想怎么处理？
              </>
            ) : (
              <>
                昨日支出 <span className="font-medium text-foreground">¥ {expense.toFixed(2)}</span>，
                <span className="text-destructive">超支了 ¥ {Math.abs(surplus).toFixed(2)}</span>
                <br />
                <span className="block mt-2 text-muted-foreground text-sm">
                  没关系，接下来的日子每天少花 <span className="font-bold text-foreground">¥ {recoveryAmount.toFixed(1)}</span> 就可以啦 💪
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {surplus > 0 && (
          <div className="py-4 space-y-4">
            <RadioGroup value={action} onValueChange={(v) => setAction(v as "wish" | "bigGoal" | "rollover")}>
              <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="wish" id="r-wish" />
                <Label htmlFor="r-wish" className="flex-1 cursor-pointer">
                  ✨ 实现愿望
                  <span className="block text-xs text-muted-foreground mt-1">
                    加速实现你的小心愿
                  </span>
                </Label>
              </div>
              
              {action === "wish" && (
                <div className="pl-6 pr-2">
                  <select 
                    className="w-full p-2 rounded-md border text-sm"
                    value={selectedWishId}
                    onChange={(e) => setSelectedWishId(e.target.value)}
                  >
                    <option value="" disabled>选择一个愿望...</option>
                    {wishes.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.emoji} {w.name} (还差 ¥{(w.targetAmount - w.savedAmount).toFixed(0)})
                      </option>
                    ))}
                  </select>
                  {wishes.length === 0 && (
                    <p className="text-xs text-destructive mt-1">
                      还没有愿望哦，建议先去创建一个，或者喂给小猪。
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="bigGoal" id="r-pig" />
                <Label htmlFor="r-pig" className="flex-1 cursor-pointer">
                  🐷 喂给小猪
                  <span className="block text-xs text-muted-foreground mt-1">
                    稳稳的幸福，积少成多
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="rollover" id="r-rollover" />
                <Label htmlFor="r-rollover" className="flex-1 cursor-pointer">
                  🥂 过好日子
                  <span className="block text-xs text-muted-foreground mt-1">
                    滚入预算池，平摊到接下来的每一天
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={surplus > 0 && action === "wish" && !selectedWishId}
            className="w-full"
          >
            {surplus > 0 ? "确认存入" : "我知道了"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
