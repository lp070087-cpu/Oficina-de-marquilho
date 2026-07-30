'use client';

import { useState } from 'react';
import ScannerUniversal from '@/components/scanner/ScannerUniversal';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function RetiradaQrCodePage() {
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [pedido, setPedido] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onQrDetectado(code: string) {
    setMostrarScanner(false);
    setMsg('');
    // Code format: MP-PEDIDO-NUMERO
    const numero = code.replace('MP-PEDIDO-', '').trim();
    if (!numero) { setMsg('QR Code inválido.'); return; }

    setLoading(true);
    try {
      // Buscar pedido pelo qrCode
      const r = await fetch(`/api/vitrine/pedidos?admin=1`);
      if (r.ok) {
        const data = await r.json();
        const encontrado = (data.pedidos || []).find((p: any) => p.qrCode === code || String(p.numero) === numero);
        if (encontrado) {
          setPedido(encontrado);
        } else {
          setMsg('Pedido não encontrado com este código.');
        }
      }
    } catch { setMsg('Erro ao buscar pedido.'); }
    setLoading(false);
  }

  async function confirmarRetirada() {
    if (!pedido) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/vitrine/pedidos/${pedido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RETIRADO' }),
      });
      if (r.ok) {
        const updated = await r.json();
        setPedido(updated);
        setMsg(`✅ Pedido #${updated.numero} retirado com sucesso! Estoque baixado.`);
      } else {
        const e = await r.json();
        setMsg(e.error || 'Erro ao confirmar retirada.');
      }
    } catch { setMsg('Erro de conexão.'); }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Retirada via QR Code</h1>
        <p className="text-xs text-slate-400 mt-1">Escaneie o código apresentado pelo cliente para confirmar a retirada</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-xs font-medium ${
          msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{msg}</div>
      )}

      {/* Botão Scanner */}
      {!pedido && !mostrarScanner && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          </div>
          <p className="text-sm font-bold text-slate-700 mb-2">Escanear QR Code do Pedido</p>
          <p className="text-xs text-slate-400 mb-4">Use a câmera ou leitor para escanear o código apresentado pelo cliente</p>
          <button onClick={() => { setMostrarScanner(true); setMsg(''); setPedido(null); }}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">
            📷 Abrir Scanner
          </button>
        </div>
      )}

      {/* Scanner */}
      {mostrarScanner && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Escaneie o QR Code</span>
            <button onClick={() => setMostrarScanner(false)} className="text-xs text-slate-400 hover:text-red-500">Cancelar</button>
          </div>
          <ScannerUniversal onDetected={(code) => onQrDetectado(code)} onClose={() => setMostrarScanner(false)} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Buscando pedido...</p>
        </div>
      )}

      {/* Pedido encontrado */}
      {pedido && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className={`p-4 ${pedido.status === 'RETIRADO' ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-brand-50 border-b border-brand-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-extrabold text-brand-600">Pedido #{pedido.numero}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  pedido.status === 'PRONTO_PARA_RETIRADA' ? 'bg-emerald-100 text-emerald-700' :
                  pedido.status === 'RETIRADO' ? 'bg-slate-100 text-slate-600' :
                  pedido.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {pedido.status === 'PRONTO_PARA_RETIRADA' ? 'Pronto p/ Retirada' :
                   pedido.status === 'RETIRADO' ? 'Retirado' :
                   pedido.status === 'CANCELADO' ? 'Cancelado' :
                   pedido.status}
                </span>
              </div>
              <span className="text-sm font-extrabold text-slate-800">{fm(Number(pedido.total))}</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Cliente */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cliente</p>
                <p className="text-xs font-medium text-slate-700">{pedido.clienteNome || pedido.cliente?.nome}</p>
                <p className="text-[11px] text-slate-400">{pedido.cliente?.telefone || pedido.clienteTelefone}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Retirada por</p>
                <p className="text-xs font-medium text-slate-700">{pedido.retiradaNome || pedido.clienteNome}</p>
                {pedido.retiradaTelefone && <p className="text-[11px] text-slate-400">{pedido.retiradaTelefone}</p>}
              </div>
            </div>

            {/* Itens */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Itens</p>
              {pedido.itens?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700">{item.peca.nome} <span className="text-slate-400">({item.peca.codigo})</span></span>
                  <span className="text-slate-500">{item.quantidade}x</span>
                </div>
              ))}
            </div>

            {/* Ações */}
            {pedido.status === 'PRONTO_PARA_RETIRADA' && (
              <button onClick={confirmarRetirada} disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-extrabold transition-colors shadow-lg">
                {loading ? 'Confirmando...' : '✅ Confirmar Retirada — Baixar Estoque'}
              </button>
            )}

            {pedido.status === 'RETIRADO' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <p className="text-sm font-bold text-emerald-700">✓ Pedido retirado com sucesso!</p>
                <p className="text-xs text-emerald-600 mt-1">Estoque baixado em {pedido.retiradaEm ? new Date(pedido.retiradaEm).toLocaleString('pt-BR') : ''}</p>
              </div>
            )}

            {pedido.status === 'CANCELADO' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm font-bold text-red-700">Pedido cancelado</p>
                {pedido.canceladoPor && <p className="text-xs text-red-600 mt-1">Cancelado por: {pedido.canceladoPor}</p>}
              </div>
            )}

            {!['PRONTO_PARA_RETIRADA', 'RETIRADO', 'CANCELADO'].includes(pedido.status) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-xs text-amber-700">Este pedido ainda não está pronto para retirada. Status atual: {pedido.status}</p>
              </div>
            )}

            <button onClick={() => { setPedido(null); setMsg(''); }} className="w-full text-center text-xs text-brand-600 font-bold hover:underline">
              Escanear outro pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
