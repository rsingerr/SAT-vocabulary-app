-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "definition" TEXT NOT NULL,
    "synonyms" TEXT,
    "exampleSentence" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FlashcardProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "wordId" TEXT NOT NULL,
    "accuracy" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FlashcardProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FlashcardProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Crossword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seed" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "grid" TEXT NOT NULL,
    "clues" TEXT NOT NULL,
    "words" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CrosswordWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crosswordId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrosswordWord_crosswordId_fkey" FOREIGN KEY ("crosswordId") REFERENCES "Crossword" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CrosswordWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrosswordProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "crosswordId" TEXT NOT NULL,
    "timeElapsed" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" REAL NOT NULL DEFAULT 0,
    "bestTime" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrosswordProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CrosswordProgress_crosswordId_fkey" FOREIGN KEY ("crosswordId") REFERENCES "Crossword" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_key" ON "Word"("word");

-- CreateIndex
CREATE INDEX "FlashcardProgress_userId_wordId_idx" ON "FlashcardProgress"("userId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "Crossword_seed_key" ON "Crossword"("seed");

-- CreateIndex
CREATE INDEX "CrosswordWord_crosswordId_wordId_idx" ON "CrosswordWord"("crosswordId", "wordId");

-- CreateIndex
CREATE INDEX "CrosswordProgress_userId_crosswordId_idx" ON "CrosswordProgress"("userId", "crosswordId");
