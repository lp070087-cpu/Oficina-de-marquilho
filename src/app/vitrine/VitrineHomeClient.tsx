'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CardProdutoPremium from '@/components/vitrine/CardProdutoPremium';
import BuscaPremium from '@/components/vitrine/BuscaPremium';
import BannerCarrossel from '@/components/vitrine/BannerCarrossel';
import MarcasVitrine from '@/components/vitrine/MarcasVitrine';
import RodapePremium from '@/components/vitrine/RodapePremium';
import NewsletterVitrine from '@/components/vitrine/NewsletterVitrine';
import PromocoesVitrine from '@/components/vitrine/PromocoesVitrine';
import { getClienteVitrine } from '@/lib/vitrine-session';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function VitrineHomeClient({ destaques, ofertas, lancamentos, pecas, categorias, categoriasVitrine }: any) {
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [cliente, setCliente] = useState<any>(null);

  // FASE 15-H.1: Novas seções dinâmicas
  const [maisVendidos, setMaisVendidos] = useState<any[]>([]);
  const [recomendados, setRecomendados] = useState<any[]>([]);
  const [vistos, setVistos] = useState<any[]>([]);
  const [recentes, setRecentes] = useState<any[]>([]);

  useEffect(() => {
    const d = getClienteVitrine();
    if (d) {
      setCliente(d);
      // Carregar favoritos
      fetch('/api/vitrine/favoritos', { headers: { Authorization: `Bearer ${d.token}` } })
        .then(r => r.json()).then(data => setFavoritos(new Set(data.map((f: any) => f.pecaId))));
      // Carregar produtos vistos pelo cliente (com Bearer token do JWT)
      fetch('/api/vitrine/historico', { headers: { Authorization: `Bearer ${d.token}` } })
        .then(r => r.json()).then(data => setVistos(data.produtos || []));
    }
  }, []);

  useEffect(() => {
    fetch('/api/vitrine/mais-vendidos').then(r => r.json()).then(d => setMaisVendidos(d.produtos || []));
    // Recomendados baseados nos destaques
    if (destaques.length > 0) {
      fetch(`/api/vitrine/recomendados?pecaId=${destaques[0].id}`).then(r => r.json()).then(d => setRecomendados(d.produtos || []));
    }
  }, [destaques]);

  // Recém adicionados = últimos 8 da lista principal
  useEffect(() => {
    setRecentes(pecas.slice(-8).reverse());
  }, [pecas]);

  async function toggleFavorito(pecaId: string) {
    if (!cliente) return;
    await fetch('/api/vitrine/favoritos', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cliente.token}` },
      body: JSON.stringify({ pecaId }),
    });
    setFavoritos(prev => {
      const n = new Set(prev);
      n.has(pecaId) ? n.delete(pecaId) : n.add(pecaId);
      return n;
    });
  }

  // Item 1: menu/categorias 100% data-driven. `categoriasVitrine` vem do endpoint
  // /api/vitrine/categorias, que já filtra SÓ categorias com produtos visíveis
  // (ativo && quantidadeLoja>0 && precoVenda>0) e ordena CAPACETES→CAPAS→ACESSÓRIOS→A-Z.
  // Fallback (defensivo): deriva do payload de peças caso a prop venha vazia.
  const catsMenu = (categoriasVitrine && categoriasVitrine.length > 0)
    ? categoriasVitrine
    : categorias.filter((c: any) => pecas.some((p: any) => p.categoria.slug === c.slug));

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* HEADER PREMIUM */}
      <header className="bg-[#0D1117] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <a href="/vitrine" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/25">
                <span className="font-extrabold text-white text-sm">MP</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-extrabold text-sm leading-tight">Marquinho</p>
                <p className="text-[10px] text-slate-400 leading-tight">Moto Peças</p>
              </div>
            </a>

            <div className="flex-1 max-w-xl">
              <BuscaPremium />
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <a href={cliente ? '/vitrine/perfil' : '/vitrine/login'} className="flex flex-col items-center justify-center px-2.5 py-1 rounded-md hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span className="text-[10px] text-slate-400 mt-0.5">{cliente ? 'Perfil' : 'Entrar'}</span>
              </a>
              <a href="/vitrine/favoritos" className="flex flex-col items-center justify-center px-2.5 py-1 rounded-md hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span className="text-[10px] text-slate-400 mt-0.5">Favoritos</span>
              </a>
              <a href="/vitrine/carrinho" className="flex flex-col items-center justify-center px-2.5 py-1 rounded-md hover:bg-white/5 transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg>
                <span className="text-[10px] text-slate-400 mt-0.5">Carrinho</span>
              </a>
            </div>
          </div>
        </div>

        {/* Menu Categorias */}
        <div className="bg-brand-600">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center h-9 overflow-x-auto gap-0.5">
              {catsMenu.slice(0, 10).map((c: any) => (
                <a key={c.slug} href={`/vitrine/catalogo?categoria=${c.slug}`}
                  className="px-3 py-1.5 text-[11px] font-semibold text-white/90 hover:text-white hover:bg-brand-700 rounded-md transition-colors whitespace-nowrap">
                  {c.nome}
                </a>
              ))}
              <a href="/vitrine/marcas" className="px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white hover:bg-brand-700 rounded-md transition-colors whitespace-nowrap ml-2 border-l border-brand-500/30">
                Marcas
              </a>
              <a href="/vitrine/promocoes" className="px-3 py-1.5 text-[11px] font-extrabold text-yellow-300 hover:text-yellow-200 bg-brand-700/50 rounded-md transition-colors whitespace-nowrap ml-1">
                🔥 Promoções
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* BANNER CARROSSEL — data-driven (BannerCarrossel busca os banners ativos do /api/vitrine/banners) */}
      <BannerCarrossel />

      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-14">

        {/* Destaques */}
        {destaques.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-800">⭐ Produtos em Destaque</h2>
              <a href="/vitrine/catalogo" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Ver todos →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {destaques.map((p: any) => (
                <CardProdutoPremium key={p.id} p={p} onFavorito={toggleFavorito} favorited={favoritos.has(p.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Promoções com countdown */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-slate-800">🔥 Promoções</h2>
            <a href="/vitrine/promocoes" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Ver todas →</a>
          </div>
          <PromocoesVitrine />
        </section>

        {/* BANNER PNEUS */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-8 md:p-10 text-white flex items-center gap-8">
          <div className="flex-1">
            <span className="inline-block bg-brand-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3">Pneus para sua moto</span>
            <h2 className="text-2xl font-extrabold mb-2">Troque seus pneus com quem entende</h2>
            <p className="text-sm text-white/60 mb-4 max-w-md">Pneus Pirelli, Metzeler, Levorin e mais. Consultoria gratuita pelo WhatsApp.</p>
            <a href="/vitrine/catalogo?categoria=rodas-e-pneus" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-bold transition-colors">Ver Pneus</a>
          </div>
          <div className="hidden md:flex w-32 h-32 rounded-full border-4 border-white/10 items-center justify-center flex-shrink-0">
            <svg className="w-16 h-16 text-brand-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1}/><circle cx="12" cy="12" r="4" strokeWidth={1}/></svg>
          </div>
        </div>

        {/* Ofertas */}
        {ofertas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-slate-800">🏷️ Ofertas da Semana</h2>
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{ofertas.length} itens</span>
              </div>
              <a href="/vitrine/catalogo" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Ver todas →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ofertas.map((p: any) => (
                <CardProdutoPremium key={p.id} p={p} onFavorito={toggleFavorito} favorited={favoritos.has(p.id)} />
              ))}
            </div>
          </section>
        )}

        {/* FASE 15-H.1: Mais Vendidos */}
        {maisVendidos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-800">📈 Mais Vendidos</h2>
              <a href="/vitrine/catalogo" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Ver catálogo →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {maisVendidos.map((p: any) => (
                <CardProdutoPremium key={p.id} p={p} onFavorito={toggleFavorito} favorited={favoritos.has(p.id)} />
              ))}
            </div>
          </section>
        )}

        {/* FASE 15-H.1: Recomendados */}
        {recomendados.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-800">🎯 Recomendados para Você</h2>
              <a href="/vitrine/catalogo" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Ver mais →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recomendados.map((p: any) => (
                <CardProdutoPremium key={p.id} p={p} onFavorito={toggleFavorito} favorited={favoritos.has(p.id)} />
              ))}
            </div>
          </section>
        )}

        {/* FASE 15-H.1: Produtos Vistos Recentemente */}
        {vistos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-800">👁️ Vistos Recentemente</h2>
              <a href="/vitrine/perfil" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Meu perfil →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {vistos.map((p: any) => (
                <CardProdutoPremium key={p.id} p={p} onFavorito={toggleFavorito} favorited={favoritos.has(p.id)} />
              ))}
            </div>
          </section>
        )}

        {/* FASE 15-H.1: Recém Adicionados */}
        {recentes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-800">🆕 Novos Produtos</h2>
                <span className="bg-blue-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">Novo</span>
              </div>
              <a href="/vitrine/catalogo?ordem=mais_recentes" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Ver todos →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recentes.map((p: any) => (
                <CardProdutoPremium key={p.id} p={p} onFavorito={toggleFavorito} favorited={favoritos.has(p.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Categorias em Grid */}
        {catsMenu.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-slate-800 mb-5">📂 Categorias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {catsMenu.slice(0, 12).map((c: any) => {
                // Contagem real via endpoint de categorias (independe do take:200 de /api/vitrine).
                const count = c.totalProdutos ?? pecas.filter((p: any) => p.categoria.slug === c.slug).length;
                return (
                  <a key={c.slug} href={`/vitrine/catalogo?categoria=${c.slug}`}
                    className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:border-brand-300 hover:shadow-sm transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-brand-100 transition-colors">
                      <span className="text-brand-600 text-lg font-extrabold">{c.nome.charAt(0)}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 group-hover:text-brand-700 truncate">{c.nome}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{count} produtos</p>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* BANNER OFICINA */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 rounded-2xl p-8 md:p-10 text-white flex items-center gap-8">
          <div className="flex-1">
            <span className="inline-block bg-white/20 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3">Oficina Especializada</span>
            <h2 className="text-2xl font-extrabold mb-2">Manutenção especializada para sua moto</h2>
            <p className="text-sm text-white/70 mb-4 max-w-md">Mecânicos experientes, peças originais e garantia de serviço.</p>
          </div>
          <div className="hidden md:flex w-32 h-32 rounded-full border-4 border-white/10 items-center justify-center flex-shrink-0">
            <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
        </div>

        {/* Marcas */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-slate-800">🏭 Marcas</h2>
            <a href="/vitrine/marcas" className="text-sm text-brand-600 hover:text-brand-700 font-bold">Ver todas →</a>
          </div>
          <MarcasVitrine />
        </section>

        {/* RETIRE NA LOJA */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-10 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Retire na Loja</h2>
          <p className="text-sm text-white/70 mb-5 max-w-md mx-auto">
            Monte seu orçamento online e retire suas peças na loja. Atendimento rápido pelo WhatsApp.
          </p>
          <a href="/vitrine/carrinho" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 rounded-lg text-sm font-extrabold hover:bg-slate-50 transition-colors shadow-lg">
            Montar Orçamento
          </a>
        </div>
      </div>

      {/* NEWSLETTER */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <NewsletterVitrine />
      </div>

      {/* FOOTER PREMIUM */}
      <RodapePremium />

      {/* WHATSAPP FIXO */}
      <a href="https://wa.me/558198143879" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all hover:scale-110 z-50">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
      </a>
    </div>
  );
}
