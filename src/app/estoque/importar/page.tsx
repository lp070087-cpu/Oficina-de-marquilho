'use client';
// ENTRADA INTELIGENTE DE ESTOQUE — VERSÃO 2026 (REESCRITA COMPLETA)
// Fluxo: Selecionar arquivo → Processar → Pré-visualizar → Editar → SALVAR NO ESTOQUE

import { useState, useRef, useCallback, useMemo } from 'react';
import TabelaRevisao from '@/components/estoque/TabelaRevisao';
import ModalLogImportacao from '@/components/estoque/ModalLogImportacao';
import {
  ProdutoExtraido, StatsRevisao, ResultadoImportacao,
  FormatoEntrada,
} from '@/lib/entrada-inteligente/types';
import {
  parseCSV, parseExcel, parsePDF, parseImagemOCR, parseIAText,
} from '@/lib/entrada-inteligente/parsers';

let uidCounter = 0;
function uid(): string { return `p_${Date.now()}_${++uidCounter}`; }

export default function EntradaInteligentePage() {
  // ─── State ───
  const [etapa, setEtapa] = useState<'selecionar' | 'processando' | 'revisao' | 'salvando' | 'log'>('selecionar');
  const [formato, setFormato] = useState<FormatoEntrada | null>(null);
  const [produtos, setProdutos] = useState<ProdutoExtraido[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');
  const [arquivoNome, setArquivoNome] = useState('');
  const [duplicataStrategy, setDuplicataStrategy] = useState<'skip' | 'update' | 'create'>('skip');
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  // OCR / Processamento
  const [textoIA, setTextoIA] = useState('');
  const [anexoIA, setAnexoIA] = useState<File | null>(null);
  const [progressoOCR, setProgressoOCR] = useState(0);
  const [statusOCR, setStatusOCR] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Stats ───
  const stats: StatsRevisao = useMemo(() => {
    const s: StatsRevisao = {
      total: produtos.length,
      novos: produtos.filter(p => p.status === 'novo').length,
      existentes: produtos.filter(p => p.status === 'existente').length,
      duplicados: produtos.filter(p => p.status === 'duplicado').length,
      comErro: produtos.filter(p => p.status === 'erro').length,
      selecionados: produtos.filter(p => p.selecionado).length,
      totalUnidades: produtos.reduce((sum, p) => sum + (parseInt(p.quantidade) || 0), 0),
    };
    return s;
  }, [produtos]);

  // ─── Reset ───
  function reset() {
    setEtapa('selecionar');
    setFormato(null);
    setProdutos([]);
    setPesquisa('');
    setLoading(false);
    setMsg('');
    setMsgOk('');
    setArquivoNome('');
    setDuplicataStrategy('skip');
    setResultado(null);
    setTextoIA('');
    setAnexoIA(null);
    setProgressoOCR(0);
  }

  // ─── Enriquecer produtos (busca duplicatas no banco) ───
  // CORREÇÃO #3: 1 ÚNICO POST em vez de N requisições individuais
  async function enriquecerProdutos(raw: Partial<ProdutoExtraido>[]): Promise<ProdutoExtraido[]> {
    if (raw.length === 0) return [];

    const codigos = raw.map(p => p.codigo).filter(Boolean) as string[];
    const barras = raw.map(p => p.codigoBarras).filter(Boolean) as string[];

    let codigosExistentes = new Set<string>();
    let barrasExistentes = new Map<string, any>();

    try {
      // ÚNICA requisição POST com todos os identificadores
      const res: Response = await fetch('/api/pecas/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigos, codigosBarras: barras, eans: [] }),
      });

      if (res.ok) {
        const data = await res.json();
        // Mapas já prontos da API
        if (data.mapCodigo) {
          for (const codigo of Object.keys(data.mapCodigo)) {
            codigosExistentes.add(codigo);
          }
        }
        if (data.mapBarras) {
          for (const [barras, peca] of Object.entries(data.mapBarras)) {
            barrasExistentes.set(barras, peca);
          }
        }
      }
    } catch (err) {
      console.warn('[enriquecer] Batch lookup falhou, tratando todos como novos:', err);
      // Sem fallback N+1 — se o batch falhar, todos são tratados como novos
    }

    const enriched: ProdutoExtraido[] = raw.map(r => {
      const existeCodigo = r.codigo ? codigosExistentes.has(r.codigo) : false;
      const existeBarras = r.codigoBarras ? barrasExistentes.has(r.codigoBarras) : false;
      const existe = existeCodigo || existeBarras;

      let status: ProdutoExtraido['status'] = 'novo';
      if (existe) status = 'duplicado';
      if (!r.nome && !r.codigo) status = 'erro';

      return {
        id: uid(),
        codigo: r.codigo || '',
        codigoBarras: r.codigoBarras || '',
        ean: r.ean || '',
        nome: r.nome || '',
        descricao: r.descricao || '',
        marca: r.marca || '',
        categoria: r.categoria || '',
        subcategoria: r.subcategoria || '',
        compatibilidade: r.compatibilidade || '',
        modelo: r.modelo || '',
        ano: r.ano || '',
        aplicacao: r.aplicacao || '',
        fornecedor: r.fornecedor || '',
        precoCusto: r.precoCusto || '',
        precoVenda: r.precoVenda || '',
        quantidade: r.quantidade || '0',
        quantidadeLoja: r.quantidadeLoja || '0',
        estoqueMinimo: r.estoqueMinimo || '5',
        unidade: r.unidade || 'UN',
        localizacao: r.localizacao || '',
        observacoes: r.observacoes || '',
        status,
        selecionado: status !== 'erro',
      };
    });

    return enriched;
  }

  // ─── Processar arquivo ───
  async function processarArquivo(file: File, fmt: FormatoEntrada) {
    setArquivoNome(file.name);
    setFormato(fmt);
    setEtapa('processando');
    setLoading(true);
    setMsg('');
    setMsgOk('');
    setResultado(null);

    const inicio = Date.now();

    try {
      let raw: Partial<ProdutoExtraido>[] = [];

      if (fmt === 'csv') {
        const text = await file.text();
        raw = await parseCSV(text);

      } else if (fmt === 'excel') {
        const buffer = await file.arrayBuffer();
        raw = await parseExcel(buffer);

      } else if (fmt === 'pdf') {
        raw = await parsePDF(file);
        if (raw.length === 0) {
          setMsg('PDF sem texto detectado. Tentando OCR...');
        }

      } else if (fmt === 'imagem') {
        setStatusOCR('Preparando...');
        raw = await parseImagemOCR(file, pct => setProgressoOCR(pct), status => setStatusOCR(status));
        setProgressoOCR(0);
        setStatusOCR('');
      }

      if (raw.length === 0) {
        setMsg('Nenhum produto identificado no arquivo.');
        setEtapa('selecionar');
        setLoading(false);
        return;
      }

      const enriched = await enriquecerProdutos(raw);
      setProdutos(enriched);
      setEtapa('revisao');

    } catch (err: any) {
      console.error('Erro ao processar:', err);
      setMsg(`Erro ao processar arquivo: ${err.message || 'Formato não reconhecido'}`);
      setEtapa('selecionar');
    }
    setLoading(false);
  }

  // ─── Processar IA ───
  async function processarIA() {
    if (!textoIA.trim() && !anexoIA) {
      setMsg('Digite a descrição ou anexe um arquivo.');
      return;
    }

    setEtapa('processando');
    setLoading(true);
    setMsg('');
    setMsgOk('');

    try {
      setStatusOCR('Analisando...');
      const raw = await parseIAText(textoIA, anexoIA || undefined, pct => setProgressoOCR(pct), status => setStatusOCR(status));
      setProgressoOCR(0);
      setStatusOCR('');

      if (raw.length === 0) {
        setMsg('Não foi possível identificar produtos. Tente um texto mais detalhado.');
        setEtapa('selecionar');
        setLoading(false);
        return;
      }

      const enriched = await enriquecerProdutos(raw);
      setProdutos(enriched);
      setEtapa('revisao');
    } catch (err: any) {
      setMsg(`Erro: ${err.message}`);
      setEtapa('selecionar');
    }
    setLoading(false);
  }

  // ─── Handlers da tabela de revisão ───
  function updateProduto(id: string, field: string, value: string) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  function toggleSelecionar(id: string) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, selecionado: !p.selecionado } : p));
  }

  function toggleTodos() {
    const allSelected = produtos.every(p => p.selecionado);
    setProdutos(prev => prev.map(p => ({ ...p, selecionado: !allSelected && p.status !== 'erro' })));
  }

  function excluirProduto(id: string) {
    setProdutos(prev => prev.filter(p => p.id !== id));
  }

  function duplicarProduto(id: string) {
    const original = produtos.find(p => p.id === id);
    if (!original) return;

    const copia: ProdutoExtraido = {
      ...original,
      id: uid(),
      codigo: original.codigo + '_COPY',
      status: 'novo',
      selecionado: true,
    };
    setProdutos(prev => [...prev, copia]);
  }

  // ─── SALVAR NO ESTOQUE (EM LOTES COM PROGRESSO) ───
  // CORREÇÃO #1: Divide em lotes de 250, envia sequencialmente, mostra progresso
  const [progressoSalvar, setProgressoSalvar] = useState({ atual: 0, total: 0 });
  const [acumuladoSalvar, setAcumuladoSalvar] = useState({ criados: 0, atualizados: 0, duplicados: 0, ignorados: 0, erros: 0 });

  async function salvarNoEstoque() {
    const selecionados = produtos.filter(p => p.selecionado);
    if (selecionados.length === 0) {
      setMsg('Selecione pelo menos um produto para salvar.');
      return;
    }

    setEtapa('salvando');
    setLoading(true);
    setMsg('');
    setProgressoSalvar({ atual: 0, total: selecionados.length });
    setAcumuladoSalvar({ criados: 0, atualizados: 0, duplicados: 0, ignorados: 0, erros: 0 });

    const TAMANHO_LOTE = 250;
    const lotes: ProdutoExtraido[][] = [];
    for (let i = 0; i < selecionados.length; i += TAMANHO_LOTE) {
      lotes.push(selecionados.slice(i, i + TAMANHO_LOTE));
    }

    const inicio = Date.now();
    let logId: string | null = null;
    let totalCriados = 0;
    let totalAtualizados = 0;
    let totalDuplicados = 0;
    let totalIgnorados = 0;
    let totalErros = 0;
    const todosErros: string[] = [];

    for (let idx = 0; idx < lotes.length; idx++) {
      const lote = lotes[idx];
      try {
        const res: Response = await fetch('/api/estoque/importar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produtos: lote.map(p => ({
              codigo: p.codigo,
              codigoBarras: p.codigoBarras,
              ean: p.ean,
              nome: p.nome,
              descricao: p.descricao,
              marca: p.marca,
              categoria: p.categoria,
              subcategoria: p.subcategoria,
              compatibilidade: p.compatibilidade,
              fornecedor: p.fornecedor,
              precoCusto: p.precoCusto,
              precoVenda: p.precoVenda,
              quantidade: p.quantidade,
              quantidadeLoja: p.quantidadeLoja,
              estoqueMinimo: p.estoqueMinimo,
              localizacao: p.localizacao,
            })),
            strategy: duplicataStrategy,
            arquivo: arquivoNome || 'Entrada Manual',
            formato: formato || 'ia',
            lote: idx,
            totalLotes: lotes.length,
            logId: logId || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Falha neste lote — registra mas continua com os próximos
          totalErros += lote.length;
          todosErros.push(`Lote ${idx + 1}: ${data.error || 'Erro desconhecido'}`);
          setAcumuladoSalvar(prev => ({ ...prev, erros: prev.erros + lote.length }));
          setMsg(`Erro no lote ${idx + 1}/${lotes.length}: ${data.error}. Continuando...`);
          continue;
        }

        // Guarda o logId do primeiro lote
        if (data.logId) logId = data.logId;

        totalCriados += data.criados || 0;
        totalAtualizados += data.atualizados || 0;
        totalDuplicados += data.duplicados || 0;
        totalIgnorados += data.ignorados || 0;
        totalErros += data.erros || 0;
        if (data.errosDetalhe?.length) todosErros.push(...data.errosDetalhe);

        // Atualiza progresso
        const processadosAteAgora = Math.min((idx + 1) * TAMANHO_LOTE, selecionados.length);
        setProgressoSalvar({ atual: processadosAteAgora, total: selecionados.length });
        setAcumuladoSalvar({
          criados: totalCriados,
          atualizados: totalAtualizados,
          duplicados: totalDuplicados,
          ignorados: totalIgnorados,
          erros: totalErros,
        });
      } catch (err: any) {
        totalErros += lote.length;
        todosErros.push(`Lote ${idx + 1}: ${err.message}`);
        setMsg(`Erro de rede no lote ${idx + 1}/${lotes.length}. Tentando próximo lote...`);
      }
    }

    const tempoMs = Date.now() - inicio;

    // Resultado final
    setResultado({
      criados: totalCriados,
      atualizados: totalAtualizados,
      duplicados: totalDuplicados,
      ignorados: totalIgnorados,
      erros: totalErros,
      totalProcessado: totalCriados + totalAtualizados,
      tempoMs,
      arquivo: arquivoNome || 'Entrada Manual',
      formato: formato || 'ia',
      data: new Date().toISOString(),
      linhasComErro: todosErros.slice(0, 50),
    });

    setEtapa('log');
    setLoading(false);
  }

  // ─── Métodos disponíveis ───
  const metodos = [
    { key: 'csv' as const, titulo: 'CSV', desc: 'Arquivo .csv com dados dos produtos', icon: '📊', accept: '.csv' },
    { key: 'excel' as const, titulo: 'Excel', desc: 'Planilha .xlsx ou .xls', icon: '📈', accept: '.xlsx,.xls' },
    { key: 'pdf' as const, titulo: 'PDF', desc: 'Catálogo, nota fiscal, pedido', icon: '📄', accept: '.pdf' },
    { key: 'imagem' as const, titulo: 'Imagem / OCR', desc: 'Foto de nota, etiqueta ou catálogo', icon: '📸', accept: '.png,.jpg,.jpeg,.webp,.bmp,.tiff' },
  ];

  // ─── RENDER ───

  // ETAPA 0: SELECIONAR MÉTODO
  if (etapa === 'selecionar') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">
            ENTRADA INTELIGENTE DE ESTOQUE
          </h1>
          <p className="text-sm text-slate-500">
            Importe produtos por CSV, Excel, PDF, OCR ou IA — revise antes de salvar
          </p>
        </div>

        {/* Métodos de arquivo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {metodos.map(m => (
            <button
              key={m.key}
              onClick={() => {
                setFormato(m.key);
                fileRef.current?.click();
              }}
              className="card flex flex-col items-center justify-center text-center p-6 hover:border-brand-300 hover:shadow-lg transition-all cursor-pointer min-h-[140px] group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{m.icon}</span>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{m.titulo}</h3>
              <p className="text-[10px] text-slate-400 leading-tight">{m.desc}</p>
            </button>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={formato ? metodos.find(m => m.key === formato)?.accept : undefined}
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f && formato) {
              processarArquivo(f, formato);
            }
            e.target.value = '';
          }}
        />

        {/* Assistente IA */}
        <div className="card border-2 border-dashed border-slate-200 hover:border-brand-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🧠</span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Assistente IA</h3>
              <p className="text-xs text-slate-400">Descreva os produtos recebidos ou anexe qualquer arquivo</p>
            </div>
          </div>

          <textarea
            value={textoIA}
            onChange={e => setTextoIA(e.target.value)}
            className="input-field font-mono text-xs mb-3 min-h-[100px]"
            rows={5}
            placeholder={'Exemplos:\n\n"Chegaram 10 litros de oleo 20W50 Motul a R$ 32,90"\n"5 pastilhas de freio dianteira para CG 160 marca ProTork"\n"Kit relacao DID 428 para Fazer 250 — 3 unidades a R$ 89"\n\nOu cole dados de catálogos, notas fiscais, ou qualquer texto com códigos de peças.'}
          />

          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-secondary text-xs cursor-pointer inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {anexoIA ? anexoIA.name : 'Anexar arquivo (PDF, imagem, CSV, Excel)'}
              <input
                type="file"
                accept="image/*,.pdf,.csv,.xlsx,.xls"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setAnexoIA(f);
                    setArquivoNome(f.name);
                    // Detecta formato
                    if (f.name.endsWith('.csv')) setFormato('csv');
                    else if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) setFormato('excel');
                    else if (f.name.endsWith('.pdf')) setFormato('pdf');
                    else setFormato('ia');
                  }
                }}
              />
            </label>
            <button
              onClick={processarIA}
              disabled={!textoIA.trim() && !anexoIA}
              className="btn-primary text-xs px-6"
            >
              Analisar com IA
            </button>
          </div>
        </div>

        {msg && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs">
            {msg}
          </div>
        )}
      </div>
    );
  }

  // ETAPA 1: PROCESSANDO
  if (etapa === 'processando') {
    const isImagem = formato === 'imagem';
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-6">
          {formato === 'ia' ? 'Analisando com IA...' : `Processando ${formato?.toUpperCase()}...`}
        </h1>

        <div className="card text-center py-12">
          <div className="w-12 h-12 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {arquivoNome ? `Analisando ${arquivoNome}` : 'Processando dados...'}
          </p>

          {/* Status da etapa atual (OCR/otimização) */}
          {statusOCR && (
            <p className="text-xs text-brand-600 font-medium mt-2 animate-pulse">
              {statusOCR}
            </p>
          )}

          {/* Barra de progresso do OCR */}
          {progressoOCR > 0 && (
            <div className="mt-3 max-w-xs mx-auto">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressoOCR}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Reconhecendo texto: {progressoOCR}%</p>
            </div>
          )}

          {!statusOCR && !progressoOCR && (
            <p className="text-xs text-slate-400 mt-2">
              {isImagem ? 'Otimizando imagem e extraindo texto...' : 'Pode levar alguns segundos para arquivos grandes ou PDFs com muitas páginas'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ETAPA 2: REVISÃO (com overlay de progresso ao salvar)
  if (etapa === 'revisao' || etapa === 'salvando') {
    return (
      <div className="p-4 sm:p-6 max-w-full mx-auto">
        {/* Overlay de progresso durante o salvamento */}
        {etapa === 'salvando' && (
          <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-md w-full text-center">
              <div className="w-14 h-14 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <h2 className="text-lg font-bold text-slate-800 mb-2">Salvando no Estoque</h2>
              <p className="text-3xl font-extrabold text-brand-600 mb-4">
                {progressoSalvar.atual.toLocaleString('pt-BR')}
                <span className="text-base font-normal text-slate-400"> / </span>
                {progressoSalvar.total.toLocaleString('pt-BR')}
              </p>
              {/* Barra de progresso */}
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressoSalvar.total > 0 ? Math.round((progressoSalvar.atual / progressoSalvar.total) * 100) : 0}%` }}
                />
              </div>
              {/* Contadores parciais */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50 rounded-lg px-3 py-2">
                  <span className="text-emerald-600 font-bold text-lg block">{acumuladoSalvar.criados.toLocaleString('pt-BR')}</span>
                  <span className="text-emerald-500">Criados</span>
                </div>
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <span className="text-blue-600 font-bold text-lg block">{acumuladoSalvar.atualizados.toLocaleString('pt-BR')}</span>
                  <span className="text-blue-500">Atualizados</span>
                </div>
                <div className="bg-amber-50 rounded-lg px-3 py-2">
                  <span className="text-amber-600 font-bold text-lg block">{acumuladoSalvar.duplicados.toLocaleString('pt-BR')}</span>
                  <span className="text-amber-500">Duplicados</span>
                </div>
                <div className="bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-red-600 font-bold text-lg block">{acumuladoSalvar.erros.toLocaleString('pt-BR')}</span>
                  <span className="text-red-500">Erros</span>
                </div>
              </div>
              {msg && (
                <p className="text-[10px] text-amber-600 mt-3">{msg}</p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 mb-1 inline-block">
              ← Voltar
            </button>
            <h1 className="text-xl font-bold text-slate-800">
              Revisar Produtos · {formato?.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-400">
              {arquivoNome} · {produtos.length} produtos encontrados
            </p>
          </div>
          {msgOk && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold">
              {msgOk}
            </div>
          )}
        </div>

        {/* Estratégia de duplicatas */}
        <div className="mb-4 p-3 bg-slate-50 rounded-xl flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-600">Produtos duplicados:</span>
          {[
            { key: 'skip' as const, label: 'Ignorar' },
            { key: 'update' as const, label: 'Atualizar estoque' },
            { key: 'create' as const, label: 'Criar novo' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="dupStrategy"
                checked={duplicataStrategy === opt.key}
                onChange={() => setDuplicataStrategy(opt.key)}
                className="text-brand-600"
              />
              <span className="text-[11px] text-slate-600">{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Tabela de revisão */}
        <TabelaRevisao
          produtos={produtos}
          stats={stats}
          onChange={updateProduto}
          onToggleSelecionar={toggleSelecionar}
          onToggleTodos={toggleTodos}
          onExcluir={excluirProduto}
          onDuplicar={duplicarProduto}
          onSalvar={salvarNoEstoque}
          onCancelar={reset}
          loading={loading}
          pesquisa={pesquisa}
          onPesquisaChange={setPesquisa}
        />
      </div>
    );
  }

  // ETAPA 3: LOG PÓS-IMPORTAÇÃO
  if (etapa === 'log' && resultado) {
    return (
      <ModalLogImportacao
        resultado={resultado}
        onFechar={reset}
        onNovaEntrada={reset}
      />
    );
  }

  return null;
}

// ─── Helper: parse de texto tabular (para PDF/OCR) ───
function parseTextoTabela(texto: string): Partial<ProdutoExtraido>[] {
  const lines = texto.split('\n').filter(l => l.trim().length > 2);
  if (lines.length === 0) return [];

  const produtos: Partial<ProdutoExtraido>[] = [];

  // Padrão: código numérico seguido de descrição
  const codDesc = /^(\d{4,})\s+(.+)$/;
  // Padrão: quantidade + nome
  const qtdNome = /(\d+)\s*(?:un|unidades?|litros?|L|kits?|pares?)\s+(?:de\s+)?(.+)/i;
  // SKU genérico
  const sku = /([A-Z0-9\-]{5,})/i;

  for (const line of lines) {
    let m = line.match(codDesc);
    if (m) {
      produtos.push({ codigo: m[1], nome: m[2].slice(0, 100), descricao: m[2] });
      continue;
    }
    m = line.match(qtdNome);
    if (m) {
      produtos.push({ nome: m[2].slice(0, 100), quantidade: m[1], descricao: m[2] });
      continue;
    }
    m = line.match(sku);
    if (m) {
      produtos.push({ codigo: m[1], nome: line.slice(0, 100), descricao: line });
      continue;
    }
    // Fallback
    if (line.trim().length > 5) {
      produtos.push({ nome: line.slice(0, 100), descricao: line });
    }
  }
  return produtos;
}
