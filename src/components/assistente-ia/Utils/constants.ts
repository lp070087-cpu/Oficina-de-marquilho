export const CATEGORIAS_SIDEBAR = [
  { slug: 'motor', label: 'Motor' }, { slug: 'freios', label: 'Freios' },
  { slug: 'suspensao', label: 'Suspensão' }, { slug: 'eletrica', label: 'Elétrica' },
  { slug: 'transmissao', label: 'Transmissão' }, { slug: 'escapamento', label: 'Escapamento' },
  { slug: 'carenagem', label: 'Carenagem' }, { slug: 'lubrificantes', label: 'Lubrificantes' },
  { slug: 'acessorios', label: 'Acessórios' }, { slug: 'capacetes', label: 'Capacetes' },
  { slug: 'pneus', label: 'Pneus' }, { slug: 'rolamentos', label: 'Rolamentos' },
  { slug: 'cabos', label: 'Cabos' }, { slug: 'filtros', label: 'Filtros' },
  { slug: 'outros', label: 'Outros' },
];

export const ACOES_RAPIDAS = [
  { label: 'Alterar precos', comando: 'Alterar preco de ', icon: '💰', cor: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300' },
  { label: 'Atualizar estoque', comando: 'Trocar quantidade de ', icon: '📦', cor: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300' },
  { label: 'Cadastrar produto', comando: 'Adicionar ', icon: '➕', cor: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' },
  { label: 'Importar XML', comando: 'Importar produtos do XML ', icon: '📄', cor: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300' },
  { label: 'Gerar relatorio', comando: 'Mostrar produtos mais vendidos', icon: '📊', cor: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300' },
  { label: 'Sem estoque', comando: 'Mostrar produtos sem estoque', icon: '🔴', cor: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300' },
  { label: 'Mais vendidos', comando: 'Mostrar produtos mais vendidos', icon: '🔥', cor: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300' },
  { label: 'Produtos parados', comando: 'Mostrar produtos parados', icon: '⏸️', cor: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300' },
];

export interface ComandoAgrupado { label: string; comando: string; icon: string; desc: string; cor: string; acao?: string; }
export interface GrupoComandos { titulo: string; icon: string; cor: string; comandos: ComandoAgrupado[]; }

export const COMANDOS_GRUPOS: GrupoComandos[] = [
  {
    titulo: 'Consulta', icon: '🔍', cor: 'border-l-blue-500',
    comandos: [
      { label: 'Buscar peca', comando: 'Buscar ', icon: '🔍', desc: 'Localizar por nome, SKU ou código', cor: 'hover:bg-blue-50 hover:text-blue-700' },
      { label: 'Ver produto', comando: 'Mostrar ', icon: '👁️', desc: 'Detalhes de um produto específico', cor: 'hover:bg-blue-50 hover:text-blue-700' },
      { label: 'Procurar codigo', comando: 'Buscar codigo de barras ', icon: '📷', desc: 'Buscar por código de barras', cor: 'hover:bg-blue-50 hover:text-blue-700' },
    ],
  },
  {
    titulo: 'Cadastro', icon: '➕', cor: 'border-l-emerald-500',
    comandos: [
      { label: 'Cadastro Intel.', comando: '', icon: '🧠', desc: 'Abrir Cadastro Inteligente', cor: 'hover:bg-emerald-50 hover:text-emerald-700', acao: 'abrirCadastro' },
      { label: 'Cadastrar produto', comando: 'Adicionar ', icon: '📝', desc: 'Criar nova peça no estoque', cor: 'hover:bg-emerald-50 hover:text-emerald-700' },
    ],
  },
  {
    titulo: 'Preço', icon: '💰', cor: 'border-l-amber-500',
    comandos: [
      { label: 'Alterar preco', comando: 'Alterar preco de ', icon: '💲', desc: 'Mudar preço de venda', cor: 'hover:bg-amber-50 hover:text-amber-700' },
      { label: 'Atualizar valor', comando: 'Atualize o valor de ', icon: '🏷️', desc: 'Ajustar preço de um produto', cor: 'hover:bg-amber-50 hover:text-amber-700' },
    ],
  },
  {
    titulo: 'Estoque', icon: '📦', cor: 'border-l-indigo-500',
    comandos: [
      { label: 'Estoque baixo', comando: 'Mostrar produtos com estoque baixo', icon: '⚠️', desc: 'Produtos abaixo do mínimo', cor: 'hover:bg-indigo-50 hover:text-indigo-700' },
      { label: 'Sem estoque', comando: 'Mostrar produtos sem estoque', icon: '🚫', desc: 'Produtos zerados no estoque', cor: 'hover:bg-indigo-50 hover:text-indigo-700' },
      { label: 'Ajustar qtd', comando: 'Trocar quantidade de ', icon: '🔢', desc: 'Corrigir quantidade em estoque', cor: 'hover:bg-indigo-50 hover:text-indigo-700' },
    ],
  },
  {
    titulo: 'Relatórios', icon: '📊', cor: 'border-l-rose-500',
    comandos: [
      { label: 'Mais vendidos', comando: 'Mostrar produtos mais vendidos', icon: '🔥', desc: 'Ranking de vendas do mês', cor: 'hover:bg-rose-50 hover:text-rose-700' },
      { label: 'Produtos parados', comando: 'Mostrar produtos parados', icon: '⏸️', desc: 'Itens sem movimentação', cor: 'hover:bg-rose-50 hover:text-rose-700' },
      { label: 'Gerar relatorio', comando: 'Mostrar produtos mais vendidos', icon: '📈', desc: 'Relatório de desempenho', cor: 'hover:bg-rose-50 hover:text-rose-700' },
    ],
  },
  {
    titulo: 'Scanner', icon: '📷', cor: 'border-l-purple-500',
    comandos: [
      { label: 'Escanear codigo', comando: 'Buscar 7891234567890', icon: '📷', desc: 'Escanear código de barras', cor: 'hover:bg-purple-50 hover:text-purple-700' },
      { label: 'Abrir scanner', comando: '', icon: '🔌', desc: 'Configurar scanner inteligente', cor: 'hover:bg-purple-50 hover:text-purple-700', acao: 'abrirScanner' },
    ],
  },
];

export const PLACEHOLDERS = [
  'Digite um comando... Ex: "Adicionar 10 filtros de oleo"',
  'Experimente: "Alterar preco da pastilha para R$ 85"',
  'Tente: "Mostrar produtos com estoque baixo"',
  'Use: "Buscar oleo 20W50"',
  'Natural: "esse produto agora custa R$ 90"',
  'Use o Cadastro Inteligente para criar fichas completas 🧠',
  '🎤 Fale: "esse filtro agora custa quarenta" — a IA entende!',
];

export const INTENT_STYLES: Record<string, { icon: string; cor: string; label: string; bg: string; border: string; bar: string }> = {
  adicionar:        { icon: '➕', cor: 'text-emerald-700', label: 'Cadastrar produto', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  alterar_preco:    { icon: '💰', cor: 'text-amber-700', label: 'Alterar preço', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
  alterar_qtd:      { icon: '📦', cor: 'text-blue-700', label: 'Alterar quantidade', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500' },
  mostrar_baixo:    { icon: '⚠️', cor: 'text-orange-700', label: 'Estoque baixo', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' },
  mostrar_zerado:   { icon: '🚫', cor: 'text-red-700', label: 'Sem estoque', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' },
  mostrar_vendidos: { icon: '🔥', cor: 'text-rose-700', label: 'Mais vendidos', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500' },
  mostrar_parados:  { icon: '⏸️', cor: 'text-slate-700', label: 'Produtos parados', bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-slate-500' },
  buscar:           { icon: '🔍', cor: 'text-cyan-700', label: 'Buscar produto', bg: 'bg-cyan-50', border: 'border-cyan-200', bar: 'bg-cyan-500' },
  ajudar:           { icon: '❓', cor: 'text-violet-700', label: 'Ajuda', bg: 'bg-violet-50', border: 'border-violet-200', bar: 'bg-violet-500' },
  desconhecido:     { icon: '🤔', cor: 'text-gray-700', label: 'Desconhecido', bg: 'bg-gray-50', border: 'border-gray-200', bar: 'bg-gray-400' },
};
