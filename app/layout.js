import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'LetterHead Pro — Create Professional Letterheads in Minutes',
  description: 'AI-powered letterhead builder for businesses, CAs, lawyers, doctors, NGOs and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
