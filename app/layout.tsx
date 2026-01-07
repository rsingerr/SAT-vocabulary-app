import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAT Vocabulary Study App',
  description: 'Study and practice SAT vocabulary with flashcards and crossword puzzles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


