#!/usr/bin/env python3
"""
Simple, correct parser that extracts complete definitions.
"""

import json
import re
from pathlib import Path

def normalize_pos(pos_str):
    if not pos_str:
        return None
    pos_lower = pos_str.lower().strip()
    if 'adj' in pos_lower:
        return 'adjective'
    elif 'adv' in pos_lower:
        return 'adverb'
    elif pos_lower.startswith('n.') or pos_lower == 'n':
        return 'noun'
    elif pos_lower.startswith('v.') or pos_lower == 'v':
        return 'verb'
    return pos_str.strip()

def parse_entry(text):
    """Parse: word (pos) definition (example)"""
    text = text.strip()
    if not text:
        return None
    
    # Match: word (pos) rest
    match = re.match(r'^([a-z]+)\s*\(([^)]+)\)\s+(.+)$', text, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    
    word = match.group(1).lower().strip()
    pos = normalize_pos(match.group(2))
    rest = match.group(3).strip()
    
    # Check if merged with next entry
    # Look for pattern: space + word + (pos) + space + lowercase (start of next definition)
    # But make sure it's not part of the current definition
    next_entry = re.search(r'\s+([a-z]+)\s*\(([^)]+)\)\s+[a-z]', rest, re.IGNORECASE)
    if next_entry:
        # Make sure this isn't just part of the example sentence
        # Check if there's a capital letter before it (indicating example sentence)
        before_match = rest[:next_entry.start()]
        if not (before_match.rstrip().endswith(')') or 
                any(c.isupper() for c in before_match[-20:] if c.isalpha())):
            # This looks like a real next entry, not part of example
            rest = rest[:next_entry.start()].strip()
    
    # Find example sentence: look for "(" followed by capital letter
    # This is the start of the example
    example_start = -1
    for i in range(len(rest)):
        if rest[i] == '(' and i + 1 < len(rest):
            next_char = rest[i + 1].strip()
            if next_char and next_char[0].isupper():
                # Found example sentence start
                example_start = i
                break
    
    if example_start > 0:
        # Definition is everything before the example
        definition = rest[:example_start].strip()
        # Remove any trailing spaces or the word itself if it appears at the end
        # (sometimes the word appears in the example, don't include it in definition)
        word_at_end = f' {word} '
        if definition.endswith(word_at_end.strip()):
            definition = definition[:-len(word)].strip()
    else:
        # No example found, remove incomplete parentheses
        definition = re.sub(r'\s*\([^)]*$', '', rest).strip()
    
    # Clean up: remove the word if it appears at the very end (it's in the example)
    if definition.endswith(f' {word}'):
        definition = definition[:-len(word) - 1].strip()
    
    # Just clean up whitespace - DON'T remove other words
    definition = definition.strip()
    
    return {
        'word': word,
        'partOfSpeech': pos,
        'definition': definition,
        'exampleSentence': None,
    }

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    input_file = project_root.parent / 'Downloads' / 'sats_words_with_definitions.txt'
    output_file = project_root / 'data' / 'sats_vocab.json'
    
    print(f"Reading from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    entries = []
    current_lines = []
    
    for line in lines:
        line = line.strip()
        is_new = bool(re.match(r'^[a-z]+\s*\(', line, re.IGNORECASE))
        
        if is_new and current_lines:
            combined = ' '.join(current_lines)
            parsed = parse_entry(combined)
            if parsed:
                entries.append(parsed)
            current_lines = [line]
        elif line:
            current_lines.append(line)
        elif current_lines:
            combined = ' '.join(current_lines)
            parsed = parse_entry(combined)
            if parsed:
                entries.append(parsed)
            current_lines = []
    
    if current_lines:
        combined = ' '.join(current_lines)
        parsed = parse_entry(combined)
        if parsed:
            entries.append(parsed)
    
    # Remove duplicates
    seen = set()
    unique = []
    for entry in entries:
        if entry and entry['word'] not in seen:
            seen.add(entry['word'])
            unique.append(entry)
    
    unique.sort(key=lambda x: x['word'])
    
    print(f"✅ Parsed {len(unique)} unique words")
    
    # Verify critical samples
    print("\nVerifying entries:")
    test_words = ['affable', 'gregarious', 'indigenous', 'aesthetic', 'agile']
    for word in test_words:
        entry = next((e for e in unique if e and e['word'] == word), None)
        if entry:
            print(f"  ✅ {word}: {entry['definition']}")
        else:
            print(f"  ❌ {word}: NOT FOUND")
    
    # Save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved {len(unique)} words to {output_file}")

if __name__ == '__main__':
    main()

