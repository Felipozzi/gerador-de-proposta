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
PAGE_BG       = colors.HexColor('#f0f0ee')
SECTION_BG    = colors.HexColor('#ecebe9')
CARD_BG       = colors.HexColor('#ebeae6')
TABLE_STRIPE  = colors.HexColor('#f3f3f1')
HEADER_FILL   = colors.HexColor('#6d613e')
COVER_BLOCK   = colors.HexColor('#756f5b')
BORDER        = colors.HexColor('#d7d3c5')
ICON          = colors.HexColor('#8d793d')
ACCENT        = colors.HexColor('#8c7225')
ACCENT_2      = colors.HexColor('#3f92ae')
TEXT_PRIMARY   = colors.HexColor('#252421')
TEXT_MUTED     = colors.HexColor('#7e7c74')
SEM_SUCCESS   = colors.HexColor('#4d8b62')
SEM_WARNING   = colors.HexColor('#a68a52')
SEM_ERROR     = colors.HexColor('#9c4942')
SEM_INFO      = colors.HexColor('#547a9f')

# --- Styles ---
s_h1 = ParagraphStyle('H1', fontName='FreeSerif-Bold', fontSize=18, leading=24,
                       textColor=HEADER_FILL, spaceAfter=12, spaceBefore=18)
s_h2 = ParagraphStyle('H2', fontName='FreeSerif-Bold', fontSize=14, leading=19,
                       textColor=TEXT_PRIMARY, spaceAfter=8, spaceBefore=14)
s_h3 = ParagraphStyle('H3', fontName='FreeSerif-Bold', fontSize=11.5, leading=16,
                       textColor=ICON, spaceAfter=6, spaceBefore=10)
s_body = ParagraphStyle('Body', fontName='FreeSerif', fontSize=10.5, leading=17,
                         textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)
s_body_left = ParagraphStyle('BodyL', fontName='FreeSerif', fontSize=10.5, leading=17,
                              textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6)
s_caption = ParagraphStyle('Caption', fontName='FreeSerif-Italic', fontSize=9, leading=13,
                            textColor=TEXT_MUTED, spaceAfter=6, spaceBefore=3)
s_callout = ParagraphStyle('Callout', fontName='FreeSerif-Italic', fontSize=11, leading=17,
                            textColor=ACCENT, leftIndent=18, rightIndent=18, spaceBefore=8, spaceAfter=8)
s_bullet = ParagraphStyle('Bullet', fontName='FreeSerif', fontSize=10.5, leading=17,
                           textColor=TEXT_PRIMARY, leftIndent=18, bulletIndent=6, spaceAfter=4)

# Table cell styles
ts_header = ParagraphStyle('TH', fontName='FreeSerif-Bold', fontSize=9.5, leading=13,
                            textColor=colors.white, alignment=TA_LEFT)
ts_cell = ParagraphStyle('TC', fontName='FreeSerif', fontSize=9, leading=13,
                          textColor=TEXT_PRIMARY, alignment=TA_LEFT)
ts_cell_right = ParagraphStyle('TCR', fontName='FreeSerif', fontSize=9, leading=13,
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
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
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
    return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=12, spaceBefore=12)

def page_title(canvas, doc):
    canvas.saveState()
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawRightString(A4[0] - 50, A4[1] - 35, 'Mesa Pronta Gastronomia | Pesquisa de Mercado')
    canvas.drawString(50, 30, 'Uso Interno e Confidencial')
    canvas.restoreState()

# --- Build Story ---
story = []

# CHAPTER 1
story.append(Paragraph('1. Panorama Geral do Mercado', s_h1))
story.append(Paragraph(
    'O mercado de Personal Chef no Brasil esta em fase de crescimento acelerado, impulsionado por mudancas nos habitos de consumo, valorizacao do tempo e busca por alimentacao de qualidade. Segundo a pesquisa Grand View Research (2025-2030), o mercado global de servicos de Personal Chef foi avaliado em US$ 15,86 bilhoes em 2023, e no Brasil o setor deve crescer a um CAGR de 7,4% entre 2025 e 2030, revelando um potencial significativo para profissionais e empresas que atuam neste segmento.', s_body))
story.append(Paragraph(
    'Uma reportagem da G1, publicada em outubro de 2025, destacou que profissionais de destaque no setor faturam ate R$ 50 mil por mes com menus exclusivos e marmitas personalizadas. Esse dado e particularmente relevante para o posicionamento da Mesa Pronta Gastronomia, pois demonstra que o mercado nao e composto apenas por servicos de luxo para eventos, mas tambem por solucoes praticas de alimentacao cotidiana que atendem familias de diferentes faixas de renda, especialmente nas grandes capitais como Sao Paulo.', s_body))
story.append(Paragraph(
    'Em Sao Paulo, o mercado se estrutura em quatro segmentos principais: (1) Personal Chef para refeicoes semanais e meal prep, que representa o core business da Mesa Pronta; (2) Personal Chef para eventos e jantares especiais; (3) Cozinheira particular e diarista, que funciona como concorrente direto por preco; e (4) Marmitas congeladas industrializadas por delivery, que compete por conveniencia mas perde em personalizacao e frescor. Cada um desses segmentos possui dinamica propria de precos, publico-alvo e valor percebido.', s_body))

story.append(Spacer(1, 12))

# CHAPTER 2
story.append(Paragraph('2. Tabela de Precos por Segmento', s_h1))

# 2.1
story.append(Paragraph('2.1 Personal Chef - Meal Prep / Refeicoes Semanais', s_h2))
story.append(Paragraph(
    'Este e o segmento mais relevante para a Mesa Pronta Gastronomia, pois corresponde exatamente ao modelo de negocio proposto: um chef que vai ate a residencia do cliente e prepara todas as refeicoes da semana em um unico dia de atendimento. Os precos foram coletados de multiplas fontes, incluindo plataformas de intermediacao (myChef, Take a Chef, Get Ninjas, Cronoshare), relatos reais de clientes em redes sociais e artigos especializados.', s_body))

aw = A4[0] - 2*inch
headers1 = ['Modalidade', 'Faixa de Preco', 'Fonte']
rows1 = [
    ['Sessao unica meal prep (10-15 refeicoes)', 'R$ 350 - R$ 800 por sessao', 'myChef (jan/2026), Instagram'],
    ['Diaria de producao (8h, 7 dias almoco+jantar)', 'R$ 420 - R$ 680 por dia', 'Threads (out/2024)'],
    ['Plano semanal (2-3 dias, 1-2 pessoas)', 'R$ 800 - R$ 1.500/semana', 'chefpessoal.com.br'],
    ['Plano mensal (5 dias/semana, 1-4 pessoas)', 'R$ 2.400 - R$ 4.800/mes', 'chefpessoal.com.br'],
    ['Plano semanal basico (marmitas autorais)', 'A partir de R$ 250/semana', 'Instagram (chef independente)'],
    ['Marmitas por unidade (chef na casa)', 'R$ 17 - R$ 24 por unidade', 'myChef (Barbara Gekl, Nicole/Augusto)'],
    ['Media por refeicao no meal prep', 'R$ 40 - R$ 60 por refeicao', 'myChef (jan/2026)'],
]
t1 = make_table(headers1, rows1, [aw*0.45, aw*0.30, aw*0.25])
story.extend(safe_keep([Paragraph('Tabela 1: Precos de Personal Chef para Meal Prep em Sao Paulo', s_caption), Spacer(1, 4), t1]))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'Um dado especialmente importante para a precificacao da Mesa Pronta veio do myChef, que em artigo de janeiro de 2026 informou que a maioria das familias gasta entre R$ 400 e R$ 800 por sessao de meal prep, cobrindo de 10 a 15 refeicoes. Isso equivale a um custo medio de R$ 40 a R$ 60 por refeicao, valor que e competitivo com restaurantes de qualidade e com servicos de delivery premium, especialmente considerando que a comida e preparada na casa do cliente com ingredientes frescos e cardapio 100% personalizado.', s_body))

# 2.2
story.append(Paragraph('2.2 Personal Chef - Eventos e Jantares Especiais', s_h2))
story.append(Paragraph(
    'O segmento de eventos funciona como complemento ao servico semanal e oferece margens mais elevadas por atendimento. Os precos variam significativamente conforme o numero de convidados, a complexidade do cardapio e a experiencia do chef. Plataformas como Take a Chef e myChef operam principalmente neste nicho, conectando clientes a chefs para jantares comemorativos, encontros corporativos e eventos familiares. Os valores por pessoa tendem a ser mais altos que os do meal prep, refletindo a experiencia gastrononomica completa que envolve servico, empratamento e limpeza.', s_body))

headers2 = ['Modalidade', 'Faixa de Preco', 'Fonte']
rows2 = [
    ['Jantar especial por pessoa (myChef)', 'R$ 200 - R$ 250 por pessoa', 'mychef.com.br/experiencias'],
    ['Jantar por pessoa (Take a Chef - SP)', '~R$ 226 - R$ 227 por pessoa', 'takeachef.com (media real)'],
    ['Jantar por pessoa (Take a Chef - Barueri)', 'R$ 167 - R$ 298 por pessoa', 'takeachef.com'],
    ['Evento/jantar especial (chefpessoal)', 'R$ 250 - R$ 500 por pessoa', 'chefpessoal.com.br'],
    ['Personal Chef churrasqueiro (Dom Barbato)', 'R$ 900 - R$ 1.400 por evento', 'dombarbato.com.br'],
    ['Buffet domicilio (equipe completa)', 'A partir de R$ 3.500 + valor/pessoa', 'G1 (out/2025)'],
]
t2 = make_table(headers2, rows2, [aw*0.45, aw*0.30, aw*0.25])
story.extend(safe_keep([Paragraph('Tabela 2: Precos de Personal Chef para Eventos em Sao Paulo', s_caption), Spacer(1, 4), t2]))
story.append(Spacer(1, 12))

# 2.3
story.append(Paragraph('2.3 Cozinheira Particular / Diarista (Comparativo)', s_h2))
story.append(Paragraph(
    'As cozinheiras particulares e diaristas representam o concorrente mais direto em termos de preco, embora oferecam um servico significativamente diferente em termos de personalizacao, planejamento nutricional e expertise gastronomica. Os dados foram coletados do Famyle (principal plataforma de empregadas domesticas do Brasil), Cronoshare, chefpessoal.com.br e MaryHelp. E fundamental entender essa faixa de preco para posicionar a Mesa Pronta como um servico de valor superior, nao como concorrente direto de preco.', s_body))

headers3 = ['Modalidade', 'Faixa de Preco', 'Fonte']
rows3 = [
    ['Diarista (cozinheira, por dia)', 'R$ 150 - R$ 300 por diaria', 'chefpessoal.com.br, Famyle'],
    ['Diarista (cozinheira, Famyle)', 'R$ 150 - R$ 500 por diaria', 'famyle.com'],
    ['Mensalista (cozinheira profissional)', 'R$ 2.000 - R$ 5.000 por mes', 'chefpessoal.com.br'],
    ['Mensalista (cozinheira, Famyle 2026)', 'R$ 1.804 - R$ 3.500 por mes', 'famyle.com'],
    ['Cozinheira profissional (eventos)', 'R$ 800 - R$ 3.000 por evento', 'famyle.com'],
    ['Cronoshare (cozinheira SP - media)', 'R$ 71 - R$ 120 por dia (media R$ 92)', 'cronoshare.com.br'],
]
t3 = make_table(headers3, rows3, [aw*0.45, aw*0.30, aw*0.25])
story.extend(safe_keep([Paragraph('Tabela 3: Precos de Cozinheira Particular em Sao Paulo', s_caption), Spacer(1, 4), t3]))
story.append(Spacer(1, 12))

# 2.4
story.append(Paragraph('2.4 Marmitas Congeladas - Empresas de Delivery (Benchmark)', s_h2))
story.append(Paragraph(
    'As marmitas congeladas de delivery representam o limite inferior de preco e funcionam como benchmark de conveniencia. Empresas como LivUp, Nonna Fit, Dona Nene, Lets Fit e Gym Chef operam neste segmento com precos que variam de R$ 19,90 a R$ 40 por unidade. A principal vantagem competitiva da Mesa Pronta sobre esses servicos e a personalizacao total: o cardapio e criado especificamente para o cliente, com ingredientes frescos, preparados na hora, sem conservantes e adaptados as preferencias e restricoes de cada familia.', s_body))

headers4 = ['Empresa', 'Faixa de Preco', 'Modelo']
rows4 = [
    ['LivUp', 'A partir de R$ 20,90 por unidade', 'Delivery de marmitas ultracongeladas'],
    ['Haves', 'A partir de R$ 22 por unidade', 'Marmitas personalizadas (SP)'],
    ['Gym Chef', 'A partir de R$ 19,90 por unidade', 'Marmitas fitness'],
    ['Dona Nene', '~R$ 28 - R$ 40 por unidade', 'Kits de marmitas congeladas'],
    ['Lets Fit', '~R$ 28 - R$ 40 por unidade (kits)', 'Marmitas fitness congeladas'],
    ['Personal Chefs BR', 'R$ 40 por unidade', 'Marmitas congeladas por chef'],
]
t4 = make_table(headers4, rows4, [aw*0.25, aw*0.35, aw*0.40])
story.extend(safe_keep([Paragraph('Tabela 4: Precos de Marmitas Congeladas (Delivery)', s_caption), Spacer(1, 4), t4]))
story.append(Spacer(1, 12))

# 2.5
story.append(Paragraph('2.5 Plataformas de Intermediacao', s_h2))
story.append(Paragraph(
    'As plataformas digitais desempenham um papel crescente no mercado de Personal Chef, funcionando como vitrines e conectando profissionais a clientes. Cada plataforma tem seu modelo de precificacao e comissao, e entender essa dinamica e importante para a estrategia de distribuicao da Mesa Pronta Gastronomia. O myChef se destaca como a plataforma com maior variedade de precos e formatos, operando tanto no segmento de experiencias gastronomicas quanto no de meal prep semanal.', s_body))

headers5 = ['Plataforma', 'Modelo', 'Faixa']
rows5 = [
    ['myChef', 'Meal prep / Experiencias', 'R$ 24 - R$ 60/unid ou R$ 340 - R$ 600/sessao'],
    ['Take a Chef', 'Jantares exclusivos', '~R$ 227/pessoa (media SP)'],
    ['Get Ninjas', 'Cozinheira/chef sob demanda', 'R$ 150 - R$ 500/diaria'],
    ['Cronoshare', 'Cozinheira a domicilio', 'R$ 300 - R$ 600/diaria (chef)'],
    ['Famyle', 'Cozinheira diarista/mensalista', 'R$ 150 - R$ 500/dia ou R$ 1.804 - R$ 3.500/mes'],
]
t5 = make_table(headers5, rows5, [aw*0.20, aw*0.30, aw*0.50])
story.extend(safe_keep([Paragraph('Tabela 5: Plataformas de Intermediacao', s_caption), Spacer(1, 4), t5]))

story.append(Spacer(1, 18))

# CHAPTER 3
story.append(Paragraph('3. Fatores que Impactam o Preco', s_h1))
story.append(Paragraph(
    'A formacao de precos no mercado de Personal Chef em Sao Paulo e influenciada por um conjunto de fatores interrelacionados que devem ser considerados tanto na estrategia comercial quanto na elaboracao de propostas individuais para cada cliente. Compreender esses fatores permite a Mesa Pronta posicionar seus servicos de forma competitiva e justa, comunicando valor de forma clara ao cliente final.', s_body))

headers_f = ['Fator', 'Impacto']
rows_f = [
    ['Bairro', 'Brooklin, Itaim, Jardins e Moema tendem a ter precos 10-20% maiores pela renda da regiao'],
    ['Experiencia do chef', 'Chef com 10+ anos cobra 50-100% mais que iniciantes'],
    ['Numero de refeicoes', 'Volume reduz o custo unitario: 26 refeicoes sai mais barato/unidade que 10'],
    ['Complexidade do cardapio', 'Restricoes alimentares, cortes nobres e tecnicas elaboradas encarecem'],
    ['Ingredientes', 'Cortes premium (salmao, file mignon) vs. cortes populares (frango, carne moida)'],
    ['Frequencia', 'Contratos semanais ou mensais tem desconto vs. sessoes avulsas'],
    ['Compras inclusas', 'Chef que faz as compras cobra taxa adicional (R$ 50 - R$ 150)'],
    ['Embalagens e etiquetas', 'Recipientes de vidro premium vs. plastico descartavel'],
]
tf = make_table(headers_f, rows_f, [aw*0.25, aw*0.75])
story.extend(safe_keep([Paragraph('Tabela 6: Fatores de Impacto no Preco', s_caption), Spacer(1, 4), tf]))

story.append(Spacer(1, 18))

# CHAPTER 4
story.append(Paragraph('4. Posicionamento Sugerido para Mesa Pronta Gastronomia', s_h1))
story.append(Paragraph(
    'Com base na analise completa dos dados coletados, o servico de refeicoes semanais na casa do cliente (meal prep) apresenta a seguinte janela de mercado para a Mesa Pronta Gastronomia. Os valores foram calibrados considerando o perfil de cliente tipico do Brooklin (renda media-alta, busca por praticidade sem abrir mao de qualidade), o posicionamento premium da marca e a necessidade de ser competitivo tanto com cozinheiras diaristas quanto com servicos de delivery de marmitas.', s_body))

headers_p = ['Plano', 'Faixa Recomendada', 'Justificativa']
rows_p = [
    ['Sessao avulsa (1 dia, ~26 refeicoes)', 'R$ 500 - R$ 900', 'Alinha com myChef (R$ 340 - R$ 600 para 20 marmitas) e mercado informal (R$ 350 - R$ 680)'],
    ['Plano semanal (1x/sem, 26 refeicoes)', 'R$ 700 - R$ 1.200/semana', 'Dentro da faixa chefpessoal (R$ 800 - R$ 1.500) para 1-2 pessoas, adaptado para 3-4'],
    ['Plano mensal (4x/mes, ~104 refeicoes)', 'R$ 2.500 - R$ 4.000/mes', 'Competitivo vs. cozinheira mensalista (R$ 2.000 - R$ 5.000) com valor agregado de chef'],
    ['Custo por refeicao final', 'R$ 25 - R$ 45/refeicao', 'Entre marmita delivery (R$ 20 - R$ 40) e personal chef premium (R$ 40 - R$ 60)'],
]
tp = make_table(headers_p, rows_p, [aw*0.28, aw*0.22, aw*0.50])
story.extend(safe_keep([Paragraph('Tabela 7: Faixa de Precos Recomendada para Mesa Pronta Gastronomia', s_caption), Spacer(1, 4), tp]))

story.append(Spacer(1, 18))

# CHAPTER 5
story.append(Paragraph('5. Insights Estrategicos', s_h1))

story.append(Paragraph('5.1 Custo dos Ingredientes', s_h2))
story.append(Paragraph(
    'O custo dos ingredientes (compras) geralmente nao esta incluido no valor cobrado pelo chef. Para clientes que fazem as proprias compras, como e o caso da Mariana, a proposta torna-se significativamente mais atrativa, pois o valor total investido se concentra no servico de planejamento, preparo e organizacao. Esse modelo permite a Mesa Pronta cobrar apenas pelo trabalho especializado, sem margem de intermediacao sobre alimentos. Quando o cliente solicita que o chef faca as compras, o custo adicional e de R$ 50 a R$ 150 por sessao, dependendo da quantidade e da qualidade dos ingredientes escolhidos.', s_body))

story.append(Paragraph('5.2 Competitividade por Refeicao', s_h2))
story.append(Paragraph(
    'O valor medio por refeicao no modelo de meal prep (R$ 25 a R$ 45) e competitivo com delivery de alta qualidade e com restaurantes, especialmente considerando que e comida feita na hora, na casa do cliente, com cardapio personalizado. Para colocar em perspectiva: um almoço executivo em restaurante no Brooklin custa entre R$ 45 e R$ 80, e um delivery de qualidade (iFood, restaurantes premium) varia de R$ 35 a R$ 60 por refeicao, sem a personalizacao e a organizacao semanal que o servico de Personal Chef oferece.', s_body))

story.append(Paragraph('5.3 Cozinheira Diarista vs. Personal Chef', s_h2))
story.append(Paragraph(
    'A cozinheira diarista (R$ 150 a R$ 300 por dia) e o concorrente direto mais proximo em termos de custo, mas nao oferece o mesmo nivel de planejamento nutricional, cardapio personalizado, expertise gastronomica e organizacao de freezer com sistema de congelamento estrategico. A diarista cozinha no dia; a Mesa Pronta implanta um sistema alimentar completo que funciona durante toda a semana. Essa diferenca de posicionamento e fundamental para justificar o preco superior e deve ser comunicada com clareza em toda proposta comercial.', s_body))

story.append(Paragraph('5.4 Faixa de Preco Ideal (Sweet Spot)', s_h2))
story.append(Paragraph(
    'A analise dos dados revela que a faixa de R$ 500 a R$ 900 por sessao representa o sweet spot para o publico-alvo do Brooklin e bairros similares de Sao Paulo. Esse intervalo e suficientemente acessivel para familias de renda media-alta que buscam praticidade, e suficientemente premium para comunicar qualidade e exclusividade. Propostas abaixo de R$ 500 podem desvalorizar a marca e propostas acima de R$ 1.200 por sessao afastam o publico que busca solucoes praticas recorrentes, restringindo o mercado a eventos pontuais.', s_body))

# --- Build PDF ---
output_body = '/home/z/my-project/download/body_mr.pdf'
output_final = '/home/z/my-project/download/Pesquisa_Mercado_Personal_Chef_SP.pdf'

# Add page number footer to page_title
def page_title_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawRightString(A4[0] - 50, A4[1] - 35, 'Mesa Pronta Gastronomia | Pesquisa de Mercado')
    canvas.drawString(50, 30, 'Uso Interno e Confidencial')
    canvas.drawCentredString(A4[0]/2, 30, f'{doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(
    output_body, pagesize=A4,
    leftMargin=1*inch, rightMargin=1*inch,
    topMargin=50, bottomMargin=50,
    title='Pesquisa de Mercado - Personal Chef em Sao Paulo',
    author='Mesa Pronta Gastronomia',
    subject='Analise de precos e posicionamento estrategico'
)
doc.build(story, onFirstPage=page_title_footer, onLaterPages=page_title_footer)

# Merge cover + body
merger = pypdf.PdfWriter()
merger.append(pypdf.PdfReader('/home/z/my-project/download/cover_mr.pdf'))
merger.append(pypdf.PdfReader(output_body))
merger.write(output_final)
merger.close()

print(f'PDF gerado: {output_final}')
import os
print(f'Tamanho: {os.path.getsize(output_final)/1024:.1f} KB')
