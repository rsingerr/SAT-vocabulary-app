# SAT Vocabulary Study App

A full-stack web application for studying and practicing SAT vocabulary words using flashcards and interactive crossword puzzles.

## Features

- **Flashcards Mode**: Study SAT vocabulary with interactive flashcards
  - Track accuracy and review frequency
  - Adaptive difficulty based on performance
  - Study sets of 10, 20, or 30 words
  - Mastery level tracking (0-5)

- **Crossword Puzzles**: Practice SAT words with interactive crosswords
  - Generate puzzles with 10, 15, or 20 words
  - Three difficulty levels (Easy, Medium, Hard)
  - Interactive grid with keyboard input
  - Check/reveal letters and words
  - Timer and progress tracking

- **Progress Tracking**: View your study statistics
  - Flashcard accuracy and mastery levels
  - Crossword completion times and attempts
  - Word-by-word progress tracking

## Tech Stack

- **Frontend**: React + TypeScript (Next.js 14)
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Styling**: CSS with clean, simple design

## Prerequisites

- Node.js 18+ and npm
- The official SAT vocabulary list

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./prisma/sat_vocab.db"
JWT_SECRET="your-secret-key-change-in-production"
```

### 3. Replace Placeholder Vocabulary

**IMPORTANT**: The app includes placeholder vocabulary data. You must replace it with the official SAT vocabulary list.

1. Open `data/sats_vocab.json`
2. Replace the placeholder entries with the official SAT vocabulary list
3. Each entry should have:
   - `word` (required): The vocabulary word
   - `definition` (required): The definition
   - `partOfSpeech` (optional): e.g., "noun", "verb", "adjective"
   - `synonyms` (optional): Array of synonyms or comma-separated string
   - `exampleSentence` (optional): Example usage sentence

Example format:
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

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Import Vocabulary

```bash
npm run db:import
```

This will import all words from `data/sats_vocab.json` into the database.

### 7. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Important Notes

- **The app will not start if `data/sats_vocab.json` is missing or empty**
- Only words from the official SAT vocabulary list should be used
- Never invent or add non-SAT words to the vocabulary file
- The placeholder data in `data/sats_vocab.json` must be replaced before use

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:import` - Import vocabulary from JSON file
- `npm run lint` - Run ESLint

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── flashcards/        # Flashcards page
│   ├── crossword/         # Crossword page
│   ├── progress/          # Progress page
│   └── admin/             # Admin page
├── data/                  # Data files
│   └── sats_vocab.json    # SAT vocabulary list (REPLACE THIS)
├── lib/                   # Utility libraries
│   ├── prisma.ts          # Prisma client
│   ├── vocab-check.ts     # Vocabulary file validation
│   └── crossword-generator.ts  # Crossword generation logic
├── prisma/                # Prisma schema
│   └── schema.prisma      # Database schema
└── scripts/               # Utility scripts
    ├── import-vocab.ts    # Import vocabulary script
    └── check-startup.ts   # Startup validation
```

## Database Schema

- **Word**: Vocabulary words with definitions, parts of speech, synonyms, etc.
- **FlashcardProgress**: Tracks user progress on flashcards (accuracy, reviews, mastery)
- **Crossword**: Generated crossword puzzles
- **CrosswordWord**: Words used in crosswords
- **CrosswordProgress**: User progress on crossword puzzles
- **User**: Optional user accounts (for future authentication)

## Troubleshooting

### "Vocabulary file not found" error

Make sure `data/sats_vocab.json` exists and contains valid JSON data.

### Import fails

- Check that `data/sats_vocab.json` is valid JSON
- Ensure each entry has at least `word` and `definition` fields
- Check the console for specific error messages

### Database errors

- Run `npm run db:migrate` to ensure migrations are up to date
- Delete `prisma/sat_vocab.db` and run migrations again if needed

## License

This project is for educational purposes.


