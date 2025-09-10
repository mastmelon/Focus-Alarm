const els = {
  task: document.getElementById('taskInput'),
  duration: document.getElementById('durationInput'),
  frequency: document.getElementById('frequencyInput'),
  volume: document.getElementById('volumeRange'),
  start: document.getElementById('startBtn'),
  settings: document.getElementById('settingsBtn'),
};

const storage = chrome.storage.local;

async function restore() {
  const data = await storage.get({
    task: '',
    durationMin: 45,
    frequencyMin: 5,
    volume: 0.5,
    active: false,
  });
  els.task.value = data.task;
  els.duration.value = data.durationMin;
  els.frequency.value = data.frequencyMin;
  els.volume.value = data.volume;
  updateStartButton(data.active);
}

function updateStartButton(active) {
  els.start.textContent = active ? 'Stop' : 'Start Focus';
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
    await storage.set({ task, durationMin, frequencyMin, volume });
    chrome.runtime.sendMessage({
      type: 'START_SESSION',
      payload: { task, durationMin, frequencyMin, volume },
    });
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'SESSION_STATE') {
    updateStartButton(Boolean(msg.active));
  }
});

restore();


