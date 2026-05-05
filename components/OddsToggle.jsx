'use client'
import { createContext, useContext, useState } from 'react'
const OddsContext = createContext({ mode: 'fractional', toggle: () => {} })
export function OddsProvider({ children }) {
  const [mode, setMode] = useState('fractional')
  const toggle = () => setMode(m => m === 'fractional' ? 'decimal' : 'fractional')
  return <OddsContext.Provider value={{ mode, toggle }}>{children}</OddsContext.Provider>
}
export function useOdds() { return useContext(OddsContext) }
export function DisplayOdds({ fractional, decimal }) {
  const { mode } = useOdds()
  return <span>{mode === 'fractional' ? fractional : decimal}</span>
}