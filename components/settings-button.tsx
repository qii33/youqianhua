"use client"

import { useEffect, useState } from "react"
import { Settings2 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  clearAllFinancialData,
  getBigGoal,
  getCurrentSprint,
  getTransactions,
  getWishes,
} from "@/services/budgetService"

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [hasSavedKey, setHasSavedKey] = useState(false)
  const [apiEndpointInput, setApiEndpointInput] = useState('')
  const [hasSavedEndpoint, setHasSavedEndpoint] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedKey = window.localStorage.getItem('youqianhua_ai_key')
    if (storedKey) {
      setHasSavedKey(true)
    }
    const storedEndpoint = window.localStorage.getItem('youqianhua_ai_base_url')
    if (storedEndpoint) {
      setHasSavedEndpoint(true)
    }
  }, [])

  const statusLabel =
    status === 'connected'
      ? '已连接'
      : status === 'connecting'
        ? '连接中…'
        : status === 'error'
          ? '连接失败'
          : '未连接'

  const statusColor =
    status === 'connected'
      ? 'bg-lime-500'
      : status === 'connecting'
        ? 'bg-zinc-400'
        : status === 'error'
          ? 'bg-red-500'
          : 'bg-gray-400'

  async function handleConnect() {
    if (status === 'connecting') return
    setStatus('connecting')
    setError(null)

    let apiKey = apiKeyInput.trim()
    let baseUrl = apiEndpointInput.trim()
    if (typeof window !== 'undefined') {
      if (!apiKey) {
        apiKey = window.localStorage.getItem('youqianhua_ai_key') ?? ''
      } else {
        window.localStorage.setItem('youqianhua_ai_key', apiKey)
        setHasSavedKey(true)
        setApiKeyInput('')
      }
      if (!baseUrl) {
        baseUrl = window.localStorage.getItem('youqianhua_ai_base_url') ?? ''
      } else {
        window.localStorage.setItem('youqianhua_ai_base_url', baseUrl)
        setHasSavedEndpoint(true)
        setApiEndpointInput('')
      }
    }

    if (!apiKey) {
      setStatus('error')
      setError('请先在下方输入 AI API Key')
      return
    }

    let attempt = 0
    const maxAttempts = 3
    let lastError: unknown = null

    while (attempt < maxAttempts) {
      attempt += 1
      try {
        const headers: Record<string, string> = {
          'x-ai-key': apiKey,
        }
        if (baseUrl) {
          headers['x-ai-base-url'] = baseUrl
        }
        const res = await fetch('/api/settings', {
          method: 'GET',
          headers,
        })
        if (!res.ok) {
          throw new Error('API 返回异常')
        }
        const data = (await res.json()) as { status?: string; message?: string }
        if (data.status !== 'ok') {
          throw new Error(data.message || 'API 状态异常')
        }
        setStatus('connected')
        return
      } catch (e) {
        lastError = e
        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, attempt * 500),
          )
        }
      }
    }

    setStatus('error')
    setError(
      lastError instanceof Error
        ? lastError.message
        : '连接失败，请稍后重试或检查网络状态。',
    )
  }

  function handleExportJson() {
    if (typeof window === 'undefined') return
    const data = {
      bigGoal: getBigGoal(),
      currentSprint: getCurrentSprint(),
      wishes: getWishes(),
      transactions: getTransactions(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    a.href = url
    a.download = `youqianhua-export-${timestamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full border-border bg-background/80 shadow-sm backdrop-blur transition-all duration-300 ease-[var(--ease-apple)] active:scale-90 hover:scale-105"
        onClick={() => setOpen(true)}
        aria-label="打开设置"
      >
        <Settings2 className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
            <DialogDescription>
              调整「有钱花」的一些偏好和实验功能，并管理与后端 API 的连接状态。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">AI API Key</p>
              <Input
                type="password"
                value={apiKeyInput}
                onChange={(event) => setApiKeyInput(event.target.value)}
                placeholder={
                  hasSavedKey ? '已保存一个 Key，如需更换请重新输入' : '在此粘贴 OpenAI Key'
                }
              />
              <p className="text-xs text-muted-foreground">
                仅保存在本机浏览器中，用于调用 AI 财商教练。
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">AI API 端点</p>
              <Input
                type="text"
                value={apiEndpointInput}
                onChange={(event) => setApiEndpointInput(event.target.value)}
                placeholder={
                  hasSavedEndpoint
                    ? '已保存一个端点，如需更换请重新输入'
                    : '例如：https://api.openai.com/v1'
                }
              />
              <p className="text-xs text-muted-foreground">
                默认为 OpenAI 兼容的 /v1 地址，也可以填写你自己的。
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  API 连接状态
                </p>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                  <span className="text-xs text-muted-foreground">
                    {statusLabel}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleConnect}
                disabled={status === 'connecting'}
              >
                {status === 'connecting' ? '连接中…' : '测试连接'}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">温和模式</p>
                <p className="text-xs text-muted-foreground">
                  优先以鼓励、陪伴的语气提示你，而不是紧绷的提醒。
                </p>
              </div>
              <Button type="button" variant="outline" size="sm">
                已开启
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  每日复盘提示
                </p>
                <p className="text-xs text-muted-foreground">
                  晚上提醒你看看今天的钱都去了哪里。
                </p>
              </div>
              <Button type="button" variant="outline" size="sm">
                开发中
              </Button>
            </div>
            <div className="pt-2 border-t border-border/60 space-y-2">
              <p className="text-sm font-medium text-foreground">数据管理</p>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  导出当前大目标、冲刺、愿望和全部账本记录为 JSON 文件。
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportJson}
                >
                  导出 JSON
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  一键清空账本、大目标、愿望等本机数据。
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setClearOpen(true)}
                >
                  清空数据
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空所有本机数据？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除账本记录、大目标、冲刺计划和愿望等本机数据，无法恢复，但不会删除 AI Key。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setClearOpen(false)
              }}
            >
              取消
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                clearAllFinancialData()
                setClearOpen(false)
                if (typeof window !== "undefined") {
                  window.location.reload()
                }
              }}
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
