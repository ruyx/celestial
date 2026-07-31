#!/usr/bin/env python3
"""
🎨 THUMBNAIL COMPOSITOR PILLOW V2 - WORD WRAPPING + ÁREA SEGURA

Mejoras:
- Área segura a la izquierda (40% del canvas)
- Word wrapping automático si el texto es muy largo
- Sin rectángulos de fondo - solo texto limpio
- Keyword resaltada en cada línea
- Bloque de texto multi-línea centrado verticalmente
"""

import sys
import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# Configuración del canvas
CANVAS = {
    'width': 1344,
    'height': 768,
    'text_area': {
        'x': 40,          # Margen izquierdo
        'width': 540,     # 40% del canvas para texto
        'max_width': 500  # Ancho máximo del texto (dejando margen)
    }
}

# Colores por categoría
COLORS = {
    'sabiduria': {
        'keyword': '#FFD700',      # Gold
        'text': '#FFFFFF',         # White
        'stroke': '#000000'        # Black
    },
    'fortaleza': {
        'keyword': '#FF0000',      # Red
        'text': '#FFFFFF',
        'stroke': '#000000'
    },
    'esperanza': {
        'keyword': '#FFED00',      # Yellow
        'text': '#FFFFFF',
        'stroke': '#000000'
    },
    'amor': {
        'keyword': '#FF0000',      # Red
        'text': '#FFFFFF',
        'stroke': '#000000'
    },
    'consuelo': {
        'keyword': '#9C27B0',      # Purple
        'text': '#FFFFFF',
        'stroke': '#000000'
    },
    'fe': {
        'keyword': '#2196F3',      # Blue
        'text': '#FFFFFF',
        'stroke': '#000000'
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

    return ImageFont.load_default()

def measure_text(text, font):
    """Medir ancho y alto del texto"""
    temp_img = Image.new('RGB', (1, 1))
    draw = ImageDraw.Draw(temp_img)
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    return width, height

def wrap_text(text, font, max_width):
    """
    Dividir texto en líneas que quepan en max_width
    Retorna lista de líneas
    """
    words = text.split()
    lines = []
    current_line = []

    for word in words:
        # Probar agregar palabra a línea actual
        test_line = ' '.join(current_line + [word])
        width, _ = measure_text(test_line, font)

        if width <= max_width:
            current_line.append(word)
        else:
            # Línea actual está llena, guardarla y empezar nueva
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]

    # Agregar última línea
    if current_line:
        lines.append(' '.join(current_line))

    return lines

def calculate_font_size(phrase, max_width):
    """Calcular tamaño de fuente para que el texto quepa"""
    word_count = len(phrase.split())

    # Tamaño inicial según cantidad de palabras
    if word_count <= 3:
        initial_size = 120
    elif word_count <= 5:
        initial_size = 100
    else:
        initial_size = 80

    size = initial_size
    while size > 40:
        font = get_font(size)
        lines = wrap_text(phrase, font, max_width)

        # Verificar que no haya demasiadas líneas (máx 3)
        if len(lines) <= 3:
            # Verificar que cada palabra individual quepa
            max_word = max(phrase.split(), key=len)
            word_width, _ = measure_text(max_word, font)
            if word_width <= max_width:
                return size, font, lines

        size -= 10

    return 40, get_font(40), wrap_text(phrase, get_font(40), max_width)

def draw_text_with_stroke(draw, position, text, font, fill_color, stroke_color, stroke_width=3):
    """Dibujar texto con borde (stroke) más grueso para mejor visibilidad"""
    x, y = position

    # Dibujar stroke (borde negro)
    for offset_x in range(-stroke_width, stroke_width + 1):
        for offset_y in range(-stroke_width, stroke_width + 1):
            if offset_x != 0 or offset_y != 0:
                draw.text((x + offset_x, y + offset_y), text, font=font, fill=stroke_color)

    # Dibujar texto principal encima
    draw.text(position, text, font=font, fill=fill_color)

def compose_thumbnail(base_image_path, phrase, category, output_path):
    """Componer thumbnail con word wrapping y área segura"""
    print('\n🎨 COMPOSITOR PILLOW V2 - WORD WRAPPING + ÁREA SEGURA')
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

    # Calcular tamaño óptimo y líneas
    size, font, lines = calculate_font_size(phrase_upper, CANVAS['text_area']['max_width'])

    # Obtener colores de la categoría
    colors = COLORS.get(category, COLORS['sabiduria'])

    print(f'\n📐 Layout:')
    print(f'   Categoría: {category}')
    print(f'   Frase: "{phrase_upper}"')
    print(f'   Keyword: "{keyword}" en {colors["keyword"]}')
    print(f'   Tamaño fuente: {size}pt')
    print(f'   Líneas: {len(lines)}')
    for i, line in enumerate(lines, 1):
        print(f'      L{i}: "{line}"')

    # Medir altura del bloque de texto
    _, line_height = measure_text('Ay', font)
    line_spacing = int(line_height * 0.3)  # 30% de espacio entre líneas
    total_height = (line_height * len(lines)) + (line_spacing * (len(lines) - 1))

    # Centrar verticalmente el bloque
    start_y = (CANVAS['height'] - total_height) // 2

    # Dibujar cada línea
    draw = ImageDraw.Draw(base_img)
    rgb_white = hex_to_rgb(colors['text'])
    rgb_keyword = hex_to_rgb(colors['keyword'])
    rgb_stroke = hex_to_rgb(colors['stroke'])

    current_y = start_y

    for line in lines:
        # Verificar si la línea contiene la keyword
        if keyword in line:
            # Dividir línea en segmentos
            keyword_index = line.find(keyword)
            before = line[:keyword_index]
            after = line[keyword_index + len(keyword):]

            # Medir segmentos
            before_width, _ = measure_text(before, font) if before else (0, 0)
            keyword_width, _ = measure_text(keyword, font)

            current_x = CANVAS['text_area']['x']

            # Dibujar antes de keyword (blanco)
            if before.strip():
                draw_text_with_stroke(
                    draw,
                    (current_x, current_y),
                    before,
                    font,
                    fill_color=rgb_white,
                    stroke_color=rgb_stroke,
                    stroke_width=3
                )
                current_x += before_width

            # Dibujar keyword (color)
            draw_text_with_stroke(
                draw,
                (current_x, current_y),
                keyword,
                font,
                fill_color=rgb_keyword,
                stroke_color=rgb_stroke,
                stroke_width=3
            )
            current_x += keyword_width

            # Dibujar después de keyword (blanco)
            if after.strip():
                draw_text_with_stroke(
                    draw,
                    (current_x, current_y),
                    after,
                    font,
                    fill_color=rgb_white,
                    stroke_color=rgb_stroke,
                    stroke_width=3
                )
        else:
            # Línea sin keyword, todo en blanco
            draw_text_with_stroke(
                draw,
                (CANVAS['text_area']['x'], current_y),
                line,
                font,
                fill_color=rgb_white,
                stroke_color=rgb_stroke,
                stroke_width=3
            )

        current_y += line_height + line_spacing

    # Guardar resultado
    base_img.save(output_path, 'JPEG', quality=95, optimize=True)

    file_size = os.path.getsize(output_path) / 1024
    print(f'\n✅ Thumbnail generado exitosamente')
    print(f'   Archivo: {os.path.basename(output_path)}')
    print(f'   Tamaño: {file_size:.0f}KB')
    print(f'   Área de texto: {CANVAS["text_area"]["width"]}px (lado izquierdo)\n')

    return {
        'success': True,
        'path': output_path,
        'size_kb': file_size,
        'keyword': keyword,
        'lines': lines
    }

def main():
    if len(sys.argv) < 4:
        print('\n❌ Uso: python3 compose-thumbnail-pillow-v2.py <base-image> <phrase> <category> [output]')
        print('\nEjemplo:')
        print('  python3 compose-thumbnail-pillow-v2.py base.png "Esto te cambiará para siempre" sabiduria output.jpg\n')
        sys.exit(1)

    base_image = sys.argv[1]
    phrase = sys.argv[2]
    category = sys.argv[3]
    output = sys.argv[4] if len(sys.argv) > 4 else '/tmp/thumbnail-pillow-v2.jpg'

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
