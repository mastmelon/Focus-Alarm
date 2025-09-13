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

  // Sound generation based on type
  let base, osc1, osc2, osc3;
  
  switch(soundKey) {
    case 'ping1': // Soft Ping
      base = 600;
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc2.frequency.value = base * 1.5;
      osc1.type = 'sine';
      osc2.type = 'triangle';
      break;
      
    case 'ping2': // Gentle Bell
      base = 660;
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc2.frequency.value = base * 1.5;
      osc1.type = 'sine';
      osc2.type = 'triangle';
      break;
      
    case 'ping3': // Calm Chime
      base = 520;
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc2.frequency.value = base * 1.5;
      osc1.type = 'sine';
      osc2.type = 'triangle';
      break;
      
    case 'ping4': // Digital Beep
      base = 800;
      osc1 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc1.type = 'square';
      osc2 = null;
      break;
      
    case 'ping5': // Wooden Click
      base = 200;
      osc1 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc1.type = 'sawtooth';
      osc2 = null;
      break;
      
    case 'ping6': // Crystal Tone
      base = 880;
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc2.frequency.value = base * 1.25;
      osc1.type = 'sine';
      osc2.type = 'sine';
      break;
      
    case 'ping7': // Warm Bell
      base = 440;
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc2.frequency.value = base * 1.5;
      osc1.type = 'sine';
      osc2.type = 'sine';
      break;
      
    case 'ping8': // Zen Gong
      base = 110;
      osc1 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc1.type = 'sine';
      osc2 = null;
      break;
      
    default:
      base = 600;
      osc1 = ctx.createOscillator();
      osc2 = ctx.createOscillator();
      osc1.frequency.value = base;
      osc2.frequency.value = base * 1.5;
      osc1.type = 'sine';
      osc2.type = 'triangle';
  }

  // Connect and play oscillators
  osc1.connect(env);
  osc1.start(now);
  osc1.stop(now + dur);
  
  if (osc2) {
    osc2.connect(env);
    osc2.start(now + 0.02);
    osc2.stop(now + dur);
  }

  // Special effects for certain sounds
  if (soundKey === 'ping2') { // Gentle Bell - second hit
    osc3 = ctx.createOscillator();
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
  
  if (soundKey === 'ping8') { // Zen Gong - longer decay
    const longerEnv = ctx.createGain();
    longerEnv.gain.setValueAtTime(0.0001, now);
    longerEnv.gain.exponentialRampToValueAtTime(1.0, now + 0.1);
    longerEnv.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    longerEnv.connect(gain);
    osc1.disconnect(env);
    osc1.connect(longerEnv);
  }
}


