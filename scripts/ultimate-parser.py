#!/usr/bin/env python3
"""
Ultimate parser: correctly extract all definitions from source file.
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
    
    # Check if merged with next entry - look for pattern "word (pos)" in the middle
    next_entry = re.search(r'\s+([a-z]+)\s*\(([^)]+)\)\s*[a-z]', rest, re.IGNORECASE)
    if next_entry:
        # Cut off at next entry
        rest = rest[:next_entry.start()].strip()
    
    # Find the example sentence
    # Look for the last opening parenthesis that has a capital letter after it
    # This is usually the example sentence
    last_open = rest.rfind('(')
    
    if last_open > 0:
        # Check what comes after the opening paren
        after_paren = rest[last_open + 1:].strip()
        # If it starts with a capital letter and is reasonably long, it's an example
        if after_paren and after_paren[0].isupper() and len(after_paren) > 10:
            # This is an example - definition is everything before the "("
            definition = rest[:last_open].strip()
        else:
            # Not an example, might be part of definition or incomplete
            # Remove incomplete parentheses
            definition = re.sub(r'\s*\([^)]*$', '', rest).strip()
    else:
        # No parentheses found
        definition = rest.strip()
    
    # Clean up: remove trailing incomplete words (but keep valid definitions)
    # Only remove if it's clearly an incomplete sentence ending
    incomplete_endings = [
        r'\s+(the|a|an|which|that|when|where|who|what|how|are|is|was|were|be|not|to|of|in|on|at|for|with|from|and|or|but|so|if|as|well)$',
    ]
    
    for pattern in incomplete_endings:
        # Only remove if definition is longer than 20 chars (to avoid cutting short valid definitions)
        if len(definition) > 20:
            definition = re.sub(pattern, '', definition, flags=re.IGNORECASE).strip()
    
    # Remove trailing punctuation
    definition = definition.rstrip(',').rstrip('.').strip()
    
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
    
    # Remove duplicates, keep first
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
    test_words = ['affable', 'gregarious', 'indigenous', 'aesthetic', 'agile', 'abate', 'advocate']
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

