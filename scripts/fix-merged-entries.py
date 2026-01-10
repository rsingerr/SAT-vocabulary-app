#!/usr/bin/env python3
"""
Fix merged vocabulary entries by properly separating them.
"""

import json
import re
from pathlib import Path

def clean_merged_definition(definition):
    """Remove merged entries from definitions."""
    if not definition:
        return definition
    
    # Pattern: if definition contains "word (pos)" pattern, it's merged
    # Split on patterns like "word (n.)" or "word (adj.)" etc.
    merged_pattern = r'\s+([a-z]+)\s*\(([^)]+)\)\s*([a-z])'
    
    # Find all merged entries
    matches = list(re.finditer(merged_pattern, definition, re.IGNORECASE))
    
    if matches:
        # Take only the text before the first merged entry
        first_match = matches[0]
        definition = definition[:first_match.start()].strip()
    
    # Also remove incomplete parenthetical examples
    last_open = definition.rfind('(')
    last_close = definition.rfind(')')
    
    if last_open > last_close:
        # Incomplete parentheses - remove it
        definition = definition[:last_open].strip()
    
    # Remove trailing incomplete words
    definition = re.sub(r'\s+(the|a|an|which|that|when|where|who|what|how|are|is|was|were|be|not|to|of|in|on|at|for|with|from)$', '', definition, flags=re.IGNORECASE).strip()
    
    return definition

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    vocab_file = project_root / 'data' / 'sats_vocab.json'
    
    print(f"Reading {vocab_file}...")
    with open(vocab_file, 'r', encoding='utf-8') as f:
        vocab = json.load(f)
    
    print(f"Fixing merged entries in {len(vocab)} definitions...")
    fixed_count = 0
    
    for entry in vocab:
        original = entry.get('definition', '')
        cleaned = clean_merged_definition(original)
        if cleaned != original:
            entry['definition'] = cleaned
            fixed_count += 1
    
    # Save
    with open(vocab_file, 'w', encoding='utf-8') as f:
        json.dump(vocab, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Fixed {fixed_count} merged definitions")
    
    # Show samples
    print("\nSample fixed entries:")
    samples = ['affable', 'gregarious', 'indigenous', 'aesthetic']
    for word in samples:
        entry = next((e for e in vocab if e['word'] == word), None)
        if entry:
            print(f"  {word}: {entry['definition'][:80]}...")

if __name__ == '__main__':
    main()

