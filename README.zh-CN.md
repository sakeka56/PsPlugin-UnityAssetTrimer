# Unity Asset Trim

[English](README.md) | [简体中文](README.zh-CN.md)

**在 Photoshop 中批量裁掉透明边缘，为 Unity 导出紧凑的 PNG 游戏资源。**

选择多张图片或整个文件夹，指定导出位置，即可批量处理。保留原有像素比例，可让宽高保持偶数，也能忽略导致留白过大的微弱透明杂点。

![裁剪前后示意](docs/assets/trim-example.zh-CN.svg)

## 下载与安装

前往 [Releases](https://github.com/sakeka56/PsPlugin-UnityAssetTrimer/releases/latest)，下载 **[UnityAssetTrim-Setup-1.0.1.exe](https://github.com/sakeka56/PsPlugin-UnityAssetTrimer/releases/download/v1.0.1/UnityAssetTrim-Setup-1.0.1.exe)**。

1. 打开安装程序，程序会自动检测 Photoshop 安装位置。
2. 如有多个版本，选择目标 Photoshop，然后点击 **一键安装 / 更新**。目录需要管理员权限时，允许 Windows 的权限提示。
3. 重启 Photoshop，通过 **文件 → 脚本 → Unity Asset Trim** 启动。

安装器是一个离线 EXE，只安装 `Presets/Scripts/Unity Asset Trim.jsx`，遇到已有同名文件会先备份。无需安装 Unity 包；标准 Windows 10/11 环境自带的 .NET Framework 4.8 即可运行，无需额外下载运行时。

安装窗口支持拖动调整大小和最大化，文字自动换行；空间不足时可滚动查看内容。

当前 EXE 未做代码签名，Windows 可能提示未知发布者或 SmartScreen。请从本仓库的 Releases 下载；发布包同时提供 `SHA256SUMS.txt` 以便校验文件。

### 便携使用 / 手动安装

下载并解压 **[UnityAssetTrim-Portable-1.0.1.zip](https://github.com/sakeka56/PsPlugin-UnityAssetTrimer/releases/download/v1.0.1/UnityAssetTrim-Portable-1.0.1.zip)**。在 PS 中通过 **文件 → 脚本 → 浏览** 运行其中的 `Unity Asset Trim.jsx`；也可以把它复制到 PS 的 `Presets/Scripts` 文件夹，重启后从脚本菜单启动。

## 使用方法

1. 点击 **选择多张图片**，或点击 **选择文件夹**。文件夹模式可包含子文件夹，导出时保留相对目录结构。
2. 选择独立的输出文件夹。
3. 设置裁剪选项，点击 **开始批量裁剪**。

界面支持 **简体中文与 English**。首次打开时跟随 Photoshop 语言，也可通过顶部语言下拉框切换。切换语言会重置当前对话框的选择。

| 选项 | 默认值 | 行为 |
| --- | --- | --- |
| 宽高保持偶数 | 开启 | 某一边为奇数时，在右侧或底部补 1 像素透明边；不缩放已有图案。 |
| 忽略边缘 Alpha ≤ | `1` | 寻找裁剪范围时忽略 Alpha 不大于此值的像素。范围 `0–254`；`0` 表示严格保留所有非透明像素。 |
| 额外透明留边 | `0` | 每侧增加指定像素的透明边，再应用偶数补边。范围 `0–4096`。 |
| 包含子文件夹 | 开启 | 递归扫描并保留目录结构。输出文件夹位于输入目录内部时，会从扫描中排除。 |

例如，图案边界为 **7 × 9** 像素，开启偶数选项后导出为 **8 × 10**；每侧额外留边 2 像素后，导出为 **12 × 14**。

Alpha 阈值仅决定裁剪范围。范围内原有半透明像素的 Alpha 不变；范围外的微弱像素会随边缘一起裁掉。带柔和光晕或阴影的素材建议使用较低阈值。

## 文件与导出行为

- 输入扩展名：PNG、PSD、PSB、TIFF、TGA、WebP、BMP、JPG、JPEG；具体可用格式取决于 Photoshop 的打开能力。
- 统一输出 **8 位 RGB PNG**，使用当前可见图层合并后的外观。非 RGB 或高位深图片会在临时副本中转换模式与位深；不主动将色彩配置文件转换为 sRGB。
- 不保存修改到源文件。已打开文档会使用当前未保存的外观进行导出，原文档与编辑内容保持打开。
- 不覆盖已有导出文件，同名自动追加 `_2`、`_3` 等编号。
- 全透明图片或阈值下无有效像素的图片会跳过；单张失败不影响后续处理。
- 每批生成 UTF-8 TSV 日志，记录状态、源路径、原尺寸、导出尺寸及输出路径或错误。停止操作在当前图片处理结束后生效。

## 环境要求与使用范围

- 安装程序适用于 **Windows 10/11**，需要事先安装 Photoshop。
- 已实测 **Photoshop 2024 / 25.2.0**。其他支持 ExtendScript 的 Photoshop 版本可能可用，但尚未验证；macOS 手动运行 JSX 的方式也尚未测试。
- 工具采用带对话框的 Photoshop 脚本形式，不是可停靠的 UXP 面板；无需安装 Unity。
- 不透明的白色、黑色等背景不会被删除。本工具裁掉透明留白，不执行抠图。
- 每张图片独立计算边界。统一画布、固定 Pivot、九宫格边框、连续动画或图集坐标相关资源，替换前请检查其布局约定。
- PSD 按当前可见状态处理，不按图层或画板逐个导出；多画板文档不属于本工具支持的导出流程。

## 更新与卸载

运行新版安装器，点击 **一键安装 / 更新**。相同版本重复安装不会产生冗余备份。

从 1.0.0 升级可修复脚本取消后重复弹窗的问题。请先保存工作并退出 Photoshop，再安装新版，之后重新打开 PS，清除仍在内存中执行的旧脚本。

卸载时，打开安装器，选择 Photoshop，点击 **卸载脚本**；也可以手动删除 `Presets/Scripts/Unity Asset Trim.jsx`。形如 `Unity Asset Trim.jsx.backup-*` 的备份会保留，可按需手动还原或删除。重启 PS 后刷新脚本菜单。

## 从源码构建

Windows 环境安装 .NET Framework 4.x、PowerShell 后即可构建，无需包管理器还原或第三方构建工具：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build.ps1
```

构建脚本使用 .NET Framework 的 C# 编译器，将完整 JSX 嵌入安装器，在 `dist/` 中生成安装 EXE、便携 ZIP 和 SHA-256 校验文件。

### 测试

```powershell
node .\tests\unit-tests.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\installer-tests.ps1
# 需要 Photoshop；运行前请关闭已打开的文档：
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-photoshop.ps1
```

安装测试验证实际 EXE、嵌入文件、首次安装、重复安装、备份、卸载保护、中文路径和退出码。Photoshop 集成测试自行生成素材，验证裁剪、偶数补边、Alpha 阈值、已打开文档保护、批次错误处理、日志及两种界面语言。Photoshop 集成测试在本地运行，CI 环境不包含 Photoshop。

## 许可证

[MIT](LICENSE)。Photoshop 和 Unity 商标归各自所有者所有；本项目独立于 Adobe 与 Unity Technologies。
