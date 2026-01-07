import fs from 'fs'
import path from 'path'

// Common words to filter out
const commonWords = new Set([
  'to', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'could', 'may', 'might', 'can', 'must', 'shall',
  'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them', 'we', 'us', 'you', 'your',
  'who', 'what', 'when', 'where', 'why', 'how', 'which', 'whose',
  'leader', 'happy', 'something', 'inside', 'when', 'throughout', 'breaking', 'policies', 'denial', 'cold',
  'shortened', 'government', 'night', 'freedom', 'gave', 'put', 'hard', 'instead', 'their', 'happiest',
  'great', 'high', 'enough', 'waiter', 'slow', 'minerals', 'cruelly', 'between', 'friendship', 'keen', 'out',
  'having', 'figured', 'extremely', 'his', 'attracting', 'extreme', 'it', 'none', 'hikers', 'stop', 'interior',
  'incredible', 'famous', 'mass', 'hunting', 'walked', 'whenever', 'committed', 'improving', 'care', 'candidate',
  'because', 'solution', 'drive', 'her', 'poor', 'wanted', 'learned', 'becomes', 'likes', 'time', 'its', 'president',
  'liar', 'for', 'power', 'helped', 'highest', 'about', 'obvious', 'math', 'without', 'which', 'will', 'college',
  'of', 'believe', 'impassioned', 'executions', 'day', 'some', 'priest', 'dynamite', 'skyscraper', 'ability', 'as',
  'insane', 'by', 'soon', 'personal', 'strive', 'him', 'accepting', 'many', 'upon', 'several', 'disgusted', 'located',
  'around', 'setting', 'orchestra', 'emphasize', 'was', 'make', 'leads', 'much', 'rather', 'neighborhood', 'difficult',
  'had', 'voice', 'calculating', 'received', 'resuscitated', 'ironworkers', 'hour', 'while', 'they', 'plunged', 'red',
  'growth', 'outlying', 'only', 'promptly', 'long', 'entire', 'rectory', 'found', 'into', 'replace', 'signing',
  'response', 'strong', 'combination', 'curiosity', 'walled', 'rushed', 'ingredients', 'way', 'instructions', 'carried',
  'through', 'delicious', 'chief', 'perfect', 'after', 'mother', 'revenge', 'signal', 'intercourse', 'permitted', 'feature',
  'that', 'personality', 'against', 'impossible', 'follow', 'attractive', 'got', 'stormed', 'instruments', 'good', 'perform',
  'spy', 'surprise', 'mine', 'books', 'turned', 'himself', 'behavior', 'customers', 'shaving', 'spreading', 'toward',
  'playing', 'finding', 'marathon', 'canceling', 'strengthened', 'different', 'secretary', 'advertisements', 'working', 'enter',
  'contribution', 'enjoyed', 'construction', 'old', 'contrast', 'one', 'sentence', 'girl', 'inhabitants', 'employees',
  'understand', 'youth', 'making', 'check', 'casket', 'language', 'would', 'misery', 'sound', 'receipt', 'wanting', 'be',
  'grounded', 'losing', 'products', 'widely', 'fetch', 'baseball', 'before', 'often', 'chocolate', 'rage', 'normally',
  'acceptance', 'down', 'leaving', 'my', 'develops', 'writer', 'moving', 'lace', 'scholar', 'conspicuous', 'audience',
  'data', 'getting', 'performance', 'so', 'not', 'other', 'always', 'word', 'given', 'how', 'nervous', 'excavated', 'editors',
  'father', 'loving', 'dancing', 'excuse', 'insincere', 'nothing', 'assumption', 'imperfect', 'writes', 'were', 'afternoon',
  'building', 'your', 'angry', 'am', 'become', 'calming', 'plenty', 'decided', 'started', 'direction', 'exclusively', 'guests',
  'more', 'gives', 'able', 'disturbed', 'on', 'gum', 'harangued', 'expected', 'but', 'dismissal', 'backfire', 'threatened',
  'two', 'professional', 'passing', 'celebrated', 'progressive', 'trouble', 'going', 'fawning', 'bratty', 'organized', 'me',
  'wish', 'thoughtless', 'you', 'institute', 'implemented', 'present', 'battering', 'resisted', 'characters', 'spoke', 'no',
  'us', 'is', 'she', 'fifth', 'all', 'sorority', 'up', 'nature', 'lunch', 'decades', 'substance', 'created', 'called', 'speeches',
  'certainly', 'toilet', 'mushrooms', 'new', 'order', 'instructed', 'real', 'superior', 'them', 'sensitive', 'generally',
  'classroom', 'occasionally', 'officials', 'away', 'conflict', 'head', 'are', 'years', 'dress', 'scratching', 'part', 'opera',
  'followers', 'makes', 'where', 'giving', 'performers', 'customs', 'allowed', 'boss', 'disadvantage', 'owners', 'concentration',
  'overthrew', 'fascinated', 'readers', 'body', 'torturing', 'explorers', 'opinions', 'fact', 'usually', 'century', 'etiquette',
  'satisfy', 'astonishing', 'magazines', 'live', 'medal', 'every', 'athletic', 'gown', 'warm', 'wrote', 'over', 'talk', 'else',
  'look', 'refused', 'burning', 'features', 'obeying', 'store', 'improve', 'flashed', 'beautiful', 'furnishings', 'domestic',
  'model', 'profits', 'station', 'reason', 'discovered', 'remain', 'exotic', 'due', 'bomb', 'made', 'returned', 'resulted',
  'precise', 'literature', 'monotonous', 'secrets', 'announced', 'acknowledge', 'door', 'concluded', 'tomatoes', 'piled',
  'break', 'launched', 'economic', 'supply', 'main', 'might', 'ensure', 'hung', 'anyone', 'naval', 'terms', 'like', 'activities',
  'believed', 'alcohol', 'talents', 'result', 'characterized', 'saw', 'should', 'deftly', 'love', 'than', 'large', 'simply',
  'with', 'authority', 'commanded', 'gesticulated', 'throw', 'relegated', 'drink', 'security', 'looked', 'confused', 'fancy',
  'slaves', 'mud', 'retracted', 'involving', 'spelling', 'differences', 'smile', 'retort', 'blinded', 'white', 'cat', 'little',
  'quaking', 'mimicked', 'completely', 'required', 'fit', 'tacos', 'teacher', 'what', 'became', 'tried', 'backed', 'hold',
  'just', 'during', 'surprisingly', 'opposed', 'flaws', 'explain', 'tortilla', 'hours', 'social', 'written', 'insult', 'most',
  'reached', 'room'
])

function isSatWord(word: string): boolean {
  // Filter out common words
  if (commonWords.has(word.toLowerCase())) {
    return false
  }
  
  // Filter out very short words (unless they're known SAT words)
  if (word.length < 4 && !['bane', 'bard', 'bard', 'balk'].includes(word.toLowerCase())) {
    return false
  }
  
  // Filter out words that look like common English words
  const commonPatterns = /^(the|and|for|are|but|not|you|all|can|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)$/i
  if (commonPatterns.test(word)) {
    return false
  }
  
  return true
}

async function parseSatWords() {
  const inputPath = path.join(process.cwd(), '..', 'Downloads', 'sats_words.txt')
  const outputPath = path.join(process.cwd(), 'data', 'sats_vocab.json')
  
  console.log('Reading SAT words file...')
  const content = fs.readFileSync(inputPath, 'utf-8')
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  console.log(`Found ${lines.length} lines`)
  
  const satWords = new Set<string>()
  
  for (const line of lines) {
    const word = line.trim().toLowerCase()
    if (word && isSatWord(word)) {
      satWords.add(word)
    }
  }
  
  const sortedWords = Array.from(satWords).sort()
  console.log(`Extracted ${sortedWords.length} SAT vocabulary words`)
  
  // Create JSON structure
  const vocabEntries = sortedWords.map(word => ({
    word: word,
    definition: `[Definition needed for ${word}]`,
    partOfSpeech: null,
    synonyms: null,
    exampleSentence: null,
  }))
  
  const output = JSON.stringify(vocabEntries, null, 2)
  fs.writeFileSync(outputPath, output, 'utf-8')
  
  console.log(`\n✅ Created ${outputPath} with ${vocabEntries.length} words`)
  console.log('\n⚠️  NOTE: Definitions are placeholders. Please add definitions for each word.')
  console.log('You can use a dictionary API or manually add definitions.')
}

parseSatWords().catch(console.error)


