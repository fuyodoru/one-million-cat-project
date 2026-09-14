# One Million Cat Project — Tutorial Update

This package adds a first-launch onboarding tutorial without changing the existing app UI.

Files to copy into `app/assets/public/`:
- index.html
- app.js
- style.css

The tutorial runs once and stores `catTrackerTutorialCompleted` in localStorage.

Optional report animation:
- Put a short `tutorial-report.mp4` next to `index.html`.
- In app.js, change the Step 3 object from `reportVideo: false` to `reportVideo: true`.

The video is optional; the tutorial works without it.
