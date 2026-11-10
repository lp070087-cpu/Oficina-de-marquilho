'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { codigoPedido, descreverPagamento, dinheiro, formas, htmlComprovante, imprimirPedido, maoDeObra } from './ComprovantePedido';

type Peca = { id: string; nome: string; codigo: string; marca?: string; codigoBarras?: string; imagemUrl?: string; precoVenda: string | number; quantidadeLoja: number; vendidosRecentes?: number; vendidosTotal?: number };
type Linha = { peca: Peca; quantidade: number };
type Servico = { id: string; nome: string; valor: string | number; categoria?: string };
type CategoriaFaixa = { id: string; nome: string; total: number };
type LinhaServico = { chave: string; servicoTabeladoId?: string; servicoOrdemId?: string; nome: string; valor: number };
type Pagamento = { tipo: string; valor: number; troco: number; modalidade?: 'A_VISTA' | 'PARCELADO'; parcelas?: number };
type LinhaAtual = { erro: string } | { pagamento: Pagamento; quita: boolean } | null;
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500';
const button = 'rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed';
const secondary = 'rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium hover:bg-slate-50 disabled:opacity-40';
// 8 linhas de 6 cartões no computador; cada clique em "Carregar mais" traz outras 48.
const POR_PAGINA = 48;
const STATUS_OS: Record<string, string> = { ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECAS: 'Aguardando peças', PRONTA: 'Finalizada · no Caixa', CONCLUIDA: 'Concluída', ENTREGUE: 'Entregue', CANCELADA: 'Cancelada' };

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  if (response.redirected) throw new Error('Sua sessão expirou. Entre novamente.');
  const body = await response.json().catch(() => { throw new Error('Resposta inválida do servidor. Tente novamente.'); });
  if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a operação.');
  return body;
}
const paraCentavos = (texto: string) => {
  const t = texto.trim().replace(/\s/g, '').replace(/^R\$/i, '');
  if (!t) return null;
  const n = Math.round(Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t) * 100);
  return Number.isFinite(n) ? n : NaN;
};

export default function Atendimento({ modo, podeReceber, podeConfigurar = false }: { modo: 'atendimento' | 'caixa'; podeReceber: boolean; podeConfigurar?: boolean }) {
  const caixa = modo === 'caixa';
  // ── Catálogo / busca incremental ─────────────────────────────
  const [busca, setBusca] = useState('');
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [totalBusca, setTotalBusca] = useState(0);
  const [proximo, setProximo] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(!caixa);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [categorias, setCategorias] = useState<CategoriaFaixa[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const versaoBusca = useRef(0);
  // ── Pedido em montagem ───────────────────────────────────────
  const [carrinho, setCarrinho] = useState<Linha[]>([]);
  const [aba, setAba] = useState<'pecas' | 'servicos' | 'os'>('pecas');
  // OS mantida aberta no Atendimento: o carrinho passa a representar os itens dessa OS.
  const [osEdicao, setOsEdicao] = useState<any>(null);
  const [salvoOS, setSalvoOS] = useState('');
  const [ordens, setOrdens] = useState<any[]>([]);
  const [filtroOS, setFiltroOS] = useState('ABERTO');
  const [ordensCarregadas, setOrdensCarregadas] = useState(false);
  const [catalogoServicos, setCatalogoServicos] = useState<Servico[]>([]);
  const [servicos, setServicos] = useState<LinhaServico[]>([]);
  const [avulsoNome, setAvulsoNome] = useState('');
  const [avulsoValor, setAvulsoValor] = useState('');
  const [moto, setMoto] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [abrirOS, setAbrirOS] = useState(false);
  const [os, setOS] = useState({ placa: '', ano: '', km: '', problema: '', servicosSolicitados: '' });
  // ── Geral ────────────────────────────────────────────────────
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const selecao = useRef(0);
  const viaEmitida = useRef(false);
  const secaoPedido = useRef<HTMLElement>(null);
  const catalogo = useRef<HTMLDivElement>(null);
  const [copiado, setCopiado] = useState(false);
  const [pedido, setPedido] = useState<any>(null);
  const [venda, setVenda] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [listado, setListado] = useState(false);
  const [status, setStatus] = useState('AGUARDANDO_PAGAMENTO');
  // ── Caixa ────────────────────────────────────────────────────
  const [codigo, setCodigo] = useState('');
  const [encontrados, setEncontrados] = useState<any[]>([]);
  const [tipo, setTipo] = useState('PIX');
  const [valor, setValor] = useState('');
  const [modalidade, setModalidade] = useState<'A_VISTA' | 'PARCELADO'>('A_VISTA');
  const [nParcelas, setNParcelas] = useState(2);
  const [maxParcelas, setMaxParcelas] = useState(4);
  const [novoMax, setNovoMax] = useState('');
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [comprovante, setComprovante] = useState(false);
  const [whatsTelefone, setWhatsTelefone] = useState('');
  const [whatsOficial, setWhatsOficial] = useState(false);
  const [whatsAtivo, setWhatsAtivo] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  const subtotal = (carrinho.reduce((s, i) => s + Math.round(Number(i.peca.precoVenda) * 100) * i.quantidade, 0) + servicos.reduce((s, i) => s + Math.round(i.valor * 100), 0)) / 100;
  const vazio = !carrinho.length && !servicos.length;
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0) + servicos.length;
  const totalPedido = Math.round(Number(pedido?.total || 0) * 100);
  const pago = pagamentos.reduce((s, p) => s + Math.round(p.valor * 100), 0);
  const restante = Math.max(0, totalPedido - pago);

  // Forma em edição no Caixa: vale como pagamento sem clicar em "Adicionar" quando quita o saldo.
  const linhaAtual = useMemo<LinhaAtual>(() => {
    if (restante <= 0) return null;
    const digitado = paraCentavos(valor);
    if (Number.isNaN(digitado) || (digitado !== null && digitado <= 0)) return { erro: 'Informe um valor válido maior que zero.' };
    const informado = digitado ?? restante;
    if (tipo !== 'DINHEIRO' && informado > restante) return { erro: 'O valor supera o saldo restante.' };
    const aplicado = Math.min(informado, restante);
    const credito = tipo === 'CARTAO_CREDITO' ? { modalidade, parcelas: modalidade === 'PARCELADO' ? nParcelas : 1 } : {};
    return { pagamento: { tipo, valor: aplicado / 100, troco: (informado - aplicado) / 100, ...credito } as Pagamento, quita: aplicado === restante };
  }, [restante, valor, tipo, modalidade, nParcelas]);
  const finais = restante === 0 ? pagamentos : linhaAtual && 'quita' in linhaAtual && linhaAtual.quita ? [...pagamentos, linhaAtual.pagamento] : null;
  const parcelado = tipo === 'CARTAO_CREDITO' && modalidade === 'PARCELADO';
  const valorParcela = (centavos: number, n: number) => dinheiro(Math.floor(centavos / n) / 100);

  const listar = useCallback(async () => {
    try { setPedidos(await api(`/api/pedidos?status=${status}`)); }
    catch (e) { setErro((e as Error).message); }
    finally { setListado(true); }
  }, [status]);
  useEffect(() => { listar(); }, [listar]);

  // ── Ordens de Serviço do Atendimento ─────────────────────────
  const assinatura = (c: Linha[], sv: LinhaServico[]) => JSON.stringify([c.map(i => [i.peca.id, i.quantidade]), sv.map(l => l.servicoOrdemId || l.servicoTabeladoId || `${l.nome}|${l.valor}`)]);
  const alterado = !!osEdicao && assinatura(carrinho, servicos) !== salvoOS;
  const listarOS = useCallback(async () => {
    if (caixa) return;
    try { setOrdens(await api(`/api/pedidos?os=1&status=${filtroOS}`)); }
    catch (e) { setErro((e as Error).message); }
    finally { setOrdensCarregadas(true); }
  }, [caixa, filtroOS]);
  useEffect(() => { if (aba === 'os') listarOS(); }, [aba, listarOS]);
  /** Carrega a OS no carrinho para continuar o atendimento (mesma OS, sem novo pedido). */
  function carregarOS(p: any) {
    const linhas: Linha[] = (p.itens || []).map((i: any) => ({ quantidade: i.quantidade, peca: { id: i.pecaId, nome: i.peca?.nome || 'Peça', codigo: i.peca?.codigo || '', imagemUrl: i.peca?.imagemUrl, precoVenda: i.precoVendido, quantidadeLoja: Math.max(i.peca?.quantidadeLoja ?? 0, 0) } }));
    const sv: LinhaServico[] = (p.servicos || []).map((x: any) => ({ chave: x.id, servicoOrdemId: x.id, nome: x.nome, valor: Number(x.valor) }));
    setOsEdicao(p); setCarrinho(linhas); setServicos(sv); setSalvoOS(assinatura(linhas, sv));
    setAbrirOS(false); setPedido(null); setVenda(null);
    setNome(p.clienteNome || ''); setTelefone(p.clienteTelefone || ''); setMoto(p.ordemServico?.modeloMoto && p.ordemServico.modeloMoto !== 'Nao informado' ? p.ordemServico.modeloMoto : '');
  }
  function continuarOS(p: any) {
    if (alterado && osEdicao?.id !== p.id && !window.confirm('A OS atual tem alterações não salvas. Descartar e abrir outra?')) return;
    if (!osEdicao && !vazio && !window.confirm('O pedido em montagem será descartado. Continuar a OS?')) return;
    setErro(''); setAviso(`Continuando a OS nº ${p.ordemServico?.numero ?? ''}. Adicione peças e serviços e clique em Salvar OS.`);
    carregarOS(p); setAba('pecas');
  }
  function sairDaOS() {
    if (alterado && !window.confirm('Há alterações não salvas nesta OS. Sair mesmo assim?')) return;
    setOsEdicao(null); setSalvoOS(''); setCarrinho([]); setServicos([]); setNome(''); setTelefone(''); setMoto(''); setAviso('');
  }
  const corpoItens = () => ({ itens: carrinho.map(i => ({ pecaId: i.peca.id, quantidade: i.quantidade })), servicos: servicos.map(({ servicoOrdemId, servicoTabeladoId, nome, valor }) => servicoOrdemId ? { id: servicoOrdemId } : servicoTabeladoId ? { servicoTabeladoId } : { nome, valor }) });
  async function salvarOS(acao: 'SALVAR' | 'FINALIZAR', alvo?: any) {
    const os = alvo || osEdicao;
    if (trava.current || !os) return;
    if (acao === 'FINALIZAR' && !window.confirm(`Finalizar a OS nº ${os.ordemServico?.numero ?? ''} e enviar ao Caixa? Depois disso a OS não poderá ser alterada.`)) return;
    trava.current = true; setOcupado(true); setErro(''); setAviso('');
    try {
      // Pela lista: finaliza com os itens já salvos. Em edição: grava o carrinho junto.
      const result = await api('/api/pedidos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: os.id, acao, ...(alvo ? {} : corpoItens()) }) });
      if (acao === 'FINALIZAR') {
        if (result?.status !== 'AGUARDANDO_PAGAMENTO') throw new Error('O servidor não confirmou a finalização. Consulte a OS antes de tentar novamente.');
        if (!alvo || osEdicao?.id === os.id) { setOsEdicao(null); setSalvoOS(''); setCarrinho([]); setServicos([]); setNome(''); setTelefone(''); setMoto(''); }
        setPedido(result); setVenda(null); setCopiado(false);
        setAviso(`OS nº ${result.ordemServico?.numero ?? ''} finalizada e enviada ao Caixa com o pedido ${codigoPedido(result)} · Total ${dinheiro(result.total)}.`);
      } else {
        carregarOS(result);
        setAviso(`OS nº ${result.ordemServico?.numero ?? ''} salva e mantida aberta · Total ${dinheiro(result.total)}.`);
      }
      await Promise.all([listar(), aba === 'os' ? listarOS() : Promise.resolve()]);
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }

  // Busca incremental: debounce curto, cancela a anterior, uma página por vez.
  const pesquisar = useCallback(async (termo: string, cat: string, offset: number, signal?: AbortSignal) => {
    const versao = offset === 0 ? ++versaoBusca.current : versaoBusca.current;
    const data = await api(`/api/pecas/busca?q=${encodeURIComponent(termo)}&categoria=${encodeURIComponent(cat)}&offset=${offset}&limite=${POR_PAGINA}`, { signal });
    if (versao !== versaoBusca.current) return;
    setPecas(old => offset === 0 ? data.itens : [...old, ...data.itens.filter((p: Peca) => !old.some(o => o.id === p.id))]);
    setTotalBusca(data.total); setProximo(data.proximo);
    if (offset === 0) { setDestaque(0); setCategorias(data.categorias || []); setTotalGeral(data.totalGeral ?? data.total); }
  }, []);
  useEffect(() => {
    if (caixa) return;
    const controller = new AbortController();
    setCarregando(true);
    const timer = setTimeout(async () => {
      try { await pesquisar(busca, categoria, 0, controller.signal); }
      catch (e) { if ((e as Error).name !== 'AbortError') setErro((e as Error).message); }
      finally { if (!controller.signal.aborted) setCarregando(false); }
    }, busca ? 180 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [busca, categoria, caixa, pesquisar]);
  const carregarMais = useCallback(async () => {
    if (proximo === null || carregandoMais || carregando) return;
    setCarregandoMais(true);
    try { await pesquisar(busca, categoria, proximo); } catch (e) { setErro((e as Error).message); } finally { setCarregandoMais(false); }
  }, [proximo, carregandoMais, carregando, pesquisar, busca, categoria]);
  useEffect(() => { document.getElementById(`peca-${pecas[destaque]?.id}`)?.scrollIntoView({ block: 'nearest' }); }, [destaque, pecas]);
  // Catálogo com rolagem própria no computador: altura até o fim da tela a partir de onde começa
  // (busca e categorias ficam acima, sempre acessíveis). No celular a página rola normalmente.
  useEffect(() => {
    const el = catalogo.current;
    if (!el) return;
    const ajustar = () => {
      if (window.innerWidth < 1024) { el.style.maxHeight = ''; return; }
      const area = el.closest('main') || document.documentElement;
      const topo = el.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop;
      el.style.maxHeight = `${Math.max(320, window.innerHeight - topo - 16)}px`;
    };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [aba, categorias.length, erro, aviso, osEdicao, abrirOS]);

  useEffect(() => {
    if (caixa) return;
    api('/api/servicos?ativo=true').then(setCatalogoServicos).catch(e => setErro((e as Error).message));
  }, [caixa]);
  useEffect(() => {
    if (!caixa) return;
    api('/api/caixa/config').then(c => { setMaxParcelas(c.maxParcelas); setNovoMax(String(c.maxParcelas)); }).catch(() => {});
    api('/api/comprovantes/whatsapp').then(c => setWhatsOficial(!!c.oficial)).catch(() => {});
    api('/api/configuracoes/whatsapp').then(c => setWhatsAtivo(c.ativo !== false)).catch(() => {});
  }, [caixa]);
  useEffect(() => {
    if (pedido?.id) secaoPedido.current?.scrollIntoView({ block: 'start' });
  }, [pedido?.id, venda?.id]);
  useEffect(() => { if (nParcelas > maxParcelas) setNParcelas(Math.max(2, maxParcelas)); }, [maxParcelas, nParcelas]);

  // Itens enviados pelo botão Vender do Estoque da Loja (mesma chave usada pelo PDV anterior).
  useEffect(() => {
    if (caixa) return;
    let enviados: any[] = [];
    try { enviados = JSON.parse(sessionStorage.getItem('pdv_preload') || '[]'); sessionStorage.removeItem('pdv_preload'); } catch { return; }
    if (!Array.isArray(enviados) || !enviados.length) return;
    (async () => {
      for (const item of enviados) {
        try {
          const achadas: Peca[] = await api(`/api/pecas?q=${encodeURIComponent(item.codigo)}`);
          const peca = achadas.find(p => p.id === item.pecaId);
          if (!peca || peca.quantidadeLoja <= 0 || Number(peca.precoVenda) <= 0) { setErro(`${item.nome} indisponível para venda.`); continue; }
          setCarrinho(old => old.some(i => i.peca.id === peca.id) ? old : [...old, { peca, quantidade: Math.min(Number(item.quantidade) || 1, peca.quantidadeLoja) }]);
        } catch (e) { setErro((e as Error).message); }
      }
    })();
  }, [caixa]);

  const vendivel = (p: Peca) => p.quantidadeLoja > 0 && Number(p.precoVenda) > 0;
  function adicionar(peca: Peca) {
    setErro('');
    if (!vendivel(peca)) { setErro(`${peca.nome} indisponível para venda.`); return; }
    setCarrinho(old => {
      const atual = old.find(i => i.peca.id === peca.id);
      if ((atual?.quantidade || 0) >= peca.quantidadeLoja) { setErro('Quantidade indisponível na loja.'); return old; }
      return atual ? old.map(i => i.peca.id === peca.id ? { ...i, quantidade: i.quantidade + 1 } : i) : [...old, { peca, quantidade: 1 }];
    });
  }
  function teclaBusca(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setDestaque(d => Math.min(d + 1, pecas.length - 1)); if (destaque >= pecas.length - 3) carregarMais(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setDestaque(d => Math.max(d - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (pecas[destaque]) adicionar(pecas[destaque]); }
    else if (e.key === 'Escape') setBusca('');
  }
  function quantidade(id: string, value: number) {
    if (!Number.isInteger(value) || value < 1) return;
    setCarrinho(old => old.map(i => i.peca.id === id ? { ...i, quantidade: Math.min(value, i.peca.quantidadeLoja) } : i));
  }
  function adicionarServico(s: Servico) {
    setErro('');
    setServicos(old => old.some(l => l.servicoTabeladoId === s.id) ? old : [...old, { chave: s.id, servicoTabeladoId: s.id, nome: s.nome, valor: Number(s.valor) }]);
  }
  function adicionarAvulso() {
    const centavos = paraCentavos(avulsoValor);
    if (!avulsoNome.trim() || !centavos || Number.isNaN(centavos) || centavos <= 0) { setErro('Informe a descrição e o valor da mão de obra.'); return; }
    setErro('');
    setServicos(old => [...old, { chave: `avulso-${Date.now()}`, nome: avulsoNome.trim(), valor: centavos / 100 }]);
    setAvulsoNome(''); setAvulsoValor('');
  }
  async function salvar(manterAberta = false) {
    if (trava.current || (vazio && !manterAberta)) return;
    if (abrirOS && (!nome.trim() || !telefone.trim() || !moto.trim())) { setErro('Para abrir a OS informe cliente, telefone e modelo da moto.'); setAba('servicos'); return; }
    trava.current = true; setOcupado(true); setErro(''); setAviso('');
    try {
      const result = await api('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'VENDA', origem: 'ATENDIMENTO', clienteNome: nome.trim() || null, clienteTelefone: telefone.trim() || null, moto: moto.trim() || null, os: abrirOS ? os : undefined, manterAberta: abrirOS && manterAberta, ...corpoItens() }) });
      ++selecao.current;
      if (abrirOS && manterAberta) {
        if (!result?.id || result.status !== 'ABERTO') throw new Error('O servidor não confirmou a abertura da OS. Consulte a aba Ordens de Serviço antes de tentar novamente.');
        setOS({ placa: '', ano: '', km: '', problema: '', servicosSolicitados: '' });
        carregarOS(result);
        setAviso(`OS nº ${result.ordemServico?.numero ?? ''} aberta e mantida em aberto. Continue adicionando peças e serviços; ela só vai ao Caixa ao clicar em Finalizar OS.`);
        return;
      }
      if (!result?.id || !Number.isInteger(result.numero) || result.status !== 'AGUARDANDO_PAGAMENTO') throw new Error('O servidor não confirmou a criação do pedido. Consulte o histórico antes de tentar novamente.');
      setPedido(result); setVenda(null); setCarrinho([]); setServicos([]); setMoto(''); setNome(''); setTelefone(''); setCopiado(false);
      if (abrirOS) setAviso(`OS nº ${result.ordemServico?.numero ?? ''} aberta e encaminhada ao Caixa com o pedido ${codigoPedido(result)}.`);
      setAbrirOS(false); setOS({ placa: '', ano: '', km: '', problema: '', servicosSolicitados: '' });
      try { await imprimirPedido(result, undefined, { formato: 'termica' }); }
      catch { setAviso('Pedido salvo. Não foi possível abrir a impressão automática. Use Imprimir código do pedido para tentar novamente.'); }
      await listar();
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }
  async function selecionar(p: any, travaPropria = false) {
    if (trava.current && !travaPropria) return;
    const versao = ++selecao.current;
    viaEmitida.current = true;
    setPedido(p); setVenda(null); setPagamentos([]); setValor(''); setTipo('PIX'); setModalidade('A_VISTA'); setErro(''); setAviso(''); setCopiado(false); setEncontrados([]); setComprovante(false);
    setWhatsTelefone(p.clienteTelefone || ''); setAutorizado(false);
    if (p.venda?.id) {
      try { const result = await api(`/api/vendas/${p.venda.id}`); if (versao === selecao.current) setVenda(result); }
      catch (e) { if (versao === selecao.current) setErro((e as Error).message); }
    }
  }
  async function consultar() {
    if (!codigo.trim() || trava.current) return;
    trava.current = true; setOcupado(true); setErro(''); setEncontrados([]);
    try {
      const result = await api(`/api/pedidos?codigo=${encodeURIComponent(codigo.trim())}`);
      const lista = Array.isArray(result) ? result : [result];
      if (!lista.length) throw new Error('Pedido não encontrado para este código.');
      // Vários pedidos com o mesmo início: o operador escolhe o correto.
      if (lista.length > 1) setEncontrados(lista);
      else await selecionar(lista[0], true);
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }
  function adicionarPagamento() {
    setErro('');
    if (!linhaAtual) return;
    if ('erro' in linhaAtual) { setErro(linhaAtual.erro); return; }
    setPagamentos(old => [...old, linhaAtual.pagamento]);
    setValor(''); setModalidade('A_VISTA');
  }
  async function receber() {
    if (trava.current || !pedido || !finais?.length) return;
    trava.current = true; setOcupado(true); setErro('');
    try {
      const result = await api('/api/vendas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pedidoId: pedido.id, pagamentos: finais }) });
      if (!result?.id || result.pedidoId !== pedido.id || result.status !== 'PAGA') throw new Error('O servidor não confirmou o pagamento. Consulte o pedido antes de tentar novamente.');
      viaEmitida.current = false;
      setVenda(result); setPedido({ ...pedido, status: 'PAGO', venda: result }); setPagamentos([]); setValor('');
      setComprovante(true); // comprovante gerado automaticamente, pronto para imprimir ou enviar
      await listar();
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }
  async function imprimir(formato: 'a4' | 'termica' = 'a4') {
    try { await imprimirPedido(pedido, venda, { segundaVia: viaEmitida.current, formato }); if (venda) viaEmitida.current = true; } catch (e) { setErro((e as Error).message); }
  }
  // Atendimento imprime no mesmo comprovante térmico (80 mm) do Caixa.
  async function imprimirAtendimento(p: any) {
    try { await imprimirPedido(p, undefined, { formato: 'termica' }); } catch (e) { setErro((e as Error).message); }
  }
  async function enviarWhatsApp() {
    if (!venda?.id) return;
    // A aba precisa abrir no clique (bloqueadores de pop-up); o endereço chega depois.
    const aba = window.open('about:blank', '_blank');
    setErro(''); setAviso('');
    try {
      const r = await api('/api/comprovantes/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendaId: venda.id, telefone: whatsTelefone }) });
      if (aba) { aba.opener = null; aba.location.href = r.whatsappUrl; } else window.location.href = r.whatsappUrl;
      setAviso(r.telefone ? 'Conversa aberta no WhatsApp com a mensagem e o link do comprovante. Confirme o envio no WhatsApp.' : 'WhatsApp aberto com a mensagem pronta. Escolha o contato do cliente e confirme o envio.');
    } catch (e) { aba?.close(); setErro((e as Error).message); }
  }
  async function enviarOficial() {
    if (!venda?.id || trava.current) return;
    trava.current = true; setOcupado(true); setErro(''); setAviso('');
    try {
      await api('/api/comprovantes/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendaId: venda.id, telefone: whatsTelefone, autorizado }) });
      setAviso('Comprovante aceito pela API oficial do WhatsApp. A entrega ao cliente é confirmada pelo próprio WhatsApp.');
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }
  async function salvarParcelamento() {
    setErro('');
    try { const c = await api('/api/caixa/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maxParcelas: Number(novoMax) }) }); setMaxParcelas(c.maxParcelas); setAviso(`Parcelamento atualizado: até ${c.maxParcelas}x sem juros.`); }
    catch (e) { setErro((e as Error).message); }
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(codigoPedido(pedido)); setCopiado(true); }
    catch { setErro('Não foi possível copiar. Selecione o código acima.'); }
  }
  function novoAtendimento() {
    ++selecao.current;
    setPedido(null); setVenda(null); setPagamentos([]); setValor(''); setCodigo(''); setErro(''); setAviso(''); setCopiado(false); setComprovante(false); setEncontrados([]);
    window.scrollTo({ top: 0 });
  }
  const osPedido = pedido?.ordemServico;

  return <div className="w-full min-w-0 space-y-6 p-4 lg:p-7 text-slate-800">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
      <div><p className="text-xs font-bold uppercase tracking-widest text-orange-700">Marquinho Moto Peças</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{caixa ? 'Receber pedido' : 'Atendimento'}</h1><p className="mt-2 text-sm text-slate-500">{caixa ? 'Localize o pedido e confirme o recebimento no caixa.' : 'Escolha peças e serviços, monte o pedido e encaminhe o código ao caixa.'}</p></div>
      <div className="flex gap-2">{caixa && <Link href="/balcao/caixa" className={secondary}>Gestão do caixa</Link>}</div>
    </header>
    {erro && <div role="alert" className="sticky top-2 z-30 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">{erro}<button className="ml-4 underline" onClick={() => setErro('')}>Fechar</button></div>}
    {aviso && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{aviso}<button className="ml-4 underline" onClick={() => setAviso('')}>Fechar</button></div>}
    {!caixa && <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0"><div className="mb-3 flex flex-wrap gap-2">{(['pecas', 'servicos', 'os'] as const).map(a => <button key={a} onClick={() => setAba(a)} aria-pressed={aba === a} className={`rounded-lg px-4 py-2 text-sm font-semibold ${aba === a ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white'}`}>{a === 'pecas' ? 'Peças' : a === 'servicos' ? 'Serviços / mão de obra' : 'Ordens de Serviço'}</button>)}{abrirOS && <span className="self-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">Ordem de Serviço em abertura</span>}{osEdicao && <span className="self-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">Editando OS nº {osEdicao.ordemServico?.numero} · em aberto</span>}</div>
        {aba === 'os' && <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-orange-200 bg-white p-4"><div><h2 className="text-lg font-bold">Ordens de Serviço do Atendimento</h2><p className="text-sm text-slate-600">A OS aberta continua recebendo peças e serviços. Só vai ao Caixa ao clicar em Finalizar OS.</p></div><button type="button" className={button} disabled={ocupado || !!osEdicao} onClick={() => { setAbrirOS(true); setAba('servicos'); }}>Abrir nova OS</button></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar OS">{[['ABERTO', 'Abertas'], ['AGUARDANDO_PAGAMENTO', 'Enviadas ao Caixa'], ['PAGO', 'Encerradas']].map(([v, l]) => <button key={v} type="button" aria-pressed={filtroOS === v} onClick={() => { setFiltroOS(v); setOrdensCarregadas(false); }} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${filtroOS === v ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-orange-50'}`}>{l}</button>)}<button type="button" onClick={listarOS} className="rounded-lg border bg-white px-3 py-1.5 text-xs">Atualizar</button></div>
          {!ordens.length && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{ordensCarregadas ? 'Nenhuma OS neste status.' : 'Carregando OS…'}</p>}
          {ordens.map(p => { const o = p.ordemServico || {}; const aberta = p.status === 'ABERTO'; const editando = osEdicao?.id === p.id; return <article key={p.id} className={`rounded-xl border bg-white p-4 ${editando ? 'border-orange-500 ring-2 ring-orange-500' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-bold">OS nº {o.numero} <span className="ml-1 font-mono text-sm text-slate-500">{codigoPedido(p)}</span></p><p className="text-sm text-slate-600">{p.clienteNome || 'Cliente não informado'}{p.clienteTelefone ? ` · ${p.clienteTelefone}` : ''}{o.modeloMoto && o.modeloMoto !== 'Nao informado' ? ` · ${o.modeloMoto}` : ''}{o.placaMoto ? ` · ${o.placaMoto}` : ''}</p><p className="text-xs text-slate-500">Aberta em {new Date(o.createdAt || p.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}{p.entradaCaixa ? ` · Enviada ao Caixa em ${new Date(p.entradaCaixa).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}` : ''}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${aberta ? 'bg-orange-100 text-orange-800' : p.status === 'PAGO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{aberta ? 'OS aberta' : p.status === 'PAGO' ? 'Paga · encerrada' : 'Aguardando pagamento no Caixa'}</span></div>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-400"><th className="py-2">Item</th><th className="px-2">Qtd.</th><th className="px-2 text-right">Unitário</th><th className="text-right">Valor</th></tr></thead><tbody>{(p.itens || []).map((i: any) => <tr key={i.id} className="border-b border-slate-100"><td className="py-2"><p className="font-medium">{i.peca?.nome}</p><span className="text-xs text-slate-400">{i.peca?.codigo} · Peça</span></td><td className="px-2">{i.quantidade}</td><td className="whitespace-nowrap px-2 text-right">{dinheiro(i.precoVendido)}</td><td className="whitespace-nowrap text-right font-semibold">{dinheiro(i.subtotal)}</td></tr>)}{(p.servicos || []).map((x: any) => <tr key={x.id} className="border-b border-slate-100"><td className="py-2"><p className="font-medium">{x.nome}</p><span className="text-xs text-slate-400">Serviço / mão de obra</span></td><td className="px-2">1</td><td className="whitespace-nowrap px-2 text-right">{dinheiro(x.valor)}</td><td className="whitespace-nowrap text-right font-semibold">{dinheiro(x.valor)}</td></tr>)}{!(p.itens?.length || p.servicos?.length) && <tr><td colSpan={4} className="py-3 text-slate-400">Nenhum item lançado ainda.</td></tr>}</tbody></table></div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xl font-bold">Total {dinheiro(p.total)}</p><div className="flex flex-wrap gap-2">{aberta ? <><button className={secondary} disabled={ocupado || editando} onClick={() => continuarOS(p)}>{editando ? 'Em edição' : 'Continuar OS'}</button><button className={button} disabled={ocupado || Number(p.total) <= 0 || (editando && alterado)} title={editando && alterado ? 'Salve ou finalize pela OS em edição' : undefined} onClick={() => salvarOS('FINALIZAR', p)}>Finalizar OS</button></> : <button className={secondary} disabled={ocupado} onClick={() => selecionar(p)}>Abrir</button>}<button className={secondary} onClick={() => imprimirAtendimento(p)}>Imprimir</button></div></div>
          </article>; })}
        </div>}
        {aba === 'servicos' && <div className="space-y-4">
          <div className={`rounded-xl border-2 p-4 ${abrirOS ? 'border-orange-500 bg-orange-50/60' : 'border-orange-200 bg-white'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Abrir Ordem de Serviço</h2><p className="text-sm text-slate-600">Cliente, moto e problema relatado. Peças e mão de obra entram na mesma OS, que pode ficar aberta e só segue para o Caixa ao ser finalizada.</p></div><button type="button" disabled={!!osEdicao} title={osEdicao ? 'Saia da OS em edição para abrir outra' : undefined} onClick={() => setAbrirOS(v => !v)} className={abrirOS ? secondary : button}>{abrirOS ? 'Cancelar OS' : 'Abrir OS'}</button></div>
            {abrirOS && <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Cliente *<input maxLength={150} value={nome} onChange={e => setNome(e.target.value)} className={`${input} mt-1`} placeholder="Nome do cliente" /></label>
              <label className="text-sm">Telefone *<input maxLength={30} type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className={`${input} mt-1`} placeholder="(81) 99999-9999" /></label>
              <label className="text-sm">Modelo da moto *<input maxLength={150} value={moto} onChange={e => setMoto(e.target.value)} className={`${input} mt-1`} placeholder="Ex.: Honda CG 160 Fan" /></label>
              <div className="grid grid-cols-3 gap-2"><label className="text-sm">Placa<input maxLength={10} value={os.placa} onChange={e => setOS({ ...os, placa: e.target.value.toUpperCase() })} className={`${input} mt-1 uppercase`} placeholder="ABC1D23" /></label><label className="text-sm">Ano<input maxLength={10} inputMode="numeric" value={os.ano} onChange={e => setOS({ ...os, ano: e.target.value })} className={`${input} mt-1`} placeholder="2020" /></label><label className="text-sm">KM<input maxLength={20} inputMode="numeric" value={os.km} onChange={e => setOS({ ...os, km: e.target.value })} className={`${input} mt-1`} placeholder="35000" /></label></div>
              <label className="text-sm sm:col-span-2">Problema relatado<textarea maxLength={2000} rows={2} value={os.problema} onChange={e => setOS({ ...os, problema: e.target.value })} className={`${input} mt-1`} placeholder="O que o cliente relatou" /></label>
              <label className="text-sm sm:col-span-2">Serviços solicitados<textarea maxLength={2000} rows={2} value={os.servicosSolicitados} onChange={e => setOS({ ...os, servicosSolicitados: e.target.value })} className={`${input} mt-1`} placeholder="Ex.: troca de óleo, revisão do freio" /></label>
              <p className="text-xs text-slate-500 sm:col-span-2">Adicione a mão de obra abaixo e as peças na aba Peças. O estoque só é baixado quando o Caixa confirmar o pagamento.</p>
            </div>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">{catalogoServicos.map(s => <article key={s.id} className="flex min-w-0 flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2"><span className="line-clamp-2 text-xs font-semibold leading-snug" title={s.nome}>{s.nome}</span><span className="mt-auto pt-1 text-sm font-bold">{dinheiro(s.valor)}</span><button className="rounded-md bg-orange-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-40" disabled={ocupado || servicos.some(l => l.servicoTabeladoId === s.id)} onClick={() => adicionarServico(s)}>Adicionar</button></article>)}</div>{!catalogoServicos.length && <p className="text-sm text-slate-500">Nenhum serviço tabelado ativo.</p>}<form className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_130px_auto]" onSubmit={e => { e.preventDefault(); adicionarAvulso(); }}><label className="text-sm">Mão de obra avulsa<input maxLength={150} value={avulsoNome} onChange={e => setAvulsoNome(e.target.value)} className={`${input} mt-1`} placeholder="Descrição do serviço" /></label><label className="text-sm">Valor<input inputMode="decimal" value={avulsoValor} onChange={e => setAvulsoValor(e.target.value)} className={`${input} mt-1`} placeholder="0,00" /></label><button className={`${secondary} self-end`} disabled={ocupado}>Adicionar</button></form></div>}
        {aba === 'pecas' && <><label htmlFor="busca-pecas" className="mb-2 block text-sm font-semibold">Pesquisar peças</label><input id="busca-pecas" role="combobox" aria-expanded={pecas.length > 0} aria-controls="lista-pecas" aria-activedescendant={pecas[destaque] ? `peca-${pecas[destaque].id}` : undefined} autoComplete="off" className={input} placeholder="Nome, marca, SKU ou código de barras" value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={teclaBusca} autoFocus />
        <div aria-live="polite" className="my-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500"><span>{carregando ? <span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />Buscando peças…</span> : `${totalBusca} ${totalBusca === 1 ? 'produto encontrado' : 'produtos encontrados'}${busca.trim() ? '' : ' · mais vendidos primeiro'}`}</span><span className="hidden text-xs sm:inline">↑ ↓ navegar · Enter adicionar · Esc limpar</span></div>
        <div role="group" aria-label="Categorias" className="-mx-1 mb-3 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible">{[{ id: '', nome: 'Todas', total: totalGeral }, ...categorias, ...(categoria && !categorias.some(c => c.id === categoria) ? [{ id: categoria, nome: 'Categoria selecionada', total: 0 }] : [])].map(c => <button key={c.id || 'todas'} type="button" aria-pressed={categoria === c.id} onClick={() => { if (categoria !== c.id) { setCategoria(c.id); setPecas([]); setProximo(null); } }} className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${categoria === c.id ? 'border-orange-600 bg-orange-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50'}`}>{c.nome}<span className={`ml-1.5 rounded px-1 text-[10px] ${categoria === c.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{c.total}</span></button>)}</div>
        <div id="catalogo-rolagem" ref={catalogo} className="lg:max-h-[calc(100dvh-15rem)] lg:min-h-[22rem] lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain lg:p-1 lg:pr-2 [scrollbar-width:thin]"><div id="lista-pecas" role="listbox" aria-label="Peças encontradas" className={`grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${carregando ? 'opacity-60' : ''}`}>
          {pecas.map((p, i) => <article id={`peca-${p.id}`} role="option" aria-selected={i === destaque} key={p.id} onMouseEnter={() => setDestaque(i)} className={`flex min-w-0 flex-col overflow-hidden rounded-lg border bg-white ${i === destaque ? 'border-orange-500 ring-2 ring-orange-500' : 'border-slate-200'}`}>
            <div className="relative flex h-20 items-center justify-center bg-slate-50 p-1">{p.imagemUrl ? <img loading="lazy" src={p.imagemUrl} alt={p.nome} className="h-full w-full object-contain" /> : <span className="flex h-full w-full items-center justify-center text-slate-300" aria-label="Sem foto"><svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></span>}{!busca.trim() && (p.vendidosRecentes || 0) > 0 && <span className="absolute left-1 top-1 rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Mais vendido</span>}</div>
            <div className="flex flex-1 flex-col gap-0.5 p-2"><span className="truncate text-[11px] text-slate-400">{p.codigo}{p.marca ? ` · ${p.marca}` : ''}</span><span className="line-clamp-2 text-xs font-semibold leading-snug" title={p.nome}>{p.nome}</span><span className="mt-auto pt-1 text-sm font-bold">{dinheiro(p.precoVenda)}</span><span className={`text-[11px] ${p.quantidadeLoja > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{p.quantidadeLoja > 0 ? `${p.quantidadeLoja} disponíveis` : 'Indisponível'}</span><button tabIndex={-1} aria-label={`Adicionar ${p.nome}`} className="mt-1 rounded-md bg-orange-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-40" disabled={!vendivel(p) || ocupado} onClick={() => adicionar(p)}>Adicionar</button></div>
          </article>)}
        </div>{!carregando && pecas.length === 0 && <p className="py-12 text-center text-slate-500">Nenhuma peça encontrada. Confira a grafia ou tente parte do nome, a marca ou o SKU.</p>}
        {proximo !== null && <div className="mt-5 flex flex-col items-center gap-1"><button className={secondary} disabled={carregandoMais || carregando} onClick={carregarMais}>{carregandoMais ? 'Carregando…' : 'Carregar mais produtos'}</button><span className="text-xs text-slate-500">{pecas.length} de {totalBusca} exibidos</span></div>}{proximo === null && !carregando && pecas.length > 0 && <p className="mt-5 text-center text-sm text-slate-500">Todos os produtos foram carregados</p>}</div></>}
        {!vazio && <a href="#pedido-montagem" className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg xl:hidden"><span>{totalItens} {totalItens === 1 ? 'item' : 'itens'} · {dinheiro(subtotal)}</span><span>Ver pedido</span></a>}
      </section>
      <aside id="pedido-montagem" className="scroll-mt-20 self-start rounded-xl border border-slate-200 bg-white p-5 xl:sticky xl:top-4"><h2 className="text-xl font-bold">{osEdicao ? `OS nº ${osEdicao.ordemServico?.numero ?? ''}` : abrirOS ? 'Ordem de Serviço' : 'Pedido em montagem'}</h2><p className="mt-1 text-sm text-slate-500">{totalItens} {totalItens === 1 ? 'item' : 'itens'}{osEdicao && <> · <span className="font-semibold text-orange-700">em aberto</span> · <span className="font-mono">{codigoPedido(osEdicao)}</span>{alterado && <span className="ml-1 font-semibold text-amber-700">· alterações não salvas</span>}</>}</p>
        <div className="my-4 max-h-[460px] space-y-4 overflow-y-auto">{vazio && <p className="py-8 text-center text-slate-400">Adicione peças ou serviços.</p>}{carrinho.map(i => <div className="border-b border-slate-100 pb-4" key={i.peca.id}><div className="flex justify-between gap-3"><span className="font-semibold">{i.peca.nome}</span><button aria-label={`Remover ${i.peca.nome}`} className="-my-2 px-1 py-2.5 text-sm text-red-700" disabled={ocupado} onClick={() => setCarrinho(old => old.filter(l => l.peca.id !== i.peca.id))}>Remover</button></div><p className="my-2 text-xs text-slate-500">{i.peca.codigo} · {dinheiro(i.peca.precoVenda)} un.</p><div className="flex items-center justify-between"><div className="flex items-center gap-2"><button className="h-10 w-10 rounded-lg border" disabled={ocupado || i.quantidade <= 1} aria-label={`Diminuir ${i.peca.nome}`} onClick={() => quantidade(i.peca.id, i.quantidade - 1)}>−</button><input className="w-14 rounded border p-2 text-center" aria-label={`Quantidade ${i.peca.nome}`} type="number" min={1} max={i.peca.quantidadeLoja} disabled={ocupado} value={i.quantidade} onChange={e => quantidade(i.peca.id, Number(e.target.value))} /><button className="h-10 w-10 rounded-lg border" disabled={ocupado || i.quantidade >= i.peca.quantidadeLoja} aria-label={`Aumentar ${i.peca.nome}`} onClick={() => quantidade(i.peca.id, i.quantidade + 1)}>+</button></div><strong>{dinheiro(Number(i.peca.precoVenda) * i.quantidade)}</strong></div></div>)}{servicos.map(s => <div className="border-b border-slate-100 pb-4" key={s.chave}><div className="flex justify-between gap-3"><span className="font-semibold">{s.nome}</span><button aria-label={`Remover ${s.nome}`} className="-my-2 px-1 py-2.5 text-sm text-red-700" disabled={ocupado} onClick={() => setServicos(old => old.filter(l => l.chave !== s.chave))}>Remover</button></div><div className="mt-1 flex justify-between text-sm"><span className="text-xs text-slate-500">Serviço</span><strong>{dinheiro(s.valor)}</strong></div></div>)}</div>
        {osEdicao ? <div className="rounded-lg bg-orange-50 p-3 text-sm"><p className="font-semibold">{osEdicao.clienteNome || 'Cliente não informado'}{osEdicao.clienteTelefone ? ` · ${osEdicao.clienteTelefone}` : ''}</p><p className="text-slate-600">{[osEdicao.ordemServico?.modeloMoto !== 'Nao informado' && osEdicao.ordemServico?.modeloMoto, osEdicao.ordemServico?.placaMoto].filter(Boolean).join(' · ') || 'Moto não informada'}</p><p className="text-xs text-slate-500">Aberta em {new Date(osEdicao.ordemServico?.createdAt || osEdicao.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}</p></div>
        : abrirOS ? <div className="rounded-lg bg-orange-50 p-3 text-sm"><p className="font-semibold">{nome || 'Cliente não informado'}{telefone ? ` · ${telefone}` : ''}</p><p className="text-slate-600">{moto || 'Moto não informada'}{os.placa ? ` · ${os.placa}` : ''}{os.ano ? ` · ${os.ano}` : ''}{os.km ? ` · ${os.km} km` : ''}</p><button className="mt-1 text-xs font-semibold text-orange-700 underline" onClick={() => setAba('servicos')}>Editar dados da OS</button></div>
        : <><label className="mb-3 block text-sm">Cliente (opcional)<input maxLength={150} disabled={ocupado} value={nome} onChange={e => setNome(e.target.value)} className={`${input} mt-1`} placeholder="Nome do cliente" /></label><label className="block text-sm">Telefone (opcional)<input maxLength={30} disabled={ocupado} type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className={`${input} mt-1`} placeholder="(81) 99999-9999" /></label>{servicos.length > 0 && <label className="mt-3 block text-sm">Moto (opcional)<input maxLength={150} disabled={ocupado} value={moto} onChange={e => setMoto(e.target.value)} className={`${input} mt-1`} placeholder="Modelo da moto" /></label>}</>}
        <div className="my-5 space-y-2 border-t pt-4"><p className="flex justify-between text-sm"><span>Subtotal</span><span>{dinheiro(subtotal)}</span></p><p className="flex justify-between text-sm"><span>Descontos</span><span>{dinheiro(0)}</span></p><p className="flex justify-between text-2xl font-bold"><span>Total</span><span>{dinheiro(subtotal)}</span></p><p className="text-xs text-slate-500">Preços do cadastro. Descontos dependem de autorização da administração.</p></div>
        {osEdicao ? <div className="space-y-2"><button onClick={() => salvarOS('SALVAR')} disabled={ocupado || !alterado} className={`${secondary} w-full`}>{ocupado ? 'Salvando…' : alterado ? 'Salvar OS (manter aberta)' : 'OS salva'}</button><button onClick={() => salvarOS('FINALIZAR')} disabled={ocupado || vazio || subtotal <= 0} className={`${button} w-full`}>Finalizar OS e enviar ao Caixa</button><button onClick={sairDaOS} disabled={ocupado} className="w-full py-2 text-sm font-semibold text-slate-600 underline">Sair da OS (continua aberta)</button><p className="text-xs text-slate-500">A OS aberta não aparece no Caixa. Só ao finalizar ela entra na fila de pagamento e deixa de aceitar alterações.</p></div>
        : abrirOS ? <div className="space-y-2"><button onClick={() => salvar(true)} disabled={ocupado} className={`${button} w-full`}>{ocupado ? 'Salvando…' : 'Abrir OS e manter aberta'}</button><button onClick={() => salvar()} disabled={ocupado || vazio || subtotal <= 0} className={`${secondary} w-full`}>Salvar e enviar direto ao Caixa</button><p className="text-xs text-slate-500">Mantida aberta, a OS continua recebendo peças e serviços na aba Ordens de Serviço e só vai ao Caixa ao clicar em Finalizar OS.</p></div>
        : <><button onClick={() => salvar()} disabled={ocupado || vazio || subtotal <= 0} className={`${button} w-full`}>{ocupado ? 'Salvando…' : 'Confirmar pedido e gerar código'}</button><p className="mt-3 text-xs text-slate-500">O pedido será salvo aguardando pagamento.</p></>}
      </aside>
    </div>}
    {caixa && <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5" onSubmit={e => { e.preventDefault(); consultar(); }}><label className="min-w-[14rem] flex-1 text-sm font-semibold">Código ou número do pedido<input className={`${input} mt-2 font-mono text-xl uppercase`} placeholder="6709-MP, 6709 ou 09" value={codigo} onChange={e => setCodigo(e.target.value)} autoFocus /></label><button className={`${button} w-full sm:w-auto`} disabled={ocupado || !codigo.trim()}>{ocupado ? 'Consultando…' : 'Localizar pedido'}</button><p className="w-full text-xs text-slate-500">Digite o código completo (6709-MP), só o número ou os últimos dígitos (6709, 709, 09), ou use o leitor. Havendo mais de um, escolha na lista. Códigos antigos (58-MP0000 e MP-000058) também funcionam.</p></form>}
    {caixa && encontrados.length > 1 && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4"><h2 className="font-bold">{encontrados.length} pedidos encontrados — selecione o correto</h2><p className="text-sm text-amber-900">Confira código, cliente e valor antes de receber. Aguardando pagamento aparecem primeiro.</p><div className="mt-3 divide-y rounded-lg border border-amber-200 bg-white">{encontrados.map(p => <button key={p.id} disabled={ocupado} onClick={() => selecionar(p)} className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left hover:bg-amber-50"><span><span className="font-mono font-bold">{codigoPedido(p)}</span><span className="ml-2 text-sm text-slate-500">{p.clienteNome || 'Cliente não informado'} · {new Date(p.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}</span></span><span className="text-right"><strong>{dinheiro(p.total)}</strong><span className={`ml-2 text-xs font-semibold ${p.status === 'PAGO' ? 'text-emerald-700' : 'text-amber-700'}`}>{p.status.replaceAll('_', ' ')}</span></span></button>)}</div></section>}
    {caixa && podeConfigurar && <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm"><summary className="cursor-pointer font-semibold">Parcelamento no cartão de crédito (administração)</summary><div className="mt-3 flex flex-wrap items-end gap-3"><label>Máximo de parcelas<select value={novoMax} onChange={e => setNovoMax(e.target.value)} className={`${input} mt-1 w-32`}>{Array.from({ length: 24 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}x</option>)}</select></label><button className={secondary} onClick={salvarParcelamento}>Salvar</button><p className="text-xs text-slate-500">Sem juros ou taxas: o cliente paga o total do pedido dividido nas parcelas. Atual: até {maxParcelas}x.</p></div></details>}
    {pedido && <section ref={secaoPedido} className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-5 lg:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-500">Pedido salvo</p><h2 className="mt-1 break-all font-mono text-3xl font-bold tracking-wide">{codigoPedido(pedido)}</h2><p className={`mt-2 font-semibold ${pedido.status === 'PAGO' ? 'text-emerald-700' : 'text-amber-700'}`}>{pedido.status.replaceAll('_', ' ')}</p></div><div className="flex flex-wrap gap-2"><button className={secondary} onClick={copiar}>{copiado ? 'Código copiado ✓' : 'Copiar código'}</button>{pedido.status === 'PAGO' ? <button className={secondary} onClick={() => setComprovante(true)} disabled={!venda}>Comprovante / 2ª via</button> : <button className={secondary} onClick={() => caixa ? imprimir('a4') : imprimirAtendimento(pedido)}>Imprimir código do pedido</button>}<button className={secondary} onClick={novoAtendimento} disabled={ocupado}>{caixa ? 'Atender outro pedido' : 'Novo pedido'}</button></div></div>
      <p className="mt-4 text-sm text-slate-500">{pedido.clienteNome || 'Cliente não informado'}{pedido.clienteTelefone ? ` · ${pedido.clienteTelefone}` : ''}</p>
      {osPedido && <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm"><p className="font-semibold">OS nº {osPedido.numero} · {STATUS_OS[osPedido.status] || osPedido.status}</p><p className="text-slate-600">{[osPedido.modeloMoto !== 'Nao informado' && osPedido.modeloMoto, osPedido.placaMoto, osPedido.anoMoto, osPedido.kmAtual && `${osPedido.kmAtual} km`].filter(Boolean).join(' · ')}</p>{osPedido.descricaoProblema && <p className="text-slate-600">Problema: {osPedido.descricaoProblema}</p>}</div>}
      <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-400"><th className="py-3">Produto</th><th className="px-2">Qtd.</th><th className="px-2 text-right">Unitário</th><th className="text-right">Valor</th></tr></thead><tbody>{pedido.itens?.map((i: any) => <tr key={i.id} className="border-b border-slate-100"><td className="py-3"><p className="font-medium">{i.peca?.nome}</p><span className="text-xs text-slate-400">{i.peca?.codigo}</span></td><td className="px-2">{i.quantidade}</td><td className="whitespace-nowrap px-2 text-right">{dinheiro(i.precoVendido)}</td><td className="whitespace-nowrap text-right font-semibold">{dinheiro(i.subtotal)}</td></tr>)}{pedido.tipo !== 'ORDEM_SERVICO' && pedido.servicos?.map((s: any) => <tr key={s.id} className="border-b border-slate-100"><td className="py-3"><p className="font-medium">{s.nome}</p><span className="text-xs text-slate-400">Serviço</span></td><td className="px-2">1</td><td className="whitespace-nowrap px-2 text-right">{dinheiro(s.valor)}</td><td className="whitespace-nowrap text-right font-semibold">{dinheiro(s.valor)}</td></tr>)}</tbody></table></div><div className="ml-auto mt-4 max-w-sm space-y-2">{pedido.tipo === 'ORDEM_SERVICO' && maoDeObra(pedido) > 0 && <p className="flex justify-between text-sm"><span>Serviços / mão de obra</span><span>{dinheiro(maoDeObra(pedido))}</span></p>}<p className="flex justify-between text-sm"><span>Subtotal</span><span>{dinheiro(pedido.subtotal)}</span></p><p className="flex justify-between text-sm"><span>Descontos</span><span>{dinheiro(pedido.descontoTotal)}</span></p><p className="flex justify-between text-2xl font-bold"><span>Total</span><span>{dinheiro(pedido.total)}</span></p></div>
      {pedido.status === 'PAGO' && venda && <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-5"><span className="inline-block rotate-[-5deg] border-4 border-emerald-700 px-5 py-1 text-3xl font-black text-emerald-700">PAGO</span><p className="mt-4 text-sm">Recebido por {venda.operadorNome} em {new Date(venda.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}.</p>{venda.pagamentos?.map((p: any, i: number) => <p className="mt-1 text-sm" key={i}>{descreverPagamento(p)}: {dinheiro(p.valor)}{Number(p.troco) > 0 ? ` · Troco: ${dinheiro(p.troco)}` : ''}</p>)}<p className="mt-3 text-xs font-semibold uppercase">Documento interno sem valor fiscal</p></div>}
      {caixa && podeReceber && pedido.status === 'AGUARDANDO_PAGAMENTO' && <div className="mt-6 border-t pt-5"><h3 className="text-xl font-bold">Recebimento</h3><p className="mt-1 text-sm text-slate-500">Escolha a forma de pagamento. Com uma única forma que cubra o total, basta confirmar. Para pagamento misto, use “Adicionar outra forma”.</p>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Forma de pagamento">{Object.entries(formas).map(([key, label]) => <button key={key} type="button" role="radio" aria-checked={tipo === key} disabled={ocupado || restante === 0} onClick={() => { setTipo(key); setErro(''); }} className={`rounded-lg border px-4 py-3 text-sm font-semibold ${tipo === key ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>{label}</button>)}</div>
        {restante > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">{tipo === 'DINHEIRO' ? 'Valor recebido em dinheiro' : 'Valor nesta forma'}<input className={`${input} mt-1`} disabled={ocupado} inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder={(restante / 100).toFixed(2).replace('.', ',')} /><span className="mt-1 block text-xs text-slate-500">Vazio = saldo restante ({dinheiro(restante / 100)}).</span></label>
          {tipo === 'CARTAO_CREDITO' && <fieldset className="text-sm"><legend>Modalidade</legend><div className="mt-1 flex gap-2">{(['A_VISTA', 'PARCELADO'] as const).map(m => <button key={m} type="button" aria-pressed={modalidade === m} disabled={ocupado || (m === 'PARCELADO' && maxParcelas < 2)} onClick={() => setModalidade(m)} className={`flex-1 rounded-lg border px-3 py-3 font-semibold ${modalidade === m ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'} disabled:opacity-40`}>{m === 'A_VISTA' ? 'À vista' : 'Parcelado'}</button>)}</div>{maxParcelas < 2 && <span className="mt-1 block text-xs text-slate-500">Parcelamento desativado pela administração.</span>}</fieldset>}
          {parcelado && <label className="text-sm">Parcelas<select className={`${input} mt-1`} disabled={ocupado} value={nParcelas} onChange={e => setNParcelas(Number(e.target.value))}>{Array.from({ length: Math.max(0, maxParcelas - 1) }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n}x de {valorParcela(linhaAtual && 'pagamento' in linhaAtual ? Math.round(linhaAtual.pagamento.valor * 100) : restante, n)}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Sem juros. Opções definidas pela administração.</span></label>}
        </div>}
        {linhaAtual && 'erro' in linhaAtual && valor.trim() && <p className="mt-2 text-sm font-semibold text-red-700">{linhaAtual.erro}</p>}
        {linhaAtual && 'pagamento' in linhaAtual && linhaAtual.pagamento.troco > 0 && <p className="mt-3 text-lg font-bold text-emerald-700">Troco: {dinheiro(linhaAtual.pagamento.troco)}</p>}
        <div className="mt-4 space-y-2">{pagamentos.map((p, i) => <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"><span>{descreverPagamento(p)} · {dinheiro(p.valor)}{p.troco > 0 ? ` · Troco ${dinheiro(p.troco)}` : ''}</span><button disabled={ocupado} className="-my-2 px-1 py-2.5 text-red-700 underline" onClick={() => setPagamentos(old => old.filter((_, index) => index !== i))}>Remover</button></div>)}</div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><p className="text-lg font-bold">Saldo restante: {dinheiro((finais ? 0 : restante) / 100)}</p>{!finais && pagamentos.length > 0 && <p className="text-xs text-slate-500">Informe a próxima forma para completar o pagamento misto.</p>}</div><div className="flex flex-wrap gap-2">{restante > 0 && <button className={secondary} onClick={adicionarPagamento} disabled={ocupado || !linhaAtual || 'erro' in linhaAtual || linhaAtual.quita && !pagamentos.length && !valor.trim()}>Adicionar outra forma</button>}<button onClick={receber} className={button} disabled={ocupado || !finais?.length || totalPedido <= 0}>{ocupado ? 'Registrando recebimento…' : `Confirmar recebimento de ${dinheiro(pedido.total)}`}</button></div></div></div>}
    </section>}
    {comprovante && pedido && venda && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Comprovante" onClick={e => { if (e.target === e.currentTarget) setComprovante(false); }}>
      <div className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-white shadow-xl sm:max-h-[92vh] sm:rounded-xl">
        <div className="flex items-center justify-between gap-3 border-b p-4"><div><p className="text-xs font-bold uppercase text-emerald-700">Pagamento registrado</p><h2 className="text-lg font-bold">Comprovante {codigoPedido(pedido)}</h2></div><button className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar comprovante" onClick={() => setComprovante(false)}>✕</button></div>
        <iframe title="Pré-visualização do comprovante" className="min-h-[40vh] flex-1 bg-slate-50" srcDoc={htmlComprovante(pedido, venda, { segundaVia: viaEmitida.current })} />
        <div className="space-y-3 border-t p-4">
          <div className="flex flex-wrap gap-2"><button className={button} onClick={() => imprimir('a4')}>Imprimir A4</button><button className={secondary} onClick={() => imprimir('termica')}>Imprimir térmica (80 mm)</button></div>
          <p className="text-xs text-slate-500">A impressão abre a janela do navegador para escolher a impressora. Para PDF, escolha “Salvar como PDF”.</p>
          {whatsAtivo ? <><div className="flex flex-wrap items-end gap-2 border-t pt-3"><label className="min-w-[12rem] flex-1 text-sm">WhatsApp do cliente<input type="tel" maxLength={30} value={whatsTelefone} onChange={e => setWhatsTelefone(e.target.value)} className={`${input} mt-1`} placeholder="(81) 99999-9999" /></label><button className="rounded-lg bg-[#1f8f4e] px-5 py-3 font-semibold text-white hover:bg-[#187a42]" onClick={enviarWhatsApp}>Enviar pelo WhatsApp</button></div>
          {whatsOficial && <div className="flex flex-wrap items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={autorizado} onChange={e => setAutorizado(e.target.checked)} />Cliente autorizou receber pelo WhatsApp</label><button className={secondary} disabled={ocupado || !autorizado} onClick={enviarOficial}>Enviar pela API oficial</button></div>}</> : <p className="border-t pt-3 text-sm text-slate-500">Envio pelo WhatsApp desativado pela administração. Use a impressão.</p>}
          <p className="text-xs text-slate-500">O link do comprovante expira em 7 dias. Documento interno sem valor fiscal.</p>
        </div>
      </div>
    </div>}
    <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{caixa ? 'Consulta de pedidos' : 'Meus pedidos'}</h2><div className="flex flex-wrap gap-2"><select aria-label="Filtrar pedidos por status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="AGUARDANDO_PAGAMENTO">Aguardando pagamento</option><option value="PAGO">Pagos</option></select><button onClick={listar} className="rounded-lg border bg-white px-3 py-2">Atualizar</button></div></div><div className="divide-y rounded-xl border border-slate-200 bg-white">{!pedidos.length && <p className="p-6 text-sm text-slate-500">{listado ? 'Nenhum pedido neste status.' : 'Carregando pedidos…'}</p>}{pedidos.map((p, n) => <button key={p.id} disabled={ocupado} onClick={() => selecionar(p)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"><div><p className="font-mono font-bold">{status === 'AGUARDANDO_PAGAMENTO' && <span className="mr-2 inline-block min-w-[2rem] rounded bg-slate-900 px-1.5 py-0.5 text-center font-sans text-xs text-white" title="Posição na fila">{n + 1}º</span>}{codigoPedido(p)}{p.ordemServico?.tipoServico === 'ORDEM_SERVICO' && <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 font-sans text-[11px] font-bold text-orange-800">OS {p.ordemServico.numero} · {STATUS_OS[p.ordemServico.status] || p.ordemServico.status}</span>}</p><p className="mt-1 text-sm text-slate-500">{p.clienteNome || 'Cliente não informado'} · {status === 'AGUARDANDO_PAGAMENTO' ? 'Na fila desde ' : ''}{new Date((status === 'AGUARDANDO_PAGAMENTO' && p.entradaCaixa) || p.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}</p></div><div className="text-right"><strong>{dinheiro(p.total)}</strong><p className={`mt-1 text-xs font-semibold ${p.status === 'PAGO' ? 'text-emerald-700' : 'text-amber-700'}`}>{p.status.replaceAll('_', ' ')}</p></div></button>)}</div></section>
  </div>;
}
