'use client';

import { useState, useEffect, useCallback } from 'react';

interface CompatibilidadeEntry {
  id?: string;
  pecaId: string;
  marca: string;
  modelo: string;
  anoInicial: number | null;
  anoFinal: number | null;
  motor: string | null;
  versao: string | null;
  observacao: string | null;
}

interface CompatibilidadeVeiculosProps {
  pecaId: string;
}

const MARCAS_MOTOS = [
  'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'BMW', 'Triumph', 'Ducati',
  'Harley-Davidson', 'KTM', 'Royal Enfield', 'Husqvarna', 'MV Agusta',
  'Aprilia', 'Moto Guzzi', 'Benelli', 'CFMoto', 'Dafra', 'Haojue',
  'Kasinski', 'Shineray', 'Traxx', 'Vespa', 'Piaggio', 'SYM', 'Zontes',
  'Bajaj', 'Outra',
];

// Modelos comuns por marca
const MODELOS_POR_MARCA: Record<string, string[]> = {
  'Honda': ['CG 125', 'CG 150', 'CG 160', 'CB 250', 'CB 300', 'CB 500', 'CB 600 Hornet', 'CB 1000R', 'XRE 300', 'XRE 190', 'Sahara 300', 'CRF 250', 'CRF 450', 'NC 750', 'Bros 150', 'Bros 160', 'Pop 100', 'Pop 110i', 'Biz 100', 'Biz 110', 'Biz 125', 'PCX', 'SH 150', 'Elite', 'Lead', 'XR 250 Tornado', 'NX 400 Falcon', 'CBR 600', 'CBR 1000', 'Twister 250', 'Twister 300', 'CB 300F', 'CB 190', 'CG Titan', 'CG Fan'],
  'Yamaha': ['XTZ 125', 'XTZ 150', 'XTZ 250', 'XT 660', 'Fazer 150', 'Fazer 250', 'Fazer 600', 'FZ 15', 'FZ 25', 'FZ', 'MT-03', 'MT-07', 'MT-09', 'R3', 'R6', 'R1', 'XJ6', 'Tracer 900', 'YBR 125', 'YBR 150', 'YS 150', 'T115 Crypton', 'NMax', 'Fluo', 'Neo', 'Fascino', 'Ray ZR', 'Ténéré 250', 'XMax'],
  'Suzuki': ['GSX 125', 'GSX-R 750', 'GSX-R 1000', 'Hayabusa', 'Burgman 125', 'Burgman 400', 'SV 650', 'V-Strom 650', 'V-Strom 1000', 'DR 650', 'DRZ 400', 'Intruder 125', 'Intruder 250', 'Yes 125', 'GN 125', 'EN 125'],
  'Kawasaki': ['Ninja 300', 'Ninja 400', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Z400', 'Z650', 'Z900', 'Versys 650', 'Versys 1000', 'Vulcan S', 'KLX 300', 'KX 250', 'KX 450'],
  'BMW': ['G 310 GS', 'G 310 R', 'F 750 GS', 'F 850 GS', 'R 1200 GS', 'R 1250 GS', 'S 1000 RR', 'S 1000 XR', 'R nineT'],
  'Triumph': ['Tiger 900', 'Tiger 1200', 'Street Triple', 'Speed Triple', 'Bonneville', 'Scrambler', 'Rocket 3', 'Trident 660'],
  'Ducati': ['Monster', 'Streetfighter', 'Panigale V2', 'Panigale V4', 'Multistrada', 'Scrambler', 'Diavel', 'Supersport'],
  'Harley-Davidson': ['Iron 883', 'Forty-Eight', 'Street 750', 'Fat Boy', 'Street Glide', 'Road King', 'Heritage Classic', 'Nightster'],
};

export default function CompatibilidadeVeiculos({ pecaId }: CompatibilidadeVeiculosProps) {
  const [comps, setComps] = useState<CompatibilidadeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Form state
  const [marca, setMarca] = useState('');
  const [modeloBusca, setModeloBusca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anoInicial, setAnoInicial] = useState('');
  const [anoFinal, setAnoFinal] = useState('');
  const [motor, setMotor] = useState('');
  const [versao, setVersao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pecas/compatibilidade?pecaId=${pecaId}`);
      const data = await res.json();
      setComps(Array.isArray(data) ? data : []);
    } catch {
      setComps([]);
    }
    setLoading(false);
  }, [pecaId]);

  useEffect(() => { carregar(); }, [carregar]);

  function resetForm() {
    setMarca('');
    setModeloBusca('');
    setModelo('');
    setAnoInicial('');
    setAnoFinal('');
    setMotor('');
    setVersao('');
    setObservacao('');
    setEditId(null);
    setEditando(false);
    setErro('');
  }

  async function handleSalvar() {
    if (!marca.trim()) { setErro('Marca e obrigatoria'); return; }
    if (!modelo.trim()) { setErro('Modelo e obrigatorio'); return; }
    setSalvando(true);
    setErro('');
    try {
      const body: any = {
        pecaId,
        marca: marca.trim(),
        modelo: modelo.trim(),
        anoInicial: anoInicial || null,
        anoFinal: anoFinal || null,
        motor: motor.trim() || null,
        versao: versao.trim() || null,
        observacao: observacao.trim() || null,
      };

      if (editId) {
        body.id = editId;
        await fetch('/api/pecas/compatibilidade', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch('/api/pecas/compatibilidade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      resetForm();
      carregar();
    } catch {
      setErro('Erro ao salvar compatibilidade');
    }
    setSalvando(false);
  }

  function handleEditar(comp: CompatibilidadeEntry) {
    setMarca(comp.marca);
    setModelo(comp.modelo);
    setModeloBusca(comp.modelo);
    setAnoInicial(comp.anoInicial?.toString() || '');
    setAnoFinal(comp.anoFinal?.toString() || '');
    setMotor(comp.motor || '');
    setVersao(comp.versao || '');
    setObservacao(comp.observacao || '');
    setEditId(comp.id || null);
    setEditando(true);
  }

  async function handleExcluir(id: string) {
    try {
      await fetch(`/api/pecas/compatibilidade?id=${id}`, { method: 'DELETE' });
      carregar();
    } catch {}
  }

  const modelosSugeridos = marca ? (MODELOS_POR_MARCA[marca] || []).filter(m =>
    m.toLowerCase().includes(modeloBusca.toLowerCase())
  ) : [];

  const anoAtual = new Date().getFullYear();

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Carregando compatibilidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Compatibilidade ({comps.length})</h4>
        <button
          onClick={() => setEditando(true)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
        >
          + Adicionar Veiculo
        </button>
      </div>

      {/* Form de edicao */}
      {editando && (
        <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/50 space-y-3">
          {/* Marca */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">Marca *</label>
            <select
              value={marca}
              onChange={e => { setMarca(e.target.value); setModelo(''); setModeloBusca(''); }}
              className="input-field text-xs mt-1"
            >
              <option value="">Selecionar marca...</option>
              {MARCAS_MOTOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Modelo */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">Modelo *</label>
            {marca && modelosSugeridos.length > 0 ? (
              <>
                <input
                  value={modeloBusca}
                  onChange={e => { setModeloBusca(e.target.value); setModelo(e.target.value); }}
                  placeholder="Digite ou selecione..."
                  className="input-field text-xs mt-1"
                />
                {modeloBusca && modelosSugeridos.length > 0 && !modelosSugeridos.includes(modeloBusca) && (
                  <div className="mt-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg">
                    {modelosSugeridos.filter(m => m.toLowerCase().includes(modeloBusca.toLowerCase())).slice(0, 8).map(m => (
                      <button
                        key={m}
                        onClick={() => { setModelo(m); setModeloBusca(m); }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 transition-colors"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <input
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                placeholder="Ex: CG 160"
                className="input-field text-xs mt-1"
              />
            )}
          </div>

          {/* Anos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Ano Inicial</label>
              <input
                type="number"
                value={anoInicial}
                onChange={e => setAnoInicial(e.target.value)}
                placeholder={`Ex: 2010`}
                min={1970}
                max={anoAtual + 2}
                className="input-field text-xs mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Ano Final</label>
              <input
                type="number"
                value={anoFinal}
                onChange={e => setAnoFinal(e.target.value)}
                placeholder={`Ex: ${anoAtual}`}
                min={1970}
                max={anoAtual + 2}
                className="input-field text-xs mt-1"
              />
            </div>
          </div>

          {/* Motor + Versao */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Motor</label>
              <input
                value={motor}
                onChange={e => setMotor(e.target.value)}
                placeholder="Ex: 160cc"
                className="input-field text-xs mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Versao</label>
              <input
                value={versao}
                onChange={e => setVersao(e.target.value)}
                placeholder="Ex: Flex"
                className="input-field text-xs mt-1"
              />
            </div>
          </div>

          {/* Observacao */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">Observacao</label>
            <input
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Somente modelos com injeção eletronica"
              className="input-field text-xs mt-1"
            />
          </div>

          {erro && <p className="text-[11px] text-red-600">{erro}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="btn-brand text-xs px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : editId ? 'Atualizar' : 'Adicionar'}
            </button>
            <button onClick={resetForm} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de compatibilidades */}
      {comps.length === 0 && !editando ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-2xl mb-1">🏍️</p>
          <p className="text-xs text-slate-400">Nenhuma compatibilidade cadastrada</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Adicione veiculos compativeis com esta peca</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comps.map((comp, i) => (
            <div key={comp.id || i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group border border-slate-100">
              <span className="text-lg flex-shrink-0">🏍️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">
                  {comp.marca} {comp.modelo}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {[comp.anoInicial, comp.anoFinal].filter(Boolean).join(' - ')}
                  {comp.motor && ` · ${comp.motor}`}
                  {comp.versao && ` · ${comp.versao}`}
                </p>
                {comp.observacao && (
                  <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{comp.observacao}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditar(comp)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  title="Editar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => comp.id && handleExcluir(comp.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
