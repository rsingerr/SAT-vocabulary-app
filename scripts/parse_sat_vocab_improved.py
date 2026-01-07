#!/usr/bin/env python3
"""
Improved parser for SAT vocabulary file with definitions.
"""

import json
import re
import sys
from pathlib import Path

def normalize_pos(pos_str):
    """Convert part of speech abbreviations to full words."""
    if not pos_str:
        return None
    pos_lower = pos_str.lower().strip()
    if 'adj' in pos_lower or pos_lower == 'adj':
        return 'adjective'
    elif 'adv' in pos_lower or pos_lower == 'adv':
        return 'adverb'
    elif pos_lower.startswith('n.') or pos_lower == 'n' or 'noun' in pos_lower:
        return 'noun'
    elif pos_lower.startswith('v.') or pos_lower == 'v' or 'verb' in pos_lower:
        return 'verb'
    elif 'prep' in pos_lower:
        return 'preposition'
    elif 'conj' in pos_lower:
        return 'conjunction'
    return pos_str.strip()

def extract_example(text):
    """Extract example sentence from parentheses at the end."""
    # Look for the last complete parenthetical expression
    paren_count = 0
    start_idx = -1
    for i in range(len(text) - 1, -1, -1):
        if text[i] == ')':
            if start_idx == -1:
                start_idx = i
            paren_count += 1
        elif text[i] == '(':
            paren_count -= 1
            if paren_count == 0:
                example = text[i+1:start_idx].strip()
                # Check if it looks like an example sentence (starts with capital)
                if example and example[0].isupper():
                    return example, text[:i].strip()
                break
    return None, text

def parse_entry(text):
    """Parse a vocabulary entry from text."""
    text = text.strip()
    if not text:
        return None
    
    # Pattern: word (pos) definition (example)
    # Or: word 1. (pos) definition (example) 2. (pos) definition
    
    # Match word at the start - must be followed by parentheses or space and number
    word_match = re.match(r'^([a-z]+)', text, re.IGNORECASE)
    if not word_match:
        return None
    
    word = word_match.group(1).lower().strip()
    rest = text[len(word_match.group(0)):].strip()
    
    # Skip continuation lines (lines that don't start with a word pattern)
    if not rest or not (rest.startswith('(') or rest.startswith('1.')):
        return None
    
    # Handle numbered definitions (1. (v.) ... 2. (v.) ...)
    if rest.startswith('1.'):
        # Extract first definition
        match = re.match(r'1\.\s*\(([^)]+)\)\s+(.+?)(?:\s+2\.|$)', rest, re.DOTALL)
        if match:
            pos = normalize_pos(match.group(1))
            definition = match.group(2).strip()
            example, definition = extract_example(definition)
            return {
                'word': word,
                'partOfSpeech': pos,
                'definition': definition,
                'exampleSentence': example,
            }
    
    # Standard pattern: (pos) definition (example)
    match = re.match(r'\(([^)]+)\)\s+(.+)$', rest, re.DOTALL)
    if match:
        pos = normalize_pos(match.group(1))
        definition = match.group(2).strip()
        
        # Extract example sentence
        example, definition = extract_example(definition)
        
        # Clean up definition
        definition = definition.strip()
        
        return {
            'word': word,
            'partOfSpeech': pos,
            'definition': definition,
            'exampleSentence': example if example else None,
        }
    
    return None

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
        lines = f.readlines()
    
    print(f"Found {len(lines)} lines")
    
    entries = []
    current_entry_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Check if this line starts a new entry
        # A new entry starts with a word followed by (pos) or 1. (pos)
        is_new_entry = bool(re.match(r'^[a-z]+\s*(?:\(|1\.)', line, re.IGNORECASE))
        
        if is_new_entry and current_entry_lines:
            # Parse previous entry
            combined = ' '.join(current_entry_lines)
            parsed = parse_entry(combined)
            if parsed:
                entries.append(parsed)
            current_entry_lines = [line]
        elif line or current_entry_lines:
            # Continue current entry or start new one
            if line:
                current_entry_lines.append(line)
            elif current_entry_lines:
                # Empty line - finish current entry
                combined = ' '.join(current_entry_lines)
                parsed = parse_entry(combined)
                if parsed:
                    entries.append(parsed)
                current_entry_lines = []
    
    # Handle last entry
    if current_entry_lines:
        combined = ' '.join(current_entry_lines)
        parsed = parse_entry(combined)
        if parsed:
            entries.append(parsed)
    
    # Remove duplicates, keeping first occurrence
    seen = set()
    unique_entries = []
    for entry in entries:
        word = entry['word']
        if word not in seen:
            seen.add(word)
            unique_entries.append(entry)
        else:
            # If duplicate, keep the one with more complete definition
            existing = next(e for e in unique_entries if e['word'] == word)
            if len(entry.get('definition', '')) > len(existing.get('definition', '')):
                unique_entries.remove(existing)
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
        defn = entry['definition'][:70] + '...' if len(entry['definition']) > 70 else entry['definition']
        print(f"  - {entry['word']} ({entry['partOfSpeech']}): {defn}")

if __name__ == '__main__':
    main()


