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

interface SavedSet {
  id: string
  wordIds: string[]
  createdAt: number
  wordCount: number
}

export default function FlashcardsPage() {
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showSynonyms, setShowSynonyms] = useState(false)
  const [studySetSize, setStudySetSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ correct: 0, total: 0 })
  const [sessionComplete, setSessionComplete] = useState(false)
  const [studySetWordIds, setStudySetWordIds] = useState<string[]>([])
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([])
  const [savedSets, setSavedSets] = useState<SavedSet[]>([])
  const [showSavedSets, setShowSavedSets] = useState(false)

  useEffect(() => {
    loadWords()
    loadSavedSets()
  }, [studySetSize])
  
  const loadSavedSets = () => {
    try {
      const saved = localStorage.getItem('flashcardSavedSets')
      if (saved) {
        setSavedSets(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load saved sets:', error)
    }
  }
  
  const saveCurrentSet = () => {
    if (studySetWordIds.length === 0) return
    
    const newSet: SavedSet = {
      id: Date.now().toString(),
      wordIds: [...studySetWordIds],
      createdAt: Date.now(),
      wordCount: studySetWordIds.length,
    }
    
    const updatedSets = [newSet, ...savedSets].slice(0, 20) // Keep max 20 sets
    setSavedSets(updatedSets)
    
    try {
      localStorage.setItem('flashcardSavedSets', JSON.stringify(updatedSets))
    } catch (error) {
      console.error('Failed to save set:', error)
    }
  }
  
  const loadSavedSet = async (set: SavedSet) => {
    setLoading(true)
    setSessionComplete(false)
    try {
      const idsParam = set.wordIds.join(',')
      const response = await fetch(`/api/words?ids=${idsParam}`)
      const data = await response.json()
      
      if (data.length > 0) {
        setWords(data)
        setStudySetWordIds(set.wordIds)
        setCurrentIndex(0)
        setIsFlipped(false)
        setShowSynonyms(false)
        setStats({ correct: 0, total: 0 })
        setWrongWordIds([])
        setShowSavedSets(false)
      }
    } catch (error) {
      console.error('Failed to load saved set:', error)
      alert('Failed to load saved set. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const deleteSavedSet = (setId: string) => {
    const updatedSets = savedSets.filter(s => s.id !== setId)
    setSavedSets(updatedSets)
    
    try {
      localStorage.setItem('flashcardSavedSets', JSON.stringify(updatedSets))
    } catch (error) {
      console.error('Failed to delete set:', error)
    }
  }

  const loadWords = async () => {
    setLoading(true)
    setSessionComplete(false)
    try {
      const response = await fetch(`/api/words?limit=${studySetSize}&random=true`)
      const data = await response.json()
      setWords(data)
      setStudySetWordIds(data.map((w: Word) => w.id))
      setCurrentIndex(0)
      setIsFlipped(false)
      setShowSynonyms(false)
      setStats({ correct: 0, total: 0 })
      setWrongWordIds([])
    } catch (error) {
      console.error('Failed to load words:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const redoEntireSet = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowSynonyms(false)
    setStats({ correct: 0, total: 0 })
    setSessionComplete(false)
    setWrongWordIds([])
  }
  
  const redoWrongOnes = async () => {
    if (wrongWordIds.length === 0) return
    
    setLoading(true)
    try {
      // Fetch the words that were answered incorrectly
      const idsParam = wrongWordIds.join(',')
      const response = await fetch(`/api/words?ids=${idsParam}`)
      const wrongWords = await response.json()
      
      if (wrongWords.length > 0) {
        // Shuffle the wrong words for variety
        const shuffled = [...wrongWords].sort(() => Math.random() - 0.5)
        setWords(shuffled)
        setStudySetWordIds(shuffled.map((w: Word) => w.id))
        setCurrentIndex(0)
        setIsFlipped(false)
        setShowSynonyms(false)
        setStats({ correct: 0, total: 0 })
        setSessionComplete(false)
        setWrongWordIds([]) // Reset for this new session
      } else {
        alert('Could not find the words. Please try again.')
      }
    } catch (error) {
      console.error('Failed to load wrong words:', error)
      alert('Failed to load words. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const startCrossword = () => {
    // Navigate to crossword page with word IDs
    const wordIdsParam = studySetWordIds.join(',')
    window.location.href = `/crossword?wordIds=${wordIdsParam}`
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
    
    // Track wrong words for "Redo Wrong Ones" feature
    setWrongWordIds(prev => [...prev, word.id])
    
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
      setSessionComplete(true)
      // Auto-save the set when completed
      saveCurrentSet()
    }
  }
  
  const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  const canRedoWrong = sessionComplete && accuracy < 100 && wrongWordIds.length > 0
  const canPlayCrossword = sessionComplete && accuracy === 100 && stats.total === words.length

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
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <button 
            onClick={() => setShowSavedSets(!showSavedSets)} 
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            {showSavedSets ? 'Hide' : 'Show'} Saved Sets ({savedSets.length})
          </button>
        </div>
        
        {showSavedSets && savedSets.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Saved Flashcard Sets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedSets.map((set) => (
                <div 
                  key={set.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px', 
                    backgroundColor: '#fff', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {set.wordCount} words
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(set.createdAt).toLocaleDateString()} {new Date(set.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => loadSavedSet(set)}
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteSavedSet(set.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showSavedSets && savedSets.length === 0 && (
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center', color: '#6b7280' }}>
            No saved sets yet. Complete a flashcard session to save it here.
          </div>
        )}

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
            Accuracy: {accuracy.toFixed(1)}% ({stats.correct} / {stats.total})
          </div>

          {sessionComplete && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              {canPlayCrossword && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ marginBottom: '16px', fontSize: '18px', color: '#059669', fontWeight: 'bold' }}>
                    Perfect! You got 100%! 🎉
                  </p>
                  <button onClick={startCrossword} className="btn btn-success" style={{ fontSize: '16px', padding: '12px 24px', marginRight: '12px' }}>
                    Play Crossword Puzzle with These Words
                  </button>
                  <button onClick={redoEntireSet} className="btn btn-secondary" style={{ fontSize: '16px', padding: '12px 24px' }}>
                    Redo Entire Set
                  </button>
                </div>
              )}
              {!canPlayCrossword && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ marginBottom: '16px', fontSize: '16px', color: '#6b7280' }}>
                    Study session complete! You got {stats.correct} out of {stats.total} correct ({accuracy.toFixed(1)}%).
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {canRedoWrong && (
                      <button onClick={redoWrongOnes} className="btn" style={{ fontSize: '16px', padding: '12px 24px' }}>
                        Redo Wrong Ones ({wrongWordIds.length})
                      </button>
                    )}
                    <button onClick={redoEntireSet} className="btn" style={{ fontSize: '16px', padding: '12px 24px' }}>
                      Redo Entire Set
                    </button>
                    <button onClick={loadWords} className="btn btn-secondary" style={{ fontSize: '16px', padding: '12px 24px' }}>
                      New Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


