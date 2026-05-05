import './globals.css'
import NavAndTicker from '@/components/NavAndTicker'
import { OddsProvider } from '@/components/OddsToggle'
export const metadata = { title: 'MatchEdge - Football Analytics and Tipping', description: 'AI-powered football predictions.' }
export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <OddsProvider>
          <NavAndTicker />
          <main className='container' style={{ paddingTop: '16px', paddingBottom: '40px' }}>{children}</main>
        </OddsProvider>
      </body>
    </html>
  )
}