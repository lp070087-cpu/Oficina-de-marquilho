import Link from 'next/link';
import VitrineProdutoCard from '@/components/vitrine/ProdutoCard';

interface Categoria { id: string; nome: string; slug: string; }
interface Peca {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number;
  quantidade: number; estoqueMinimo: number; destaque: boolean; oferta: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string };
}

async function getVitrineData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const [pecasRes, catsRes] = await Promise.all([
    fetch(`${baseUrl}/api/vitrine`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/categorias`, { cache: 'no-store' }),
  ]);
  return { pecas: (await pecasRes.json()) as Peca[], categorias: (await catsRes.json()) as Categoria[] };
}

const menuCategorias = [
  { label: 'Geral', href: '/vitrine' },
  { label: 'Acessorios', href: '/vitrine/categoria/acessorios' },
  { label: 'Capacetes', href: '/vitrine/categoria/acessorios', disabled: true },
  { label: 'Cuidados para Moto', href: '/vitrine/categoria/oleos-e-fluidos' },
  { label: 'Pecas para Motos', href: '/vitrine/categoria/motor' },
  { label: 'Pneus', href: '/vitrine/categoria/rodas-e-pneus' },
  { label: 'Vestuario', href: '/vitrine/categoria/acessorios', disabled: true },
  { label: 'Oleos', href: '/vitrine/categoria/oleos-e-fluidos' },
  { label: 'Ofertas', href: '/vitrine/categoria' },
  { label: 'Retire na Loja', href: '/vitrine/carrinho' },
];

export default async function VitrineHome() {
  const { pecas } = await getVitrineData();

  const motores = pecas.filter(p => p.categoria.slug === 'motor' && p.vitrine).slice(0, 4);
  const freios = pecas.filter(p => p.categoria.slug === 'freios' && p.vitrine).slice(0, 4);
  const pneus = pecas.filter(p => p.categoria.slug === 'rodas-e-pneus' && p.vitrine).slice(0, 4);
  const oleos = pecas.filter(p => p.categoria.slug === 'oleos-e-fluidos' && p.vitrine).slice(0, 4);
  const acessorios = pecas.filter(p => p.categoria.slug === 'acessorios' && p.vitrine).slice(0, 4);
  const eletrica = pecas.filter(p => p.categoria.slug === 'eletrica' && p.vitrine).slice(0, 4);
  const ofertas = pecas.filter(p => p.oferta && p.precoOferta && p.vitrine).slice(0, 8);
  const suspensao = pecas.filter(p => p.categoria.slug === 'suspensao' && p.vitrine).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* ============ HEADER ============ */}
      <header className="bg-[#0D1117] text-white sticky top-0 z-50">
        {/* Linha principal */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-6">
            {/* Logo */}
            <Link href="/vitrine" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/25">
                <span className="font-extrabold text-white text-sm">MP</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-extrabold text-sm leading-tight">Marquinho</p>
                <p className="text-[10px] text-slate-400 leading-tight">Moto Pecas</p>
              </div>
            </Link>

            {/* Busca */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  placeholder="O que voce busca?"
                  className="w-full bg-white/10 border border-white/10 rounded-md py-2.5 px-4 pl-11 text-sm text-white placeholder:text-slate-400 outline-none focus:bg-white/15 focus:border-white/20 transition-colors"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>

            {/* Icones login + carrinho */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link href="/vitrine/login" className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span className="text-[10px] text-slate-400 mt-0.5">Entrar</span>
              </Link>
              <Link href="/vitrine/carrinho" className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg>
                <span className="text-[10px] text-slate-400 mt-0.5">Carrinho</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============ MENU AZUL ============ */}
        <div className="bg-brand-600">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center h-10 overflow-x-auto gap-0.5">
              {menuCategorias.map(item => (
                item.disabled ? (
                  <span key={item.label}
                    className="px-3.5 py-2 text-xs font-semibold text-white/50 cursor-default whitespace-nowrap select-none"
                  >{item.label}</span>
                ) : (
                  <Link key={item.label} href={item.href}
                    className="px-3.5 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-brand-700 rounded-md transition-colors whitespace-nowrap"
                  >{item.label}</Link>
                )
              ))}
              <div className="flex-1" />
              {/* Pill Ofertas da Semana */}
              <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 bg-gold-500 text-[#5c3a0a] rounded-md text-[11px] font-extrabold uppercase tracking-wider ml-2 whitespace-nowrap shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Ofertas da Semana
              </span>
              {/* Botao Consorcio */}
              <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/60 rounded-md text-[11px] font-semibold ml-2 whitespace-nowrap cursor-default select-none">
                Consorcio / Parceiros
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ============ BANNER PRINCIPAL ============ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 flex items-center gap-10">
          <div className="flex-1">
            <span className="inline-block bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              Pecas para sua moto
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight">
              Tudo para sua moto<br/>com precos de atacado
            </h1>
            <p className="text-base text-white/60 mb-6 max-w-lg">
              Monte seu orcamento online e retire na loja. Mais de 200 pecas em estoque com os melhores precos.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/vitrine/carrinho" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-extrabold text-sm transition-colors shadow-lg shadow-brand-600/30">
                Montar Orcamento
              </Link>
              <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-md font-bold text-sm transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                Chamar WhatsApp
              </a>
            </div>
          </div>
          <div className="hidden lg:block flex-shrink-0">
            <div className="w-60 h-60 rounded-full bg-gradient-to-br from-brand-600/30 to-transparent flex items-center justify-center border-4 border-white/5">
              <span className="text-6xl font-extrabold text-brand-500/40">MP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CONTEUDO PRINCIPAL ============ */}
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-14">

        {/* ---------- CAPACETES EM DESTAQUE ---------- */}
        {acessorios.length > 0 && (
          <Section title="Capacetes em destaque" href="/vitrine/categoria/acessorios">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {acessorios.map(p => <VitrineProdutoCard key={p.id} p={p} />)}
            </div>
          </Section>
        )}

        {/* ---------- PECAS PARA MOTOS ---------- */}
        {motores.length > 0 && (
          <Section title="Pecas para Motos" href="/vitrine/categoria/motor">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {motores.map(p => <VitrineProdutoCard key={p.id} p={p} />)}
            </div>
          </Section>
        )}

        {/* ---------- BANNER PNEUS ---------- */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 md:p-10 text-white flex items-center gap-8">
          <div className="flex-1">
            <span className="inline-block bg-brand-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Pneus para sua moto
            </span>
            <h2 className="text-2xl font-extrabold mb-2">Troque seus pneus com quem entende</h2>
            <p className="text-sm text-white/60 mb-4 max-w-md">Pneus Pirelli, Metzeler, Levorin e mais. Consultoria gratuita pelo WhatsApp.</p>
            <Link href="/vitrine/categoria/rodas-e-pneus" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-sm font-bold transition-colors">
              Ver Pneus
            </Link>
          </div>
          <div className="hidden md:block w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-16 h-16 text-brand-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1}/><circle cx="12" cy="12" r="4" strokeWidth={1}/></svg>
          </div>
        </div>

        {/* ---------- PNEUS PARA SUA MOTO ---------- */}
        {pneus.length > 0 && (
          <Section title="Pneus para sua Moto" href="/vitrine/categoria/rodas-e-pneus">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pneus.map(p => <VitrineProdutoCard key={p.id} p={p} />)}
            </div>
          </Section>
        )}

        {/* ---------- OLEOS E FLUIDOS ---------- */}
        {oleos.length > 0 && (
          <Section title="Oleos e Fluidos" href="/vitrine/categoria/oleos-e-fluidos">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {oleos.map(p => <VitrineProdutoCard key={p.id} p={p} />)}
            </div>
          </Section>
        )}

        {/* ---------- SISTEMA DE FREIOS ---------- */}
        {freios.length > 0 && (
          <Section title="Sistema de Freios" href="/vitrine/categoria/freios">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {freios.map(p => <VitrineProdutoCard key={p.id} p={p} />)}
            </div>
          </Section>
        )}

        {/* ---------- ELETRICA E SUSPENSAO ---------- */}
        <div className="grid grid-cols-2 gap-4">
          {eletrica.length > 0 && (
            <Section title="Eletrica e Ignicao" href="/vitrine/categoria/eletrica" compact>
              <div className="grid grid-cols-2 gap-3">
                {eletrica.slice(0, 2).map(p => <VitrineProdutoCard key={p.id} p={p} />)}
              </div>
            </Section>
          )}
          {suspensao.length > 0 && (
            <Section title="Suspensao" href="/vitrine/categoria/suspensao" compact>
              <div className="grid grid-cols-2 gap-3">
                {suspensao.slice(0, 2).map(p => <VitrineProdutoCard key={p.id} p={p} />)}
              </div>
            </Section>
          )}
        </div>

        {/* ---------- OFERTAS DA SEMANA ---------- */}
        {ofertas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold text-slate-800">Ofertas da Semana</h2>
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {ofertas.length} itens
                </span>
              </div>
              <Link href="/vitrine/categoria" className="text-xs text-brand-600 hover:text-brand-700 font-bold">
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ofertas.map(p => <VitrineProdutoCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {/* ---------- ACESSORIOS MAIS VENDIDOS ---------- */}
        {acessorios.length > 0 && (
          <Section title="Acessorios Mais Vendidos" href="/vitrine/categoria/acessorios">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...acessorios].reverse().map(p => <VitrineProdutoCard key={p.id} p={p} />)}
            </div>
          </Section>
        )}

        {/* ---------- RETIRE NA LOJA ---------- */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl p-10 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Retire na Loja</h2>
          <p className="text-sm text-white/70 mb-5 max-w-md mx-auto">
            Monte seu orcamento online e retire suas pecas na loja. Atendimento rapido pelo WhatsApp.
          </p>
          <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 rounded-md text-sm font-extrabold hover:bg-slate-50 transition-colors shadow-lg">
            Falar no WhatsApp
          </a>
        </div>
      </div>

      {/* ============ WHATSAPP FIXO ============ */}
      <a href="#" className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all hover:scale-110 z-50">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
      </a>

      {/* ============ FOOTER ============ */}
      <footer className="bg-slate-900 text-slate-400 mt-10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
                  <span className="font-extrabold text-white text-xs">MP</span>
                </div>
                <span className="font-extrabold text-white text-sm">
                  Marquinho<br/>
                  <span className="text-xs text-slate-400 font-normal">Moto Pecas</span>
                </span>
              </div>
              <p className="text-xs">Atacado &amp; Varejo de pecas para motos.</p>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Categorias</h4>
              <div className="space-y-1.5 text-xs">
                <p><Link href="/vitrine/categoria/motor" className="hover:text-white transition-colors">Motor</Link></p>
                <p><Link href="/vitrine/categoria/freios" className="hover:text-white transition-colors">Freios</Link></p>
                <p><Link href="/vitrine/categoria/rodas-e-pneus" className="hover:text-white transition-colors">Pneus</Link></p>
                <p><Link href="/vitrine/categoria/acessorios" className="hover:text-white transition-colors">Acessorios</Link></p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Atendimento</h4>
              <div className="space-y-1.5 text-xs">
                <p className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg> WhatsApp</p>
                <p>Seg-Sex: 8h as 18h</p>
                <p>Sab: 8h as 13h</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Institucional</h4>
              <div className="space-y-1.5 text-xs">
                <p><Link href="/vitrine" className="hover:text-white transition-colors">Home</Link></p>
                <p><Link href="/vitrine/carrinho" className="hover:text-white transition-colors">Orcamento</Link></p>
                <p><Link href="/vitrine/login" className="hover:text-white transition-colors">Minha Conta</Link></p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-6 text-center text-xs">
            <p>Marquinho Moto Pecas &copy; {new Date().getFullYear()} &mdash; Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, href, children, compact }: { title: string; href: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? '' : undefined}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">{title}</h2>
        <Link href={href} className="text-xs text-brand-600 hover:text-brand-700 font-bold">Ver todos</Link>
      </div>
      {children}
    </div>
  );
}
