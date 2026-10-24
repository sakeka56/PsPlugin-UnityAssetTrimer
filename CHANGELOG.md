# Changelog

## 1.1.0 — 2026-10-24

- Add a dockable UXP panel for Photoshop 24.4+ with English and Simplified Chinese interfaces.
- Trim the focused document by changing canvas bounds only. Preserve layers and pixel scale, avoid saving, and group changes into one undo step.
- Export a cropped PNG duplicate without modifying the source PSD.
- Open the existing batch dialog directly from the panel.
- Install, update, back up and uninstall both the panel and the batch script using the offline EXE.
- Add an Adobe-packaged CCX distribution and verify it against source during builds.

## 1.0.1 — 2026-10-24

- Fix the batch dialog reopening after Cancel, Escape or window close. Language switching now uses an explicit state and an iterative dialog loop.
- Make the Windows installer resizable and maximizable, with automatic row sizing, wrapped text and scrollable content instead of fixed control coordinates.
- Add native ScriptUI cancellation regression tests and bilingual installer layout tests at simulated 100%, 150% and 200% scaling.
- Include both English and Chinese README illustrations in portable packages.

## 1.0.0 — 2026-10-24

- Batch transparent-border trimming from selected images or folders.
- Optional recursive input and preserved directory structure.
- Even output dimensions, configurable padding and edge alpha threshold.
- Source document preservation, collision-safe PNG export and TSV batch logs.
- English and Simplified Chinese interfaces and documentation.
- Offline Windows installer with automatic Photoshop detection, backups, update and uninstall.
- Portable script package, checksums and automated build workflow.
