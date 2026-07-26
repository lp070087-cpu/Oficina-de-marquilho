'use client';

import { useState, useEffect, useRef } from 'react';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);
  const detectorRef = useRef<any>(null);

  useEffect(() => {
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
        setScanning(true);
      } catch {
        setError('Permissao da camera negada ou camera indisponivel.');
      }
    }
    start();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!scanning) return;
    intervalRef.current = setInterval(() => {
      scanFrame();
    }, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [scanning]);

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try the BarcodeDetector API (reuse instance)
    if ('BarcodeDetector' in window) {
      try {
        if (!detectorRef.current) {
          detectorRef.current = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'codabar', 'itf'] });
        }
        detectorRef.current.detect(canvas).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            setScanning(false);
            onDetected(barcodes[0].rawValue);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          }
        }).catch(() => {});
      } catch {
        // BarcodeDetector not supported on this browser
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="p-4 flex items-center justify-between bg-black/80">
        <span className="text-white text-sm font-bold">Escaneie o codigo de barras</span>
        <button onClick={onClose} className="text-white text-sm bg-red-600 px-4 py-1.5 rounded font-bold">Fechar</button>
      </div>
      {error ? (
        <div className="flex-1 flex items-center justify-center text-white p-4 text-center">
          <p>{error}</p>
        </div>
      ) : (
        <div className="flex-1 relative">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="hidden" />
          {/* Linha de scan */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[10%] right-[10%] top-1/2 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]" />
            <div className="absolute left-[10%] right-[10%] top-[calc(50%-40px)] h-[80px] border-2 border-white/40 rounded-lg" />
            <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs">Posicione o codigo de barras na area central</p>
          </div>
        </div>
      )}
    </div>
  );
}
