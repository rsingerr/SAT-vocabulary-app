'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface FlashcardProgress {
  id: string
  wordId: string
  accuracy: number
  reviewCount: number
  masteryLevel: number
  lastReviewed: string
  word: {
    word: string
    definition: string
  }
}

interface CrosswordProgress {
  id: string
  crosswordId: string
  timeElapsed: number
  completed: boolean
  accuracy: number
  bestTime: number | null
  attempts: number
  crossword: {
    seed: string
    wordCount: number
    difficulty: string
  }
}

export default function ProgressPage() {
  const [flashcardProgress, setFlashcardProgress] = useState<FlashcardProgress[]>([])
  const [crosswordProgress, setCrosswordProgress] = useState<CrosswordProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    setLoading(true)
    try {
      const [flashcardRes, crosswordRes] = await Promise.all([
        fetch('/api/flashcards/progress'),
        fetch('/api/crosswords/progress'),
      ])
      
      const flashcardData = await flashcardRes.json()
      const crosswordData = await crosswordRes.json()
      
      setFlashcardProgress(flashcardData)
      setCrosswordProgress(crosswordData)
    } catch (error) {
      console.error('Failed to load progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMasteryStats = () => {
    const total = flashcardProgress.length
    const byLevel = [0, 0, 0, 0, 0, 0]
    flashcardProgress.forEach((p) => {
      byLevel[p.masteryLevel]++
    })
    return { total, byLevel }
  }

  const getAverageAccuracy = () => {
    if (flashcardProgress.length === 0) return 0
    const sum = flashcardProgress.reduce((acc, p) => acc + p.accuracy, 0)
    return sum / flashcardProgress.length
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading progress...</div>
      </div>
    )
  }

  const masteryStats = getMasteryStats()
  const avgAccuracy = getAverageAccuracy()

  return (
    <>
      <nav className="nav">
        <div className="nav-content">
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            SAT Vocabulary
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/flashcards" className="nav-link">Flashcards</Link>
            <Link href="/crossword" className="nav-link">Crossword</Link>
            <Link href="/progress" className="nav-link">Progress</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <h1 style={{ fontSize: '36px', marginBottom: '32px' }}>Your Progress</h1>

        <div className="grid grid-2" style={{ marginBottom: '32px' }}>
          <div className="card">
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Flashcard Statistics</h2>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                <strong>Total Words Reviewed:</strong> {masteryStats.total}
              </p>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                <strong>Average Accuracy:</strong> {(avgAccuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p style={{ marginBottom: '12px', fontWeight: '500' }}>Mastery Levels:</p>
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <div key={level} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Level {level}:</span>
                    <span>{masteryStats.byLevel[level]} words</span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(masteryStats.byLevel[level] / Math.max(1, masteryStats.total)) * 100}%`,
                        backgroundColor: level >= 4 ? '#10b981' : level >= 2 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Crossword Statistics</h2>
            <div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                <strong>Puzzles Attempted:</strong> {crosswordProgress.length}
              </p>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                <strong>Puzzles Completed:</strong>{' '}
                {crosswordProgress.filter((p) => p.completed).length}
              </p>
              {crosswordProgress.length > 0 && (
                <>
                  <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                    <strong>Average Time:</strong>{' '}
                    {formatTime(
                      Math.round(
                        crosswordProgress.reduce((acc, p) => acc + p.timeElapsed, 0) /
                          crosswordProgress.length
                      )
                    )}
                  </p>
                  <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                    <strong>Best Time:</strong>{' '}
                    {formatTime(
                      Math.min(
                        ...crosswordProgress
                          .filter((p) => p.bestTime)
                          .map((p) => p.bestTime!)
                      )
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Recent Flashcard Progress</h2>
          {flashcardProgress.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No flashcard progress yet. Start studying!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Word</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Definition</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Accuracy</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Reviews</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Mastery</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Last Reviewed</th>
                  </tr>
                </thead>
                <tbody>
                  {flashcardProgress.slice(0, 20).map((progress) => (
                    <tr key={progress.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>
                        {progress.word.word}
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>
                        {progress.word.definition.substring(0, 50)}
                        {progress.word.definition.length > 50 ? '...' : ''}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {(progress.accuracy * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {progress.reviewCount}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              progress.masteryLevel >= 4
                                ? '#d1fae5'
                                : progress.masteryLevel >= 2
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              progress.masteryLevel >= 4
                                ? '#065f46'
                                : progress.masteryLevel >= 2
                                ? '#92400e'
                                : '#991b1b',
                          }}
                        >
                          {progress.masteryLevel}/5
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>
                        {new Date(progress.lastReviewed).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Crossword Attempts</h2>
          {crosswordProgress.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No crossword attempts yet. Start playing!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Difficulty</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Words</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Best Time</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Completed</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {crosswordProgress.map((progress) => (
                    <tr key={progress.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                        {progress.crossword.difficulty}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {progress.crossword.wordCount}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {formatTime(progress.timeElapsed)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {progress.bestTime ? formatTime(progress.bestTime) : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {progress.completed ? '✅' : '❌'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {progress.attempts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


