'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AssinaturaData {
  id: string;
  nome: string;
  assinatura: string;
  ip?: string | null;
  data: string;
}

interface AssinaturaOSProps {
  osId: string;
  onAssinado?: () => void;
}

export default function AssinaturaOS({ osId, onAssinado }: AssinaturaOSProps) {
  const [assinaturaSalva, setAssinaturaSalva] = useState<AssinaturaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modoAssinar, setModoAssinar] = useState(false);
  const [nome, setNome] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/ordens/${osId}/assinatura`)
      .then(r => r.json())
      .then(data => { if (data) setAssinaturaSalva(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [osId]);

  // Canvas handlers
  useEffect(() => {
    if (!modoAssinar) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [modoAssinar]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() {
    setDrawing(false);
  }

  function limpar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function salvarAssinatura() {
    if (!nome.trim()) { setErro('Informe o nome do cliente.'); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Verifica se tem algo desenhado
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some(v => v !== 0);
    if (!hasContent) { setErro('Desenhe a assinatura no canvas acima.'); return; }

    setSaving(true);
    setErro('');
    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await fetch(`/api/ordens/${osId}/assinatura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), assinatura: base64 }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssinaturaSalva(data);
        setModoAssinar(false);
        onAssinado?.();
      } else {
        setErro(data.error || 'Erro ao salvar');
      }
    } catch {
      setErro('Erro ao salvar assinatura.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (assinaturaSalva) {
    return (
      <div className="space-y-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="text-sm font-bold text-emerald-700">Assinatura registrada</span>
          </div>
          <img src={assinaturaSalva.assinatura} alt="Assinatura" className="max-w-[300px] border border-slate-200 rounded-lg bg-white p-2" />
          <div className="mt-3 space-y-1 text-xs">
            <p className="text-slate-600"><span className="font-semibold">Nome:</span> {assinaturaSalva.nome}</p>
            <p className="text-slate-600"><span className="font-semibold">Data/Hora:</span> {new Date(assinaturaSalva.data).toLocaleString('pt-BR')}</p>
            {assinaturaSalva.ip && <p className="text-slate-400"><span className="font-semibold">IP:</span> {assinaturaSalva.ip}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!modoAssinar) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600 mb-1">Nenhuma assinatura registrada</p>
        <p className="text-xs text-slate-400 mb-4">Registre a assinatura do cliente na retirada da moto</p>
        <button onClick={() => setModoAssinar(true)} className="btn-primary text-xs px-4 py-2">
          Registrar Assinatura
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 font-medium">Desenhe a assinatura no campo abaixo:</p>

      <div ref={containerRef} className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="touch-none w-full cursor-crosshair"
          style={{ height: 180 }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={limpar} className="text-xs text-red-600 font-semibold hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50">
          Limpar
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase">Nome de quem assina</label>
        <input value={nome} onChange={e => setNome(e.target.value)} className="input-field mt-1 text-sm" placeholder="Nome completo do cliente" />
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-medium">{erro}</div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={salvarAssinatura} disabled={saving}
          className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2">
          {saving ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Salvando...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Confirmar Assinatura</>
          )}
        </button>
        <button onClick={() => setModoAssinar(false)} className="btn-secondary text-xs px-4 py-2.5">Cancelar</button>
      </div>
    </div>
  );
}
