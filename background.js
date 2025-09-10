// Background service worker: manages session timing and triggers audio via offscreen

const OFFSCREEN_URL = 'offscreen.html';

async function ensureOffscreen() {
  const has = await chrome.offscreen.hasDocument?.().catch(() => false);
  if (has) return;
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play nudge sounds periodically.'
    });
  } catch (e) {
    // no-op if already exists
  }
}

async function startSession({ task, durationMin, frequencyMin, volume }) {
  const start = Date.now();
  const end = start + durationMin * 60 * 1000;
  await chrome.storage.local.set({ active: true, paused: false, task, start, end, frequencyMin, volume });
  await ensureOffscreen();

  // Clear existing alarms and create new
  await chrome.alarms.clearAll();
  chrome.alarms.create('nudge', { delayInMinutes: frequencyMin, periodInMinutes: frequencyMin });
  chrome.alarms.create('session-end', { when: end });
  // Immediately notify popup with accurate state
  chrome.runtime.sendMessage({ type: 'SESSION_STATE', active: true }).catch(() => {});
}

async function stopSession() {
  await chrome.storage.local.set({ active: false });
  await chrome.alarms.clearAll();
  chrome.runtime.sendMessage({ type: 'SESSION_STATE', active: false }).catch(() => {});
}

function notifyPopupState() {}

chrome.runtime.onMessage.addListener((msg, _sender, _send) => {
  if (msg?.type === 'START_SESSION') startSession(msg.payload);
  if (msg?.type === 'STOP_SESSION') stopSession();
  if (msg?.type === 'PREVIEW_SOUND') playNudge({ preview: true, sound: msg.payload?.sound });
  if (msg?.type === 'TOGGLE_PAUSE') togglePause();
  if (msg?.type === 'UPDATE_SESSION') refreshAlarmsFromStorage();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'nudge') {
    const { active, paused } = await chrome.storage.local.get(['active','paused']);
    if (active && !paused) {
      playNudge({});
    }
  } else if (alarm.name === 'session-end') {
    stopSession();
  }
});

async function playNudge({ preview = false, sound }) {
  const data = await chrome.storage.local.get({ volume: 0.5, sound: sound || 'ping1' });
  await ensureOffscreen();
  chrome.runtime.sendMessage({ type: 'PLAY_SOUND', payload: { volume: data.volume, sound: data.sound, preview } }).catch(() => {});
}

async function togglePause() {
  const { paused = false } = await chrome.storage.local.get({ paused: false });
  const newPaused = !paused;
  await chrome.storage.local.set({ paused: newPaused });
  if (newPaused) {
    await chrome.alarms.clear('nudge');
  } else {
    await refreshAlarmsFromStorage();
  }
}

async function refreshAlarmsFromStorage() {
  const { active, start, end, frequencyMin, paused } = await chrome.storage.local.get(['active','start','end','frequencyMin','paused']);
  if (!active) return;
  await chrome.alarms.clear('nudge');
  if (!paused) {
    chrome.alarms.create('nudge', { delayInMinutes: frequencyMin, periodInMinutes: frequencyMin });
  }
  // keep session-end aligned
  await chrome.alarms.clear('session-end');
  if (end) chrome.alarms.create('session-end', { when: end });
}


