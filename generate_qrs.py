#!/usr/bin/env python3
"""
Generador Autónomo de Códigos QR Vectoriales (SVG) en Alta Resolución para Imprenta
Centro de Interpretación Santuario Ibérico de "El Pajarillo" · Huelma
Sin dependencias externas (Python puro).
"""

import os
import math

# Tablas Galois Field GF(2^8) con polinomio 0x11D (285)
EXP = [0] * 512
LOG = [0] * 256
x = 1
for i in range(255):
    EXP[i] = x
    EXP[i + 255] = x
    LOG[x] = i
    x = (x << 1) ^ (0x11D if (x & 0x80) else 0)

def gf_mul(x, y):
    if x == 0 or y == 0:
        return 0
    return EXP[LOG[x] + LOG[y]]

def rs_poly(n):
    # Genera el polinomio generador Reed-Solomon para n palabras de corrección
    g = [1]
    for i in range(n):
        # g(x) * (x - alpha^i) = g(x)*x + g(x)*alpha^i
        ng = [0] * (len(g) + 1)
        root = EXP[i]
        for j in range(len(g)):
            ng[j] ^= g[j]
            ng[j + 1] ^= gf_mul(g[j], root)
        g = ng
    return g

def rs_encode(data, n_ecc):
    gen = rs_poly(n_ecc)
    msg = data + [0] * n_ecc
    for i in range(len(data)):
        coef = msg[i]
        if coef != 0:
            for j in range(len(gen)):
                msg[i + j] ^= gf_mul(gen[j], coef)
    return msg[len(data):]

# Parámetros para Version 4 (33x33) con Error Correction M
# Capacidad: 64 bytes de datos, 36 bytes de corrección (2 bloques de 18 ECC)
# Data codewords: 64 (2 bloques de 32 datos)
# Total codewords = 100
V4_DATA_CAPACITY = 64
V4_SIZE = 33
V4_ECC_PER_BLOCK = 18
V4_BLOCKS = 2
V4_DATA_PER_BLOCK = 32

def encode_data_v4_m(text):
    data_bytes = text.encode('utf-8')
    n = len(data_bytes)
    if n > 62: # Capacidad máxima para Version 4 M
        raise ValueError(f"Texto demasiado largo para Version 4-M ({n} > 62 bytes)")
    
    # 1. Modo Byte (0100)
    bits = [0, 1, 0, 0]
    # 2. Longitud (8 bits en Version 4 para modo byte)
    for i in range(7, -1, -1):
        bits.append((n >> i) & 1)
    # 3. Datos
    for b in data_bytes:
        for i in range(7, -1, -1):
            bits.append((b >> i) & 1)
    # 4. Terminator (hasta 4 ceros)
    needed = min(4, 64 * 8 - len(bits))
    bits.extend([0] * needed)
    # 5. Rellenar a múltiplo de 8
    while len(bits) % 8 != 0:
        bits.append(0)
    # 6. Rellenar con bytes 0xEC y 0x11
    pad_bytes = [0xEC, 0x11]
    pad_idx = 0
    codewords = []
    for i in range(0, len(bits), 8):
        byte_val = 0
        for bit in bits[i:i+8]:
            byte_val = (byte_val << 1) | bit
        codewords.append(byte_val)
    while len(codewords) < 64:
        codewords.append(pad_bytes[pad_idx % 2])
        pad_idx += 1
    
    # Dividir en 2 bloques de 32 codewords
    block1_data = codewords[0:32]
    block2_data = codewords[32:64]
    
    block1_ecc = rs_encode(block1_data, 18)
    block2_ecc = rs_encode(block2_data, 18)
    
    # Interleave data
    final_codewords = []
    for i in range(32):
        final_codewords.append(block1_data[i])
        final_codewords.append(block2_data[i])
    # Interleave ecc
    for i in range(18):
        final_codewords.append(block1_ecc[i])
        final_codewords.append(block2_ecc[i])
    
    # Convertir codewords a bits
    final_bits = []
    for cw in final_codewords:
        for i in range(7, -1, -1):
            final_bits.append((cw >> i) & 1)
    # 7 bits de relleno al final para Version 4 (total 807 bits para 100 codewords + 7 remainder = 807)
    final_bits.extend([0] * 7)
    return final_bits

def create_matrix_v4(bits, mask_pattern=0):
    size = 33
    m = [[None] * size for _ in range(size)]
    is_reserved = [[False] * size for _ in range(size)]

    # 1. Finder patterns (7x7) + Separators (8x8)
    finders = [(0, 0), (size - 7, 0), (0, size - 7)]
    for r0, c0 in finders:
        for r in range(-1, 8):
            for c in range(-1, 8):
                rr = r0 + r
                cc = c0 + c
                if 0 <= rr < size and 0 <= cc < size:
                    is_reserved[rr][cc] = True
                    if 0 <= r <= 6 and 0 <= c <= 6:
                        if r in (0, 6) or c in (0, 6) or (2 <= r <= 4 and 2 <= c <= 4):
                            m[rr][cc] = 1
                        else:
                            m[rr][cc] = 0
                    else:
                        m[rr][cc] = 0

    # 2. Timing patterns
    for i in range(8, size - 8):
        # Horizontal
        if not is_reserved[6][i]:
            m[6][i] = 1 if i % 2 == 0 else 0
            is_reserved[6][i] = True
        # Vertical
        if not is_reserved[i][6]:
            m[i][6] = 1 if i % 2 == 0 else 0
            is_reserved[i][6] = True

    # 3. Alignment pattern en Version 4: centro en (24, 24)
    align_centers = [(24, 24)]
    for ar, ac in align_centers:
        for dr in range(-2, 3):
            for dc in range(-2, 3):
                rr = ar + dr
                cc = ac + dc
                if not is_reserved[rr][cc]:
                    is_reserved[rr][cc] = True
                    if abs(dr) == 2 or abs(dc) == 2 or (dr == 0 and dc == 0):
                        m[rr][cc] = 1
                    else:
                        m[rr][cc] = 0

    # 4. Dark module fijo en Version 4: (4 * V + 9, 8) = (25, 8)
    m[25][8] = 1
    is_reserved[25][8] = True

    # 5. Reservar área de Formato (alrededor de finders)
    for i in range(9):
        if not is_reserved[8][i]:
            is_reserved[8][i] = True
        if not is_reserved[i][8]:
            is_reserved[i][8] = True
    for i in range(size - 8, size):
        if not is_reserved[8][i]:
            is_reserved[8][i] = True
    for i in range(size - 7, size):
        if not is_reserved[i][8]:
            is_reserved[i][8] = True

    # 6. Colocar bits de datos con la máscara
    bit_idx = 0
    # Recorrido en columnas de 2 en 2 de derecha a izquierda
    col = size - 1
    up = True
    while col > 0:
        if col == 6:
            col -= 1  # Saltar columna de timing
        row_range = range(size - 1, -1, -1) if up else range(size)
        for row in row_range:
            for c in (col, col - 1):
                if not is_reserved[row][c]:
                    b = bits[bit_idx] if bit_idx < len(bits) else 0
                    bit_idx += 1
                    # Aplicar máscara (usamos máscara 0: (row + col) % 2 == 0)
                    mask_condition = ((row + c) % 2 == 0) if mask_pattern == 0 else False
                    m[row][c] = b ^ (1 if mask_condition else 0)
        up = not up
        col -= 2

    # 7. Formato para EC 'M' (00) y Máscara 0 (000) -> 00000
    # Con código BCH (15, 5) y XOR con 101010000010010 -> Formato = 101010000010010 = 0x5412
    format_bits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]
    
    # Escribir información de formato en la matriz
    # Horizontal izquierda
    for i in range(6):
        m[8][i] = format_bits[i]
    m[8][7] = format_bits[6]
    m[8][8] = format_bits[7]
    m[7][8] = format_bits[8]
    for i in range(9, 15):
        m[14 - i][8] = format_bits[i]
    
    # Horizontal derecha y vertical inferior
    for i in range(8):
        m[8][size - 1 - i] = format_bits[i]
    for i in range(8, 15):
        m[size - 15 + i][8] = format_bits[i]

    return m

def matrix_to_svg(matrix, brand_color="#384F3E", quiet_zone=4, scale=20):
    size = len(matrix)
    total_size = (size + quiet_zone * 2) * scale
    
    rects = []
    for r in range(size):
        for c in range(size):
            if matrix[r][c] == 1:
                x = (c + quiet_zone) * scale
                y = (r + quiet_zone) * scale
                rects.append(f'<rect x="{x}" y="{y}" width="{scale}" height="{scale}" fill="{brand_color}" />')
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 {total_size} {total_size}" width="{total_size}" height="{total_size}">
  <rect width="100%" height="100%" fill="#FFFFFF" />
  {"".join(rects)}
</svg>'''
    return svg

import struct
import zlib

def matrix_to_png(matrix, brand_rgb=(56, 79, 62), quiet_zone=4, scale=24):
    size = len(matrix)
    total_grid = size + quiet_zone * 2
    w = total_grid * scale
    h = total_grid * scale
    
    raw_data = bytearray()
    dark_pixel = bytes(brand_rgb)
    white_pixel = bytes((255, 255, 255))
    
    for r in range(total_grid):
        row_bytes = bytearray(b'\x00') # PNG Filter 0
        mr = r - quiet_zone
        for c in range(total_grid):
            mc = c - quiet_zone
            is_dark = (0 <= mr < size and 0 <= mc < size and matrix[mr][mc] == 1)
            pixel = dark_pixel if is_dark else white_pixel
            row_bytes.extend(pixel * scale)
        for _ in range(scale):
            raw_data.extend(row_bytes)
            
    def make_chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    png += make_chunk(b'IHDR', ihdr)
    png += make_chunk(b'IDAT', zlib.compress(bytes(raw_data), 9))
    png += make_chunk(b'IEND', b'')
    return png

# Lista de Puntos Oficiales de El Pajarillo
POINTS = [
    {
        "id": "portal_general",
        "num": "PORTAL",
        "title": "Portal General del Santuario",
        "url": "https://www.aytohuelma.es/cipajarillo/index.html"
    },
    {
        "id": "punto_01",
        "num": "01",
        "title": "La Cabeza de Lobo",
        "url": "https://www.aytohuelma.es/cipajarillo/punto.html?id=1"
    },
    {
        "id": "punto_02",
        "num": "02",
        "title": "El Monumento Heroico Escalonado",
        "url": "https://www.aytohuelma.es/cipajarillo/punto.html?id=2"
    },
    {
        "id": "punto_03",
        "num": "03",
        "title": "El Territorio de Iltiraka",
        "url": "https://www.aytohuelma.es/cipajarillo/punto.html?id=3"
    },
    {
        "id": "punto_04",
        "num": "04",
        "title": "Un Paisaje Sagrado",
        "url": "https://www.aytohuelma.es/cipajarillo/punto.html?id=4"
    },
    {
        "id": "punto_05",
        "num": "05",
        "title": "El Guerrero de la Falcata y los Leones",
        "url": "https://www.aytohuelma.es/cipajarillo/punto.html?id=5"
    }
]

out_dir = "QRS_DEFINITIVOS_IMPRENTA"
os.makedirs(out_dir, exist_ok=True)

manifest_lines = [
    "RELACIÓN OFICIAL DE CÓDIGOS QR Y ENLACES DEFINITIVOS PARA PRODUCCIÓN",
    "Centro de Interpretación Santuario Ibérico de “El Pajarillo” · Ayuntamiento de Huelma",
    "===================================================================================",
    ""
]

for p in POINTS:
    bits = encode_data_v4_m(p['url'])
    mat = create_matrix_v4(bits, mask_pattern=0)
    
    # 1. Archivo Vectorial SVG (ideal para ilustrator/indesign, resolución infinita)
    svg_content = matrix_to_svg(mat, brand_color="#384F3E", quiet_zone=4, scale=24)
    base_name = f"QR_PUNTO_{p['num']}_{p['title'].lower().replace(' ', '_').replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u')}"
    svg_file = f"{base_name}.svg"
    with open(os.path.join(out_dir, svg_file), "w", encoding="utf-8") as f:
        f.write(svg_content)

    # 2. Archivo Imagen PNG en Ultra Alta Resolución (984x984 px, 300 DPI)
    png_content = matrix_to_png(mat, brand_rgb=(56, 79, 62), quiet_zone=4, scale=24)
    png_file = f"{base_name}.png"
    with open(os.path.join(out_dir, png_file), "wb") as f:
        f.write(png_content)
    
    manifest_lines.append(f"PUNTO {p['num']}: {p['title']}")
    manifest_lines.append(f"  URL Permanente: {p['url']}")
    manifest_lines.append(f"  Archivo Vectorial (SVG): {svg_file}")
    manifest_lines.append(f"  Archivo Imagen HD (PNG): {png_file}")
    manifest_lines.append("")
    print(f"Generado con éxito: {svg_file} y {png_file}")

with open(os.path.join(out_dir, "LEEME_URLS_IMPRENTA.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(manifest_lines))

print(f"\n¡Todos los Códigos QR vectoriales generados en la carpeta: {out_dir}/!")
