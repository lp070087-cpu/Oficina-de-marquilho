'use client';

import { useState, useEffect, useCallback } from 'react';

interface WhatsAppLog {
  id: string;
  telefone: string;
  tipo: string;
  mensagem: string;
  status: string;
  ordemServico?: { numero: number; nomeCliente: string } | null;
  createdAt: string;
}

const TIPO_LABEL: Record<string, string> = {
  OS_CRIADA: 'OS Criada',
  STATUS_ATUALIZADO: 'Status Atualizado',
  ORCAMENTO: 'Orçamento',
  LEMBRETE_REVISAO: 'Lembrete Revisão',
  ENTREGA: 'Entrega',
};

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  ENVIADO: 'bg-emerald-100 text-emerald-700',
  ERRO: 'bg-red-100 text-red-700',
};

interface WhatsAppPanelProps {
  osId?: string;
  telefone?: string;
  modeloMoto?: string;
}

export default function WhatsAppPanel({ osId, telefone, modeloMoto }: WhatsAppPanelProps) {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'STATUS_ATUALIZADO', mensagem: '' });
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const params = osId ? `?ordemServicoId=${osId}` : '';
      const r = await fetch(`/api/whatsapp${params}`);
      if (r.ok) setLogs(Array.isArray(await r.json()) ? await r.json() : []);
    } catch { setLogs([]); }
    setLoading(false);
  }, [osId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function registrarEnvio() {
    if (!form.mensagem.trim()) return;
    if (!telefone) return;
    setSaving(true);
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone,
          tipo: form.tipo,
          mensagem: form.mensagem.trim(),
          ordemServicoId: osId || null,
        }),
      });
      setForm({ tipo: 'STATUS_ATUALIZADO', mensagem: '' });
      setShowForm(false);
      fetchLogs();
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Cabecalho */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-800">WhatsApp</h3>
            <p className="text-[11px] text-emerald-600">
              {telefone ? `Envio para: ${telefone}` : 'Estrutura preparada para integração futura'}
            </p>
            {modeloMoto && <p className="text-[10px] text-emerald-500">{modeloMoto}</p>}
          </div>
        </div>
      </div>

      {/* Aviso de estrutura */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
          <p className="text-xs font-semibold text-amber-700">Estrutura preparada — integração pendente</p>
          <p className="text-[10px] text-amber-600 mt-0.5">As mensagens ficam registradas como log. A integração com a API do WhatsApp será ativada no futuro.</p>
        </div>
      </div>

      {/* Botao nova mensagem */}
      {telefone && (
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
          </svg>
          Nova Mensagem
        </button>
      )}

      {/* Form nova mensagem */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Tipo</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="input-field mt-1 text-xs">
              {Object.entries(TIPO_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Mensagem</label>
            <textarea value={form.mensagem} onChange={e => setForm({ ...form, mensagem: e.target.value })}
              className="input-field mt-1 text-xs resize-none" rows={3} placeholder="Digite a mensagem..." />
          </div>
          <div className="flex gap-2">
            <button onClick={registrarEnvio} disabled={saving || !form.mensagem.trim()}
              className="btn-primary text-xs px-4 py-2">{saving ? 'Salvando...' : 'Registrar Mensagem'}</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      {/* Log de mensagens */}
      <div>
        <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">Histórico de Mensagens</h4>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhuma mensagem registrada</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">{TIPO_LABEL[log.tipo] || log.tipo}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[log.status] || STATUS_BADGE.PENDENTE}`}>
                    {log.status === 'PENDENTE' ? 'Pendente' : log.status === 'ENVIADO' ? 'Enviado' : 'Erro'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{log.mensagem}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400">{log.telefone}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                {log.ordemServico && (
                  <p className="text-[10px] text-slate-400 mt-1">OS #{log.ordemServico.numero} — {log.ordemServico.nomeCliente}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
