'use client';

import { useEffect, useState } from 'react';
import { DADOS_OFICINA } from '@/lib/empresa';
import LogoOficina from '@/components/LogoOficina';

export default function RodapePremium() {
  const ano = new Date().getFullYear();
  // Item 1: categorias do rodapé 100% data-driven (só categorias com produtos visíveis).
  const [catsFooter, setCatsFooter] = useState<{ slug: string; nome: string }[]>([]);

  useEffect(() => {
    fetch('/api/vitrine/categorias').then(r => r.json()).then((d: any[]) => {
      if (Array.isArray(d)) setCatsFooter(d.slice(0, 4).map(c => ({ slug: c.slug, nome: c.nome })));
    }).catch(() => {});
  }, []);

  // Sem fallback hardcoded: se a API ainda não carregou (ou estiver vazia), não
  // exibe categorias com slugs inventados (que gerariam links quebrados).
  const catsExibicao = catsFooter;

  return (
    <footer className="bg-slate-900 text-slate-400">
      {/* Faixa de vantagens */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: 'M5 13l4 4L19 7', title: 'Retirada Grátis', desc: 'Na loja, em até 2h' },
            { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Pronto em 2h', desc: 'Separação rápida' },
            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Compra Segura', desc: 'Dados protegidos' },
            { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', title: 'Suporte', desc: 'Atendimento via WhatsApp' },
          ].map((v, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={v.icon} /></svg>
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">{v.title}</p>
                <p className="text-[11px]">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LogoOficina className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center overflow-hidden" textClassName="font-extrabold text-white text-xs" />
              <span className="font-extrabold text-white text-sm">Marquinho<br/><span className="text-xs text-slate-400 font-normal">Moto Peças</span></span>
            </div>
            <p className="text-xs">{DADOS_OFICINA.institucional}</p>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Categorias</h4>
            <div className="space-y-1.5 text-xs">
              {catsExibicao.map(c => (
                <p key={c.slug}><a href={`/vitrine/catalogo?categoria=${c.slug}`} className="hover:text-white">{c.nome}</a></p>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Links Úteis</h4>
            <div className="space-y-1.5 text-xs">
              <p><a href="/vitrine/catalogo" className="hover:text-white">Catálogo</a></p>
              <p><a href="/vitrine/marcas" className="hover:text-white">Marcas</a></p>
              <p><a href="/vitrine/promocoes" className="hover:text-white">Promoções</a></p>
              <p><a href="/vitrine/favoritos" className="hover:text-white">Favoritos</a></p>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Atendimento</h4>
            <div className="space-y-1.5 text-xs">
              <a href={`https://wa.me/${DADOS_OFICINA.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white"><svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg> WhatsApp</a>
              <p>Seg-Sex: 8h às 18h</p>
              <p>Sáb: 8h às 13h</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Institucional</h4>
            <div className="space-y-1.5 text-xs">
              <p><a href="/vitrine" className="hover:text-white">Home</a></p>
              <p><a href="/vitrine/carrinho" className="hover:text-white">Meu Carrinho</a></p>
              <p><a href="/vitrine/login" className="hover:text-white">Minha Conta</a></p>
              <p><a href="/vitrine/checkout" className="hover:text-white">Checkout</a></p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>Marquinho Moto Peças &copy; {ano} — Todos os direitos reservados. CNPJ: 24.585.668/0001-06</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Aceitamos:</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">PIX</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">Cartão</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">Dinheiro</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
