import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wordId, userId, correct } = body
    
    if (!wordId) {
      return NextResponse.json(
        { error: 'wordId is required' },
        { status: 400 }
      )
    }
    
    // Find or create progress record
    const existing = await prisma.flashcardProgress.findFirst({
      where: {
        wordId,
        userId: userId || null,
      },
    })
    
    const reviewCount = (existing?.reviewCount || 0) + 1
    const previousAccuracy = existing?.accuracy || 0
    const newAccuracy = correct
      ? (previousAccuracy * (reviewCount - 1) + 1) / reviewCount
      : (previousAccuracy * (reviewCount - 1)) / reviewCount
    
    const masteryLevel = Math.min(5, Math.floor(newAccuracy * 5))
    
    const progress = existing
      ? await prisma.flashcardProgress.update({
          where: { id: existing.id },
          data: {
            accuracy: newAccuracy,
            reviewCount,
            masteryLevel,
            lastReviewed: new Date(),
          },
        })
      : await prisma.flashcardProgress.create({
          data: {
            wordId,
            userId: userId || null,
            accuracy: newAccuracy,
            reviewCount: 1,
            masteryLevel: correct ? 1 : 0,
            lastReviewed: new Date(),
          },
        })
    
    return NextResponse.json(progress)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    const progress = await prisma.flashcardProgress.findMany({
      where: userId ? { userId } : { userId: null },
      include: {
        word: true,
      },
      orderBy: { lastReviewed: 'desc' },
    })
    
    return NextResponse.json(progress)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


