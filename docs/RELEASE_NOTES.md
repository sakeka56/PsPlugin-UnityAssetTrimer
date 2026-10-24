# Unity Asset Trim v1.1.0

## English

A dockable Photoshop UXP panel with three actions:

- **Trim current document:** adjust the focused document's canvas without scaling artwork, merging layers, exporting or saving the PSD. One Undo restores the previous canvas.
- **Trim current image and export:** export a cropped PNG duplicate; leave the current PSD unchanged.
- **Batch-trim images:** open the existing batch image/folder window from 1.0.1.

Includes even dimensions, edge alpha threshold, optional padding, English and Simplified Chinese UI. The offline Windows EXE installs both the panel and the batch script, with update backups and uninstall support. The Adobe-packaged CCX is also provided for Creative Cloud Desktop installation (panel only).

**Requires Photoshop 24.4+. Tested on Photoshop 2024 / 25.2.0. CC 2018 does not support the UXP panel.** Save your work and exit Photoshop before updating. Open **Plugins → Unity Asset Trim → Unity Asset Trim** after restarting; drag the panel to dock it. The batch script remains under **File → Scripts**.

Native validation checked pixel preservation, layer identity, one-step undo, PNG-copy export, unchanged source PSD, restored focus and the batch shortcut. Installer lifecycle, layout and CI checks also pass. Temporary development settings were restored; normal installation does not enable developer mode.

Downloads: `UnityAssetTrim-Setup-1.1.0.exe`, `UnityAssetTrim-Portable-1.1.0.zip`, `UnityAssetTrim-Panel-1.1.0.ccx`, and `SHA256SUMS.txt`. The EXE is unsigned.

## 简体中文

新增可停靠的 Photoshop UXP 面板，提供三个入口：

- **裁剪当前文档：**只调整当前聚焦文档的画布，不缩放图案、不合并图层、不导出、不保存 PSD，可一次撤销。
- **裁剪当前图片并导出：**在副本中裁剪并导出 PNG，当前 PSD 保持不变。
- **批量裁剪图片：**快捷打开 1.0.1 的批量图片与文件夹处理窗口。

支持偶数宽高、边缘 Alpha 阈值、额外留边及中英文界面。离线 Windows EXE 同时安装面板与批量脚本，支持更新备份和卸载；另提供由 Adobe 官方工具生成的 CCX，通过 Creative Cloud Desktop 安装面板。

**面板要求 Photoshop 24.4+，已实测 Photoshop 2024 / 25.2.0；CC 2018 不支持此 UXP 面板。** 更新前请保存工作并退出 PS。重新启动后，从 **插件 → Unity Asset Trim → Unity 资源裁剪** 打开并拖动停靠。批量脚本仍可从 **文件 → 脚本** 打开。

已实测像素不变形、图层保留、单步撤销、PNG 副本导出、原稿不变、焦点恢复及批量快捷入口，并通过安装、布局与 CI 验证。临时开发设置已恢复，正常安装不会开启开发人员模式。

下载文件包括 EXE、便携 ZIP、面板 CCX 和 SHA-256 校验文件。CCX 只包含面板，批量快捷入口还需安装 JSX；EXE 会同时安装。EXE 尚未做代码签名。