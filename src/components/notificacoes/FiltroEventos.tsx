'use client';

const TIPOS_EVENTO = [
  { key: '', label: 'Todos' },
  { key: 'PEDIDO_CRIADO', label: 'Pedidos' },
  { key: 'VENDA_CRIADA', label: 'Vendas' },
  { key: 'OS_CRIADA', label: 'Oficina' },
  { key: 'ESTOQUE_CRITICO', label: 'Estoque' },
  { key: 'FINANCEIRO_CONTA_VENCENDO', label: 'Financeiro' },
  { key: 'SISTEMA_ALERTA', label: 'Sistema' },
];

const ORIGENS = [
  { key: '', label: 'Todas' },
  { key: 'VITRINE', label: 'Vitrine' },
  { key: 'PDV', label: 'PDV' },
  { key: 'OFICINA', label: 'Oficina' },
  { key: 'ESTOQUE', label: 'Estoque' },
  { key: 'FINANCEIRO', label: 'Financeiro' },
  { key: 'SISTEMA', label: 'Sistema' },
];

interface FiltroEventosProps {
  tipoFiltro: string;
  onTipoChange: (tipo: string) => void;
  origemFiltro: string;
  onOrigemChange: (origem: string) => void;
  dataInicio?: string;
  onDataInicioChange?: (data: string) => void;
  dataFim?: string;
  onDataFimChange?: (data: string) => void;
}

export default function FiltroEventos({
  tipoFiltro, onTipoChange,
  origemFiltro, onOrigemChange,
  dataInicio, onDataInicioChange,
  dataFim, onDataFimChange,
}: FiltroEventosProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Tipo:</span>
        <select value={tipoFiltro} onChange={e => onTipoChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border-0 cursor-pointer hover:bg-slate-200">
          {TIPOS_EVENTO.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Origem:</span>
        <select value={origemFiltro} onChange={e => onOrigemChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border-0 cursor-pointer hover:bg-slate-200">
          {ORIGENS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {onDataInicioChange && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">De:</span>
          <input type="date" value={dataInicio || ''} onChange={e => onDataInicioChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border-0" />
        </div>
      )}

      {onDataFimChange && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Até:</span>
          <input type="date" value={dataFim || ''} onChange={e => onDataFimChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border-0" />
        </div>
      )}
    </div>
  );
}
