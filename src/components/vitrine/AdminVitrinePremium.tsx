'use client';

import { useState, useEffect, useCallback } from 'react';
import { invalidarCacheLogo } from '@/components/LogoOficina';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminVitrine() {
  const [tab, setTab] = useState<'overview'|'produtos'|'banners'|'marcas'|'promocoes'|'cupons'|'depoimentos'|'newsletter'|'seo'|'config'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  // Marcas
  const [marcas, setMarcas] = useState<any[]>([]);
  const [novaMarca, setNovaMarca] = useState({ nome: '', logoUrl: '', destaque: false });

  // Depoimentos
  const [depoimentos, setDepoimentos] = useState<any[]>([]);
  const [novoDepoimento, setNovoDepoimento] = useState({ nome: '', texto: '', estrelas: 5, cargo: '' });

  // Banners
  const [banners, setBanners] = useState<any[]>([]);
  const [novoBanner, setNovoBanner] = useState({ titulo: '', subtitulo: '', ctaTexto: '', ctaLink: '', ordem: 0 });
  const [bannerDesktop, setBannerDesktop] = useState<File | null>(null);
  const [bannerMobile, setBannerMobile] = useState<File | null>(null);

  // Promoções
  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [novaPromocao, setNovaPromocao] = useState({ titulo: '', percentual: '', dataInicio: '', dataFim: '', tipo: 'GERAL', categoriaId: '' });

  // Cupons
  const [cupons, setCupons] = useState<any[]>([]);
  const [novoCupom, setNovoCupom] = useState({ codigo: '', descricao: '', tipo: 'PERCENTUAL', valor: '', valorMinimo: '', quantidadeMax: '', dataInicio: '', dataFim: '', primeiraCompra: false });

  // Newsletter
  const [newsletter, setNewsletter] = useState<any>({ assinantes: [], total: 0, ativos: 0 });

  // SEO
  const [seo, setSeo] = useState({ titulo: '', descricao: '', keywords: '', ogImage: '' });

  // Logo da oficina
  const [logoOficina, setLogoOficina] = useState('');
  const [logoArquivo, setLogoArquivo] = useState<File | null>(null);
  const [logoEnviando, setLogoEnviando] = useState(false);

  const fetchStats = useCallback(async () => {
    try { const r = await fetch('/api/vitrine/admin'); if (r.ok) setStats(await r.json()); } catch {}
    setLoading(false);
  }, []);

  const fetchMarcas = useCallback(async () => { const r = await fetch('/api/vitrine/marcas'); if (r.ok) setMarcas(await r.json()); }, []);
  const fetchDepoimentos = useCallback(async () => { const r = await fetch('/api/vitrine/depoimentos'); if (r.ok) setDepoimentos(await r.json()); }, []);
  const fetchBanners = useCallback(async () => { const r = await fetch('/api/vitrine/banners'); if (r.ok) setBanners(await r.json()); }, []);
  const fetchPromocoes = useCallback(async () => { const r = await fetch('/api/vitrine/promocoes?all=1'); if (r.ok) setPromocoes(await r.json()); }, []);
  const fetchCupons = useCallback(async () => { const r = await fetch('/api/vitrine/cupons?admin=1'); if (r.ok) setCupons(await r.json()); }, []);
  const fetchNewsletter = useCallback(async () => { const r = await fetch('/api/vitrine/newsletter-admin'); if (r.ok) setNewsletter(await r.json()); }, []);
  const fetchSeo = useCallback(async () => { const r = await fetch('/api/vitrine/config-seo'); if (r.ok) setSeo(await r.json()); }, []);
  const fetchLogo = useCallback(async () => { const r = await fetch('/api/vitrine/logo'); if (r.ok) { const d = await r.json(); setLogoOficina(d?.logoUrl || ''); } }, []);

  useEffect(() => { fetchStats(); fetchMarcas(); fetchDepoimentos(); fetchBanners(); fetchPromocoes(); fetchCupons(); fetchNewsletter(); fetchSeo(); fetchLogo(); }, [fetchStats, fetchMarcas, fetchDepoimentos, fetchBanners, fetchPromocoes, fetchCupons, fetchNewsletter, fetchSeo, fetchLogo]);

  // Marcas
  async function criarMarca() {
    if (!novaMarca.nome) return;
    const r = await fetch('/api/vitrine/marcas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novaMarca) });
    if (r.ok) { setNovaMarca({ nome: '', logoUrl: '', destaque: false }); fetchMarcas(); setSaveMsg('Marca criada!'); setTimeout(() => setSaveMsg(''), 2000); }
  }

  // Depoimentos
  async function criarDepoimento() {
    if (!novoDepoimento.nome || !novoDepoimento.texto) return;
    await fetch('/api/vitrine/depoimentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoDepoimento) });
    setNovoDepoimento({ nome: '', texto: '', estrelas: 5, cargo: '' });
    fetchDepoimentos(); setSaveMsg('Depoimento salvo!'); setTimeout(() => setSaveMsg(''), 2000);
  }

  // Banners
  async function criarBanner() {
    const fd = new FormData();
    fd.append('titulo', novoBanner.titulo);
    fd.append('subtitulo', novoBanner.subtitulo);
    fd.append('ctaTexto', novoBanner.ctaTexto);
    fd.append('ctaLink', novoBanner.ctaLink);
    fd.append('ordem', String(novoBanner.ordem));
    if (bannerDesktop) fd.append('imagemDesktop', bannerDesktop);
    if (bannerMobile) fd.append('imagemMobile', bannerMobile);

    const r = await fetch('/api/vitrine/banners', { method: 'POST', body: fd });
    if (r.ok) { setNovoBanner({ titulo: '', subtitulo: '', ctaTexto: '', ctaLink: '', ordem: 0 }); setBannerDesktop(null); setBannerMobile(null); fetchBanners(); setSaveMsg('Banner criado!'); setTimeout(() => setSaveMsg(''), 2000); }
  }

  // Promoções
  async function criarPromocao() {
    if (!novaPromocao.titulo || !novaPromocao.dataInicio || !novaPromocao.dataFim) return;
    const r = await fetch('/api/vitrine/promocoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...novaPromocao, percentual: Number(novaPromocao.percentual) || 0 }) });
    if (r.ok) { setNovaPromocao({ titulo: '', percentual: '', dataInicio: '', dataFim: '', tipo: 'GERAL', categoriaId: '' }); fetchPromocoes(); setSaveMsg('Promoção criada!'); setTimeout(() => setSaveMsg(''), 2000); }
  }

  // Cupons
  async function criarCupom() {
    if (!novoCupom.codigo || !novoCupom.valor) return;
    const r = await fetch('/api/vitrine/cupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...novoCupom, valor: Number(novoCupom.valor), quantidadeMax: novoCupom.quantidadeMax ? Number(novoCupom.quantidadeMax) : null, valorMinimo: novoCupom.valorMinimo ? Number(novoCupom.valorMinimo) : null }) });
    if (r.ok) { setNovoCupom({ codigo: '', descricao: '', tipo: 'PERCENTUAL', valor: '', valorMinimo: '', quantidadeMax: '', dataInicio: '', dataFim: '', primeiraCompra: false }); fetchCupons(); setSaveMsg('Cupom criado!'); setTimeout(() => setSaveMsg(''), 2000); }
    else { const e = await r.json(); setSaveMsg(e.error); setTimeout(() => setSaveMsg(''), 3000); }
  }

  // SEO
  async function salvarSeo() {
    await fetch('/api/vitrine/config-seo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seo) });
    setSaveMsg('SEO salvo!'); setTimeout(() => setSaveMsg(''), 2000);
  }

  // Logo da oficina
  async function salvarLogoUrl() {
    const r = await fetch('/api/vitrine/logo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl: logoOficina }) });
    if (r.ok) { setSaveMsg('Logo salvo!'); setTimeout(() => setSaveMsg(''), 2000); invalidarCacheLogo(); }
    else { const e = await r.json(); setSaveMsg(e?.error || 'Erro ao salvar logo.'); setTimeout(() => setSaveMsg(''), 3000); }
  }
  async function enviarLogoArquivo() {
    if (!logoArquivo) return;
    setLogoEnviando(true);
    const fd = new FormData();
    fd.append('imagem', logoArquivo);
    const r = await fetch('/api/upload/logo', { method: 'POST', body: fd });
    if (r.ok) { const d = await r.json(); setLogoOficina(d.url); setLogoArquivo(null); setSaveMsg('Logo enviado!'); setTimeout(() => setSaveMsg(''), 2000); invalidarCacheLogo(); }
    else { const e = await r.json(); setSaveMsg(e?.error || 'Erro ao enviar logo.'); setTimeout(() => setSaveMsg(''), 3000); }
    setLogoEnviando(false);
  }
  async function removerLogo() {
    const r = await fetch('/api/vitrine/logo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl: '' }) });
    if (r.ok) { setLogoOficina(''); setLogoArquivo(null); setSaveMsg('Logo removido.'); setTimeout(() => setSaveMsg(''), 2000); invalidarCacheLogo(); }
  }

  // Toggle Newsletter
  async function toggleNewsletter(id: string, ativo: boolean) {
    await fetch('/api/vitrine/newsletter-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ativo }) });
    fetchNewsletter();
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>;

  const TABS = [
    { key: 'overview' as const, label: '📊 Visão Geral' },
    { key: 'banners' as const, label: '🖼️ Banners' },
    { key: 'marcas' as const, label: '🏷️ Marcas' },
    { key: 'promocoes' as const, label: '🔥 Promoções' },
    { key: 'cupons' as const, label: '🎟️ Cupons' },
    { key: 'depoimentos' as const, label: '💬 Depoimentos' },
    { key: 'newsletter' as const, label: '📧 Newsletter' },
    { key: 'seo' as const, label: '🔍 SEO' },
    { key: 'config' as const, label: '⚙️ Config' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab === t.key ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {saveMsg && <div className={`px-4 py-2.5 rounded-lg text-xs font-medium ${saveMsg.includes('!') && !saveMsg.includes('erro') && !saveMsg.includes('Código') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{saveMsg}</div>}

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card titulo="Produtos na Vitrine" valor={stats.produtosVitrine} subtitulo={`de ${stats.totalProdutos} cadastrados`} cor="blue" />
          <Card titulo="Em Destaque" valor={stats.produtosDestaque} subtitulo="Destaque ativo" cor="amber" />
          <Card titulo="Em Oferta" valor={stats.produtosOferta} subtitulo="Com preço promocional" cor="red" />
          <Card titulo="Marcas" valor={stats.totalMarcas} subtitulo="Cadastradas" cor="violet" />
          <Card titulo="Promoções" valor={stats.totalPromocoes} subtitulo="Campanhas ativas" cor="emerald" />
          <Card titulo="Depoimentos" valor={stats.totalDepoimentos} subtitulo="Na vitrine" cor="orange" />
          <Card titulo="Newsletter" valor={stats.totalNewsletter} subtitulo="Assinantes" cor="sky" />
          <Card titulo="Orçamentos" valor={stats.orcamentosPendentes} subtitulo="Pendentes" cor="slate" />
        </div>
      )}

      {/* Banners */}
      {tab === 'banners' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Novo Banner</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={novoBanner.titulo} onChange={e => setNovoBanner({ ...novoBanner, titulo: e.target.value })} placeholder="Título" className="input-field text-xs" />
              <input value={novoBanner.subtitulo} onChange={e => setNovoBanner({ ...novoBanner, subtitulo: e.target.value })} placeholder="Subtítulo" className="input-field text-xs" />
              <input value={novoBanner.ctaTexto} onChange={e => setNovoBanner({ ...novoBanner, ctaTexto: e.target.value })} placeholder="Texto do botão" className="input-field text-xs" />
              <input value={novoBanner.ctaLink} onChange={e => setNovoBanner({ ...novoBanner, ctaLink: e.target.value })} placeholder="Link do botão" className="input-field text-xs" />
              <input type="number" value={novoBanner.ordem} onChange={e => setNovoBanner({ ...novoBanner, ordem: Number(e.target.value) })} placeholder="Ordem" className="input-field text-xs" />
              <div></div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Imagem Desktop (PNG/WebP)</label>
                <input type="file" accept="image/png,image/webp,image/jpeg" onChange={e => setBannerDesktop(e.target.files?.[0] || null)} className="text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Imagem Mobile (PNG/WebP)</label>
                <input type="file" accept="image/png,image/webp,image/jpeg" onChange={e => setBannerMobile(e.target.files?.[0] || null)} className="text-xs" />
              </div>
            </div>
            <button onClick={criarBanner} className="btn-primary text-xs px-4 py-2">Criar Banner</button>
          </div>
          <div className="space-y-2">
            {banners.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="text-sm font-bold text-slate-700">{b.titulo || 'Sem título'}</p>
                  <p className="text-[10px] text-slate-400">{b.subtitulo} | Ordem: {b.ordem} | {b.ativo ? 'Ativo' : 'Inativo'}</p>
                </div>
                {b.imagemDesktop && <img src={b.imagemDesktop} alt="" className="w-40 aspect-[4/1] object-contain bg-slate-100 rounded" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marcas */}
      {tab === 'marcas' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Nova Marca</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={novaMarca.nome} onChange={e => setNovaMarca({ ...novaMarca, nome: e.target.value })} placeholder="Nome da marca" className="input-field text-xs" />
              <input value={novaMarca.logoUrl} onChange={e => setNovaMarca({ ...novaMarca, logoUrl: e.target.value })} placeholder="URL do logo" className="input-field text-xs" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="checkbox" checked={novaMarca.destaque} onChange={e => setNovaMarca({ ...novaMarca, destaque: e.target.checked })} className="rounded" />Destaque</label>
              <button onClick={criarMarca} className="btn-primary text-xs px-4 py-2">Salvar</button>
            </div>
          </div>
          <div className="space-y-2">
            {marcas.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg font-bold text-brand-600">{m.nome.charAt(0)}</div>
                  <div><p className="text-sm font-bold text-slate-700">{m.nome}</p><p className="text-[10px] text-slate-400">{m.quantidadeProdutos} produtos</p></div>
                </div>
                {m.destaque && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[9px] font-bold">Destaque</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promoções */}
      {tab === 'promocoes' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Nova Promoção</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={novaPromocao.titulo} onChange={e => setNovaPromocao({ ...novaPromocao, titulo: e.target.value })} placeholder="Título da campanha" className="input-field text-xs" />
              <input type="number" value={novaPromocao.percentual} onChange={e => setNovaPromocao({ ...novaPromocao, percentual: e.target.value })} placeholder="% desconto" className="input-field text-xs" />
              <input type="datetime-local" value={novaPromocao.dataInicio} onChange={e => setNovaPromocao({ ...novaPromocao, dataInicio: e.target.value })} className="input-field text-xs" />
              <input type="datetime-local" value={novaPromocao.dataFim} onChange={e => setNovaPromocao({ ...novaPromocao, dataFim: e.target.value })} className="input-field text-xs" />
              <select value={novaPromocao.tipo} onChange={e => setNovaPromocao({ ...novaPromocao, tipo: e.target.value })} className="input-field text-xs">
                <option value="GERAL">Geral</option>
                <option value="CATEGORIA">Categoria</option>
                <option value="PRODUTO">Produto</option>
                <option value="OFICINA">Oficina</option>
              </select>
            </div>
            <button onClick={criarPromocao} className="btn-primary text-xs px-4 py-2">Criar Promoção</button>
          </div>
          <div className="space-y-2">
            {promocoes.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">{p.titulo} <span className="text-xs text-red-500 font-bold">{p.percentual}%</span></p>
                  <p className="text-[10px] text-slate-400">{new Date(p.dataInicio).toLocaleDateString('pt-BR')} a {new Date(p.dataFim).toLocaleDateString('pt-BR')} · {p.ativo ? 'Ativa' : 'Inativa'} · Tipo: {p.tipo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cupons */}
      {tab === 'cupons' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Novo Cupom</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={novoCupom.codigo} onChange={e => setNovoCupom({ ...novoCupom, codigo: e.target.value.toUpperCase() })} placeholder="Código (ex: CUPOM10)" className="input-field text-xs" />
              <select value={novoCupom.tipo} onChange={e => setNovoCupom({ ...novoCupom, tipo: e.target.value })} className="input-field text-xs">
                <option value="PERCENTUAL">Percentual</option>
                <option value="VALOR_FIXO">Valor Fixo</option>
              </select>
              <input value={novoCupom.valor} onChange={e => setNovoCupom({ ...novoCupom, valor: e.target.value })} placeholder={novoCupom.tipo === 'PERCENTUAL' ? '% desconto' : 'Valor (R$)'} className="input-field text-xs" />
              <input value={novoCupom.valorMinimo} onChange={e => setNovoCupom({ ...novoCupom, valorMinimo: e.target.value })} placeholder="Valor mínimo (opcional)" className="input-field text-xs" />
              <input value={novoCupom.quantidadeMax} onChange={e => setNovoCupom({ ...novoCupom, quantidadeMax: e.target.value })} placeholder="Quant. máxima (opcional)" className="input-field text-xs" />
              <input type="datetime-local" value={novoCupom.dataInicio} onChange={e => setNovoCupom({ ...novoCupom, dataInicio: e.target.value })} className="input-field text-xs" />
              <input type="datetime-local" value={novoCupom.dataFim} onChange={e => setNovoCupom({ ...novoCupom, dataFim: e.target.value })} className="input-field text-xs" />
              <input value={novoCupom.descricao} onChange={e => setNovoCupom({ ...novoCupom, descricao: e.target.value })} placeholder="Descrição (opcional)" className="input-field text-xs" />
              <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="checkbox" checked={novoCupom.primeiraCompra} onChange={e => setNovoCupom({ ...novoCupom, primeiraCompra: e.target.checked })} className="rounded" />Primeira compra</label>
            </div>
            <button onClick={criarCupom} className="btn-primary text-xs px-4 py-2">Criar Cupom</button>
          </div>
          <div className="space-y-2">
            {cupons.map(c => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">{c.codigo} <span className="text-[10px] text-slate-400">· {c.tipo === 'PERCENTUAL' ? `${c.valor}%` : fm(Number(c.valor))}</span></p>
                  <p className="text-[10px] text-slate-400">Usos: {c.quantidadeUsada}{c.quantidadeMax ? `/${c.quantidadeMax}` : ''} · {c.ativo ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Depoimentos */}
      {tab === 'depoimentos' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Novo Depoimento</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={novoDepoimento.nome} onChange={e => setNovoDepoimento({ ...novoDepoimento, nome: e.target.value })} placeholder="Nome" className="input-field text-xs" />
              <input value={novoDepoimento.cargo} onChange={e => setNovoDepoimento({ ...novoDepoimento, cargo: e.target.value })} placeholder="Cargo" className="input-field text-xs" />
            </div>
            <textarea value={novoDepoimento.texto} onChange={e => setNovoDepoimento({ ...novoDepoimento, texto: e.target.value })} placeholder="Depoimento" rows={3} className="input-field text-xs" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Nota:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNovoDepoimento({ ...novoDepoimento, estrelas: n })}
                  className={`text-lg ${n <= novoDepoimento.estrelas ? 'text-yellow-400' : 'text-slate-300'}`}>★</button>
              ))}
              <button onClick={criarDepoimento} className="btn-primary text-xs px-4 py-2 ml-auto">Salvar</button>
            </div>
          </div>
          <div className="space-y-2">
            {depoimentos.map((d: any) => (
              <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-700">{d.nome}</span>
                  <span className="text-yellow-500 text-xs">{'★'.repeat(d.estrelas)}{'☆'.repeat(5 - d.estrelas)}</span>
                </div>
                <p className="text-xs text-slate-500">{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      {tab === 'newsletter' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Assinantes ({newsletter.total})</h3>
          <p className="text-xs text-slate-500 mb-4">Ativos: {newsletter.ativos}</p>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {newsletter.assinantes.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-slate-700">{a.email}</p>
                  <p className="text-[10px] text-slate-400">{a.nome || 'Sem nome'} · {new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => toggleNewsletter(a.id, !a.ativo)}
                  className={`text-[10px] font-bold px-2 py-1 rounded ${a.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {a.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Logo da Oficina</h3>
            <span className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center overflow-hidden">
              {logoOficina
                ? <img src={logoOficina} alt="Logo da oficina" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <span className="text-white font-bold text-sm">MP</span>}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">A logo substitui o monograma "MP" no login, no painel e em toda a Vitrine. Sem logo cadastrada, o "MP" continua como padrão.</p>
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Enviar imagem (JPG, PNG ou WebP — máx. 5MB)</label>
            <div className="flex items-center gap-2">
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => setLogoArquivo(e.target.files?.[0] || null)} className="text-xs flex-1" />
              <button onClick={enviarLogoArquivo} disabled={!logoArquivo || logoEnviando} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{logoEnviando ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Ou cole a URL da logo</label>
            <div className="flex items-center gap-2">
              <input value={logoOficina} onChange={e => setLogoOficina(e.target.value)} placeholder="https://..." className="input-field text-xs flex-1" />
              <button onClick={salvarLogoUrl} className="btn-primary text-xs px-4 py-2">Salvar</button>
            </div>
          </div>
          {logoOficina && (
            <button onClick={removerLogo} className="text-[11px] font-bold text-red-600 hover:text-red-700">Remover logo (volta ao "MP")</button>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Configuração SEO</h3>
          <div className="space-y-3">
            <div><label className="text-[10px] text-slate-400 uppercase block mb-1">Meta Title</label><input value={seo.titulo} onChange={e => setSeo({ ...seo, titulo: e.target.value })} placeholder="Título da vitrine nos buscadores" className="input-field text-xs" /></div>
            <div><label className="text-[10px] text-slate-400 uppercase block mb-1">Meta Description</label><textarea value={seo.descricao} onChange={e => setSeo({ ...seo, descricao: e.target.value })} rows={2} placeholder="Descrição para buscadores" className="input-field text-xs" /></div>
            <div><label className="text-[10px] text-slate-400 uppercase block mb-1">Keywords</label><input value={seo.keywords} onChange={e => setSeo({ ...seo, keywords: e.target.value })} placeholder="palavra1, palavra2, palavra3" className="input-field text-xs" /></div>
            <div><label className="text-[10px] text-slate-400 uppercase block mb-1">Open Graph Image URL</label><input value={seo.ogImage} onChange={e => setSeo({ ...seo, ogImage: e.target.value })} placeholder="https://..." className="input-field text-xs" /></div>
          </div>
          <button onClick={salvarSeo} className="btn-primary text-xs px-5 py-2">Salvar SEO</button>
        </div>
        </div>
      )}

      {/* Config */}
      {tab === 'config' && stats?.secoes && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Seções da Vitrine</h3>
          <p className="text-[10px] text-slate-400 mb-3">Arraste para reordenar as seções da home.</p>
          <div className="space-y-1">
            {stats.secoes.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-700">{s.nome}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{s.tipo}</span>
                  <span className={`w-2 h-2 rounded-full ${s.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ titulo, valor, subtitulo, cor }: { titulo: string; valor: number; subtitulo: string; cor: string }) {
  const cores: Record<string, string> = {
    blue: 'border-l-brand-600', amber: 'border-l-amber-500', red: 'border-l-red-500',
    violet: 'border-l-violet-500', emerald: 'border-l-emerald-500', orange: 'border-l-orange-500',
    sky: 'border-l-sky-500', slate: 'border-l-slate-500',
  };
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 border-l-4 ${cores[cor] || 'border-l-brand-600'}`}>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1">{titulo}</p>
      <p className="text-2xl font-extrabold text-slate-800">{valor}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{subtitulo}</p>
    </div>
  );
}
