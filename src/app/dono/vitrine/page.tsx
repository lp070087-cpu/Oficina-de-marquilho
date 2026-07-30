'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminProdutoCard from '@/components/vitrine/AdminProdutoCard';
import AdminVitrine from '@/components/vitrine/AdminVitrinePremium';

interface Categoria { id: string; nome: string; slug: string; }
interface Peca {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number;
  quantidade: number; estoqueMinimo: number; vitrine: boolean; destaque: boolean; oferta: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string; id: string };
}
interface Orcamento { id: string; numero: number; status: string; total: number; modeloMoto?: string; createdAt: string; cliente: { nome: string; telefone: string }; itens: { quantidade: number; peca: { nome: string; codigo: string } }[]; }

interface PedidoLoja { id: string; numero: number; status: string; total: number; formaPagamento?: string; clienteNome?: string; cliente?: { nome: string; telefone: string }; retiradaNome?: string; retiradaTelefone?: string; qrCode?: string; createdAt: string; retiradaEm?: string; itens: { quantidade: number; precoVendido: number; peca: { nome: string; codigo: string } }[]; }

const menuCategorias = [
  { label: 'Acessorios', slug: 'acessorios' }, { label: 'Pecas para Motos', slug: 'motor' },
  { label: 'Pneus', slug: 'rodas-e-pneus' }, { label: 'Oleos', slug: 'oleos-e-fluidos' },
  { label: 'Eletrica', slug: 'eletrica' }, { label: 'Freios', slug: 'freios' },
  { label: 'Suspensao', slug: 'suspensao' }, { label: 'Transmissao', slug: 'transmissao' },
  { label: 'Carroceria', slug: 'carroceria' }, { label: 'Escapamento', slug: 'escapamento' },
  { label: 'Filtros', slug: 'filtros' }, { label: 'Cabos', slug: 'cabos-e-comandos' },
];

export default function VitrineManagePage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [pedidosLoja, setPedidosLoja] = useState<PedidoLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'vitrine'|'orcamentos'|'pedidos_loja'|'admin_premium'>('vitrine');
  const [copiado, setCopiado] = useState(false);
  const [catAtiva, setCatAtiva] = useState('');
  const [uploading, setUploading] = useState('');
  const [editandoBanner, setEditandoBanner] = useState(false);
  const [bannerTexto, setBannerTexto] = useState('Tudo para sua moto com precos de atacado');
  const [bannerAtivo, setBannerAtivo] = useState(true);

  const fetchPecas = useCallback(async () => {
    const p = new URLSearchParams(); if (catAtiva) p.set('categoria', catAtiva);
    const res = await fetch(`/api/pecas?${p}`); setPecas(await res.json()); setLoading(false);
  }, [catAtiva]);

  const fetchCats = async () => { const r = await fetch('/api/categorias'); setCategorias(await r.json()); };
  const fetchOrcamentos = async () => { const r = await fetch('/api/vitrine/orcamentos'); if (r.ok) setOrcamentos(await r.json()); };
  const fetchPedidosLoja = async () => { const r = await fetch('/api/vitrine/pedidos?admin=1'); if (r.ok) { const d = await r.json(); setPedidosLoja(d.pedidos || []); } };

  useEffect(() => { fetchPecas(); fetchCats(); fetchOrcamentos(); fetchPedidosLoja(); }, [fetchPecas]);

  async function toggle(pecaId: string, field: string, val: any) {
    await fetch('/api/vitrine', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pecaId, [field]:val }) }); fetchPecas();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, pecaId: string) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(pecaId);
    const fd = new FormData(); fd.append('imagem', f); fd.append('pecaId', pecaId);
    const r = await fetch('/api/upload', { method:'POST', body: fd });
    if (r.ok) { const d = await r.json(); setPecas(prev => prev.map(p => p.id===pecaId?{...p,imagemUrl:d.url}:p)); }
    setUploading('');
  }

  async function atualizarOrcamento(id: string, status: string) {
    await fetch(`/api/vitrine/orcamentos/${id}/status`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) }); fetchOrcamentos();
  }

  function copiarLink() { navigator.clipboard.writeText(`${window.location.origin}/vitrine`); setCopiado(true); setTimeout(()=>setCopiado(false),2000); }

  const fm = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const pecasFiltradas = pecas.filter(p => p.vitrine);
  const destaques = pecasFiltradas.filter(p => p.destaque).slice(0, 8);
  const ofertas = pecasFiltradas.filter(p => p.oferta && p.precoOferta).slice(0, 8);

  const secoes = ['motor','freios','eletrica','suspensao','transmissao','carroceria','rodas-e-pneus','oleos-e-fluidos','escapamento','acessorios','filtros','cabos-e-comandos'];
  const pecasPorSecao = secoes.map(s => {
    const cat = categorias.find(c => c.slug === s);
    if (!cat) return null;
    const items = pecas.filter(p => p.categoria.slug === s);
    return { nome: cat.nome, slug: s, pecas: items, catId: cat.id };
  }).filter(Boolean) as { nome: string; slug: string; pecas: Peca[]; catId: string }[];

  const catSelecionada = categorias.find(c => c.id === catAtiva);

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* ===== BARRA DE TOPO ===== */}
      <div className="bg-[#0D1117] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold">Editando Vitrine</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{pecasFiltradas.length} de {pecas.length} produtos visiveis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setEditandoBanner(!editandoBanner)} className="px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded text-[10px] transition-colors">{editandoBanner ? 'Fechar banner' : 'Editar banner'}</button>
            <button onClick={() => setTab(tab==='vitrine'?'orcamentos':tab==='orcamentos'?'pedidos_loja':tab==='pedidos_loja'?'admin_premium':'vitrine')} className="px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded text-[10px] transition-colors">
              {tab==='vitrine'?'Orçamentos':tab==='orcamentos'?'Pedidos Loja':tab==='pedidos_loja'?'Admin Premium':'Vitrine'}
            </button>
            <button onClick={copiarLink} className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 rounded text-[10px] font-bold transition-colors">{copiado?'Copiado':'Copiar link'}</button>
            <a href="/vitrine" target="_blank" className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-[10px] font-bold transition-colors">Ver site</a>
          </div>
        </div>

        {/* Menu azul categorias */}
        <div className="bg-brand-600">
          <div className="max-w-7xl mx-auto px-4 flex items-center h-9 overflow-x-auto gap-0.5">
            <button onClick={() => setCatAtiva('')} className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${!catAtiva?'bg-brand-700 text-white':'text-white/80 hover:text-white hover:bg-brand-700'}`}>Todos</button>
            {menuCategorias.map(c => (
              <button key={c.slug} onClick={() => setCatAtiva(categorias.find(x=>x.slug===c.slug)?.id||'')}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${catAtiva===categorias.find(x=>x.slug===c.slug)?.id?'bg-brand-700 text-white':'text-white/80 hover:text-white hover:bg-brand-700'}`}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PAINEL ADMIN PREMIUM ===== */}
      {tab === 'admin_premium' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AdminVitrine />
        </div>
      )}

      {/* ===== PEDIDOS DA LOJA ===== */}
      {tab === 'pedidos_loja' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">Pedidos da Loja</h2>
          <p className="text-xs text-slate-400 mb-4">Pedidos recebidos pela Vitrine — retirada na loja</p>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Aguardando', qty: pedidosLoja.filter(p => p.status === 'PEDIDO_RECEBIDO').length, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
              { label: 'Separando', qty: pedidosLoja.filter(p => p.status === 'EM_SEPARACAO').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Prontos p/ Retirada', qty: pedidosLoja.filter(p => p.status === 'PRONTO_PARA_RETIRADA').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Retirados Hoje', qty: pedidosLoja.filter(p => p.status === 'RETIRADO' && p.retiradaEm && new Date(p.retiradaEm).toDateString() === new Date().toDateString()).length, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
            ].map(m => (
              <div key={m.label} className={`${m.bg} rounded-xl border p-3`}>
                <p className="text-[11px] text-slate-500 font-medium">{m.label}</p>
                <p className={`text-xl font-extrabold ${m.color}`}>{m.qty}</p>
              </div>
            ))}
          </div>

          {pedidosLoja.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <p className="text-sm text-slate-400">Nenhum pedido da loja ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidosLoja.map(p => {
                const STATUS_MAP: Record<string, { label: string; color: string }> = {
                  PEDIDO_RECEBIDO: { label: 'Recebido', color: 'bg-sky-50 text-sky-700' },
                  EM_SEPARACAO: { label: 'Separando', color: 'bg-amber-50 text-amber-700' },
                  PRONTO_PARA_RETIRADA: { label: 'Pronto p/ Retirada', color: 'bg-emerald-50 text-emerald-700' },
                  RETIRADO: { label: 'Retirado', color: 'bg-slate-100 text-slate-600' },
                  CANCELADO: { label: 'Cancelado', color: 'bg-red-50 text-red-700' },
                };
                const si = STATUS_MAP[p.status] || { label: p.status, color: 'bg-slate-100 text-slate-500' };
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-brand-600">#{p.numero}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${si.color}`}>{si.label}</span>
                        {p.formaPagamento && <span className="text-[10px] text-slate-400">{p.formaPagamento.replace('_', ' ')}</span>}
                        {p.qrCode && <span className="text-[10px] text-slate-400 font-mono">{p.qrCode}</span>}
                      </div>
                      <span className="text-sm font-extrabold text-slate-800">{fm(Number(p.total))}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Cliente:</strong> {p.clienteNome || p.cliente?.nome || '—'}
                      {p.cliente?.telefone && ` · ${p.cliente.telefone}`}
                      {p.retiradaNome && p.retiradaNome !== (p.clienteNome || p.cliente?.nome) && ` | Retirada: ${p.retiradaNome}`}
                    </p>
                    <div className="space-y-0.5 mb-3">
                      {p.itens.map((i, idx) => (
                        <p key={idx} className="text-xs text-slate-500">{i.quantidade}x {i.peca.nome} <span className="text-slate-400">({i.peca.codigo})</span></p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleString('pt-BR')}</span>
                      <button onClick={() => window.open(`/dono/pedidos-loja`, '_blank')}
                        className="text-xs text-brand-600 font-bold hover:underline">
                        Ver no painel completo →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={fetchPedidosLoja} className="mt-4 text-xs text-brand-600 font-bold hover:underline">🔄 Atualizar</button>
        </div>
      )}

      {/* ===== PAINEL DE ORÇAMENTOS ===== */}
      {tab === 'orcamentos' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">Orçamentos recebidos</h2>
          {orcamentos.length===0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center"><p className="text-sm text-slate-400">Nenhum orçamento recebido.</p></div>
          ) : (
            <div className="space-y-3">
              {orcamentos.map(o => (
                <div key={o.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-600">#{o.numero}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${o.status==='PENDENTE'?'bg-amber-50 text-amber-700':o.status==='APROVADO'?'bg-emerald-50 text-emerald-700':o.status==='RECUSADO'?'bg-red-50 text-red-700':'bg-slate-50 text-slate-600'}`}>{o.status==='PENDENTE'?'Pendente':o.status==='APROVADO'?'Aprovado':o.status==='RECUSADO'?'Recusado':'Concluido'}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{fm(Number(o.total))}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2"><strong>Cliente:</strong> {o.cliente.nome} - {o.cliente.telefone} {o.modeloMoto?`| Moto: ${o.modeloMoto}`:''}</p>
                  <div className="space-y-0.5 mb-3">{o.itens.map((i,idx)=>(<p key={idx} className="text-xs text-slate-500">{i.quantidade}x {i.peca.nome}</p>))}</div>
                  {o.status==='PENDENTE' && (<div className="flex gap-2"><button onClick={()=>atualizarOrcamento(o.id,'APROVADO')} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-medium">Aprovar</button><button onClick={()=>atualizarOrcamento(o.id,'RECUSADO')} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium">Recusar</button></div>)}
                  {o.status==='APROVADO' && <button onClick={()=>atualizarOrcamento(o.id,'CONCLUIDO')} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded font-medium">Concluir</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== VITRINE ===== */}
      {tab === 'vitrine' && (
        <>
          {editandoBanner ? (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
              <div className="max-w-7xl mx-auto px-4 py-8 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={bannerAtivo} onChange={e=>setBannerAtivo(e.target.checked)} className="rounded" /> Banner ativo
                  </label>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Titulo do banner</label>
                  <input value={bannerTexto} onChange={e=>setBannerTexto(e.target.value)} className="w-full bg-white/10 border border-white/15 rounded-md py-2.5 px-4 text-white placeholder:text-slate-400 outline-none" placeholder="Ex: Tudo para sua moto com precos de atacado" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { fetch('/api/vitrine/config', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bannerTexto,bannerAtivo}) }); setEditandoBanner(false); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-bold">Salvar banner</button>
                  <button onClick={()=>setEditandoBanner(false)} className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-md text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
              <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-6">
                <div className="flex-1"><h1 className="text-xl font-extrabold mb-1">Tudo para sua moto com precos de atacado</h1><p className="text-xs text-white/50">Monte seu orcamento online e retire na loja.</p></div>
                <div className="hidden lg:block w-24 h-24 rounded-full bg-brand-600/20 flex items-center justify-center"><span className="text-2xl font-extrabold text-brand-500/40">MP</span></div>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
            {loading ? (
              <div className="text-center py-20"><p className="text-sm text-slate-400">Carregando produtos...</p></div>
            ) : catAtiva ? (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-extrabold text-slate-800">{catSelecionada?.nome || 'Categoria'} <span className="text-slate-400 font-normal text-xs">({pecasFiltradas.length} visiveis)</span></h2>
                  <button onClick={()=>setCatAtiva('')} className="text-xs text-brand-600 hover:text-brand-700 font-bold">← Ver todas categorias</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {pecas.map(p => <AdminProdutoCard key={p.id} p={p} onToggle={toggle} onUpload={handleUpload} uploading={uploading} />)}
                </div>
              </section>
            ) : (
              <>
                {destaques.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3"><h2 className="text-base font-extrabold text-slate-800">⭐ Produtos em destaque</h2></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{destaques.map(p=><AdminProdutoCard key={p.id} p={p} onToggle={toggle} onUpload={handleUpload} uploading={uploading}/>)}</div>
                  </section>
                )}
                {ofertas.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3"><h2 className="text-base font-extrabold text-slate-800">🔥 Ofertas da semana</h2></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{ofertas.map(p=><AdminProdutoCard key={p.id} p={p} onToggle={toggle} onUpload={handleUpload} uploading={uploading}/>)}</div>
                  </section>
                )}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white flex items-center gap-6">
                  <div className="flex-1">
                    <span className="inline-block bg-brand-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">Pneus para sua moto</span>
                    <h2 className="text-lg font-extrabold">Troque seus pneus com quem entende</h2>
                    <p className="text-xs text-white/50">Pneus Pirelli, Metzeler, Levorin e mais.</p>
                  </div>
                </div>
                {pecasPorSecao.map(sec => sec.pecas.length > 0 && (
                  <section key={sec.slug}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-extrabold text-slate-800">{sec.nome} <span className="text-slate-400 font-normal text-xs">({sec.pecas.filter(p=>p.vitrine).length} visiveis)</span></h2>
                      <button onClick={() => setCatAtiva(sec.catId)} className="text-xs text-brand-600 hover:text-brand-700 font-bold">Filtrar só {sec.nome}</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{sec.pecas.map(p => <AdminProdutoCard key={p.id} p={p} onToggle={toggle} onUpload={handleUpload} uploading={uploading} />)}</div>
                  </section>
                ))}
                <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl p-6 text-center text-white">
                  <h2 className="text-lg font-extrabold mb-1">Retire na Loja</h2>
                  <p className="text-xs text-white/60">Monte seu orcamento online e retire suas pecas na loja.</p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
