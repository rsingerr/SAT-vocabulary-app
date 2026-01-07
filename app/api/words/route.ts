import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const difficulty = searchParams.get('difficulty')
    const limit = searchParams.get('limit')
    const random = searchParams.get('random') === 'true'
    
    const where: any = {}
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      where.difficulty = difficulty
    }
    
    const take = limit ? parseInt(limit) : undefined
    
    let words
    if (random) {
      const count = await prisma.word.count({ where })
      const skip = Math.floor(Math.random() * Math.max(0, count - (take || count)))
      words = await prisma.word.findMany({
        where,
        take,
        skip,
      })
      // Shuffle the results
      words = words.sort(() => Math.random() - 0.5)
    } else {
      words = await prisma.word.findMany({
        where,
        take,
        orderBy: { word: 'asc' },
      })
    }
    
    return NextResponse.json(words)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


