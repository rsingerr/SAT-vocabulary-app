import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CrosswordGenerator } from '@/lib/crossword-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { wordCount = 15, difficulty = 'medium', seed, wordIds } = body
    
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'difficulty must be easy, medium, or hard' },
        { status: 400 }
      )
    }
    
    // Check if puzzle with this seed already exists
    if (seed) {
      const existing = await prisma.crossword.findUnique({
        where: { seed },
        include: { crosswordWords: { include: { word: true } } },
      })
      
      if (existing) {
        return NextResponse.json({
          id: existing.id,
          seed: existing.seed,
          grid: JSON.parse(existing.grid),
          words: existing.crosswordWords.map((cw) => ({
            word: cw.word,
            position: JSON.parse(cw.position),
            clue: JSON.parse(existing.clues)[cw.word.word] || cw.word.definition,
          })),
        })
      }
    }
    
    // Get words from database
    let words: any[]
    if (wordIds && Array.isArray(wordIds) && wordIds.length > 0) {
      // Use specific word IDs (from flashcard study set)
      words = await prisma.word.findMany({
        where: { id: { in: wordIds } },
      })
      wordCount = words.length // Use all words from the set
    } else {
      // For regular crossword generation, validate wordCount
      if (![10, 15, 20].includes(wordCount)) {
        return NextResponse.json(
          { error: 'wordCount must be 10, 15, or 20' },
          { status: 400 }
        )
      }
      
      // Get words by difficulty
      words = await prisma.word.findMany({
        where: { difficulty },
      })
      
      if (words.length < wordCount) {
        // Fallback to all words if not enough for difficulty
        const allWords = await prisma.word.findMany({})
        words.push(...allWords.filter((w) => !words.find((dw) => dw.id === w.id)))
      }
    }
    
    if (words.length === 0) {
      return NextResponse.json(
        { error: 'No words found in database. Please import vocabulary first.' },
        { status: 400 }
      )
    }
    
    // Generate crossword
    const generator = new CrosswordGenerator(15)
    const result = generator.generate(words, wordCount, difficulty)
    
    if (!result.success) {
      console.error('Crossword generation failed:', {
        wordsPlaced: result.words.length,
        wordCount,
        difficulty,
      })
      return NextResponse.json(
        { error: `Failed to generate crossword puzzle. Only placed ${result.words.length} of ${wordCount} words.` },
        { status: 500 }
      )
    }
    
    // Save to database
    const finalSeed = seed || result.seed
    const clues: Record<string, string> = {}
    result.words.forEach((cw) => {
      clues[cw.word.word] = cw.clue
    })
    
    const crossword = await prisma.crossword.create({
      data: {
        seed: finalSeed,
        wordCount: result.words.length,
        difficulty,
        grid: JSON.stringify(result.grid),
        clues: JSON.stringify(clues),
        words: JSON.stringify(
          result.words.map((w) => ({
            word: w.word.word,
            position: w.position,
          }))
        ),
        crosswordWords: {
          create: result.words.map((w) => ({
            wordId: w.word.id,
            position: JSON.stringify(w.position),
          })),
        },
      },
      include: {
        crosswordWords: { include: { word: true } },
      },
    })
    
    return NextResponse.json({
      id: crossword.id,
      seed: crossword.seed,
      grid: result.grid,
      words: result.words,
    })
  } catch (error: any) {
    console.error('Crossword generation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


