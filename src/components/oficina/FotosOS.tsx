'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Foto {
  id: string;
  tipo: string;
  url: string;
  descricao?: string | null;
  obrigatorio: boolean;
  createdAt: string;
}

// FASE 15-F.1: Fotos obrigatórias e extras
const FOTOS_OBRIGATORIAS = [
  { key: 'RECEPCAO', label: 'Recepção', icon: '📥', desc: 'Foto da moto na chegada — placa, hodômetro, visão geral' },
  { key: 'ANTES', label: 'Antes', icon: '📷', desc: 'Estado antes do serviço — áreas que serão trabalhadas' },
  { key: 'DEPOIS', label: 'Depois', icon: '✅', desc: 'Resultado final — serviço concluído' },
];

const FOTOS_EXTRAS = [
  { key: 'DURANTE', label: 'Durante Serviço', icon: '🔧', desc: 'Fotos do trabalho em andamento' },
  { key: 'PECAS_DANIFICADAS', label: 'Peças Danificadas', icon: '⚠️', desc: 'Peças com defeito ou desgaste' },
  { key: 'PECAS_TROCADAS', label: 'Peças Trocadas', icon: '🔄', desc: 'Peças novas instaladas' },
  { key: 'OBSERVACOES', label: 'Observações', icon: '📝', desc: 'Detalhes ou anotações visuais' },
  { key: 'CLIENTE', label: 'Cliente', icon: '👤', desc: 'Foto do cliente com a moto (opcional)' },
];

const TODOS_TIPOS = [...FOTOS_OBRIGATORIAS, ...FOTOS_EXTRAS];

interface FotosOSProps {
  osId: string;
}

export default function FotosOS({ osId }: FotosOSProps) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [uploading, setUploading] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('RECEPCAO');
  const [descricao, setDescricao] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'obrigatorias' | 'extras' | 'todas'>('obrigatorias');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchFotos = useCallback(async () => {
    try {
      const params = tipoFiltro ? `?tipo=${tipoFiltro}` : '';
      const r = await fetch(`/api/ordens/${osId}/fotos${params}`);
      const data = await r.json();
      setFotos(Array.isArray(data) ? data : []);
    } catch { setFotos([]); }
    setLoading(false);
  }, [osId, tipoFiltro]);

  useEffect(() => { fetchFotos(); }, [fetchFotos]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.url) {
        await fetch(`/api/ordens/${osId}/fotos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: uploadData.url, tipo: tipoSelecionado, descricao: descricao || null }),
        });
        setDescricao('');
        fetchFotos();
      }
    } catch { /* ignore */ }
    setUploading(false);
  }

  async function deletarFoto(fotoId: string) {
    try {
      await fetch(`/api/ordens/${osId}/fotos?fotoId=${fotoId}`, { method: 'DELETE' });
      fetchFotos();
    } catch { /* ignore */ }
  }

  const fotosAgrupadas: Record<string, Foto[]> = {};
  TODOS_TIPOS.forEach(t => { fotosAgrupadas[t.key] = fotos.filter(f => f.tipo === t.key); });

  function getFotoCount(tipo: string): number {
    return (fotosAgrupadas[tipo] || []).length;
  }

  function isObrigatoria(tipo: string): boolean {
    return FOTOS_OBRIGATORIAS.some(f => f.key === tipo);
  }

  function getObrigatoriaStatus(tipo: string): 'ok' | 'pendente' | 'na' {
    if (!isObrigatoria(tipo)) return 'na';
    return getFotoCount(tipo) > 0 ? 'ok' : 'pendente';
  }

  function getTiposVisiveis() {
    if (abaAtiva === 'obrigatorias') return FOTOS_OBRIGATORIAS;
    if (abaAtiva === 'extras') return FOTOS_EXTRAS;
    return TODOS_TIPOS;
  }

  const pendentes = FOTOS_OBRIGATORIAS.filter(t => getObrigatoriaStatus(t.key) === 'pendente');

  return (
    <div className="space-y-4">
      {/* Alertas de fotos obrigatórias pendentes */}
      {pendentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-red-700">Fotos obrigatórias pendentes</p>
              <p className="text-[11px] text-red-600 mt-0.5">
                {pendentes.map(p => `${p.label}`).join(', ')} — {pendentes.length === 3 ? 'Nenhuma foto obrigatória registrada' : `${pendentes.length} faltando`}
              </p>
              <p className="text-[10px] text-red-500 mt-1">A OS não poderá ser finalizada sem estas fotos.</p>
            </div>
          </div>
        </div>
      )}

      {/* Abas: Obrigatórias / Extras / Todas */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        <button onClick={() => { setAbaAtiva('obrigatorias'); setTipoFiltro(''); }}
          className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${abaAtiva === 'obrigatorias' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>
          📸 Obrigatórias {pendentes.length > 0 && <span className="text-red-500">({pendentes.length})</span>}
        </button>
        <button onClick={() => { setAbaAtiva('extras'); setTipoFiltro(''); }}
          className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${abaAtiva === 'extras' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>
          📎 Extras
        </button>
        <button onClick={() => { setAbaAtiva('todas'); setTipoFiltro(''); }}
          className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${abaAtiva === 'todas' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>
          🖼️ Todas
        </button>
      </div>

      {/* Upload */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex-wrap">
        <select value={tipoSelecionado} onChange={e => setTipoSelecionado(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white">
          {TODOS_TIPOS.map(t => (
            <option key={t.key} value={t.key}>{t.icon} {t.label}{isObrigatoria(t.key) ? ' *' : ''}</option>
          ))}
        </select>
        <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição (opcional)"
          className="input-field flex-1 text-xs min-w-[120px]" />
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}/>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2">
          {uploading ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Enviando...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Foto</>
          )}
        </button>
      </div>

      {/* Galeria */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : fotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">Nenhuma foto</p>
          <p className="text-xs text-slate-400 mt-1">Tire as fotos obrigatórias (Recepção, Antes, Depois) para poder finalizar</p>
        </div>
      ) : (
        <div className="space-y-5">
          {getTiposVisiveis().map(t => {
            const fotosTipo = fotosAgrupadas[t.key] || [];
            const status = getObrigatoriaStatus(t.key);

            return (
              <div key={t.key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-slate-700">{t.icon} {t.label}</span>
                  {status === 'ok' && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Completo"/>}
                  {status === 'pendente' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Pendente"/>}
                  <span className="text-[10px] text-slate-400">({fotosTipo.length})</span>
                  {isObrigatoria(t.key) && <span className="text-[9px] text-red-400 font-bold">OBRIGATÓRIO</span>}
                </div>
                {fotosTipo.length === 0 ? (
                  <div className={`rounded-lg border border-dashed p-4 text-center ${status === 'pendente' ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/30'}`}>
                    <p className="text-[11px] text-slate-400">{t.desc}</p>
                    {status === 'pendente' && (
                      <button onClick={() => { setTipoSelecionado(t.key); fileRef.current?.click(); }}
                        className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-semibold mt-1.5 hover:bg-red-200 transition-colors">
                        Tirar foto agora
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {fotosTipo.map(foto => (
                      <div key={foto.id} className="relative group cursor-pointer" onClick={() => setLightbox(foto.url)}>
                        <img src={foto.url} alt={foto.descricao || `${t.label}`}
                          className="w-full aspect-square object-cover rounded-xl border border-slate-200 group-hover:border-brand-400 transition-all" />
                        {foto.descricao && (
                          <p className="text-[10px] text-slate-500 mt-1 truncate">{foto.descricao}</p>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deletarFoto(foto.id); }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" alt="Preview" />
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
