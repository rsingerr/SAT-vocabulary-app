#!/usr/bin/env python3
"""
Final fix: properly extract complete definitions from source file.
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

def extract_complete_definition(text):
    """Extract the definition part, stopping before example sentence."""
    # Find the last complete parenthetical expression (the example)
    # Everything before that is the definition
    
    # Count parentheses to find complete pairs
    depth = 0
    last_complete_end = -1
    
    for i, char in enumerate(text):
        if char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
            if depth == 0:
                last_complete_end = i
    
    if last_complete_end > 0:
        # Extract definition (everything before the last complete parentheses)
        definition = text[:last_complete_end].strip()
        example = text[last_complete_end + 1:].strip()
        
        # Check if the part in parentheses looks like an example (starts with capital)
        if example and len(example) > 10 and example[0].isupper():
            # Remove the opening paren from definition
            definition = definition.rstrip('(').strip()
            return definition, example[1:] if example.startswith('(') else example
    
    # No complete example found, return whole text as definition
    # But remove incomplete trailing parentheses
    cleaned = re.sub(r'\s*\([^)]*$', '', text).strip()
    return cleaned, None

def parse_line(line):
    """Parse a single line entry."""
    line = line.strip()
    if not line:
        return None
    
    # Match: word (pos) definition (example)
    match = re.match(r'^([a-z]+)\s*\(([^)]+)\)\s+(.+)$', line, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    
    word = match.group(1).lower().strip()
    pos = normalize_pos(match.group(2))
    content = match.group(3).strip()
    
    # Extract definition and example
    definition, example = extract_complete_definition(content)
    
    # Clean up definition - remove any trailing incomplete words
    definition = re.sub(r'\s+(the|a|an|which|that|when|where|who|what|how|are|is|was|were|be|not|to|of|in|on|at|for|with|from|and|or|but)$', '', definition, flags=re.IGNORECASE).strip()
    
    # Remove trailing commas
    definition = definition.rstrip(',').strip()
    
    return {
        'word': word,
        'partOfSpeech': pos,
        'definition': definition,
        'exampleSentence': example if example and len(example) > 5 else None,
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
            parsed = parse_line(combined)
            if parsed:
                entries.append(parsed)
            current_lines = [line]
        elif line:
            current_lines.append(line)
        elif current_lines:
            combined = ' '.join(current_lines)
            parsed = parse_line(combined)
            if parsed:
                entries.append(parsed)
            current_lines = []
    
    if current_lines:
        combined = ' '.join(current_lines)
        parsed = parse_line(combined)
        if parsed:
            entries.append(parsed)
    
    # Remove duplicates
    seen = set()
    unique = []
    for entry in entries:
        if entry['word'] not in seen:
            seen.add(entry['word'])
            unique.append(entry)
    
    unique.sort(key=lambda x: x['word'])
    
    print(f"✅ Parsed {len(unique)} unique words")
    
    # Verify samples
    print("\nSample entries:")
    for word in ['affable', 'gregarious', 'indigenous', 'aesthetic', 'agile']:
        entry = next((e for e in unique if e['word'] == word), None)
        if entry:
            print(f"  {word}: {entry['definition']}")
    
    # Save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved to {output_file}")

if __name__ == '__main__':
    main()

