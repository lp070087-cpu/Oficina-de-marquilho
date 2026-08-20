'use client';

import { useEffect, useState } from 'react';

interface LogoOficinaProps {
  /** Container completo: display, tamanho, arredondamento e cor de fundo. */
  className?: string;
  /** Classes adicionais para a <img> (ex.: padding). A imagem já vem com w-full h-full object-contain. */
  imgClassName?: string;
  /** Classes do texto "MP" do fallback (cor, tamanho, peso). */
  textClassName?: string;
  alt?: string;
}

let promiseLogo: Promise<string | null> | null = null;

function buscarLogo(): Promise<string | null> {
  if (!promiseLogo) {
    promiseLogo = fetch('/api/vitrine/logo')
      .then(r => (r.ok ? r.json() : { logoUrl: null }))
      .then(d => {
        const u = d?.logoUrl;
        return u && typeof u === 'string' && u.trim() ? u.trim() : null;
      })
      .catch(() => null);
  }
  return promiseLogo;
}

/** Invalida o cache compartilhado (após a DONA salvar/remover a logo). */
export function invalidarCacheLogo() {
  promiseLogo = null;
}

/**
 * Logo real da oficina com fallback "MP".
 * - Com logo cadastrada  -> exibe a imagem (object-contain, sem distorcer).
 * - Sem logo / URL inválida -> exibe o monograma "MP".
 * Fonte única: /api/vitrine/logo (ConfiguracaoVitrine chave 'logoOficina').
 */
export default function LogoOficina({
  className = '',
  imgClassName = '',
  textClassName = '',
  alt = 'Marquinho Moto Peças',
}: LogoOficinaProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarLogo().then(u => {
      if (!ativo) return;
      setLogoUrl(u);
      setPronto(true);
    });
    return () => { ativo = false; };
  }, []);

  // Enquanto carrega (ou sem logo), exibe o fallback MP.
  if (!pronto || !logoUrl) {
    return (
      <span className={className}>
        <span className={textClassName}>MP</span>
      </span>
    );
  }

  return (
    <span className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={alt}
        onError={() => setLogoUrl(null)}
        className={`w-full h-full object-contain ${imgClassName}`}
      />
    </span>
  );
}
