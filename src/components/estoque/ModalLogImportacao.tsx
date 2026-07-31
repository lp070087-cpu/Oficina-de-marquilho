'use client';
// Modal de log pós-importação
interface Resultado {
  criados: number;
  atualizados: number;
  duplicados: number;
  ignorados: number;
  erros: number;
  totalProcessado: number;
  errosDetalhe?: string[];
  tempoMs: number;
  arquivo: string;
  formato: string;
}

interface Props {
  resultado: Resultado;
  onFechar: () => void;
  onNovaEntrada: () => void;
}

export default function ModalLogImportacao({ resultado, onFechar, onNovaEntrada }: Props) {
  const seg = (resultado.tempoMs / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg my-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-800">Importação Concluída</h2>
              <p className="text-xs text-emerald-600">{resultado.arquivo} · {resultado.formato.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <StatRow label="Criados" value={resultado.criados} color="text-emerald-600" bg="bg-emerald-50" />
            <StatRow label="Atualizados" value={resultado.atualizados} color="text-blue-600" bg="bg-blue-50" />
            <StatRow label="Duplicados" value={resultado.duplicados} color="text-amber-600" bg="bg-amber-50" />
            <StatRow label="Ignorados" value={resultado.ignorados} color="text-slate-500" bg="bg-slate-50" />
            <StatRow label="Erros" value={resultado.erros} color="text-red-600" bg="bg-red-50" />
            <StatRow label="Tempo" value={`${seg}s`} color="text-slate-600" bg="bg-slate-50" isText />
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">{resultado.totalProcessado}</span> produtos processados com sucesso
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Arquivo: {resultado.arquivo} · Formato: {resultado.formato.toUpperCase()} · {new Date().toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Erros */}
          {resultado.erros > 0 && resultado.errosDetalhe && resultado.errosDetalhe.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs font-bold text-red-700 mb-2">Detalhes dos erros:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {resultado.errosDetalhe.map((e, i) => (
                  <p key={i} className="text-[10px] text-red-600 font-mono">{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={onNovaEntrada} className="btn-primary text-xs flex-1">
              Nova Entrada
            </button>
            <button onClick={onFechar} className="btn-secondary text-xs">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color, bg, isText }: {
  label: string; value: number | string; color: string; bg: string; isText?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${bg}`}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <span className={`text-lg font-extrabold ${color}`}>{value}</span>
    </div>
  );
}
