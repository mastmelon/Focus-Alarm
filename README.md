Focus Nudges (MV3)

Minimal Chrome extension that gently plays a soft sound every X minutes to remind you to stay on your current task.

Install (Developer Mode)
1. Open Chrome → Extensions → toggle Developer mode.
2. Click "Load unpacked" and select this NudgeMe folder.
3. Pin the extension. Open the popup to start a session.

Usage
- Fill in your task, focus duration, and nudge frequency.
- Adjust the volume and click Start. Use the toggle to stop anytime.
- Click the gear icon to select a sound and preview it.

Files
- manifest.json – MV3 manifest.
- popup.html|css|js – Popup UI.
- options.html|js – Settings page with sound selection.
- background.js – Schedules alarms and controls the session.
- offscreen.html|js – Offscreen audio player using WebAudio.

Notes
- Audio is synthesized (no assets needed). You can add your own audio by updating offscreen.js to fetch/play files.


