'use client';

import { useState, useEffect, useCallback } from 'react';

interface ItemChecklist {
  id: string;
  item: string;
  obrigatorio: boolean;
  concluido: boolean;
  observacao?: string | null;
  usuario?: string | null;
  concluidoEm?: string | null;
}

interface ChecklistTemplate {
  id: string;
  nome: string;
  itens: { item: string; obrigatorio: boolean; ordem: number }[];
}

interface ChecklistInteligenteProps {
  osId: string;
  tipoServico?: string | null;
  servicoTabeladoId?: string;
  readOnly?: boolean;
}

const TEMPLATES_PADRAO_POR_SERVICO: Record<string, string[]> = {
  'Troca de oleo': ['Drenar oleo antigo', 'Trocar filtro de oleo', 'Verificar nivel de oleo novo', 'Verificar vazamentos', 'Testar motor'],
  'Troca de pneus': ['Remover pneu antigo', 'Inspecionar aro', 'Instalar pneu novo', 'Balancear roda', 'Calibrar pneu', 'Apertar parafusos'],
  'Freios': ['Inspecionar pastilhas', 'Medir espessura disco', 'Verificar fluido de freio', 'Testar freio dianteiro', 'Testar freio traseiro', 'Sangrar sistema'],
  'Motor': ['Verificar compressao', 'Inspecionar velas', 'Verificar filtro de ar', 'Inspecionar cabos', 'Testar injecao', 'Verificar escapamento', 'Medir ruidos'],
  'Suspensao': ['Inspecionar amortecedores', 'Verificar buchas', 'Testar curso suspensao', 'Apertar parafusos', 'Alinhar rodas'],
  'Eletrica': ['Testar bateria', 'Verificar alternador', 'Testar farois', 'Testar lanternas', 'Verificar setas', 'Testar buzina', 'Verificar painel'],
  'Revisao': ['Trocar oleo', 'Filtro de oleo', 'Filtro de ar', 'Filtro de combustivel', 'Velas', 'Freios', 'Corrente', 'Pneus', 'Eletrica', 'Teste de rodagem'],
  'Embreagem': ['Verificar cabo embreagem', 'Ajustar folga', 'Testar engate', 'Verificar deslizamento', 'Lubrificar cabo'],
  'Diagnostico': ['Scanner eletronico', 'Ler codigos erro', 'Verificar sensores', 'Teste dinamico', 'Relatorio diagnostico'],
};

export default function ChecklistInteligente({ osId, tipoServico, servicoTabeladoId, readOnly = false }: ChecklistInteligenteProps) {
  const [itens, setItens] = useState<ItemChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [novoItem, setNovoItem] = useState('');
  const [novoItemObrigatorio, setNovoItemObrigatorio] = useState(false);
  const [aplicandoTemplate, setAplicandoTemplate] = useState(false);

  const fetchChecklist = useCallback(async () => {
    try {
      const r = await fetch(`/api/ordens/${osId}/checklist`);
      setItens(Array.isArray(await r.json()) ? await r.json() : []);
    } catch { setItens([]); }
    setLoading(false);
  }, [osId]);

  const fetchTemplates = useCallback(async () => {
    try {
      // Busca templates vinculados ao servicoTabeladoId OU templates gerais
      const params = servicoTabeladoId ? `?servicoId=${servicoTabeladoId}` : '';
      const r = await fetch(`/api/checklist-templates${params}`);
      if (r.ok) setTemplates(Array.isArray(await r.json()) ? await r.json() : []);
    } catch { setTemplates([]); }
  }, [servicoTabeladoId]);

  useEffect(() => {
    fetchChecklist();
    fetchTemplates();
  }, [fetchChecklist, fetchTemplates]);

  // Determinar itens do template padrão pelo tipo de serviço
  function getItensPadrao(): string[] {
    if (!tipoServico) return [];
    // Busca correspondência parcial — ex: "Troca de oleo, Freios" → combina ambos
    const servicosOS = tipoServico.split(',').map(s => s.trim());
    const todos: string[] = [];
    servicosOS.forEach(s => {
      const match = Object.entries(TEMPLATES_PADRAO_POR_SERVICO).find(([key]) => s.toLowerCase().includes(key.toLowerCase()));
      if (match) todos.push(...match[1]);
    });
    return [...new Set(todos)]; // Remove duplicates
  }

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
        body: JSON.stringify({ item: novoItem.trim(), obrigatorio: novoItemObrigatorio }),
      });
      setNovoItem('');
      setNovoItemObrigatorio(false);
      fetchChecklist();
    } catch { /* ignore */ }
  }

  async function aplicarTemplatePadrao() {
    setAplicandoTemplate(true);
    const itensPadrao = getItensPadrao();
    if (itensPadrao.length === 0) { setAplicandoTemplate(false); return; }

    const faltando = itensPadrao.filter(t => !itens.some(i => i.item === t));
    if (faltando.length === 0) { setAplicandoTemplate(false); return; }

    try {
      await fetch(`/api/ordens/${osId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: faltando }),
      });
      fetchChecklist();
    } catch { /* ignore */ }
    setAplicandoTemplate(false);
  }

  async function aplicarTemplateSalvo(template: ChecklistTemplate) {
    setAplicandoTemplate(true);
    const faltando = template.itens
      .filter(t => !itens.some(i => i.item === t.item))
      .map(t => ({ item: t.item, obrigatorio: t.obrigatorio }));

    if (faltando.length === 0) { setAplicandoTemplate(false); return; }

    try {
      // Adiciona um por um com obrigatorio
      for (const f of faltando) {
        await fetch(`/api/ordens/${osId}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: f.item, obrigatorio: f.obrigatorio }),
        });
      }
      fetchChecklist();
      setShowTemplates(false);
    } catch { /* ignore */ }
    setAplicandoTemplate(false);
  }

  const itensObrigatorios = itens.filter(i => i.obrigatorio);
  const concluidos = itens.filter(i => i.concluido).length;
  const obrigatoriosPendentes = itensObrigatorios.filter(i => !i.concluido);
  const progresso = itens.length > 0 ? Math.round((concluidos / itens.length) * 100) : 0;
  const sugestaoTemplate = getItensPadrao();

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
            <span className="text-slate-500 font-medium">{concluidos}/{itens.length} concluídos</span>
            {obrigatoriosPendentes.length > 0 && (
              <span className="text-red-500 font-semibold">⚠ {obrigatoriosPendentes.length} obrigatórios pendentes</span>
            )}
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
          <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group ${item.obrigatorio ? 'border-l-2 border-red-300 pl-2' : ''}`}>
            <button
              onClick={() => !readOnly && toggleItem(item)}
              disabled={readOnly}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                item.concluido ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-brand-400'
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
              {item.obrigatorio && <span className="text-[10px] text-red-500 ml-1">(obrigatório)</span>}
            </span>
            {item.concluido && item.usuario && (
              <span className="text-[10px] text-slate-400">{item.usuario}</span>
            )}
          </div>
        ))}

        {itens.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">Nenhum item no checklist.</p>
            {sugestaoTemplate.length > 0 && (
              <p className="text-[10px] text-slate-500 mt-1">Template sugerido: "{tipoServico}" com {sugestaoTemplate.length} itens</p>
            )}
          </div>
        )}
      </div>

      {/* Ações */}
      {!readOnly && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          {/* Adicionar item */}
          <div className="flex items-center gap-2">
            <input value={novoItem} onChange={e => setNovoItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarItem()}
              placeholder="Adicionar item ao checklist..." className="input-field flex-1 text-xs" />
            <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
              <input type="checkbox" checked={novoItemObrigatorio} onChange={e => setNovoItemObrigatorio(e.target.checked)} className="rounded" />
              Obrigatório
            </label>
            <button onClick={adicionarItem} className="btn-primary text-xs px-3 py-2">+</button>
          </div>

          {/* Templates */}
          <div className="flex flex-wrap gap-2 items-center">
            {sugestaoTemplate.length > 0 && (
              <button onClick={aplicarTemplatePadrao} disabled={aplicandoTemplate}
                className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-100 transition-colors">
                {aplicandoTemplate ? 'Aplicando...' : `📋 Carregar Checklist: "${tipoServico}"`}
              </button>
            )}

            {templates.length > 0 && (
              <button onClick={() => setShowTemplates(!showTemplates)}
                className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-100 transition-colors">
                Modelos Salvos ({templates.length})
              </button>
            )}
          </div>

          {/* Lista de templates salvos */}
          {showTemplates && templates.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-700">Modelos de Checklist</p>
              <div className="space-y-1">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{t.nome}</p>
                      <p className="text-[10px] text-slate-400">{t.itens.length} itens</p>
                    </div>
                    <button onClick={() => aplicarTemplateSalvo(t)} disabled={aplicandoTemplate}
                      className="text-[10px] bg-brand-600 text-white px-2 py-1 rounded font-bold">
                      Aplicar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumo obrigatórios */}
      {obrigatoriosPendentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <p className="text-xs font-semibold text-red-700">Itens obrigatórios pendentes</p>
            <p className="text-[10px] text-red-600 mt-0.5">{obrigatoriosPendentes.map(i => i.item).join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
