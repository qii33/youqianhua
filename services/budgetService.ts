import {
  differenceInCalendarDays,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns"

export const BUDGET_EVENT = "youqianhua:budget-updated"

export interface BigGoal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  startDate: string
  endDate: string
}

export interface Sprint {
  id: string
  income: number
  savingsGoal: number
  startDate: string
  endDate: string
}

export interface Wish {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  emoji?: string
}

export type TransactionType = "income" | "expense"

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: string
  date: string
  note?: string
  allocation?: string
  source?: string
}

export type DailyBudgetMode = "throttling" | "boosting"

export interface DailyBudgetStatus {
  mode: DailyBudgetMode
  amount: number
}

export type SprintStage = "none" | "active" | "ended"

export interface FinancialContextPayload {
  bigGoal: BigGoal | null
  sprint: Sprint | null
  wishes: Wish[]
  recentTransactions: Transaction[]
  budgetResult: {
    mode: DailyBudgetMode
    finalDailyBudget: number
  } | null
}

export interface SprintSettlement {
  totalAllowance: number
  totalExpenses: number
  surplus: number
  overspent: number
}

export type PositiveFundAllocationOption =
  | { type: "bigGoal" }
  | { type: "sprint" }
  | { type: "mixed"; toBigGoalRatio: number; toSprintRatio: number }

const STORAGE_KEYS = {
  bigGoal: "youqianhua_big_goal",
  currentSprint: "youqianhua_current_sprint",
  wishes: "youqianhua_wishes",
  transactions: "youqianhua_transactions",
  lastSurplusHandledDate: "youqianhua_last_surplus_date",
  nextSprintDebt: "youqianhua_next_sprint_debt",
  demoEnabled: "youqianhua_demo_enabled",
} as const

function startOfDayFromISO(value: string) {
  return startOfDay(parseISO(value))
}

function loadFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function saveToStorage<T>(key: string, value: T | null) {
  if (typeof window === "undefined") return
  if (value == null) {
    window.localStorage.removeItem(key)
  } else {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

export function notifyBudgetChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(BUDGET_EVENT))
}

function filterSprintTransactions(sprint: Sprint, transactions: Transaction[]) {
  const start = startOfDayFromISO(sprint.startDate)
  const end = startOfDayFromISO(sprint.endDate)
  return transactions.filter((tx) => {
    const d = startOfDayFromISO(tx.date)
    return isWithinInterval(d, { start, end })
  })
}

export function getBigGoal(): BigGoal | null {
  return loadFromStorage<BigGoal>(STORAGE_KEYS.bigGoal)
}

export function saveBigGoal(bigGoal: BigGoal | null) {
  saveToStorage<BigGoal | null>(STORAGE_KEYS.bigGoal, bigGoal)
  notifyBudgetChanged()
}

export function getCurrentSprint(): Sprint | null {
  return loadFromStorage<Sprint>(STORAGE_KEYS.currentSprint)
}

export function saveCurrentSprint(sprint: Sprint | null) {
  saveToStorage<Sprint | null>(STORAGE_KEYS.currentSprint, sprint)
  notifyBudgetChanged()
}

export function getWishes(): Wish[] {
  return loadFromStorage<Wish[]>(STORAGE_KEYS.wishes) ?? []
}

export function saveWishes(wishes: Wish[]) {
  saveToStorage<Wish[]>(STORAGE_KEYS.wishes, wishes)
}

export function getTransactions(): Transaction[] {
  return loadFromStorage<Transaction[]>(STORAGE_KEYS.transactions) ?? []
}

export function saveTransactions(transactions: Transaction[]) {
  saveToStorage<Transaction[]>(STORAGE_KEYS.transactions, transactions)
  notifyBudgetChanged()
}

export function addTransaction(input: {
  amount: number
  type: TransactionType
  category: string
  note?: string
  allocation?: string
  source?: string
  date?: string
}) {
  const all = getTransactions()
  const tx: Transaction = {
    id: `${Date.now()}`,
    amount: input.amount,
    type: input.type,
    category: input.category,
    date: input.date ?? new Date().toISOString(),
    note: input.note,
    allocation: input.allocation,
    source: input.source,
  }
  const updated = [...all, tx]
  saveTransactions(updated)
}

export function clearAllFinancialData() {
  saveBigGoal(null)
  saveCurrentSprint(null)
  saveWishes([])
  saveTransactions([])
  saveToStorage<string | null>(STORAGE_KEYS.lastSurplusHandledDate, null)
  saveNextSprintDebt(0)
  saveToStorage<boolean | null>(STORAGE_KEYS.demoEnabled, false)
}

export function ensureDemoData(nowInput?: Date) {
  if (typeof window === "undefined") return
  const demoEnabled = loadFromStorage<boolean>(STORAGE_KEYS.demoEnabled)
  if (demoEnabled === false) return
  const existingGoal = getBigGoal()
  const existingSprint = getCurrentSprint()
  const existingWishes = getWishes()
  const existingTransactions = getTransactions()
  const now = nowInput ?? new Date()
  if (!existingGoal) {
    const demoGoal: BigGoal = {
      id: "big-1",
      name: "🐖小猪存钱罐",
      targetAmount: 10000,
      savedAmount: 6500,
      startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
      endDate: new Date(now.getFullYear(), 11, 31).toISOString(),
    }
    saveBigGoal(demoGoal)
  }
  if (!existingSprint) {
    const start = startOfDay(now)
    const end = startOfDay(new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000))
    const demoSprint: Sprint = {
      id: "sprint-1",
      income: 5000,
      savingsGoal: 1500,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
    saveCurrentSprint(demoSprint)
  }
  if (existingWishes.length === 0) {
    const demoWishes: Wish[] = [
      {
        id: "wish-1",
        name: "烤肉自助",
        targetAmount: 200,
        savedAmount: 20,
        emoji: "🍖",
      },
      {
        id: "wish-2",
        name: "游戏机",
        targetAmount: 2000,
        savedAmount: 350,
        emoji: "🎮",
      },
      {
        id: "wish-3",
        name: "周末旅行",
        targetAmount: 1500,
        savedAmount: 680,
        emoji: "🧳",
      },
    ]
    saveWishes(demoWishes)
  }
  if (existingTransactions.length === 0) {
    const today = startOfDay(now)
    const yesterday = startOfDay(
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
    )
    const demoTransactions: Transaction[] = [
      {
        id: "tx-1",
        amount: 45.8,
        type: "expense",
        category: "餐饮",
        date: today.toISOString(),
      },
      {
        id: "tx-2",
        amount: 25,
        type: "expense",
        category: "交通",
        date: today.toISOString(),
      },
      {
        id: "tx-3",
        amount: 5000,
        type: "income",
        category: "工资",
        date: yesterday.toISOString(),
      },
      {
        id: "tx-4",
        amount: 32,
        type: "expense",
        category: "咖啡",
        date: yesterday.toISOString(),
      },
      {
        id: "tx-5",
        amount: 88,
        type: "expense",
        category: "娱乐",
        date: yesterday.toISOString(),
      },
    ]
    saveTransactions(demoTransactions)
  }
}

export function calculateDailyBudget(
  sprint: Sprint,
  allTransactions: Transaction[],
  todayInput?: Date,
): DailyBudgetStatus {
  const today = startOfDay(todayInput ?? new Date())
  const sprintTransactions = filterSprintTransactions(sprint, allTransactions)
  const extraIncome = sprintTransactions
    .filter((tx) => {
      if (tx.type !== "income") return false
      // If allocation is set to 'bigGoal' or starts with 'wish:', it doesn't count towards daily budget
      if (tx.allocation && (tx.allocation === "bigGoal" || tx.allocation.startsWith("wish:"))) {
        return false
      }
      return true
    })
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalAllowance = sprint.income + extraIncome - sprint.savingsGoal
  const expensesBeforeToday = sprintTransactions
    .filter((tx) => {
      if (tx.type !== "expense") return false
      // If expense has a specific source, it shouldn't reduce allowance
      if (tx.source && tx.source.startsWith("wish:")) return false

      const d = startOfDayFromISO(tx.date)
      return d < today
    })
    .reduce((sum, tx) => sum + tx.amount, 0)
  const sprintEnd = startOfDayFromISO(sprint.endDate)
  let remainingDays = differenceInCalendarDays(sprintEnd, today) + 1
  if (remainingDays < 1) {
    remainingDays = 1
  }
  const remainingAllowance = totalAllowance - expensesBeforeToday
  const initialDailyBudget = remainingAllowance / remainingDays
  const todayExpenses = sprintTransactions
    .filter((tx) => {
      if (tx.type !== "expense") return false
      // If expense has a specific source (like wish), it shouldn't count towards daily budget consumption
      if (tx.source && (tx.source.startsWith("wish:") || tx.source === "bigGoal")) return false
      
      const d = startOfDayFromISO(tx.date)
      return isSameDay(d, today)
    })
    .reduce((sum, tx) => sum + tx.amount, 0)
  const finalDailyBudget = initialDailyBudget - todayExpenses
  const mode: DailyBudgetMode =
    finalDailyBudget > 0 ? "throttling" : "boosting"
  const amount = Math.abs(finalDailyBudget)
  return { mode, amount }
}

export function getSprintStage(
  todayInput?: Date,
): { sprint: Sprint | null; stage: SprintStage; daysLeft: number } {
  const sprint = getCurrentSprint()
  if (!sprint) {
    return {
      sprint: null,
      stage: "none",
      daysLeft: 0,
    }
  }
  const today = startOfDay(todayInput ?? new Date())
  const end = startOfDayFromISO(sprint.endDate)
  const diff = differenceInCalendarDays(end, today) + 1
  if (diff <= 0) {
    return {
      sprint,
      stage: "ended",
      daysLeft: 0,
    }
  }
  return {
    sprint,
    stage: "active",
    daysLeft: diff,
  }
}

export function hasActiveSprint(todayInput?: Date): boolean {
  const sprint = getCurrentSprint()
  if (!sprint) return false
  const today = startOfDay(todayInput ?? new Date())
  const start = startOfDayFromISO(sprint.startDate)
  const end = startOfDayFromISO(sprint.endDate)
  return isWithinInterval(today, { start, end })
}

export function startSprint(
  sprint: Sprint,
  options: { feedSavingsToBigGoal: boolean },
): { sprint: Sprint; bigGoal: BigGoal | null } {
  saveCurrentSprint(sprint)
  const bigGoal = getBigGoal()
  if (options.feedSavingsToBigGoal && bigGoal) {
    const updatedBigGoal: BigGoal = {
      ...bigGoal,
      savedAmount: bigGoal.savedAmount + sprint.savingsGoal,
    }
    saveBigGoal(updatedBigGoal)
    notifyBudgetChanged()
    return { sprint, bigGoal: updatedBigGoal }
  }
  notifyBudgetChanged()
  return { sprint, bigGoal }
}

export function calculatePreviousDayNetSurplus(
  sprint: Sprint,
  allTransactions: Transaction[],
  todayInput?: Date,
): number {
  const today = startOfDay(todayInput ?? new Date())
  const yesterday = startOfDay(
    new Date(today.getTime() - 24 * 60 * 60 * 1000),
  )
  const sprintStart = startOfDayFromISO(sprint.startDate)
  const sprintEnd = startOfDayFromISO(sprint.endDate)
  
  // If yesterday was before sprint start, no budget to calculate
  if (!isWithinInterval(yesterday, { start: sprintStart, end: sprintEnd })) {
    return 0
  }

  // Reuse calculateDailyBudget logic to determine yesterday's remaining budget
  // This correctly handles income allocation (excluding bigGoal/wish) and expense allocation
  const status = calculateDailyBudget(sprint, allTransactions, yesterday)
  
  // Return the raw signed amount (positive for surplus, negative for deficit)
  if (status.mode === "throttling") {
    return status.amount
  }
  
  // If boosting, it means we overspent (deficit)
  return -status.amount
}

export function buildFinancialContextPayload(
  todayInput?: Date,
): FinancialContextPayload {
  const bigGoal = getBigGoal()
  const sprint = getCurrentSprint()
  const wishes = getWishes()
  const allTransactions = getTransactions()
  const recentTransactions = [...allTransactions].sort((a, b) => {
    const ad = new Date(a.date).getTime()
    const bd = new Date(b.date).getTime()
    return bd - ad
  }).slice(0, 20)
  let budgetResult: FinancialContextPayload["budgetResult"] = null
  if (sprint) {
    const status = calculateDailyBudget(sprint, allTransactions, todayInput)
    const finalDailyBudget =
      status.mode === "throttling" ? status.amount : -status.amount
    budgetResult = {
      mode: status.mode,
      finalDailyBudget,
    }
  }
  return {
    bigGoal,
    sprint,
    wishes,
    recentTransactions,
    budgetResult,
  }
}

export function wasSurplusHandledForDate(date: Date): boolean {
  const stored = loadFromStorage<string>(STORAGE_KEYS.lastSurplusHandledDate)
  if (!stored) return false
  const storedDate = startOfDayFromISO(stored)
  const target = startOfDay(date)
  return isSameDay(storedDate, target)
}

export function markSurplusHandledForDate(date: Date) {
  saveToStorage<string>(
    STORAGE_KEYS.lastSurplusHandledDate,
    startOfDay(date).toISOString(),
  )
}

export function applyDailySurplusToWish(
  wishId: string,
  surplus: number,
): Wish[] {
  const wishes = getWishes()
  const updated = wishes.map((wish) =>
    wish.id === wishId
      ? { ...wish, savedAmount: wish.savedAmount + surplus }
      : wish,
  )
  saveWishes(updated)
  notifyBudgetChanged()
  return updated
}

export function allocatePositiveFund(params: {
  amount: number
  allocation: PositiveFundAllocationOption
  bigGoal: BigGoal | null
  sprint: Sprint | null
  allTransactions: Transaction[]
  now?: Date
}): {
  bigGoal: BigGoal | null
  sprint: Sprint | null
  transactions: Transaction[]
  dailyBudgetStatus: DailyBudgetStatus | null
} {
  const { amount, allocation, bigGoal, sprint, allTransactions, now } = params
  let updatedBigGoal = bigGoal
  let updatedSprint = sprint
  let updatedTransactions = [...allTransactions]
  if (amount <= 0) {
    return {
      bigGoal,
      sprint,
      transactions: allTransactions,
      dailyBudgetStatus: null,
    }
  }
  if (allocation.type === "bigGoal") {
    if (bigGoal) {
      updatedBigGoal = {
        ...bigGoal,
        savedAmount: bigGoal.savedAmount + amount,
      }
      saveBigGoal(updatedBigGoal)
    }
  } else if (allocation.type === "sprint") {
    if (sprint) {
      const tx: Transaction = {
        id: `${Date.now()}`,
        amount,
        type: "income",
        category: "通用正向资金",
        date: (now ?? new Date()).toISOString(),
      }
      updatedTransactions.push(tx)
      saveTransactions(updatedTransactions)
    }
  } else if (allocation.type === "mixed") {
    const totalRatio =
      allocation.toBigGoalRatio + allocation.toSprintRatio || 1
    const toBigGoal = (amount * allocation.toBigGoalRatio) / totalRatio
    const toSprint = (amount * allocation.toSprintRatio) / totalRatio
    if (bigGoal && toBigGoal > 0) {
      updatedBigGoal = {
        ...bigGoal,
        savedAmount: bigGoal.savedAmount + toBigGoal,
      }
      saveBigGoal(updatedBigGoal)
    }
    if (sprint && toSprint > 0) {
      const tx: Transaction = {
        id: `${Date.now()}`,
        amount: toSprint,
        type: "income",
        category: "通用正向资金",
        date: (now ?? new Date()).toISOString(),
      }
      updatedTransactions.push(tx)
      saveTransactions(updatedTransactions)
    }
  }
  let dailyBudgetStatus: DailyBudgetStatus | null = null
  if (updatedSprint) {
    dailyBudgetStatus = calculateDailyBudget(
      updatedSprint,
      updatedTransactions,
      now,
    )
  }
  notifyBudgetChanged()
  return {
    bigGoal: updatedBigGoal,
    sprint: updatedSprint,
    transactions: updatedTransactions,
    dailyBudgetStatus,
  }
}

export function settleSprint(
  sprint: Sprint,
  allTransactions: Transaction[],
): SprintSettlement {
  const sprintTransactions = filterSprintTransactions(sprint, allTransactions)
  const extraIncome = sprintTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalAllowance = sprint.income + extraIncome - sprint.savingsGoal
  const totalExpenses = sprintTransactions
    .filter((tx) => {
      if (tx.type !== "expense") return false
      // Exclude wish-funded expenses from settlement calculation as well
      if (tx.source && (tx.source.startsWith("wish:") || tx.source === "bigGoal")) return false
      return true
    })
    .reduce((sum, tx) => sum + tx.amount, 0)
  const diff = totalAllowance - totalExpenses
  const surplus = diff > 0 ? diff : 0
  const overspent = diff < 0 ? -diff : 0
  return {
    totalAllowance,
    totalExpenses,
    surplus,
    overspent,
  }
}

// Add storage event listener for cross-tab synchronization
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    // If any known key changes, notify the app
    const knownKeys = Object.values(STORAGE_KEYS)
    if (e.key && knownKeys.includes(e.key as any)) {
      notifyBudgetChanged()
    }
  })
}

export function calculateSprintRemainingBudget(
  sprint: Sprint,
  allTransactions: Transaction[],
): number {
  const sprintTransactions = filterSprintTransactions(sprint, allTransactions)
  const extraIncome = sprintTransactions
    .filter((tx) => {
      if (tx.type !== "income") return false
      // If allocation is set to 'bigGoal' or starts with 'wish:', it doesn't count towards daily budget
      if (tx.allocation && (tx.allocation === "bigGoal" || tx.allocation.startsWith("wish:"))) {
        return false
      }
      return true
    })
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalAllowance = sprint.income + extraIncome - sprint.savingsGoal
  const totalExpenses = sprintTransactions
    .filter((tx) => {
      if (tx.type !== "expense") return false
      // Exclude wish-funded expenses
      if (tx.source && (tx.source.startsWith("wish:") || tx.source === "bigGoal")) return false
      return true
    })
    .reduce((sum, tx) => sum + tx.amount, 0)
  
  return totalAllowance - totalExpenses
}

export function applyOverspendToBigGoal(
  bigGoal: BigGoal,
  overspent: number,
): BigGoal {
  const updated: BigGoal = {
    ...bigGoal,
    savedAmount: Math.max(0, bigGoal.savedAmount - overspent),
  }
  saveBigGoal(updated)
  notifyBudgetChanged()
  return updated
}

export function applyOverspendToNextSprint(
  nextSprint: Sprint,
  overspent: number,
): Sprint {
  const updated: Sprint = {
    ...nextSprint,
    savingsGoal: nextSprint.savingsGoal + overspent,
  }
  return updated
}

export function getNextSprintDebt(): number {
  const value = loadFromStorage<number | null>(STORAGE_KEYS.nextSprintDebt)
  if (value == null || Number.isNaN(value)) {
    return 0
  }
  return value
}

export function saveNextSprintDebt(amount: number) {
  if (amount <= 0) {
    saveToStorage<number | null>(STORAGE_KEYS.nextSprintDebt, null)
  } else {
    saveToStorage<number>(STORAGE_KEYS.nextSprintDebt, amount)
  }
}

