"use client"

import { createContext, useContext } from "react"

type FlipContextType = {
  isFlipped: boolean
  setFlipped: (flipped: boolean) => void
}

export const FlipContext = createContext<FlipContextType>({
  isFlipped: false,
  setFlipped: () => {},
})

export const useFlipContext = () => useContext(FlipContext)
