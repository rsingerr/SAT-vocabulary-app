'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleImport = async () => {
    setImporting(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (response.ok) {
        setMessage(`Success! Imported ${data.count} words.`)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-content">
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            SAT Vocabulary
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/flashcards" className="nav-link">Flashcards</Link>
            <Link href="/crossword" className="nav-link">Crossword</Link>
            <Link href="/progress" className="nav-link">Progress</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <h1 style={{ fontSize: '36px', marginBottom: '32px' }}>Admin</h1>

        <div className="card" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Import Vocabulary</h2>
          <p style={{ marginBottom: '24px', lineHeight: '1.6', color: '#6b7280' }}>
            Import SAT vocabulary words from <code>data/sats_vocab.json</code> into the database.
            Make sure the file exists and contains the official SAT vocabulary list before importing.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>File Format:</h3>
            <pre
              style={{
                background: '#f3f4f6',
                padding: '16px',
                borderRadius: '6px',
                overflowX: 'auto',
                fontSize: '14px',
              }}
            >
              {JSON.stringify(
                [
                  {
                    word: 'example',
                    partOfSpeech: 'noun',
                    definition: 'a thing characteristic of its kind',
                    synonyms: ['sample', 'instance'],
                    exampleSentence: 'This is an example sentence.',
                  },
                ],
                null,
                2
              )}
            </pre>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Instructions:</h3>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Replace the placeholder data in <code>data/sats_vocab.json</code> with the official SAT vocabulary list</li>
              <li>Ensure each entry has at least <code>word</code> and <code>definition</code> fields</li>
              <li>Click the import button below</li>
              <li>Wait for the import to complete</li>
            </ol>
          </div>

          <button
            onClick={handleImport}
            className="btn"
            disabled={importing}
            style={{ marginBottom: '16px' }}
          >
            {importing ? 'Importing...' : 'Import Vocabulary'}
          </button>

          {message && (
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: message.includes('Error') ? '#fee2e2' : '#d1fae5',
                color: message.includes('Error') ? '#991b1b' : '#065f46',
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div className="card" style={{ maxWidth: '800px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Important Notes</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#6b7280' }}>
            <li>
              The vocabulary file at <code>data/sats_vocab.json</code> must exist before importing
            </li>
            <li>Importing will replace all existing words in the database</li>
            <li>Only words from the official SAT vocabulary list should be used</li>
            <li>The app will not start if the vocabulary file is missing</li>
          </ul>
        </div>
      </div>
    </>
  )
}


