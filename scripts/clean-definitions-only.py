#!/usr/bin/env python3
"""
Clean definitions by removing incomplete example sentences, keeping only complete definitions.
"""

import json
import re
from pathlib import Path

def clean_definition(definition):
    """Remove incomplete example sentences, keep only the core definition."""
    if not definition:
        return definition
    
    # Remove incomplete parenthetical examples at the end
    # Pattern: text (incomplete sentence that doesn't close properly
    cleaned = definition
    
    # Find the last complete parenthetical expression
    # If there's an incomplete one at the end, remove it
    last_open = cleaned.rfind('(')
    last_close = cleaned.rfind(')')
    
    # If there's an open paren without a matching close, it's incomplete
    if last_open > last_close:
        # Remove everything from the last open paren
        cleaned = cleaned[:last_open].strip()
    
    # Remove trailing incomplete phrases that are clearly example sentence starts
    # These usually start with capital letters and are incomplete
    cleaned = re.sub(r'\s*\([A-Z][^)]*$', '', cleaned).strip()
    
    # Remove any trailing incomplete sentences
    # If it ends with incomplete words like "the", "a", "an", "which", etc.
    incomplete_endings = [
        r'\s+the$', r'\s+a$', r'\s+an$', r'\s+which$', r'\s+that$',
        r'\s+when$', r'\s+where$', r'\s+who$', r'\s+what$', r'\s+how$',
        r'\s+are$', r'\s+is$', r'\s+was$', r'\s+were$', r'\s+be$',
        r'\s+not$', r'\s+to$', r'\s+of$', r'\s+in$', r'\s+on$',
        r'\s+at$', r'\s+for$', r'\s+with$', r'\s+from$'
    ]
    
    for pattern in incomplete_endings:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()
    
    # If definition is too short (less than 10 chars), it's probably incomplete
    # But keep it if it's a valid short definition
    # (keeping all definitions for now)
    
    # Remove any trailing commas or periods that don't make sense
    cleaned = re.sub(r'[.,]\s*$', '', cleaned).strip()
    
    return cleaned

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    vocab_file = project_root / 'data' / 'sats_vocab.json'
    
    print(f"Reading {vocab_file}...")
    with open(vocab_file, 'r', encoding='utf-8') as f:
        vocab = json.load(f)
    
    print(f"Cleaning {len(vocab)} definitions...")
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
    
    # Show samples
    print("\nSample cleaned entries:")
    samples = ['gregarious', 'indigenous', 'aesthetic', 'affable', 'agile']
    for word in samples:
        entry = next((e for e in vocab if e['word'] == word), None)
        if entry:
            print(f"  {word}: {entry['definition']}")

if __name__ == '__main__':
    main()

