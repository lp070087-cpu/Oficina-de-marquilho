'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Peca {
  id: string; nome: string; codigo: string; precoVenda: number;
  quantidade: number; quantidadeLoja: number; compatibilidade?: string;
  categoria: { nome: string };
}
interface ItemOS {
  id: string; peca: Peca; quantidade: number; precoUnitario: number; adaptado?: boolean;
}
interface Mecanico { id: string; name: string; emAlmoco: boolean; }
export interface OS {
  id: string; numero: number; nomeCliente: string; telefoneCliente: string;
  modeloMoto: string; placaMoto?: string; anoMoto?: string;
  descricaoProblema: string; diagnostico?: string; status: string;
  valorTotal: number; valorMaoDeObra: number;
  mecanico?: Mecanico; mecanicoId?: string; balcao?: { name: string };
  itens: ItemOS[];
  notaFiscal?: { id: string; numero: string; emitidaEm: string };
  statusPagamento?: string | null; formaPagamento?: string | null;
  valorPago?: number | null; dataPagamento?: string | null;
  usuarioPagamento?: string | null;
  createdAt?: string;
  tipoServico?: string;
}

function getCompatBadge(peca: Peca, modeloMoto: string): { label: string; color: string } {
  const comp = (peca.compatibilidade || '').toLowerCase();
  const modelo = modeloMoto.toLowerCase();
  if (comp.includes('universal')) return { label: 'Universal', color: 'bg-violet-50 text-violet-700' };
  if (comp.includes(modelo)) return { label: 'Compativel', color: 'bg-emerald-50 text-emerald-700' };
  return { label: 'Adaptada', color: 'bg-amber-50 text-amber-700' };
}

export default function DetalheOSBalcao({ os: initialOS, onClose }: { os: OS; onClose: () => void }) {
  const [dados, setDados] = useState<OS>(initialOS);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');

  // Peça autocomplete
  const [pecaBusca, setPecaBusca] = useState('');
  const [pecaAberta, setPecaAberta] = useState(false);
  const [qtd, setQtd] = useState('1');
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // Revisão (mão de obra)
  const [temRevisao, setTemRevisao] = useState(Number(dados.valorMaoDeObra) > 0);
  const [valorRevisao, setValorRevisao] = useState(String(Number(dados.valorMaoDeObra) || 0));

  const pecaInputRef = useRef<HTMLInputElement>(null);
  const pecaDropdownRef = useRef<HTMLDivElement>(null);

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const sc: Record<string, string> = {
    ABERTA: 'bg-sky-50 text-sky-700', EM_ANDAMENTO: 'bg-amber-50 text-amber-700',
    AGUARDANDO_PECAS: 'bg-orange-50 text-orange-700', PRONTA: 'bg-violet-50 text-violet-700',
    CONCLUIDA: 'bg-emerald-50 text-emerald-700', CANCELADA: 'bg-red-50 text-red-700',
  };
  const sl: Record<string, string> = {
    ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECAS: 'Aguard. pecas',
    PRONTA: 'Pronta', CONCLUIDA: 'Concluida', CANCELADA: 'Cancelada',
  };

  // Carregar peças
  const carregarPecas = useCallback(async (todas: boolean) => {
    const p = new URLSearchParams();
    if (dados.modeloMoto && !todas) p.set('modelo', dados.modeloMoto);
    if (todas) p.set('todas', '1');
    try { const r = await fetch(`/api/pecas?${p}`); const d = await r.json(); setPecas(Array.isArray(d) ? d : []); } catch {}
  }, [dados.modeloMoto]);

  useEffect(() => {
    fetch('/api/mecanicos').then(r => r.json()).then(setMecanicos).catch(() => {});
    carregarPecas(false);
  }, [carregarPecas]);

  // Click outside para fechar dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        pecaDropdownRef.current && !pecaDropdownRef.current.contains(e.target as Node) &&
        pecaInputRef.current && !pecaInputRef.current.contains(e.target as Node)
      ) {
        setPecaAberta(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleMostrarTodas() { const n = !mostrarTodas; setMostrarTodas(n); carregarPecas(n); }

  const pecasOrdenadas = [...pecas].sort((a, b) => {
    const ba = getCompatBadge(a, dados.modeloMoto);
    const bb = getCompatBadge(b, dados.modeloMoto);
    const o: Record<string, number> = { 'Compativel': 0, 'Universal': 1, 'Adaptada': 2 };
    return (o[ba.label] ?? 3) - (o[bb.label] ?? 3);
  });

  // Filtrar conforme busca no autocomplete
  const pecasFiltradas = pecaBusca
    ? pecasOrdenadas.filter(p =>
        p.nome.toLowerCase().includes(pecaBusca.toLowerCase()) ||
        p.codigo.toLowerCase().includes(pecaBusca.toLowerCase())
      ).slice(0, 15)
    : pecasOrdenadas.slice(0, 15);

  const qtdCompativeis = pecas.filter(p => getCompatBadge(p, dados.modeloMoto).label !== 'Adaptada').length;

  async function addItem(pecaId: string) {
    if (!pecaId) return;
    const r = await fetch(`/api/ordens/${dados.id}/itens`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pecaId, quantidade: Number(qtd) || 1 }),
    }).catch(() => null);
    if (r) {
      const u = await r.json();
      setDados(u);
      setPecaBusca('');
      setQtd('1');
      setPecaAberta(false);
      setMsg('');
    } else {
      setMsg('Erro ao adicionar peca.');
    }
  }

  async function removeItem(itemId: string) {
    const r = await fetch(`/api/ordens/${dados.id}/itens`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    }).catch(() => null);
    if (r) { const u = await r.json(); setDados(u); }
  }

  async function atualizarRevisao() {
    const v = parseFloat(valorRevisao) || 0;
    const r = await fetch(`/api/ordens/${dados.id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: dados.status, valorMaoDeObra: v }),
    });
    if (r?.ok) { const u = await r.json(); setDados(u); }
  }

  async function finalizarServico() {
    if (!confirm('Finalizar servico? A moto ficara AGUARDANDO PAGAMENTO para liberacao.')) return;
    // Primeiro atualiza mao de obra se necessario
    const vRevisao = parseFloat(valorRevisao) || 0;
    const body: any = { status: 'CONCLUIDA', statusPagamento: 'AGUARDANDO_PAGAMENTO' };
    if (vRevisao > 0) body.valorMaoDeObra = vRevisao;
    const r = await fetch(`/api/ordens/${dados.id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (r) {
      const u = await r.json();
      setDados(u);
      setMsgOk('Servico finalizado! AGUARDANDO PAGAMENTO PARA LIBERACAO DA MOTO.');
    } else {
      setMsg('Erro ao finalizar servico.');
    }
  }

  async function liberarMoto() {
    if (!confirm('Liberar moto? A OS sera encerrada.')) return;
    const r = await fetch(`/api/ordens/${dados.id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusPagamento: 'ENTREGUE', status: 'CONCLUIDA' }),
    }).catch(() => null);
    if (r) {
      const u = await r.json();
      setDados(u);
      setMsgOk('Moto entregue! OS encerrada.');
    } else {
      setMsg('Erro ao liberar moto.');
    }
  }

  function linkWhatsApp() {
    const t = encodeURIComponent(
      `Ola ${dados.nomeCliente}! OS #${dados.numero} - ${dados.modeloMoto}. Total: ${fm(Number(dados.valorTotal))}`
    );
    window.open(`https://wa.me/55${dados.telefoneCliente.replace(/\D/g, '')}?text=${t}`, '_blank');
  }

  const totalPecas = (dados.itens || []).reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0);
  // Usar estado local para total reativo: mostra valor digitado antes de salvar via API
  const maoDeObraAtual = temRevisao ? (parseFloat(valorRevisao) || 0) : 0;
  const totalGeral = totalPecas + maoDeObraAtual;

  // Estados de visualizacao
  const isLiberado = dados.statusPagamento === 'ENTREGUE';
  const isPago = dados.statusPagamento === 'PAGO';
  const isAguardandoPagamento = dados.statusPagamento === 'AGUARDANDO_PAGAMENTO';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">OS #{dados.numero}</h2>
            <p className="text-sm text-slate-500">
              {dados.nomeCliente} - {dados.modeloMoto}{dados.placaMoto ? ` (${dados.placaMoto})` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
        </div>

        {/* Tab */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          <button className="px-4 py-2 text-xs font-medium border-b-2 border-brand-600 text-brand-600">
            Pecas e Valores
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {msg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">{msg}</div>
          )}
          {msgOk && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded text-xs mb-3 font-bold">{msgOk}</div>
          )}

          <div>
            {/* Info compatibilidade */}
            <div className="flex items-center justify-between mb-3 p-2.5 bg-slate-50 rounded-lg text-xs">
              <span>
                {qtdCompativeis} pecas compativeis com <strong className="text-brand-600">{dados.modeloMoto}</strong>
              </span>
              <button
                onClick={toggleMostrarTodas}
                className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
                  mostrarTodas ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {mostrarTodas ? 'So compativeis' : 'Mostrar todas'}
              </button>
            </div>

            {/* Autocomplete de peças */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  ref={pecaInputRef}
                  value={pecaBusca}
                  onChange={e => { setPecaBusca(e.target.value); setPecaAberta(true); }}
                  onFocus={() => setPecaAberta(true)}
                  className="input-field text-xs"
                  placeholder="Buscar peca por nome ou codigo..."
                  autoComplete="off"
                />
                {pecaAberta && pecasFiltradas.length > 0 && (
                  <div
                    ref={pecaDropdownRef}
                    className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow-lg w-full max-h-56 overflow-y-auto mt-1"
                  >
                    {pecasFiltradas.map(p => {
                      const b = getCompatBadge(p, dados.modeloMoto);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => addItem(p.id)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-brand-50 hover:text-brand-700 flex items-center justify-between border-b border-slate-50"
                        >
                          <div>
                            <span className="font-medium text-slate-700">{p.nome}</span>
                            <span className="text-slate-400 ml-2 font-mono text-[10px]">{p.codigo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${b.color}`}>{b.label}</span>
                            <span className="text-[10px] text-slate-400">
                              Cent:{p.quantidade || 0} Loja:{p.quantidadeLoja || 0}
                            </span>
                            <span className="font-semibold text-slate-600">{fm(Number(p.precoVenda))}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <input
                type="number" value={qtd} onChange={e => setQtd(e.target.value)}
                className="input-field w-20 text-xs" min="1"
              />
            </div>

            {/* Itens */}
            {dados.itens.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Nenhuma peca adicionada.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-1.5 font-medium text-slate-500">Peca</th>
                    <th className="text-center py-1.5 font-medium text-slate-500">Tipo</th>
                    <th className="text-center py-1.5 font-medium text-slate-500">Loja</th>
                    <th className="text-center py-1.5 font-medium text-slate-500">Central</th>
                    <th className="text-right py-1.5 font-medium text-slate-500">Qtd</th>
                    <th className="text-right py-1.5 font-medium text-slate-500">Unit.</th>
                    <th className="text-right py-1.5 font-medium text-slate-500">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dados.itens.map(i => {
                    const b = getCompatBadge(i.peca, dados.modeloMoto);
                    const isAd = i.adaptado || b.label === 'Adaptada';
                    const pecaOrig = pecas.find(p => p.id === i.peca.id);
                    const qcentral = pecaOrig?.quantidade || 0;
                    const qloja = pecaOrig?.quantidadeLoja || 0;
                    return (
                      <tr key={i.id} className="border-b border-slate-50">
                        <td className="py-1.5 text-slate-700">{i.peca.nome}</td>
                        <td className="py-1.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                            isAd ? 'bg-amber-50 text-amber-700' : b.label === 'Compativel' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                          }`}>
                            {isAd ? 'Adaptada' : b.label}
                          </span>
                        </td>
                        <td className={`py-1.5 text-center font-bold text-[10px] ${qloja > 0 ? 'text-brand-600' : 'text-red-400'}`}>{qloja}</td>
                        <td className={`py-1.5 text-center font-bold text-[10px] ${qcentral > 0 ? 'text-slate-500' : 'text-amber-600'}`}>{qcentral}</td>
                        <td className="py-1.5 text-right">{i.quantidade}</td>
                        <td className="py-1.5 text-right text-slate-500">{fm(Number(i.precoUnitario))}</td>
                        <td className="py-1.5 text-right font-medium">{fm(Number(i.precoUnitario) * i.quantidade)}</td>
                        <td className="py-1.5 text-right">
                          <button onClick={() => removeItem(i.id)} className="text-red-500 text-[11px]">x</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="py-1.5 text-right text-xs text-slate-500">Total pecas</td>
                    <td className="py-1.5 text-right font-bold">{fm(totalPecas)}</td>
                    <td></td>
                  </tr>
                  {/* Mão de obra com checkbox Revisão */}
                  <tr>
                    <td colSpan={6} className="py-1.5 text-right text-xs text-slate-500">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={temRevisao}
                          onChange={async e => {
                            const checked = e.target.checked;
                            setTemRevisao(checked);
                            if (!checked) {
                              setValorRevisao('0');
                              const r = await fetch(`/api/ordens/${dados.id}/status`, {
                                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: dados.status, valorMaoDeObra: 0 }),
                              });
                              if (r?.ok) { const u = await r.json(); setDados(u); }
                            }
                          }}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>Revisao?</span>
                      </label>
                    </td>
                    <td className="py-1.5 text-right font-bold">
                      {temRevisao ? (
                        <input
                          type="number"
                          step="0.01"
                          value={valorRevisao}
                          onChange={e => setValorRevisao(e.target.value)}
                          onBlur={atualizarRevisao}
                          className="input-field w-24 text-xs text-right"
                        />
                      ) : (
                        <span className="text-slate-400">{fm(0)}</span>
                      )}
                    </td>
                    <td></td>
                  </tr>
                  {/* Total Geral */}
                  <tr className="font-bold bg-brand-50">
                    <td colSpan={6} className="py-2 text-right text-sm text-slate-700">TOTAL</td>
                    <td className="py-2 text-right text-sm text-brand-700">{fm(totalGeral)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-100 space-y-3 flex-shrink-0">
          {isLiberado ? (
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">
                Moto Entregue ✓
              </span>
              <button onClick={onClose} className="btn-secondary text-xs">Fechar</button>
            </div>
          ) : isPago ? (
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                🟢 Pagamento confirmado
              </span>
              <button onClick={liberarMoto} className="btn-primary text-xs">
                🏍️ Liberar Moto
              </button>
            </div>
          ) : isAguardandoPagamento ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                  🔴 AGUARDANDO PAGAMENTO PARA LIBERACAO DA MOTO
                </span>
                <button onClick={onClose} className="btn-secondary text-xs">Fechar</button>
              </div>
              <p className="text-[11px] text-slate-400 text-center">A Dona confirmara o pagamento para liberar a entrega.</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${sc[dados.status] || 'bg-slate-50 text-slate-500'}`}>
                {sl[dados.status] || dados.status}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={linkWhatsApp} className="text-xs text-emerald-600 font-medium">WhatsApp</button>
                <button onClick={finalizarServico} disabled={dados.status === 'CANCELADA'} className="btn-primary text-xs">
                  🔧 Finalizar Servico
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

