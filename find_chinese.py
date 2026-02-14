import os
import re

directories = [
    "/Users/admin/IdeaProjects/ai_trading_frontend_v4/src/components/",
    "/Users/admin/IdeaProjects/ai_trading_frontend_v4/src/views/"
]

chinese_pattern = re.compile(r'[\u4e00-\u9fa5]')

# Simple comment patterns
line_comment_starts = ('//', '/*', '*', '<!--', '-->')

results = []

for directory in directories:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.vue', '.ts', '.js', '.tsx', '.jsx')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        for i, line in enumerate(f, 1):
                            stripped = line.strip()
                            # Check if line seems to be a comment or inside a comment block
                            # This is a heuristic check
                            if any(stripped.startswith(s) for s in line_comment_starts):
                                continue
                            
                            if chinese_pattern.search(line):
                                # Also exclude lines that are clearly just comments at the end
                                # e.g. code; // comment with chinese
                                # But we'll keep them for now and maybe filter more if needed
                                results.append(f"{file_path}:{i}: {line.strip()}")
                except Exception as e:
                    pass

if results:
    for res in results:
        print(res)
else:
    print("All localized")
