import fs from 'fs'
import path from 'path'

const VOCAB_FILE_PATH = path.join(process.cwd(), 'data', 'sats_vocab.json')

export function checkVocabFile(): { exists: boolean; path: string } {
  const exists = fs.existsSync(VOCAB_FILE_PATH)
  return { exists, path: VOCAB_FILE_PATH }
}

export function loadVocabFile(): any[] {
  const { exists, path: filePath } = checkVocabFile()
  if (!exists) {
    throw new Error(
      `SAT vocabulary file not found at ${filePath}. Please create data/sats_vocab.json with the official SAT vocabulary list.`
    )
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const vocab = JSON.parse(fileContent)
  
  if (!Array.isArray(vocab) || vocab.length === 0) {
    throw new Error('SAT vocabulary file must contain a non-empty array of words.')
  }
  
  return vocab
}


