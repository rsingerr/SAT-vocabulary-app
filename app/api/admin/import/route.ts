import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { loadVocabFile } from '@/lib/vocab-check'

const prisma = new PrismaClient()

interface VocabEntry {
  word: string
  partOfSpeech?: string
  definition: string
  synonyms?: string[] | string
  exampleSentence?: string
  difficulty?: string
}

function determineDifficulty(word: string, definition: string): string {
  const length = word.length
  const defLength = definition.length
  
  if (length <= 5 && defLength <= 50) return 'easy'
  if (length >= 10 || defLength >= 100) return 'hard'
  return 'medium'
}

export async function POST() {
  try {
    const vocab = loadVocabFile()
    
    // Clear existing words
    await prisma.word.deleteMany({})
    
    let imported = 0
    let skipped = 0
    
    for (const entry of vocab) {
      try {
        // Skip placeholder entries
        if (entry._note || entry._source || entry._format) {
          continue
        }
        
        const vocabEntry = entry as VocabEntry
        
        if (!vocabEntry.word || !vocabEntry.definition) {
          skipped++
          continue
        }
        
        const synonyms = Array.isArray(vocabEntry.synonyms)
          ? JSON.stringify(vocabEntry.synonyms)
          : typeof vocabEntry.synonyms === 'string'
          ? vocabEntry.synonyms
          : null
        
        const difficulty = vocabEntry.difficulty || determineDifficulty(
          vocabEntry.word,
          vocabEntry.definition
        )
        
        await prisma.word.create({
          data: {
            word: vocabEntry.word.toLowerCase().trim(),
            partOfSpeech: vocabEntry.partOfSpeech || null,
            definition: vocabEntry.definition,
            synonyms: synonyms,
            exampleSentence: vocabEntry.exampleSentence || null,
            difficulty: difficulty,
          },
        })
        
        imported++
      } catch (error: any) {
        if (error.code === 'P2002') {
          skipped++
        } else {
          console.error(`Error importing word ${entry.word}:`, error.message)
          skipped++
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      count: imported,
      skipped,
      message: `Imported ${imported} words, skipped ${skipped}`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

