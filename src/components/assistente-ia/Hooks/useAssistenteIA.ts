'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Categoria, PecaResult, Message, ActionCard, Conversa, ParsedCommand, InterpretationTrace, HistoricoAcao } from '@/components/assistente-ia/Types/assistente.types';
import type { ScannerOrigem, ScannerStatus, ScannerLeitura, ScannerDispositivo } from '@/components/assistente-ia/Types/scanner.types';
import { SCANNER_DISPOSITIVOS_INICIAL } from '@/components/assistente-ia/Types/scanner.types';
import type { ModoCadastro, FichaCadastro, CampoStatus } from '@/components/assistente-ia/Types/cadastro.types';
import { FICHA_CADASTRO_INICIAL } from '@/components/assistente-ia/Types/cadastro.types';
import type { VoiceSettings, VozComandoRecente } from '@/components/assistente-ia/Types/voice.types';
import { VOICE_SETTINGS_INICIAL } from '@/components/assistente-ia/Types/voice.types';

import { obterSugestoes } from './useSugestoes';
import { CATEGORIAS_SIDEBAR, PLACEHOLDERS, INTENT_STYLES } from '@/components/assistente-ia/Utils/constants';
import { parseComando, gerarTrace, converterNumerosExtenso, corConfianca, textoConfianca } from '@/components/assistente-ia/Utils/parser';
import { parseTextoParaFicha, obterCamposFicha, calcularProgresso } from '@/components/assistente-ia/Utils/cadastro';
import { corStatusScanner, bolinhaStatus, labelStatus } from '@/components/assistente-ia/Utils/scanner';
import { tocarBeepConfirmacao } from '@/components/assistente-ia/Utils/audio';

export function useAssistenteIA() {
  const [conversations, setConversations] = useState<Conversa[]>([]);
  const [activeConversaId, setActiveConversaId] = useState<string>('default');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pesquisaSidebar, setPesquisaSidebar] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome', role: 'assistant',
      content: 'Ola! Sou o assistente inteligente do Estoque Central. 🏍️\n\nPosso ajudar com linguagem natural:\n\n• 💰 **"altere o preco da pastilha para R$ 85"**\n• 📦 **"esse produto agora custa R$ 120"** — mesma intenção!\n• 🔍 **"onde esta o filtro de oleo?"**\n• ⚠️ **"mostre os produtos que estao acabando"**\n• 📊 **"gere um relatorio de vendas"**\n• 🧠 **Cadastro Inteligente** — crie fichas completas com foto, áudio, texto ou código de barras\n• 🎤 **Modo Conversação** — fale naturalmente como no ChatGPT\n• 📷 **Scanner Inteligente** — USB, Bluetooth, Câmera\n\nNao precisa decorar comandos — fale naturalmente!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [comandosExecutados, setComandosExecutados] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [inputExpandido, setInputExpandido] = useState(false);
  const [produtosPorCategoria, setProdutosPorCategoria] = useState<Record<string, number>>({});
  const [todosProdutos, setTodosProdutos] = useState<PecaResult[]>([]);
  const [dashboardAberto, setDashboardAberto] = useState(false);
  const [gerenteAberto, setGerenteAberto] = useState(false);
  const [checklistItens, setChecklistItens] = useState<{ id: string; texto: string; feito: boolean }[]>([]);
  const [resolvendoPrioridade, setResolvendoPrioridade] = useState<string | null>(null);
  const [aplicandoSugestao, setAplicandoSugestao] = useState<number | null>(null);
  const [centralOperacionalAberto, setCentralOperacionalAberto] = useState(false);
  const [executandoAcao, setExecutandoAcao] = useState<number | null>(null);
  const [copilotoAberto, setCopilotoAberto] = useState(false);
  const [copilotoInput, setCopilotoInput] = useState('');
  const [copilotoResposta, setCopilotoResposta] = useState<{ resposta: string; icon: string } | null>(null);
  const [missoesDia, setMissoesDia] = useState<{ id: string; texto: string; concluida: boolean; icon: string; cor: string }[]>([]);
  const [missaoConcluindo, setMissaoConcluindo] = useState<string | null>(null);
  const [automacaoAberto, setAutomacaoAberto] = useState(false);
  const [tarefasIA, setTarefasIA] = useState<{ id: string; texto: string; prioridade: string; tempo: string; dificuldade: string; categoria: string; status: 'pendente' | 'executando' | 'concluida' | 'ignorada'; icon: string; cor: string }[]>([]);
  const [tarefaEmExecucao, setTarefaEmExecucao] = useState<string | null>(null);
  const [filaProcessos, setFilaProcessos] = useState<{ id: string; texto: string; status: 'fila' | 'processando' | 'concluido'; icon: string }[]>([]);
  const [comprasAberto, setComprasAberto] = useState(false);
  const [comprasAdicionadas, setComprasAdicionadas] = useState<string[]>([]);
  const [comprasIgnoradas, setComprasIgnoradas] = useState<string[]>([]);

  // Scanner Inteligente
  const [scannerAtivo, setScannerAtivo] = useState(true);
  const [scannerDispositivos, setScannerDispositivos] = useState<ScannerDispositivo[]>(SCANNER_DISPOSITIVOS_INICIAL);
  const [scannerLeituras, setScannerLeituras] = useState<ScannerLeitura[]>([]);
  const [scannerUltimoCodigo, setScannerUltimoCodigo] = useState<string | null>(null);
  const [scannerFlashVerde, setScannerFlashVerde] = useState(false);
  const [scannerPainelAberto, setScannerPainelAberto] = useState(false);
  const [scannerOrigemAtiva, setScannerOrigemAtiva] = useState<ScannerOrigem>('usb');

  // Histórico de ações
  const [historicoAcoes, setHistoricoAcoes] = useState<HistoricoAcao[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [comandosRapidosAberto, setComandosRapidosAberto] = useState(false);

  // Cadastro Inteligente (FASE 6)
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [modoCadastro, setModoCadastro] = useState<ModoCadastro>('texto');
  const [fichaCadastro, setFichaCadastro] = useState<FichaCadastro>(FICHA_CADASTRO_INICIAL);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [audioTranscrito, setAudioTranscrito] = useState('');
  const [codigoEscaneadoCadastro, setCodigoEscaneadoCadastro] = useState<string | null>(null);
  const [msgFichaId, setMsgFichaId] = useState<string | null>(null);
  const audioRecognitionRef = useRef<any>(null);

  // ============================================================
  // ASSISTENTE DE VOZ (FASE 7)
  // ============================================================
  const [conversacaoAtiva, setConversacaoAtiva] = useState(false);
  const [transcricaoParcial, setTranscricaoParcial] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(VOICE_SETTINGS_INICIAL);
  const [vozComandosRecentes, setVozComandosRecentes] = useState<VozComandoRecente[]>([]);
  const [vozRespondendo, setVozRespondendo] = useState(false);
  const [processandoVoz, setProcessandoVoz] = useState(false);
  const [voiceSettingsAberto, setVoiceSettingsAberto] = useState(false);
  const vozSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const vozTimerRef = useRef<any>(null);
  const transcricaoRef = useRef<string>('');  // FASE 1 — ref para evitar stale closure

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  // FASE 1 — Chat image upload
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  const sugestoes = useMemo(() => obterSugestoes(input), [input]);
  const progressoCadastro = useMemo(() => calcularProgresso(fichaCadastro), [fichaCadastro]);
  const camposFicha = useMemo(() => obterCamposFicha(fichaCadastro), [fichaCadastro]);

  // ============================================================
  // CENTRAL DE INTELIGÊNCIA (FASE 8) — Computações
  // ============================================================
  const dashboardData = useMemo(() => {
    const pecas = todosProdutos;
    if (!pecas.length) return null;
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const totalProdutos = pecas.length;
    const valorTotal = pecas.reduce((s, p) => s + (Number(p.precoVenda) || 0) * (p.quantidade || 0), 0);
    const valorTotalCusto = pecas.reduce((s, p) => s + (Number(p.precoCusto) || 0) * (p.quantidade || 0), 0);
    const semEstoque = pecas.filter(p => (p.quantidade || 0) <= 0);
    const estoqueCritico = pecas.filter(p => (p.quantidade || 0) > 0 && (p.quantidade || 0) <= (p.estoqueMinimo || 5));
    const paradosList = pecas.filter(p => (p.quantidade || 0) > 0).sort((a, b) => (b.quantidade || 0) - (a.quantidade || 0));
    const maisVendidosSimulado = pecas.filter(p => (p.quantidade || 0) > 0).sort((a, b) => (a.quantidade || 0) - (b.quantidade || 0)).slice(0, 10);
    const precoMedio = totalProdutos > 0 ? valorTotal / pecas.reduce((s, p) => s + (p.quantidade || 0), 1) : 0;
    const maisCaro = pecas.reduce((a, b) => (Number(a?.precoVenda) || 0) > (Number(b?.precoVenda) || 0) ? a : b, pecas[0]);
    const maisBarato = pecas.filter(p => (p.quantidade || 0) > 0).reduce((a, b) => (Number(a?.precoVenda) || 0) < (Number(b?.precoVenda) || 0) ? a : b, pecas[0]);
    // Categorias: quantidade por categoria
    const catQtd: Record<string, { slug: string; nome: string; qtd: number; valor: number }> = {};
    for (const p of pecas) { const s = p.categoria?.slug || 'outros'; const n = p.categoria?.nome || 'Outros'; if (!catQtd[s]) catQtd[s] = { slug: s, nome: n, qtd: 0, valor: 0 }; catQtd[s].qtd += (p.quantidade || 0); catQtd[s].valor += (Number(p.precoVenda) || 0) * (p.quantidade || 0); }
    const catsArray = Object.values(catQtd).sort((a, b) => b.qtd - a.qtd);
    const maiorCategoria = catsArray[0] || null;
    const menorCategoria = catsArray[catsArray.length - 1] || null;
    // Cadastros por data (simulado: usa createdAt se disponível, senão usa quantidade como proxy)
    const cadastradosHoje = pecas.filter(p => { if ((p as any).createdAt) { const d = new Date((p as any).createdAt); return d >= hoje; } return false; });
    const cadastradosSemana = pecas.filter(p => { if ((p as any).createdAt) { const d = new Date((p as any).createdAt); return d >= inicioSemana; } return false; });
    return { totalProdutos, valorTotal, valorTotalCusto, semEstoque, estoqueCritico, paradosList, maisVendidosSimulado, precoMedio, maisCaro, maisBarato, catsArray, maiorCategoria, menorCategoria, cadastradosHoje, cadastradosSemana };
  }, [todosProdutos]);

  const analisesIA = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const insights: { icon: string; texto: string; cor: string; bg: string; border: string }[] = [];
    if (d.estoqueCritico.length > 0) insights.push({ icon: '⚠️', texto: `Existem ${d.estoqueCritico.length} produtos com estoque crítico (abaixo do mínimo).`, cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' });
    if (d.maiorCategoria && d.valorTotal > 0) { const pct = Math.round((d.maiorCategoria.valor / d.valorTotal) * 100); insights.push({ icon: '📂', texto: `A categoria ${d.maiorCategoria.nome} representa ${pct}% do valor total em estoque.`, cor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' }); }
    if (d.paradosList.length > 5) insights.push({ icon: '⏸️', texto: `Há ${d.paradosList.length} produtos com estoque elevado — podem ser transferidos para a loja.`, cor: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' });
    if (d.semEstoque.length > 0) insights.push({ icon: '🚫', texto: `${d.semEstoque.length} produtos estão sem estoque. Considere reposição urgente.`, cor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' });
    const precosBaixos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > 0 && (Number(p.precoVenda) || 0) < (d.precoMedio * 0.7) && (p.quantidade || 0) > 0);
    if (precosBaixos.length > 0) insights.push({ icon: '📉', texto: `${precosBaixos.length} produtos estão com preços abaixo da média (R$ ${d.precoMedio.toFixed(2).replace('.', ',')}).`, cor: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' });
    const precosAltos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > (d.precoMedio * 1.5) && (p.quantidade || 0) > 0);
    if (precosAltos.length > 0) insights.push({ icon: '📈', texto: `${precosAltos.length} produtos estão com preços acima da média. Avalie a competitividade.`, cor: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' });
    return insights.slice(0, 8);
  }, [dashboardData, todosProdutos]);

  const alertasIA = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const a: { prioridade: 'critico' | 'atencao' | 'normal'; icon: string; titulo: string; desc: string; acao: string; corBadge: string; corCard: string; borderL: string }[] = [];
    if (d.semEstoque.length > 0) a.push({ prioridade: 'critico', icon: '🔴', titulo: 'Produtos sem estoque', desc: `${d.semEstoque.length} produto(s) zerado(s).`, acao: 'Comprar ou transferir com urgência.', corBadge: 'bg-red-500', corCard: 'bg-red-50/50', borderL: 'border-l-red-500' });
    if (d.estoqueCritico.length > 0) a.push({ prioridade: 'atencao', icon: '🟠', titulo: 'Estoque crítico', desc: `${d.estoqueCritico.length} produto(s) abaixo do mínimo.`, acao: 'Iniciar processo de reposição.', corBadge: 'bg-amber-500', corCard: 'bg-amber-50/50', borderL: 'border-l-amber-500' });
    if (d.semEstoque.length === 0 && d.estoqueCritico.length === 0) a.push({ prioridade: 'normal', icon: '🟢', titulo: 'Estoque saudável', desc: 'Todos os produtos estão com níveis adequados.', acao: 'Nenhuma ação necessária.', corBadge: 'bg-emerald-500', corCard: 'bg-emerald-50/50', borderL: 'border-l-emerald-500' });
    if (d.paradosList.length > 5) a.push({ prioridade: 'atencao', icon: '🟠', titulo: 'Estoque parado elevado', desc: `${d.paradosList.length} produtos com giro baixo.`, acao: 'Considere promoções ou transferências.', corBadge: 'bg-amber-500', corCard: 'bg-amber-50/50', borderL: 'border-l-amber-500' });
    if (d.catsArray.length > 0) { const menor = d.catsArray[d.catsArray.length - 1]; if (menor && menor.qtd === 0) a.push({ prioridade: 'atencao', icon: '🟠', titulo: 'Categoria vazia', desc: `A categoria "${menor.nome}" está sem itens.`, acao: 'Cadastrar produtos nesta categoria.', corBadge: 'bg-amber-500', corCard: 'bg-amber-50/50', borderL: 'border-l-amber-500' }); }
    return a;
  }, [dashboardData]);

  const resumoExecutivo = useMemo(() => {
    if (!dashboardData) return '';
    const d = dashboardData;
    const partes: string[] = [];
    partes.push(`O estoque possui ${d.totalProdutos} produtos distribuídos em ${d.catsArray.length} categorias.`);
    if (d.estoqueCritico.length > 0) partes.push(`Há ${d.estoqueCritico.length} produtos em nível crítico.`);
    if (d.maiorCategoria && d.valorTotal > 0) partes.push(`A categoria ${d.maiorCategoria.nome} representa ${Math.round((d.maiorCategoria.valor / d.valorTotal) * 100)}% do valor.`);
    if (d.semEstoque.length > 0) partes.push(`${d.semEstoque.length} produtos sem estoque precisam de reposição.`);
    if (d.paradosList.length > 5) partes.push(`Foram identificados ${d.paradosList.length} itens com estoque parado elevado.`);
    return partes.join(' ');
  }, [dashboardData]);

  // ============================================================
  // GERENTE IA (FASE 9) — Computações
  // ============================================================
  const prioridadesDoDia = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const p: { nivel: 'critico' | 'alto' | 'medio' | 'baixo'; icon: string; descricao: string; acao: string; cor: string; bg: string; border: string; id: string }[] = [];
    if (d.semEstoque.length > 0) p.push({ nivel: 'critico', icon: '🔴', descricao: `Repor ${d.semEstoque.length} produto(s) sem estoque`, acao: 'Abrir lista de reposição', cor: 'text-red-700', bg: 'bg-red-50', border: 'border-l-red-500', id: 'repor-sem-estoque' });
    if (d.estoqueCritico.length > 0) p.push({ nivel: 'alto', icon: '🟠', descricao: `${d.estoqueCritico.length} produto(s) com estoque crítico (abaixo do mínimo)`, acao: 'Iniciar reposição', cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-l-amber-500', id: 'repor-critico' });
    const precosBaixos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > 0 && (Number(p.precoVenda) || 0) < (d.precoMedio * 0.7) && (p.quantidade || 0) > 0);
    if (precosBaixos.length > 0) p.push({ nivel: 'medio', icon: '🟡', descricao: `Ajustar preço de ${precosBaixos.length} produto(s) abaixo da média`, acao: 'Revisar precificação', cor: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-l-yellow-500', id: 'ajustar-precos-baixos' });
    if (d.paradosList.length > 5) p.push({ nivel: 'medio', icon: '🟡', descricao: `Conferir ${d.paradosList.length} produto(s) sem movimentação (estoque parado)`, acao: 'Verificar parados', cor: 'text-purple-700', bg: 'bg-purple-50', border: 'border-l-purple-500', id: 'conferir-parados' });
    if (d.cadastradosSemana.length > 0) p.push({ nivel: 'baixo', icon: '🟢', descricao: `Revisar ${d.cadastradosSemana.length} produto(s) cadastrados recentemente`, acao: 'Conferir cadastros', cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-l-emerald-500', id: 'revisar-cadastros' });
    const precosAltos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > (d.precoMedio * 1.8) && (p.quantidade || 0) > 0);
    if (precosAltos.length > 0) p.push({ nivel: 'baixo', icon: '🟢', descricao: `Avaliar ${precosAltos.length} produto(s) com preço acima da média`, acao: 'Revisar precificação', cor: 'text-sky-700', bg: 'bg-sky-50', border: 'border-l-sky-500', id: 'avaliar-precos-altos' });
    return p;
  }, [dashboardData, todosProdutos]);

  const sugestoesIA = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const s: { motivo: string; confianca: number; impacto: string; acao: string; icon: string; cor: string; bg: string }[] = [];
    if (d.estoqueCritico.length > 0) s.push({ motivo: `Aumentar estoque de ${d.estoqueCritico.length} produto(s) crítico(s)`, confianca: 92, impacto: 'Alto', acao: 'Comprar mais', icon: '📦', cor: 'text-amber-700', bg: 'bg-amber-50' });
    if (d.paradosList.length > 3) s.push({ motivo: `Reduzir estoque de ${d.paradosList.length} produto(s) parado(s) — transferir para loja`, confianca: 85, impacto: 'Médio', acao: 'Transferir', icon: '🚚', cor: 'text-purple-700', bg: 'bg-purple-50' });
    const precosBaixos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > 0 && (Number(p.precoVenda) || 0) < (d.precoMedio * 0.7) && (p.quantidade || 0) > 0);
    if (precosBaixos.length > 0) s.push({ motivo: `Alterar preço de ${precosBaixos.length} produto(s) abaixo da média (R$ ${d.precoMedio.toFixed(2).replace('.', ',')})`, confianca: 88, impacto: 'Médio', acao: 'Ajustar preços', icon: '💰', cor: 'text-yellow-700', bg: 'bg-yellow-50' });
    if (d.cadastradosSemana.length > 0) s.push({ motivo: `Revisar cadastro de ${d.cadastradosSemana.length} produto(s) recente(s)`, confianca: 78, impacto: 'Baixo', acao: 'Revisar', icon: '📝', cor: 'text-emerald-700', bg: 'bg-emerald-50' });
    if (d.semEstoque.length > 0) s.push({ motivo: `Conferir fornecedor para ${d.semEstoque.length} produto(s) sem estoque`, confianca: 90, impacto: 'Alto', acao: 'Consultar', icon: '🏭', cor: 'text-red-700', bg: 'bg-red-50' });
    if (d.catsArray.length > 2) { const menor = d.catsArray[d.catsArray.length - 1]; if (menor && menor.qtd <= 2) s.push({ motivo: `Verificar produtos da categoria "${menor.nome}" — apenas ${menor.qtd} item(ns)`, confianca: 72, impacto: 'Baixo', acao: 'Explorar', icon: '🔍', cor: 'text-sky-700', bg: 'bg-sky-50' }); }
    return s;
  }, [dashboardData, todosProdutos]);

  const produtosAtencao = useMemo(() => {
    if (!dashboardData || !todosProdutos.length) return [];
    const d = dashboardData;
    const lista: { peca: PecaResult; problema: string; prioridade: 'critico' | 'alto' | 'medio' | 'baixo'; corPrioridade: string; bgPrioridade: string }[] = [];
    for (const p of todosProdutos) {
      const qtd = p.quantidade || 0;
      const preco = Number(p.precoVenda) || 0;
      const minimo = p.estoqueMinimo || 5;
      if (qtd <= 0) { lista.push({ peca: p, problema: 'Sem estoque', prioridade: 'critico', corPrioridade: 'text-red-600', bgPrioridade: 'bg-red-50' }); continue; }
      if (qtd <= minimo) { lista.push({ peca: p, problema: 'Estoque crítico', prioridade: 'alto', corPrioridade: 'text-amber-600', bgPrioridade: 'bg-amber-50' }); continue; }
      if (preco > 0 && preco > d.precoMedio * 2) { lista.push({ peca: p, problema: 'Valor muito alto', prioridade: 'medio', corPrioridade: 'text-orange-600', bgPrioridade: 'bg-orange-50' }); continue; }
      if (preco > 0 && preco < d.precoMedio * 0.5 && qtd > 0) { lista.push({ peca: p, problema: 'Valor muito baixo', prioridade: 'medio', corPrioridade: 'text-yellow-600', bgPrioridade: 'bg-yellow-50' }); continue; }
      if (qtd > 20) { lista.push({ peca: p, problema: 'Estoque Parado', prioridade: 'baixo', corPrioridade: 'text-purple-600', bgPrioridade: 'bg-purple-50' }); continue; }
      if (!p.categoria || p.categoria.slug === 'outros') { lista.push({ peca: p, problema: 'Cadastro incompleto', prioridade: 'baixo', corPrioridade: 'text-slate-600', bgPrioridade: 'bg-slate-50' }); }
    }
    return lista.sort((a, b) => { const ordem: Record<string, number> = { critico: 0, alto: 1, medio: 2, baixo: 3 }; return ordem[a.prioridade] - ordem[b.prioridade]; });
  }, [dashboardData, todosProdutos]);

  const previsaoReposicao = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const p: { icon: string; texto: string; cor: string; bg: string; border: string; prioridade: string }[] = [];
    if (d.estoqueCritico.length > 0) {
      const maisCriticos = d.estoqueCritico.slice(0, 3).map(x => x.nome).join(', ');
      p.push({ icon: '⚠️', texto: `${d.estoqueCritico.length} produto(s) poderão acabar em breve: ${maisCriticos}${d.estoqueCritico.length > 3 ? ' e outros.' : '.'}`, cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', prioridade: 'alto' });
    }
    if (d.semEstoque.length > 0) {
      p.push({ icon: '🔴', texto: `${d.semEstoque.length} produto(s) já estão sem estoque — reposição urgente necessária.`, cor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', prioridade: 'critico' });
    }
    if (d.estoqueCritico.length === 0 && d.semEstoque.length === 0) {
      p.push({ icon: '✅', texto: 'Nenhum produto com risco iminente de falta. Estoque estável.', cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', prioridade: 'normal' });
    }
    for (const cat of d.catsArray.slice(0, 3)) {
      const criticosNaCat = d.estoqueCritico.filter(ec => ec.categoria?.slug === cat.slug);
      if (criticosNaCat.length > 0) {
        p.push({ icon: '📂', texto: `Categoria "${cat.nome}" precisa de reposição — ${criticosNaCat.length} produto(s) crítico(s).`, cor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', prioridade: 'medio' });
      }
    }
    const catsEstaveis = d.catsArray.filter(c => !d.estoqueCritico.some(ec => ec.categoria?.slug === c.slug) && c.qtd > 0).slice(0, 2);
    for (const cat of catsEstaveis) {
      p.push({ icon: '🟢', texto: `Categoria "${cat.nome}" está estável — ${cat.qtd} unidade(s) em estoque.`, cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', prioridade: 'baixo' });
    }
    return p;
  }, [dashboardData]);

  const oportunidades = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const o: { icon: string; titulo: string; descricao: string; cor: string; bg: string; border: string; tipo: string }[] = [];
    const categoriasPequenas = d.catsArray.filter(c => c.qtd <= 3 && c.qtd > 0);
    for (const cat of categoriasPequenas.slice(0, 3)) o.push({ icon: '🌱', titulo: `Categoria pouco explorada: ${cat.nome}`, descricao: `Apenas ${cat.qtd} unidade(s) — oportunidade de expansão.`, cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', tipo: 'expansao' });
    if (d.maiorCategoria && d.totalProdutos > 0) {
      const pctMaior = Math.round((d.maiorCategoria.qtd / d.totalProdutos) * 100);
      if (pctMaior > 40) o.push({ icon: '🎯', titulo: `Concentração excessiva em ${d.maiorCategoria.nome}`, descricao: `${pctMaior}% dos produtos nesta categoria — diversifique.`, cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', tipo: 'concentracao' });
    }
    const catsEquilibradas = d.catsArray.filter(c => c.qtd >= 3 && c.qtd <= Math.ceil(d.totalProdutos / d.catsArray.length) * 1.5);
    if (catsEquilibradas.length >= 3) o.push({ icon: '⚖️', titulo: `${catsEquilibradas.length} categorias equilibradas`, descricao: 'Estoque bem distribuído entre categorias — mantenha.', cor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', tipo: 'equilibrio' });
    if (d.paradosList.length > 10) o.push({ icon: '📊', titulo: 'Produtos parados em excesso', descricao: `${d.paradosList.length} itens com estoque alto — crie promoções.`, cor: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', tipo: 'promocao' });
    const catZeradas = d.catsArray.filter(c => c.qtd === 0);
    if (catZeradas.length > 0) o.push({ icon: '🚀', titulo: `${catZeradas.length} categoria(s) zerada(s)`, descricao: `Oportunidade para novos fornecedores em ${catZeradas.map(c => c.nome).slice(0, 2).join(', ')}.`, cor: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', tipo: 'fornecedor' });
    return o;
  }, [dashboardData]);

  const checklistDefault = useMemo(() => [
    { id: 'ck-critico', texto: 'Conferir produtos com estoque crítico', feito: false },
    { id: 'ck-novos', texto: 'Conferir peças cadastradas recentemente', feito: false },
    { id: 'ck-precos', texto: 'Revisar preços acima/abaixo da média', feito: false },
    { id: 'ck-localizacao', texto: 'Conferir produtos sem localização', feito: false },
    { id: 'ck-fornecedor', texto: 'Conferir produtos sem fornecedor', feito: false },
    { id: 'ck-zerados', texto: 'Verificar produtos zerados', feito: false },
    { id: 'ck-parados', texto: 'Verificar produtos parados', feito: false },
  ], []);

  const atividadeIA = useMemo(() => {
    const agora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const eventos: { hora: string; icon: string; texto: string; cor: string }[] = [];
    if (dashboardData) {
      const d = dashboardData;
      const h = agora.getHours();
      const m = agora.getMinutes();
      const tempo = (min: number) => { const d2 = new Date(agora.getTime() - min * 60000); return `${pad(d2.getHours())}:${pad(d2.getMinutes())}`; };
      eventos.push({ hora: `${pad(h)}:${pad(m)}`, icon: '🧠', texto: `Painel Gerente IA carregado — ${d.totalProdutos} produtos analisados.`, cor: 'text-indigo-600' });
      if (d.estoqueCritico.length > 0) eventos.push({ hora: tempo(2), icon: '⚠️', texto: `IA detectou ${d.estoqueCritico.length} produto(s) com estoque crítico.`, cor: 'text-amber-600' });
      if (d.semEstoque.length > 0) eventos.push({ hora: tempo(3), icon: '🔴', texto: `Alerta: ${d.semEstoque.length} produto(s) sem estoque identificados.`, cor: 'text-red-600' });
      if (d.paradosList.length > 0) eventos.push({ hora: tempo(5), icon: '📊', texto: `${d.paradosList.length} produto(s) com estoque parado elevado.`, cor: 'text-purple-600' });
      eventos.push({ hora: tempo(8), icon: '📈', texto: `Preço médio do estoque calculado: R$ ${d.precoMedio.toFixed(2).replace('.', ',')}.`, cor: 'text-emerald-600' });
      if (d.valorTotal > 0) eventos.push({ hora: tempo(10), icon: '💰', texto: `Valor total do estoque: ${d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, cor: 'text-blue-600' });
      if (scannerLeituras.length > 0) eventos.push({ hora: tempo(15), icon: '📷', texto: `Scanner utilizado — ${scannerLeituras.length} leitura(s) registrada(s).`, cor: 'text-sky-600' });
      if (historicoAcoes.length > 0) { const ultima = historicoAcoes[historicoAcoes.length - 1]; eventos.push({ hora: tempo(18), icon: ultima.icon, texto: `${ultima.resumo}`, cor: 'text-slate-600' }); }
    }
    return eventos.sort((a, b) => b.hora.localeCompare(a.hora));
  }, [dashboardData, scannerLeituras, historicoAcoes]);

  const pontuacaoEstoque = useMemo(() => {
    if (!dashboardData) return { score: 0, nivel: 'N/A', cor: 'text-slate-400', corBarra: '#94a3b8' };
    const d = dashboardData;
    let score = 50;
    if (d.totalProdutos > 0) score += Math.min(d.totalProdutos, 30) * 0.3;
    if (d.semEstoque.length === 0) score += 15; else score -= d.semEstoque.length * 3;
    if (d.estoqueCritico.length === 0) score += 10; else score -= d.estoqueCritico.length * 2;
    if (d.paradosList.length <= 5) score += 8; else if (d.paradosList.length > 15) score -= 8;
    const totalCat = d.catsArray.length;
    const catsAtivas = d.catsArray.filter(c => c.qtd > 0).length;
    if (totalCat > 0 && catsAtivas / totalCat > 0.7) score += 5;
    if (d.precoMedio > 0) score += 5;
    if (d.cadastradosSemana.length > 0) score += 3;
    score = Math.max(0, Math.min(100, Math.round(score)));
    let nivel: string; let cor: string; let corBarra: string;
    if (score >= 85) { nivel = 'Excelente'; cor = 'text-emerald-600'; corBarra = '#10b981'; }
    else if (score >= 70) { nivel = 'Bom'; cor = 'text-blue-600'; corBarra = '#3b82f6'; }
    else if (score >= 50) { nivel = 'Regular'; cor = 'text-amber-600'; corBarra = '#f59e0b'; }
    else { nivel = 'Crítico'; cor = 'text-red-600'; corBarra = '#ef4444'; }
    return { score, nivel, cor, corBarra };
  }, [dashboardData]);

  // ============================================================
  // CENTRAL OPERACIONAL (FASE 10) — Computações
  // ============================================================
  const acoesIAFaria = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const acoes: { prioridade: string; impacto: string; tempo: string; descricao: string; icon: string; cor: string; bg: string; border: string; id: number }[] = [];
    if (d.semEstoque.length > 0) acoes.push({ prioridade: 'Crítica', impacto: 'Alto', tempo: '30 min', descricao: `Comprar peças para ${d.semEstoque.length} produto(s) sem estoque`, icon: '🛒', cor: 'text-red-700', bg: 'bg-red-50', border: 'border-l-red-500', id: 0 });
    if (d.estoqueCritico.length > 0) acoes.push({ prioridade: 'Alta', impacto: 'Alto', tempo: '20 min', descricao: `Repor estoque de ${d.estoqueCritico.length} produto(s) crítico(s)`, icon: '⚠️', cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-l-amber-500', id: 1 });
    const precosBaixos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > 0 && (Number(p.precoVenda) || 0) < (d.precoMedio * 0.7) && (p.quantidade || 0) > 0);
    if (precosBaixos.length > 0) acoes.push({ prioridade: 'Média', impacto: 'Médio', tempo: '15 min', descricao: `Revisar preços de ${precosBaixos.length} produto(s) abaixo da média`, icon: '💰', cor: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-l-yellow-500', id: 2 });
    if (d.paradosList.length > 5) acoes.push({ prioridade: 'Média', impacto: 'Médio', tempo: '25 min', descricao: `Organizar ${d.paradosList.length} produto(s) com estoque parado`, icon: '📦', cor: 'text-purple-700', bg: 'bg-purple-50', border: 'border-l-purple-500', id: 3 });
    const semFornecedor = todosProdutos.filter(p => !(p as any).fornecedor || (p as any).fornecedor === '');
    if (semFornecedor.length > 0) acoes.push({ prioridade: 'Baixa', impacto: 'Baixo', tempo: '10 min', descricao: `Conferir ${semFornecedor.length} peça(s) sem fornecedor cadastrado`, icon: '🏭', cor: 'text-sky-700', bg: 'bg-sky-50', border: 'border-l-sky-500', id: 4 });
    const semLocalizacao = todosProdutos.filter(p => !(p as any).localizacao || (p as any).localizacao === '');
    if (semLocalizacao.length > 0) acoes.push({ prioridade: 'Baixa', impacto: 'Baixo', tempo: '10 min', descricao: `Atualizar localização de ${semLocalizacao.length} produto(s)`, icon: '📍', cor: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-l-indigo-500', id: 5 });
    if (d.cadastradosSemana.length > 0) acoes.push({ prioridade: 'Baixa', impacto: 'Baixo', tempo: '20 min', descricao: `Revisar ${d.cadastradosSemana.length} produto(s) cadastrados recentemente`, icon: '📝', cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-l-emerald-500', id: 6 });
    return acoes;
  }, [dashboardData, todosProdutos]);

  const planoDoDia = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const plano: { hora: string; tarefa: string; icon: string; detalhe: string; cor: string }[] = [];
    plano.push({ hora: '08:00', tarefa: 'Conferir estoque crítico', icon: '🔍', detalhe: d.estoqueCritico.length > 0 ? `${d.estoqueCritico.length} produto(s) crítico(s)` : 'Nenhum produto crítico', cor: d.estoqueCritico.length > 0 ? 'text-amber-600' : 'text-emerald-600' });
    const precosBaixos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > 0 && (Number(p.precoVenda) || 0) < (d.precoMedio * 0.7) && (p.quantidade || 0) > 0);
    plano.push({ hora: '09:00', tarefa: 'Atualizar preços', icon: '💰', detalhe: precosBaixos.length > 0 ? `${precosBaixos.length} produto(s) abaixo da média` : 'Preços OK', cor: precosBaixos.length > 0 ? 'text-yellow-600' : 'text-emerald-600' });
    if (d.catsArray.length > 0) {
      const maior = d.catsArray[0];
      plano.push({ hora: '10:00', tarefa: `Organizar categoria ${maior.nome}`, icon: '📂', detalhe: `${maior.qtd} un. — maior categoria`, cor: 'text-blue-600' });
    }
    plano.push({ hora: '11:00', tarefa: 'Revisar produtos parados', icon: '⏸️', detalhe: d.paradosList.length > 0 ? `${d.paradosList.length} produto(s) parado(s)` : 'Nenhum parado', cor: d.paradosList.length > 5 ? 'text-purple-600' : 'text-emerald-600' });
    plano.push({ hora: '14:00', tarefa: 'Conferir scanner e leituras', icon: '📷', detalhe: scannerLeituras.length > 0 ? `${scannerLeituras.length} leitura(s)` : 'Sem leituras', cor: scannerLeituras.length > 0 ? 'text-sky-600' : 'text-slate-400' });
    plano.push({ hora: '15:00', tarefa: 'Revisar cadastros recentes', icon: '📝', detalhe: d.cadastradosSemana.length > 0 ? `${d.cadastradosSemana.length} cadastros na semana` : 'Nenhum cadastro', cor: d.cadastradosSemana.length > 0 ? 'text-emerald-600' : 'text-slate-400' });
    plano.push({ hora: '16:00', tarefa: 'Verificar produtos sem estoque', icon: '🚫', detalhe: d.semEstoque.length > 0 ? `${d.semEstoque.length} produto(s)` : 'Todos OK', cor: d.semEstoque.length > 0 ? 'text-red-600' : 'text-emerald-600' });
    return plano;
  }, [dashboardData, todosProdutos, scannerLeituras]);

  const mapaSaudeEstoque = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const total = d.totalProdutos || 1;
    const semFornecedor = todosProdutos.filter(p => !(p as any).fornecedor || (p as any).fornecedor === '').length;
    const semLocalizacao = todosProdutos.filter(p => !(p as any).localizacao || (p as any).localizacao === '').length;
    const catsAtivas = d.catsArray.filter(c => c.qtd > 0).length;
    const pctCadastro = total > 0 ? Math.max(70, Math.round(((total - semFornecedor) / total) * 100)) : 90;
    const pctPreco = Math.max(60, Math.min(100, 75 + Math.round((d.totalProdutos / 20) * 5)));
    const pctCategorias = d.catsArray.length > 0 ? Math.round((catsAtivas / d.catsArray.length) * 100) : 0;
    const pctLocalizacao = total > 0 ? Math.max(50, Math.round(((total - semLocalizacao) / total) * 100) + 22) : 72;
    const pctFornecedor = total > 0 ? Math.max(40, Math.round(((total - semFornecedor) / total) * 100) + 20) : 65;
    const pctOrganizacao = Math.max(55, 100 - (d.paradosList.length > 10 ? (d.paradosList.length - 10) * 2 : 0) - (d.semEstoque.length * 3) - (d.estoqueCritico.length * 2));
    return [
      { label: 'Cadastro', pct: pctCadastro, cor: pctCadastro >= 85 ? 'bg-emerald-500' : pctCadastro >= 70 ? 'bg-amber-500' : 'bg-red-500', icon: '📋' },
      { label: 'Preço', pct: pctPreco, cor: pctPreco >= 85 ? 'bg-emerald-500' : pctPreco >= 70 ? 'bg-amber-500' : 'bg-red-500', icon: '💰' },
      { label: 'Categorias', pct: pctCategorias, cor: pctCategorias >= 85 ? 'bg-emerald-500' : pctCategorias >= 70 ? 'bg-amber-500' : 'bg-red-500', icon: '📂' },
      { label: 'Localização', pct: pctLocalizacao, cor: pctLocalizacao >= 85 ? 'bg-emerald-500' : pctLocalizacao >= 70 ? 'bg-amber-500' : 'bg-red-500', icon: '📍' },
      { label: 'Fornecedor', pct: pctFornecedor, cor: pctFornecedor >= 85 ? 'bg-emerald-500' : pctFornecedor >= 70 ? 'bg-amber-500' : 'bg-red-500', icon: '🏭' },
      { label: 'Organização', pct: pctOrganizacao, cor: pctOrganizacao >= 85 ? 'bg-emerald-500' : pctOrganizacao >= 70 ? 'bg-amber-500' : 'bg-red-500', icon: '🗂️' },
    ];
  }, [dashboardData, todosProdutos]);

  const simuladorDecisoes = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const sim: { icon: string; texto: string; impacto: string; cor: string; bg: string }[] = [];
    if (d.maiorCategoria && d.maiorCategoria.qtd < 20) sim.push({ icon: '📈', texto: `Se aumentar o estoque da categoria "${d.maiorCategoria.nome}", o valor do estoque crescerá proporcionalmente e a categoria se tornará ainda mais dominante.`, impacto: 'Médio', cor: 'text-blue-700', bg: 'bg-blue-50' });
    const precosAltos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > (d.precoMedio * 1.8) && (p.quantidade || 0) > 0);
    if (precosAltos.length > 0) sim.push({ icon: '📉', texto: `Se reduzir os preços de ${precosAltos.length} produto(s) acima da média, pode aumentar o giro e liberar capital parado.`, impacto: 'Alto', cor: 'text-amber-700', bg: 'bg-amber-50' });
    if (d.semEstoque.length > 0) sim.push({ icon: '🛒', texto: `Se comprar mais ${d.semEstoque.length} produto(s) sem estoque, evitará perda de vendas e melhorará o atendimento.`, impacto: 'Alto', cor: 'text-red-700', bg: 'bg-red-50' });
    if (d.paradosList.length > 5) sim.push({ icon: '🚚', texto: `Se organizar ${d.paradosList.length} produto(s) parados (transferir para loja), liberará espaço e capital de giro.`, impacto: 'Médio', cor: 'text-purple-700', bg: 'bg-purple-50' });
    if (d.catsArray.length >= 3) {
      const menor = d.catsArray[d.catsArray.length - 1];
      if (menor && menor.qtd <= 2) sim.push({ icon: '🌱', texto: `Se expandir a categoria "${menor.nome}" (apenas ${menor.qtd} itens), diversificará o estoque e reduzirá a concentração.`, impacto: 'Baixo', cor: 'text-emerald-700', bg: 'bg-emerald-50' });
    }
    if (d.maiorCategoria && d.valorTotal > 0) {
      const pctMaior = Math.round((d.maiorCategoria.valor / d.valorTotal) * 100);
      if (pctMaior > 50) sim.push({ icon: '🎯', texto: `Se diversificar para fora de "${d.maiorCategoria.nome}" (${pctMaior}% do valor), reduzirá o risco de concentração excessiva.`, impacto: 'Médio', cor: 'text-indigo-700', bg: 'bg-indigo-50' });
    }
    return sim;
  }, [dashboardData, todosProdutos]);

  const recomendacoesAutomaticas = useMemo(() => {
    if (!dashboardData) return { financeiro: [], operacional: [], organizacao: [], compras: [], cadastro: [] };
    const d = dashboardData;
    type Rec = { icon: string; descricao: string; beneficio: string };
    const financeiro: Rec[] = [];
    const operacional: Rec[] = [];
    const organizacao: Rec[] = [];
    const compras: Rec[] = [];
    const cadastro: Rec[] = [];
    if (d.valorTotal > 0) { financeiro.push({ icon: '💰', descricao: `O estoque vale ${d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — mantenha o controle financeiro em dia.`, beneficio: 'Visibilidade financeira' }); }
    if (d.valorTotalCusto > 0 && d.valorTotal > 0) { const m = Math.round(((d.valorTotal - d.valorTotalCusto) / d.valorTotal) * 100); financeiro.push({ icon: '📊', descricao: `Margem estimada de ${m}% — analise se está adequada ao mercado.`, beneficio: 'Saúde financeira' }); }
    if (d.estoqueCritico.length > 0) { operacional.push({ icon: '⚙️', descricao: `${d.estoqueCritico.length} produto(s) crítico(s) — priorize a reposição para evitar ruptura.`, beneficio: 'Continuidade operacional' }); }
    if (scannerLeituras.length > 0) { operacional.push({ icon: '📷', descricao: `Scanner ativo com ${scannerLeituras.length} leitura(s) — continue utilizando para agilidade.`, beneficio: 'Eficiência nas leituras' }); }
    if (d.paradosList.length > 5) { organizacao.push({ icon: '🗂️', descricao: `${d.paradosList.length} produto(s) parado(s) — organize prateleiras e transfira excedentes.`, beneficio: 'Espaço otimizado' }); }
    if (d.catsArray.length > 2) { organizacao.push({ icon: '📂', descricao: `${d.catsArray.length} categorias ativas — mantenha a organização por categoria.`, beneficio: 'Facilidade de localização' }); }
    if (d.semEstoque.length > 0) { compras.push({ icon: '🛒', descricao: `${d.semEstoque.length} produto(s) zerado(s) — inicie o processo de compra.`, beneficio: 'Sem ruptura de estoque' }); }
    if (d.estoqueCritico.length > 0) { compras.push({ icon: '📋', descricao: `${d.estoqueCritico.length} produto(s) com estoque baixo — planeje compras futuras.`, beneficio: 'Planejamento de compras' }); }
    if (d.cadastradosSemana.length > 0) { cadastro.push({ icon: '✅', descricao: `${d.cadastradosSemana.length} cadastros recentes — revise dados e complete informações.`, beneficio: 'Cadastros confiáveis' }); }
    if (d.totalProdutos > 0) { cadastro.push({ icon: '📝', descricao: `${d.totalProdutos} produtos no sistema — mantenha os cadastros sempre atualizados.`, beneficio: 'Base de dados completa' }); }
    return { financeiro, operacional, organizacao, compras, cadastro };
  }, [dashboardData, scannerLeituras]);

  const painelProdutividade = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    return [
      { label: 'Produtos analisados', valor: d.totalProdutos.toString(), icon: '🔍', cor: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Produtos revisados', valor: historicoAcoes.filter(h => h.intent === 'alterar' || h.tipo.includes('preço') || h.tipo.includes('qtd')).length.toString(), icon: '✅', cor: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Produtos sem estoque', valor: d.semEstoque.length.toString(), icon: '🚫', cor: d.semEstoque.length > 0 ? 'text-red-600' : 'text-emerald-600', bg: 'bg-red-50' },
      { label: 'Produtos críticos', valor: d.estoqueCritico.length.toString(), icon: '⚠️', cor: d.estoqueCritico.length > 0 ? 'text-amber-600' : 'text-emerald-600', bg: 'bg-amber-50' },
      { label: 'Scanner utilizado', valor: scannerLeituras.length > 0 ? 'Sim' : 'Não', icon: '📷', cor: scannerLeituras.length > 0 ? 'text-sky-600' : 'text-slate-400', bg: 'bg-sky-50' },
      { label: 'Cadastros na semana', valor: d.cadastradosSemana.length.toString(), icon: '📝', cor: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Comandos executados', valor: comandosExecutados.toString(), icon: '⚡', cor: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Leituras scanner', valor: scannerLeituras.length.toString(), icon: '📡', cor: 'text-cyan-600', bg: 'bg-cyan-50' },
    ];
  }, [dashboardData, historicoAcoes, scannerLeituras, comandosExecutados]);

  const centralEventos = useMemo(() => {
    const agora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const tempo = (min: number) => { const d2 = new Date(agora.getTime() - min * 60000); return `${pad(d2.getHours())}:${pad(d2.getMinutes())}`; };
    const ev: { hora: string; icon: string; texto: string; cor: string; bg: string }[] = [];
    if (scannerLeituras.length > 0) ev.push({ hora: tempo(2), icon: '📷', texto: `Scanner utilizado — ${scannerLeituras.length} leitura(s)`, cor: 'text-sky-600', bg: 'bg-sky-50' });
    if (historicoAcoes.length > 0) {
      const alteracoes = historicoAcoes.filter(h => h.resultado === 'sucesso').slice(-3);
      for (const h of alteracoes) ev.push({ hora: tempo(5 + alteracoes.indexOf(h) * 3), icon: h.icon, texto: h.resumo, cor: 'text-emerald-600', bg: 'bg-emerald-50' });
    }
    if (dashboardData) {
      const d = dashboardData;
      if (d.estoqueCritico.length > 0) ev.push({ hora: tempo(15), icon: '⚠️', texto: `IA encontrou ${d.estoqueCritico.length} produto(s) crítico(s)`, cor: 'text-amber-600', bg: 'bg-amber-50' });
      if (d.semEstoque.length > 0) ev.push({ hora: tempo(20), icon: '🔴', texto: `Alerta: ${d.semEstoque.length} produto(s) sem estoque`, cor: 'text-red-600', bg: 'bg-red-50' });
      ev.push({ hora: tempo(25), icon: '🧠', texto: `Nova análise concluída — ${d.totalProdutos} produtos`, cor: 'text-indigo-600', bg: 'bg-indigo-50' });
      if (d.precoMedio > 0) ev.push({ hora: tempo(30), icon: '📈', texto: `Preço médio: R$ ${d.precoMedio.toFixed(2).replace('.', ',')}`, cor: 'text-purple-600', bg: 'bg-purple-50' });
    }
    if (comandosExecutados > 0) ev.push({ hora: tempo(35), icon: '⚡', texto: `${comandosExecutados} comando(s) executado(s)`, cor: 'text-orange-600', bg: 'bg-orange-50' });
    return ev.sort((a, b) => a.hora.localeCompare(b.hora));
  }, [dashboardData, scannerLeituras, historicoAcoes, comandosExecutados]);

  const resumoExecutivoOficina = useMemo(() => {
    if (!dashboardData) return '';
    const d = dashboardData;
    const partes: string[] = [];
    if (d.semEstoque.length === 0 && d.estoqueCritico.length === 0) partes.push('A oficina apresenta estoque saudável.');
    else { if (d.semEstoque.length > 0) partes.push(`Existem ${d.semEstoque.length} produto(s) que precisam de reposição urgente.`); if (d.estoqueCritico.length > 0) partes.push(`${d.estoqueCritico.length} produto(s) estão com estoque crítico.`); }
    if (d.maiorCategoria && d.valorTotal > 0) { const pct = Math.round((d.maiorCategoria.valor / d.valorTotal) * 100); if (pct > 30) partes.push(`A categoria ${d.maiorCategoria.nome} concentra ${pct}% do patrimônio.`); }
    if (d.paradosList.length > 5) partes.push(`Há ${d.paradosList.length} produtos com estoque parado — oportunidade de organização.`);
    if (scannerLeituras.length > 0) partes.push('O scanner está sendo utilizado corretamente.');
    if (d.cadastradosSemana.length > 0) partes.push(`${d.cadastradosSemana.length} cadastros recentes estão consistentes.`);
    partes.push(`O estoque vale ${d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com ${d.totalProdutos} produtos em ${d.catsArray.length} categorias.`);
    return partes.join(' ');
  }, [dashboardData, scannerLeituras]);

  // ============================================================
  // COPILOTO EXECUTIVO (FASE 11) — Computações
  // ============================================================
  const resumoDoDia = useMemo(() => {
    if (!dashboardData) return '';
    const d = dashboardData;
    const partes: string[] = [];
    partes.push('Bom dia. ☀️');
    const totalCriticos = d.semEstoque.length + d.estoqueCritico.length;
    if (totalCriticos > 0) partes.push(`Hoje existem ${totalCriticos} produto(s) que exigem atenção — ${d.semEstoque.length} zerado(s) e ${d.estoqueCritico.length} com estoque crítico.`);
    else partes.push('Hoje não há produtos sem estoque ou em nível crítico — estoque saudável.');
    if (d.maiorCategoria && d.valorTotal > 0) partes.push(`A categoria ${d.maiorCategoria.nome} representa ${Math.round((d.maiorCategoria.valor / d.valorTotal) * 100)}% do valor total do estoque.`);
    if (comandosExecutados > 0 || scannerLeituras.length > 0) partes.push(`Foram realizados ${comandosExecutados} comandos e o scanner foi utilizado ${scannerLeituras.length} vez(es).`);
    if (d.paradosList.length > 5) partes.push(`Existem ${d.paradosList.length} produtos com estoque parado — há oportunidades para reorganização.`);
    if (d.cadastradosSemana.length > 0) partes.push(`${d.cadastradosSemana.length} produto(s) foram cadastrados nesta semana.`);
    partes.push(`O estoque totaliza ${d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} entre ${d.totalProdutos} produtos em ${d.catsArray.length} categorias.`);
    return partes.join('\n');
  }, [dashboardData, comandosExecutados, scannerLeituras]);

  const diagnosticGeral = useMemo(() => {
    if (!dashboardData) return { nota: 0, nivel: '', cor: '', corBarra: '', justificativas: [] as string[] };
    const d = dashboardData;
    let score = 0;
    const j: string[] = [];
    if (d.semEstoque.length === 0) { score += 20; j.push('✅ Nenhum produto sem estoque.'); } else { const pts = Math.max(0, 20 - d.semEstoque.length * 3); score += pts; j.push(`🔴 ${d.semEstoque.length} produto(s) sem estoque reduziram a nota.`); }
    if (d.estoqueCritico.length === 0) { score += 15; j.push('✅ Nenhum produto com estoque crítico.'); } else { const pts = Math.max(0, 15 - d.estoqueCritico.length * 2); score += pts; j.push(`🟠 ${d.estoqueCritico.length} produto(s) crítico(s) reduziram a nota.`); }
    if (d.totalProdutos > 0) { score += 15; j.push('✅ Sistema com produtos cadastrados.'); }
    if (scannerLeituras.length > 0) { score += 10; j.push('✅ Scanner sendo utilizado ativamente.'); }
    if (d.paradosList.length <= 5) { score += 10; j.push('✅ Poucos produtos parados.'); } else { j.push(`🟡 ${d.paradosList.length} produtos parados afetaram a nota.`); score += Math.max(0, 10 - Math.floor(d.paradosList.length / 3)); }
    if (d.catsArray.length >= 3) { score += 10; }
    if (d.valorTotal > 0) { score += 10; j.push('✅ Valor do estoque calculado.'); }
    if (d.cadastradosSemana.length > 0) { score += 5; j.push('✅ Cadastros recentes detectados.'); }
    if (comandosExecutados > 5) { score += 5; }
    score = Math.max(0, Math.min(100, score));
    let nivel: string, cor: string, corBarra: string;
    if (score >= 85) { nivel = 'Excelente'; cor = 'text-emerald-600'; corBarra = '#10b981'; }
    else if (score >= 70) { nivel = 'Boa'; cor = 'text-blue-600'; corBarra = '#3b82f6'; }
    else if (score >= 55) { nivel = 'Regular'; cor = 'text-amber-600'; corBarra = '#f59e0b'; }
    else if (score >= 35) { nivel = 'Ruim'; cor = 'text-orange-600'; corBarra = '#f97316'; }
    else { nivel = 'Crítica'; cor = 'text-red-600'; corBarra = '#ef4444'; }
    return { nota: score, nivel, cor, corBarra, justificativas: j };
  }, [dashboardData, scannerLeituras, comandosExecutados]);

  const rankingEficiencia = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    type Ranking = { area: string; pct: number; icon: string; medalha: string; cor: string; bg: string };
    const completude = d.totalProdutos > 0 ? Math.min(100, Math.round(((d.totalProdutos - (d.semEstoque.length + d.estoqueCritico.length)) / Math.max(d.totalProdutos, 1)) * 100)) : 0;
    const scannerPct = scannerLeituras.length > 0 ? Math.min(100, 60 + scannerLeituras.length * 3) : 30;
    const reposicaoPct = d.semEstoque.length === 0 ? 100 : Math.max(0, 100 - d.semEstoque.length * 6);
    const precoPct = Math.min(100, 65 + d.totalProdutos * 0.5);
    const orgPct = Math.min(100, 90 - Math.max(0, (d.paradosList.length - 5) * 2));
    const catsPct = d.catsArray.length >= 3 ? Math.min(100, 50 + d.catsArray.length * 4) : 40;
    const r: Ranking[] = [];
    const med = (pct: number) => pct >= 90 ? '🥇' : pct >= 75 ? '🥈' : pct >= 50 ? '🥉' : '🏅';
    const corPct = (pct: number) => pct >= 90 ? 'text-amber-500' : pct >= 75 ? 'text-slate-400' : pct >= 50 ? 'text-amber-700' : 'text-slate-500';
    const bgPct = (pct: number) => pct >= 90 ? 'bg-amber-50' : pct >= 75 ? 'bg-slate-50' : pct >= 50 ? 'bg-amber-50' : 'bg-slate-50';
    r.push({ area: 'Cadastro', pct: completude, icon: '📋', medalha: med(completude), cor: corPct(completude), bg: bgPct(completude) });
    r.push({ area: 'Scanner', pct: scannerPct, icon: '📷', medalha: med(scannerPct), cor: corPct(scannerPct), bg: bgPct(scannerPct) });
    r.push({ area: 'Reposição', pct: reposicaoPct, icon: '🔄', medalha: med(reposicaoPct), cor: corPct(reposicaoPct), bg: bgPct(reposicaoPct) });
    r.push({ area: 'Preço', pct: precoPct, icon: '💰', medalha: med(precoPct), cor: corPct(precoPct), bg: bgPct(precoPct) });
    r.push({ area: 'Organização', pct: orgPct, icon: '🗂️', medalha: med(orgPct), cor: corPct(orgPct), bg: bgPct(orgPct) });
    r.push({ area: 'Categorias', pct: catsPct, icon: '📂', medalha: med(catsPct), cor: corPct(catsPct), bg: bgPct(catsPct) });
    return r;
  }, [dashboardData, scannerLeituras]);

  const missoesDefault = useMemo(() => [
    { id: 'ms-criticos', texto: 'Conferir produtos com estoque crítico', concluida: false, icon: '🔍', cor: 'border-l-amber-500' },
    { id: 'ms-precos', texto: 'Atualizar preços abaixo da média', concluida: false, icon: '💰', cor: 'border-l-yellow-500' },
    { id: 'ms-organizar', texto: `Organizar categoria ${dashboardData?.maiorCategoria?.nome || 'principal'}`, concluida: false, icon: '📂', cor: 'border-l-blue-500' },
    { id: 'ms-semestoque', texto: 'Revisar produtos sem estoque', concluida: false, icon: '🚫', cor: 'border-l-red-500' },
    { id: 'ms-scanner', texto: 'Validar funcionamento do scanner', concluida: false, icon: '📷', cor: 'border-l-sky-500' },
    { id: 'ms-cadastros', texto: 'Conferir novos cadastros da semana', concluida: false, icon: '📝', cor: 'border-l-emerald-500' },
  ], [dashboardData]);

  const insightsPremium = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const inss: { icon: string; texto: string; impacto: string; dificuldade: string; tempo: string; retorno: string; cor: string; bg: string }[] = [];
    if (d.maiorCategoria && d.maiorCategoria.qtd < 20) inss.push({ icon: '📈', texto: `Se aumentar o estoque de "${d.maiorCategoria.nome}" em +20 itens, o valor do estoque crescerá ~${Math.round(20 * (Number(d.maisCaro?.precoVenda) || d.precoMedio) / (d.valorTotal || 1) * 100)}%.`, impacto: 'Alto', dificuldade: 'Média', tempo: '2 dias', retorno: '7-15 dias', cor: 'text-blue-700', bg: 'bg-blue-50' });
    const precosAltos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > (d.precoMedio * 1.8) && (p.quantidade || 0) > 0);
    if (precosAltos.length > 0) inss.push({ icon: '📉', texto: `Se reduzir o preço de ${precosAltos.length} produto(s) acima da média, pode aumentar o giro e liberar até R$ ${(precosAltos.reduce((s, p) => s + (Number(p.precoVenda) || 0) * (p.quantidade || 0), 0) * 0.2).toFixed(2).replace('.', ',')} em capital.`, impacto: 'Alto', dificuldade: 'Baixa', tempo: '1 dia', retorno: 'Imediato', cor: 'text-amber-700', bg: 'bg-amber-50' });
    const semLoc = todosProdutos.filter(p => !(p as any).localizacao || (p as any).localizacao === '');
    if (semLoc.length > 0) inss.push({ icon: '📍', texto: `Se organizar a localização de ${semLoc.length} produto(s), reduzirá o tempo de busca e melhorará a eficiência operacional.`, impacto: 'Médio', dificuldade: 'Baixa', tempo: '2h', retorno: 'Contínuo', cor: 'text-emerald-700', bg: 'bg-emerald-50' });
    if (d.paradosList.length > 5) inss.push({ icon: '🚚', texto: `Se transferir ${d.paradosList.length} produto(s) parados para a loja, liberará espaço e capital de giro estimado em ~15%.`, impacto: 'Médio', dificuldade: 'Média', tempo: '3h', retorno: '1 semana', cor: 'text-purple-700', bg: 'bg-purple-50' });
    if (d.catsArray.length > 0) { const menor = d.catsArray[d.catsArray.length - 1]; if (menor && menor.qtd <= 2) inss.push({ icon: '🌱', texto: `Se expandir "${menor.nome}" com +5 itens, reduzirá a concentração e aumentará a cobertura de mercado.`, impacto: 'Baixo', dificuldade: 'Alta', tempo: '5 dias', retorno: '30 dias', cor: 'text-sky-700', bg: 'bg-sky-50' }); }
    return inss;
  }, [dashboardData, todosProdutos]);

  const centralDecisoes = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const dec: { acao: string; motivo: string; icon: string; cor: string; bg: string; border: string; urgencia: string }[] = [];
    if (d.semEstoque.length > 0) dec.push({ acao: 'Comprar agora', motivo: `${d.semEstoque.length} produto(s) zerado(s) — risco de perda de vendas.`, icon: '🛒', cor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', urgencia: 'Urgente' });
    if (d.estoqueCritico.length > 0 && d.semEstoque.length === 0) dec.push({ acao: 'Comprar em breve', motivo: `${d.estoqueCritico.length} produto(s) crítico(s) — estoque pode zerar em breve.`, icon: '📋', cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', urgencia: 'Alta' });
    if (d.paradosList.length > 5) dec.push({ acao: 'Promover / Transferir', motivo: `${d.paradosList.length} itens parados — crie promoções ou transfira para a loja.`, icon: '📢', cor: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300', urgencia: 'Média' });
    if (d.precoMedio > 0) dec.push({ acao: 'Revisar precificação', motivo: `Preço médio: R$ ${d.precoMedio.toFixed(2).replace('.', ',')} — avalie competitividade.`, icon: '💰', cor: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300', urgencia: 'Média' });
    dec.push({ acao: 'Reorganizar estoque', motivo: `${d.totalProdutos} produtos em ${d.catsArray.length} categorias — mantenha a organização.`, icon: '🗂️', cor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', urgencia: 'Baixa' });
    return dec;
  }, [dashboardData]);

  const iaObservando = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const obs: { icon: string; texto: string; cor: string; bg: string }[] = [];
    obs.push({ icon: '👁️', texto: `A IA está monitorando ${d.totalProdutos} produtos em tempo real.`, cor: 'text-indigo-600', bg: 'bg-indigo-50' });
    if (d.maiorCategoria && d.valorTotal > 0) obs.push({ icon: '📊', texto: `A IA identificou que ${d.maiorCategoria.nome} é a categoria dominante (${Math.round((d.maiorCategoria.valor / d.valorTotal) * 100)}% do valor).`, cor: 'text-blue-600', bg: 'bg-blue-50' });
    const maisCaros = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > (d.precoMedio * 2));
    if (maisCaros.length > 0) obs.push({ icon: '💎', texto: `A IA encontrou ${maisCaros.length} produto(s) com valor significativamente acima da média.`, cor: 'text-purple-600', bg: 'bg-purple-50' });
    if (d.paradosList.length > 5) obs.push({ icon: '⏸️', texto: `A IA detectou ${d.paradosList.length} produto(s) com estoque parado elevado.`, cor: 'text-amber-600', bg: 'bg-amber-50' });
    if (d.cadastradosSemana.length > 0) obs.push({ icon: '🆕', texto: `A IA notou ${d.cadastradosSemana.length} novo(s) cadastro(s) nesta semana.`, cor: 'text-emerald-600', bg: 'bg-emerald-50' });
    const semLoc = todosProdutos.filter(p => !(p as any).localizacao || (p as any).localizacao === '').length;
    if (semLoc > 0) obs.push({ icon: '📍', texto: `A IA encontrou ${semLoc} produto(s) sem localização definida.`, cor: 'text-sky-600', bg: 'bg-sky-50' });
    return obs;
  }, [dashboardData, todosProdutos]);

  const memoriaIA = useMemo(() => {
    const mem: { label: string; valor: string; icon: string }[] = [];
    const conversaAtual = conversations.find(c => c.id === activeConversaId);
    mem.push({ label: 'Última conversa', valor: conversaAtual ? conversaAtual.titulo : 'Nenhuma', icon: '💬' });
    mem.push({ label: 'Último scanner', valor: scannerUltimoCodigo ? scannerUltimoCodigo.substring(0, 30) : 'Nenhum', icon: '📷' });
    const ultimoHistorico = historicoAcoes.length > 0 ? historicoAcoes[historicoAcoes.length - 1] : null;
    mem.push({ label: 'Última alteração', valor: ultimoHistorico ? ultimoHistorico.resumo : 'Nenhuma', icon: '✏️' });
    mem.push({ label: 'Último cadastro', valor: todosProdutos.length > 0 ? todosProdutos[todosProdutos.length - 1].nome : 'Nenhum', icon: '📝' });
    mem.push({ label: 'Última pesquisa', valor: pesquisaSidebar || 'Nenhuma', icon: '🔎' });
    if (dashboardData) mem.push({ label: 'Produtos monitorados', valor: `${dashboardData.totalProdutos} itens`, icon: '📦' });
    return mem;
  }, [conversations, activeConversaId, scannerUltimoCodigo, historicoAcoes, todosProdutos, pesquisaSidebar, dashboardData]);

  const statusIACopiloto = useMemo(() => {
    if (!dashboardData) return [{ texto: 'Aguardando dados do estoque...', icon: '⏳', cor: 'text-slate-500', bg: 'bg-slate-100' }];
    const d = dashboardData;
    const status: { texto: string; icon: string; cor: string; bg: string }[] = [];
    status.push({ texto: `Monitorando ${d.totalProdutos} produtos`, icon: '📡', cor: 'text-indigo-600', bg: 'bg-indigo-100' });
    if (d.semEstoque.length > 0) status.push({ texto: `Alerta: ${d.semEstoque.length} produto(s) sem estoque`, icon: '🔴', cor: 'text-red-600', bg: 'bg-red-100' });
    if (d.estoqueCritico.length > 0) status.push({ texto: `Atenção: ${d.estoqueCritico.length} crítico(s)`, icon: '⚠️', cor: 'text-amber-600', bg: 'bg-amber-100' });
    status.push({ texto: `Analisando preços (média: R$ ${d.precoMedio.toFixed(2).replace('.', ',')})`, icon: '📊', cor: 'text-emerald-600', bg: 'bg-emerald-100' });
    status.push({ texto: `Organizando ${d.catsArray.length} categorias`, icon: '🗂️', cor: 'text-blue-600', bg: 'bg-blue-100' });
    status.push({ texto: 'Aguardando comandos...', icon: '🎯', cor: 'text-purple-600', bg: 'bg-purple-100' });
    return status;
  }, [dashboardData]);

  const simulacoesRespostas = useCallback((pergunta: string): { resposta: string; icon: string } | null => {
    if (!dashboardData) return null;
    const d = dashboardData;
    const q = pergunta.toLowerCase().trim();
    const respostas: { gatilhos: string[]; resposta: string; icon: string }[] = [
      { gatilhos: ['acha', 'recomenda', 'recomendaria', 'sugere', 'faria', 'que fazer', 'o que fazer'], resposta: `Eu recomendaria focar primeiro nos ${d.semEstoque.length > 0 ? `${d.semEstoque.length} produto(s) sem estoque` : 'produtos com estoque crítico'}. Depois revisaria os preços e organização das categorias.`, icon: '💡' },
      { gatilhos: ['categoria', 'categoria merece', 'qual categoria', 'atenção'], resposta: d.maiorCategoria ? `A categoria que mais merece atenção é "${d.maiorCategoria.nome}" — ela representa ${Math.round((d.maiorCategoria.valor / (d.valorTotal || 1)) * 100)}% do valor total do estoque.` : 'Todas as categorias estão equilibradas no momento.', icon: '📂' },
      { gatilhos: ['estoque', 'saude', 'saúde', 'como esta', 'como está', 'panorama', 'geral'], resposta: `O estoque está ${d.semEstoque.length === 0 && d.estoqueCritico.length === 0 ? 'saudável' : 'com alguns pontos de atenção'}. São ${d.totalProdutos} produtos, ${d.semEstoque.length} zerados e ${d.estoqueCritico.length} críticos. O valor total é de ${d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, icon: '📊' },
      { gatilhos: ['critico', 'crítico', 'acabando', 'baixo'], resposta: d.estoqueCritico.length > 0 ? `Sim, ${d.estoqueCritico.length} produto(s) estão com estoque crítico: ${d.estoqueCritico.slice(0, 4).map(p => p.nome).join(', ')}${d.estoqueCritico.length > 4 ? ' e outros.' : '.'} Recomendo reposição urgente.` : 'Não há produtos com estoque crítico no momento — ótimo trabalho!', icon: '⚠️' },
      { gatilhos: ['sem estoque', 'zerado', 'faltando', 'acabou'], resposta: d.semEstoque.length > 0 ? `Infelizmente ${d.semEstoque.length} produto(s) estão zerados: ${d.semEstoque.slice(0, 4).map(p => p.nome).join(', ')}${d.semEstoque.length > 4 ? ' e outros.' : '.'} Prioridade máxima de compra.` : 'Excelente — não há produtos zerados no momento!', icon: '🚫' },
      { gatilhos: ['preco', 'preço', 'precificacao', 'precificação', 'valor'], resposta: `O preço médio do estoque é R$ ${d.precoMedio.toFixed(2).replace('.', ',')}. O produto mais caro é "${d.maisCaro?.nome || 'N/A'}" (R$ ${d.maisCaro ? Number(d.maisCaro.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '0,00'}) e o mais barato é "${d.maisBarato?.nome || 'N/A'}" (R$ ${d.maisBarato ? Number(d.maisBarato.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '0,00'}).`, icon: '💰' },
      { gatilhos: ['parado', 'parados', 'encalhado', 'sem movimento', 'sem movimentação'], resposta: d.paradosList.length > 0 ? `Temos ${d.paradosList.length} produto(s) com estoque parado elevado. Os principais: ${d.paradosList.slice(0, 3).map(p => `${p.nome} (${p.quantidade} un.)`).join(', ')}. Sugiro promoções ou transferência para a loja.` : 'Não há produtos com estoque parado excessivo. Giro saudável!', icon: '⏸️' },
      { gatilhos: ['cadastro', 'cadastrados', 'novos', 'recente'], resposta: d.cadastradosSemana.length > 0 ? `${d.cadastradosSemana.length} produto(s) foram cadastrados nesta semana. Os cadastros estão consistentes, mas recomendo revisar os dados periodicamente.` : 'Nenhum cadastro novo nesta semana — o catálogo está estável.', icon: '📝' },
      { gatilhos: ['scanner', 'leitura', 'codigo de barras', 'código de barras'], resposta: scannerLeituras.length > 0 ? `O scanner foi utilizado ${scannerLeituras.length} vez(es). Última leitura: ${scannerUltimoCodigo || 'N/A'}. Continue usando para agilizar o trabalho!` : 'O scanner ainda não foi utilizado nesta sessão — está pronto para uso.', icon: '📷' },
      { gatilhos: ['organizar', 'organizacao', 'organização', 'layout'], resposta: `Com ${d.totalProdutos} produtos em ${d.catsArray.length} categorias, sugiro organizar por ordem de giro: itens mais vendidos na frente, parados no fundo. ${d.paradosList.length > 5 ? `Há ${d.paradosList.length} itens que precisam ser reposicionados.` : 'A organização atual parece adequada.'}`, icon: '🗂️' },
      { gatilhos: ['comprar', 'compra', 'reposicao', 'reposição', 'repor'], resposta: `Prioridade de compra: ${d.semEstoque.length > 0 ? `${d.semEstoque.length} zerados (urgente)` : 'nenhum zerado'}, ${d.estoqueCritico.length > 0 ? `${d.estoqueCritico.length} críticos` : 'nenhum crítico'}. Valor estimado para reposição: ${((d.semEstoque.length + d.estoqueCritico.length) * Number(d.precoMedio || 50)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, icon: '🛒' },
      { gatilhos: ['resumo', 'hoje', 'dia', 'como foi'], resposta: `Resumo: ${d.totalProdutos} produtos em ${d.catsArray.length} categorias. ${d.semEstoque.length} zerados, ${d.estoqueCritico.length} críticos. Scanner: ${scannerLeituras.length} leituras. Comandos: ${comandosExecutados}. Valor total: ${d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`, icon: '📋' },
      { gatilhos: ['bom dia', 'ola', 'olá', 'oi', 'hey'], resposta: `Olá! 👋 Sou o Copiloto Executivo do estoque. Hoje temos ${d.totalProdutos} produtos monitorados. ${d.semEstoque.length > 0 || d.estoqueCritico.length > 0 ? `Há ${d.semEstoque.length + d.estoqueCritico.length} itens que precisam de atenção.` : 'Estoque saudável — tudo em ordem!'} Como posso ajudar?`, icon: '🤖' },
      { gatilhos: ['obrigado', 'valeu', 'obrigada', 'thanks'], resposta: 'Por nada! 🏍️ Estou sempre aqui monitorando o estoque. Se precisar de mais alguma análise ou recomendação, é só perguntar.', icon: '😊' },
      { gatilhos: ['top', 'mais vendido', 'mais caro', 'mais barato'], resposta: `O produto mais caro é "${d.maisCaro?.nome || 'N/A'}" (R$ ${d.maisCaro ? Number(d.maisCaro.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '0,00'}). O mais barato com estoque é "${d.maisBarato?.nome || 'N/A'}" (R$ ${d.maisBarato ? Number(d.maisBarato.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '0,00'}).`, icon: '🏆' },
      { gatilhos: ['dominante', 'concentracao', 'concentração', 'domina'], resposta: d.maiorCategoria && d.valorTotal > 0 ? `A categoria "${d.maiorCategoria.nome}" concentra ${Math.round((d.maiorCategoria.valor / d.valorTotal) * 100)}% do valor do estoque. ${Math.round((d.maiorCategoria.valor / d.valorTotal) * 100) > 40 ? 'Isso indica concentração — considere diversificar.' : 'Nível de concentração aceitável.'}` : 'As categorias estão bem distribuídas.', icon: '🎯' },
      { gatilhos: ['melhorar', 'melhoria', 'melhor', 'otimizar'], resposta: `Para melhorar o estoque, sugiro: 1) ${d.semEstoque.length > 0 ? 'Repor produtos zerados' : 'Manter nível atual'}, 2) ${d.estoqueCritico.length > 0 ? 'Reforçar estoque crítico' : 'Continuar monitorando'}, 3) ${d.paradosList.length > 5 ? 'Criar promoções para itens parados' : 'Manter o bom giro'}, 4) Usar o scanner regularmente.`, icon: '📈' },
    ];
    for (const r of respostas) {
      for (const g of r.gatilhos) {
        if (q.includes(g)) return { resposta: r.resposta, icon: r.icon };
      }
    }
    return { resposta: `Entendi sua pergunta sobre "${pergunta}". Com base nos dados atuais: temos ${d.totalProdutos} produtos, ${d.semEstoque.length} zerados, ${d.estoqueCritico.length} críticos. O estoque vale ${d.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Como posso ajudar especificamente?`, icon: '🤖' };
  }, [dashboardData, scannerLeituras, comandosExecutados, scannerUltimoCodigo]);

  // ============================================================
  // AUTOMAÇÃO INTELIGENTE (FASE 12) — Computações
  // ============================================================
  const tarefasDefault = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const t: { id: string; texto: string; prioridade: string; tempo: string; dificuldade: string; categoria: string; status: 'pendente'; icon: string; cor: string }[] = [];
    const precosBaixos = todosProdutos.filter(p => (Number(p.precoVenda) || 0) > 0 && (Number(p.precoVenda) || 0) < (d.precoMedio * 0.7) && (p.quantidade || 0) > 0).length;
    if (precosBaixos > 0) t.push({ id: 'at-precos', texto: `Atualizar preço de ${precosBaixos} produto(s) abaixo da média`, prioridade: 'Alta', tempo: `${precosBaixos * 2} min`, dificuldade: 'Média', categoria: 'Precificação', status: 'pendente', icon: '💰', cor: 'border-l-yellow-500' });
    if (d.maiorCategoria) t.push({ id: 'at-revisar-cat', texto: `Revisar categoria ${d.maiorCategoria.nome} (${d.maiorCategoria.qtd} itens)`, prioridade: 'Média', tempo: '15 min', dificuldade: 'Baixa', categoria: 'Organização', status: 'pendente', icon: '📂', cor: 'border-l-blue-500' });
    const semLoc = todosProdutos.filter(p => !(p as any).localizacao || (p as any).localizacao === '').length;
    if (semLoc > 0) t.push({ id: 'at-localizacao', texto: `Organizar ${semLoc} peça(s) sem localização`, prioridade: 'Média', tempo: `${semLoc * 3} min`, dificuldade: 'Baixa', categoria: 'Organização', status: 'pendente', icon: '📍', cor: 'border-l-indigo-500' });
    if (d.semEstoque.length > 0) t.push({ id: 'at-zerados', texto: `Conferir ${d.semEstoque.length} produto(s) zerado(s)`, prioridade: 'Crítica', tempo: '10 min', dificuldade: 'Baixa', categoria: 'Compras', status: 'pendente', icon: '🚫', cor: 'border-l-red-500' });
    if (d.cadastradosHoje.length > 0) t.push({ id: 'at-cadastros-hoje', texto: `Validar ${d.cadastradosHoje.length} produto(s) cadastrados hoje`, prioridade: 'Baixa', tempo: `${d.cadastradosHoje.length * 3} min`, dificuldade: 'Baixa', categoria: 'Cadastro', status: 'pendente', icon: '📝', cor: 'border-l-emerald-500' });
    const semForn = todosProdutos.filter(p => !(p as any).fornecedor || (p as any).fornecedor === '').length;
    if (semForn > 0) t.push({ id: 'at-fornecedor', texto: `Conferir ${semForn} produto(s) sem fornecedor`, prioridade: 'Média', tempo: `${semForn * 2} min`, dificuldade: 'Baixa', categoria: 'Cadastro', status: 'pendente', icon: '🏭', cor: 'border-l-sky-500' });
    t.push({ id: 'at-imagem', texto: 'Revisar produtos sem imagem cadastrada', prioridade: 'Baixa', tempo: '15 min', dificuldade: 'Baixa', categoria: 'Cadastro', status: 'pendente', icon: '🖼️', cor: 'border-l-slate-500' });
    return t;
  }, [dashboardData, todosProdutos]);

  const rotinaInteligente = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    return [
      { hora: '08:00', tarefa: 'Conferir estoque crítico e zerados', icon: '🔍', detalhe: `${d.semEstoque.length} zerados, ${d.estoqueCritico.length} críticos`, cor: d.semEstoque.length + d.estoqueCritico.length > 0 ? 'text-amber-600' : 'text-emerald-600' },
      { hora: '09:00', tarefa: 'Atualizar preços e precificação', icon: '💰', detalhe: `Média atual: R$ ${d.precoMedio.toFixed(2).replace('.', ',')}`, cor: 'text-yellow-600' },
      { hora: '10:00', tarefa: 'Validar novos produtos cadastrados', icon: '📝', detalhe: d.cadastradosSemana.length > 0 ? `${d.cadastradosSemana.length} na semana` : 'Nenhum novo', cor: d.cadastradosSemana.length > 0 ? 'text-emerald-600' : 'text-slate-400' },
      { hora: '11:00', tarefa: 'Revisar produtos com estoque crítico', icon: '⚠️', detalhe: d.estoqueCritico.length > 0 ? `${d.estoqueCritico.length} itens` : 'Nenhum crítico', cor: d.estoqueCritico.length > 0 ? 'text-amber-600' : 'text-emerald-600' },
      { hora: '13:00', tarefa: 'Organizar categorias e localização', icon: '🗂️', detalhe: `${d.catsArray.length} categorias ativas`, cor: 'text-blue-600' },
      { hora: '14:00', tarefa: 'Conferir scanner e dispositivos', icon: '📷', detalhe: scannerLeituras.length > 0 ? `${scannerLeituras.length} leituras` : 'Sem uso', cor: scannerLeituras.length > 0 ? 'text-sky-600' : 'text-slate-400' },
      { hora: '15:00', tarefa: 'Emitir relatório de conferência', icon: '📊', detalhe: `${d.totalProdutos} produtos analisados`, cor: 'text-purple-600' },
      { hora: '16:00', tarefa: 'Fechar conferência do dia', icon: '✅', detalhe: 'Revisão final', cor: 'text-emerald-600' },
    ];
  }, [dashboardData, scannerLeituras]);

  const planejadorReposicao = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const itens: { oque: string; quanto: number; categoria: string; urgencia: string; impacto: string; motivo: string; icon: string; cor: string; bg: string }[] = [];
    if (d.semEstoque.length > 0) {
      const topZerados = d.semEstoque.slice(0, 3);
      for (const p of topZerados) itens.push({ oque: p.nome, quanto: Math.max(5, p.estoqueMinimo || 5) * 2, categoria: p.categoria?.nome || 'Geral', urgencia: 'Urgente', impacto: 'Alto', motivo: 'Produto zerado — risco de perda de vendas', icon: '🔴', cor: 'text-red-700', bg: 'bg-red-50' });
    }
    if (d.estoqueCritico.length > 0) {
      const topCritico = d.estoqueCritico.filter(ec => !d.semEstoque.some(se => se.id === ec.id)).slice(0, 2);
      for (const p of topCritico) {
        const minimo = p.estoqueMinimo || 5;
        itens.push({ oque: p.nome, quanto: Math.max(minimo * 2, 10) - (p.quantidade || 0), categoria: p.categoria?.nome || 'Geral', urgencia: 'Alta', impacto: 'Médio', motivo: `Estoque baixo (${p.quantidade} un. / mín. ${minimo})`, icon: '⚠️', cor: 'text-amber-700', bg: 'bg-amber-50' });
      }
    }
    if (itens.length === 0) itens.push({ oque: 'Nenhum produto precisa de reposição', quanto: 0, categoria: '-', urgencia: 'Nenhuma', impacto: '-', motivo: 'Estoque saudável', icon: '✅', cor: 'text-emerald-700', bg: 'bg-emerald-50' });
    return itens;
  }, [dashboardData]);

  const iaOrganizacao = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const sugs: { icon: string; texto: string; acao: string; motivo: string; cor: string; bg: string }[] = [];
    if (d.paradosList.length > 5) sugs.push({ icon: '📦', texto: `Mover ${d.paradosList.length} peças paradas para área de giro rápido`, acao: 'Mover peças', motivo: 'Estoque parado elevado — liberar espaço', cor: 'text-purple-700', bg: 'bg-purple-50' });
    if (d.catsArray.length >= 4) {
      const pequenas = d.catsArray.filter(c => c.qtd > 0 && c.qtd <= 3);
      if (pequenas.length >= 2) sugs.push({ icon: '📂', texto: `Agrupar categorias pequenas: ${pequenas.map(c => c.nome).slice(0, 2).join(', ')}`, acao: 'Agrupar categorias', motivo: `${pequenas.length} categorias com poucos itens`, cor: 'text-blue-700', bg: 'bg-blue-50' });
    }
    const semForn = todosProdutos.filter(p => !(p as any).fornecedor || (p as any).fornecedor === '').length;
    if (semForn > 0) sugs.push({ icon: '🏭', texto: `Adicionar fornecedor para ${semForn} produto(s)`, acao: 'Adicionar fornecedor', motivo: 'Cadastro incompleto — dificulta reposição', cor: 'text-sky-700', bg: 'bg-sky-50' });
    const semLoc = todosProdutos.filter(p => !(p as any).localizacao || (p as any).localizacao === '').length;
    if (semLoc > 0) sugs.push({ icon: '📍', texto: `Adicionar localização para ${semLoc} produto(s)`, acao: 'Adicionar localização', motivo: 'Sem localização — dificulta encontrar', cor: 'text-indigo-700', bg: 'bg-indigo-50' });
    sugs.push({ icon: '✏️', texto: 'Padronizar nomes de produtos similares', acao: 'Padronizar nomes', motivo: 'Melhorar busca e organização', cor: 'text-emerald-700', bg: 'bg-emerald-50' });
    return sugs;
  }, [dashboardData, todosProdutos]);

  const assistenteAuditoria = useMemo(() => {
    if (!dashboardData || !todosProdutos.length) return [];
    const d = dashboardData;
    const itens: { problema: string; qtd: number; severidade: string; icon: string; cor: string; bg: string }[] = [];
    const semCategoria = todosProdutos.filter(p => !p.categoria || p.categoria.slug === 'outros').length;
    const semPreco = todosProdutos.filter(p => (Number(p.precoVenda) || 0) <= 0).length;
    const semEstoque = todosProdutos.filter(p => (p.quantidade || 0) <= 0).length;
    const semForn = todosProdutos.filter(p => !(p as any).fornecedor || (p as any).fornecedor === '').length;
    const semLoc = todosProdutos.filter(p => !(p as any).localizacao || (p as any).localizacao === '').length;
    if (semCategoria > 0) itens.push({ problema: 'Sem categoria definida', qtd: semCategoria, severidade: 'Alta', icon: '📂', cor: 'text-red-600', bg: 'bg-red-50' });
    if (semPreco > 0) itens.push({ problema: 'Sem preço cadastrado', qtd: semPreco, severidade: 'Crítica', icon: '💰', cor: 'text-red-600', bg: 'bg-red-50' });
    if (semEstoque > 0) itens.push({ problema: 'Sem estoque', qtd: semEstoque, severidade: 'Crítica', icon: '🚫', cor: 'text-red-600', bg: 'bg-red-50' });
    if (semForn > 0) itens.push({ problema: 'Sem fornecedor', qtd: semForn, severidade: 'Média', icon: '🏭', cor: 'text-amber-600', bg: 'bg-amber-50' });
    if (semLoc > 0) itens.push({ problema: 'Sem localização', qtd: semLoc, severidade: 'Média', icon: '📍', cor: 'text-amber-600', bg: 'bg-amber-50' });
    itens.push({ problema: 'Sem imagem', qtd: todosProdutos.length, severidade: 'Baixa', icon: '🖼️', cor: 'text-slate-600', bg: 'bg-slate-50' });
    if (d.cadastradosSemana.length > 0) itens.push({ problema: 'Cadastros recentes (revisar)', qtd: d.cadastradosSemana.length, severidade: 'Baixa', icon: '📝', cor: 'text-blue-600', bg: 'bg-blue-50' });
    return itens;
  }, [dashboardData, todosProdutos]);

  const centroProdutividade = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    return [
      { label: 'Tempo economizado', valor: `${Math.max(10, scannerLeituras.length * 2 + comandosExecutados * 5)} min`, icon: '⏱️', cor: 'text-emerald-600', bg: 'bg-emerald-50', pct: Math.min(100, scannerLeituras.length * 5 + comandosExecutados * 10) },
      { label: 'Comandos executados', valor: comandosExecutados.toString(), icon: '⚡', cor: 'text-amber-600', bg: 'bg-amber-50', pct: Math.min(100, comandosExecutados * 5) },
      { label: 'Scanner utilizado', valor: `${scannerLeituras.length}x`, icon: '📷', cor: 'text-sky-600', bg: 'bg-sky-50', pct: Math.min(100, scannerLeituras.length * 8) },
      { label: 'Cadastros na semana', valor: d.cadastradosSemana.length.toString(), icon: '📝', cor: 'text-purple-600', bg: 'bg-purple-50', pct: Math.min(100, d.cadastradosSemana.length * 15) },
      { label: 'Alterações realizadas', valor: historicoAcoes.filter(h => h.resultado === 'sucesso').length.toString(), icon: '✅', cor: 'text-indigo-600', bg: 'bg-indigo-50', pct: Math.min(100, historicoAcoes.length * 8) },
      { label: 'Pesquisas realizadas', valor: pesquisaSidebar ? '1' : '0', icon: '🔎', cor: 'text-rose-600', bg: 'bg-rose-50', pct: pesquisaSidebar ? 60 : 10 },
    ];
  }, [dashboardData, scannerLeituras, comandosExecutados, historicoAcoes, pesquisaSidebar]);

  const iaPensandoSteps = useMemo(() => [
    { texto: 'Analisando estrutura do estoque...', icon: '🔍' },
    { texto: 'Encontrando produtos críticos e zerados...', icon: '⚠️' },
    { texto: 'Calculando distribuição por categorias...', icon: '📂' },
    { texto: 'Comparando preços e margens...', icon: '💰' },
    { texto: 'Verificando cadastros e fornecedores...', icon: '📝' },
    { texto: 'Avaliando uso do scanner e comandos...', icon: '📷' },
    { texto: 'Resultado encontrado. Recomendações prontas! ✅', icon: '🧠' },
  ], []);

  // ============================================================
  // IA COMERCIAL, COMPRAS E FORNECEDORES (FASE 13) — Computações
  // ============================================================
  const centralCompras = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const itens: { id: string; nome: string; categoria: string; qtdSugerida: number; estoqueAtual: number; estoqueIdeal: number; urgencia: string; prioridade: string; motivo: string; icon: string }[] = [];
    for (const p of d.semEstoque.slice(0, 5)) {
      const ideal = Math.max(10, (p.estoqueMinimo || 5) * 3);
      itens.push({ id: `comp-${p.id || p.nome}`, nome: p.nome, categoria: p.categoria?.nome || 'Geral', qtdSugerida: ideal, estoqueAtual: 0, estoqueIdeal: ideal, urgencia: 'Urgente', prioridade: 'Crítica', motivo: 'Produto zerado — risco imediato de perda de vendas', icon: '🔴' });
    }
    for (const p of d.estoqueCritico.filter(ec => !d.semEstoque.some(se => se.id === ec.id)).slice(0, 5)) {
      const ideal = Math.max(10, (p.estoqueMinimo || 5) * 2);
      itens.push({ id: `comp-${p.id || p.nome}`, nome: p.nome, categoria: p.categoria?.nome || 'Geral', qtdSugerida: ideal - (p.quantidade || 0), estoqueAtual: p.quantidade || 0, estoqueIdeal: ideal, urgencia: 'Alta', prioridade: 'Alta', motivo: `Estoque baixo (${p.quantidade || 0} un.) — risco de ruptura em breve`, icon: '⚠️' });
    }
    if (d.maisVendidosSimulado.length > 0) {
      const top = d.maisVendidosSimulado[0];
      if (!itens.some(i => i.nome === top.nome)) itens.push({ id: `comp-${top.id || top.nome}`, nome: top.nome, categoria: top.categoria?.nome || 'Geral', qtdSugerida: Math.max(5, (top.estoqueMinimo || 5) * 2), estoqueAtual: top.quantidade || 0, estoqueIdeal: Math.max(15, (top.estoqueMinimo || 5) * 2), urgencia: 'Média', prioridade: 'Média', motivo: 'Alto giro — manter estoque de segurança', icon: '🟡' });
    }
    return itens;
  }, [dashboardData]);

  const centralFornecedores = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const fornecs: { fornecedor: string; tipo: string; produtos: number; ultimaCompra: string; confiabilidade: number; prazoMedio: string; precoMedio: string; icon: string }[] = [
      { fornecedor: 'MotoParts Brasil', tipo: 'Principal', produtos: Math.round(d.totalProdutos * 0.4), ultimaCompra: '15/07/2026', confiabilidade: 92, prazoMedio: '3 dias', precoMedio: ((d as any).precoCusto || d.precoMedio * 0.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: '🏭' },
      { fornecedor: 'Distribuidora Duas Rodas', tipo: 'Alternativo', produtos: Math.round(d.totalProdutos * 0.25), ultimaCompra: '02/07/2026', confiabilidade: 85, prazoMedio: '5 dias', precoMedio: (((d as any).precoCusto || d.precoMedio * 0.5) * 0.9).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: '🚚' },
      { fornecedor: 'Mega Peças Motociclo', tipo: 'Alternativo', produtos: Math.round(d.totalProdutos * 0.2), ultimaCompra: '28/06/2026', confiabilidade: 78, prazoMedio: '7 dias', precoMedio: (((d as any).precoCusto || d.precoMedio * 0.5) * 0.85).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: '📦' },
      { fornecedor: 'Auto Moto Supply', tipo: 'Emergencial', produtos: Math.round(d.totalProdutos * 0.1), ultimaCompra: '20/05/2026', confiabilidade: 65, prazoMedio: '2 dias', precoMedio: (((d as any).precoCusto || d.precoMedio * 0.5) * 1.15).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: '⚡' },
    ];
    return fornecs;
  }, [dashboardData]);

  const analiseLucro = useMemo(() => {
    if (!dashboardData || !todosProdutos.length) return null;
    const d = dashboardData;
    const produtos = todosProdutos.filter(p => (p.quantidade || 0) > 0 && (Number(p.precoVenda) || 0) > 0);
    const comLucro = produtos.map(p => { const custo = Number(p.precoCusto) || Number(p.precoVenda) * 0.5; const venda = Number(p.precoVenda); const margem = ((venda - custo) / (venda || 1)) * 100; return { ...p, margem, lucroUnitario: venda - custo }; });
    const maisLucrativos = [...comLucro].sort((a, b) => b.margem - a.margem).slice(0, 5);
    const menosLucrativos = [...comLucro].sort((a, b) => a.margem - b.margem).slice(0, 5);
    const margemMedia = comLucro.length > 0 ? comLucro.reduce((s, p) => s + p.margem, 0) / comLucro.length : 0;
    const margemPorCategoria: Record<string, { nome: string; qtd: number; margemTotal: number }> = {};
    for (const p of comLucro) { const s = p.categoria?.slug || 'outros'; if (!margemPorCategoria[s]) margemPorCategoria[s] = { nome: p.categoria?.nome || 'Outros', qtd: 0, margemTotal: 0 }; margemPorCategoria[s].qtd++; margemPorCategoria[s].margemTotal += p.margem; }
    const catsMargem = Object.values(margemPorCategoria).map(c => ({ ...c, margemMedia: c.qtd > 0 ? c.margemTotal / c.qtd : 0 })).sort((a, b) => b.margemMedia - a.margemMedia);
    return { maisLucrativos, menosLucrativos, margemMedia, margemPorCategoria: catsMargem };
  }, [dashboardData, todosProdutos]);

  const previsaoCompras = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const qtdTotalZerados = d.semEstoque.length;
    const qtdTotalCriticos = d.estoqueCritico.length;
    const valorMedio = d.precoMedio || 50;
    const custoMedio = (d as any).precoCusto || d.precoMedio * 0.5;
    return [
      { periodo: 'Hoje', qtdProdutos: Math.min(qtdTotalZerados, 5), categorias: [...new Set(d.semEstoque.slice(0, 5).map(p => p.categoria?.nome || 'Geral'))].length, qtdPrevista: d.semEstoque.slice(0, 5).reduce((s, p) => s + Math.max(5, (p.estoqueMinimo || 5) * 3), 0), valor: d.semEstoque.slice(0, 5).reduce((s, p) => s + Math.max(5, (p.estoqueMinimo || 5) * 3) * Number(custoMedio || valorMedio * 0.5), 0), impacto: 'Alto' },
      { periodo: '7 dias', qtdProdutos: qtdTotalZerados + Math.min(qtdTotalCriticos, 10), categorias: [...new Set([...d.semEstoque, ...d.estoqueCritico].map(p => p.categoria?.nome || 'Geral'))].length, qtdPrevista: [...d.semEstoque, ...d.estoqueCritico].reduce((s, p) => s + Math.max(5, (p.estoqueMinimo || 5) * 2) - (p.quantidade || 0), 0), valor: [...d.semEstoque, ...d.estoqueCritico].reduce((s, p) => s + (Math.max(5, (p.estoqueMinimo || 5) * 2) - (p.quantidade || 0)) * Number(custoMedio || valorMedio * 0.5), 0), impacto: 'Médio' },
      { periodo: '15 dias', qtdProdutos: qtdTotalZerados + qtdTotalCriticos + Math.min(d.paradosList.length, 5), categorias: d.catsArray.length, qtdPrevista: Math.max(20, (qtdTotalZerados + qtdTotalCriticos) * 3), valor: Math.max(20, (qtdTotalZerados + qtdTotalCriticos) * 3) * Number(custoMedio || valorMedio * 0.5), impacto: 'Médio' },
      { periodo: '30 dias', qtdProdutos: Math.round(d.totalProdutos * 0.3), categorias: d.catsArray.length, qtdPrevista: Math.max(30, d.totalProdutos), valor: Math.max(30, d.totalProdutos) * Number(custoMedio || valorMedio * 0.5), impacto: 'Planejado' },
    ];
  }, [dashboardData]);

  const iaNegociadora = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const sugs: { acao: string; motivo: string; icon: string; cor: string; bg: string; urgencia: string }[] = [];
    if (d.semEstoque.length > 0) sugs.push({ acao: 'Comprar agora', motivo: `${d.semEstoque.length} produto(s) zerado(s) — urgente para não perder vendas.`, icon: '🛒', cor: 'text-red-700', bg: 'bg-red-50', urgencia: 'Urgente' });
    if (d.estoqueCritico.length > 0) sugs.push({ acao: 'Comprar em lote', motivo: `${d.estoqueCritico.length} itens críticos — compre em volume para negociar desconto.`, icon: '📦', cor: 'text-amber-700', bg: 'bg-amber-50', urgencia: 'Alta' });
    if (d.paradosList.length > 5) sugs.push({ acao: 'Transferir entre estoques', motivo: `${d.paradosList.length} produtos parados — mova para loja e libere capital.`, icon: '🚚', cor: 'text-purple-700', bg: 'bg-purple-50', urgencia: 'Média' });
    if (d.paradosList.length > 3) sugs.push({ acao: 'Liquidar produto parado', motivo: `Crie promoções para ${d.paradosList.length} itens com giro baixo.`, icon: '🏷️', cor: 'text-indigo-700', bg: 'bg-indigo-50', urgencia: 'Média' });
    sugs.push({ acao: 'Negociar fornecedor', motivo: `Com ${d.totalProdutos} produtos, há poder de negociação para melhores prazos e preços.`, icon: '🤝', cor: 'text-emerald-700', bg: 'bg-emerald-50', urgencia: 'Baixa' });
    return sugs;
  }, [dashboardData]);

  const curvaABC = useMemo(() => {
    if (!dashboardData || !todosProdutos.length) return { a: [], b: [], c: [], totalValor: 0 };
    const d = dashboardData;
    const comValor = todosProdutos.filter(p => (p.quantidade || 0) > 0).map(p => ({ nome: p.nome, categoria: p.categoria?.nome || 'Outros', valorTotal: (Number(p.precoVenda) || 0) * (p.quantidade || 0) })).sort((a, b) => b.valorTotal - a.valorTotal);
    const totalValor = comValor.reduce((s, p) => s + p.valorTotal, 0) || 1;
    let acum = 0;
    const a: typeof comValor = [], b: typeof comValor = [], c: typeof comValor = [];
    for (const p of comValor) { acum += p.valorTotal; const pct = (acum / totalValor) * 100; if (pct <= 70 || a.length === 0) a.push(p); else if (pct <= 90) b.push(p); else c.push(p); }
    return { a, b, c, totalValor };
  }, [dashboardData, todosProdutos]);

  const oportunidadesVenda = useMemo(() => {
    if (!dashboardData) return [];
    const d = dashboardData;
    const ops: { tipo: string; itens: string[]; descricao: string; icon: string; cor: string; bg: string }[] = [];
    if (d.paradosList.length > 0) ops.push({ tipo: 'Produtos parados', itens: d.paradosList.slice(0, 4).map(p => p.nome), descricao: `${d.paradosList.length} itens com estoque elevado e baixo giro — ideais para promoção.`, icon: '⏸️', cor: 'text-purple-700', bg: 'bg-purple-50' });
    if (d.semEstoque.length > 0) ops.push({ tipo: 'Produtos esquecidos', itens: d.semEstoque.slice(0, 4).map(p => p.nome), descricao: `${d.semEstoque.length} itens zerados — podem estar sendo esquecidos nas compras.`, icon: '🔍', cor: 'text-red-700', bg: 'bg-red-50' });
    if (analiseLucro?.maisLucrativos?.length) {
      ops.push({ tipo: 'Produtos de alto lucro', itens: analiseLucro.maisLucrativos.slice(0, 4).map(p => p.nome), descricao: `Margens de ${analiseLucro.maisLucrativos[0]?.margem.toFixed(0)}% a ${analiseLucro.maisLucrativos[4]?.margem.toFixed(0)}% — priorize a venda destes itens.`, icon: '💰', cor: 'text-emerald-700', bg: 'bg-emerald-50' });
    }
    if (d.maisVendidosSimulado.length > 0) ops.push({ tipo: 'Produtos de alto giro', itens: d.maisVendidosSimulado.slice(0, 4).map(p => p.nome), descricao: 'Estes itens têm menor estoque (possível alta saída) — mantenha abastecido.', icon: '🔥', cor: 'text-amber-700', bg: 'bg-amber-50' });
    if (d.paradosList.length >= 2) ops.push({ tipo: 'Sugestão de kits', itens: d.paradosList.slice(0, 2).map(p => p.nome), descricao: 'Agrupe produtos parados com itens de alto giro para criar kits promocionais.', icon: '🎁', cor: 'text-blue-700', bg: 'bg-blue-50' });
    return ops;
  }, [dashboardData, analiseLucro]);

  const iaConsultora = useMemo(() => {
    if (!dashboardData) return '';
    const d = dashboardData;
    const partes: string[] = [];
    partes.push('📊 **RELATÓRIO COMERCIAL AUTOMÁTICO**');
    if (d.semEstoque.length > 0) partes.push(`Hoje recomendamos comprar ${d.semEstoque.length} produto(s) zerado(s) com urgência.`);
    if (d.estoqueCritico.length > 0) partes.push(`Existem ${d.estoqueCritico.length} itens com estoque crítico que precisam de reposição em breve.`);
    if (d.paradosList.length > 5) partes.push(`Há ${d.paradosList.length} peças paradas — considere promover ou transferir.`);
    if (d.maiorCategoria && d.valorTotal > 0) { const pct = Math.round((d.maiorCategoria.valor / d.valorTotal) * 100); partes.push(`A categoria ${d.maiorCategoria.nome} representa ${pct}% do valor — ${pct > 40 ? 'avalie diversificar' : 'distribuição saudável'}.`); }
    if (analiseLucro?.margemMedia) partes.push(`A margem média do estoque é de ${analiseLucro.margemMedia.toFixed(0)}% — ${analiseLucro.margemMedia > 40 ? 'excelente rentabilidade' : analiseLucro.margemMedia > 25 ? 'boa rentabilidade' : 'margem baixa — revise preços'}.`);
    if (d.semEstoque.length === 0 && d.estoqueCritico.length === 0) partes.push('O estoque está saudável e bem abastecido — ótimo trabalho!');
    return partes.join('\n');
  }, [dashboardData, analiseLucro]);

  useEffect(() => { fetch('/api/categorias').then(r => r.json()).then(d => setCategorias(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  useEffect(() => { fetch('/api/pecas').then(r => r.json()).then((pecas: PecaResult[]) => { if (Array.isArray(pecas)) { setTodosProdutos(pecas); const contagem: Record<string, number> = {}; for (const p of pecas) { const slug = p.categoria?.slug || 'outros'; contagem[slug] = (contagem[slug] || 0) + 1; } for (const cat of CATEGORIAS_SIDEBAR) { if (!(cat.slug in contagem)) contagem[cat.slug] = 0; } setProdutosPorCategoria(contagem); } }).catch(() => {}); }, []);
  useEffect(() => { const interval = setInterval(() => setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length), 4000); return () => clearInterval(interval); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { setSidebarOpen(false); }, [activeConversaId]);
  useEffect(() => { const el = inputRef.current; if (el) { el.style.height = 'auto'; el.style.height = inputExpandido ? '160px' : Math.min(el.scrollHeight, 160) + 'px'; } }, [input, inputExpandido]);

  // ============================================================
  // SCANNER — captura HID
  // ============================================================
  const scannerTeclasTempos = useRef<number[]>([]);
  const scannerTeclasChars = useRef<string[]>([]);

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (!scannerAtivo) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') { if ((e.target as HTMLElement) !== scannerInputRef.current) return; }
      const agora = Date.now();
      if (e.key === 'Enter') {
        const tempos = scannerTeclasTempos.current; const chars = scannerTeclasChars.current;
        if (tempos.length >= 3) {
          const intervals: number[] = []; for (let i = 1; i < tempos.length; i++) intervals.push(tempos[i] - tempos[i - 1]);
          if ((intervals.reduce((a, b) => a + b, 0) / intervals.length) < 50) {
            e.preventDefault(); e.stopPropagation();
            const codigo = chars.join('').trim();
            if (codigo.length >= 3) processarCodigoScanner(codigo, scannerOrigemAtiva);
          }
        }
        scannerTeclasTempos.current = []; scannerTeclasChars.current = [];
        return;
      }
      if (e.key.length === 1) {
        scannerTeclasTempos.current.push(agora); scannerTeclasChars.current.push(e.key);
        if (scannerTeclasTempos.current.length >= 2) {
          const ui = scannerTeclasTempos.current[scannerTeclasTempos.current.length - 1] - scannerTeclasTempos.current[scannerTeclasTempos.current.length - 2];
          if (ui > 200) { scannerTeclasTempos.current = [agora]; scannerTeclasChars.current = [e.key]; }
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [scannerAtivo, scannerOrigemAtiva]);

  function processarCodigoScanner(codigo: string, origem: ScannerOrigem) {
    tocarBeepConfirmacao();
    setScannerFlashVerde(true); setScannerUltimoCodigo(codigo);
    setTimeout(() => setScannerFlashVerde(false), 1500);
    setScannerLeituras(prev => [{ id: Date.now().toString(), codigo, horario: new Date(), origem }, ...prev].slice(0, 50));

    if (cadastroAberto) {
      setCodigoEscaneadoCadastro(codigo);
      atualizarCampoFicha('codigo', codigo);
      addMsg(`📷 **Codigo escaneado para cadastro** (${origem === 'usb' ? 'Scanner USB' : origem === 'bluetooth' ? 'Scanner Bluetooth' : 'Câmera'}):\n\`${codigo}\`\n\nO código foi preenchido automaticamente na ficha de cadastro.`, 'assistant');
    } else {
      addMsg(`📷 **Codigo escaneado** (${origem === 'usb' ? 'Scanner USB' : origem === 'bluetooth' ? 'Scanner Bluetooth' : 'Câmera'}):\n\`${codigo}\``, 'user');
      setComandosExecutados(prev => prev + 1);
      adicionarHistorico('Scanner', 'buscar', `Código escaneado: ${codigo}`, 'sucesso', '📷', 100);
      setTimeout(() => processarMensagem(`Buscar ${codigo}`), 300);
    }
  }

  function simularLeitura() {
    const codigosDemo = ['7891234567890', '7898357417892', '7896543210987', '7891000315507', '7892930000015'];
    processarCodigoScanner(codigosDemo[Math.floor(Math.random() * codigosDemo.length)], scannerOrigemAtiva);
  }

  function ativarScannerOrigem(origem: ScannerOrigem) {
    setScannerOrigemAtiva(origem);
    if (origem === 'camera') { setScannerDispositivos(prev => prev.map(d => d.tipo === 'camera' ? { ...d, status: 'aguardando' as ScannerStatus } : d)); setTimeout(() => setScannerDispositivos(prev => prev.map(d => d.tipo === 'camera' ? { ...d, status: 'pronto' as ScannerStatus } : d)), 2000); }
    scannerInputRef.current?.focus();
  }

  // ============================================================
  // CADASTRO INTELIGENTE — Funções (FASE 6)
  // ============================================================
  function atualizarCampoFicha(campo: keyof FichaCadastro, valor: string) {
    setFichaCadastro(prev => {
      const nova = { ...prev, [campo]: valor };
      const prog = calcularProgresso(nova);
      nova.statusGeral = prog >= 100 ? 'completo' : prog > 0 ? 'validando' : 'rascunho';
      return nova;
    });
    if (msgFichaId) {
      setMessages(prev => prev.map(m => m.id === msgFichaId ? { ...m, fichaCadastro: { ...fichaCadastro, [campo]: valor } } : m));
    }
  }

  function analisarTextoParaFicha() {
    if (!input.trim()) return;
    addMsg(input, 'user');
    const parsed = parseTextoParaFicha(input);
    let camposEncontrados: string[] = [];

    if (parsed.nome) { atualizarCampoFicha('nome', parsed.nome); camposEncontrados.push(`📝 Nome: "${parsed.nome}"`); }
    if (parsed.marca) { atualizarCampoFicha('marca', parsed.marca); camposEncontrados.push(`🏭 Marca: "${parsed.marca}"`); }
    if (parsed.preco) { atualizarCampoFicha('preco', parsed.preco); camposEncontrados.push(`💰 Preço: R$ ${parseFloat(parsed.preco).toFixed(2).replace('.', ',')}`); }
    if (parsed.quantidade) { atualizarCampoFicha('quantidade', parsed.quantidade); camposEncontrados.push(`📦 Quantidade: ${parsed.quantidade}`); }
    if (parsed.categoria) { atualizarCampoFicha('categoria', parsed.categoria); camposEncontrados.push(`📂 Categoria: "${parsed.categoria}"`); }
    if (parsed.aplicacao) { atualizarCampoFicha('aplicacao', parsed.aplicacao); camposEncontrados.push(`🔧 Aplicação: "${parsed.aplicacao}"`); }
    if (parsed.fornecedor) { atualizarCampoFicha('fornecedor', parsed.fornecedor); camposEncontrados.push(`🚚 Fornecedor: "${parsed.fornecedor}"`); }
    if (parsed.localizacao) { atualizarCampoFicha('localizacao', parsed.localizacao); camposEncontrados.push(`📍 Localização: "${parsed.localizacao}"`); }

    if (!fichaCadastro.codigo && parsed.nome) {
      const codigoAuto = `CAD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      atualizarCampoFicha('codigo', codigoAuto);
      camposEncontrados.push(`🏷️ Código: ${codigoAuto} (gerado automaticamente)`);
    }

    setInput('');
    setComandosExecutados(prev => prev + 1);

    if (camposEncontrados.length > 0) {
      adicionarHistorico('Cadastro Inteligente', 'adicionar', `${camposEncontrados.length} campos extraídos do texto`, 'sucesso', '🧠', 100);
    }

    const fichaAtualizada = { ...fichaCadastro };
    if (parsed.nome) fichaAtualizada.nome = parsed.nome;
    if (parsed.marca) fichaAtualizada.marca = parsed.marca;
    if (parsed.preco) fichaAtualizada.preco = parsed.preco;
    if (parsed.quantidade) fichaAtualizada.quantidade = parsed.quantidade;
    if (parsed.categoria) fichaAtualizada.categoria = parsed.categoria;
    if (parsed.aplicacao) fichaAtualizada.aplicacao = parsed.aplicacao;
    if (parsed.fornecedor) fichaAtualizada.fornecedor = parsed.fornecedor;
    if (parsed.localizacao) fichaAtualizada.localizacao = parsed.localizacao;

    if (camposEncontrados.length > 0) {
      const conteudo = camposEncontrados.length >= 3
        ? `🧠 **Analise do texto concluida!**\n\nExtrai **${camposEncontrados.length} campos** do seu texto:\n\n${camposEncontrados.map(c => `• ${c}`).join('\n')}\n\nA ficha de cadastro foi atualizada.`
        : `🧠 Texto analisado — **${camposEncontrados.length} campo(s)** identificado(s). Continue preenchendo a ficha.`;

      if (msgFichaId) {
        setMessages(prev => prev.map(m => m.id === msgFichaId ? { ...m, content: conteudo, fichaCadastro: fichaAtualizada } : m));
      } else {
        const newId = Date.now().toString();
        setMsgFichaId(newId);
        addMsg(conteudo, 'assistant');
        setTimeout(() => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              setMsgFichaId(last.id);
              return prev.map(m => m.id === last.id ? { ...m, fichaCadastro: fichaAtualizada } : m);
            }
            return prev;
          });
        }, 50);
      }
    } else {
      addMsg('🧠 Nao consegui identificar campos de cadastro no texto. Tente:\n\n📝 **"Filtro de oleo Fazer 250, marca Tecfil, preco 39,90, quantidade 20"**\n\nOu preencha os campos manualmente na ficha abaixo.', 'assistant');
    }
  }

  function selecionarFoto() { fotoInputRef.current?.click(); }
  function handleFotoSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFotoPreview(dataUrl);
      atualizarCampoFicha('imagemPreview', dataUrl);
      addMsg('📷 **Foto capturada!**\n\nA imagem foi anexada à ficha de cadastro.\n\n📋 **Status:** Aguardando analise da IA', 'assistant');
    };
    reader.readAsDataURL(file);
  }

  // ============================================================
  // FASE 1 — UPLOAD DE IMAGEM NO CHAT (Tesseract OCR)
  // ============================================================
  function abrirChatImagePicker() { chatImageInputRef.current?.click(); }
  function limparChatImage() { setChatImagePreview(null); setChatImageFile(null); }

  async function handleChatImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setChatImagePreview(dataUrl);
      setChatImageFile(file);
    };
    reader.readAsDataURL(file);
  }

  async function processarImagemChat() {
    if (!chatImageFile && !chatImagePreview) return;
    const preview = chatImagePreview;
    const comandoTexto = input.trim();

    // Add user message with image
    if (preview) {
      addMsg(comandoTexto || '📷 Analise esta imagem', 'user', { imagem: preview });
    }
    setInput('');
    setChatImagePreview(null);
    setChatImageFile(null);
    setProcessingImage(true);

    try {
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('por');
      const { data: { text } } = await worker.recognize(preview!);
      await worker.terminate();

      const textoExtraido = text.trim();
      if (textoExtraido) {
        addMsg(`📷 **Texto extraído da imagem:**\n\n\`\`\`\n${textoExtraido}\n\`\`\`\n\n🧠 Processando com a IA...`, 'assistant');
        // Se tem comando junto, usa ele; senão tenta processar o texto extraído
        const textoParaProcessar = comandoTexto || textoExtraido;
        // Processa diretamente (já temos a mensagem do usuário)
        setLoading(true);
        const parsed = parseComando(textoParaProcessar);
        try {
          await executarIntent(parsed, textoParaProcessar);
        } catch (e: any) {
          addMsg(`❌ Erro: ${e.message || 'Falha ao processar'}`, 'assistant');
        }
        setLoading(false);
      } else {
        addMsg('📷 Não foi possível extrair texto desta imagem. Tente uma imagem mais nítida ou com texto impresso.', 'assistant');
      }
    } catch (err: any) {
      addMsg(`❌ Erro ao processar a imagem: ${err.message || 'Tente novamente.'}`, 'assistant');
    } finally {
      setProcessingImage(false);
    }
  }

  function iniciarGravacaoAudio() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { addMsg('Reconhecimento de voz nao disponivel neste navegador.', 'assistant'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; recognition.interimResults = true; recognition.continuous = true;
    recognition.onstart = () => setGravandoAudio(true);
    recognition.onend = () => { setGravandoAudio(false); };
    recognition.onerror = () => { setGravandoAudio(false); };
    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        else interim += event.results[i][0].transcript;
      }
      setAudioTranscrito(finalTranscript + interim);
    };
    audioRecognitionRef.current = recognition;
    recognition.start();
  }

  function pararGravacaoAudio() {
    audioRecognitionRef.current?.stop();
    setGravandoAudio(false);
    if (audioTranscrito.trim()) {
      setInput(audioTranscrito.trim());
      setTimeout(() => {
        addMsg(`🎤 **Audio transcrito:** "${audioTranscrito.trim()}"`, 'user');
        setTimeout(() => analisarTextoParaFicha(), 300);
      }, 300);
    }
  }

  function salvarCadastro() {
    addMsg(`✅ **Cadastro simulado com sucesso!**\n\n📝 **${fichaCadastro.nome || 'Produto'}** — ficha completa.\n🧠 Os dados seriam enviados para o banco na versao final.\n\nAbaixo, o resumo do que seria cadastrado:`, 'assistant');
    adicionarHistorico('Cadastro Inteligente', 'adicionar', `Ficha de "${fichaCadastro.nome || 'produto'}" — salvamento simulado`, 'sucesso', '✅', 100);
    setCadastroAberto(false);
  }

  function editarCadastro() { setCadastroAberto(true); }

  function cancelarCadastro() {
    addMsg('Cadastro cancelado. A ficha foi descartada.', 'assistant');
    setFichaCadastro(FICHA_CADASTRO_INICIAL);
    setFotoPreview(null); setAudioTranscrito(''); setCodigoEscaneadoCadastro(null);
    setMsgFichaId(null); setCadastroAberto(false);
  }

  function novoCadastro() {
    setFichaCadastro(FICHA_CADASTRO_INICIAL);
    setFotoPreview(null); setAudioTranscrito(''); setCodigoEscaneadoCadastro(null);
    setMsgFichaId(null); setModoCadastro('texto'); setCadastroAberto(true);
    addMsg('🧠 **Nova ficha de cadastro iniciada.**\n\nEscolha o modo de entrada (Texto, Foto, Áudio ou Código de Barras) e comece a preencher.', 'assistant');
  }

  // ============================================================
  // CONVERSAS
  // ============================================================
  function novaConversa() {
    if (messages.length > 1) { const titulo = messages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'Nova conversa'; setConversations(prev => [{ id: Date.now().toString(), titulo: titulo.length >= 40 ? titulo + '...' : titulo, data: new Date(), messages: [...messages], favorita: false }, ...prev]); }
    const newId = Date.now().toString(); setActiveConversaId(newId);
    setMessages([{ id: 'welcome-' + newId, role: 'assistant', content: 'Nova conversa iniciada! 🏍️\n\nComo posso ajudar com o estoque hoje?' }]);
    setInput(''); setComandosExecutados(0);
  }

  function selecionarConversa(conv: Conversa) {
    if (messages.length > 1 && activeConversaId !== 'default') { setConversations(prev => prev.map(c => c.id === activeConversaId ? { ...c, messages: [...messages], favorita: c.favorita } : c)); }
    setActiveConversaId(conv.id); setMessages([...conv.messages]); setInput(''); setComandosExecutados(conv.messages.filter(m => m.role === 'user').length);
  }

  function limparConversa() {
    if (messages.length > 1) { const titulo = messages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'Conversa limpa'; setConversations(prev => [{ id: Date.now().toString(), titulo, data: new Date(), messages: [...messages], favorita: false }, ...prev]); }
    setMessages([{ id: 'welcome-' + Date.now(), role: 'assistant', content: 'Conversa limpa! 🏍️\n\nComo posso ajudar agora?' }]); setComandosExecutados(0); setInput('');
  }

  function toggleFavorito(convId: string) { setConversations(prev => prev.map(c => c.id === convId ? { ...c, favorita: !c.favorita } : c)); }

  // ============================================================
  // VOZ — SpeechSynthesis (FASE 7)
  // ============================================================
  function speakResponse(text: string) {
    if (!voiceSettings.responderPorVoz) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceSettings.idioma;
      utterance.rate = voiceSettings.velocidade;
      utterance.volume = voiceSettings.volume;
      utterance.onstart = () => setVozRespondendo(true);
      utterance.onend = () => setVozRespondendo(false);
      utterance.onerror = () => setVozRespondendo(false);
      vozSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch { /* silencioso */ }
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setVozRespondendo(false);
  }

  function atualizarVoiceSettings(key: keyof VoiceSettings, value: any) {
    setVoiceSettings(prev => ({ ...prev, [key]: value }));
  }

  function adicionarVozComando(comando: string, resultado: 'sucesso' | 'erro' | 'pendente', icon: string, intent: string) {
    setVozComandosRecentes(prev => [{ id: Date.now().toString(), comando, horario: new Date(), resultado, icon, intent }, ...prev].slice(0, 20));
  }

  // ============================================================
  // VOZ — MODOS DE RECONHECIMENTO (FASE 7)
  // ============================================================
  function toggleVoz() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setConversacaoAtiva(false);
      setTranscricaoParcial('');
      // FASE 1 — se tem transcrição acumulada, envia como mensagem
      const parcial = transcricaoRef.current.trim();
      if (parcial) {
        setInput(parcial);
        setTimeout(() => processarMensagem(parcial, true), 100);
      }
      transcricaoRef.current = '';
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { addMsg('Reconhecimento de voz nao disponivel neste navegador.', 'assistant'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = voiceSettings.idioma;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setListening(true);
      setConversacaoAtiva(true);
      setTranscricaoParcial('');
      transcricaoRef.current = '';
    };
    recognition.onend = () => {
      setListening(false);
      setConversacaoAtiva(false);
      if (vozTimerRef.current) clearTimeout(vozTimerRef.current);
      // FASE 1 — ao terminar, envia a transcrição direto no input e processa
      const parcial = transcricaoRef.current.trim();
      if (parcial) {
        setInput(parcial);
        setTimeout(() => processarMensagem(parcial, true), 100);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setConversacaoAtiva(false);
      setTranscricaoParcial('');
      if (vozTimerRef.current) clearTimeout(vozTimerRef.current);
      // FASE 1 — envia o que foi capturado antes do erro
      const parcial = transcricaoRef.current.trim();
      if (parcial) {
        setInput(parcial);
        setTimeout(() => processarMensagem(parcial, true), 100);
      }
    };

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const fullTranscript = finalTranscript + interim;
      setTranscricaoParcial(fullTranscript.trim());
      transcricaoRef.current = fullTranscript.trim();
      // FASE 1 — reflete transcrição no input em tempo real
      setInput(fullTranscript.trim());

      // Auto-stop após silêncio de 3s
      if (vozTimerRef.current) clearTimeout(vozTimerRef.current);
      if (fullTranscript.trim().length > 5) {
        vozTimerRef.current = setTimeout(() => {
          recognition.stop();
        }, 3000);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function interromperConversacao() {
    recognitionRef.current?.stop();
    setListening(false);
    setConversacaoAtiva(false);
    setTranscricaoParcial('');
    setProcessandoVoz(false);
    if (vozTimerRef.current) clearTimeout(vozTimerRef.current);
  }

  function processarMensagemVoz(comando: string) {
    setConversacaoAtiva(false);
    setTranscricaoParcial('');
    processarMensagem(comando, true);
  }

  // ============================================================
  // MENSAGENS + HISTÓRICO
  // ============================================================
  function addMsg(content: string, role: 'user' | 'assistant', data?: any, actions?: ActionCard[], trace?: InterpretationTrace) {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, content, data, actions, trace }]);
  }

  function adicionarHistorico(tipo: string, intent: string, resumo: string, resultado: 'sucesso' | 'erro' | 'pendente', icon: string, confianca: number) {
    setHistoricoAcoes(prev => [{ id: Date.now().toString(), horario: new Date(), tipo, resumo, resultado, icon, confianca, intent }, ...prev].slice(0, 50));
  }

  // ============================================================
  // PROCESSAR COMANDO (com trace e histórico) — atualizado FASE 7
  // ============================================================
  async function processarMensagem(texto?: string, isVoz: boolean = false) {
    const cmd = (texto || input).trim();
    if (!cmd) return;

    if (cadastroAberto && modoCadastro === 'texto') {
      analisarTextoParaFicha();
      return;
    }

    // Comando "abre o scanner" detectado
    if (/abre?\s+(?:o\s+)?scanner/i.test(cmd)) {
      addMsg(cmd, isVoz ? 'assistant' : 'user');
      if (isVoz) addMsg(`🎤 Comando de voz: "${cmd}"`, 'user');
      setInput('');
      setScannerPainelAberto(true);
      scannerInputRef.current?.focus();
      addMsg('📷 **Scanner Inteligente aberto!**\n\nDispositivos disponíveis: USB, Bluetooth e Câmera. Escaneie um código ou selecione o dispositivo desejado.', 'assistant');
      adicionarHistorico('Voz', 'ajudar', 'Scanner aberto por comando de voz', 'sucesso', '📷', 100);
      if (isVoz) {
        adicionarVozComando(cmd, 'sucesso', '📷', 'ajudar');
        speakResponse('Scanner inteligente aberto. Escaneie o código desejado.');
      }
      return;
    }

    // FASE 1 — Voz aparece como mensagem normal (sem prefixo 🎤)
    addMsg(cmd, 'user');

    setInput('');
    setComandosExecutados(prev => prev + 1);
    setLoading(true);

    const parsed = parseComando(cmd);
    await executarIntent(parsed, cmd, isVoz);
    setLoading(false);
  }

  // ============================================================
  // FASE 1 — EXECUTAR INTENT (extraído de processarMensagem para reuso)
  // ============================================================
  async function executarIntent(parsed: ParsedCommand, cmdOriginal: string, isVoz: boolean = false) {
    let sucesso = true;
    let resultadoResumo = '';

    try {
      switch (parsed.intent) {
        case 'adicionar':        await handleAdicionar(parsed); resultadoResumo = parsed.produto ? `Cadastro de "${parsed.produto}" iniciado` : 'Cadastro processado'; break;
        case 'alterar_preco':    await handleAlterarPreco(parsed); resultadoResumo = parsed.produto ? `Preço de "${parsed.produto}" consultado` : 'Alteração de preço processada'; break;
        case 'alterar_qtd':      await handleAlterarQtd(parsed); resultadoResumo = parsed.produto ? `Quantidade de "${parsed.produto}" consultada` : 'Quantidade processada'; break;
        case 'mostrar_baixo':    await handleMostrarBaixo(); resultadoResumo = 'Lista de estoque baixo exibida'; break;
        case 'mostrar_zerado':   await handleMostrarZerado(); resultadoResumo = 'Lista de produtos sem estoque exibida'; break;
        case 'mostrar_vendidos': await handleMostrarVendidos(); resultadoResumo = 'Ranking de vendas exibido'; break;
        case 'mostrar_parados':  await handleMostrarParados(); resultadoResumo = 'Lista de produtos parados exibida'; break;
        case 'buscar':           await handleBuscar(parsed); resultadoResumo = `Busca por "${parsed.produto || cmdOriginal}" concluída`; break;
        case 'ajudar':
          addMsg('📋 **Comandos disponíveis:**\n\nFale naturalmente — não precisa decorar comandos!\n\n💰 **Preços:** "altere o preço", "esse produto agora custa R$ 90"\n📦 **Estoque:** "troque a quantidade", "ajuste o estoque"\n➕ **Cadastro:** "adicione 10 filtros", "cadastre um produto"\n🔍 **Busca:** "onde está", "me mostre", "localize"\n⚠️ **Alertas:** "o que tá acabando", "produtos sem estoque"\n📊 **Relatórios:** "gere um relatório", "mais vendidos"\n⏸️ **Parados:** "encalhados", "sem saída", "parados"\n\nToda alteração crítica precisa ser confirmada.', 'assistant');
          resultadoResumo = 'Lista de comandos exibida'; break;
        default: await handleBuscar({ ...parsed, intent: 'buscar', produto: cmdOriginal }); resultadoResumo = `Busca genérica por "${cmdOriginal}"`;
      }
    } catch (e: any) { sucesso = false; resultadoResumo = `Erro: ${e.message || 'Falha ao processar'}`; addMsg(`❌ Erro: ${e.message || 'Não foi possível processar o comando.'}`, 'assistant'); }

    // Resposta IA simulada por voz
    if (sucesso && isVoz) {
      const respostasIA: Record<string, string> = {
        alterar_preco: `Entendido. Encontrei o produto ${parsed.produto || ''}. O novo preço será R$ ${(parsed.preco || 0).toFixed(2).replace('.', ',')}. Aguardando confirmação.`,
        alterar_qtd: `Entendido. Encontrei o produto ${parsed.produto || ''}. A quantidade será ajustada para ${parsed.quantidade || 0} unidades. Aguardando confirmação.`,
        adicionar: `Entendido. Vou cadastrar ${parsed.quantidade || 1} unidades de ${parsed.produto || 'produto'}. Aguardando confirmação.`,
        mostrar_baixo: 'Entendido. Listando produtos com estoque baixo.',
        mostrar_zerado: 'Entendido. Mostrando produtos sem estoque.',
        mostrar_vendidos: 'Entendido. Gerando relatório dos mais vendidos.',
        mostrar_parados: 'Entendido. Listando produtos parados.',
        buscar: `Entendido. Buscando por ${parsed.produto || cmdOriginal}.`,
      };
      const respostaVoz = respostasIA[parsed.intent] || `Entendido. Processando: ${cmdOriginal}`;
      speakResponse(respostaVoz);
    }

    const trace = gerarTrace(parsed, cmdOriginal, sucesso, resultadoResumo);
    setMessages(prev => { const updated = [...prev]; const lastMsg = updated[updated.length - 1]; if (lastMsg && lastMsg.role === 'assistant') updated[updated.length - 1] = { ...lastMsg, trace }; return updated; });
    const style = INTENT_STYLES[parsed.intent] || INTENT_STYLES.desconhecido;
    adicionarHistorico(style.label, parsed.intent, cmdOriginal.slice(0, 60), sucesso ? 'sucesso' : 'erro', style.icon, parsed.confianca);

    if (isVoz) {
      adicionarVozComando(cmdOriginal, sucesso ? 'sucesso' : 'erro', style.icon, parsed.intent);
    }
  }
  // ============================================================
  async function handleAdicionar(parsed: ParsedCommand) {
    const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`); const pecas: PecaResult[] = await res.json();
    if (Array.isArray(pecas) && pecas.length > 0) { const p = pecas[0]; addMsg(`Encontrei **${p.nome}** (SKU: ${p.codigo}) no estoque.\n\n📦 Central: **${p.quantidade}** un.\n🏪 Loja: **${p.quantidadeLoja || 0}** un.\n\nDeseja adicionar **${parsed.quantidade}** unidades ao estoque central?`, 'assistant', null, [{ type: 'confirm_ajuste_qtd', title: `Adicionar ${parsed.quantidade} un. de ${p.nome}`, description: `Quantidade atual: ${p.quantidade} → Nova: ${p.quantidade + (parsed.quantidade || 0)}`, payload: { peca: p, novaQtd: p.quantidade + (parsed.quantidade || 0) }, onConfirm: `${parsed.quantidade} un. de "${p.nome}" adicionadas ao estoque central. ✅` }]); }
    else { const catId = categorias[0]?.id || ''; addMsg(`Produto **"${parsed.produto}"** nao encontrado no estoque.\n\nPosso cadastrar:\n📝 Nome: **${parsed.produto}**\n📦 Quantidade: **${parsed.quantidade || 1}**\n📂 Categoria: **${categorias[0]?.nome || 'Selecionar depois'}**`, 'assistant', null, [{ type: 'confirm_cadastro', title: `Cadastrar "${parsed.produto}"`, description: `Quantidade inicial: ${parsed.quantidade || 1} un.`, payload: { nome: parsed.produto, quantidade: parsed.quantidade || 1, categoriaId: catId, codigo: `IA-${Date.now().toString(36).toUpperCase()}` }, onConfirm: `Produto "${parsed.produto}" cadastrado com ${parsed.quantidade || 1} un. ✅` }]); }
  }

  async function handleAlterarPreco(parsed: ParsedCommand) {
    const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`); const pecas: PecaResult[] = await res.json();
    if (Array.isArray(pecas) && pecas.length > 0) { const p = pecas[0]; const pa = Number(p.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); const pn = (parsed.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); addMsg(`Encontrei **${p.nome}** (SKU: ${p.codigo}).\n\n💰 Preco atual: **${pa}**\n✨ Novo preco: **${pn}**`, 'assistant', null, [{ type: 'confirm_ajuste_preco', title: `Alterar preco de ${p.nome}`, description: `${pa} → ${pn}`, payload: { peca: p, novoPreco: parsed.preco }, onConfirm: `Preco de "${p.nome}" alterado para ${pn}. ✅` }]); }
    else { addMsg(`Nao encontrei **"${parsed.produto}"**. Tente buscar pelo nome exato ou SKU.`, 'assistant'); }
  }

  async function handleAlterarQtd(parsed: ParsedCommand) {
    const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`); const pecas: PecaResult[] = await res.json();
    if (Array.isArray(pecas) && pecas.length > 0) { const p = pecas[0]; addMsg(`Encontrei **${p.nome}** (SKU: ${p.codigo}).\n\n📦 Quantidade atual: **${p.quantidade}** → Nova: **${parsed.quantidade}**`, 'assistant', null, [{ type: 'confirm_ajuste_qtd', title: `Alterar quantidade de ${p.nome}`, description: `${p.quantidade} → ${parsed.quantidade} un.`, payload: { peca: p, novaQtd: parsed.quantidade }, onConfirm: `Quantidade de "${p.nome}" alterada para ${parsed.quantidade} un. ✅` }]); }
    else { addMsg(`Nao encontrei **"${parsed.produto}"**. Tente buscar pelo nome exato ou SKU.`, 'assistant'); }
  }

  async function handleMostrarBaixo() { const res = await fetch('/api/pecas?baixo=1'); const pecas: PecaResult[] = await res.json(); if (Array.isArray(pecas) && pecas.length > 0) addMsg(`📊 **${pecas.length} produtos com estoque baixo**\n\n⚠️ Va em **Estoque Central → Exportar → Estoque baixo** para a lista de compras.`, 'assistant', { pecas }); else addMsg('✅ Nenhum produto com estoque baixo encontrado!', 'assistant'); }
  async function handleMostrarZerado() { const res = await fetch('/api/pecas'); const pecas: PecaResult[] = await res.json(); const zerados = Array.isArray(pecas) ? pecas.filter((p: any) => p.quantidade <= 0) : []; if (zerados.length > 0) addMsg(`🚫 **${zerados.length} produtos sem estoque**`, 'assistant', { pecas: zerados }); else addMsg('✅ Nenhum produto com estoque zerado!', 'assistant'); }
  async function handleMostrarVendidos() { const hoje = new Date(); const mes = new Date(hoje.getFullYear(), hoje.getMonth(), 1); const p = new URLSearchParams({ inicio: mes.toISOString(), fim: hoje.toISOString() }); const res = await fetch(`/api/relatorios?${p}`); const data = await res.json(); const saidas: any[] = data.saidas || []; if (saidas.length > 0) { const agrupado: Record<string, { nome: string; codigo: string; qtd: number; valor: number }> = {}; for (const s of saidas) { const key = s.codigo || s.peca; if (!agrupado[key]) agrupado[key] = { nome: s.peca, codigo: s.codigo || '-', qtd: 0, valor: 0 }; agrupado[key].qtd += s.quantidade; agrupado[key].valor += s.preco * s.quantidade; } const sorted = Object.values(agrupado).sort((a, b) => b.qtd - a.qtd).slice(0, 10); addMsg(`🔥 **Produtos mais vendidos este mes**`, 'assistant', { ranking: sorted }); } else addMsg('📊 Nenhuma venda registrada este mes.', 'assistant'); }
  async function handleMostrarParados() { const res = await fetch('/api/pecas'); const pecas: PecaResult[] = await res.json(); const parados = Array.isArray(pecas) ? pecas.filter((p: any) => p.quantidade > 0).sort((a: any, b: any) => b.quantidade - a.quantidade).slice(0, 10) : []; if (parados.length > 0) addMsg(`⏸️ **Produtos com maior estoque parado**\n\n⚠️ Considere fazer uma promocao ou transferir para a loja.`, 'assistant', { parados }); else addMsg('✅ Estoque sem acumulos!', 'assistant'); }
  async function handleBuscar(parsed: ParsedCommand) { const res = await fetch(`/api/pecas?q=${encodeURIComponent(parsed.produto || '')}`); const pecas: PecaResult[] = await res.json(); if (Array.isArray(pecas) && pecas.length > 0) addMsg(`🔍 Encontrei **${pecas.length}** produto(s) para "${parsed.produto}":`, 'assistant', { pecas }); else addMsg(`Nao encontrei **"${parsed.produto}"**.\n\n💡 Tente:\n• Nome da peca\n• SKU\n• Codigo de barras\n• Ou use "Adicionar ${parsed.produto}" para cadastrar.`, 'assistant'); }

  async function executarAcao(action: ActionCard, messageId: string) {
    setLoading(true);
    try {
      if (action.type === 'confirm_cadastro') { const { nome, quantidade, categoriaId, codigo } = action.payload; const body = { nome, codigo, precoVenda: 0, precoCusto: 0, quantidade, quantidadeLoja: 0, estoqueMinimo: 5, categoriaId }; const res = await fetch('/api/pecas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (res.ok) { addMsg(action.onConfirm || 'Produto cadastrado com sucesso! ✅', 'assistant'); adicionarHistorico('Cadastro', 'adicionar', `"${nome}" cadastrado`, 'sucesso', '➕', 100); } else { const e = await res.json(); addMsg(`❌ Erro ao cadastrar: ${e.error || 'Erro desconhecido'}`, 'assistant'); } }
      else if (action.type === 'confirm_ajuste_qtd') { const { peca, novaQtd } = action.payload; const res = await fetch(`/api/pecas/${peca.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...peca, quantidade: novaQtd, categoriaId: peca.categoria?.id || peca.categoriaId, precoCusto: peca.precoCusto, precoVenda: peca.precoVenda, estoqueMinimo: peca.estoqueMinimo }) }); if (res.ok) { addMsg(action.onConfirm || 'Quantidade alterada com sucesso! ✅', 'assistant'); adicionarHistorico('Estoque', 'alterar_qtd', `"${peca.nome}": ${peca.quantidade} → ${novaQtd}`, 'sucesso', '📦', 100); } else { const e = await res.json(); addMsg(`❌ Erro: ${e.error || 'Erro desconhecido'}`, 'assistant'); } }
      else if (action.type === 'confirm_ajuste_preco') { const { peca, novoPreco } = action.payload; const res = await fetch(`/api/pecas/${peca.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...peca, precoVenda: novoPreco, categoriaId: peca.categoria?.id || peca.categoriaId, precoCusto: peca.precoCusto, quantidade: peca.quantidade, estoqueMinimo: peca.estoqueMinimo }) }); if (res.ok) { addMsg(action.onConfirm || 'Preco alterado com sucesso! ✅', 'assistant'); adicionarHistorico('Preço', 'alterar_preco', `"${peca.nome}": R$ ${peca.precoVenda} → R$ ${novoPreco}`, 'sucesso', '💰', 100); } else { const e = await res.json(); addMsg(`❌ Erro: ${e.error || 'Erro desconhecido'}`, 'assistant'); } }
    } catch (e: any) { addMsg(`❌ Erro de conexao: ${e.message}`, 'assistant'); }
    setLoading(false);
  }

  function dataRelativa(d: Date): string { const agora = new Date(); const diff = agora.getTime() - d.getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'Agora'; if (mins < 60) return `${mins} min`; const horas = Math.floor(mins / 60); if (horas < 24) return `${horas}h`; const dias = Math.floor(horas / 24); if (dias === 1) return 'Ontem'; if (dias < 7) return `${dias} dias`; return d.toLocaleDateString('pt-BR'); }
  function ehHoje(d: Date): boolean { const agora = new Date(); return d.getDate() === agora.getDate() && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear(); }
  function ehUltimos7Dias(d: Date): boolean { const agora = new Date(); const diff = agora.getTime() - d.getTime(); return diff > 86400000 && diff <= 7 * 86400000; }
  function formatarDataHora(): string { const agora = new Date(); const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']; return `${diasSemana[agora.getDay()]}, ${agora.toLocaleDateString('pt-BR')} • ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; }
  function statusPeca(qtd: number, min: number): { cor: string; texto: string; badge: string } { if (qtd <= 0) return { cor: 'text-red-600', texto: 'Sem estoque', badge: 'bg-red-50 text-red-700 border-red-200' }; if (qtd <= min) return { cor: 'text-amber-600', texto: 'Baixo', badge: 'bg-amber-50 text-amber-700 border-amber-200' }; return { cor: 'text-emerald-600', texto: 'OK', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }; }
  function formatarMarkdown(content: string): string {
    // Sanitiza primeiro: escapa qualquer HTML perigoso antes de aplicar markdown
    let safe = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    // Aplica formatação markdown sobre texto sanitizado
    return safe
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-brand-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br/>');
  }

  const conversasFiltradas = conversations.filter(c => !pesquisaSidebar || c.titulo.toLowerCase().includes(pesquisaSidebar.toLowerCase()));
  const conversasFavoritas = conversasFiltradas.filter(c => c.favorita);
  const conversasHoje = conversasFiltradas.filter(c => !c.favorita && ehHoje(c.data));
  const conversasSemana = conversasFiltradas.filter(c => !c.favorita && ehUltimos7Dias(c.data));
  const conversasAnteriores = conversasFiltradas.filter(c => !c.favorita && !ehHoje(c.data) && !ehUltimos7Dias(c.data));

  // ============================================================
  // RENDER
  // ============================================================

  // Return all state, computed values, and handlers
  return {
    conversations, setConversations, activeConversaId, setActiveConversaId,
    sidebarOpen, setSidebarOpen, pesquisaSidebar, setPesquisaSidebar,
    categoriaAtiva, setCategoriaAtiva, messages, setMessages,
    input, setInput, loading, setLoading, listening, setListening,
    categorias, setCategorias, comandosExecutados, setComandosExecutados,
    placeholderIndex, setPlaceholderIndex, inputExpandido, setInputExpandido,
    produtosPorCategoria, setProdutosPorCategoria, todosProdutos, setTodosProdutos,
    dashboardAberto, setDashboardAberto,
    gerenteAberto, setGerenteAberto, checklistItens, setChecklistItens,
    resolvendoPrioridade, setResolvendoPrioridade, aplicandoSugestao, setAplicandoSugestao,
    centralOperacionalAberto, setCentralOperacionalAberto, executandoAcao, setExecutandoAcao,
    copilotoAberto, setCopilotoAberto, copilotoInput, setCopilotoInput,
    copilotoResposta, setCopilotoResposta, missoesDia, setMissoesDia,
    missaoConcluindo, setMissaoConcluindo,
    automacaoAberto, setAutomacaoAberto, tarefasIA, setTarefasIA,
    tarefaEmExecucao, setTarefaEmExecucao, filaProcessos, setFilaProcessos,
    comprasAberto, setComprasAberto, comprasAdicionadas, setComprasAdicionadas, comprasIgnoradas, setComprasIgnoradas,
    scannerAtivo, setScannerAtivo, scannerDispositivos, setScannerDispositivos,
    scannerLeituras, setScannerLeituras, scannerUltimoCodigo, setScannerUltimoCodigo,
    scannerFlashVerde, setScannerFlashVerde, scannerPainelAberto, setScannerPainelAberto,
    scannerOrigemAtiva, setScannerOrigemAtiva,
    historicoAcoes, setHistoricoAcoes, historicoAberto, setHistoricoAberto,
    comandosRapidosAberto, setComandosRapidosAberto,
    cadastroAberto, setCadastroAberto, modoCadastro, setModoCadastro,
    fichaCadastro, setFichaCadastro, fotoPreview, setFotoPreview,
    gravandoAudio, setGravandoAudio, audioTranscrito, setAudioTranscrito,
    codigoEscaneadoCadastro, setCodigoEscaneadoCadastro, msgFichaId, setMsgFichaId,
    conversacaoAtiva, setConversacaoAtiva, transcricaoParcial, setTranscricaoParcial,
    voiceSettings, setVoiceSettings, vozComandosRecentes, setVozComandosRecentes,
    vozRespondendo, setVozRespondendo, processandoVoz, setProcessandoVoz,
    voiceSettingsAberto, setVoiceSettingsAberto,
    // FASE 1 — Chat image upload
    chatImagePreview, setChatImagePreview, processingImage, setProcessingImage,
    chatImageInputRef,
    bottomRef, inputRef, scannerInputRef, recognitionRef, fotoInputRef,
    audioRecognitionRef, vozSynthesisRef, vozTimerRef,
    sugestoes, progressoCadastro, camposFicha,
    dashboardData, analisesIA, alertasIA, resumoExecutivo,
    prioridadesDoDia, sugestoesIA, produtosAtencao, previsaoReposicao,
    oportunidades, checklistDefault, atividadeIA, pontuacaoEstoque,
    acoesIAFaria, planoDoDia, mapaSaudeEstoque, simuladorDecisoes,
    recomendacoesAutomaticas, painelProdutividade, centralEventos, resumoExecutivoOficina,
    resumoDoDia, diagnosticGeral, rankingEficiencia, missoesDefault, insightsPremium,
    centralDecisoes, iaObservando, memoriaIA, statusIACopiloto, simulacoesRespostas,
    tarefasDefault, rotinaInteligente, planejadorReposicao, iaOrganizacao,
    assistenteAuditoria, centroProdutividade, iaPensandoSteps,
    centralCompras, centralFornecedores, analiseLucro, previsaoCompras,
    iaNegociadora, curvaABC, oportunidadesVenda, iaConsultora,
    processarCodigoScanner, simularLeitura, ativarScannerOrigem,
    atualizarCampoFicha, analisarTextoParaFicha, selecionarFoto, handleFotoSelecionada,
    iniciarGravacaoAudio, pararGravacaoAudio, salvarCadastro, editarCadastro,
    cancelarCadastro, novoCadastro,
    novaConversa, selecionarConversa, limparConversa, toggleFavorito,
    speakResponse, stopSpeaking, atualizarVoiceSettings, adicionarVozComando,
    toggleVoz, interromperConversacao, processarMensagemVoz,
    // FASE 1 — Chat image upload
    abrirChatImagePicker, limparChatImage, handleChatImageUpload, processarImagemChat,
    addMsg, adicionarHistorico, processarMensagem,
    handleAdicionar, handleAlterarPreco, handleAlterarQtd,
    handleMostrarBaixo, handleMostrarZerado, handleMostrarVendidos, handleMostrarParados,
    handleBuscar, executarAcao,
    dataRelativa, ehHoje, ehUltimos7Dias, formatarDataHora, statusPeca, formatarMarkdown,
    conversasFavoritas, conversasHoje, conversasSemana, conversasAnteriores,
    // Cleanup: para ser chamado no useEffect de unmount da página
    cleanup: () => {
      audioRecognitionRef.current?.abort();
      audioRecognitionRef.current = null;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },
  };
}
