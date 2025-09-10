const els = {
  task: document.getElementById('taskInput'),
  duration: document.getElementById('durationInput'),
  frequency: document.getElementById('frequencyInput'),
  volume: document.getElementById('volumeRange'),
  start: document.getElementById('startBtn'),
  toggle: document.getElementById('masterToggle'),
  settings: document.getElementById('settingsBtn'),
};

const storage = chrome.storage.local;

async function restore() {
  const data = await storage.get({
    task: '',
    durationMin: 45,
    frequencyMin: 5,
    volume: 0.5,
    enabled: false,
    active: false,
  });
  els.task.value = data.task;
  els.duration.value = data.durationMin;
  els.frequency.value = data.frequencyMin;
  els.volume.value = data.volume;
  els.toggle.checked = data.enabled || data.active;
  updateStartButton(data.active);
}

function updateStartButton(active) {
  els.start.textContent = active ? 'Stop' : 'Start Focus';
}

els.settings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

els.toggle.addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  await storage.set({ enabled });
  if (!enabled) {
    chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
  }
});

els.start.addEventListener('click', async () => {
  const task = els.task.value.trim();
  const durationMin = Number(els.duration.value) || 1;
  const frequencyMin = Number(els.frequency.value) || 1;
  const volume = Number(els.volume.value);

  await storage.set({ task, durationMin, frequencyMin, volume, enabled: true });
  els.toggle.checked = true;
  chrome.runtime.sendMessage({
    type: 'START_SESSION',
    payload: { task, durationMin, frequencyMin, volume },
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'SESSION_STATE') {
    updateStartButton(Boolean(msg.active));
  }
});

restore();


