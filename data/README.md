# SAT Vocabulary Data

## ⚠️ IMPORTANT: Replace Placeholder Data

The file `sats_vocab.json` in this directory contains **placeholder data only**.

**You must replace it with the official SAT vocabulary list** before using the app.

## Source

Official SAT vocabulary list: https://img.sparknotes.com/content/testprep/pdf/sat.vocab.pdf

## Format

Each entry in the JSON array should have:

- `word` (required): The vocabulary word
- `definition` (required): The definition of the word
- `partOfSpeech` (optional): e.g., "noun", "verb", "adjective"
- `synonyms` (optional): Array of synonyms or comma-separated string
- `exampleSentence` (optional): Example sentence using the word

## Example

```json
[
  {
    "word": "abate",
    "partOfSpeech": "verb",
    "definition": "to reduce in amount, degree, or intensity",
    "synonyms": ["diminish", "lessen", "subside"],
    "exampleSentence": "The storm began to abate as we reached the harbor."
  }
]
```

## Import Instructions

After replacing the placeholder data:

1. Run `npm run db:import` to import words into the database
2. The app will automatically use the imported words


