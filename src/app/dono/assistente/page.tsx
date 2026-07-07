import Link from 'next/link';

export default function AssistenteIAPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">ASSISTENTE IA</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cadastro automatico de pecas e ordens</p>
      </div>

      {/* Banner principal */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1A2E] via-[#1a2d4a] to-[#1e3a5f] p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/10 rounded-full translate-y-1/4 -translate-x-1/4 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600/30 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">ASSISTENTE DE CADASTRO AUTOMATICO</h2>
          </div>
          <p className="text-sm text-white/70 max-w-2xl mb-6">
            Cole aqui uma lista de pecas (com codigo, nome, preco e quantidade) e o assistente
            cadastra tudo automaticamente no estoque. Ideal para importar dados do GSlim, Excel
            ou qualquer outra planilha.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/dono/importar" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-600/25">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              Ir para Importacao
            </Link>
            <Link href="/dono/estoque" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-all">
              Ver estoque
            </Link>
          </div>
        </div>
      </div>

      {/* Cards de instrucao */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
            <span className="text-brand-600 font-bold text-sm">1</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Exporte os dados</h3>
          <p className="text-xs text-slate-500">No GSlim ou Excel, exporte a lista de pecas em formato CSV ou copie a tabela com as colunas: codigo, nome, preco, quantidade.</p>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
            <span className="text-brand-600 font-bold text-sm">2</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Cole na area de texto</h3>
          <p className="text-xs text-slate-500">Acesse a pagina de Importacao e cole os dados. O sistema reconhece automaticamente o formato (CSV, tabulado ou colunas).</p>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
            <span className="text-brand-600 font-bold text-sm">3</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Confirme e importe</h3>
          <p className="text-xs text-slate-500">Revise a pre-visualizacao e clique em Importar. Peças existentes sao atualizadas, novas sao criadas automaticamente.</p>
        </div>
      </div>
    </div>
  );
}
