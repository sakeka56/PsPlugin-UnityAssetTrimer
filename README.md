# Unity Asset Trim

[English](README.md) | [简体中文](README.zh-CN.md)

**Batch-trim transparent borders in Photoshop and export clean PNG assets for Unity.**

Choose images or a folder, set an output directory, and export. Keep original pixel scale, optionally enforce even dimensions, and ignore faint alpha noise that makes otherwise empty borders hard to trim.

![Before and after trimming](docs/assets/trim-example.svg)

## Download and install

Download **[UnityAssetTrim-Setup-1.0.0.exe](https://github.com/sakeka56/unity-asset-trim/releases/download/v1.0.0/UnityAssetTrim-Setup-1.0.0.exe)** from [Releases](https://github.com/sakeka56/unity-asset-trim/releases/latest).

1. Run the installer. It detects Photoshop installations automatically.
2. Choose your Photoshop installation if more than one is listed, then click **Install / Update**. Accept a Windows administrator prompt if the installation folder requires it.
3. Restart Photoshop and open **File → Scripts → Unity Asset Trim**.

The installer is a single offline executable. It installs only `Presets/Scripts/Unity Asset Trim.jsx` and backs up an existing file with the same name. No Unity package or extra runtime download is needed on a standard Windows 10/11 installation with .NET Framework 4.8.

The executable is not code-signed. Windows may show an unknown-publisher or SmartScreen prompt. Download from this repository's Releases page; `SHA256SUMS.txt` is included for checksum verification.

### Portable / manual installation

Download **[UnityAssetTrim-Portable-1.0.0.zip](https://github.com/sakeka56/unity-asset-trim/releases/download/v1.0.0/UnityAssetTrim-Portable-1.0.0.zip)** and extract it. In Photoshop, use **File → Scripts → Browse** to run `Unity Asset Trim.jsx`, or copy that file into Photoshop's `Presets/Scripts` folder and restart Photoshop.

## Use

1. Select **Choose images** for multiple individual files, or **Choose folder** for a directory. Folder mode can include subfolders and preserves their relative paths on export.
2. Select a separate output folder.
3. Set trim options and click **Trim and export**.

The interface supports **English and Simplified Chinese**. It follows Photoshop's locale on first launch; use the language selector to switch. Switching languages resets the current dialog selections.

| Setting | Default | Behavior |
| --- | --- | --- |
| Keep even dimensions | On | If width or height is odd, append one transparent pixel on the right or bottom. Existing artwork is not rescaled. |
| Ignore edge alpha ≤ | `1` | Ignore pixels with alpha at or below the threshold when finding the crop rectangle. Range: `0–254`. Use `0` for strict nontransparent bounds. |
| Extra transparent padding | `0` | Add this many transparent pixels on every side, then apply the even-dimension rule. Range: `0–4096`. |
| Include subfolders | On | Scan subfolders and preserve directory structure. An output folder inside the input folder is excluded from scanning. |

For example, a **7 × 9** pixel crop becomes **8 × 10** with even dimensions enabled. With two pixels of padding per side, it becomes **12 × 14**.

The alpha threshold changes only the crop rectangle. Semitransparent pixels inside that rectangle retain their alpha values; faint pixels outside it are cropped away. Use a lower threshold for soft glows and shadows.

## Files and output

- Input extensions: PNG, PSD, PSB, TIFF, TGA, WebP, BMP, JPG and JPEG. Availability depends on the formats your Photoshop installation can open.
- Output: **8-bit RGB PNG**, using the merged visible appearance of the document. Non-RGB or higher-bit-depth sources are converted in a temporary copy. Color profiles are not explicitly converted to sRGB.
- Source files are never saved over. Already-open documents contribute their current unsaved appearance and stay open with their edits intact.
- Existing output files are preserved. Name collisions receive `_2`, `_3`, and so on.
- Fully transparent images and images with no pixels above the selected threshold are skipped. A failed file does not stop the rest of the batch.
- Each batch writes a UTF-8 TSV log with status, source path, original size, exported size, and output path or error. Stop takes effect after the current image finishes.

## Requirements and limits

- **Windows 10/11** for the installer. Photoshop must already be installed.
- **Photoshop 2024 / 25.2.0 is tested.** Other Photoshop versions with ExtendScript support may work but are not verified. The manual JSX route is not tested on macOS.
- This is a Photoshop script with a dialog, rather than a dockable UXP panel. It does not require Unity to be installed.
- Opaque white, black or colored backgrounds are kept. This tool trims transparency; it does not remove backgrounds.
- Images are cropped independently. Review assets that require shared canvas sizes, fixed pivots, nine-slice borders, animation alignment or atlas coordinates before replacing them in Unity.
- PSD visibility is respected. Layers and artboards are not exported individually. Multi-artboard documents are not a supported export workflow.

## Update and uninstall

Run the newer installer and choose **Install / Update**. Reinstalling the same payload does not create redundant backups.

To uninstall, run the installer, select Photoshop and click **Uninstall script**. You can also delete `Presets/Scripts/Unity Asset Trim.jsx` manually. Backups named `Unity Asset Trim.jsx.backup-*` remain available; remove or restore them manually if needed. Restart Photoshop to refresh its script menu.

## Build from source

No package-manager restore or third-party build tools are required. On Windows, with .NET Framework 4.x and PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build.ps1
```

The script uses the .NET Framework C# compiler, embeds the standalone JSX into the installer, and writes the setup EXE, portable ZIP and SHA-256 checksums into `dist/`.

### Tests

```powershell
node .\tests\unit-tests.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\installer-tests.ps1
# Requires Photoshop. Close open documents before running:
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-photoshop.ps1
```

Installer tests exercise the compiled executable, embedded payload, fresh installation, repeat installation, backups, uninstall protection, Unicode paths and exit codes. Photoshop integration tests generate their own fixtures and verify cropping, parity padding, alpha thresholds, open-document preservation, batch error handling, logs and both interface languages. Photoshop integration tests run locally; CI does not include Photoshop.

## License

[MIT](LICENSE). Photoshop and Unity are trademarks of their respective owners. This project is independent of Adobe and Unity Technologies.
