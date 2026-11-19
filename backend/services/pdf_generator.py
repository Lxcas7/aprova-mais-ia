import json
import textwrap
from datetime import datetime
from typing import Dict, Any, List


def _parse_disciplinas(concurso: dict) -> List[Dict[str, Any]]:
    raw = concurso.get("disciplinas")
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(concurso.get("disciplinas_json", "[]"))
    except Exception:
        return []


def gerar_preview_material(concurso: dict, material: dict) -> dict:
    """Retorna estrutura padronizada para pré-visualização inline do roteiro antes do download em PDF."""
    disciplinas = _parse_disciplinas(concurso)
    banca = concurso.get("banca", "Oficial")
    ultimo_ano = concurso.get("ultimo_concurso_ano") or "Último Edital"
    return {
        "id": material["id"],
        "titulo": material["titulo"],
        "categoria": material["categoria"],
        "disciplina": material.get("disciplina") or "Geral",
        "formato": "Roteiro Verticalizado (PDF)",
        "concurso_id": concurso["id"],
        "concurso_sigla": concurso["sigla"],
        "concurso_titulo": concurso["titulo"],
        "orgao": concurso["orgao"],
        "banca": banca,
        "salario": concurso["salario"],
        "vagas": concurso["vagas"],
        "status_label": concurso["status_label"],
        "prazo": concurso.get("prazo", ""),
        "data_prova": concurso.get("data_prova", ""),
        "nota_corte_anterior": concurso.get("nota_corte_anterior") or "Consulte edital",
        "ultimo_concurso_ano": ultimo_ano,
        "fontes_internet": concurso.get("fontes_internet") or "Diário Oficial e Banca",
        "resumo_conteudo": material.get("resumo_conteudo") or "",
        "resumo_ia": concurso.get("resumo_ia") or "",
        "disciplinas": disciplinas,
        "passos_estudo": [
            "Dedique 70% do tempo às disciplinas marcadas com Prioridade Crítica e Alta.",
            f"Resolva no mínimo 50 questões recentes da banca {banca} por semana.",
            f"Refaça a prova anterior ({ultimo_ano}) simulando o tempo oficial.",
        ],
    }


def gerar_conteudo_material_download(concurso: dict, material: dict) -> str:
    disciplinas = _parse_disciplinas(concurso)
    linhas_disc = "\n".join([
        f"  [ ] {idx+1}. {d['nome']} — {d['questoes']} questões ({d['peso']}) | Prioridade: {d['prioridade']}"
        for idx, d in enumerate(disciplinas)
    ])

    data_hoje = datetime.now().strftime("%d/%m/%Y %H:%M")
    return f"""================================================================================
APROVA+ IA — CENTRAL INTELIGENTE DE CONCURSOS PÚBLICOS (ROTEIRO DE ESTUDO)
================================================================================
MATERIAL: {material['titulo']}
CATEGORIA: {material['categoria']} | DISCIPLINA: {material['disciplina']} | FORMATO: PDF
GERADO EM: {data_hoje}
--------------------------------------------------------------------------------
1. DADOS DO CONCURSO VINCULADO
--------------------------------------------------------------------------------
• Concurso: {concurso['titulo']} ({concurso['sigla']})
• Órgão: {concurso['orgao']}
• Status Atual: {concurso['status_label']}
• Banca Organizadora: {concurso['banca']}
• Vagas: {concurso['vagas']}
• Remuneração: {concurso['salario']}
• Escolaridade Exigida: {concurso['escolaridade']}
• Cronograma / Situação: {concurso['prazo']} ({concurso['data_prova']})
• Histórico de Corte Anterior ({concurso['ultimo_concurso_ano']}): {concurso['nota_corte_anterior']}

--------------------------------------------------------------------------------
2. RAIO-X E DIRECIONAMENTO DA INTELIGÊNCIA ARTIFICIAL (APROVA+ IA)
--------------------------------------------------------------------------------
{concurso['resumo_ia']}

Fontes Monitoradas pela IA: {concurso['fontes_internet']}

--------------------------------------------------------------------------------
3. RESUMO EXECUTIVO DESTE MATERIAL
--------------------------------------------------------------------------------
{material['resumo_conteudo']}

--------------------------------------------------------------------------------
4. EDITAL VERTICALIZADO & CHECKLIST DE ESTUDO POR PESO DA BANCA ({concurso['banca']})
--------------------------------------------------------------------------------
Marque com [X] conforme concluir a Teoria, Revisão e Bateria de Questões:

{linhas_disc}

--------------------------------------------------------------------------------
5. ESTRATÉGIA DE APROVAÇÃO RECOMENDADA PELA IA
--------------------------------------------------------------------------------
1) Dedique 70% do seu tempo às disciplinas marcadas com Prioridade CRÍTICA e ALTA.
2) Resolva no mínimo 50 questões anteriores da banca {concurso['banca']} por semana.
3) Refaça a última prova realizada ({concurso['ultimo_concurso_ano']}) simulando o tempo real.

================================================================================
Aprova+ IA — Plataforma Centralizada de Busca de Concursos e Materiais
================================================================================
"""


def _pdf_escape_winansi(text: str) -> str:
    """Normaliza e escapa string para literal PDF em WinAnsiEncoding (cp1252)."""
    normalized = (
        (text or "")
        .replace("→", "->")
        .replace("←", "<-")
        .replace("✓", "[X]")
        .replace("✔", "[X]")
        .replace("☐", "[ ]")
        .replace("\u00a0", " ")
        .replace("\r", " ")
        .replace("\n", " ")
    )
    raw = normalized.encode("cp1252", errors="replace")
    out: List[str] = []
    for byte in raw:
        if byte == 0x5C:
            out.append("\\\\")
        elif byte == 0x28:
            out.append("\\(")
        elif byte == 0x29:
            out.append("\\)")
        elif 32 <= byte <= 126:
            out.append(chr(byte))
        elif byte >= 128:
            out.append(f"\\{byte:03o}")
        else:
            out.append(" ")
    return "".join(out)


def gerar_pdf_material_download(concurso: dict, material: dict) -> bytes:
    """Gera arquivo PDF 1.4 multi-página real (sem dependências externas) para o roteiro de estudo."""
    disciplinas = _parse_disciplinas(concurso)
    data_hoje = datetime.now().strftime("%d/%m/%Y %H:%M")

    # Cada item: (kind, text)
    # kinds: 'title', 'subtitle', 'section', 'body', 'bullet', 'rule', 'spacer'
    blocks: List[tuple[str, str]] = [
        ("title", material["titulo"]),
        ("subtitle", f"{material['categoria']}  ·  Disciplina: {material.get('disciplina') or 'Geral'}  ·  Formato: Roteiro Verticalizado (PDF)"),
        ("spacer", ""),
        ("section", "1. DADOS DO CONCURSO VINCULADO"),
        ("bullet", f"Concurso: {concurso['titulo']} ({concurso['sigla']})"),
        ("bullet", f"Órgão: {concurso['orgao']}"),
        ("bullet", f"Status: {concurso['status_label']}  |  Banca: {concurso['banca']}"),
        ("bullet", f"Vagas: {concurso['vagas']}  |  Escolaridade: {concurso['escolaridade']}"),
        ("bullet", f"Remuneração: {concurso['salario']}"),
        ("bullet", f"Inscrições / Situação: {concurso['prazo']}  |  Prova / Previsão: {concurso['data_prova']}"),
        ("bullet", f"Corte anterior ({concurso['ultimo_concurso_ano']}): {concurso['nota_corte_anterior']}"),
        ("spacer", ""),
        ("section", "2. RAIO-X E ESTRATÉGIA APROVA+ IA"),
        ("body", concurso.get("resumo_ia") or ""),
        ("bullet", f"Fontes monitoradas: {concurso.get('fontes_internet') or 'Diário Oficial e Banca'}"),
        ("spacer", ""),
        ("section", "3. ESCOPO DESTE ROTEIRO"),
        ("body", material.get("resumo_conteudo") or ""),
        ("spacer", ""),
        ("section", f"4. EDITAL VERTICALIZADO E CHECKLIST POR PESO ({concurso['banca']})"),
        ("body", "Marque com [X] conforme concluir Teoria, Revisão e Bateria de Questões:"),
    ]

    for idx, d in enumerate(disciplinas):
        blocks.append((
            "bullet",
            f"[ ] {idx + 1}. {d['nome']} — {d['questoes']} questões ({d['peso']}) | Prioridade: {d['prioridade']}",
        ))

    blocks.extend([
        ("spacer", ""),
        ("section", "5. ROTEIRO RECOMENDADO DE EXECUÇÃO"),
        ("bullet", "1) Dedique 70% do seu tempo às disciplinas de Prioridade Crítica e Alta."),
        ("bullet", f"2) Resolva no mínimo 50 questões anteriores da banca {concurso['banca']} por semana."),
        ("bullet", f"3) Refaça a prova anterior ({concurso['ultimo_concurso_ano']}) simulando o tempo real."),
    ])

    # Expand blocks into wrapped drawing lines
    lines: List[tuple[str, str, int]] = []  # (style, text, line_height)
    for kind, text in blocks:
        if kind == "spacer":
            lines.append(("spacer", "", 8))
        elif kind == "title":
            for w in textwrap.wrap(text, width=64) or [text]:
                lines.append(("title", w, 18))
        elif kind == "subtitle":
            for w in textwrap.wrap(text, width=84) or [text]:
                lines.append(("subtitle", w, 14))
        elif kind == "section":
            lines.append(("section", text, 18))
        elif kind == "body":
            for w in textwrap.wrap(text, width=86) or [""]:
                lines.append(("body", w, 14))
        elif kind == "bullet":
            wrapped = textwrap.wrap(text, width=82, subsequent_indent="   ") or [text]
            for idx, w in enumerate(wrapped):
                prefix = "• " if idx == 0 and not w.startswith("[ ]") and not w.startswith("1)") and not w.startswith("2)") and not w.startswith("3)") else "  "
                lines.append(("bullet", f"{prefix}{w}", 14))

    pages_cmds: List[List[str]] = []
    bottom_limit = 64

    def start_page(page_index: int) -> tuple[List[str], int]:
        cmds: List[str] = []
        if page_index == 0:
            # Civic navy header band
            cmds.append("0.063 0.137 0.220 rg")
            cmds.append("0 762 595 80 re f")
            cmds.append("BT /F2 16 Tf 1 1 1 rg 44 804 Td (" + _pdf_escape_winansi("APROVA+ IA") + ") Tj ET")
            cmds.append("BT /F1 10 Tf 0.84 0.89 0.94 rg 44 784 Td (" + _pdf_escape_winansi("Roteiro de Estudo Verticalizado e Checklist Oficial (PDF)") + ") Tj ET")
            return cmds, 738
        else:
            cmds.append("0.847 0.835 0.796 RG 0.8 w 44 806 m 551 806 l S")
            cmds.append("BT /F2 9 Tf 0.067 0.110 0.141 rg 44 814 Td (" + _pdf_escape_winansi(f"APROVA+ IA · {concurso['sigla']} · Roteiro de Estudo") + ") Tj ET")
            return cmds, 784

    cur_cmds, y = start_page(0)
    for style, text, lh in lines:
        if y - lh < bottom_limit:
            pages_cmds.append(cur_cmds)
            cur_cmds, y = start_page(len(pages_cmds))
        if style == "spacer":
            y -= lh
            continue
        if style == "title":
            cur_cmds.append(f"BT /F2 13 Tf 0.067 0.110 0.141 rg 44 {y} Td ({_pdf_escape_winansi(text)}) Tj ET")
        elif style == "subtitle":
            cur_cmds.append(f"BT /F1 9.5 Tf 0.290 0.365 0.439 rg 44 {y} Td ({_pdf_escape_winansi(text)}) Tj ET")
        elif style == "section":
            cur_cmds.append(f"0.043 0.310 0.424 RG 0.8 w 44 {y - 3} m 551 {y - 3} l S")
            cur_cmds.append(f"BT /F2 10.5 Tf 0.043 0.310 0.424 rg 44 {y + 2} Td ({_pdf_escape_winansi(text)}) Tj ET")
            y -= 4
        elif style in ("body", "bullet"):
            cur_cmds.append(f"BT /F1 10 Tf 0.176 0.243 0.306 rg 44 {y} Td ({_pdf_escape_winansi(text)}) Tj ET")
        y -= lh

    pages_cmds.append(cur_cmds)

    total_pages = len(pages_cmds)
    for idx, cmds in enumerate(pages_cmds):
        cmds.append("0.847 0.835 0.796 RG 0.6 w 44 46 m 551 46 l S")
        footer = f"Aprova+ IA · Gerado em {data_hoje}   |   Página {idx + 1} de {total_pages}"
        cmds.append(f"BT /F1 8.5 Tf 0.290 0.365 0.439 rg 44 32 Td ({_pdf_escape_winansi(footer)}) Tj ET")

    # Assemble PDF objects
    # 1: Catalog, 2: Pages, 3: Font Helvetica, 4: Font Helvetica-Bold
    objects: List[bytes] = []
    page_obj_ids = [5 + i * 2 for i in range(total_pages)]
    kids_str = " ".join(f"{pid} 0 R" for pid in page_obj_ids)

    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(f"<< /Type /Pages /Kids [{kids_str}] /Count {total_pages} >>".encode("ascii"))
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")

    for i, cmds in enumerate(pages_cmds):
        content_id = 6 + i * 2
        stream_bytes = ("\n".join(cmds) + "\n").encode("ascii")
        page_dict = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            f"/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> "
            f"/Contents {content_id} 0 R >>"
        ).encode("ascii")
        content_dict = (
            f"<< /Length {len(stream_bytes)} >>\nstream\n".encode("ascii")
            + stream_bytes
            + b"endstream"
        )
        objects.append(page_dict)
        objects.append(content_dict)

    buf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets: List[int] = [0]
    for obj_id, body in enumerate(objects, start=1):
        offsets.append(len(buf))
        buf.extend(f"{obj_id} 0 obj\n".encode("ascii"))
        buf.extend(body)
        buf.extend(b"\nendobj\n")

    xref_pos = len(buf)
    buf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    buf.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        buf.extend(f"{off:010d} 00000 n \n".encode("ascii"))

    buf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
    )
    return bytes(buf)


