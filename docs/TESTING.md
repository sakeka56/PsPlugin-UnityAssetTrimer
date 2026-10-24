# Native panel verification

Tested on Windows with Photoshop 25.2.0. CI verifies geometry, script lifecycle, CCX/source equivalence, installer lifecycle and installer layout; CI does not contain Photoshop.

For native current-document tests, use a disposable 20 × 18 RGB PSD. Put a solid 7 × 9 rectangle at x=3, y=4 on a transparent layer and add a second, empty editable layer. Do not run fixture tests against your artwork.

1. With alpha threshold 0, padding 0 and even dimensions off, **Trim current document** produces a 7 × 9 canvas. Layer IDs and names stay intact, and each corresponding artwork pixel keeps its RGBA values. The PSD is not saved.
2. A single Undo restores 20 × 18 and the original layer positions.
3. From the original state, **Trim current image and export** with even dimensions on produces an 8 × 10 PNG copy. The source document stays 20 × 18 with its layers intact and regains focus. No export duplicate is left open.
4. Cancelling the export location picker leaves the source unchanged.
5. **Batch-trim images** opens the installed JSX batch window. Cancel closes it without processing files or reopening it.
6. Repeat with different documents focused to check that the panel targets the document selected when the action was clicked.

The automated native UXP run checked canvas dimensions, layer identity, exact RGBA correspondence, one-step undo, even PNG export, source preservation, restored focus and batch menu lookup. The batch shortcut was separately exercised through the real ScriptUI dialog. The installed panel was then discovered from the normal Photoshop Plugins menu with both temporary developer settings and the original Photoshop developer preference restored.

To develop and inspect the panel, use Adobe UXP Developer Tools and its runtime debugger. Keep `.uxprc`, debugger endpoints and test exports out of version control. Development mode is not enabled by the distributed installer.
