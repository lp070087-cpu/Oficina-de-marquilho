'use client';

interface NotificationCardProps {
  id: string;
  icone?: string | null;
  titulo: string;
  mensagem: string;
  prioridade: string;
  lida: boolean;
  urlDestino?: string | null;
  createdAt: string;
  onMarkRead?: (id: string) => void;
  onClick?: () => void;
}

export default function NotificationCard({
  id, icone, titulo, mensagem, prioridade, lida, urlDestino, createdAt, onMarkRead, onClick,
}: NotificationCardProps) {
  function handleClick() {
    if (!lida && onMarkRead) onMarkRead(id);
    if (onClick) onClick();
    else if (urlDestino) window.location.href = urlDestino;
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl border p-4 flex items-start gap-3 cursor-pointer hover:border-brand-300 transition-colors ${
        !lida ? 'border-brand-200 bg-brand-50/10' : 'border-slate-200'
      }`}
    >
      <span className="text-lg flex-shrink-0 pt-0.5">{icone || '📌'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-slate-700 truncate">{titulo}</p>
          {!lida && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
            prioridade === 'CRITICA' ? 'bg-red-50 text-red-600' :
            prioridade === 'ALTA' ? 'bg-amber-50 text-amber-600' :
            prioridade === 'BAIXA' ? 'bg-slate-100 text-slate-500' :
            'bg-sky-50 text-sky-600'
          }`}>
            {prioridade}
          </span>
        </div>
        <p className="text-[12px] text-slate-500 mt-1">{mensagem}</p>
        <p className="text-[10px] text-slate-400 mt-2">{new Date(createdAt).toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
}
