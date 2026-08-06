import os, sys
import platform
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import mm, cm, inch
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                  TableStyle, KeepTogether, PageBreak, HRFlowable)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import pypdf

# --- Font Setup ---
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf'))
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold',
                   italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')

# --- Palette ---
PAGE_BG       = colors.HexColor('#f7f7f6')
SECTION_BG    = colors.HexColor('#f1f0ef')
CARD_BG       = colors.HexColor('#e8e7e4')
TABLE_STRIPE  = colors.HexColor('#f0f0ee')
HEADER_FILL   = colors.HexColor('#67614c')
COVER_BLOCK   = colors.HexColor('#706a56')
BORDER        = colors.HexColor('#c7c3b7')
ICON          = colors.HexColor('#776a42')
ACCENT        = colors.HexColor('#8c7226')
ACCENT_2      = colors.HexColor('#6f4ed1')
TEXT_PRIMARY   = colors.HexColor('#262523')
TEXT_MUTED     = colors.HexColor('#7a7871')
SEM_SUCCESS   = colors.HexColor('#467857')
SEM_WARNING   = colors.HexColor('#95773a')
SEM_ERROR     = colors.HexColor('#8a4f49')
SEM_INFO      = colors.HexColor('#547da6')

# --- Styles ---
s_h1 = ParagraphStyle('H1', fontName='FreeSerif-Bold', fontSize=17, leading=23,
                       textColor=HEADER_FILL, spaceAfter=10, spaceBefore=16)
s_h2 = ParagraphStyle('H2', fontName='FreeSerif-Bold', fontSize=13, leading=18,
                       textColor=TEXT_PRIMARY, spaceAfter=8, spaceBefore=12)
s_h3 = ParagraphStyle('H3', fontName='FreeSerif-Bold', fontSize=11, leading=15,
                       textColor=ICON, spaceAfter=5, spaceBefore=9)
s_body = ParagraphStyle('Body', fontName='FreeSerif', fontSize=10.5, leading=17,
                         textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=5)
s_body_left = ParagraphStyle('BodyL', fontName='FreeSerif', fontSize=10.5, leading=17,
                              textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=5)
s_caption = ParagraphStyle('Caption', fontName='FreeSerif-Italic', fontSize=9, leading=13,
                            textColor=TEXT_MUTED, spaceAfter=5, spaceBefore=3)
s_callout = ParagraphStyle('Callout', fontName='FreeSerif-Italic', fontSize=11, leading=17,
                            textColor=ACCENT, leftIndent=18, rightIndent=18, spaceBefore=8, spaceAfter=8)
s_bullet = ParagraphStyle('Bullet', fontName='FreeSerif', fontSize=10.5, leading=17,
                           textColor=TEXT_PRIMARY, leftIndent=18, bulletIndent=6, spaceAfter=4)
s_small = ParagraphStyle('Small', fontName='FreeSerif', fontSize=9, leading=13,
                           textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=3)

# Table cell styles
ts_header = ParagraphStyle('TH', fontName='FreeSerif-Bold', fontSize=9, leading=13,
                            textColor=colors.white, alignment=TA_LEFT)
ts_cell = ParagraphStyle('TC', fontName='FreeSerif', fontSize=9, leading=13,
                          textColor=TEXT_PRIMARY, alignment=TA_LEFT)
ts_cell_c = ParagraphStyle('TCC', fontName='FreeSerif', fontSize=9, leading=13,
                          textColor=TEXT_PRIMARY, alignment=TA_CENTER)

# --- Helpers ---
MAX_KEEP = A4[1] * 0.4

def safe_keep(elements):
    total = sum(e.wrap(A4[0] - 2*inch, A4[1])[1] for e in elements)
    if total <= MAX_KEEP:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)

def make_table(headers, rows, col_widths=None):
    aw = A4[0] - 2*inch
    if col_widths is None:
        col_widths = [aw / len(headers)] * len(headers)
    data = [[Paragraph(h, ts_header) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), ts_cell) for c in r])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'FreeSerif-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
    t.setStyle(TableStyle(style_cmds))
    return t

def hr():
    return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=10, spaceBefore=10)

def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawRightString(A4[0] - 50, A4[1] - 35, 'Mesa Pronta Gastronomia')
    canvas.drawString(50, 30, 'Proposta Comercial - Mariana Nascimento')
    canvas.drawCentredString(A4[0]/2, 30, f'{doc.page}')
    canvas.restoreState()

# --- Build Story ---
story = []
aw = A4[0] - 2*inch

# SECTION 1 - Apresentacao
story.append(Paragraph('1. Apresentacao', s_h1))
story.append(Paragraph(
    'Prezada Mariana, e um prazer apresenta-la a Mesa Pronta Gastronomia. Somos especialistas em implantar um <b>sistema alimentar completo</b> na sua casa: nao entregamos comida, mas sim organizacao, planejamento e culinaria profissional adaptada a realidade da sua familia. Com mais de 20 anos de experiencia em gastronomia residencial, nosso servico foi pensado para familias que valorizam alimentacao de qualidade mas nao tem tempo para planejar, cozinhar e organizar refeicoes todos os dias.', s_body))
story.append(Paragraph(
    'Apos analisar suas respostas no Diagnostico Culinario Familiar, preparamos esta proposta personalizada com base no seu perfil, suas preferencias e a rotina da sua residencia no Brooklin. Cada detalhe foi considerado para que o servico se ajuste perfeitamente as suas necessidades, desde o dimensionamento das porcoes ate a estrategia de congelamento que otimiza o espaco do seu freezer.', s_body))

story.append(Spacer(1, 12))

# SECTION 2 - Resumo do Diagnostico
story.append(Paragraph('2. Resumo do Diagnostico', s_h1))
story.append(Paragraph(
    'A analise do seu diagnostico revelou um perfil claro: uma familia de 3 moradores com baba que almoca na casa de segunda a sexta, totalizando <b>4 pessoas em dias uteis e 3 nos finais de semana</b>. Isso equivale a aproximadamente 26 refeicoes semanais (almoco e jantar), considerando que a baba tambem precisa se alimentar durante a semana de trabalho.', s_body))

story.append(Spacer(1, 6))
headers_diag = ['Item', 'Dados Coletados', 'Interpretacao']
rows_diag = [
    ['Familia', '3 moradores fixos + baba (seg-sex)', 'Demanda real: 4 pessoas em dias uteis'],
    ['Demanda semanal', 'Refeicoes para 7 dias', '~26 refeicoes/semana (almoco + jantar)'],
    ['Perfil alimentar', 'Saudavel, sem restricoes', 'Liberdade total no cardapio com foco nutricional'],
    ['Base obrigatoria', 'Arroz e feijao', 'Presentes em todas as refeicoes com variacoes nutritivas'],
    ['Freezer', 'Medio', 'Estrategia de congelamento inteligente necessaria'],
    ['Compras', 'Realizadas pela Mariana', 'Lista detalhada sera enviada com antecedencia'],
    ['Atendimento', 'Manha, prefere WhatsApp', 'Sessao matutina, proposta enviada por WhatsApp'],
]
td = make_table(headers_diag, rows_diag, [aw*0.20, aw*0.35, aw*0.45])
story.extend(safe_keep([Paragraph('Tabela 1: Sintese do Diagnostico Culinario', s_caption), Spacer(1, 4), td]))

story.append(Spacer(1, 12))

# SECTION 3 - Como Funciona o Servico
story.append(Paragraph('3. Como Funciona o Servico', s_h1))
story.append(Paragraph(
    'O servico da Mesa Pronta Gastronomia foi desenhado para ser simples e eficiente. Tudo comeca com o planejamento: recebemos suas preferencias, elaboramos um cardapio personalizado e enviamos a lista de compras completa para que voce adquira os ingredientes com antecedencia. No dia agendado, a chef vai ate a sua residencia, utiliza os ingredientes que voce ja disponibilizou e prepara todas as refeicoes da semana em uma unica sessao matutina, geralmente com duracao de 5 a 6 horas.', s_body))
story.append(Paragraph(
    'Cada refeicao e porcionada, etiquetada com nome, data e instrucoes de aquecimento, e organizada no seu freezer seguindo um mapa de posicionamento que otimiza o espaco e facilita o uso diario. Voce nao precisa pensar em nada durante a semana: basta retirar, aquecer e servir. A philosophy e clara: a Mesa Pronta implanta um sistema alimentar que funciona sozinho.', s_body))

story.append(Spacer(1, 6))
story.append(Paragraph('Etapas do Servico:', s_h3))
story.append(Paragraph('1. <b>Planejamento:</b> Cardapio semanal enviado para sua aprovacao', s_bullet))
story.append(Paragraph('2. <b>Lista de compras:</b> Enviada com antecedencia (por WhatsApp)', s_bullet))
story.append(Paragraph('3. <b>Dia de producao:</b> Atendimento matutino (1 dia por semana)', s_bullet))
story.append(Paragraph('4. <b>Producao:</b> 8 a 10 preparacoes, porcionamento individual e familiar, etiquetagem completa', s_bullet))
story.append(Paragraph('5. <b>Organizacao:</b> Freezer organizado com mapa visual de posicionamento', s_bullet))
story.append(Paragraph('6. <b>Instrucoes:</b> Guia de descongelamento e aquecimento para cada prato', s_bullet))

story.append(Spacer(1, 12))

# SECTION 4 - Cardapio Sugerido (Semana 1)
story.append(Paragraph('4. Cardapio Sugerido (Semana 1 - Exemplo)', s_h1))
story.append(Paragraph(
    'O cardapio abaixo e um exemplo da primeira semana, projetado para 4 pessoas em dias uteis e 3 nos finais de semana. Todas as opcoes foram selecionadas pensando em tres criterios fundamentais: serem saudaveis (conforme seu pedido), congelarem bem (otimizando o espaco do freezer medio) e terem arroz e feijao como base obrigatoria. As variacoes de arroz (integral, 7 graos) e feijao (carioca, preto) trazem nutrientes adicionais sem sair da sua zona de conforto.', s_body))

headers_card = ['Dia', 'Almoco', 'Jantar']
rows_card = [
    ['Segunda', 'Frango desfiado com cenoura e milho + arroz 7 graos + feijao carioca + legumes assados', 'Sopa de legumes com frango'],
    ['Terca', 'Carne moida refogada com legumes + arroz integral + feijao carioca', 'File de frango grelhado com mostarda e mel + pure de abobora'],
    ['Quarta', 'Macarrao integral ao sugo', 'Peixe no forno com legumes + arroz integral'],
    ['Quinta', 'Lombo assado com abacaxi + arroz branco + feijao preto', 'Ratatouille + arroz 7 graos'],
    ['Sexta', 'Strogonoff light + arroz integral', 'Canja de galinha'],
    ['Sabado', 'Penne ao pesto de manjericao', 'Frango ao molho de tomate com pimentoes + arroz'],
    ['Domingo', 'Carne suina desfiada com barbecue + pure de batata-doce', 'Sopa de legumes'],
]
tc = make_table(headers_card, rows_card, [aw*0.12, aw*0.44, aw*0.44])
story.extend(safe_keep([Paragraph('Tabela 2: Cardapio Sugerido - Semana 1', s_caption), Spacer(1, 4), tc]))

story.append(Spacer(1, 12))

# SECTION 5 - Planos e Precos
story.append(Paragraph('5. Planos e Precos', s_h1))
story.append(Paragraph(
    'Os planos foram elaborados com base em uma pesquisa extensa de mercado realizada em agosto de 2026, que analisou precos de mais de 12 fontes entre plataformas (myChef, Take a Chef, Get Ninjas, Famyle, Cronoshare), relatos de clientes em redes sociais e artigos especializados. Os valores refletem o posicionamento premium da Mesa Pronta Gastronomia e a proposta de valor de implantar um sistema alimentar completo, nao apenas cozinhar.', s_body))
story.append(Paragraph(
    'E importante ressaltar que <b>os ingredientes nao estao incluidos nos valores abaixo</b>. Como voce mesma realiza as compras, o custo total do servico se concentra no trabalho especializado de planejamento, preparo, porcionamento e organizacao. Isso torna o investimento significativamente mais acessivel em comparacao com servicos que incluem os ingredientes na cobranca.', s_body))

story.append(Spacer(1, 6))
headers_pr = ['Plano', 'Descricao', 'Valor']
rows_pr = [
    ['Sessao Avulsa', '1 dia de producao, ~26 refeicoes, cardapio personalizado, organizacao do freezer, lista de compras e instrucoes de aquecimento', 'R$ 600'],
    ['Plano Semanal', '4 sessoes/mes (1x por semana), ~104 refeicoes/mes, todos os beneficios da sessao avulsa com desconto por frequencia', 'R$ 2.000/mes'],
    ['Plano Mensal', '4 sessoes/mes + cardapio rotativo de 4 semanas + reavaliacao mensal + ajustes conforme feedback', 'R$ 2.200/mes'],
]
tp = make_table(headers_pr, rows_pr, [aw*0.18, aw*0.62, aw*0.20])
story.extend(safe_keep([Paragraph('Tabela 3: Planos e Precos', s_caption), Spacer(1, 4), tp]))

story.append(Spacer(1, 6))
story.append(Paragraph(
    '<b>Investimento por refeicao:</b> No Plano Mensal, o custo por refeicao sai aproximadamente R$ 21, valor inferior a um almoco executivo no Brooklin (R$ 45-80) e competitivo com delivery de qualidade (R$ 35-60), com a vantagem de comida 100% personalizada, fresca e organizada para a semana inteira.', s_body))

story.append(Spacer(1, 12))

# SECTION 6 - Proximos Passos
story.append(Paragraph('6. Proximos Passos', s_h1))
story.append(Paragraph(
    'Para iniciarmos o servico, precisamos confirmar alguns pontos logisticos que sao essenciais para o planejamento da primeira sessao de producao. Esses itens garantem que tudo corra sem imprevistos e que o resultado atenda totalmente as suas expectativas. A confirmacao pode ser feita facilmente por WhatsApp, e estaremos disponiveis para tirar qualquer duvida.', s_body))

story.append(Paragraph('Pontos a confirmar:', s_h3))
story.append(Paragraph('- Tamanho exato do freezer (litros ou medidas internas)', s_bullet))
story.append(Paragraph('- Panelas disponiveis (tamanho da panela de pressao, se tem panela grande para arroz)', s_bullet))
story.append(Paragraph('- Forno disponivel (gas ou eletrico)', s_bullet))
story.append(Paragraph('- Espaco de bancada para montagem e porcionamento', s_bullet))
story.append(Paragraph('- Recipientes para congelamento (se ja possui ou se precisa de sugestao de compra)', s_bullet))
story.append(Paragraph('- Dia da semana e horario preferido para o atendimento (manha)', s_bullet))
story.append(Paragraph('- Oramento semanal para as compras', s_bullet))
story.append(Paragraph('- A baba possui alguma preferencia ou restricao alimentar?', s_bullet))
story.append(Paragraph('- Elevador e estacionamento na regiao (para logistica)', s_bullet))

story.append(Spacer(1, 12))

# SECTION 7 - Observacoes
story.append(Paragraph('7. Observacoes', s_h1))
story.append(Paragraph(
    'A primeira sessao pode incluir uma organizacao completa do freezer como cortesia, para estabelecer o sistema de posicionamento que sera seguido nas semanas seguintes. O cardapio e rotativo, com renovacao a cada 4 semanas para garantir variedade e evitar monotonia alimentar. As porcoes da baba podem ser separadas e etiquetadas individualmente, evitando que as refeicoes da familia sejam consumidas indevidamente durante a semana.', s_body))
story.append(Paragraph(
    'Servicos complementares como compras assistidas, organizacao da despensa, planejamento mensal e cardapios para eventos especiais estao disponiveis sob consulta e podem ser agregados ao plano escolhido a qualquer momento. Nosso objetivo e evoluir junto com suas necessidades, tornando o servico cada vez mais personalizado e eficiente.', s_body))

# --- Build PDF ---
output_body = '/home/z/my-project/download/body_mp.pdf'
output_final = '/home/z/my-project/download/Proposta_Comercial_Mariana_Nascimento.pdf'

doc = SimpleDocTemplate(
    output_body, pagesize=A4,
    leftMargin=1*inch, rightMargin=1*inch,
    topMargin=50, bottomMargin=50,
    title='Proposta Comercial - Mesa Pronta Gastronomia',
    author='Mesa Pronta Gastronomia',
    subject='Proposta personalizada para Mariana Nascimento - Brooklin, SP'
)
doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)

# Merge cover + body
merger = pypdf.PdfWriter()
merger.append(pypdf.PdfReader('/home/z/my-project/download/cover_mp.pdf'))
merger.append(pypdf.PdfReader(output_body))
merger.write(output_final)
merger.close()

print(f'PDF gerado: {output_final}')
print(f'Tamanho: {os.path.getsize(output_final)/1024:.1f} KB')
