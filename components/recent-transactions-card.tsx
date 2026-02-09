"use client"

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BUDGET_EVENT,
  getTransactions,
  saveTransactions,
  addTransaction,
  type Transaction as CoreTransaction,
  type TransactionType,
  getBigGoal,
  saveBigGoal,
  getWishes,
  saveWishes,
  getCurrentSprint,
  calculateDailyBudget,
  calculateSprintRemainingBudget,
  type Wish,
} from "@/services/budgetService"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Pencil, Trash2, Plus } from "lucide-react"

import { useFlipContext } from "@/components/flip-context"

interface RecentTransactionsCardProps {
  onOpenLedger?: () => void
}

export function RecentTransactionsCard({ onOpenLedger, limit = 20 }: RecentTransactionsCardProps & { limit?: number }) {
  const flipContext = useFlipContext()
  const handleOpenLedger = () => {
    if (flipContext && flipContext.setFlipped) {
      flipContext.setFlipped(true)
    } else if (onOpenLedger) {
      onOpenLedger()
    }
  }
  const [transactions, setTransactions] = useState<CoreTransaction[]>([])
  
  // Edit states
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<TransactionType>("expense")
  const [editingCategory, setEditingCategory] = useState("")
  const [editingNote, setEditingNote] = useState("")
  const [editingAmount, setEditingAmount] = useState("")

  // Add states
  const [addOpen, setAddOpen] = useState(false)
  const [addType, setAddType] = useState<TransactionType>("expense")
  const [addCategory, setAddCategory] = useState("")
  const [addNote, setAddNote] = useState("")
  const [addAmount, setAddAmount] = useState("")
  const [addDate, setAddDate] = useState("")
  const [incomeAllocation, setIncomeAllocation] = useState<"sprint" | "bigGoal" | "wish">("sprint")
  // expenseSource is removed as we default to "sprint" (budget pool)
  const [selectedWishId, setSelectedWishId] = useState<string>("")
  const [wishes, setWishes] = useState<Wish[]>([])

  const EXPENSE_CATEGORIES = ["餐饮", "交通", "购物", "娱乐", "居家", "医疗", "学习", "其他"]
  const INCOME_CATEGORIES = ["薪资", "奖金", "理财", "其他"]

  // Warning state
  const [warningOpen, setWarningOpen] = useState(false)
  const [sprintRemainingBudget, setSprintRemainingBudget] = useState(0)

  useEffect(() => {
    const recalculate = () => {
      const list = getTransactions()
      const sorted = list
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
      setTransactions(sorted)
      setWishes(getWishes())
    }

    recalculate()

    if (typeof window !== "undefined") {
      window.addEventListener(BUDGET_EVENT, recalculate)
      // Set default date to today for add dialog
      setAddDate(new Date().toISOString().slice(0, 10))
      return () => {
        window.removeEventListener(BUDGET_EVENT, recalculate)
      }
    }
  }, [])
 
  const handleDelete = (id: string) => {
    const all = getTransactions()
    const updatedAll = all.filter((tx) => tx.id !== id)
    saveTransactions(updatedAll)
    // No need to manually update state as event listener will catch it
  }
 
  const handleOpenEdit = (tx: CoreTransaction) => {
    setEditingId(tx.id)
    setEditingType(tx.type)
    setEditingCategory(tx.category)
    setEditingNote(tx.note || "")
    setEditingAmount(tx.amount.toString())
    setEditOpen(true)
  }
 
  const handleSaveEdit = () => {
    if (!editingId) return
    const trimmedCategory = editingCategory.trim()
    const parsedAmount = Number(editingAmount)
    if (!trimmedCategory || !parsedAmount || parsedAmount <= 0) {
      return
    }
    const all = getTransactions()
    const updatedAll = all.map((tx) =>
      tx.id === editingId
        ? {
            ...tx,
            category: trimmedCategory,
            note: editingNote,
            amount: parsedAmount,
          }
        : tx,
    )
    saveTransactions(updatedAll)
    setEditOpen(false)
    setEditingId(null)
  }

  const handleOpenAdd = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setAddType("expense")
    setAddCategory("餐饮") // Default category
    setAddNote("")
    setAddAmount("")
    setAddDate(new Date().toISOString().slice(0, 10))
    setIncomeAllocation("sprint")
    setSelectedWishId("")
    setAddOpen(true)
  }

  const isFormValid = () => {
    const trimmedCategory = addCategory.trim()
    const parsedAmount = Number(addAmount)
    if (!trimmedCategory || !parsedAmount || parsedAmount <= 0 || !addDate) {
      return false
    }
    if (addType === "income" && incomeAllocation === "wish" && !selectedWishId) {
      return false
    }
    return true
  }

  const executeSave = (overrideSource?: string) => {
    if (!isFormValid()) return

    const trimmedCategory = addCategory.trim()
    const parsedAmount = Number(addAmount)
    
    // Construct date with current time to preserve order
    const now = new Date()
    const [year, month, day] = addDate.split("-").map(Number)
    const targetDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())

    let allocationStr: string | undefined = undefined
    let sourceStr: string | undefined = undefined

    if (addType === "income") {
      if (incomeAllocation === "bigGoal") {
        allocationStr = "bigGoal"
        const bigGoal = getBigGoal()
        if (bigGoal) {
          saveBigGoal({
            ...bigGoal,
            savedAmount: bigGoal.savedAmount + parsedAmount,
          })
        }
      } else if (incomeAllocation === "wish" && selectedWishId) {
        allocationStr = `wish:${selectedWishId}`
        const allWishes = getWishes()
        const updatedWishes = allWishes.map(w => {
          if (w.id === selectedWishId) {
            return { ...w, savedAmount: w.savedAmount + parsedAmount }
          }
          return w
        })
        saveWishes(updatedWishes)
      } else {
        allocationStr = "sprint"
      }
    } else {
      // Expense logic
      // Use overrideSource if provided (e.g. "bigGoal"), otherwise default to normal sprint expense
      const finalSource = overrideSource

      if (finalSource === "bigGoal") {
        sourceStr = "bigGoal"
        const bigGoal = getBigGoal()
        if (bigGoal) {
           // Deduct from big goal
           saveBigGoal({
             ...bigGoal,
             savedAmount: Math.max(0, bigGoal.savedAmount - parsedAmount)
           })
        }
      }
      // Removed manual "wish" source selection logic as UI is removed
    }

    addTransaction({
      amount: parsedAmount,
      category: trimmedCategory,
      note: addNote,
      type: addType,
      date: targetDate.toISOString(),
      allocation: allocationStr,
      source: sourceStr,
    })
    
    setAddOpen(false)
    // Reset fields
    setAddCategory("")
    setAddNote("")
    setAddAmount("")
  }

  const handleSaveAdd = () => {
    if (!isFormValid()) return
    const parsedAmount = Number(addAmount)

    // Check budget only for sprint expenses (which is now the default/only mode for manual add)
    if (addType === "expense") {
      const sprint = getCurrentSprint()
      // Only warn if we are in an active sprint
      if (sprint) {
        const allTx = getTransactions()
        const remaining = calculateSprintRemainingBudget(sprint, allTx)
        
        // If expense exceeds TOTAL remaining sprint budget
        if (parsedAmount > remaining) {
          setSprintRemainingBudget(remaining)
          setWarningOpen(true)
          return
        }
      }
    }

    executeSave()
  }

  return (
    <>
      <Card
        className="p-3 md:p-8 bg-zinc-950 border-zinc-900 shadow-2xl hover:shadow-xl transition-all duration-300 ease-[var(--ease-apple)] active:scale-[0.98] h-full flex flex-col cursor-pointer group relative overflow-hidden text-zinc-100"
        onClick={handleOpenLedger}
      >
        <div className="flex items-center justify-between gap-1 mb-2 md:mb-6 flex-none relative z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xl md:text-3xl" role="img" aria-label="receipt">
              🧾
            </span>
            <div>
              <h2 className="text-base md:text-2xl font-black text-white tracking-tight">最近账单</h2>
              <p className="text-[10px] md:text-xs text-zinc-500 hidden md:block font-medium">
                Keep track of every penny
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white text-black hover:bg-zinc-200 transition-all duration-300 ease-[var(--ease-apple)] hover:scale-110 hover:shadow-md hover:rotate-12 active:scale-90 shadow-md"
            onClick={handleOpenAdd}
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden relative z-10">
          <div className="h-full overflow-y-auto scrollbar-hide pb-12">
            <div className="space-y-2 md:space-y-3">
              {transactions.map((tx) => {
                const date = new Date(tx.date)
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2 md:gap-3 p-2.5 md:p-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200 group/item shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenEdit(tx)
                    }}
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="flex flex-col items-center justify-center min-w-[2rem] md:min-w-[3rem] text-zinc-500">
                        <span className="text-[10px] md:text-sm font-bold">{date.getDate()}</span>
                        <span className="text-[8px] md:text-xs">
                          {date.getMonth() + 1}月
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0 justify-center">
                        <span className="font-medium text-xs md:text-base text-zinc-200 truncate group-hover/item:text-white transition-colors">
                          {tx.note || tx.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-zinc-500 truncate">
                          <span className="hidden md:block">
                            {date.toLocaleTimeString("zh-CN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {tx.note && (
                             <span className="text-zinc-600 text-[10px]">
                               · {tx.category}
                             </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-3 flex-none">
                      <span
                        className={`text-xs md:text-base font-semibold whitespace-nowrap ${
                          tx.type === "income"
                            ? "text-lime-400"
                            : "text-white"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}¥ {tx.amount.toFixed(2)}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        className="h-6 w-6 md:h-8 md:w-8 opacity-0 group-hover/item:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-zinc-800 md:flex hidden"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(tx.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              {transactions.length === 0 && (
                <div className="text-center text-zinc-600 py-8 text-xs md:text-sm">
                  还没有记录，
                  <br />
                  记一笔开启理财之旅吧～
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        </div>
      </Card>
 
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑这笔记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>分类</Label>
              <div className="flex flex-wrap gap-2">
                {(editingType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={editingCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingCategory(cat)}
                    className="h-7 text-xs"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">备注 (可选)</Label>
              <Input
                id="edit-note"
                placeholder="比如：晚餐、电影票..."
                value={editingNote}
                onChange={(event) => setEditingNote(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">金额（元）</Label>
              <Input
                id="edit-amount"
                type="number"
                min={0}
                value={editingAmount}
                onChange={(event) => setEditingAmount(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" className="w-full" onClick={handleSaveEdit}>
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>记一笔</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>类型</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={addType === "expense" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setAddType("expense")
                    setAddCategory(EXPENSE_CATEGORIES[0])
                  }}
                >
                  支出
                </Button>
                <Button
                  type="button"
                  variant={addType === "income" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setAddType("income")
                    setAddCategory(INCOME_CATEGORIES[0])
                  }}
                >
                  收入
                </Button>
              </div>
            </div>

            {addType === "income" && (
              <div className="space-y-2">
                <Label>资金流向</Label>
                <RadioGroup
                  value={incomeAllocation}
                  onValueChange={(v) => setIncomeAllocation(v as any)}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sprint" id="inc-sprint" />
                    <Label htmlFor="inc-sprint">🥂 过好日子 (加入预算池)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bigGoal" id="inc-bigGoal" />
                    <Label htmlFor="inc-bigGoal">🐷 喂给小猪</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wish" id="inc-wish" />
                    <Label htmlFor="inc-wish">✨ 实现愿望</Label>
                  </div>
                </RadioGroup>

                {incomeAllocation === "wish" && (
                  <div className="mt-2 pl-6">
                    <div className="flex flex-wrap gap-2">
                      {wishes.map((w) => (
                        <Button
                          key={w.id}
                          type="button"
                          variant={selectedWishId === w.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedWishId(w.id)}
                          className="h-7 text-xs"
                        >
                          {w.emoji} {w.name}
                        </Button>
                      ))}
                      {wishes.length === 0 && (
                        <span className="text-xs text-muted-foreground">暂无愿望，请先添加愿望</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {addType === "expense" && (
              // Simplified Expense UI: No source selection needed for normal flow
              <div className="text-xs text-muted-foreground">
                默认从当前冲刺预算中扣除
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-date">日期</Label>
              <Input
                id="add-date"
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>分类</Label>
              <div className="flex flex-wrap gap-2">
                {(addType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={addCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddCategory(cat)}
                    className="h-7 text-xs"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-note">备注 (可选)</Label>
              <Input
                id="add-note"
                placeholder={addType === "expense" ? "比如：晚餐、电影票..." : "比如：工资、奖金..."}
                value={addNote}
                onChange={(event) => setAddNote(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-amount">金额（元）</Label>
              <Input
                id="add-amount"
                type="number"
                min={0}
                placeholder="例如 88.8"
                value={addAmount}
                onChange={(event) => setAddAmount(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" className="w-full" onClick={handleSaveAdd} disabled={!isFormValid()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ 预算熔断警告</AlertDialogTitle>
            <AlertDialogDescription>
              当前冲刺周期剩余总预算仅剩 <span className="text-lime-500 font-bold">¥{sprintRemainingBudget.toFixed(1)}</span>。
              <br className="my-2"/>
              这笔 <span className="text-rose-500 font-bold">¥{Number(addAmount).toFixed(1)}</span> 的支出将导致整个冲刺周期彻底透支！
              <br className="my-2"/>
              <span className="text-muted-foreground">
                既然已经无力回天，只能动用“小猪存钱罐”的老本了。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWarningOpen(false)}>再想想</AlertDialogCancel>
            <Button 
              onClick={() => {
                setWarningOpen(false)
                executeSave("bigGoal")
              }}
            >
              🐷 确认动用老本
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
