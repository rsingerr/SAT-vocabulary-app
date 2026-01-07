'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

interface GridCell {
  letter: string | null
  isBlack: boolean
  number: number | null
  across: number | null
  down: number | null
}

interface WordPosition {
  row: number
  col: number
  direction: 'across' | 'down'
  number: number
}

interface CrosswordWord {
  word: {
    id: string
    word: string
    definition: string
  }
  position: WordPosition
  clue: string
}

export default function CrosswordPage() {
  const [grid, setGrid] = useState<GridCell[][]>([])
  const [words, setWords] = useState<CrosswordWord[]>([])
  const [userGrid, setUserGrid] = useState<string[][]>([])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [direction, setDirection] = useState<'across' | 'down'>('across')
  const [wordCount, setWordCount] = useState(15)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [puzzleId, setPuzzleId] = useState<string | null>(null)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isPaused && timer > 0) {
      timerInterval.current = setInterval(() => {
        setTimer((t) => t + 1)
      }, 1000)
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current)
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [isPaused, timer])

  const generatePuzzle = async () => {
    setLoading(true)
    setTimer(0)
    setIsPaused(false)
    try {
      const response = await fetch('/api/crosswords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordCount, difficulty }),
      })
      const data = await response.json()
      
      setGrid(data.grid)
      setWords(data.words)
      setPuzzleId(data.id)
      
      // Initialize user grid
      const newUserGrid = data.grid.map((row: GridCell[]) =>
        row.map((cell) => (cell.isBlack ? '' : ''))
      )
      setUserGrid(newUserGrid)
      setSelectedCell(null)
    } catch (error) {
      console.error('Failed to generate puzzle:', error)
      alert('Failed to generate puzzle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentWord = useCallback((): CrosswordWord | null => {
    if (!selectedCell || grid.length === 0) return null
    
    const { row, col } = selectedCell
    const cell = grid[row][col]
    const wordNumber = direction === 'across' ? cell.across : cell.down
    
    if (!wordNumber) return null
    
    return words.find((w) => w.position.number === wordNumber && w.position.direction === direction) || null
  }, [selectedCell, direction, grid, words])

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isBlack) return
    
    const cell = grid[row][col]
    const newDirection =
      selectedCell?.row === row && selectedCell?.col === col
        ? direction === 'across'
          ? 'down'
          : 'across'
        : cell.across && cell.down
        ? direction
        : cell.across
        ? 'across'
        : 'down'
    
    setSelectedCell({ row, col })
    setDirection(newDirection)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!selectedCell || grid.length === 0) return
    
    const { row, col } = selectedCell
    const currentWord = getCurrentWord()
    
    if (!currentWord) return
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const newGrid = [...userGrid]
      newGrid[row][col] = ''
      setUserGrid(newGrid)
      
      // Move to previous cell
      const pos = currentWord.position
      if (direction === 'across') {
        if (col > pos.col) {
          setSelectedCell({ row, col: col - 1 })
        }
      } else {
        if (row > pos.row) {
          setSelectedCell({ row: row - 1, col })
        }
      }
      return
    }
    
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      const newGrid = [...userGrid]
      newGrid[row][col] = e.key.toUpperCase()
      setUserGrid(newGrid)
      
      // Auto-advance
      const pos = currentWord.position
      const wordLength = currentWord.word.word.length
      
      if (direction === 'across') {
        if (col < pos.col + wordLength - 1) {
          setSelectedCell({ row, col: col + 1 })
        }
      } else {
        if (row < pos.row + wordLength - 1) {
          setSelectedCell({ row: row + 1, col })
        }
      }
    }
    
    // Arrow keys
    if (e.key === 'ArrowRight' && col < grid[0].length - 1) {
      setSelectedCell({ row, col: col + 1 })
    } else if (e.key === 'ArrowLeft' && col > 0) {
      setSelectedCell({ row, col: col - 1 })
    } else if (e.key === 'ArrowDown' && row < grid.length - 1) {
      setSelectedCell({ row: row + 1, col })
    } else if (e.key === 'ArrowUp' && row > 0) {
      setSelectedCell({ row: row - 1, col })
    }
  }

  const checkLetter = () => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    const correct = grid[row][col].letter
    const user = userGrid[row][col]
    alert(user === correct ? 'Correct!' : `Incorrect. The correct letter is ${correct}`)
  }

  const checkWord = () => {
    const currentWord = getCurrentWord()
    if (!currentWord) return
    
    const pos = currentWord.position
    let allCorrect = true
    const word = currentWord.word.word.toUpperCase()
    
    for (let i = 0; i < word.length; i++) {
      const row = pos.direction === 'across' ? pos.row : pos.row + i
      const col = pos.direction === 'across' ? pos.col + i : pos.col
      if (userGrid[row][col] !== word[i]) {
        allCorrect = false
        break
      }
    }
    
    alert(allCorrect ? 'Word is correct!' : 'Word has errors.')
  }

  const revealLetter = () => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    const newGrid = [...userGrid]
    newGrid[row][col] = grid[row][col].letter || ''
    setUserGrid(newGrid)
  }

  const revealWord = () => {
    const currentWord = getCurrentWord()
    if (!currentWord) return
    
    const pos = currentWord.position
    const word = currentWord.word.word.toUpperCase()
    const newGrid = [...userGrid]
    
    for (let i = 0; i < word.length; i++) {
      const row = pos.direction === 'across' ? pos.row : pos.row + i
      const col = pos.direction === 'across' ? pos.col + i : pos.col
      newGrid[row][col] = word[i]
    }
    
    setUserGrid(newGrid)
  }

  const getProgress = () => {
    if (grid.length === 0) return 0
    let total = 0
    let filled = 0
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (!grid[row][col].isBlack) {
          total++
          if (userGrid[row][col]) filled++
        }
      }
    }
    return total > 0 ? (filled / total) * 100 : 0
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentWord = getCurrentWord()
  const acrossWords = words.filter((w) => w.position.direction === 'across')
  const downWords = words.filter((w) => w.position.direction === 'down')

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
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label>
            Words:
            <select
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              style={{ marginLeft: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </label>
          <label>
            Difficulty:
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ marginLeft: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <button onClick={generatePuzzle} className="btn" disabled={loading}>
            {loading ? 'Generating...' : 'New Puzzle'}
          </button>
        </div>

        {grid.length > 0 && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  Timer: {formatTime(timer)}
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <div style={{ fontSize: '16px', color: '#6b7280' }}>
                  Progress: {getProgress().toFixed(1)}%
                </div>
              </div>

              <div
                onKeyDown={handleKeyPress}
                tabIndex={0}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${grid[0].length}, 32px)`,
                  gap: '2px',
                  marginBottom: '16px',
                }}
              >
                {grid.map((row, rowIdx) =>
                  row.map((cell, colIdx) => (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #d1d5db',
                        backgroundColor: cell.isBlack
                          ? '#000'
                          : selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                          ? '#dbeafe'
                          : currentWord &&
                            ((direction === 'across' &&
                              currentWord.position.row === rowIdx &&
                              colIdx >= currentWord.position.col &&
                              colIdx < currentWord.position.col + currentWord.word.word.length) ||
                              (direction === 'down' &&
                                currentWord.position.col === colIdx &&
                                rowIdx >= currentWord.position.row &&
                                rowIdx < currentWord.position.row + currentWord.word.word.length))
                          ? '#e0e7ff'
                          : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: cell.isBlack ? 'default' : 'pointer',
                        position: 'relative',
                      }}
                    >
                      {cell.number && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: '2px',
                            fontSize: '10px',
                            color: '#6b7280',
                          }}
                        >
                          {cell.number}
                        </span>
                      )}
                      {!cell.isBlack && (
                        <span style={{ fontSize: '16px', color: '#1f2937' }}>
                          {userGrid[rowIdx][colIdx] || ''}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={checkLetter} className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                  Check Letter
                </button>
                <button onClick={checkWord} className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                  Check Word
                </button>
                <button onClick={revealLetter} className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                  Reveal Letter
                </button>
                <button onClick={revealWord} className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                  Reveal Word
                </button>
              </div>
            </div>

            <div style={{ minWidth: '300px' }}>
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setDirection('across')}
                  className={direction === 'across' ? 'btn' : 'btn btn-secondary'}
                  style={{ marginRight: '8px', fontSize: '14px', padding: '8px 16px' }}
                >
                  Across
                </button>
                <button
                  onClick={() => setDirection('down')}
                  className={direction === 'down' ? 'btn' : 'btn btn-secondary'}
                  style={{ fontSize: '14px', padding: '8px 16px' }}
                >
                  Down
                </button>
              </div>

              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Across</h3>
                {acrossWords.map((w) => (
                  <div
                    key={w.position.number}
                    style={{
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor:
                        currentWord?.position.number === w.position.number &&
                        currentWord?.position.direction === 'across'
                          ? '#e0e7ff'
                          : 'transparent',
                      borderRadius: '4px',
                    }}
                  >
                    <strong>{w.position.number}.</strong> {w.clue}
                  </div>
                ))}

                <h3 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '18px' }}>Down</h3>
                {downWords.map((w) => (
                  <div
                    key={w.position.number}
                    style={{
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor:
                        currentWord?.position.number === w.position.number &&
                        currentWord?.position.direction === 'down'
                          ? '#e0e7ff'
                          : 'transparent',
                      borderRadius: '4px',
                    }}
                  >
                    <strong>{w.position.number}.</strong> {w.clue}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {grid.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
              Click "New Puzzle" to generate a crossword puzzle
            </p>
          </div>
        )}
      </div>
    </>
  )
}


