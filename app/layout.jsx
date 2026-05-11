import NavAndTicker from '@/components/NavAndTicker'
import GambleWarning from '@/components/GambleWarning'
import { LeagueProvider } from '@/context/LeagueContext'
import './globals.css'

export const metadata = {
  title: 'MatchEdge - Football Intelligence',
  description: 'AI-powered football analytics and tipster picks across 6 European leagues and the World Cup.',
  icons: { icon: '/favicon.ico' }
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body style={{ margin: 0, background: '#0B0E11', color: '#E6EDF3', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <LeagueProvider>
          <NavAndTicker />
          <main style={{ flex: 1, maxWidth: '960px', margin: '0 auto', padding: '24px 16px', width: '100%', boxSizing: 'border-box' }}>
            {children}
          </main>
          <GambleWarning />
        </LeagueProvider>
      </body>
    </html>
  )
}