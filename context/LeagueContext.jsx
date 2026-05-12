'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const LeagueContext = createContext(null)

const COOKIE_KEY = 'me_league'
const VALID_LEAGUES = ['English Premier League', 'Scottish Premiership', 'Bundesliga', 'La Liga', 'Ligue 1', 'Serie A']
const VALID_CATEGORIES = ['top_leagues', 'domestic_cups', 'european', 'international']

function readCookie(key) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|;\\\\s*)' + key + '=([^;]+)'))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(key, value) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = key + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax'
}

export function LeagueProvider({ children }) {
  const [activeLeague, setActiveLeagueState] = useState(() => {
    const saved = readCookie(COOKIE_KEY + '_league')
    return saved && VALID_LEAGUES.includes(saved) ? saved : 'English Premier League'
  })
  const [activeCategory, setActiveCategoryState] = useState(() => {
    const saved = readCookie(COOKIE_KEY + '_cat')
    return saved && VALID_CATEGORIES.includes(saved) ? saved : 'top_leagues'
  })

  function setActiveLeague(league) {
    setActiveLeagueState(league)
    writeCookie(COOKIE_KEY + '_league', league)
  }

  function setActiveCategory(cat) {
    setActiveCategoryState(cat)
    writeCookie(COOKIE_KEY + '_cat', cat)
  }

  return (
    <LeagueContext.Provider value={{ activeLeague, setActiveLeague, activeCategory, setActiveCategory }}>
      {children}
    </LeagueContext.Provider>
  )
}

export function useLeague() {
  const ctx = useContext(LeagueContext)
  if (!ctx) throw new Error('useLeague must be used within LeagueProvider')
  return ctx
}