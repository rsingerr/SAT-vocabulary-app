#!/usr/bin/env python3
"""
Correctly parse SAT vocabulary, handling merged entries properly.
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

def split_merged_entries(text):
    """Split text that contains multiple merged entries."""
    # Pattern: word (pos) definition
    # If we find this pattern multiple times, split on it
    pattern = r'([a-z]+)\s*\(([^)]+)\)\s+'
    matches = list(re.finditer(pattern, text, re.IGNORECASE))
    
    if len(matches) > 1:
        # Multiple entries merged - split them
        entries = []
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            entry_text = text[start:end].strip()
            entries.append(entry_text)
        return entries
    return [text]

def extract_definition(text):
    """Extract definition, stopping before example sentence."""
    # Find the last complete parenthetical expression
    depth = 0
    last_close = -1
    
    for i, char in enumerate(text):
        if char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
            if depth == 0:
                last_close = i
    
    if last_close > 0:
        # Check if the parenthetical looks like an example (starts with capital)
        example_start = text.rfind('(', 0, last_close + 1)
        if example_start > 0:
            potential_example = text[example_start + 1:last_close]
            if potential_example and potential_example[0].isupper():
                # This is an example sentence - definition is before it
                definition = text[:example_start].strip()
                # Remove trailing "(" if present
                definition = definition.rstrip('(').strip()
                return definition
    
    # No complete example found, remove incomplete parentheses
    cleaned = re.sub(r'\s*\([^)]*$', '', text).strip()
    return cleaned

def parse_entry(text):
    """Parse a vocabulary entry."""
    text = text.strip()
    if not text:
        return None
    
    # Match: word (pos) definition
    match = re.match(r'^([a-z]+)\s*\(([^)]+)\)\s+(.+)$', text, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    
    word = match.group(1).lower().strip()
    pos = normalize_pos(match.group(2))
    content = match.group(3).strip()
    
    # Check if this entry is merged with another (contains "word (pos)" pattern)
    merged_check = re.search(r'\s+([a-z]+)\s*\(([^)]+)\)\s*[a-z]', content, re.IGNORECASE)
    if merged_check:
        # This is merged - extract only up to the next entry
        split_pos = merged_check.start()
        content = content[:split_pos].strip()
    
    # Extract definition
    definition = extract_definition(content)
    
    # Clean up: remove trailing incomplete words
    definition = re.sub(r'\s+(the|a|an|which|that|when|where|who|what|how|are|is|was|were|be|not|to|of|in|on|at|for|with|from|and|or|but|so|if|as|well)$', '', definition, flags=re.IGNORECASE).strip()
    
    # Remove trailing punctuation
    definition = definition.rstrip(',').rstrip('.').strip()
    
    return {
        'word': word,
        'partOfSpeech': pos,
        'definition': definition,
        'exampleSentence': None,  # We'll extract these separately if needed
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
        
        # Check if starts new entry
        is_new = bool(re.match(r'^[a-z]+\s*\(', line, re.IGNORECASE))
        
        if is_new and current_lines:
            combined = ' '.join(current_lines)
            # Check for merged entries and split them
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
    
    # Verify samples
    print("\nSample entries:")
    for word in ['affable', 'gregarious', 'indigenous', 'aesthetic', 'agile', 'aggregate']:
        entry = next((e for e in unique if e and e['word'] == word), None)
        if entry:
            print(f"  {word}: {entry['definition']}")
    
    # Save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved to {output_file}")

if __name__ == '__main__':
    main()

