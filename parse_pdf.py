#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析中考英语考纲词汇解析PDF，提取词汇和解析内容
"""

import PyPDF2
import re
import json

def parse_vocabulary_pdf(pdf_path, output_path):
    # 提取所有页面文本
    all_text = ""
    print(f"正在读取PDF文件: {pdf_path}")
    
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        total_pages = len(reader.pages)
        print(f"总页数: {total_pages}")
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                all_text += text + "\n"
            if (i + 1) % 50 == 0:
                print(f"  已处理 {i + 1}/{total_pages} 页...")
    
    print(f"文本提取完成，总字符数: {len(all_text)}")
    
    # 解析词汇条目
    vocabulary_list = []
    current_entry = None
    current_content = []
    
    lines = all_text.split('\n')
    
    # 正则表达式匹配词汇条目开头
    # 格式: 数字.单词(词性)释义
    entry_pattern = re.compile(
        r'^(\d+)\.\s*([a-zA-Z][a-zA-Z\'\-\s]*?)\s*\(([a-z\.]+)\)\s*(.+)$'
    )
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 尝试匹配新条目
        match = entry_pattern.match(line)
        
        if match:
            # 保存上一个条目
            if current_entry:
                current_entry['content'] = '\n'.join(current_content)
                vocabulary_list.append(current_entry)
            
            # 开始新条目
            entry_num = int(match.group(1))
            word = match.group(2).strip()
            pos = match.group(3)  # part of speech 词性
            definition = match.group(4).strip()
            
            current_entry = {
                'id': entry_num,
                'word': word,
                'pos': pos,
                'definition': definition,
                'category': word[0].lower() if word else 'a'
            }
            current_content = [line]
        elif current_entry:
            # 添加到当前条目的内容
            current_content.append(line)
    
    # 保存最后一个条目
    if current_entry:
        current_entry['content'] = '\n'.join(current_content)
        vocabulary_list.append(current_entry)
    
    print(f"\n共解析 {len(vocabulary_list)} 个词汇条目")
    
    # 按类别统计
    categories = {}
    for entry in vocabulary_list:
        cat = entry['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\n各字母开头词汇数量:")
    for cat in sorted(categories.keys()):
        print(f"  {cat.upper()}: {categories[cat]}")
    
    # 保存为JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(vocabulary_list, f, ensure_ascii=False, indent=2)
    
    print(f"\n数据已保存到: {output_path}")
    
    # 显示部分示例
    print("\n前5个条目示例:")
    for entry in vocabulary_list[:5]:
        print(f"  {entry['id']}. {entry['word']} ({entry['pos']})")
        print(f"     释义: {entry['definition'][:50]}...")
    
    return vocabulary_list

if __name__ == '__main__':
    pdf_path = "中考英语考纲词汇解析.pdf"
    output_path = "src/data/vocabulary_parsed.json"
    
    vocabulary = parse_vocabulary_pdf(pdf_path, output_path)