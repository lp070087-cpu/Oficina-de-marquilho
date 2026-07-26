import re

with open('/sessions/adoring-practical-davinci/mnt/marquinho-projeto/src/app/estoque/assistente/page.tsx', 'r') as f:
    content = f.read()

lines = content.split('\n')
depth = 0
in_str = None
i = 0

# Track: None, single 'str', double "str", backtick `str`
# In backticks, ${...} can contain nested braces that are NOT JSX/TS braces
# We need to skip those entirely when inside backtick strings.

while i < len(content):
    c = content[i]

    if in_str == "'":
        if c == '\\':
            i += 2  # skip escaped char
            continue
        if c == "'":
            in_str = None
        i += 1
        continue
    elif in_str == '"':
        if c == '\\':
            i += 2
            continue
        if c == '"':
            in_str = None
        i += 1
        continue
    elif in_str == '`':
        if c == '\\':
            i += 2
            continue
        if c == '`':
            in_str = None
        elif c == '$' and i+1 < len(content) and content[i+1] == '{':
            # Skip entire ${...} expression inside template literal
            i += 2  # skip ${
            td = 1
            while i < len(content) and td > 0:
                if content[i] == '`':
                    td -= 1  # shouldn't happen in valid JS, but just in case
                elif content[i] == '{':
                    td += 1
                elif content[i] == '}':
                    td -= 1
                i += 1
            continue  # i already past closing }
        i += 1
        continue

    # Not in any string
    if c == "'":
        in_str = "'"
    elif c == '"':
        in_str = '"'
    elif c == '`':
        in_str = '`'
    elif c in '{([}':
        depth += 1
    elif c in '})]':
        depth -= 1
    i += 1

print(f"Depth: {depth}")
print(f"Lines: {len(lines)}")
print(f"In string at end: {in_str}")
if depth == 0 and in_str is None:
    print("BALANCED")
else:
    print("IMBALANCED")
