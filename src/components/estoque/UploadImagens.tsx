'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Rodada Subcategorias (2026-08-21): interface de fotos SIMPLIFICADA.
// Removido o seletor Principal/Secundária/Técnica/Embalagem/360°.
// Máximo 5 fotos. Cada foto possui FOTO + COR. A primeira foto vira capa por padrão
// (tipo 'PRINCIPAL') e um botão simples "Usar como capa" promove qualquer foto.
export interface ImagemInfo {
  id?: string;
  url: string;
  tipo: string;
  ordem: number;
  cor?: string | null;
}

interface UploadImagensProps {
  pecaId: string;
  imagensAtuais: ImagemInfo[];
  onImagensChange: (imagens: ImagemInfo[]) => void;
}

// Regra mantida: máximo de 5 fotos por produto.
const MAX_IMAGENS = 5;

export default function UploadImagens({ pecaId, imagensAtuais, onImagensChange }: UploadImagensProps) {
  const [imagens, setImagens] = useState<ImagemInfo[]>(imagensAtuais || []);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Sincroniza com o pai quando o modal abre (imagensAtuais muda de [] → lista real).
  useEffect(() => { setImagens(imagensAtuais || []); }, [imagensAtuais]);

  const handleUpload = useCallback(async (file: File) => {
    setErro('');
    if (imagens.length >= MAX_IMAGENS) {
      setErro(`Limite de ${MAX_IMAGENS} fotos por produto atingido. Remova uma foto para adicionar outra.`);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('imagem', file);
      form.append('pecaId', pecaId);
      // Primeira foto vira capa por padrão (PRINCIPAL); demais viram GALERIA.
      const primeira = imagens.length === 0;
      form.append('tipo', primeira ? 'PRINCIPAL' : 'GALERIA');
      form.append('ordem', String(imagens.length + 1));

      const res = await fetch('/api/pecas/imagens', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro no upload');
      }
      const data = await res.json();

      const novas = [...imagens, { id: data.id, url: data.url, tipo: primeira ? 'PRINCIPAL' : 'GALERIA', ordem: imagens.length + 1, cor: null }];
      setImagens(novas);
      onImagensChange(novas);
    } catch (e: any) {
      setErro(e.message || 'Erro ao fazer upload');
    }
    setUploading(false);
  }, [pecaId, imagens, onImagensChange]);

  async function handleRemover(index: number) {
    const img = imagens[index];
    if (img.id) {
      try {
        await fetch(`/api/pecas/imagens?id=${img.id}`, { method: 'DELETE' });
      } catch {}
    }
    const restantes = imagens.filter((_, i) => i !== index);
    // Se removeu a capa, a próxima foto vira capa automaticamente (a API já promove
    // a próxima ao deletar PRINCIPAL; refletimos aqui no estado local).
    let novas = restantes.map((im, i) => ({ ...im, ordem: i + 1 }));
    if (novas.length > 0 && !novas.some(n => n.tipo === 'PRINCIPAL')) {
      novas = novas.map((n, i) => i === 0 ? { ...n, tipo: 'PRINCIPAL' } : n);
    }
    setImagens(novas);
    onImagensChange(novas);
  }

  // Botão simples "Usar como capa": promove a foto clicada para PRINCIPAL.
  async function handleUsarComoCapa(index: number) {
    const img = imagens[index];
    if (!img.id || img.tipo === 'PRINCIPAL') return;
    try {
      const res = await fetch('/api/pecas/imagens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: img.id, tipo: 'PRINCIPAL' }),
      });
      if (!res.ok) return;
      const novas = imagens.map((im, i) => ({
        ...im,
        tipo: (i === index ? 'PRINCIPAL' : 'GALERIA') as string,
        ordem: i === index ? 0 : i + 1,
      }));
      setImagens(novas);
      onImagensChange(novas);
    } catch {}
  }

  // Altera a cor associada à foto (salva via PUT; ausente preserva).
  async function handleMudarCor(index: number, cor: string) {
    const img = imagens[index];
    const valor = cor.trim() || null;
    const novas = imagens.map((im, i) => i === index ? { ...im, cor: valor } : im);
    setImagens(novas);
    onImagensChange(novas);
    if (!img?.id) return;
    try {
      await fetch('/api/pecas/imagens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: img.id, cor: valor }),
      });
    } catch {}
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Fotos do produto ({imagens.length})</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{imagens.length}/{MAX_IMAGENS}</span>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || imagens.length >= MAX_IMAGENS}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : imagens.length >= MAX_IMAGENS ? 'Limite atingido' : '+ Adicionar foto'}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400">
        A primeira foto vira a capa do produto. Cada foto pode ter sua própria cor (ex.: Foto 1 → Preto, Foto 2 → Vermelho).
      </p>

      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />

      {erro && <p className="text-[11px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

      {/* Grid de imagens */}
      {imagens.length === 0 ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-2xl mb-1">📸</p>
          <p className="text-xs text-slate-400">Nenhuma imagem cadastrada</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Formatos aceitos: PNG, JPEG, WebP (max 10MB)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {imagens.map((img, i) => {
            const ehCapa = img.tipo === 'PRINCIPAL' || i === 0;
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" font-size="30">📷</text></svg>'; }}
                  />
                  {ehCapa && (
                    <span className="absolute top-1 left-1 text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-brand-600 text-white">CAPA</span>
                  )}
                </div>

                {/* Ações: usar como capa + cor */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {!ehCapa && (
                    <button onClick={() => handleUsarComoCapa(i)}
                      className="px-2 py-1 rounded bg-brand-600 text-white text-[10px] font-bold hover:bg-brand-700 transition-colors"
                      title="Usar esta foto como capa do produto">
                      ★ Usar como capa
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Cor</label>
                    <input
                      value={img.cor || ''}
                      onChange={e => handleMudarCor(i, e.target.value)}
                      placeholder="Ex: Preto"
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 outline-none focus:border-brand-400"
                    />
                  </div>
                  <button onClick={() => handleRemover(i)}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700"
                    title="Remover foto">
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
