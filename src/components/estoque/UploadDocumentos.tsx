'use client';

import { useState, useRef, useCallback } from 'react';

export type TipoDocumento = 'MANUAL' | 'FICHA_TECNICA' | 'GARANTIA' | 'CATALOGO' | 'VIDEO' | 'OBSERVACAO_TECNICA';

interface DocumentoInfo {
  id?: string;
  url: string;
  tipo: TipoDocumento;
  nome: string;
  tamanho: number;
}

interface UploadDocumentosProps {
  pecaId: string;
  documentosAtuais: DocumentoInfo[];
  onDocumentosChange: (docs: DocumentoInfo[]) => void;
}

const TIPOS_DOC: { key: TipoDocumento; label: string; icon: string }[] = [
  { key: 'MANUAL', label: 'Manual', icon: '📖' },
  { key: 'FICHA_TECNICA', label: 'Ficha Tecnica', icon: '📐' },
  { key: 'GARANTIA', label: 'Garantia', icon: '🛡️' },
  { key: 'CATALOGO', label: 'Catalogo', icon: '📑' },
  { key: 'VIDEO', label: 'Video', icon: '🎬' },
  { key: 'OBSERVACAO_TECNICA', label: 'Obs. Tecnica', icon: '📝' },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDocumentos({ pecaId, documentosAtuais, onDocumentosChange }: UploadDocumentosProps) {
  const [documentos, setDocumentos] = useState<DocumentoInfo[]>(documentosAtuais || []);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoDocumento>('MANUAL');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setErro('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('documento', file);
      form.append('pecaId', pecaId);
      form.append('tipo', tipoSelecionado);
      form.append('nome', file.name);
      form.append('tamanho', String(file.size));

      const res = await fetch('/api/pecas/documentos', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro no upload');
      }
      const data = await res.json();

      const novos = [...documentos, { id: data.id, url: data.url, tipo: tipoSelecionado, nome: file.name, tamanho: file.size }];
      setDocumentos(novos);
      onDocumentosChange(novos);
    } catch (e: any) {
      setErro(e.message || 'Erro ao fazer upload');
    }
    setUploading(false);
  }, [pecaId, tipoSelecionado, documentos, onDocumentosChange]);

  async function handleRemover(index: number) {
    const doc = documentos[index];
    if (doc.id) {
      try {
        await fetch(`/api/pecas/documentos?id=${doc.id}`, { method: 'DELETE' });
      } catch {}
    }
    const novos = documentos.filter((_, i) => i !== index);
    setDocumentos(novos);
    onDocumentosChange(novos);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  const tiposComDoc = documentos.map(d => d.tipo);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Documentos ({documentos.length})</h4>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : '+ Adicionar'}
        </button>
      </div>

      {/* Seletor de tipo */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-0.5 rounded-lg">
        {TIPOS_DOC.map(t => (
          <button
            key={t.key}
            onClick={() => setTipoSelecionado(t.key)}
            className={`text-[10px] font-medium px-2 py-1.5 rounded-md transition-colors ${
              tipoSelecionado === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            } ${tiposComDoc.includes(t.key) ? 'ring-1 ring-emerald-300' : ''}`}
            title={t.label}
          >
            {t.icon} {t.label}
            {tiposComDoc.includes(t.key) && <span className="ml-0.5 text-emerald-500">✓</span>}
          </button>
        ))}
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.mp4,.mov,.avi,image/*,video/*" onChange={handleFileChange} className="hidden" />

      {erro && <p className="text-[11px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

      {/* Lista de documentos */}
      {documentos.length === 0 ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-2xl mb-1">📂</p>
          <p className="text-xs text-slate-400">Nenhum documento cadastrado</p>
          <p className="text-[10px] text-slate-400 mt-0.5">PDF, imagens, videos, planilhas (max 50MB)</p>
        </div>
      ) : (
        <div className="space-y-1">
          {documentos.map((doc, i) => {
            const tipo = TIPOS_DOC.find(t => t.key === doc.tipo);
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group border border-slate-100">
                <span className="text-lg flex-shrink-0">{tipo?.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-slate-800 truncate">{doc.nome || 'Documento sem nome'}</p>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">
                      {tipo?.label || doc.tipo}
                    </span>
                  </div>
                  {doc.tamanho > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(doc.tamanho)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Visualizar"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <button
                    onClick={() => handleRemover(i)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remover"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
