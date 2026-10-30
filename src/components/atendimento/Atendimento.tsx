'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { codigoPedido, dinheiro, formas, imprimirPedido, maoDeObra } from './ComprovantePedido';

type Peca = { id: string; nome: string; codigo: string; marca?: string; codigoBarras?: string; imagemUrl?: string; precoVenda: string | number; quantidadeLoja: number };
type Linha = { peca: Peca; quantidade: number };
type Pagamento = { tipo: string; valor: number; troco: number };
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-orange-500';
const button = 'rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed';
const secondary = 'rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium hover:bg-slate-50 disabled:opacity-40';

async function api(url: string, init?: RequestInit) {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ATENDIMENTO_DEMO === '1') return (await import('./demo')).demoApi(url, init);
  const response = await fetch(url, { ...init, cache: 'no-store' });
  if (response.redirected) throw new Error('Sua sessão expirou. Entre novamente.');
  const body = await response.json().catch(() => { throw new Error('Resposta inválida do servidor. Tente novamente.'); });
  if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a operação.');
  return body;
}

export default function Atendimento({ modo, podeReceber }: { modo: 'atendimento' | 'caixa'; podeReceber: boolean }) {
  const [busca, setBusca] = useState('');
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(modo === 'atendimento');
  const [carrinho, setCarrinho] = useState<Linha[]>([]);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const selecao = useRef(0);
  const viaEmitida = useRef(false);
  const secaoPedido = useRef<HTMLElement>(null);
  const [copiado, setCopiado] = useState(false);
  const [pedido, setPedido] = useState<any>(null);
  const [venda, setVenda] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [listado, setListado] = useState(false);
  const [status, setStatus] = useState('AGUARDANDO_PAGAMENTO');
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState('PIX');
  const [valor, setValor] = useState('');
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const caixa = modo === 'caixa';
  const subtotal = carrinho.reduce((s, i) => s + Math.round(Number(i.peca.precoVenda) * 100) * i.quantidade, 0) / 100;
  const totalPedido = Math.round(Number(pedido?.total || 0) * 100);
  const pago = pagamentos.reduce((s, p) => s + Math.round(p.valor * 100), 0);
  const restante = Math.max(0, totalPedido - pago);

  const listar = useCallback(async () => {
    try { setPedidos(await api(`/api/pedidos?status=${status}`)); }
    catch (e) { setErro((e as Error).message); }
    finally { setListado(true); }
  }, [status]);
  useEffect(() => { listar(); }, [listar]);
  useEffect(() => {
    if (caixa) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCarregando(true);
      try { const data = await api(`/api/pecas?q=${encodeURIComponent(busca)}`, { signal: controller.signal }); setPecas(data); }
      catch (e) { if ((e as Error).name !== 'AbortError') setErro((e as Error).message); }
      finally { if (!controller.signal.aborted) setCarregando(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [busca, caixa]);
  useEffect(() => {
    if (pedido?.id) secaoPedido.current?.scrollIntoView({ block: 'start' });
  }, [pedido?.id, venda?.id]);

  function adicionar(peca: Peca) {
    setErro('');
    setCarrinho(old => {
      const atual = old.find(i => i.peca.id === peca.id);
      if ((atual?.quantidade || 0) >= peca.quantidadeLoja) { setErro('Quantidade indisponível na loja.'); return old; }
      return atual ? old.map(i => i.peca.id === peca.id ? { ...i, quantidade: i.quantidade + 1 } : i) : [...old, { peca, quantidade: 1 }];
    });
  }
  function quantidade(id: string, value: number) {
    if (!Number.isInteger(value) || value < 1) return;
    setCarrinho(old => old.map(i => i.peca.id === id ? { ...i, quantidade: Math.min(value, i.peca.quantidadeLoja) } : i));
  }
  async function salvar() {
    if (trava.current || !carrinho.length) return;
    trava.current = true; setOcupado(true); setErro('');
    try {
      const result = await api('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'VENDA', origem: 'ATENDIMENTO', clienteNome: nome.trim() || null, clienteTelefone: telefone.trim() || null, itens: carrinho.map(i => ({ pecaId: i.peca.id, quantidade: i.quantidade })) }) });
      ++selecao.current;
      if (!result?.id || !Number.isInteger(result.numero) || result.status !== 'AGUARDANDO_PAGAMENTO') throw new Error('O servidor não confirmou a criação do pedido. Consulte o histórico antes de tentar novamente.');
      setPedido(result); setVenda(null); setCarrinho([]); setNome(''); setTelefone(''); setCopiado(false); await listar();
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }
  async function selecionar(p: any, travaPropria = false) {
    if (trava.current && !travaPropria) return;
    const versao = ++selecao.current;
    viaEmitida.current = true;
    setPedido(p); setVenda(null); setPagamentos([]); setValor(''); setErro(''); setCopiado(false);
    if (p.venda?.id) {
      try { const result = await api(`/api/vendas/${p.venda.id}`); if (versao === selecao.current) setVenda(result); }
      catch (e) { if (versao === selecao.current) setErro((e as Error).message); }
    }
  }
  async function consultar() {
    if (!codigo.trim() || trava.current) return;
    trava.current = true; setOcupado(true); setErro('');
    try {
      const result = await api(`/api/pedidos?codigo=${encodeURIComponent(codigo.trim())}`);
      const p = Array.isArray(result) ? result[0] : result;
      if (!p) throw new Error('Pedido não encontrado para este código.');
      await selecionar(p, true);
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }
  function adicionarPagamento() {
    setErro('');
    const texto = valor.trim().replace(/\s/g, '');
    const centavos = texto ? Math.round(Number(texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto) * 100) : restante;
    if (!Number.isFinite(centavos) || centavos <= 0 || restante <= 0) { setErro('Informe um valor válido maior que zero.'); return; }
    if (tipo !== 'DINHEIRO' && centavos > restante) { setErro('O valor supera o saldo restante.'); return; }
    const aplicado = Math.min(centavos, restante);
    setPagamentos(old => [...old, { tipo, valor: aplicado / 100, troco: (centavos - aplicado) / 100 }]);
    setValor('');
  }
  async function receber() {
    if (trava.current || !pedido || restante !== 0 || !pagamentos.length) return;
    trava.current = true; setOcupado(true); setErro('');
    try {
      const result = await api('/api/vendas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pedidoId: pedido.id, pagamentos }) });
      if (!result?.id || result.pedidoId !== pedido.id || result.status !== 'PAGA') throw new Error('O servidor não confirmou o pagamento. Consulte o pedido antes de tentar novamente.');
      viaEmitida.current = false;
      setVenda(result); setPedido({ ...pedido, status: 'PAGO', venda: result }); setPagamentos([]); await listar();
    } catch (e) { setErro((e as Error).message); }
    finally { trava.current = false; setOcupado(false); }
  }
  function imprimir() {
    try { imprimirPedido(pedido, venda, viaEmitida.current); if (venda) viaEmitida.current = true; } catch (e) { setErro((e as Error).message); }
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(codigoPedido(pedido.numero)); setCopiado(true); }
    catch { setErro('Não foi possível copiar. Selecione o código acima.'); }
  }
  function novoAtendimento() {
    ++selecao.current;
    setPedido(null); setVenda(null); setPagamentos([]); setValor(''); setCodigo(''); setErro(''); setCopiado(false);
    window.scrollTo({ top: 0 });
  }

  return <div className="w-full min-w-0 space-y-6 p-4 lg:p-7 text-slate-800">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
      <div><p className="text-xs font-bold uppercase tracking-widest text-orange-700">Marquinho Moto Peças</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{caixa ? 'Receber pedido' : 'Atendimento'}</h1><p className="mt-2 text-sm text-slate-500">{caixa ? 'Localize o pedido e confirme o recebimento no caixa.' : 'Escolha as peças, monte o pedido e encaminhe o código ao caixa.'}</p></div>
      <div className="flex gap-2">{podeReceber && !caixa && <Link className={secondary} href={caixa ? '/balcao/atendimento' : '/balcao/recebimento'}>{caixa ? 'Montar pedido' : 'Recebimento'}</Link>}{caixa && <Link href="/balcao/caixa" className={secondary}>Gestão do caixa</Link>}</div>
    </header>
    {erro && <div role="alert" className="sticky top-20 z-40 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">{erro}<button className="ml-4 underline" onClick={() => setErro('')}>Fechar</button></div>}
    {!caixa && <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0"><label htmlFor="busca-pecas" className="mb-2 block text-sm font-semibold">Pesquisar peças</label><input id="busca-pecas" className={input} placeholder="Nome, SKU, marca ou código de barras" value={busca} onChange={e => setBusca(e.target.value)} autoFocus />
        <div aria-live="polite" className="my-3 text-sm text-slate-500">{carregando ? 'Buscando peças…' : `${pecas.length} ${pecas.length === 1 ? 'produto encontrado' : 'produtos encontrados'} · disponibilidade na loja`}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {pecas.slice(0, 90).map(p => <button key={p.id} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-orange-400 hover:shadow-sm disabled:opacity-50" disabled={p.quantidadeLoja <= 0 || Number(p.precoVenda) <= 0 || ocupado} onClick={() => adicionar(p)}>
            <div className="flex h-32 items-center justify-center bg-slate-50 p-3">{p.imagemUrl ? <img loading="lazy" src={p.imagemUrl} alt={p.nome} className="h-full w-full object-contain" /> : <span className="text-sm text-slate-400">Sem foto</span>}</div>
            <div className="flex flex-1 flex-col gap-1 p-4"><span className="text-xs text-slate-400">{p.codigo}{p.marca ? ` · ${p.marca}` : ''}</span><span className="font-semibold leading-snug">{p.nome}</span><span className="mt-auto pt-2 text-xl font-bold">{dinheiro(p.precoVenda)}</span><span className={`text-xs ${p.quantidadeLoja > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{p.quantidadeLoja > 0 ? `${p.quantidadeLoja} disponíveis · Adicionar +` : 'Indisponível'}</span></div>
          </button>)}
        </div>{!carregando && pecas.length === 0 && <p className="py-12 text-center text-slate-500">Nenhuma peça encontrada. Tente outro termo.</p>}{pecas.length > 90 && <p className="mt-4 text-sm text-slate-500">Mostrando 90 produtos. Refine a busca para encontrar a peça.</p>}
        {carrinho.length > 0 && <a href="#pedido-montagem" className="sticky bottom-3 z-40 mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg xl:hidden"><span>{carrinho.reduce((s, i) => s + i.quantidade, 0)} un. · {dinheiro(subtotal)}</span><span>Ver pedido</span></a>}
      </section>
      <aside id="pedido-montagem" className="scroll-mt-20 self-start rounded-xl border border-slate-200 bg-white p-5 xl:sticky xl:top-20"><h2 className="text-xl font-bold">Pedido em montagem</h2><p className="mt-1 text-sm text-slate-500">{carrinho.reduce((s, i) => s + i.quantidade, 0)} {carrinho.reduce((s, i) => s + i.quantidade, 0) === 1 ? 'unidade' : 'unidades'}</p>
        <div className="my-4 max-h-[460px] space-y-4 overflow-y-auto">{!carrinho.length && <p className="py-8 text-center text-slate-400">Adicione peças pelo catálogo.</p>}{carrinho.map(i => <div className="border-b border-slate-100 pb-4" key={i.peca.id}><div className="flex justify-between gap-3"><span className="font-semibold">{i.peca.nome}</span><button aria-label={`Remover ${i.peca.nome}`} className="-my-2 px-1 py-2.5 text-sm text-red-700" disabled={ocupado} onClick={() => setCarrinho(old => old.filter(l => l.peca.id !== i.peca.id))}>Remover</button></div><p className="my-2 text-xs text-slate-500">{i.peca.codigo} · {dinheiro(i.peca.precoVenda)} un.</p><div className="flex items-center justify-between"><div className="flex items-center gap-2"><button className="h-10 w-10 rounded-lg border" disabled={ocupado || i.quantidade <= 1} aria-label={`Diminuir ${i.peca.nome}`} onClick={() => quantidade(i.peca.id, i.quantidade - 1)}>−</button><input className="w-14 rounded border p-2 text-center" aria-label={`Quantidade ${i.peca.nome}`} type="number" min={1} max={i.peca.quantidadeLoja} disabled={ocupado} value={i.quantidade} onChange={e => quantidade(i.peca.id, Number(e.target.value))} /><button className="h-10 w-10 rounded-lg border" disabled={ocupado || i.quantidade >= i.peca.quantidadeLoja} aria-label={`Aumentar ${i.peca.nome}`} onClick={() => quantidade(i.peca.id, i.quantidade + 1)}>+</button></div><strong>{dinheiro(Number(i.peca.precoVenda) * i.quantidade)}</strong></div></div>)}</div>
        <label className="mb-3 block text-sm">Cliente (opcional)<input maxLength={150} disabled={ocupado} value={nome} onChange={e => setNome(e.target.value)} className={`${input} mt-1`} placeholder="Nome do cliente" /></label><label className="block text-sm">Telefone (opcional)<input maxLength={30} disabled={ocupado} type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className={`${input} mt-1`} placeholder="(81) 99999-9999" /></label>
        <div className="my-5 space-y-2 border-t pt-4"><p className="flex justify-between text-sm"><span>Subtotal</span><span>{dinheiro(subtotal)}</span></p><p className="flex justify-between text-sm"><span>Descontos</span><span>{dinheiro(0)}</span></p><p className="flex justify-between text-2xl font-bold"><span>Total</span><span>{dinheiro(subtotal)}</span></p><p className="text-xs text-slate-500">Preços do cadastro. Descontos dependem de autorização da administração.</p></div>
        <button onClick={salvar} disabled={ocupado || !carrinho.length || subtotal <= 0} className={`${button} w-full`}>{ocupado ? 'Salvando…' : 'Confirmar pedido e gerar código'}</button><p className="mt-3 text-xs text-slate-500">O pedido será salvo aguardando pagamento.</p>
      </aside>
    </div>}
    {caixa && <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5" onSubmit={e => { e.preventDefault(); consultar(); }}><label className="min-w-[14rem] flex-1 text-sm font-semibold">Código do pedido<input className={`${input} mt-2 font-mono text-xl uppercase`} placeholder="MP-000001" value={codigo} onChange={e => setCodigo(e.target.value)} autoFocus /></label><button className={`${button} w-full sm:w-auto`} disabled={ocupado || !codigo.trim()}>{ocupado ? 'Consultando…' : 'Localizar pedido'}</button><p className="w-full text-xs text-slate-500">Digite o código ou use o leitor de código de barras conectado ao computador.</p></form>}
    {pedido && <section ref={secaoPedido} className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-5 lg:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-500">Pedido salvo</p><h2 className="mt-1 break-all font-mono text-3xl font-bold tracking-wide">{codigoPedido(pedido.numero)}</h2><p className={`mt-2 font-semibold ${pedido.status === 'PAGO' ? 'text-emerald-700' : 'text-amber-700'}`}>{pedido.status.replaceAll('_', ' ')}</p></div><div className="flex flex-wrap gap-2"><button className={secondary} onClick={copiar}>{copiado ? 'Código copiado ✓' : 'Copiar código'}</button><button className={secondary} onClick={imprimir} disabled={pedido.status === 'PAGO' && !venda}>{pedido.status === 'PAGO' ? 'Imprimir comprovante / 2ª via' : 'Imprimir código do pedido'}</button><button className={secondary} onClick={novoAtendimento} disabled={ocupado}>{caixa ? 'Atender outro pedido' : 'Novo pedido'}</button></div></div>
      <p className="mt-4 text-sm text-slate-500">{pedido.clienteNome || 'Cliente não informado'}{pedido.clienteTelefone ? ` · ${pedido.clienteTelefone}` : ''}</p><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-400"><th className="py-3">Produto</th><th className="px-2">Qtd.</th><th className="px-2 text-right">Unitário</th><th className="text-right">Valor</th></tr></thead><tbody>{pedido.itens?.map((i: any) => <tr key={i.id} className="border-b border-slate-100"><td className="py-3"><p className="font-medium">{i.peca?.nome}</p><span className="text-xs text-slate-400">{i.peca?.codigo}</span></td><td className="px-2">{i.quantidade}</td><td className="whitespace-nowrap px-2 text-right">{dinheiro(i.precoVendido)}</td><td className="whitespace-nowrap text-right font-semibold">{dinheiro(i.subtotal)}</td></tr>)}</tbody></table></div><div className="ml-auto mt-4 max-w-sm space-y-2">{maoDeObra(pedido) > 0 && <p className="flex justify-between text-sm"><span>Serviços / mão de obra</span><span>{dinheiro(maoDeObra(pedido))}</span></p>}<p className="flex justify-between text-sm"><span>Subtotal</span><span>{dinheiro(pedido.subtotal)}</span></p><p className="flex justify-between text-sm"><span>Descontos</span><span>{dinheiro(pedido.descontoTotal)}</span></p><p className="flex justify-between text-2xl font-bold"><span>Total</span><span>{dinheiro(pedido.total)}</span></p></div>
      {pedido.status === 'PAGO' && venda && <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-5"><span className="inline-block rotate-[-5deg] border-4 border-emerald-700 px-5 py-1 text-3xl font-black text-emerald-700">PAGO</span><p className="mt-4 text-sm">Recebido por {venda.operadorNome} em {new Date(venda.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}.</p>{venda.pagamentos?.map((p: any, i: number) => <p className="mt-1 text-sm" key={i}>{formas[p.tipo] || p.tipo}: {dinheiro(p.valor)}{Number(p.troco) > 0 ? ` · Troco: ${dinheiro(p.troco)}` : ''}</p>)}<p className="mt-3 text-xs font-semibold uppercase">Documento interno sem valor fiscal</p></div>}
      {caixa && podeReceber && pedido.status === 'AGUARDANDO_PAGAMENTO' && <div className="mt-6 border-t pt-5"><h3 className="text-xl font-bold">Recebimento</h3><p className="mt-1 text-sm text-slate-500">Confira o recebimento antes de confirmar. Para pagamento misto, adicione cada forma.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm">Forma de pagamento<select disabled={ocupado || restante === 0} value={tipo} onChange={e => setTipo(e.target.value)} className={`${input} mt-1`}>{Object.entries(formas).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-sm">{tipo === 'DINHEIRO' ? 'Valor recebido em dinheiro' : 'Valor a aplicar'}<input className={`${input} mt-1`} disabled={ocupado || restante === 0} inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder={(restante / 100).toFixed(2).replace('.', ',')} /></label><button className={`${secondary} self-end`} onClick={adicionarPagamento} disabled={ocupado || restante === 0}>Adicionar</button></div><p className="mt-2 text-xs text-slate-500">Deixe o valor vazio para usar o saldo restante. Em dinheiro, o excedente será registrado como troco.</p><div className="mt-4 space-y-2">{pagamentos.map((p, i) => <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"><span>{formas[p.tipo]} · {dinheiro(p.valor)}{p.troco > 0 ? ` · Troco ${dinheiro(p.troco)}` : ''}</span><button disabled={ocupado} className="-my-2 px-1 py-2.5 text-red-700 underline" onClick={() => setPagamentos(old => old.filter((_, index) => index !== i))}>Remover</button></div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-lg font-bold">Restante: {dinheiro(restante / 100)}</p><button onClick={receber} className={button} disabled={ocupado || restante !== 0 || !pagamentos.length || totalPedido <= 0}>{ocupado ? 'Registrando recebimento…' : `Confirmar recebimento de ${dinheiro(pedido.total)}`}</button></div></div>}
    </section>}
    <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{caixa ? 'Consulta de pedidos' : 'Meus pedidos'}</h2><div className="flex flex-wrap gap-2"><select aria-label="Filtrar pedidos por status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="AGUARDANDO_PAGAMENTO">Aguardando pagamento</option><option value="PAGO">Pagos</option></select><button onClick={listar} className="rounded-lg border bg-white px-3 py-2">Atualizar</button></div></div><div className="divide-y rounded-xl border border-slate-200 bg-white">{!pedidos.length && <p className="p-6 text-sm text-slate-500">{listado ? 'Nenhum pedido neste status.' : 'Carregando pedidos…'}</p>}{pedidos.map(p => <button key={p.id} disabled={ocupado} onClick={() => selecionar(p)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"><div><p className="font-mono font-bold">{codigoPedido(p.numero)}</p><p className="mt-1 text-sm text-slate-500">{p.clienteNome || 'Cliente não informado'} · {new Date(p.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}</p></div><div className="text-right"><strong>{dinheiro(p.total)}</strong><p className={`mt-1 text-xs font-semibold ${p.status === 'PAGO' ? 'text-emerald-700' : 'text-amber-700'}`}>{p.status.replaceAll('_', ' ')}</p></div></button>)}</div></section>
  </div>;
}
