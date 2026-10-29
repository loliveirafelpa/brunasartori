// Identidade visual — extraída do logo e dos posts do Instagram @bru_psico.
// Único lugar com cores e fontes do projeto: nada de hex solto em componentes.

export const cores = {
  petroleo: '#254C5D', // cor principal do logo — títulos, botões, cabeçalho
  petroleoEscuro: '#1B3A47', // hover de botões e textos de maior peso
  verdeAgua: '#61B7AC', // cérebro do logo — destaques e detalhes (não usar como cor de texto sobre claro)
  salvia: '#6FA9A6', // fundo verde dos posts — chips e elementos selecionados
  nevoa: '#DDE8E8', // fundo claro azulado dos posts — cartões e áreas suaves
  papel: '#EEF3F2', // fundo geral das telas — o cinza-azulado claro dos posts
  branco: '#FFFFFF',
  texto: '#1E3540', // texto principal
  textoSecundario: '#5A7380', // legendas, ajuda, rótulos
  borda: '#C9D9DA',
  alerta: '#A8553D', // avisos de crise e erros — terracota suave, sem vermelho agressivo
  alertaFundo: '#F6E7E1',
  atencao: '#8A5A10', // destaques para a psicóloga conferir (não é diagnóstico)
  atencaoFundo: '#FBF1E1',
  // Gráficos — derivados da paleta da marca, mesmo esquema validado na demo (daltonismo e contraste sobre o branco).
  serie1: '#2F7F86', // série principal
  serie2: '#C8693E', // segunda série, só em comparações de dois grupos
  serieSuave: '#A9D0CD', // pontos diários atrás da média (ênfase menor)
  grade: '#E3ECEC', // linhas de grade e eixos, recessivos
  // Escala ordinal do mapa de calor (claro → escuro, um só tom).
  escala1: '#9CCFC8',
  escala2: '#6FB3AB',
  escala3: '#4A958F',
  escala4: '#356F7A',
  escala5: '#254C5D',
}

export const fontes = {
  titulo: ['Fraunces', 'Georgia', 'serif'], // serifada expressiva, como nos títulos dos posts
  corpo: ['"Nunito Sans"', 'system-ui', 'sans-serif'], // leitura confortável
  interface: ['Montserrat', 'system-ui', 'sans-serif'], // botões, menus, rótulos — como o texto em negrito dos posts
  marca: ['Quicksand', 'system-ui', 'sans-serif'], // só para o nome da Bruna, no traço leve e arredondado do logo
}
// Sombra dos cartões, tingida de petróleo (em vez de cinza neutro).
export const sombras = {
  cartao: '0 1px 2px rgba(37, 76, 93, 0.06), 0 12px 32px -18px rgba(37, 76, 93, 0.28)',
}

// As fontes são carregadas do Google Fonts no index.html — se trocar aqui, trocar lá também.
