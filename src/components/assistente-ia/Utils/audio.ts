let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    if (!_audioCtx || _audioCtx.state === 'closed') {
      _audioCtx = new AC();
    }
    return _audioCtx;
  } catch {
    return null;
  }
}

export function tocarBeepConfirmacao() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; const agora = ctx.currentTime;
    osc.frequency.setValueAtTime(800, agora); osc.frequency.setValueAtTime(0, agora + 0.1);
    gain.gain.setValueAtTime(0.15, agora); gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.1);
    osc.frequency.setValueAtTime(1000, agora + 0.12); osc.frequency.setValueAtTime(0, agora + 0.22);
    gain.gain.setValueAtTime(0.15, agora + 0.12); gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.22);
    osc.start(agora); osc.stop(agora + 0.3);
  } catch { /* silencioso */ }
}
