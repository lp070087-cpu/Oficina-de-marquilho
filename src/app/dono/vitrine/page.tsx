'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminProdutoCard from '@/components/vitrine/AdminProdutoCard';
import AdminVitrine from '@/components/vitrine/AdminVitrinePremium';
import LogoOficina from '@/components/LogoOficina';

interface Categoria { id: string; nome: string; slug: string; }
interface Peca {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number; precoVitrine?: number;
  quantidade: number; estoqueMinimo: number; vitrine: boolean; destaque: boolean; oferta: boolean;
  quantidadeLoja?: number; ativo?: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string; id: string };
}
// Correção 1: regra oficial de visibilidade (ativo && quantidadeLoja>0 && precoVenda>0).
const visivel = (p: Peca) => (p.ativo !== false) && (Number(p.quantidadeLoja ?? 0) > 0) && (Number(p.precoVenda) > 0);
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
  // Item 3/4 — editor de banner POR IMAGEM (Vercel Blob). Desktop ~1600x400 · Mobile ~600x300.
  const [banners, setBanners] = useState<any[]>([]);
  const [novoBanner, setNovoBanner] = useState({ titulo: '', subtitulo: '', ctaTexto: '', ctaLink: '', ordem: 0, ativo: true });
  const [bannerDesktop, setBannerDesktop] = useState<File | null>(null);
  const [bannerMobile, setBannerMobile] = useState<File | null>(null);
  const [bannerDesktopPrev, setBannerDesktopPrev] = useState('');
  const [bannerMobilePrev, setBannerMobilePrev] = useState('');
  const [bannerSalvando, setBannerSalvando] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  // Item 5 — Botão SALVAR ALTERAÇÕES (confirmação/feedback; as alterações já são gravadas
  // individualmente, o botão sincroniza tudo e confirma visualmente).
  const [salvandoTudo, setSalvandoTudo] = useState(false);
  const [salvoMsg, setSalvoMsg] = useState('');

  const fetchPecas = useCallback(async () => {
    const p = new URLSearchParams(); if (catAtiva) p.set('categoria', catAtiva);
    const res = await fetch(`/api/pecas?${p}`); setPecas(await res.json()); setLoading(false);
  }, [catAtiva]);

  const fetchCats = async () => { const r = await fetch('/api/categorias'); setCategorias(await r.json()); };
  const fetchOrcamentos = async () => { const r = await fetch('/api/vitrine/orcamentos'); if (r.ok) setOrcamentos(await r.json()); };
  const fetchPedidosLoja = async () => { const r = await fetch('/api/vitrine/pedidos?admin=1'); if (r.ok) { const d = await r.json(); setPedidosLoja(d.pedidos || []); } };
  const fetchBanners = async () => { const r = await fetch('/api/vitrine/banners'); if (r.ok) setBanners(await r.json()); };

  useEffect(() => { fetchPecas(); fetchCats(); fetchOrcamentos(); fetchPedidosLoja(); fetchBanners(); }, [fetchPecas]);

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

  // ---- Banner por imagem (item 3) ----
  function previewFile(file: File | null, setter: (s: string) => void) {
    if (!file) { setter(''); return; }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  }
  function onDesktopFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null; setBannerDesktop(f); previewFile(f, setBannerDesktopPrev);
  }
  function onMobileFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null; setBannerMobile(f); previewFile(f, setBannerMobilePrev);
  }
  async function criarBanner() {
    if (!bannerDesktop && !bannerMobile) { setBannerMsg('Envie ao menos uma imagem (Desktop ou Mobile).'); return; }
    setBannerSalvando(true); setBannerMsg('');
    try {
      const fd = new FormData();
      fd.append('titulo', novoBanner.titulo);
      fd.append('subtitulo', novoBanner.subtitulo);
      fd.append('ctaTexto', novoBanner.ctaTexto);
      fd.append('ctaLink', novoBanner.ctaLink);
      fd.append('ordem', String(novoBanner.ordem));
      if (bannerDesktop) fd.append('imagemDesktop', bannerDesktop);
      if (bannerMobile) fd.append('imagemMobile', bannerMobile);
      const r = await fetch('/api/vitrine/banners', { method: 'POST', body: fd });
      if (r.ok) {
        setBannerMsg('Banner salvo com sucesso!');
        setNovoBanner({ titulo: '', subtitulo: '', ctaTexto: '', ctaLink: '', ordem: 0, ativo: true });
        setBannerDesktop(null); setBannerMobile(null); setBannerDesktopPrev(''); setBannerMobilePrev('');
        fetchBanners();
      } else { const e = await r.json(); setBannerMsg(e.error || 'Erro ao salvar banner.'); }
    } catch { setBannerMsg('Erro de conexão ao salvar banner.'); }
    setBannerSalvando(false);
    setTimeout(() => setBannerMsg(''), 3000);
  }
  async function alternarBanner(id: string, ativo: boolean) {
    await fetch(`/api/vitrine/banners/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo }) });
    fetchBanners();
  }
  async function excluirBanner(id: string) {
    if (!confirm('Excluir este banner?')) return;
    await fetch(`/api/vitrine/banners/${id}`, { method: 'DELETE' });
    fetchBanners();
  }

  // Item 5 — SALVAR ALTERAÇÕES: re-sincroniza produtos, banners, orçamentos e pedidos,
  // e mostra feedback visual. Bloqueia duplo clique enquanto salva.
  async function salvarTodasAlteracoes() {
    if (salvandoTudo) return;
    setSalvandoTudo(true);
    setSalvoMsg('');
    try {
      await Promise.all([fetchPecas(), fetchCats(), fetchOrcamentos(), fetchPedidosLoja(), fetchBanners()]);
      setSalvoMsg('Alterações salvas com sucesso!');
    } catch {
      setSalvoMsg('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvandoTudo(false);
      setTimeout(() => setSalvoMsg(''), 3000);
    }
  }

  const fm = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const pecasFiltradas = pecas.filter(visivel);
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
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-y-1 gap-x-2 py-1 min-h-10 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold">Editando Vitrine</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{pecasFiltradas.length} de {pecas.length} produtos visiveis</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Item 5 — botão principal SALVAR ALTERAÇÕES */}
            <button onClick={salvarTodasAlteracoes} disabled={salvandoTudo}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 rounded text-[11px] font-extrabold text-white shadow-lg shadow-emerald-900/30 transition-colors">
              {salvandoTudo ? 'Salvando...' : '💾 Salvar Alterações'}
            </button>
            {salvoMsg && <span className="px-2 py-1 bg-emerald-900/60 text-emerald-300 rounded text-[10px] font-bold">{salvoMsg}</span>}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
                  {o.status==='PENDENTE' && (<div className="flex flex-wrap gap-2"><button onClick={()=>atualizarOrcamento(o.id,'APROVADO')} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-medium">Aprovar</button><button onClick={()=>atualizarOrcamento(o.id,'RECUSADO')} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium">Recusar</button></div>)}
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
            <div className="bg-[#0F172A] text-white">
              <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold">Editar Banner da Vitrine</h2>
                  <button onClick={()=>setEditandoBanner(false)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-bold">← Fechar</button>
                </div>

                {/* Tamanhos recomendados (item 4) */}
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-300">
                  <span>📐 <strong className="text-white">Desktop recomendado:</strong> 1600×400px (PNG/JPG/WEBP)</span>
                  <span>📱 <strong className="text-white">Mobile recomendado:</strong> 600×300px (PNG/JPG/WEBP)</span>
                  <span className="text-slate-500">· máx. 8MB</span>
                </div>

                {/* Form novo banner */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Título (badge)</label>
                      <input value={novoBanner.titulo} onChange={e=>setNovoBanner({...novoBanner,titulo:e.target.value})} className="w-full bg-white/10 border border-white/15 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-400 outline-none" placeholder="Ex: Ofertas da Semana" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Subtítulo (frase principal)</label>
                      <input value={novoBanner.subtitulo} onChange={e=>setNovoBanner({...novoBanner,subtitulo:e.target.value})} className="w-full bg-white/10 border border-white/15 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-400 outline-none" placeholder="Ex: Descontos imperdíveis em peças" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Texto do botão</label>
                      <input value={novoBanner.ctaTexto} onChange={e=>setNovoBanner({...novoBanner,ctaTexto:e.target.value})} className="w-full bg-white/10 border border-white/15 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-400 outline-none" placeholder="Ex: Ver Produtos" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Link do botão</label>
                      <input value={novoBanner.ctaLink} onChange={e=>setNovoBanner({...novoBanner,ctaLink:e.target.value})} className="w-full bg-white/10 border border-white/15 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-400 outline-none" placeholder="Ex: /vitrine/catalogo" />
                    </div>
                  </div>

                  {/* Uploads com preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">🖥️ Imagem Desktop</label>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onDesktopFile} className="text-xs text-slate-300" />
                      <div className="mt-2 aspect-[4/1] rounded-lg border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center text-[10px] text-slate-500">
                        {bannerDesktopPrev ? <img src={bannerDesktopPrev} alt="preview desktop" className="w-full h-full object-cover" /> : 'Pré-visualização Desktop (1600×400)'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">📱 Imagem Mobile</label>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onMobileFile} className="text-xs text-slate-300" />
                      <div className="mt-2 aspect-[2/1] rounded-lg border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center text-[10px] text-slate-500">
                        {bannerMobilePrev ? <img src={bannerMobilePrev} alt="preview mobile" className="w-full h-full object-cover" /> : 'Pré-visualização Mobile (600×300)'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={novoBanner.ativo} onChange={e=>setNovoBanner({...novoBanner,ativo:e.target.checked})} className="rounded" /> Ativo
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      Ordem <input type="number" value={novoBanner.ordem} onChange={e=>setNovoBanner({...novoBanner,ordem:Number(e.target.value)})} className="w-16 bg-white/10 border border-white/15 rounded-md py-1 px-2 text-xs text-white" />
                    </label>
                  </div>
                  {bannerMsg && <p className="text-xs font-medium text-emerald-400">{bannerMsg}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={criarBanner} disabled={bannerSalvando}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-md text-sm font-bold transition-colors">
                      {bannerSalvando ? 'Salvando...' : 'Salvar Banner'}
                    </button>
                    <button onClick={()=>setEditandoBanner(false)} className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-md text-sm">Cancelar</button>
                  </div>
                </div>

                {/* Lista de banners com ativar/desativar/excluir */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Banners cadastrados ({banners.length})</h3>
                  {banners.length === 0 ? (
                    <p className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-xl p-6 text-center">Nenhum banner ainda. Crie o primeiro acima.</p>
                  ) : banners.map(b => (
                    <div key={b.id} className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-28 h-12 rounded-md overflow-hidden bg-black/40 flex-shrink-0">
                          {b.imagemDesktop ? <img src={b.imagemDesktop} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[9px] text-slate-500">s/ img</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{b.titulo || 'Sem título'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{b.subtitulo}{b.ordem ? ` · ordem ${b.ordem}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={()=>alternarBanner(b.id, !b.ativo)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold ${b.ativo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'}`}>
                          {b.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                        <button onClick={()=>excluirBanner(b.id)} className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
              <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-6">
                <div className="flex-1"><h1 className="text-xl font-extrabold mb-1">Tudo para sua moto com precos de atacado</h1><p className="text-xs text-white/50">Monte seu orcamento online e retire na loja.</p></div>
                <LogoOficina className="hidden lg:flex w-24 h-24 rounded-full bg-brand-600/20 items-center justify-center overflow-hidden" textClassName="text-2xl font-extrabold text-brand-500/40" />
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
                      <h2 className="text-base font-extrabold text-slate-800">{sec.nome} <span className="text-slate-400 font-normal text-xs">({sec.pecas.filter(visivel).length} visiveis)</span></h2>
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
