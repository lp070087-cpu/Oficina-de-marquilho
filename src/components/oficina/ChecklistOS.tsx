'use client';

import { useState, useEffect, useCallback } from 'react';

interface ItemChecklist {
  id: string;
  item: string;
  concluido: boolean;
  observacao?: string | null;
  usuario?: string | null;
  concluidoEm?: string | null;
}

interface ChecklistTemplate {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

interface ChecklistOSProps {
  osId: string;
  readOnly?: boolean;
}

const TEMPLATES_PADRAO: string[] = [
  'Oleo do motor', 'Filtro de oleo', 'Filtro de ar', 'Filtro de combustivel',
  'Vela de ignicao', 'Freio dianteiro', 'Freio traseiro', 'Fluido de freio',
  'Corrente', 'Coroa e pinhão', 'Pneus', 'Calibragem pneus',
  'Suspensao dianteira', 'Suspensao traseira', 'Farois', 'Lanternas',
  'Setas', 'Buzina', 'Retrovisores', 'Cabos', 'Bateria',
  'Teste de rodagem',
];

export default function ChecklistOS({ osId, readOnly = false }: ChecklistOSProps) {
  const [itens, setItens] = useState<ItemChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoItem, setNovoItem] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);

  const fetchChecklist = useCallback(async () => {
    try {
      const r = await fetch(`/api/ordens/${osId}/checklist`);
      const data = await r.json();
      setItens(Array.isArray(data) ? data : []);
    } catch { setItens([]); }
    setLoading(false);
  }, [osId]);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  async function toggleItem(item: ItemChecklist) {
    try {
      await fetch(`/api/ordens/${osId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, concluido: !item.concluido }),
      });
      fetchChecklist();
    } catch { /* ignore */ }
  }

  async function adicionarItem() {
    if (!novoItem.trim()) return;
    try {
      await fetch(`/api/ordens/${osId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: novoItem.trim() }),
      });
      setNovoItem('');
      fetchChecklist();
    } catch { /* ignore */ }
  }

  async function aplicarTemplate() {
    const itensFaltando = TEMPLATES_PADRAO.filter(t => !itens.some(i => i.item === t));
    if (itensFaltando.length === 0) { setTemplateOpen(false); return; }
    try {
      await fetch(`/api/ordens/${osId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: itensFaltando }),
      });
      setTemplateOpen(false);
      fetchChecklist();
    } catch { /* ignore */ }
  }

  const concluidos = itens.filter(i => i.concluido).length;
  const progresso = itens.length > 0 ? Math.round((concluidos / itens.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de progresso */}
      {itens.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{concluidos}/{itens.length} itens concluídos</span>
            <span className="text-slate-400 font-bold">{progresso}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progresso === 100 ? 'bg-emerald-500' : 'bg-brand-600'}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="space-y-1">
        {itens.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
            <button
              onClick={() => !readOnly && toggleItem(item)}
              disabled={readOnly}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                item.concluido
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-300 hover:border-brand-400'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {item.concluido && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </button>
            <span className={`text-sm flex-1 ${item.concluido ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
              {item.item}
            </span>
            {item.concluido && item.usuario && (
              <span className="text-[10px] text-slate-400">{item.usuario}</span>
            )}
          </div>
        ))}

        {itens.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">Nenhum item no checklist. Adicione itens ou use um template.</p>
          </div>
        )}
      </div>

      {/* Acoes (apenas se nao for readOnly) */}
      {!readOnly && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={novoItem}
              onChange={e => setNovoItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarItem()}
              placeholder="Adicionar item..."
              className="input-field flex-1 text-xs"
            />
            <button onClick={adicionarItem} className="btn-primary text-xs px-3 py-2">+</button>
          </div>
          <button onClick={() => setTemplateOpen(!templateOpen)} className="text-[11px] text-brand-600 font-semibold hover:text-brand-700">
            Usar template padrão
          </button>
          {templateOpen && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-brand-800">Template: Checklist Padrão ({TEMPLATES_PADRAO.length} itens)</p>
              <p className="text-[11px] text-brand-600">Apenas itens que ainda não estão no checklist serão adicionados.</p>
              <div className="flex gap-2">
                <button onClick={aplicarTemplate} className="btn-primary text-xs px-4 py-2">Aplicar Template</button>
                <button onClick={() => setTemplateOpen(false)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
