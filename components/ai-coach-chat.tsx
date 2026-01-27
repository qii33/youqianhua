'use client'

import { useEffect, useState, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { buildFinancialContextPayload } from '@/services/budgetService'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Sparkles, Send, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AiCoachChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [aiReply, setAiReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use a ref to track if we should send the initial greeting
  const hasGreeted = useRef(false)

  useEffect(() => {
    if (!open) return
    if (hasGreeted.current) return
    
    // Send initial greeting regardless of API connection
    hasGreeted.current = true
    setAiReply("你好！我是你的好朋友钱钱~")
  }, [open])

  async function sendMessage(message: string) {
    setLoading(true)
    setError(null)
    try {
      let apiKey: string | null = null
      let baseUrl: string | null = null
      if (typeof window !== 'undefined') {
        apiKey = window.localStorage.getItem('youqianhua_ai_key')
        baseUrl = window.localStorage.getItem('youqianhua_ai_base_url')
      }
      if (!apiKey) {
        throw new Error('请先在右上角设置中填写 AI API Key')
      }
      const financialContext = buildFinancialContextPayload()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-ai-key': apiKey,
      }
      if (baseUrl) {
        headers['x-ai-base-url'] = baseUrl
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userMessage: message,
          financialContext,
        }),
      })
      if (!res.ok) {
        throw new Error('请求失败，请稍后再试')
      }
      const data = (await res.json()) as { message?: string }
      setAiReply(data.message ?? '')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : '抱歉，请求 AI 教练时出现了一点小问题。',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSend() {
    if (!input.trim() || loading) return
    setAiReply(null)
    void sendMessage(input.trim())
    setInput('') // Clear input after sending
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shadow-lg transition-all duration-300 ease-[var(--ease-apple)]",
          "bg-foreground text-background hover:bg-foreground/90",
          "hover:scale-110 hover:shadow-md hover:rotate-12",
          "active:scale-90",
          "animate-in zoom-in spin-in-12 duration-500"
        )}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-5 w-5 text-background" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] h-[80vh] rounded-t-[2.5rem] border-t-0 bg-card shadow-2xl flex flex-col p-0 overflow-hidden"
        >
          {/* Header Area */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/10 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shadow-sm">
                <span className="text-xl">🤖</span>
              </div>
              <div className="text-left">
                <SheetTitle className="text-lg font-bold text-foreground">
                  钱钱
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  已读取账本，随时为你提供建议
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {/* AI Welcome/Loading State */}
            {!aiReply && !error && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="h-8 w-8 rounded-full bg-secondary flex-none flex items-center justify-center mt-1">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="p-3 rounded-2xl rounded-tl-none bg-secondary/50 backdrop-blur-sm text-sm text-muted-foreground animate-pulse">
                    正在分析你的财务状况...
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-destructive/10 text-destructive text-xs py-2 px-4 rounded-full border border-destructive/20">
                  {error}
                </div>
              </div>
            )}

            {/* AI Reply Bubble */}
            {aiReply && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="h-8 w-8 rounded-full bg-secondary flex-none flex items-center justify-center mt-1 shadow-sm">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="flex-1 space-y-1 max-w-[90%]">
                  <div className="p-4 rounded-[1.5rem] rounded-tl-none bg-secondary text-sm leading-relaxed text-foreground tracking-wide">
                    {aiReply}
                  </div>
                  <span className="text-[10px] text-muted-foreground pl-2 opacity-70">
                    AI 生成建议，仅供参考
                  </span>
                </div>
              </div>
            )}

            {/* User Message Bubble (Preview of what was sent if we were tracking history, 
                but currently we only show AI reply. We could show the prompt too if we wanted context) 
            */}
          </div>

          {/* Input Area */}
          <SheetFooter className="p-4 bg-transparent border-t border-border/10">
            <div className="w-full relative flex items-end gap-2">
              <Textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Hi~钱钱"
                disabled={loading}
                className="min-h-[3rem] max-h-[120px] py-3 px-4 rounded-[1.5rem] border-0 bg-secondary focus-visible:ring-1 focus-visible:ring-primary/50 resize-none shadow-inner text-sm"
              />
              <Button
                type="button"
                size="icon"
                disabled={loading || !input.trim()}
                onClick={handleSend}
                className={cn(
                  "h-12 w-12 rounded-full flex-none transition-all duration-300 shadow-md",
                  input.trim() 
                    ? "bg-foreground text-background hover:scale-105 hover:shadow-md" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {loading ? (
                  <Sparkles className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
