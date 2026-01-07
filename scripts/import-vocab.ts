import { PrismaClient } from '@prisma/client'
import { loadVocabFile } from '../lib/vocab-check'

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

async function importVocab() {
  try {
    console.log('Loading SAT vocabulary file...')
    const vocab = loadVocabFile()
    
    console.log(`Found ${vocab.length} words. Starting import...`)
    
    // Clear existing words
    await prisma.word.deleteMany({})
    console.log('Cleared existing words.')
    
    let imported = 0
    let skipped = 0
    
    for (const entry of vocab) {
      try {
        // Skip placeholder entries
        if ((entry as any)._note || (entry as any)._source || (entry as any)._format) {
          continue
        }
        
        const vocabEntry = entry as VocabEntry
        
        if (!vocabEntry.word || !vocabEntry.definition) {
          console.warn(`Skipping entry missing word or definition:`, entry)
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
        if (imported % 50 === 0) {
          console.log(`Imported ${imported} words...`)
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.warn(`Duplicate word skipped: ${entry.word}`)
          skipped++
        } else {
          console.error(`Error importing word ${entry.word}:`, error.message)
          skipped++
        }
      }
    }
    
    console.log(`\nImport complete!`)
    console.log(`Imported: ${imported}`)
    console.log(`Skipped: ${skipped}`)
    
    const totalWords = await prisma.word.count()
    console.log(`Total words in database: ${totalWords}`)
    
  } catch (error: any) {
    console.error('Import failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importVocab()

