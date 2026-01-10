#!/usr/bin/env python3
"""
Perfect parser: extract complete definitions correctly.
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
    """Parse entry: word (pos) definition (example)"""
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
    
    # Check if merged with next entry (contains "word (pos)" pattern)
    next_entry_match = re.search(r'\s+([a-z]+)\s*\(([^)]+)\)\s*[a-z]', rest, re.IGNORECASE)
    if next_entry_match:
        # Cut off at the next entry
        rest = rest[:next_entry_match.start()].strip()
    
    # Find the example sentence (last complete parentheses that starts with capital)
    # Look for pattern: definition (Example sentence starts here...
    paren_pairs = []
    depth = 0
    start_idx = -1
    
    for i, char in enumerate(rest):
        if char == '(':
            if depth == 0:
                start_idx = i
            depth += 1
        elif char == ')':
            depth -= 1
            if depth == 0 and start_idx != -1:
                paren_pairs.append((start_idx, i))
                start_idx = -1
    
    # Find the last complete parentheses that looks like an example
    example_start = -1
    example_end = -1
    
    for start, end in reversed(paren_pairs):
        content = rest[start + 1:end].strip()
        # Check if it looks like an example sentence (starts with capital, has reasonable length)
        if content and content[0].isupper() and len(content) > 10:
            example_start = start
            example_end = end
            break
    
    if example_start > 0:
        # Extract definition (everything before the example)
        definition = rest[:example_start].strip()
        # Remove trailing "(" if present
        definition = definition.rstrip('(').strip()
    else:
        # No complete example found, remove incomplete parentheses
        definition = re.sub(r'\s*\([^)]*$', '', rest).strip()
    
    # Clean up definition: remove trailing incomplete words
    # But be careful not to remove valid words
    definition = re.sub(r'\s+(the|a|an|which|that|when|where|who|what|how|are|is|was|were|be|not|to|of|in|on|at|for|with|from|and|or|but|so|if|as|well|people|he|she|they|it|we|you|i)$', '', definition, flags=re.IGNORECASE).strip()
    
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
    print("\nVerifying key entries:")
    test_words = ['affable', 'gregarious', 'indigenous', 'aesthetic', 'agile', 'aggregate', 'abate']
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

