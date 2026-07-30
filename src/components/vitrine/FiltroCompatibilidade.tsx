'use client';

import { useState } from 'react';

export default function FiltroCompatibilidade() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [motor, setMotor] = useState('');

  // Buscar compatibilidades reais seria via API, aqui estrutura pronta
  const ready = marca || modelo || ano || motor;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Buscar por Compatibilidade</h3>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Marca (ex: Honda)" value={marca} onChange={e => setMarca(e.target.value)}
          className="input-field text-xs py-2" />
        <input placeholder="Modelo (ex: CG 160)" value={modelo} onChange={e => setModelo(e.target.value)}
          className="input-field text-xs py-2" />
        <input placeholder="Ano (ex: 2020)" value={ano} onChange={e => setAno(e.target.value)}
          className="input-field text-xs py-2" />
        <input placeholder="Motor (ex: 160cc)" value={motor} onChange={e => setMotor(e.target.value)}
          className="input-field text-xs py-2" />
      </div>
      {ready && (
        <button className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-extrabold transition-colors">
          Buscar Peças Compatíveis
        </button>
      )}
    </div>
  );
}
