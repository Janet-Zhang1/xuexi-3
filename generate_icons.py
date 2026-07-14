#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成iOS应用图标和启动画面PNG
"""

import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size):
    """获取可用的字体"""
    font_paths = [
        '/System/Library/Fonts/STHeiti Medium.ttc',
        '/System/Library/Fonts/Hiragino Sans GB.ttc',
        '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
    ]
    for path in font_paths:
        try:
            if os.path.exists(path):
                return ImageFont.truetype(path, size)
        except:
            continue
    return ImageFont.load_default()

def create_app_icon(size, output_path):
    """创建应用图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 渐变背景（近似）
    for y in range(size):
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # 圆角
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=size*0.22, fill=255)
    img.putalpha(mask)
    
    # 文字
    draw = ImageDraw.Draw(img)
    
    # 大字母A
    font_large = get_font(int(size * 0.3))
    text = 'A'
    bbox = draw.textbbox((0, 0), text, font=font_large)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, size * 0.2), text, fill='white', font=font_large)
    
    # "词汇"
    font_medium = get_font(int(size * 0.1))
    text = '词汇'
    bbox = draw.textbbox((0, 0), text, font=font_medium)
    tw = bbox[2] - bbox[0]
    draw.text(((size - tw) / 2, size * 0.55), text, fill='white', font=font_medium)
    
    # "中考英语"
    font_small = get_font(int(size * 0.06))
    text = '中考英语'
    bbox = draw.textbbox((0, 0), text, font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text(((size - tw) / 2, size * 0.72), text, fill=(255, 255, 255, 180), font=font_small)
    
    img.save(output_path, 'PNG')
    print(f'  生成: {output_path} ({size}x{size})')

def create_splash_screen(size, output_path):
    """创建启动画面"""
    width, height = size
    img = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 渐变背景
    for y in range(height):
        ratio = y / height
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # 大字母A
    font_large = get_font(int(height * 0.18))
    text = 'A'
    bbox = draw.textbbox((0, 0), text, font=font_large)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) / 2, height * 0.25), text, fill='white', font=font_large)
    
    # "中考英语词汇"
    font_medium = get_font(int(height * 0.05))
    text = '中考英语词汇'
    bbox = draw.textbbox((0, 0), text, font=font_medium)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) / 2, height * 0.5), text, fill='white', font=font_medium)
    
    # "每天5分钟，轻松记单词"
    font_small = get_font(int(height * 0.03))
    text = '每天5分钟，轻松记单词'
    bbox = draw.textbbox((0, 0), text, font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) / 2, height * 0.6), text, fill=(255, 255, 255, 200), font=font_small)
    
    img.save(output_path, 'PNG')
    print(f'  生成: {output_path} ({width}x{height})')

def main():
    # 应用图标尺寸（iOS）
    icon_sizes = [
        (20, '20'),
        (29, '29'),
        (40, '40'),
        (60, '60'),
        (76, '76'),
        (83.5, '83.5'),
        (1024, '1024'),
    ]
    
    icon_dir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset'
    os.makedirs(icon_dir, exist_ok=True)
    
    print('生成应用图标...')
    for size, name in icon_sizes:
        # 1x
        create_app_icon(int(size), f'{icon_dir}/AppIcon-{name}@1x.png')
        # 2x
        create_app_icon(int(size * 2), f'{icon_dir}/AppIcon-{name}@2x.png')
        # 3x (除了iPad的)
        if name not in ['76', '83.5']:
            create_app_icon(int(size * 3), f'{icon_dir}/AppIcon-{name}@3x.png')
    
    # 启动画面
    splash_dir = 'ios/App/App/Assets.xcassets/Splash.imageset'
    os.makedirs(splash_dir, exist_ok=True)
    
    print('\n生成启动画面...')
    create_splash_screen((2732, 2732), f'{splash_dir}/splash-2732x2732.png')
    create_splash_screen((1242, 2208), f'{splash_dir}/splash-1242x2208.png')
    create_splash_screen((750, 1334), f'{splash_dir}/splash-750x1334.png')
    
    # 更新Contents.json
    print('\n更新Contents.json...')
    
    # AppIcon的Contents.json
    icon_contents = {
        "images": [
            {"idiom": "iphone", "size": "20x20", "filename": "AppIcon-20@2x.png", "scale": "2x"},
            {"idiom": "iphone", "size": "20x20", "filename": "AppIcon-20@3x.png", "scale": "3x"},
            {"idiom": "iphone", "size": "29x29", "filename": "AppIcon-29@2x.png", "scale": "2x"},
            {"idiom": "iphone", "size": "29x29", "filename": "AppIcon-29@3x.png", "scale": "3x"},
            {"idiom": "iphone", "size": "40x40", "filename": "AppIcon-40@2x.png", "scale": "2x"},
            {"idiom": "iphone", "size": "40x40", "filename": "AppIcon-40@3x.png", "scale": "3x"},
            {"idiom": "iphone", "size": "60x60", "filename": "AppIcon-60@2x.png", "scale": "2x"},
            {"idiom": "iphone", "size": "60x60", "filename": "AppIcon-60@3x.png", "scale": "3x"},
            {"idiom": "ipad", "size": "20x20", "filename": "AppIcon-20@1x.png", "scale": "1x"},
            {"idiom": "ipad", "size": "20x20", "filename": "AppIcon-20@2x.png", "scale": "2x"},
            {"idiom": "ipad", "size": "29x29", "filename": "AppIcon-29@1x.png", "scale": "1x"},
            {"idiom": "ipad", "size": "29x29", "filename": "AppIcon-29@2x.png", "scale": "2x"},
            {"idiom": "ipad", "size": "40x40", "filename": "AppIcon-40@1x.png", "scale": "1x"},
            {"idiom": "ipad", "size": "40x40", "filename": "AppIcon-40@2x.png", "scale": "2x"},
            {"idiom": "ipad", "size": "76x76", "filename": "AppIcon-76@1x.png", "scale": "1x"},
            {"idiom": "ipad", "size": "76x76", "filename": "AppIcon-76@2x.png", "scale": "2x"},
            {"idiom": "ipad", "size": "83.5x83.5", "filename": "AppIcon-83.5@2x.png", "scale": "2x"},
            {"idiom": "ios-marketing", "size": "1024x1024", "filename": "AppIcon-1024@1x.png", "scale": "1x"}
        ],
        "info": {"version": 1, "author": "xcode"}
    }
    
    import json
    with open(f'{icon_dir}/Contents.json', 'w') as f:
        json.dump(icon_contents, f, indent=2)
    
    # Splash的Contents.json
    splash_contents = {
        "images": [
            {"idiom": "universal", "filename": "splash-2732x2732.png", "scale": "1x"}
        ],
        "info": {"version": 1, "author": "xcode"}
    }
    
    with open(f'{splash_dir}/Contents.json', 'w') as f:
        json.dump(splash_contents, f, indent=2)
    
    print('\n✅ 图标和启动画面生成完成！')

if __name__ == '__main__':
    main()