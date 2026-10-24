# Unity Asset Trim v1.0.1

## English

- Fixed the batch dialog reopening after Cancel, Escape or window close, including after switching languages. Cancellation and language switching now use separate states.
- Rebuilt the installer layout with automatic row heights, wrapped text and scrolling. The window is now resizable and can be maximized.
- Added native Photoshop ScriptUI cancellation regression tests and bilingual layout tests at simulated 100%, 150% and 200% scaling.
- Portable packages include both English and Chinese README illustrations.

**Update:** save your work and exit Photoshop, run `UnityAssetTrim-Setup-1.0.1.exe`, select Photoshop and click **Install / Update**. Reopen Photoshop and launch **File → Scripts → Unity Asset Trim**. No uninstall is required. Exiting Photoshop clears any old script still running in memory.

Alternatively, extract `UnityAssetTrim-Portable-1.0.1.zip` and run its JSX through **File → Scripts → Browse**. The installer is unsigned; checksums are provided in `SHA256SUMS.txt`.

## 简体中文

- 修复点击取消、按 Escape 或关闭窗口后，批量裁剪页面再次弹出的问题；切换语言后取消也能正常退出。取消操作与语言切换使用独立状态。
- 重做安装器布局，采用自动行高、文字换行和滚动内容；窗口支持拖动调整大小与最大化。
- 新增原生 Photoshop ScriptUI 取消回归测试，以及模拟 100%、150%、200% 缩放的中英文布局测试。
- 便携包同时包含中英文 README 示意图。

**升级：**先保存工作并退出 Photoshop，运行 `UnityAssetTrim-Setup-1.0.1.exe`，选择 PS 目录并点击一键安装 / 更新。重新打开 PS，从文件 → 脚本 → Unity Asset Trim 启动；无需先卸载。退出 PS 可清除内存中仍在执行的旧脚本。

也可以解压 `UnityAssetTrim-Portable-1.0.1.zip`，通过文件 → 脚本 → 浏览运行其中的 JSX。安装器尚未做代码签名，提供 `SHA256SUMS.txt` 校验文件。