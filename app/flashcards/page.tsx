'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Word {
  id: string
  word: string
  partOfSpeech: string | null
  definition: string
  synonyms: string | null
  exampleSentence: string | null
  difficulty: string
}

export default function FlashcardsPage() {
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showSynonyms, setShowSynonyms] = useState(false)
  const [studySetSize, setStudySetSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ correct: 0, total: 0 })

  useEffect(() => {
    loadWords()
  }, [studySetSize])

  const loadWords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/words?limit=${studySetSize}&random=true`)
      const data = await response.json()
      setWords(data)
      setCurrentIndex(0)
      setIsFlipped(false)
      setShowSynonyms(false)
      setStats({ correct: 0, total: 0 })
    } catch (error) {
      console.error('Failed to load words:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKnowIt = async () => {
    if (words.length === 0) return
    
    const word = words[currentIndex]
    setStats({ ...stats, correct: stats.correct + 1, total: stats.total + 1 })
    
    // Save progress
    await fetch('/api/flashcards/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: word.id, correct: true }),
    })
    
    nextCard()
  }

  const handleReviewAgain = async () => {
    if (words.length === 0) return
    
    const word = words[currentIndex]
    setStats({ ...stats, total: stats.total + 1 })
    
    // Save progress
    await fetch('/api/flashcards/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId: word.id, correct: false }),
    })
    
    nextCard()
  }

  const nextCard = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setShowSynonyms(false)
    } else {
      // Study set complete
      alert(`Study session complete! Accuracy: ${((stats.correct / stats.total) * 100).toFixed(1)}%`)
      loadWords()
    }
  }

  const currentWord = words[currentIndex]
  const synonyms = currentWord?.synonyms
    ? (() => {
        try {
          return JSON.parse(currentWord.synonyms)
        } catch {
          return currentWord.synonyms.split(',').map((s: string) => s.trim())
        }
      })()
    : []

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading words...</div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <h2>No words available</h2>
          <p>Please import vocabulary first.</p>
          <Link href="/admin" className="btn">Go to Admin</Link>
        </div>
      </div>
    )
  }

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
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label>
            Study Set Size:
            <select
              value={studySetSize}
              onChange={(e) => setStudySetSize(Number(e.target.value))}
              style={{ marginLeft: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value={10}>10 words</option>
              <option value={20}>20 words</option>
              <option value={30}>30 words</option>
            </select>
          </label>
          <button onClick={loadWords} className="btn btn-secondary">
            New Set
          </button>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ minHeight: '400px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              {currentIndex + 1} / {words.length}
            </div>

            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              {!isFlipped ? (
                <div>
                  <h2
                    style={{
                      fontSize: '48px',
                      marginBottom: '24px',
                      color: '#1f2937',
                      fontWeight: 'bold',
                    }}
                  >
                    {currentWord.word}
                  </h2>
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="btn"
                    style={{ marginTop: '32px' }}
                  >
                    Show Definition
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#e0e7ff',
                        color: '#4f46e5',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      {currentWord.partOfSpeech || 'word'}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '20px',
                      marginBottom: '24px',
                      lineHeight: '1.6',
                      color: '#374151',
                    }}
                  >
                    {currentWord.definition}
                  </p>
                  {currentWord.exampleSentence && (
                    <p
                      style={{
                        fontSize: '16px',
                        marginBottom: '24px',
                        fontStyle: 'italic',
                        color: '#6b7280',
                        lineHeight: '1.6',
                      }}
                    >
                      "{currentWord.exampleSentence}"
                    </p>
                  )}
                  {synonyms.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      {!showSynonyms ? (
                        <button
                          onClick={() => setShowSynonyms(true)}
                          className="btn btn-secondary"
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          Show Synonyms
                        </button>
                      ) : (
                        <div>
                          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                            Synonyms:
                          </p>
                          <p style={{ fontSize: '16px', color: '#374151' }}>
                            {synonyms.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={handleReviewAgain} className="btn btn-danger">
                      Review Again
                    </button>
                    <button onClick={handleKnowIt} className="btn btn-success">
                      Know It
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '16px',
              color: '#6b7280',
            }}
          >
            Accuracy: {stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0}% (
            {stats.correct} / {stats.total})
          </div>
        </div>
      </div>
    </>
  )
}


