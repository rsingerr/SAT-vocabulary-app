import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { crosswordId, userId, timeElapsed, completed, accuracy } = body
    
    if (!crosswordId) {
      return NextResponse.json(
        { error: 'crosswordId is required' },
        { status: 400 }
      )
    }
    
    // Find existing progress
    const existing = await prisma.crosswordProgress.findFirst({
      where: {
        crosswordId,
        userId: userId || null,
      },
    })
    
    const attempts = (existing?.attempts || 0) + 1
    const bestTime = existing?.bestTime
      ? Math.min(existing.bestTime, timeElapsed)
      : timeElapsed
    
    const progress = existing
      ? await prisma.crosswordProgress.update({
          where: { id: existing.id },
          data: {
            timeElapsed,
            completed: completed || existing.completed,
            accuracy: accuracy ?? existing.accuracy,
            bestTime,
            attempts,
            updatedAt: new Date(),
          },
        })
      : await prisma.crosswordProgress.create({
          data: {
            crosswordId,
            userId: userId || null,
            timeElapsed,
            completed: completed || false,
            accuracy: accuracy || 0,
            bestTime: timeElapsed,
            attempts: 1,
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
    
    const progress = await prisma.crosswordProgress.findMany({
      where: userId ? { userId } : { userId: null },
      include: {
        crossword: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
    
    return NextResponse.json(progress)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


