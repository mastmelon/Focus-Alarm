// Background service worker: manages session timing and triggers audio via offscreen

const OFFSCREEN_URL = 'offscreen.html';

async function ensureOffscreen() {
  const has = await chrome.offscreen.hasDocument?.({ reasons: ['AUDIO_PLAYBACK'], justification: 'Play nudge sounds periodically.' }).catch(() => false);
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
  await chrome.storage.local.set({ active: true, task, start, end, frequencyMin, volume });
  await ensureOffscreen();

  // Clear existing alarms and create new
  await chrome.alarms.clearAll();
  chrome.alarms.create('nudge', { delayInMinutes: frequencyMin, periodInMinutes: frequencyMin });
  chrome.alarms.create('session-end', { when: end });
  notifyPopupState();
}

async function stopSession() {
  await chrome.storage.local.set({ active: false });
  await chrome.alarms.clearAll();
  notifyPopupState();
}

function notifyPopupState() {
  chrome.runtime.sendMessage({ type: 'SESSION_STATE', active: true }).catch(() => {});
  chrome.storage.local.get('active').then(({ active }) => {
    chrome.runtime.sendMessage({ type: 'SESSION_STATE', active: Boolean(active) }).catch(() => {});
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, _send) => {
  if (msg?.type === 'START_SESSION') startSession(msg.payload);
  if (msg?.type === 'STOP_SESSION') stopSession();
  if (msg?.type === 'PREVIEW_SOUND') playNudge({ preview: true, sound: msg.payload?.sound });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'nudge') {
    playNudge({});
  } else if (alarm.name === 'session-end') {
    stopSession();
  }
});

async function playNudge({ preview = false, sound }) {
  const data = await chrome.storage.local.get({ volume: 0.5, sound: sound || 'ping1' });
  await ensureOffscreen();
  chrome.runtime.sendMessage({ type: 'PLAY_SOUND', payload: { volume: data.volume, sound: data.sound, preview } }).catch(() => {});
}


