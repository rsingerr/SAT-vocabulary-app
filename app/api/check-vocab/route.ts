import { NextResponse } from 'next/server'
import { checkVocabFile } from '@/lib/vocab-check'

export async function GET() {
  const { exists } = checkVocabFile()
  return NextResponse.json({ exists })
}


