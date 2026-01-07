import { checkVocabFile } from '../lib/vocab-check'

const { exists, path: filePath } = checkVocabFile()

if (!exists) {
  console.error('\n❌ ERROR: SAT vocabulary file not found!')
  console.error(`\nExpected location: ${filePath}`)
  console.error('\nPlease create data/sats_vocab.json with the official SAT vocabulary list.')
  console.error('You can use the format from the placeholder file as a template.')
  console.error('\nThe file should contain a JSON array of objects with:')
  console.error('  - word (required)')
  console.error('  - definition (required)')
  console.error('  - partOfSpeech (optional)')
  console.error('  - synonyms (optional, array or string)')
  console.error('  - exampleSentence (optional)')
  console.error('\nOnce you have created the file, run: npm run db:import')
  process.exit(1)
}

console.log('✅ SAT vocabulary file found!')
process.exit(0)


