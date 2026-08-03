#!/usr/bin/env python3
"""
🎨 THUMBNAIL COMPOSER PILLOW - SISTEMA CONFIABLE

Ventajas sobre ImageMagick:
- Control preciso de capas y transparencias
- Renderizado de texto más estable
- Sin problemas de fondos negros
- Debugging visual más fácil
- Mejor manejo de colores y degradados

Características:
- Keyword resaltada con medición precisa
- Fondo decorativo con bordes redondeados
- Auto-scaling si el texto es muy largo
- Categorías con colores específicos
"""

import sys
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import json

# Configuración del canvas
CANVAS = {
    'width': 1344,
    'height': 768,
    'margin': 40,
    'max_text_width': 1200
}

# Colores por categoría
COLORS = {
    'sabiduria': {
        'keyword': '#FFD700',      # Gold
        'text': '#FFFFFF',         # White
        'stroke': '#000000',       # Black
        'background': '#FFD700'    # Gold
    },
    'fortaleza': {
        'keyword': '#FF0000',      # Red
        'text': '#FFFFFF',
        'stroke': '#000000',
        'background': '#FF0000'
    },
    'esperanza': {
        'keyword': '#FFED00',      # Yellow
        'text': '#FFFFFF',
        'stroke': '#000000',
        'background': '#FFED00'
    },
    'amor': {
        'keyword': '#FF0000',      # Red
        'text': '#FFFFFF',
        'stroke': '#000000',
        'background': '#FF0000'
    },
    'consuelo': {
        'keyword': '#9C27B0',      # Purple
        'text': '#FFFFFF',
        'stroke': '#000000',
        'background': '#9C27B0'
    },
    'fe': {
        'keyword': '#2196F3',      # Blue
        'text': '#FFFFFF',
        'stroke': '#000000',
        'background': '#2196F3'
    }
}

def hex_to_rgb(hex_color):
    """Convertir color hex a RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def detect_keyword(phrase):
    """Detectar palabra clave en la frase"""
    words = phrase.split()

    # Prioridad 1: Palabras en mayúsculas
    for word in words:
        if word.isupper() and len(word) > 2:
            return word

    # Prioridad 2: Palabras largas (>6 letras)
    long_words = [w for w in words if len(w) > 6]
    if long_words:
        return long_words[0]

    # Prioridad 3: Última palabra si es larga
    if len(words[-1]) > 4:
        return words[-1]

    # Fallback: Primera palabra
    return words[0]

def get_font(size):
    """Obtener fuente bold"""
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        'C:\\Windows\\Fonts\\arialbd.ttf'
    ]

    for font_path in font_paths:
        if os.path.exists(font_path):
            return ImageFont.truetype(font_path, size)

    # Fallback a fuente default
    return ImageFont.load_default()

def measure_text(text, font):
    """Medir ancho y alto del texto"""
    # Crear imagen temporal para medir
    temp_img = Image.new('RGB', (1, 1))
    draw = ImageDraw.Draw(temp_img)
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    return width, height

def calculate_optimal_size(phrase, max_width):
    """Calcular tamaño óptimo de fuente para que quepa"""
    word_count = len(phrase.split())

    # Tamaño inicial según cantidad de palabras
    if word_count <= 2:
        initial_size = 220
    elif word_count <= 3:
        initial_size = 190
    elif word_count <= 5:
        initial_size = 160
    else:
        initial_size = 130

    size = initial_size
    while size > 60:
        font = get_font(size)
        width, _ = measure_text(phrase.upper(), font)
        if width <= max_width:
            return size, font
        size -= 10

    return 60, get_font(60)

def draw_text_with_stroke(draw, position, text, font, fill_color, stroke_color, stroke_width=2):
    """Dibujar texto con borde (stroke)"""
    x, y = position

    # Dibujar stroke (borde negro)
    for offset_x in range(-stroke_width, stroke_width + 1):
        for offset_y in range(-stroke_width, stroke_width + 1):
            if offset_x != 0 or offset_y != 0:
                draw.text((x + offset_x, y + offset_y), text, font=font, fill=stroke_color)

    # Dibujar texto principal encima
    draw.text(position, text, font=font, fill=fill_color)

def create_rounded_rectangle(size, radius, color, opacity=0.7):
    """Crear rectángulo con bordes redondeados y transparencia"""
    width, height = size

    # Crear imagen con canal alpha
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dibujar rectángulo redondeado
    rgb_color = hex_to_rgb(color)
    alpha = int(opacity * 255)
    fill_color = rgb_color + (alpha,)

    draw.rounded_rectangle([(0, 0), (width - 1, height - 1)], radius=20, fill=fill_color)

    return img

def compose_thumbnail(base_image_path, phrase, category, output_path):
    """Componer thumbnail con Pillow"""
    print('\n🎨 COMPOSITOR PILLOW - SISTEMA CONFIABLE')
    print('━' * 60)

    # Cargar imagen base
    if not os.path.exists(base_image_path):
        raise FileNotFoundError(f'Imagen base no encontrada: {base_image_path}')

    base_img = Image.open(base_image_path).convert('RGB')

    # Verificar dimensiones
    if base_img.size != (CANVAS['width'], CANVAS['height']):
        print(f'⚠️  Redimensionando base de {base_img.size} a {CANVAS["width"]}x{CANVAS["height"]}')
        base_img = base_img.resize((CANVAS['width'], CANVAS['height']), Image.Resampling.LANCZOS)

    # Detectar keyword
    phrase_upper = phrase.upper()
    keyword = detect_keyword(phrase).upper()

    # Calcular tamaño óptimo
    size, font = calculate_optimal_size(phrase, CANVAS['max_text_width'])

    # Obtener colores de la categoría
    colors = COLORS.get(category, COLORS['sabiduria'])

    print(f'\n📐 Layout:')
    print(f'   Categoría: {category}')
    print(f'   Frase: "{phrase_upper}"')
    print(f'   Keyword: "{keyword}" en {colors["keyword"]}')
    print(f'   Tamaño fuente: {size}pt')

    # Dividir frase en segmentos
    keyword_index = phrase_upper.find(keyword)
    before_keyword = phrase_upper[:keyword_index]
    after_keyword = phrase_upper[keyword_index + len(keyword):]

    # Medir cada segmento
    before_width, text_height = measure_text(before_keyword, font) if before_keyword else (0, 0)
    keyword_width, _ = measure_text(keyword, font)
    after_width, _ = measure_text(after_keyword, font) if after_keyword else (0, 0)

    total_width = before_width + keyword_width + after_width

    print(f'\n📏 Mediciones:')
    print(f'   Antes: {before_width}px')
    print(f'   Keyword: {keyword_width}px')
    print(f'   Después: {after_width}px')
    print(f'   Total: {total_width}px (máx: {CANVAS["max_text_width"]}px)')

    # Crear capa para el fondo decorativo
    bg_width = min(700, total_width + 80)
    bg_height = int(size * 1.8)

    bg_rect = create_rounded_rectangle(
        (bg_width, bg_height),
        radius=20,
        color=colors['background'],
        opacity=0.7
    )

    # Posición vertical centrada
    y_offset = -30
    y_absolute = (CANVAS['height'] // 2) + y_offset
    bg_y = y_absolute - (bg_height // 2)
    bg_x = CANVAS['margin'] - 20

    # Componer: pegar fondo decorativo sobre base
    base_img.paste(bg_rect, (bg_x, bg_y), bg_rect)

    # Dibujar texto
    draw = ImageDraw.Draw(base_img)

    base_x = CANVAS['margin']
    rgb_white = hex_to_rgb(colors['text'])
    rgb_keyword = hex_to_rgb(colors['keyword'])
    rgb_stroke = hex_to_rgb(colors['stroke'])

    # Segmento 1: Antes de keyword (BLANCO)
    current_x = base_x
    if before_keyword.strip():
        draw_text_with_stroke(
            draw,
            (current_x, y_absolute),
            before_keyword,
            font,
            fill_color=rgb_white,
            stroke_color=rgb_stroke,
            stroke_width=2
        )
        current_x += before_width

    # Segmento 2: Keyword (COLOR)
    draw_text_with_stroke(
        draw,
        (current_x, y_absolute),
        keyword,
        font,
        fill_color=rgb_keyword,
        stroke_color=rgb_stroke,
        stroke_width=2
    )
    current_x += keyword_width

    # Segmento 3: Después de keyword (BLANCO)
    if after_keyword.strip():
        draw_text_with_stroke(
            draw,
            (current_x, y_absolute),
            after_keyword,
            font,
            fill_color=rgb_white,
            stroke_color=rgb_stroke,
            stroke_width=2
        )

    # Guardar resultado
    base_img.save(output_path, 'JPEG', quality=95, optimize=True)

    file_size = os.path.getsize(output_path) / 1024
    print(f'\n✅ Thumbnail generado exitosamente')
    print(f'   Archivo: {os.path.basename(output_path)}')
    print(f'   Tamaño: {file_size:.0f}KB\n')

    return {
        'success': True,
        'path': output_path,
        'size_kb': file_size,
        'keyword': keyword,
        'phrase': phrase_upper
    }

def main():
    if len(sys.argv) < 4:
        print('\n❌ Uso: python3 compose-thumbnail-pillow.py <base-image> <phrase> <category> [output]')
        print('\nEjemplo:')
        print('  python3 compose-thumbnail-pillow.py base.png "Esto te cambiará" sabiduria output.jpg')
        print('  python3 compose-thumbnail-pillow.py base.png "Promesa de Dios" esperanza output.jpg\n')
        sys.exit(1)

    base_image = sys.argv[1]
    phrase = sys.argv[2]
    category = sys.argv[3]
    output = sys.argv[4] if len(sys.argv) > 4 else '/tmp/thumbnail-pillow.jpg'

    try:
        result = compose_thumbnail(base_image, phrase, category, output)
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
