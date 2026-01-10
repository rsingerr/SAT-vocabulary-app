-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "definition" TEXT NOT NULL,
    "synonyms" TEXT,
    "exampleSentence" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "wordId" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crossword" (
    "id" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "grid" TEXT NOT NULL,
    "clues" TEXT NOT NULL,
    "words" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crossword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrosswordWord" (
    "id" TEXT NOT NULL,
    "crosswordId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrosswordWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrosswordProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "crosswordId" TEXT NOT NULL,
    "timeElapsed" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestTime" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrosswordProgress_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "FlashcardProgress" ADD CONSTRAINT "FlashcardProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardProgress" ADD CONSTRAINT "FlashcardProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrosswordWord" ADD CONSTRAINT "CrosswordWord_crosswordId_fkey" FOREIGN KEY ("crosswordId") REFERENCES "Crossword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrosswordWord" ADD CONSTRAINT "CrosswordWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrosswordProgress" ADD CONSTRAINT "CrosswordProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrosswordProgress" ADD CONSTRAINT "CrosswordProgress_crosswordId_fkey" FOREIGN KEY ("crosswordId") REFERENCES "Crossword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
