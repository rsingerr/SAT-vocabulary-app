import fs from 'fs'
import path from 'path'

interface VocabEntry {
  word: string
  partOfSpeech?: string
  definition: string
  synonyms?: string[]
  exampleSentence?: string
}

function parseLine(line: string): VocabEntry | null {
  line = line.trim()
  if (!line) return null
  
  // Pattern: word (partOfSpeech) definition (example sentence)
  // Example: "aesthetic (adj.)  artistic, related to the appreciation of beauty (We hired Susan as our"
  
  // Match word, part of speech, definition, and example
  const match = line.match(/^([a-z]+)\s*\(([^)]+)\)\s+(.+?)(?:\s*\(([^)]+))?/i)
  
  if (!match) {
    // Try simpler pattern without part of speech
    const simpleMatch = line.match(/^([a-z]+)\s+(.+?)(?:\s*\(([^)]+))?/i)
    if (simpleMatch) {
      return {
        word: simpleMatch[1].toLowerCase().trim(),
        definition: simpleMatch[2].trim(),
        exampleSentence: simpleMatch[3]?.trim() || undefined,
      }
    }
    return null
  }
  
  const word = match[1].toLowerCase().trim()
  const partOfSpeech = match[2].trim()
  let definition = match[3].trim()
  const exampleSentence = match[4]?.trim()
  
  // Clean up definition - remove trailing incomplete sentences
  definition = definition.replace(/\s*\([^)]*$/, '').trim()
  
  // Extract part of speech abbreviation
  let pos: string | undefined
  if (partOfSpeech.includes('adj')) pos = 'adjective'
  else if (partOfSpeech.includes('adv')) pos = 'adverb'
  else if (partOfSpeech.includes('n.')) pos = 'noun'
  else if (partOfSpeech.includes('v.')) pos = 'verb'
  else if (partOfSpeech.includes('prep')) pos = 'preposition'
  else if (partOfSpeech.includes('conj')) pos = 'conjunction'
  else pos = partOfSpeech
  
  return {
    word,
    partOfSpeech: pos,
    definition,
    exampleSentence: exampleSentence || undefined,
  }
}

async function parseSatWordsWithDefinitions() {
  const inputPath = path.join(process.cwd(), '..', 'Downloads', 'sats_words_with_definitions.txt')
  const outputPath = path.join(process.cwd(), 'data', 'sats_vocab.json')
  
  console.log('Reading SAT words with definitions file...')
  const content = fs.readFileSync(inputPath, 'utf-8')
  const lines = content.split('\n')
  
  console.log(`Found ${lines.length} lines`)
  
  const vocabEntries: VocabEntry[] = []
  let currentEntry: string[] = []
  
  // Some entries span multiple lines, so we need to combine them
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      if (currentEntry.length > 0) {
        const combined = currentEntry.join(' ')
        const parsed = parseLine(combined)
        if (parsed) {
          vocabEntries.push(parsed)
        }
        currentEntry = []
      }
      continue
    }
    
    // Check if this line starts a new entry (starts with a word followed by parentheses)
    if (line.match(/^[a-z]+\s*\(/i)) {
      // Save previous entry if exists
      if (currentEntry.length > 0) {
        const combined = currentEntry.join(' ')
        const parsed = parseLine(combined)
        if (parsed) {
          vocabEntries.push(parsed)
        }
      }
      currentEntry = [line]
    } else {
      // Continue current entry
      currentEntry.push(line)
    }
  }
  
  // Handle last entry
  if (currentEntry.length > 0) {
    const combined = currentEntry.join(' ')
    const parsed = parseLine(combined)
    if (parsed) {
      vocabEntries.push(parsed)
    }
  }
  
  console.log(`Parsed ${vocabEntries.length} vocabulary entries`)
  
  // Remove duplicates
  const uniqueEntries = new Map<string, VocabEntry>()
  for (const entry of vocabEntries) {
    if (!uniqueEntries.has(entry.word) || !entry.definition.includes('[Definition needed')) {
      uniqueEntries.set(entry.word, entry)
    }
  }
  
  const finalEntries = Array.from(uniqueEntries.values()).sort((a, b) => 
    a.word.localeCompare(b.word)
  )
  
  console.log(`Final count: ${finalEntries.length} unique words`)
  
  // Write to JSON file
  const output = JSON.stringify(finalEntries, null, 2)
  fs.writeFileSync(outputPath, output, 'utf-8')
  
  console.log(`\n✅ Created ${outputPath} with ${finalEntries.length} words`)
  console.log('\nSample entries:')
  finalEntries.slice(0, 3).forEach(entry => {
    console.log(`  - ${entry.word}: ${entry.definition.substring(0, 50)}...`)
  })
}

parseSatWordsWithDefinitions().catch(console.error)


