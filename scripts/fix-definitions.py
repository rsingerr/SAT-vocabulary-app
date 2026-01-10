#!/usr/bin/env python3
"""
Clean up vocabulary definitions by removing incomplete example sentences.
"""

import json
import re
from pathlib import Path

def clean_definition(definition):
    """Remove incomplete example sentences from definitions."""
    if not definition:
        return definition
    
    # Remove incomplete parentheses at the end (cut-off example sentences)
    # Pattern: text (incomplete sentence that doesn't close
    cleaned = re.sub(r'\s*\([^)]*$', '', definition).strip()
    
    # Remove any trailing incomplete sentences that start with lowercase
    # These are usually continuation of examples from previous entries
    cleaned = re.sub(r'\s+[a-z][^.]*$', '', cleaned).strip()
    
    # Remove any word entries that got merged (like "word (n.) definition")
    # Keep only the first complete definition
    if re.search(r'\s[a-z]+\s*\([^)]+\)', cleaned):
        # Split by pattern of "word (pos)" which indicates merged entries
        parts = re.split(r'\s+[a-z]+\s*\([^)]+\)', cleaned)
        cleaned = parts[0].strip() if parts else cleaned
    
    # Remove trailing incomplete phrases
    # If definition ends with incomplete sentence markers
    if cleaned.endswith('(') or cleaned.endswith(',') or cleaned.endswith('the'):
        # Try to find the last complete sentence
        sentences = re.split(r'[.!?]\s+', cleaned)
        if len(sentences) > 1:
            cleaned = '. '.join(sentences[:-1]) + '.'
        else:
            # If no complete sentence, remove trailing incomplete parts
            cleaned = re.sub(r'\s*\(.*$', '', cleaned)
            cleaned = re.sub(r'\s+[a-z][^.]*$', '', cleaned).strip()
    
    return cleaned.strip()

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    vocab_file = project_root / 'data' / 'sats_vocab.json'
    
    print(f"Reading {vocab_file}...")
    with open(vocab_file, 'r', encoding='utf-8') as f:
        vocab = json.load(f)
    
    print(f"Cleaning {len(vocab)} entries...")
    cleaned_count = 0
    
    for entry in vocab:
        original = entry.get('definition', '')
        cleaned = clean_definition(original)
        if cleaned != original:
            entry['definition'] = cleaned
            cleaned_count += 1
    
    # Save cleaned data
    with open(vocab_file, 'w', encoding='utf-8') as f:
        json.dump(vocab, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Cleaned {cleaned_count} definitions")
    print(f"✅ Saved to {vocab_file}")
    
    # Show a sample
    print("\nSample cleaned entries:")
    for entry in vocab[:5]:
        print(f"  {entry['word']}: {entry['definition'][:60]}...")

if __name__ == '__main__':
    main()



