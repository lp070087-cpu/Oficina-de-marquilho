'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type ScannerModo = 'camera' | 'usb' | 'manual';
type ScannerOrigem = 'usb' | 'bluetooth' | 'camera' | 'manual';

interface ScannerUniversalProps {
  onDetected: (code: string, origem: ScannerOrigem) => void;
  onClose?: () => void;
  mostrarModos?: ScannerModo[];
}

export default function ScannerUniversal({ onDetected, onClose, mostrarModos }: ScannerUniversalProps) {
  const modos = mostrarModos || ['camera', 'usb', 'manual'];
  const [modoAtivo, setModoAtivo] = useState<ScannerModo>(modos[0]);

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);
  const detectorRef = useRef<any>(null);
  const [cameraError, setCameraError] = useState('');

  // USB wedge
  const usbInputRef = useRef<HTMLInputElement>(null);
  const usbBufferRef = useRef<string>('');
  const usbTimerRef = useRef<any>(null);
  const [usbDetectado, setUsbDetectado] = useState(false);

  // Manual
  const [manualCode, setManualCode] = useState('');

  // ============================================================
  // CAMERA
  // ============================================================
  useEffect(() => {
    if (modoAtivo !== 'camera') return;

    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
        });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch {
        setCameraError('Permissao da camera negada ou camera indisponivel.');
      }
    }
    start();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [modoAtivo]);

  useEffect(() => {
    if (modoAtivo !== 'camera') return;
    intervalRef.current = setInterval(() => scanFrame(), 800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [modoAtivo]);

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if ('BarcodeDetector' in window) {
      try {
        if (!detectorRef.current) {
          detectorRef.current = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'codabar', 'itf', 'qr_code', 'data_matrix'],
          });
        }
        detectorRef.current
          .detect(canvas)
          .then((barcodes: any[]) => {
            if (barcodes.length > 0) {
              if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
              onDetected(barcodes[0].rawValue, 'camera');
            }
          })
          .catch(() => {});
      } catch {
        // BarcodeDetector not supported
      }
    }
  }

  // ============================================================
  // USB WEDGE — Detecta entrada rápida de teclado (leitor USB)
  // ============================================================
  const handleUsbKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (modoAtivo !== 'usb') return;

      // Ignorar teclas de controle
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta')
        return;

      if (e.key === 'Enter') {
        e.preventDefault();
        const code = usbBufferRef.current.trim();
        if (code.length >= 8) {
          // Código de barras típico tem 8+ caracteres
          setUsbDetectado(true);
          setTimeout(() => {
            onDetected(code, 'usb');
            usbBufferRef.current = '';
            setUsbDetectado(false);
          }, 300);
        }
        usbBufferRef.current = '';
        return;
      }

      // Resetar buffer se demorar muito entre teclas (digitação manual lenta)
      if (usbTimerRef.current) clearTimeout(usbTimerRef.current);

      usbBufferRef.current += e.key;
      usbTimerRef.current = setTimeout(() => {
        // Se passou 100ms sem nova tecla, não é um scanner (é digitação manual)
        usbBufferRef.current = '';
      }, 100);
    },
    [modoAtivo, onDetected]
  );

  useEffect(() => {
    if (modoAtivo === 'usb') {
      window.addEventListener('keydown', handleUsbKeyDown);
      // Focar input invisível para capturar teclas
      usbInputRef.current?.focus();
      return () => {
        window.removeEventListener('keydown', handleUsbKeyDown);
        if (usbTimerRef.current) clearTimeout(usbTimerRef.current);
      };
    }
  }, [modoAtivo, handleUsbKeyDown]);

  // ============================================================
  // MANUAL
  // ============================================================
  function handleManualSubmit() {
    const code = manualCode.trim();
    if (code.length >= 3) {
      onDetected(code, 'manual');
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-black/80 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-bold">Scanner Universal</span>
          {modos.length > 1 && (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
              {modos.map((m) => (
                <button
                  key={m}
                  onClick={() => setModoAtivo(m)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                    modoAtivo === m
                      ? 'bg-brand-600 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {m === 'camera' ? '📷 Camera' : m === 'usb' ? '🔌 USB/Bluetooth' : '⌨️ Manual'}
                </button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white text-sm bg-red-600 px-4 py-1.5 rounded font-bold hover:bg-red-700 transition-colors"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* CAMERA MODE */}
        {modoAtivo === 'camera' && (
          <>
            {cameraError ? (
              <div className="text-white text-center p-4">
                <p className="text-red-400 mb-2">{cameraError}</p>
                <p className="text-sm text-white/60">
                  Tente usar o modo USB ou Manual como alternativa.
                </p>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan guide */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-[15%] right-[15%] top-1/2 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]" />
                  <div className="absolute left-[15%] right-[15%] top-[calc(50%-60px)] h-[120px] border-2 border-white/40 rounded-xl" />
                  <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/60 text-xs">
                    Posicione o codigo de barras na area central
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* USB MODE */}
        {modoAtivo === 'usb' && (
          <div className="flex flex-col items-center justify-center text-white p-8 text-center">
            <div
              className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-6 transition-all duration-300 ${
                usbDetectado
                  ? 'border-emerald-400 bg-emerald-500/20 scale-110'
                  : 'border-white/20 bg-white/5 animate-pulse'
              }`}
            >
              <svg
                className={`w-16 h-16 transition-colors ${
                  usbDetectado ? 'text-emerald-400' : 'text-white/40'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">
              {usbDetectado ? 'Codigo detectado!' : 'Aguardando scanner...'}
            </h3>
            <p className="text-sm text-white/60 max-w-md">
              {usbDetectado
                ? 'Processando leitura do codigo de barras...'
                : 'Escaneie um codigo de barras com o leitor USB ou Bluetooth. O sistema detecta automaticamente.'}
            </p>
            {/* Input invisível para capturar foco */}
            <input
              ref={usbInputRef}
              type="text"
              className="absolute opacity-0 w-0 h-0"
              autoFocus
              onBlur={() => usbInputRef.current?.focus()}
            />
          </div>
        )}

        {/* MANUAL MODE */}
        {modoAtivo === 'manual' && (
          <div className="flex flex-col items-center justify-center text-white p-8 text-center w-full max-w-md">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Digite o codigo</h3>
            <p className="text-sm text-white/60 mb-6">
              Insira manualmente o codigo de barras, SKU ou codigo interno do produto.
            </p>
            <div className="flex gap-2 w-full">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                }}
                placeholder="Codigo de barras ou SKU..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm outline-none focus:border-brand-400 transition-colors"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                disabled={manualCode.trim().length < 3}
                className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Buscar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
