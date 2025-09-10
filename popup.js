const els = {
  task: document.getElementById('taskInput'),
  duration: document.getElementById('durationInput'),
  frequency: document.getElementById('frequencyInput'),
  volume: document.getElementById('volumeRange'),
  start: document.getElementById('startBtn'),
  settings: document.getElementById('settingsBtn'),
  activeView: document.getElementById('activeView'),
  volumeActive: document.getElementById('volumeRangeActive'),
  remaining: document.getElementById('remaining'),
  progressFill: document.getElementById('progressFill'),
  pillTask: document.getElementById('pillTask'),
  pillFreq: document.getElementById('pillFreq'),
  pauseBtn: document.getElementById('pauseBtn'),
  endBtn: document.getElementById('endBtn'),
  sessionSection: document.getElementById('sessionSection'),
};

const storage = chrome.storage.local;

async function restore() {
  const data = await storage.get({
    task: '',
    durationMin: 45,
    frequencyMin: 5,
    volume: 0.5,
    active: false,
    paused: false,
    start: 0,
    end: 0,
  });
  els.task.value = data.task;
  els.duration.value = data.durationMin;
  els.frequency.value = data.frequencyMin;
  els.volume.value = data.volume;
  els.volumeActive.value = data.volume;
  updateStartButton(data.active);
  setActiveView(data.active, data);
}

function updateStartButton(active) {
  els.start.textContent = active ? 'Stop' : 'Start Focus';
}

function setActiveView(active, data) {
  els.activeView.classList.toggle('hidden', !active);
  document.getElementById('volumeSection').classList.toggle('hidden', active);
  els.start.style.display = active ? 'none' : 'block';
  els.sessionSection.classList.toggle('hidden', active);
  if (active && data) {
    els.pillTask.textContent = data.task || 'Focus session';
    els.pillFreq.textContent = `Every ${data.frequencyMin} min`;
    tickTimer(data);
  }
}

function tickTimer(data) {
  const update = () => {
    chrome.storage.local.get(['start','end','paused']).then(({ start, end, paused }) => {
      if (!start || !end) return;
      const now = Date.now();
      const remainingMs = Math.max(0, end - now);
      const totalMs = end - start;
      const mm = Math.floor(remainingMs / 60000).toString().padStart(2,'0');
      const ss = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2,'0');
      els.remaining.textContent = `${mm}:${ss}` + (paused ? ' ⏸' : '');
      const pct = Math.max(0, Math.min(100, 100 - (remainingMs / totalMs) * 100));
      els.progressFill.style.width = `${pct}%`;
    });
  };
  update();
  if (window.__timer) clearInterval(window.__timer);
  window.__timer = setInterval(update, 1000);
}

els.settings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

els.start.addEventListener('click', async () => {
  const task = els.task.value.trim();
  const durationMin = Number(els.duration.value) || 1;
  const frequencyMin = Number(els.frequency.value) || 1;
  const volume = Number(els.volume.value);

  const { active = false } = await storage.get({ active: false });
  if (active) {
    chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
  } else {
    // Prevent double clicks while initializing
    els.start.disabled = true;
    await storage.set({ task, durationMin, frequencyMin, volume });
    // Optimistically switch UI while background spins up
    const start = Date.now();
    const end = start + durationMin * 60 * 1000;
    updateStartButton(true);
    setActiveView(true, { task, frequencyMin, durationMin, start, end });
    chrome.runtime.sendMessage({
      type: 'START_SESSION',
      payload: { task, durationMin, frequencyMin, volume },
    });
    setTimeout(() => { els.start.disabled = false; }, 800);
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'SESSION_STATE') {
    updateStartButton(Boolean(msg.active));
    if (msg.active)
      chrome.storage.local.get().then(set => setActiveView(true, set));
    else setActiveView(false);
  }
});

// live changes
els.volume.addEventListener('input', e => storage.set({ volume: Number(e.target.value) }));
els.volumeActive.addEventListener('input', e => storage.set({ volume: Number(e.target.value) }));
els.volume.addEventListener('change', () => chrome.runtime.sendMessage({ type: 'PREVIEW_SOUND' }));
els.volumeActive.addEventListener('change', () => chrome.runtime.sendMessage({ type: 'PREVIEW_SOUND' }));
els.duration.addEventListener('change', e => {
  storage.set({ durationMin: Number(e.target.value) || 1 });
  chrome.runtime.sendMessage({ type: 'UPDATE_SESSION' });
});
els.frequency.addEventListener('change', e => {
  storage.set({ frequencyMin: Number(e.target.value) || 1 });
  chrome.runtime.sendMessage({ type: 'UPDATE_SESSION' });
});

els.pauseBtn?.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'TOGGLE_PAUSE' }));
els.endBtn?.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'STOP_SESSION' }));

restore();


