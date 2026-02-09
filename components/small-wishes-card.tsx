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

  // Detail/Action State
  const [actionOpen, setActionOpen] = useState(false)
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null)

  const handleWishClick = (wish: Wish) => {
    setSelectedWish(wish)
    setActionOpen(true)
  }

  return (
    <>
      <Card className={cn("overflow-hidden border-0 shadow-none transition-all duration-300 flex flex-col bg-transparent relative group h-full", className)}>
        <CardContent className="flex-1 min-h-0 p-0 z-10 h-full">
          <div className="h-full flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden px-1 gap-3 touch-pan-x py-4">
            
            {/* Add Wish Button - Compact Circle */}
            <div 
               className="shrink-0 w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-all border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center group/add"
               onClick={handleAddWish}
            >
               <Plus className="w-5 h-5 group-hover/add:scale-110 transition-transform" />
            </div>

            {/* Wishes List - Horizontal Bubbles */}
            {displayWishes.map((wish) => {
                const progress =
                  wish.targetAmount > 0
                    ? (wish.savedAmount / wish.targetAmount) * 100
                    : 0
                return (
                  <div
                    key={wish.id}
                    className="shrink-0 flex items-center gap-3 pl-3 pr-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                    onClick={() => handleWishClick(wish)}
                  >
                    <div className="relative">
                        <span className="text-2xl" role="img" aria-label={wish.name}>
                            {wish.emoji || "✨"}
                        </span>
                        {/* Circular Progress Indicator */}
                        <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none">
                           <circle
                             className="text-transparent"
                             strokeWidth="2"
                             stroke="currentColor"
                             fill="transparent"
                             r="14"
                             cx="50%"
                             cy="50%"
                           />
                           <circle
                             className={progress >= 100 ? "text-lime-500" : "text-fuchsia-500"}
                             strokeWidth="2"
                             strokeDasharray={88}
                             strokeDashoffset={88 - (Math.min(progress, 100) / 100) * 88}
                             strokeLinecap="round"
                             stroke="currentColor"
                             fill="transparent"
                             r="14"
                             cx="50%"
                             cy="50%"
                           />
                        </svg>
                    </div>
                    
                    <div className="flex flex-col min-w-[3rem]">
                       <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{wish.name}</span>
                       <span className="text-[10px] text-zinc-400 font-medium tabular-nums">
                          ¥{wish.savedAmount} / {Math.round(progress)}%
                       </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Detail Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="max-w-xs rounded-3xl">
           <DialogHeader>
             <DialogTitle className="text-center flex flex-col items-center gap-2">
                <span className="text-4xl">{selectedWish?.emoji}</span>
                <span>{selectedWish?.name}</span>
             </DialogTitle>
             <DialogDescription className="text-center">
                当前进度: {selectedWish ? Math.round((selectedWish.savedAmount / selectedWish.targetAmount) * 100) : 0}%
                <br/>
                (¥{selectedWish?.savedAmount} / ¥{selectedWish?.targetAmount})
             </DialogDescription>
           </DialogHeader>
           
           <div className="flex flex-col gap-3 mt-4">
              {selectedWish && (selectedWish.savedAmount >= selectedWish.targetAmount) && (
                 <Button 
                   className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-xl h-12 text-base"
                   onClick={() => {
                     handleRealize(selectedWish)
                     setActionOpen(false)
                   }}
                 >
                   🎉 愿望达成！
                 </Button>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 rounded-xl h-12 text-base shadow-none"
                onClick={() => {
                   if (!selectedWish) return
                   if (selectedWish.savedAmount <= 0) {
                      const updated = wishes.filter((w) => w.id !== selectedWish.id)
                      setWishes(updated)
                      saveWishes(updated)
                      setActionOpen(false)
                      return
                   }
                   setPositiveAmount(selectedWish.savedAmount)
                   setPositiveSource(`放弃愿望「${selectedWish.name}」`)
                   setPendingWishId(selectedWish.id)
                   setPositiveOpen(true)
                   setActionOpen(false)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                放弃这个愿望
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full rounded-xl"
                onClick={() => setActionOpen(false)}
              >
                再想想
              </Button>
           </div>
        </DialogContent>
      </Dialog>

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
