#!/usr/bin/env python3
"""
Parser do Catálogo IRON 2025 (CorelDRAW PDF → JSON estruturado + CSV)
Extrai: código, tipo, descrição/nome, compatibilidade, categoria mapeada, páginas
"""

import re, json, sys

CATEGORY_MAP = {
    # Seções principais do catálogo → Categorias do sistema
    'CABO ACEL.': 'Cabos de Acelerador',
    'CABO EMB.': 'Cabos de Embreagem',
    'CABO EMB': 'Cabos de Embreagem',
    'CABO FR': 'Cabos de Freio',
    'CABO VEL': 'Cabos de Velocímetro/Tacômetro',
    'CABO VEL.': 'Cabos de Velocímetro/Tacômetro',
    'CABO TRAVA': 'Cabos de Trava',
    'CABO ACEL': 'Cabos de Acelerador',
    'CABO': 'Cabos',
    'PARAFUSO': 'Parafusos e Porcas',
    'PRISIONEIRA': 'Parafusos e Porcas',
    'PORCA': 'Parafusos e Porcas',
    'KIT PRO': 'Kit Suspensão',
    'ROLAMENTO': 'Rolamentos',
    'AMORTECEDOR': 'Suspensão',
    'BENGALA': 'Suspensão',
    'CILINDRO': 'Suspensão',
    'GARFO': 'Suspensão',
    'TERMINAL': 'Suspensão',
    'CRUZETA': 'Suspensão',
    'JUNTA HOM': 'Suspensão',
    'JUNTA': 'Juntas e Guarnições',
    'GUARNIÇÃO': 'Juntas e Guarnições',
    'SUSPENSÃO': 'Suspensão',
    'FREIO': 'Freios',
    'DISCO': 'Freios',
    'PASTILHA': 'Freios',
    'BURRINHO': 'Freios',
    'ESPELHO FR': 'Freios',
    'VARETA FR': 'Freios',
    'RODA': 'Rodas e Pneus',
    'ARO': 'Rodas e Pneus',
    'PNEU': 'Rodas e Pneus',
    'CÂMARA': 'Rodas e Pneus',
    'CUBO': 'Rodas e Pneus',
    'RAIO': 'Raios',
    'CAIXA DIR': 'Caixa de Direção',
    'EIXO': 'Eixos',
    'BALANÇA': 'Chassi',
    'CAVALETE': 'Chassi',
    'MESA': 'Chassi/Guidão',
    'GUIDÃO': 'Chassi/Guidão',
    'SUPORTE': 'Chassi/Suportes',
    'CHASSI': 'Chassi',
    'KIT TRANS': 'Transmissão',
    'PINHÃO': 'Transmissão',
    'CORRENTE': 'Transmissão',
    'EMENDA': 'Transmissão',
    'ESTICADOR': 'Transmissão',
    'ACIONADOR': 'Transmissão',
    'JUNÇÃO': 'Ignição/Velas',
    'BICO': 'Ignição/Velas',
    'VELA': 'Ignição/Velas',
    'CARBURADOR': 'Carburador',
    'REPARO': 'Carburador/Reparos',
    'COLETOR': 'Admissão',
    'CONDUTOR': 'Admissão',
    'TUBO ADM': 'Admissão',
    'PARTIDA': 'Partida',
    'MOTOR PART': 'Partida',
    'EMBREAGEM': 'Embreagem',
    'CARCAÇA': 'Carenagem/Motor',
    'PLACA': 'Embreagem/Partida',
    'MAGNETO': 'Elétrica/Partida',
    'MARCHA': 'Marcha/Câmbio',
    'TRAMBULADOR': 'Marcha/Câmbio',
    'ÁRVORE': 'Motor/Válvulas',
    'VÁLVULA': 'Motor/Válvulas',
    'BALANCINHO': 'Motor/Válvulas',
    'RESSALTO': 'Motor/Válvulas',
    'PRATO': 'Motor/Válvulas',
    'CHAVETA': 'Motor/Fixação',
    'MOLA': 'Motor/Suspensão',
    'TENSOR': 'Motor',
    'ROLETE': 'Motor',
    'COROA': 'Transmissão/Motor',
    'CILINDRO MOTOR': 'Motor/Cilindro',
    'PISTÃO': 'Motor/Pistão',
    'BIELA': 'Motor',
    'VIRABREQUIM': 'Motor',
    'BOIA': 'Combustível',
    'BOMBA': 'Combustível/Bomba',
    'ROTOR': 'Combustível/Bomba',
    'TORNEIRA': 'Combustível',
    'CORREIA': 'Correias',
    'ESCOVA': 'Elétrica',
    'SENSOR': 'Elétrica/Sensores',
    'CEBOLINHA': 'Elétrica/Sensores',
    'RETENTOR': 'Retentores',
    'ANEL': 'Anéis/Motor',
    'CARENAGEM': 'Carenagem',
    'PARALAMA': 'Carenagem',
    'RABETA': 'Carenagem',
    'BOLHA': 'Carenagem',
    'FILTRO': 'Filtros',
    'TELA': 'Filtros',
    'PAINEL': 'Elétrica/Painel',
    'VELOCIMETRO': 'Elétrica/Painel',
    'MANETE': 'Manetes/Manicotos',
    'MANICOTO': 'Manetes/Manicotos',
    'PEDAL': 'Pedais',
    'PEDALEIRA': 'Pedais',
    'PUNHO': 'Guidão/Comandos',
    'ROLDANA': 'Guidão/Comandos',
    'PESO': 'Guidão/Comandos',
    'BLOCO ÓPT': 'Iluminação',
    'FAROL': 'Iluminação',
    'SINALEIRA': 'Iluminação',
    'LÂMPADA': 'Iluminação',
    'LANTERNA': 'Iluminação',
    'LENTE': 'Iluminação',
    'REFLETOR': 'Iluminação',
    'BORRACHA': 'Borrachas/Buchas',
    'BUCHA': 'Borrachas/Buchas',
    'COXIM': 'Borrachas/Buchas',
    'SANFONA': 'Borrachas/Buchas',
    'BANCO': 'Banco/Proteção',
    'APARA BARRO': 'Banco/Proteção',
    'IGNIÇÃO': 'Ignição',
    'TRAVA': 'Ignição/Travas',
    'ESTATOR': 'Elétrica/Estator',
    'BOBINA': 'Elétrica/Bobina',
    'CACHIMBO': 'Elétrica/Velas',
    'FIAÇÃO': 'Elétrica/Fiação',
    'CDI': 'Elétrica/CDI',
    'CENTRAL': 'Elétrica/Central',
    'RETIFIC': 'Elétrica/Retificador',
    'RELÉ': 'Elétrica',
    'CHAVE LUZ': 'Elétrica/Chaves',
    'CHAVE PART': 'Elétrica/Chaves',
    'INTERRUPTOR': 'Elétrica/Interruptores',
    'BUZINA': 'Elétrica',
    'REGULADOR': 'Elétrica',
    'FUSÍVEL': 'Elétrica',
    'GUARDA PÓ': 'Retentores/Proteção',
}

def map_category(descricao):
    """Map a product description to the best category."""
    if not descricao:
        return 'Geral'

    desc_upper = descricao.upper().strip()

    # Check first word/token
    first_token = desc_upper.split()[0] if desc_upper.split() else ''

    for key, category in CATEGORY_MAP.items():
        if desc_upper.startswith(key):
            return category

    # Fallback: check if any keyword appears
    for key, category in sorted(CATEGORY_MAP.items(), key=lambda x: -len(x[0])):
        if key in desc_upper:
            return category

    return 'Geral'

def main():
    with open(sys.argv[1] if len(sys.argv) > 1 else 'catalogo-completo.txt', 'r') as f:
        raw = f.read()

    raw = raw.replace('\x0c', '\n')
    lines_all = [l.strip() for l in raw.split('\n')]

    def is_code(s):
        return bool(re.match(r'^\d{4,7}$', s)) and 1000 <= int(s) <= 9999999

    # Find start (first product code "194625")
    start = 0
    for i, l in enumerate(lines_all):
        if l == '194625':
            start = i
            break

    # Parse codes and descriptions as paired blocks
    products = []
    i = start
    code_buf = []
    desc_buf = []
    mode = 'codes'
    current_desc_lines = []

    while i < len(lines_all):
        line = lines_all[i]

        if mode == 'codes':
            if is_code(line):
                code_buf.append(line)
            elif line != '':
                # Non-code, non-blank → switch to description mode
                if code_buf:
                    mode = 'descs'
                    current_desc_lines = [line]
                    if len(line) < 3 and len(code_buf) > 0:
                        # Likely a stray character, skip
                        current_desc_lines = []
            i += 1
        else:  # descs mode
            if is_code(line):
                # End of description block
                if current_desc_lines:
                    desc_buf.append(' '.join(current_desc_lines).strip())
                    current_desc_lines = []

                # Match descriptions with codes
                if desc_buf and code_buf:
                    matched = min(len(code_buf), len(desc_buf))
                    for j in range(matched):
                        # Extract product name (first part of description)
                        desc = desc_buf[j]
                        nome = desc.split(',')[0].strip() if ',' in desc else desc[:60].strip()
                        nome = nome[:80]  # limit length

                        # Extract compatibility (everything after first period or the model lines)
                        compat = desc

                        products.append({
                            'codigo': code_buf[j],
                            'nome': nome,
                            'descricao': desc,
                            'compatibilidade': compat,
                            'marca': 'IRON',
                            'categoriaSistema': map_category(desc),
                            'fornecedor': 'MOTOCICLO',
                        })

                    code_buf = code_buf[matched:]
                    desc_buf = desc_buf[matched:]

                # Start new code block
                code_buf = [line]
                mode = 'codes'
                i += 1
            elif line == '':
                # End of current description
                if current_desc_lines:
                    desc_buf.append(' '.join(current_desc_lines).strip())
                    current_desc_lines = []
                i += 1
            else:
                current_desc_lines.append(line)
                i += 1

    # Flush remaining
    if current_desc_lines:
        desc_buf.append(' '.join(current_desc_lines).strip())
    if desc_buf and code_buf:
        matched = min(len(code_buf), len(desc_buf))
        for j in range(matched):
            desc = desc_buf[j]
            nome = desc.split(',')[0].strip() if ',' in desc else desc[:60].strip()
            nome = nome[:80]
            products.append({
                'codigo': code_buf[j],
                'nome': nome,
                'descricao': desc,
                'compatibilidade': desc,
                'marca': 'IRON',
                'categoriaSistema': map_category(desc),
                'fornecedor': 'MOTOCICLO',
            })

    # Deduplicate by code
    seen = {}
    unique = []
    for p in products:
        if p['codigo'] not in seen:
            seen[p['codigo']] = True
            unique.append(p)

    print(f"Total products: {len(unique)} (deduped from {len(products)})")

    # Category distribution
    cats = {}
    for p in unique:
        c = p['categoriaSistema']
        cats[c] = cats.get(c, 0) + 1

    print("\nCategory distribution:")
    for c, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {c}: {count}")

    # Sample by category
    print("\n=== Samples ===")
    shown = set()
    for p in unique:
        if p['categoriaSistema'] not in shown:
            shown.add(p['categoriaSistema'])
            print(f"  [{p['categoriaSistema']}] {p['codigo']} — {p['nome'][:60]}")

    # Save JSON
    out_json = sys.argv[2] if len(sys.argv) > 2 else 'catalogo-iron-final.json'
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(unique)} products to {out_json}")

    # Save CSV
    out_csv = out_json.replace('.json', '.csv')
    with open(out_csv, 'w', encoding='utf-8') as f:
        f.write('codigo,nome,descricao,compatibilidade,marca,categoriaSistema,fornecedor\n')
        for p in unique:
            nome = p['nome'].replace('"', '""')
            desc = p['descricao'].replace('"', '""')
            compat = p['compatibilidade'].replace('"', '""')
            cat = p['categoriaSistema'].replace('"', '""')
            f.write(f'{p["codigo"]},"{nome}","{desc}","{compat}",{p["marca"]},"{cat}",{p["fornecedor"]}\n')

    print(f"Saved CSV to {out_csv}")

if __name__ == '__main__':
    main()
