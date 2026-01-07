#!/usr/bin/env python3
"""
Parse SAT vocabulary file with definitions and create JSON output.
"""

import json
import re
import sys
from pathlib import Path

def normalize_pos(pos_str):
    """Convert part of speech abbreviations to full words."""
    pos_lower = pos_str.lower()
    if 'adj' in pos_lower:
        return 'adjective'
    elif 'adv' in pos_lower:
        return 'adverb'
    elif pos_lower.startswith('n.') or 'noun' in pos_lower:
        return 'noun'
    elif pos_lower.startswith('v.') or 'verb' in pos_lower:
        return 'verb'
    elif 'prep' in pos_lower:
        return 'preposition'
    elif 'conj' in pos_lower:
        return 'conjunction'
    return pos_str.strip()

def parse_entry(text):
    """Parse a vocabulary entry from text."""
    text = text.strip()
    if not text:
        return None
    
    # Pattern: word (pos) definition (example)
    # Or: word 1. (pos) definition (example) 2. (pos) definition (example)
    
    # Try to match word at start
    word_match = re.match(r'^([a-z]+(?:\s+[a-z]+)?)', text, re.IGNORECASE)
    if not word_match:
        return None
    
    word = word_match.group(1).lower().strip()
    
    # Skip if it looks like a continuation line
    if not re.search(r'\([^)]+\)', text):
        return None
    
    # Extract part of speech and definition
    # Pattern: (pos) definition
    pos_def_match = re.search(r'\(([^)]+)\)\s+(.+?)(?:\s*\(([^)]+)\))?$', text, re.DOTALL)
    if not pos_def_match:
        # Try without parentheses for pos
        pos_def_match = re.search(r'([a-z.]+)\s+(.+?)(?:\s*\(([^)]+)\))?$', text, re.IGNORECASE | re.DOTALL)
        if pos_def_match:
            pos = normalize_pos(pos_def_match.group(1))
            definition = pos_def_match.group(2).strip()
            example = pos_def_match.group(3).strip() if pos_def_match.group(3) else None
        else:
            return None
    else:
        pos = normalize_pos(pos_def_match.group(1))
        definition = pos_def_match.group(2).strip()
        example = pos_def_match.group(3).strip() if pos_def_match.group(3) else None
    
    # Clean up definition - remove trailing incomplete sentences
    definition = re.sub(r'\s*\([^)]*$', '', definition).strip()
    
    # Handle multiple definitions (1. ... 2. ...)
    if re.match(r'^\d+\.', definition):
        # Take first definition
        definition = re.sub(r'^\d+\.\s*', '', definition)
    
    return {
        'word': word,
        'partOfSpeech': pos if pos else None,
        'definition': definition,
        'exampleSentence': example,
    }

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    input_file = project_root.parent / 'Downloads' / 'sats_words_with_definitions.txt'
    output_file = project_root / 'data' / 'sats_vocab.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        sys.exit(1)
    
    print(f"Reading from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    print(f"Found {len(lines)} lines")
    
    entries = []
    current_entry = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        if not line:
            if current_entry:
                combined = ' '.join(current_entry)
                parsed = parse_entry(combined)
                if parsed:
                    entries.append(parsed)
                current_entry = []
            continue
        
        # Check if this line starts a new entry (word followed by parentheses)
        if re.match(r'^[a-z]+\s*\(', line, re.IGNORECASE):
            if current_entry:
                combined = ' '.join(current_entry)
                parsed = parse_entry(combined)
                if parsed:
                    entries.append(parsed)
            current_entry = [line]
        else:
            current_entry.append(line)
    
    # Handle last entry
    if current_entry:
        combined = ' '.join(current_entry)
        parsed = parse_entry(combined)
        if parsed:
            entries.append(parsed)
    
    # Remove duplicates, keeping first occurrence
    seen = set()
    unique_entries = []
    for entry in entries:
        if entry['word'] not in seen:
            seen.add(entry['word'])
            unique_entries.append(entry)
    
    # Sort by word
    unique_entries.sort(key=lambda x: x['word'])
    
    print(f"\nParsed {len(unique_entries)} unique vocabulary entries")
    
    # Ensure output directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Write JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_entries, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Created {output_file} with {len(unique_entries)} words")
    print("\nSample entries:")
    for entry in unique_entries[:5]:
        print(f"  - {entry['word']}: {entry['definition'][:60]}...")

if __name__ == '__main__':
    main()


