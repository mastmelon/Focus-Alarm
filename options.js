const storage = chrome.storage.local;

const soundSelect = document.getElementById('soundSelect');
const playBtn = document.getElementById('playBtn');

async function restore() {
  const { sound = 'ping1' } = await storage.get({ sound: 'ping1' });
  soundSelect.value = sound;
}

soundSelect.addEventListener('change', async () => {
  await storage.set({ sound: soundSelect.value });
});

playBtn.addEventListener('click', async () => {
  const { sound = 'ping1' } = await storage.get({ sound: 'ping1' });
  chrome.runtime.sendMessage({ type: 'PREVIEW_SOUND', payload: { sound } });
});

restore();


