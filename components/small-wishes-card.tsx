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

export function SmallWishesCard({ className }: { className?: string }) {
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
  }, [])

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
      <Card className={cn("overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col gap-0 md:gap-6 bg-fuchsia-500 relative group text-white", className)}>
        
        <CardHeader className="pb-0 md:pb-6 flex-none p-3 md:p-6 relative z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xl md:text-3xl" role="img" aria-label="devil emoji">
              😈
            </span>
            <div>
              <h2 className="text-base md:text-2xl font-black text-white tracking-tight">小小愿望</h2>
              <p className="text-[10px] md:text-xs text-white/80 hidden md:block font-medium">
                Treat yourself occasionally
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 relative p-2 md:p-6 pt-0 md:pt-0 z-10">
          <div className="h-full overflow-y-auto scrollbar-hide relative">
            <div className="space-y-1.5 md:space-y-3 pb-24">
              {wishes.map((wish) => {
                const progress =
                  wish.targetAmount > 0
                    ? (wish.savedAmount / wish.targetAmount) * 100
                    : 0
                return (
                  <div
                    key={wish.id}
                    className={`p-2 rounded-xl bg-white text-black shadow-sm cursor-grab active:cursor-grabbing touch-pan-y select-none transition-all duration-300 ease-[var(--ease-apple)] active:scale-[0.98] hover:scale-[1.02] hover:shadow-md ${
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
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="text-base md:text-xl shrink-0 bg-fuchsia-100 p-1 rounded-md"
                          role="img"
                          aria-label={wish.name}
                        >
                          {wish.emoji || "✨"}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs md:text-sm font-bold text-black block truncate">{wish.name}</span>
                          <span className="text-[10px] text-zinc-500 font-medium block">
                            ¥{wish.savedAmount} / ¥{wish.targetAmount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {progress >= 100 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-lime-600 hover:text-lime-700 hover:bg-lime-100/50 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRealize(wish)
                            }}
                          >
                            <span className="text-lg">🎉</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (wish.savedAmount <= 0) {
                              // 直接删除 0 元愿望
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
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full transition-all duration-500 rounded-full bg-fuchsia-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-fuchsia-500 to-transparent pointer-events-none" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 pt-2">
            <Button
              onClick={handleAddWish}
              variant="outline"
              size="sm"
              className="w-full text-xs md:text-sm font-medium border-dashed border-white/50 text-white bg-white/10 hover:bg-white hover:text-fuchsia-600 h-9 md:h-10 rounded-xl transition-all"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
              许个愿望
            </Button>
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
