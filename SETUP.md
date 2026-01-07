# Quick Start Guide

## How to Access the SAT Vocabulary App

Follow these steps to get the app running:

### Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
cd "/Users/rebeccasinger/SAT vocabulary"
npm install
```

This will install all required packages (Next.js, React, Prisma, etc.).

### Step 2: Set Up the Database

Generate the Prisma client and create the database:

```bash
npm run db:generate
npm run db:migrate
```

### Step 3: Import the Vocabulary

Import the 892 SAT vocabulary words into the database:

```bash
npm run db:import
```

You should see output like:
```
Loading SAT vocabulary file...
Found 892 words. Starting import...
Imported: 892
```

### Step 4: Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

### Step 5: Open in Your Browser

Open your web browser and go to:

**http://localhost:3000**

## What You'll See

- **Home Page**: Overview with links to Flashcards and Crossword
- **Flashcards**: Study SAT words with interactive flashcards
- **Crossword**: Generate and solve crossword puzzles using SAT words
- **Progress**: View your study statistics and mastery levels

## Troubleshooting

### If you get "Vocabulary file not found":
- Make sure `data/sats_vocab.json` exists (it should - we just created it!)
- Run `npm run db:import` again

### If you get database errors:
- Make sure you ran `npm run db:migrate` first
- Try deleting `prisma/sat_vocab.db` and running migrations again

### If port 3000 is already in use:
- The app will automatically try the next available port (3001, 3002, etc.)
- Check the terminal output for the actual URL

## Stopping the App

Press `Ctrl+C` in the terminal to stop the development server.


