'use client';
// VERSÃO ASSISTENTE IA 2026 - CHAT INTELIGENTE

import { useState, useRef, useEffect } from 'react';

// ============================================================
// TIPOS
// ============================================================
interface Categoria { id: string; nome: string; slug: string; }

interface PecaResult {
  id: string; nome: string; codigo: string; codigoBarras?: string;
  precoVenda: number; precoCusto: number; quantidade: number; quantidadeLoja: number;
  estoqueMinimo: number; marca?: string; compatibilidade?: string;
  categoria: { nome: string; id: string; slug: string };
  subcategoria?: string; localizacao?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  actions?: ActionCard[];
}

interface ActionCard {
  type: 'confirm_cadastro' | 'confirm_edicao' | 'confirm_ajuste_qtd' | 'confirm_ajuste_preco' | 'list_estoque_baixo' | 'list_sem_estoque' | 'list_produtos';
  title: string;
  description: string;
  payload: any;
  onConfirm?: string; // mensagem de confirmação
}

// ============================================================
// COMANDOS QUE A IA ENTENDE
// ============================================================
const SUGESTOES = [
  'Adicionar 10 filtros de oleo',
  'Adicionar 30 litros de oleo Motul',
  'Alterar preco do filtro HAMP para R$ 85',
  'Trocar quantidade da pastilha para 40',
  'Mostrar pecas com estoque baixo',
  'Mostrar produtos sem estoque',
  'Mostrar produtos mais vendidos',
  'Mostrar produtos parados',
  'Buscar pastilha de freio',
  'Buscar oleo 20W50',
];

// ============================================================
// PARSER DE COMANDOS
// ============================================================
interface ParsedCommand {
  intent: 'adicionar' | 'alterar_preco' | 'alterar_qtd' | 'mostrar_baixo' | 'mostrar_zerado' | 'mostrar_vendidos' | 'mostrar_parados' | 'buscar' | 'ajudar' | 'desconhecido';
  produto?: string;
  quantidade?: number;
  preco?: number;
  marca?: string;
  sku?: string;
  raw: string;
}

function parseComando(texto: string): ParsedCommand {
  const t = texto.toLowerCase().trim();

  // Adicionar X [unidades de] produto
  const addMatch = t.match(/(?:adicionar|cadastrar|criar|incluir|dar entrada em?)\s+(\d+)\s*(?:unidades?|un\.?|litros?|l|kits?|pecas?|itens?)?\s*(?:de\s+)?(.+)/i);
  if (addMatch) {
    return { intent: 'adicionar', quantidade: parseInt(addMatch[1]), produto: addMatch[2].trim(), raw: texto };
  }

  // Alterar preco de/do/da X para R$ Y
  const precoMatch = t.match(/(?:alterar|mudar|trocar|ajustar)\s+(?:o\s+)?(?:preco|preço|valor)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(?:R\$?\s*)?(\d+[.,]?\d*)/i);
  if (precoMatch) {
    return { intent: 'alterar_preco', produto: precoMatch[1].trim(), preco: parseFloat(precoMatch[2].replace(',', '.')), raw: texto };
  }

  // Trocar/alterar quantidade de/do/da X para Y
  const qtdMatch = t.match(/(?:trocar|alterar|mudar|ajustar)\s+(?:a\s+)?(?:quantidade|estoque|qtd)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(\d+)/i);
  if (qtdMatch) {
    return { intent: 'alterar_qtd', produto: qtdMatch[1].trim(), quantidade: parseInt(qtdMatch[2]), raw: texto };
  }

  // Mostrar estoque baixo
  if (/(?:mostrar|ver|listar|exibir|quais)\s+(?:pecas|produtos|itens)\s+(?:com\s+)?(?:estoque\s+)?baix[oa]/i.test(t) || /estoque\s+baixo/i.test(t)) {
    return { intent: 'mostrar_baixo', raw: texto };
  }

  // Mostrar sem estoque / zerados
  if (/(?:mostrar|ver|listar|exibir|quais)\s+(?:pecas|produtos|itens)\s+(?:sem|zerado|com\s+estoque\s+zero)/i.test(t) || /sem\s+estoque/i.test(t) || /zerados/i.test(t)) {
    return { intent: 'mostrar_zerado', raw: texto };
  }

  // Mais vendidos
  if (/(?:mais\s+vendidos|produtos\s+mais\s+vendidos|top\s+vendas|ranking)/i.test(t)) {
    return { intent: 'mostrar_vendidos', raw: texto };
  }

  // Produtos parados
  if (/(?:parados|sem\s+movimentacao|sem\s+movimentação|encalhados|sem\s+saida|sem\s+saída)/i.test(t)) {
    return { intent: 'mostrar_parados', raw: texto };
  }

  // Buscar
  if (/(?:buscar|pesquisar|procurar|achar|encontrar|mostrar|ver|consultar)\s+(.+)/i.test(t)) {
    const m = t.match(/(?:buscar|pesquisar|procurar|achar|encontrar|mostrar|ver|consultar)\s+(.+)/i);
    return { intent: 'buscar', produto: m![1].trim(), raw: texto };
  }

  // Ajuda
  if (/(?:ajuda|help|oque|o que|como|comandos)/i.test(t)) {
    return { intent: 'ajudar', raw: texto };
  }

  // Fallback: busca genérica
  if (t.length > 3) {
    return { intent: 'buscar', produto: texto, raw: texto };
  }

  return { intent: 'desconhecido', raw: texto };
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AssistenteIAPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ola! Sou a assistente do Estoque Central. 🏍️\n\nPosso ajudar com:\n\n📦 **Cadastrar produtos** — "Adicionar 10 filtros de oleo"\n💰 **Alterar precos** — "Alterar preco do filtro HAMP para R$ 85"\n📊 **Ajustar quantidades** — "Trocar quantidade da pastilha para 40"\n🔍 **Consultar estoque** — "Mostrar produtos com estoque baixo"\n🎤 **Comandos por voz** — Clique no microfone e fale\n\nExperimente um comando ou clique nas sugestoes abaixo!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Carrega categorias
  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(d => setCategorias(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // ============================================================
  // VOZ (Web Speech API)
  // ============================================================
  function toggleVoz() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMsg('Reconhecimento de voz nao disponivel neste navegador.', 'assistant');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      // Auto-envia após 500ms
      setTimeout(() => processarMensagem(transcript), 500);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  // ============================================================
  // MENSAGENS
  // ============================================================
  function addMsg(content: string, role: 'user' | 'assistant', data?: any, actions?: ActionCard[]) {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, content, data, actions }]);
  }

  // ============================================================
  // PROCESSAR COMANDO
  // ============================================================
  async function processarMensagem(texto?: string) {
    const cmd = (texto || input).trim();
    if (!cmd) return;

    addMsg(cmd, 'user');
    setInput('');
    setLoading(true);

    const parsed = parseComando(cmd);

    try {
      switch (parsed.intent) {
        case 'adicionar':
          await handleAdicionar(parsed);
          break;
        case 'alterar_preco':
          await handleAlterarPreco(parsed);
          break;
        case 'alterar_qtd':
          await handleAlterarQtd(parsed);
          break;
        case 'mostrar_baixo':
          await handleMostrarBaixo();
          break;
        case 'mostrar_zerado':
          await handleMostrarZerado();
          break;
        case 'mostrar_vendidos':
          await handleMostrarVendidos();
          break;
        case 'mostrar_parados':
          await handleMostrarParados();
          break;
        case 'buscar':
          await handleBuscar(parsed);
          break;
        case 'ajudar':
          addMsg(
            '📋 **Comandos disponiveis:**\n\n' +
            '• "Adicionar 10 filtros de oleo"\n' +
            '• "Alterar preco da pastilha para R$ 85"\n' +
            '• "Trocar quantidade do oleo para 40"\n' +
            '• "Mostrar pecas com estoque baixo"\n' +
            '• "Mostrar produtos sem estoque"\n' +
            '• "Mostrar produtos mais vendidos"\n' +
            '• "Mostrar produtos parados"\n' +
            '• "Buscar [nome do produto]"\n\n' +
            'Toda alteracao precisa ser confirmada antes de executar.',
            'assistant'
          );
          break;
        default:
          await handleBuscar({ intent: 'buscar', produto: cmd, raw: cmd });
      }
    } catch (e: any) {
      addMsg(`❌ Erro: ${e.message || 'Nao foi possivel processar o comando.'}`, 'assistant');
    }

    setLoading(false);
  }

  // ============================================================
  // HANDLERS DE INTENTS
  // ============================================================

  async function handleAdicionar(parsed: ParsedCommand) {
    // Busca se o produto ja existe
    const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`);
    const pecas: PecaResult[] = await res.json();

    if (Array.isArray(pecas) && pecas.length > 0) {
      // Produto ja existe — oferecer para incrementar
      const p = pecas[0];
      addMsg(
        `Encontrei **${p.nome}** (SKU: ${p.codigo}) no estoque.\n\n` +
        `📦 Central: **${p.quantidade}** un.\n` +
        `🏪 Loja: **${p.quantidadeLoja || 0}** un.\n\n` +
        `Deseja adicionar **${parsed.quantidade}** unidades ao estoque central?`,
        'assistant',
        null,
        [{
          type: 'confirm_ajuste_qtd',
          title: `Adicionar ${parsed.quantidade} un. de ${p.nome}`,
          description: `Quantidade atual: ${p.quantidade} → Nova: ${p.quantidade + (parsed.quantidade || 0)}`,
          payload: { peca: p, novaQtd: p.quantidade + (parsed.quantidade || 0) },
          onConfirm: `${parsed.quantidade} un. de "${p.nome}" adicionadas ao estoque central. ✅`,
        }]
      );
    } else {
      // Produto nao existe — oferecer cadastro
      const catId = categorias[0]?.id || '';
      addMsg(
        `Produto **"${parsed.produto}"** nao encontrado no estoque.\n\n` +
        `Posso cadastrar:\n` +
        `📝 Nome: **${parsed.produto}**\n` +
        `📦 Quantidade: **${parsed.quantidade || 1}**\n` +
        `📂 Categoria: **${categorias[0]?.nome || 'Selecionar depois'}**`,
        'assistant',
        null,
        [{
          type: 'confirm_cadastro',
          title: `Cadastrar "${parsed.produto}"`,
          description: `Quantidade inicial: ${parsed.quantidade || 1} un.`,
          payload: {
            nome: parsed.produto,
            quantidade: parsed.quantidade || 1,
            categoriaId: catId,
            codigo: `IA-${Date.now().toString(36).toUpperCase()}`,
          },
          onConfirm: `Produto "${parsed.produto}" cadastrado com ${parsed.quantidade || 1} un. ✅`,
        }]
      );
    }
  }

  async function handleAlterarPreco(parsed: ParsedCommand) {
    const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`);
    const pecas: PecaResult[] = await res.json();

    if (Array.isArray(pecas) && pecas.length > 0) {
      const p = pecas[0];
      const precoAtual = Number(p.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const precoNovo = (parsed.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      addMsg(
        `Encontrei **${p.nome}** (SKU: ${p.codigo}).\n\n` +
        `💰 Preco atual: **${precoAtual}**\n` +
        `✨ Novo preco: **${precoNovo}**`,
        'assistant',
        null,
        [{
          type: 'confirm_ajuste_preco',
          title: `Alterar preco de ${p.nome}`,
          description: `${precoAtual} → ${precoNovo}`,
          payload: { peca: p, novoPreco: parsed.preco },
          onConfirm: `Preco de "${p.nome}" alterado para ${precoNovo}. ✅`,
        }]
      );
    } else {
      addMsg(`Nao encontrei **"${parsed.produto}"**. Tente buscar pelo nome exato ou SKU.`, 'assistant');
    }
  }

  async function handleAlterarQtd(parsed: ParsedCommand) {
    const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`);
    const pecas: PecaResult[] = await res.json();

    if (Array.isArray(pecas) && pecas.length > 0) {
      const p = pecas[0];
      addMsg(
        `Encontrei **${p.nome}** (SKU: ${p.codigo}).\n\n` +
        `📦 Quantidade atual: **${p.quantidade}** → Nova: **${parsed.quantidade}**`,
        'assistant',
        null,
        [{
          type: 'confirm_ajuste_qtd',
          title: `Alterar quantidade de ${p.nome}`,
          description: `${p.quantidade} → ${parsed.quantidade} un.`,
          payload: { peca: p, novaQtd: parsed.quantidade },
          onConfirm: `Quantidade de "${p.nome}" alterada para ${parsed.quantidade} un. ✅`,
        }]
      );
    } else {
      addMsg(`Nao encontrei **"${parsed.produto}"**. Tente buscar pelo nome exato ou SKU.`, 'assistant');
    }
  }

  async function handleMostrarBaixo() {
    const res = await fetch('/api/pecas?baixo=1');
    const pecas: PecaResult[] = await res.json();

    if (Array.isArray(pecas) && pecas.length > 0) {
      const list = pecas.slice(0, 8).map((p: any) =>
        `• **${p.nome}** — SKU: ${p.codigo} — Central: ${p.quantidade} (min: ${p.estoqueMinimo})`
      ).join('\n');
      const more = pecas.length > 8 ? `\n\n...e mais ${pecas.length - 8} produtos.` : '';
      addMsg(
        `📊 **${pecas.length} produtos com estoque baixo:**\n\n${list}${more}\n\n` +
        `Va em **Estoque Central → Exportar → Estoque baixo** para imprimir a lista de compras.`,
        'assistant',
        { pecas }
      );
    } else {
      addMsg('✅ Nenhum produto com estoque baixo encontrado!', 'assistant');
    }
  }

  async function handleMostrarZerado() {
    const res = await fetch('/api/pecas');
    const pecas: PecaResult[] = await res.json();
    const zerados = Array.isArray(pecas) ? pecas.filter((p: any) => p.quantidade <= 0) : [];

    if (zerados.length > 0) {
      const list = zerados.slice(0, 8).map((p: any) =>
        `• **${p.nome}** — SKU: ${p.codigo} — Categoria: ${p.categoria?.nome || '-'}`
      ).join('\n');
      const more = zerados.length > 8 ? `\n\n...e mais ${zerados.length - 8} produtos.` : '';
      addMsg(`📊 **${zerados.length} produtos sem estoque:**\n\n${list}${more}`, 'assistant', { pecas: zerados });
    } else {
      addMsg('✅ Nenhum produto com estoque zerado!', 'assistant');
    }
  }

  async function handleMostrarVendidos() {
    const hoje = new Date();
    const mes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const p = new URLSearchParams({ inicio: mes.toISOString(), fim: hoje.toISOString() });
    const res = await fetch(`/api/relatorios?${p}`);
    const data = await res.json();
    const saidas: any[] = data.saidas || [];

    if (saidas.length > 0) {
      // Agrupa por peca
      const agrupado: Record<string, { nome: string; codigo: string; qtd: number; valor: number }> = {};
      for (const s of saidas) {
        const key = s.codigo || s.peca;
        if (!agrupado[key]) agrupado[key] = { nome: s.peca, codigo: s.codigo || '-', qtd: 0, valor: 0 };
        agrupado[key].qtd += s.quantidade;
        agrupado[key].valor += s.preco * s.quantidade;
      }
      const sorted = Object.values(agrupado).sort((a, b) => b.qtd - a.qtd).slice(0, 8);
      const list = sorted.map(p =>
        `• **${p.nome}** — ${p.qtd} un. vendidas — ${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      ).join('\n');
      addMsg(`📊 **Produtos mais vendidos este mes:**\n\n${list}`, 'assistant', { ranking: sorted });
    } else {
      addMsg('📊 Nenhuma venda registrada este mes.', 'assistant');
    }
  }

  async function handleMostrarParados() {
    const res = await fetch('/api/pecas');
    const pecas: PecaResult[] = await res.json();
    // Produtos com quantidade > 0 mas nunca tiveram movimentacao (simplificado: sem vendas no periodo)
    // Como nao temos API de movimentacao por peca sem alterar backend,
    // mostramos produtos com estoque parado (alta quantidade, sem vendas recentes visiveis)
    const parados = Array.isArray(pecas)
      ? pecas.filter((p: any) => p.quantidade > 0).sort((a: any, b: any) => b.quantidade - a.quantidade).slice(0, 10)
      : [];

    if (parados.length > 0) {
      addMsg(
        `📊 **Produtos com maior estoque parado:**\n\n` +
        parados.map((p: any) => `• **${p.nome}** — ${p.quantidade} un. em estoque`).join('\n') +
        `\n\n⚠️ Considere fazer uma promocao ou transferir para a loja.`,
        'assistant',
        { parados }
      );
    } else {
      addMsg('✅ Estoque sem acumulos!', 'assistant');
    }
  }

  async function handleBuscar(parsed: ParsedCommand) {
    const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`);
    const pecas: PecaResult[] = await res.json();

    if (Array.isArray(pecas) && pecas.length > 0) {
      const ate = Math.min(pecas.length, 5);
      const list = pecas.slice(0, ate).map((p: any) => {
        const preco = Number(p.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const status = p.quantidade <= 0 ? '🔴' : p.quantidade <= p.estoqueMinimo ? '🟡' : '🟢';
        return `${status} **${p.nome}** — SKU: ${p.codigo} — Central: ${p.quantidade} — Loja: ${p.quantidadeLoja || 0} — ${preco}`;
      }).join('\n');
      const more = pecas.length > 5 ? `\n\n...e mais ${pecas.length - 5} resultados.` : '';
      addMsg(`Encontrei **${pecas.length}** produto(s):\n\n${list}${more}`, 'assistant', { pecas: pecas.slice(0, 5) });
    } else {
      addMsg(
        `Nao encontrei **"${parsed.produto}"**.\n\n` +
        `Tente:\n• Nome da peca\n• SKU\n• Codigo de barras\n• Ou use "Adicionar ${parsed.produto}" para cadastrar.`,
        'assistant'
      );
    }
  }

  // ============================================================
  // EXECUTAR AÇÃO CONFIRMADA
  // ============================================================
  async function executarAcao(action: ActionCard, messageId: string) {
    setLoading(true);

    try {
      if (action.type === 'confirm_cadastro') {
        const { nome, quantidade, categoriaId, codigo } = action.payload;
        const body = {
          nome, codigo,
          precoVenda: 0, precoCusto: 0,
          quantidade, quantidadeLoja: 0,
          estoqueMinimo: 5, categoriaId,
        };
        const res = await fetch('/api/pecas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          addMsg(action.onConfirm || 'Produto cadastrado com sucesso! ✅', 'assistant');
        } else {
          const e = await res.json();
          addMsg(`❌ Erro ao cadastrar: ${e.error || 'Erro desconhecido'}`, 'assistant');
        }
      } else if (action.type === 'confirm_ajuste_qtd') {
        const { peca, novaQtd } = action.payload;
        const res = await fetch(`/api/pecas/${peca.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...peca,
            quantidade: novaQtd,
            categoriaId: peca.categoria?.id || peca.categoriaId,
            precoCusto: peca.precoCusto,
            precoVenda: peca.precoVenda,
            estoqueMinimo: peca.estoqueMinimo,
          }),
        });
        if (res.ok) {
          addMsg(action.onConfirm || 'Quantidade alterada com sucesso! ✅', 'assistant');
        } else {
          const e = await res.json();
          addMsg(`❌ Erro: ${e.error || 'Erro desconhecido'}`, 'assistant');
        }
      } else if (action.type === 'confirm_ajuste_preco') {
        const { peca, novoPreco } = action.payload;
        const res = await fetch(`/api/pecas/${peca.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...peca,
            precoVenda: novoPreco,
            categoriaId: peca.categoria?.id || peca.categoriaId,
            precoCusto: peca.precoCusto,
            quantidade: peca.quantidade,
            estoqueMinimo: peca.estoqueMinimo,
          }),
        });
        if (res.ok) {
          addMsg(action.onConfirm || 'Preco alterado com sucesso! ✅', 'assistant');
        } else {
          const e = await res.json();
          addMsg(`❌ Erro: ${e.error || 'Erro desconhecido'}`, 'assistant');
        }
      }
    } catch (e: any) {
      addMsg(`❌ Erro de conexao: ${e.message}`, 'assistant');
    }

    setLoading(false);
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shadow-brand-600/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Assistente IA</h1>
            <p className="text-[11px] text-slate-400">Chat inteligente para gerenciar o estoque</p>
          </div>
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F3F6FB]">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${
              m.role === 'user'
                ? 'bg-brand-600 text-white rounded-2xl rounded-br-md shadow-sm shadow-brand-600/10'
                : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-md shadow-sm'
            } px-4 py-3`}>
              {/* Texto da mensagem */}
              <div className="text-sm whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                    .replace(/\n/g, '<br/>')
                }}
              />

              {/* Cards de dados quando houver */}
              {m.data && !m.actions && m.data.pecas && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.data.pecas.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs min-w-[160px]">
                      <p className="font-semibold text-slate-800">{p.nome}</p>
                      <p className="text-slate-500 mt-0.5">SKU: {p.codigo}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-slate-600">📦 {p.quantidade}</span>
                        <span className="text-brand-600 font-medium">🏪 {p.quantidadeLoja || 0}</span>
                        <span className="text-slate-500">{Number(p.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cards de ação (confirmação) */}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {m.actions.map((action, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-800 mb-1">{action.title}</p>
                      <p className="text-[11px] text-slate-500 mb-3">{action.description}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => executarAcao(action, m.id)}
                          className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/10"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => addMsg('Comando cancelado.', 'assistant')}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-400">Processando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* SUGESTOES */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2 flex-nowrap">
            {SUGESTOES.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors flex-shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
        {/* Microfone */}
        <button
          onClick={toggleVoz}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            listening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
              : 'bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600'
          }`}
          title="Comando por voz"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
          </svg>
        </button>

        {/* Campo de texto */}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processarMensagem(); } }}
          className="flex-1 border-0 bg-slate-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400 transition-all"
          placeholder={listening ? 'Ouvindo...' : 'Digite um comando ou clique no microfone...'}
          disabled={listening}
        />

        {/* Enviar */}
        <button
          onClick={() => processarMensagem()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-brand-600/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
