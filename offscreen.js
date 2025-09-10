// Offscreen audio player: receives PLAY_SOUND messages and plays a soft tone

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg?.type === 'PLAY_SOUND') {
    const { volume = 0.5, sound = 'ping1' } = msg.payload || {};
    try {
      await playTone(sound, volume);
    } catch (e) {
      // ignore
    }
  }
});

async function playTone(soundKey, volume) {
  const ctx = new (self.AudioContext || self.webkitAudioContext)();
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch (e) {}
  }
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);

  // Small envelope for a soft feel
  const dur = 0.7;
  const now = ctx.currentTime;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(1.0, now + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  env.connect(gain);

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const base = soundKey === 'ping2' ? 660 : soundKey === 'ping3' ? 520 : 600;
  osc1.frequency.value = base;
  osc2.frequency.value = base * 1.5;
  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc1.connect(env);
  osc2.connect(env);
  osc1.start(now);
  osc2.start(now + 0.02);
  osc1.stop(now + dur);
  osc2.stop(now + dur);

  // gentle bell second hit
  if (soundKey === 'ping2') {
    const osc3 = ctx.createOscillator();
    const env2 = ctx.createGain();
    env2.gain.setValueAtTime(0.0001, now + 0.25);
    env2.gain.exponentialRampToValueAtTime(0.8, now + 0.3);
    env2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    env2.connect(gain);
    osc3.type = 'sine';
    osc3.frequency.value = base * 1.25;
    osc3.connect(env2);
    osc3.start(now + 0.25);
    osc3.stop(now + 0.9);
  }
}


