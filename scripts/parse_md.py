import json
import re
import sys
import os

def clean_body_and_answer(body, original_answer):
    # 1. Strip ExamTopics header banner if present
    header_pattern = r'^Exam question from\s+Amazon\'s[\s\S]*?\[All [^\]]+\]\s*'
    cleaned = re.sub(header_pattern, '', body.strip(), flags=re.IGNORECASE).strip()

    # 2. Extract suggested answer and remove it from the body
    sugg_match = re.search(r'Suggested Answer:\s*([A-Z]+)\s*🗳️?', cleaned, flags=re.IGNORECASE)
    answer = original_answer
    if sugg_match:
        sugg = sugg_match.group(1).strip()
        # Prefer suggested answer if original is unknown or if suggested has multiple letters (e.g. ACE vs A)
        if not answer or answer == 'Unknown' or len(sugg) > len(answer):
            answer = sugg
        cleaned = re.sub(r'\n?\s*Suggested Answer:\s*[A-Z]+\s*🗳️?\s*', '\n\n', cleaned, flags=re.IGNORECASE)

    # 3. Format options as **A:**, **B:**, etc. if they are formatted as A., B. or A), B)
    cleaned = re.sub(r'(?m)^\s*([A-H])[\.:\)]\s*', r'\n\n**\1:** ', cleaned)

    # 4. Clean up excess newlines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()

    return cleaned, answer

def parse_md(filepath, output_paths=None):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    questions = []
    
    # Split by the separator
    blocks = content.split('----------------------------------------')
    
    for block in blocks:
        block = block.strip()
        if not block:
            continue
            
        # Extract title
        title_match = re.search(r'## (.*?)\n', block)
        if not title_match:
            continue
        title = title_match.group(1).strip()
        
        # Extract Answer
        answer_match = re.search(r'\*\*Answer:\s*(.*?)\*\*', block)
        answer = answer_match.group(1).strip() if answer_match else "Unknown"
        
        # Extract Timestamp
        timestamp_match = re.search(r'\*\*Timestamp:\s*(.*?)\*\*', block)
        timestamp = timestamp_match.group(1).strip() if timestamp_match else ""
        
        # Extract Link
        link_match = re.search(r'\[View on ExamTopics\]\((.*?)\)', block)
        link = link_match.group(1).strip() if link_match else ""
        
        # The body is everything between title and Answer (or end of question parts)
        body_start = title_match.end()
        answer_start = answer_match.start() if answer_match else len(block)
        
        raw_body = block[body_start:answer_start].strip()
        body, final_answer = clean_body_and_answer(raw_body, answer)
        
        questions.append({
            'title': title,
            'body': body,
            'answer': final_answer,
            'timestamp': timestamp,
            'link': link
        })

    if output_paths:
        for out in output_paths:
            os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
            with open(out, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
            print(f"Saved {len(questions)} questions to {out}")
        
    print(f"Parsed {len(questions)} questions total.")
    return questions

if __name__ == '__main__':
    default_input = '/Users/parth/Downloads/aws-security-specialty.md'
    input_file = sys.argv[1] if len(sys.argv) > 1 else default_input
    
    # Root and exam-app output destinations
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(script_dir, '..'))
    
    output_files = [
        os.path.join(root_dir, 'exam-app', 'public', 'questions.json'),
        os.path.join(root_dir, 'exam-app', 'public', 'questions-full.json')
    ]
    
    if len(sys.argv) > 2:
        output_files = [sys.argv[2]]

    parse_md(input_file, output_files)
