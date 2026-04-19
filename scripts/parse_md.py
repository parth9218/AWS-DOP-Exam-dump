import json
import re

def parse_md(filepath):
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
        # We can extract the body by removing the title, answer, timestamp, link, and their markers
        body_start = title_match.end()
        answer_start = answer_match.start() if answer_match else len(block)
        
        body = block[body_start:answer_start].strip()
        
        questions.append({
            'title': title,
            'body': body,
            'answer': answer,
            'timestamp': timestamp,
            'link': link
        })
        
    with open('questions1.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)
        
    print(f"Parsed {len(questions)} questions.")

parse_md('/Users/parth/Downloads/AWS-DOP.md')
