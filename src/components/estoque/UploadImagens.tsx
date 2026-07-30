'use client';

import { useState, useRef, useCallback } from 'react';

export type TipoImagem = 'PRINCIPAL' | 'SECUNDARIA' | 'TECNICA' | 'EMBALAGEM' | '360';

interface ImagemInfo {
  id?: string;
  url: string;
  tipo: TipoImagem;
  ordem: number;
}

interface UploadImagensProps {
  pecaId: string;
  imagensAtuais: ImagemInfo[];
  onImagensChange: (imagens: ImagemInfo[]) => void;
}

const TIPOS: { key: TipoImagem; label: string; descricao: string }[] = [
  { key: 'PRINCIPAL', label: 'Principal', descricao: 'Foto principal do produto (catalogo)' },
  { key: 'SECUNDARIA', label: 'Secundaria', descricao: 'Angulo alternativo' },
  { key: 'TECNICA', label: 'Tecnica', descricao: 'Detalhes tecnicos, medidas, especificacoes' },
  { key: 'EMBALAGEM', label: 'Embalagem', descricao: 'Foto da embalagem original' },
  { key: '360', label: '360°', descricao: 'Foto 360 graus do produto' },
];

export default function UploadImagens({ pecaId, imagensAtuais, onImagensChange }: UploadImagensProps) {
  const [imagens, setImagens] = useState<ImagemInfo[]>(imagensAtuais || []);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoImagem>('PRINCIPAL');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setErro('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('imagem', file);
      form.append('pecaId', pecaId);
      form.append('tipo', tipoSelecionado);
      form.append('ordem', String(imagens.length + 1));

      const res = await fetch('/api/pecas/imagens', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro no upload');
      }
      const data = await res.json();

      const novas = [...imagens, { id: data.id, url: data.url, tipo: tipoSelecionado, ordem: imagens.length + 1 }];
      setImagens(novas);
      onImagensChange(novas);
    } catch (e: any) {
      setErro(e.message || 'Erro ao fazer upload');
    }
    setUploading(false);
  }, [pecaId, tipoSelecionado, imagens, onImagensChange]);

  async function handleRemover(index: number) {
    const img = imagens[index];
    if (img.id) {
      try {
        await fetch(`/api/pecas/imagens?id=${img.id}`, { method: 'DELETE' });
      } catch {}
    }
    const novas = imagens.filter((_, i) => i !== index);
    setImagens(novas);
    onImagensChange(novas);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  const tiposComImagem = imagens.map(i => i.tipo);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Imagens ({imagens.length})</h4>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : '+ Adicionar'}
        </button>
      </div>

      {/* Seletor de tipo */}
      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
        {TIPOS.map(t => (
          <button
            key={t.key}
            onClick={() => setTipoSelecionado(t.key)}
            className={`flex-1 text-[10px] font-medium px-1.5 py-1.5 rounded-md transition-colors ${
              tipoSelecionado === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            } ${tiposComImagem.includes(t.key) ? 'ring-1 ring-emerald-300' : ''}`}
            title={t.descricao}
          >
            {t.label}
            {tiposComImagem.includes(t.key) && <span className="ml-0.5 text-emerald-500">✓</span>}
          </button>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {erro && <p className="text-[11px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

      {/* Grid de imagens */}
      {imagens.length === 0 ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-2xl mb-1">📸</p>
          <p className="text-xs text-slate-400">Nenhuma imagem cadastrada</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Formatos aceitos: PNG, JPEG, WebP (max 10MB)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imagens.map((img, i) => {
            const tipo = TIPOS.find(t => t.key === img.tipo);
            return (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`${tipo?.label || 'Imagem'} ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" font-size="30">📷</text></svg>'; }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                  {tipo?.label || img.tipo}
                </span>
                <button
                  onClick={() => handleRemover(i)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remover"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
