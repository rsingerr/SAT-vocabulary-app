#!/usr/bin/env python3
"""
Properly re-parse SAT vocabulary with complete definitions.
"""

import json
import re
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

def extract_definition_and_example(text):
    """Extract definition and example sentence from text."""
    # Pattern: definition (example sentence)
    # We need to find the last complete parenthetical expression
    
    # Find all parenthetical expressions
    paren_pairs = []
    depth = 0
    start = -1
    
    for i, char in enumerate(text):
        if char == '(':
            if depth == 0:
                start = i
            depth += 1
        elif char == ')':
            depth -= 1
            if depth == 0 and start != -1:
                paren_pairs.append((start, i))
                start = -1
    
    # The last complete parentheses is likely the example
    if paren_pairs:
        last_start, last_end = paren_pairs[-1]
        example = text[last_start + 1:last_end].strip()
        definition = text[:last_start].strip()
        
        # Check if example looks like a sentence (starts with capital)
        if example and example[0].isupper():
            return definition, example
    
    # No example found, return whole text as definition
    return text.strip(), None

def parse_entry(text):
    """Parse a vocabulary entry from text."""
    text = text.strip()
    if not text:
        return None
    
    # Match word at the start
    word_match = re.match(r'^([a-z]+)', text, re.IGNORECASE)
    if not word_match:
        return None
    
    word = word_match.group(1).lower().strip()
    rest = text[len(word_match.group(0)):].strip()
    
    # Skip if doesn't look like a word entry
    if not rest or not (rest.startswith('(') or rest.startswith('1.')):
        return None
    
    # Handle numbered definitions (1. (v.) ... 2. (v.) ...)
    if rest.startswith('1.'):
        match = re.match(r'1\.\s*\(([^)]+)\)\s+(.+?)(?:\s+2\.|$)', rest, re.DOTALL)
        if match:
            pos = normalize_pos(match.group(1))
            content = match.group(2).strip()
            definition, example = extract_definition_and_example(content)
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
        content = match.group(2).strip()
        definition, example = extract_definition_and_example(content)
        
        return {
            'word': word,
            'partOfSpeech': pos,
            'definition': definition,
            'exampleSentence': example,
        }
    
    return None

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    input_file = project_root.parent / 'Downloads' / 'sats_words_with_definitions.txt'
    output_file = project_root / 'data' / 'sats_vocab.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}")
        return
    
    print(f"Reading from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Found {len(lines)} lines")
    
    entries = []
    current_entry_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Check if this line starts a new entry
        is_new_entry = bool(re.match(r'^[a-z]+\s*(?:\(|1\.)', line, re.IGNORECASE))
        
        if is_new_entry and current_entry_lines:
            # Parse previous entry
            combined = ' '.join(current_entry_lines)
            parsed = parse_entry(combined)
            if parsed:
                entries.append(parsed)
            current_entry_lines = [line]
        elif line or current_entry_lines:
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
    
    # Sort by word
    unique_entries.sort(key=lambda x: x['word'])
    
    print(f"\nParsed {len(unique_entries)} unique vocabulary entries")
    
    # Verify a few entries
    print("\nSample entries:")
    for entry in unique_entries[:5]:
        defn = entry['definition'][:70] + '...' if len(entry['definition']) > 70 else entry['definition']
        print(f"  {entry['word']} ({entry['partOfSpeech']}): {defn}")
    
    # Check gregarious specifically
    greg = next((e for e in unique_entries if e['word'] == 'gregarious'), None)
    if greg:
        print(f"\n✅ gregarious: {greg['definition']}")
    
    # Save
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_entries, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved {len(unique_entries)} words to {output_file}")

if __name__ == '__main__':
    main()

