'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { boasVindas, escolherMensagem, periodoEmRecife } from './boas-vindas';
import styles from './AberturaDona.module.css';

const DadosProntos = createContext<(() => void) | null>(null);
const CHAVE_MENSAGEM = 'marquinho-dona-ultima-mensagem';
let mensagemNestaAba: string | null = null;
let aberturaConcluida = false;

const icones = {
  manha: 'M12 4V2m0 20v-2M4 12H2m20 0h-2M6.3 6.3 5 5m14 14-1.3-1.3m0-11.4L19 5M5 19l1.3-1.3M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  tarde: 'M3 18h18M6 21h12M7 15a5 5 0 0 1 10 0M12 7V4M5 10 3 8m16 2 2-2',
  noite: 'M20 15.2A7.8 7.8 0 0 1 8.8 4 8.3 8.3 0 1 0 20 15.2ZM17 3v4m-2-2h4m1 3v3m-1.5-1.5h3',
};

export function SinalizarDadosProntos() {
  const sinalizar = useContext(DadosProntos);
  useEffect(() => { sinalizar?.(); }, [sinalizar]);
  return null;
}

export default function AberturaDona({ children }: { children: ReactNode }) {
  const [fase, setFase] = useState<'carregando' | 'saudacao' | 'saindo' | 'encerrada'>(() => aberturaConcluida ? 'encerrada' : 'carregando');
  const [dadosProntos, setDadosProntos] = useState(false);
  const [tempoMinimo, setTempoMinimo] = useState(false);
  const [saudacao, setSaudacao] = useState<{ periodo: keyof typeof boasVindas; mensagem: string } | null>(null);

  useEffect(() => {
    if (aberturaConcluida) {
      setFase('encerrada');
      return;
    }

    const periodo = periodoEmRecife();
    let anterior = mensagemNestaAba;
    try { anterior = localStorage.getItem(CHAVE_MENSAGEM) ?? anterior; } catch { /* armazenamento indisponível */ }
    const mensagem = escolherMensagem(boasVindas[periodo].mensagens, anterior);
    mensagemNestaAba = mensagem;
    try { localStorage.setItem(CHAVE_MENSAGEM, mensagem); } catch { /* usa a memória da aba */ }
    setSaudacao({ periodo, mensagem });

    const timer = window.setTimeout(() => setTempoMinimo(true), 1550);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!dadosProntos || !tempoMinimo || !saudacao) return;
    setFase('saudacao');
    const saida = window.setTimeout(() => setFase('saindo'), 2050);
    const fim = window.setTimeout(() => {
      aberturaConcluida = true;
      setFase('encerrada');
    }, 2450);
    return () => {
      window.clearTimeout(saida);
      window.clearTimeout(fim);
    };
  }, [dadosProntos, tempoMinimo, saudacao]);

  const marcarPronto = useCallback(() => setDadosProntos(true), []);

  const ativa = fase !== 'encerrada';
  const mostrandoMensagem = saudacao && (fase === 'saudacao' || fase === 'saindo');

  return (
    <>
      <div className={styles.painel} inert={ativa}>
        <DadosProntos.Provider value={marcarPronto}>{children}</DadosProntos.Provider>
      </div>
      {ativa && (
        <div className={styles.abertura} data-fase={fase} role="status" aria-live="polite">
          <div className={styles.fundo} aria-hidden="true" />
          <div className={styles.conteudo}>
            {/* Asset oficial, com as cores ajustadas localmente para a abertura. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.logo} src="/dono/abertura-logo.webp" alt="Marquinho Moto Peças" width={560} height={280} fetchPriority="high" />
            <div className={styles.etapa}>
              {mostrandoMensagem ? (
                <div className={styles.mensagem}>
                  <svg className={styles.confirmacao} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" />
                  </svg>
                  <svg className={styles.periodo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={icones[saudacao.periodo]} />
                  </svg>
                  <p className={styles.saudacao}>{boasVindas[saudacao.periodo].saudacao}</p>
                  <p className={styles.frase}>{saudacao.mensagem}</p>
                </div>
              ) : (
                <div className={styles.carregando}>
                  <span className={styles.indicador} aria-hidden="true" />
                  <p>Preparando seu ambiente...</p>
                </div>
              )}
            </div>
            <div className={styles.barras} aria-hidden="true"><span /><span /><span /></div>
          </div>
        </div>
      )}
    </>
  );
}
