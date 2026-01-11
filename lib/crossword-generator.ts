interface Word {
  id: string
  word: string
  definition: string
  partOfSpeech?: string | null
  difficulty: string
}

interface Position {
  row: number
  col: number
  direction: 'across' | 'down'
  number: number
}

interface CrosswordWord {
  word: Word
  position: Position
  clue: string
}

interface GridCell {
  letter: string | null
  isBlack: boolean
  number: number | null
  across: number | null
  down: number | null
}

export class CrosswordGenerator {
  private grid: GridCell[][]
  private gridSize: number
  private words: CrosswordWord[]
  private placedWords: Set<string>
  
  constructor(gridSize: number = 15) {
    this.gridSize = gridSize
    this.grid = this.createEmptyGrid()
    this.words = []
    this.placedWords = new Set()
  }
  
  private createEmptyGrid(): GridCell[][] {
    return Array(this.gridSize)
      .fill(null)
      .map(() =>
        Array(this.gridSize)
          .fill(null)
          .map(() => ({
            letter: null,
            isBlack: false,
            number: null,
            across: null,
            down: null,
          }))
      )
  }
  
  private canPlaceWord(
    word: string,
    row: number,
    col: number,
    direction: 'across' | 'down'
  ): boolean {
    if (direction === 'across') {
      if (col + word.length > this.gridSize) return false
      for (let i = 0; i < word.length; i++) {
        const cell = this.grid[row][col + i]
        if (cell.isBlack) return false
        if (cell.letter && cell.letter !== word[i]) return false
      }
      // Check for valid start: must be at edge OR previous cell is black/empty
      if (col > 0) {
        const prevCell = this.grid[row][col - 1]
        if (prevCell.letter) return false // Can't have a letter right before
      }
      // Check for valid end: must be at edge OR next cell is black/empty
      if (col + word.length < this.gridSize) {
        const nextCell = this.grid[row][col + word.length]
        if (nextCell.letter) return false // Can't have a letter right after
      }
    } else {
      if (row + word.length > this.gridSize) return false
      for (let i = 0; i < word.length; i++) {
        const cell = this.grid[row + i][col]
        if (cell.isBlack) return false
        if (cell.letter && cell.letter !== word[i]) return false
      }
      // Check for valid start: must be at edge OR previous cell is black/empty
      if (row > 0) {
        const prevCell = this.grid[row - 1][col]
        if (prevCell.letter) return false // Can't have a letter right before
      }
      // Check for valid end: must be at edge OR next cell is black/empty
      if (row + word.length < this.gridSize) {
        const nextCell = this.grid[row + word.length][col]
        if (nextCell.letter) return false // Can't have a letter right after
      }
    }
    return true
  }
  
  private placeWord(
    word: string,
    row: number,
    col: number,
    direction: 'across' | 'down',
    number: number
  ): void {
    for (let i = 0; i < word.length; i++) {
      if (direction === 'across') {
        const cell = this.grid[row][col + i]
        cell.letter = word[i]
        cell.across = number
        // Set number if this is the start of the word OR if this cell doesn't have a number yet (intersection)
        if (i === 0 || !cell.number) {
          cell.number = number
        }
      } else {
        const cell = this.grid[row + i][col]
        cell.letter = word[i]
        cell.down = number
        // Set number if this is the start of the word OR if this cell doesn't have a number yet (intersection)
        if (i === 0 || !cell.number) {
          cell.number = number
        }
      }
    }
  }
  
  private findIntersections(word: string, existingWords: CrosswordWord[]): Array<{
    word: CrosswordWord
    position: { row: number; col: number; direction: 'across' | 'down' }
    intersection: { wordIndex: number; existingIndex: number }
  }> {
    const intersections: Array<{
      word: CrosswordWord
      position: { row: number; col: number; direction: 'across' | 'down' }
      intersection: { wordIndex: number; existingIndex: number }
    }> = []
    
    for (const existing of existingWords) {
      const existingWord = existing.word.word.toLowerCase()
      const existingPos = existing.position
      
      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < existingWord.length; j++) {
          if (word[i] === existingWord[j]) {
            if (existingPos.direction === 'across') {
              const newRow = existingPos.row
              const newCol = existingPos.col + j - i
              if (newCol >= 0 && newCol + word.length <= this.gridSize) {
                intersections.push({
                  word: existing,
                  position: { row: newRow, col: newCol, direction: 'down' },
                  intersection: { wordIndex: i, existingIndex: j },
                })
              }
            } else {
              const newRow = existingPos.row + j - i
              const newCol = existingPos.col
              if (newRow >= 0 && newRow + word.length <= this.gridSize) {
                intersections.push({
                  word: existing,
                  position: { row: newRow, col: newCol, direction: 'across' },
                  intersection: { wordIndex: i, existingIndex: j },
                })
              }
            }
          }
        }
      }
    }
    
    return intersections
  }
  
  generateClue(word: Word, difficulty: string): string {
    if (difficulty === 'easy') {
      return word.definition
    } else if (difficulty === 'hard') {
      // Use synonyms or indirect clues
      if (word.partOfSpeech) {
        return `${word.partOfSpeech}: ${word.definition.split('.')[0]}`
      }
      return word.definition
    } else {
      // Medium: mix of definition and part of speech
      return word.partOfSpeech
        ? `${word.partOfSpeech}: ${word.definition}`
        : word.definition
    }
  }
  
  generate(words: Word[], wordCount: number, difficulty: string, maxAttempts: number = 10): {
    success: boolean
    grid: GridCell[][]
    words: CrosswordWord[]
    seed: string
  } {
    // Filter words by difficulty
    const filteredWords = words.filter((w) => w.difficulty === difficulty)
    if (filteredWords.length === 0) {
      // Fallback to all words if no words match difficulty
      words = words
    } else {
      words = filteredWords
    }
    
    // Sort by length (longer first for better intersections)
    const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      this.grid = this.createEmptyGrid()
      this.words = []
      this.placedWords = new Set()
      
      // Shuffle words for this attempt
      const shuffled = [...sortedWords].sort(() => Math.random() - 0.5)
      const wordsToPlace = shuffled.slice(0, wordCount)
      
      // Place first word in center
      if (wordsToPlace.length > 0) {
        const firstWord = wordsToPlace[0]
        const firstWordLower = firstWord.word.toLowerCase()
        const startRow = Math.floor(this.gridSize / 2)
        const startCol = Math.floor((this.gridSize - firstWordLower.length) / 2)
        
        if (this.canPlaceWord(firstWordLower, startRow, startCol, 'across')) {
          this.placeWord(firstWordLower, startRow, startCol, 'across', 1)
          this.words.push({
            word: firstWord,
            position: {
              row: startRow,
              col: startCol,
              direction: 'across',
              number: 1,
            },
            clue: this.generateClue(firstWord, difficulty),
          })
          this.placedWords.add(firstWord.id)
        }
      }
      
      // Place remaining words with intersections
      let nextNumber = 2
      for (let i = 1; i < wordsToPlace.length; i++) {
        const word = wordsToPlace[i]
        const wordLower = word.word.toLowerCase()
        
        if (this.placedWords.has(word.id)) continue
        
        const intersections = this.findIntersections(wordLower, this.words)
        
        if (intersections.length > 0) {
          // Try to place at intersection
          const intersection = intersections[Math.floor(Math.random() * intersections.length)]
          const { position } = intersection
          
          if (this.canPlaceWord(wordLower, position.row, position.col, position.direction)) {
            this.placeWord(wordLower, position.row, position.col, position.direction, nextNumber)
            this.words.push({
              word,
              position: {
                row: position.row,
                col: position.col,
                direction: position.direction,
                number: nextNumber,
              },
              clue: this.generateClue(word, difficulty),
            })
            this.placedWords.add(word.id)
            nextNumber++
          }
        } else {
          // Try to place without intersection (near existing words)
          let placed = false
          for (const existing of this.words) {
            const existingWord = existing.word.word.toLowerCase()
            for (let j = 0; j < wordLower.length && !placed; j++) {
              for (let k = 0; k < existingWord.length && !placed; k++) {
                if (wordLower[j] === existingWord[k]) {
                  const existingPos = existing.position
                  let newRow: number, newCol: number, newDir: 'across' | 'down'
                  
                  if (existingPos.direction === 'across') {
                    newRow = existingPos.row
                    newCol = existingPos.col + k - j
                    newDir = 'down'
                  } else {
                    newRow = existingPos.row + k - j
                    newCol = existingPos.col
                    newDir = 'across'
                  }
                  
                  if (
                    newRow >= 0 &&
                    newCol >= 0 &&
                    this.canPlaceWord(wordLower, newRow, newCol, newDir)
                  ) {
                    this.placeWord(wordLower, newRow, newCol, newDir, nextNumber)
                    this.words.push({
                      word,
                      position: {
                        row: newRow,
                        col: newCol,
                        direction: newDir,
                        number: nextNumber,
                      },
                      clue: this.generateClue(word, difficulty),
                    })
                    this.placedWords.add(word.id)
                    nextNumber++
                    placed = true
                  }
                }
              }
            }
          }
        }
      }
      
      // Fill in black squares
      this.fillBlackSquares()
      
      // Check if we placed enough words
      if (this.words.length >= Math.min(wordCount, wordsToPlace.length)) {
        const seed = `${Date.now()}-${wordCount}-${difficulty}`
        return {
          success: true,
          grid: this.grid,
          words: this.words,
          seed,
        }
      }
    }
    
    // If all attempts failed, return partial result
    this.fillBlackSquares()
    const seed = `${Date.now()}-${wordCount}-${difficulty}`
    return {
      success: this.words.length > 0,
      grid: this.grid,
      words: this.words,
      seed,
    }
  }
  
  private fillBlackSquares(): void {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.grid[row][col]
        if (!cell.letter && !cell.isBlack) {
          // Check if this should be a black square
          const hasNeighbor = 
            (row > 0 && this.grid[row - 1][col].letter) ||
            (row < this.gridSize - 1 && this.grid[row + 1][col].letter) ||
            (col > 0 && this.grid[row][col - 1].letter) ||
            (col < this.gridSize - 1 && this.grid[row][col + 1].letter)
          
          if (!hasNeighbor) {
            cell.isBlack = true
          }
        }
      }
    }
  }
}


