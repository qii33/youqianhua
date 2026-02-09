"use client"

import type React from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Wish, getWishes, ensureDemoData, saveWishes, addTransaction } from "@/services/budgetService"
import { PositiveFundDialog } from "@/components/positive-fund-dialog"
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

export function SmallWishesCard({ className, limit }: { className?: string; limit?: number }) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [positiveOpen, setPositiveOpen] = useState(false)
  const [positiveAmount, setPositiveAmount] = useState(0)
  const [positiveSource, setPositiveSource] = useState<string | undefined>(undefined)
  const [pendingWishId, setPendingWishId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newEmoji, setNewEmoji] = useState<string>("")
  const [newName, setNewName] = useState("")
  const [newTarget, setNewTarget] = useState("")

  const minSwipeDistance = 100

  const handleAddWish = () => {
    setNewEmoji("")
    setNewName("")
    setNewTarget("")
    setCreateOpen(true)
  }

  useEffect(() => {
    ensureDemoData()
    setWishes(getWishes())
    const handleUpdate = () => setWishes(getWishes())
    window.addEventListener("budget-updated", handleUpdate)
    return () => window.removeEventListener("budget-updated", handleUpdate)
  }, [])

  const displayWishes = limit ? wishes.slice(0, limit) : wishes

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = (wishId: string) => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isRightSwipe = distance < -minSwipeDistance

    if (isRightSwipe) {
      setSwipedId(wishId)
      setTimeout(() => {
        setWishes(wishes.filter((w) => w.id !== wishId))
        setSwipedId(null)
      }, 300)
    }
  }

  const handleRealize = (wish: Wish) => {
    // 1. Record expense
    addTransaction({
      amount: wish.savedAmount,
      type: "expense",
      category: wish.name,
      note: "愿望达成！🎉",
      source: `wish:${wish.id}`,
      date: new Date().toISOString(),
    })
    
    // 2. Remove wish
    const updated = wishes.filter((w) => w.id !== wish.id)
    setWishes(updated)
    saveWishes(updated)
  }

  const handleMouseDown = (e: React.MouseEvent, wishId: string) => {
    setTouchStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStart !== null) {
      setTouchEnd(e.clientX)
    }
  }

  const handleMouseUp = (wishId: string) => {
    if (!touchStart || !touchEnd) {
      setTouchStart(null)
      setTouchEnd(null)
      return
    }
    const distance = touchStart - touchEnd
    const isRightSwipe = distance < -minSwipeDistance

    if (isRightSwipe) {
      setSwipedId(wishId)
      setTimeout(() => {
        setWishes(wishes.filter((w) => w.id !== wishId))
        setSwipedId(null)
      }, 300)
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  return (
    <>
      <Card className={cn("overflow-hidden border-0 shadow-none transition-all duration-300 flex flex-col bg-transparent relative group", className)}>
        <CardContent className="flex-1 min-h-0 flex flex-col p-0 z-10">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide relative space-y-2">
            
            {/* Add Wish Button Row */}
            <div 
               className="flex items-center gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-all border border-dashed border-zinc-300 dark:border-zinc-700"
               onClick={handleAddWish}
            >
               <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
               </div>
               <span className="text-xs font-medium">+ 许个愿望</span>
            </div>

            {/* Wishes List */}
            {displayWishes.map((wish) => {
                const progress =
                  wish.targetAmount > 0
                    ? (wish.savedAmount / wish.targetAmount) * 100
                    : 0
                return (
                  <div
                    key={wish.id}
                    className={`flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm cursor-grab active:cursor-grabbing touch-pan-y select-none transition-all duration-300 ease-[var(--ease-apple)] active:scale-[0.98] ${
                      swipedId === wish.id ? "opacity-0 translate-x-full" : ""
                    }`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => onTouchEnd(wish.id)}
                    onMouseDown={(e) => handleMouseDown(e, wish.id)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => handleMouseUp(wish.id)}
                    onMouseLeave={() => {
                      setTouchStart(null)
                      setTouchEnd(null)
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                      <span
                        className="text-lg shrink-0"
                        role="img"
                        aria-label={wish.name}
                      >
                        {wish.emoji || "✨"}
                      </span>
                      <div className="min-w-0 flex flex-col">
                         <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{wish.name}</span>
                         <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                               <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-zinc-400 font-medium tabular-nums">
                                {Math.round(progress)}%
                            </span>
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {progress >= 100 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-lime-600 hover:text-lime-700 hover:bg-lime-100/50 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRealize(wish)
                            }}
                          >
                            <span className="text-sm">🎉</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (wish.savedAmount <= 0) {
                              const updated = wishes.filter((w) => w.id !== wish.id)
                              setWishes(updated)
                              saveWishes(updated)
                              return
                            }
                            setPositiveAmount(wish.savedAmount)
                            setPositiveSource(`放弃愿望「${wish.name}」`)
                            setPendingWishId(wish.id)
                            setPositiveOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>许个小小愿望</DialogTitle>
            <DialogDescription>
              给这份期待起个名字，再配上一点专属存钱目标。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="wish-emoji">愿望表情</Label>
              <Input
                id="wish-emoji"
                placeholder="直接输入一个你喜欢的 emoji，比如 😈"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wish-name">愿望名称</Label>
              <Input
                id="wish-name"
                placeholder="比如：周末火锅、喜欢的耳机..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wish-target">目标金额（元）</Label>
              <Input
                id="wish-target"
                type="number"
                min={0}
                placeholder="例如 300"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                先等等
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const name = newName.trim()
                  const target = Number(newTarget)
                  const emoji = newEmoji.trim() || "✨"
                  if (!name || !target || target <= 0) {
                    return
                  }
                  const wish: Wish = {
                    id: `wish-${Date.now()}`,
                    name,
                    targetAmount: target,
                    savedAmount: 0,
                    emoji,
                  }
                  const updated = [...wishes, wish]
                  setWishes(updated)
                  saveWishes(updated)
                  setCreateOpen(false)
                }}
              >
                加入清单
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <PositiveFundDialog
        open={positiveOpen}
        onOpenChange={setPositiveOpen}
        initialAmount={positiveAmount}
        allowEditAmount={false}
        sourceLabel={positiveSource}
        onCompleted={() => {
          if (!pendingWishId) return
          const updated = wishes.filter((w) => w.id !== pendingWishId)
          setWishes(updated)
          saveWishes(updated)
          setPendingWishId(null)
        }}
      />
    </>
  )
}
