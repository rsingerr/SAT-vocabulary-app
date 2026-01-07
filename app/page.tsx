'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [vocabReady, setVocabReady] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if vocab file exists (client-side check)
    fetch('/api/check-vocab')
      .then((res) => res.json())
      .then((data) => setVocabReady(data.exists))
      .catch(() => setVocabReady(false))
  }, [])

  if (vocabReady === false) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '40px auto' }}>
          <h1 style={{ marginBottom: '16px', color: '#ef4444' }}>
            ⚠️ Vocabulary File Missing
          </h1>
          <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
            The SAT vocabulary file is not found. Please create{' '}
            <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
              data/sats_vocab.json
            </code>{' '}
            with the official SAT vocabulary list.
          </p>
          <p style={{ marginBottom: '24px', lineHeight: '1.6', color: '#6b7280' }}>
            Once you have created the file, run:{' '}
            <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
              npm run db:import
            </code>
          </p>
          <Link href="/admin" className="btn">
            Go to Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-content">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>SAT Vocabulary</h1>
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/flashcards" className="nav-link">Flashcards</Link>
            <Link href="/crossword" className="nav-link">Crossword</Link>
            <Link href="/progress" className="nav-link">Progress</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', color: '#1f2937' }}>
            SAT Vocabulary Study
          </h1>
          <p style={{ fontSize: '20px', color: '#6b7280' }}>
            Master SAT vocabulary with flashcards and crossword puzzles
          </p>
        </div>

        <div className="grid grid-2" style={{ marginTop: '48px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>📚 Flashcards</h2>
            <p style={{ marginBottom: '24px', color: '#6b7280', lineHeight: '1.6' }}>
              Study SAT vocabulary words with interactive flashcards. Track your progress
              and adapt difficulty based on your performance.
            </p>
            <Link href="/flashcards" className="btn">
              Start Studying
            </Link>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>🧩 Crossword</h2>
            <p style={{ marginBottom: '24px', color: '#6b7280', lineHeight: '1.6' }}>
              Practice SAT words with interactive crossword puzzles. Choose your
              difficulty level and challenge yourself.
            </p>
            <Link href="/crossword" className="btn">
              Play Puzzle
            </Link>
          </div>
        </div>

        <div className="card" style={{ marginTop: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Track Your Progress</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280', lineHeight: '1.6' }}>
            View your accuracy, mastery levels, and completion rates for both flashcards
            and crossword puzzles.
          </p>
          <Link href="/progress" className="btn btn-secondary">
            View Progress
          </Link>
        </div>
      </div>
    </>
  )
}

