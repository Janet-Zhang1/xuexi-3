#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用wordsegment库修复PDF解析后英文单词间空格丢失的问题
"""

import json
import re
from wordsegment import load, segment

# 加载wordsegment词典
load()

def split_english_text(text):
    """
    使用wordsegment库分割连在一起的英文单词
    """
    if not text:
        return text
    
    # 只处理连续的英文字母段（包括撇号和连字符）
    def is_english_char(c):
        return c.isalpha() or c in "'-."
    
    result = []
    i = 0
    n = len(text)
    
    while i < n:
        if is_english_char(text[i]):
            # 找到连续的英文字符段
            j = i
            while j < n and is_english_char(text[j]):
                j += 1
            segment_text = text[i:j]
            
            # 清理末尾的标点
            while segment_text and segment_text[-1] in '.,;!?':
                segment_text = segment_text[:-1]
            
            # 只有当长度大于5且没有空格时才尝试分割
            if len(segment_text) > 5 and ' ' not in segment_text:
                # 处理撇号：先去掉撇号，分割后再恢复
                original_segment = segment_text
                has_apostrophe = "'" in segment_text or "’" in segment_text
                
                # 统一撇号
                segment_text = segment_text.replace("’", "'")
                
                if has_apostrophe:
                    # 按撇号分割成几部分分别处理
                    parts = segment_text.split("'")
                    processed_parts = []
                    for k, part in enumerate(parts):
                        if len(part) > 3 and ' ' not in part:
                            words = segment(part.lower())
                            processed = ' '.join(words)
                            # 恢复首字母大写
                            if part and part[0].isupper():
                                processed = processed[0].upper() + processed[1:]
                            processed_parts.append(processed)
                        else:
                            processed_parts.append(part)
                    split_result = "'".join(processed_parts)
                else:
                    # 直接分割
                    words = segment(segment_text.lower())
                    split_result = ' '.join(words)
                    
                    # 恢复首字母大写（如果原来有的）
                    if segment_text and segment_text[0].isupper():
                        split_result = split_result[0].upper() + split_result[1:]
                
                result.append(split_result)
            else:
                result.append(segment_text)
            
            i = j
        else:
            result.append(text[i])
            i += 1
    
    return ''.join(result)

def fix_content_spacing(content):
    """
    修复解析内容中的英文空格问题
    """
    lines = content.split('\n')
    fixed_lines = []
    
    for line in lines:
        # 检测这一行英文比例
        english_chars = sum(1 for c in line if c.isalpha())
        total_chars = sum(1 for c in line if not c.isspace())
        
        if total_chars > 0 and english_chars / total_chars > 0.4 and english_chars > 10:
            # 英文含量高，进行空格修复
            fixed_line = split_english_text(line)
            fixed_lines.append(fixed_line)
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def main():
    input_path = 'src/data/vocabulary_parsed.json'
    output_path = 'src/data/vocabulary_parsed.json'
    
    print('正在读取词汇数据...')
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f'共 {len(data)} 个词汇，正在修复空格...')
    
    fixed_count = 0
    for i, item in enumerate(data):
        original = item['content']
        fixed = fix_content_spacing(original)
        if fixed != original:
            item['content'] = fixed
            fixed_count += 1
        
        if (i + 1) % 200 == 0:
            print(f'  已处理 {i + 1}/{len(data)}...')
    
    print(f'修复完成，共修复 {fixed_count} 个词汇')
    
    # 保存
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'已保存到 {output_path}')
    
    # 显示几个示例
    print('\n修复示例:')
    for item in data[:3]:
        print(f'\n{item["word"]}:')
        lines = item['content'].split('\n')[1:5]
        for line in lines:
            print(f'  {line}')

if __name__ == '__main__':
    main()