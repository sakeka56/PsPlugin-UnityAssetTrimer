#target photoshop
/* Unity Asset Trim v1.0.0 | MIT License | Copyright (c) 2026 sakeka56 */
var UnityAssetTrimLanguage = typeof UnityAssetTrimLanguage === "undefined" ?
    (typeof app !== "undefined" && /^zh/i.test(app.locale) ? "zh" : "en") : UnityAssetTrimLanguage;
function uatText(text) {
    var english = {
    "无法创建目录：": "Cannot create folder: ",
    "跳过": "Skipped",
    "全透明图片": "Fully transparent image",
    "透明度阈值下无有效像素": "No pixels above the alpha threshold",
    "可见画布内无像素": "No pixels inside the visible canvas",
    "成功": "Success",
    "失败": "Failed",
    "无法写入日志": "Cannot write log",
    "状态\t源文件\t原宽\t原高\t导出宽\t导出高\t输出文件或说明": "Status\tSource\tOriginal width\tOriginal height\tOutput width\tOutput height\tOutput or details",
    "Unity 资源批量裁剪": "Unity Asset Trim",
    "准备处理…": "Preparing...",
    "处理完当前图片后停止": "Stop after the current image",
    "日志：": "Log: ",
    "日志写入失败：": "Could not write log: ",
    "已停止。": "Stopped.",
    "处理完成。": "Complete.",
    "\n成功 ": "\nSuccess: ",
    " 张，跳过 ": "; skipped: ",
    " 张，失败 ": "; failed: ",
    " 张。\n": ".\n",
    "Unity 资源批量裁剪 v1.0": "Unity Asset Trim v1.0.0",
    "裁掉透明边缘 · 原尺寸像素导出 · 源文件保留": "Trim transparent edges · Keep pixel scale · Preserve source files",
    "1. 输入图片": "1. Input images",
    "选择多张图片…": "Choose images...",
    "选择文件夹…": "Choose folder...",
    "尚未选择": "Not selected",
    "包含子文件夹（导出时保留目录结构）": "Include subfolders (preserve directory structure)",
    "选择图片（可多选）": "Select images (multiple selection allowed)",
    "图片:*.png;*.psd;*.psb;*.tif;*.tiff;*.tga;*.webp;*.bmp;*.jpg;*.jpeg": "Images:*.png;*.psd;*.psb;*.tif;*.tiff;*.tga;*.webp;*.bmp;*.jpg;*.jpeg",
    "已选择 ": "Selected ",
    " 张图片": " image(s)",
    "选择待处理图片所在文件夹": "Select the input folder",
    "2. 输出文件夹": "2. Output folder",
    "选择导出文件夹…": "Choose output folder...",
    "选择 PNG 导出文件夹": "Select the PNG output folder",
    "3. 裁剪选项": "3. Trim options",
    "宽高保持偶数（奇数时在右侧 / 底部补 1 像素透明边）": "Keep even dimensions (add 1 transparent pixel on the right / bottom)",
    "忽略边缘 Alpha ≤（0～254）：": "Ignore edge alpha <= (0-254):",
    "推荐 1：忽略几乎不可见的杂点；设为 0：严格保留所有非透明像素。": "Recommended: 1 to ignore faint noise; use 0 to keep every nontransparent pixel.",
    "额外透明留边（每侧像素）：": "Extra transparent padding (pixels per side):",
    "输出为 8 位 RGB PNG；同名自动编号。纯色背景不会被当成透明边缘。": "8-bit RGB PNG output; unique filenames. Opaque backgrounds are kept.",
    "取消": "Cancel",
    "开始批量裁剪": "Trim and export",
    "请先选择导出文件夹。": "Choose an output folder first.",
    "留边请输入 0 到 4096 的整数。": "Padding must be an integer from 0 to 4096.",
    "Alpha 阈值请输入 0 到 254 的整数。": "Alpha threshold must be an integer from 0 to 254.",
    "导出文件夹应与输入文件夹不同，避免重复处理导出结果。": "Choose an output folder different from the input folder.",
    "没有找到支持的图片，请选择图片或文件夹。": "No supported images found. Choose images or an input folder.",
    "裁剪工具遇到错误：\n": "Unity Asset Trim encountered an error:\n"
};
    return UnityAssetTrimLanguage === "zh" ? text : (english[text] || text);
}
/* Unity Asset Trim. ExtendScript ES3; no external dependencies. */
var UnityAssetTrim = (function () {
    function key(path) { return String(path).replace(/\\/g, '/').toLowerCase(); }
    function supported(file) { return /\.(png|psd|psb|tif|tiff|tga|webp|bmp|jpg|jpeg)$/i.test(file.name); }
    function evenSize(n, enabled) { return n + (enabled && n % 2 ? 1 : 0); }
    function safeName(s) { return s.replace(/\.[^.]+$/, '').replace(/[<>:"\/\\|?*]/g, '_'); }
    function uniqueFile(folder, stem) {
        var f = File(folder.fsName + '/' + stem + '.png'), i = 2;
        while (f.exists) { f = File(folder.fsName + '/' + stem + '_' + i + '.png'); i++; }
        return f;
    }
    function collect(folder, recursive, output, result, seen) {
        var entries = folder.getFiles(), i, item, k;
        entries.sort(function (a, b) { return key(a.fsName) < key(b.fsName) ? -1 : 1; });
        for (i = 0; i < entries.length; i++) {
            item = entries[i];
            if (item.alias) { continue; }
            k = '$' + key(item.fsName);
            if (seen[k]) { continue; }
            seen[k] = true;
            if (item instanceof Folder) {
                if (recursive && key(item.fsName) !== key(output.fsName)) { collect(item, true, output, result, seen); }
            } else if (supported(item)) { result.push(item); }
        }
    }
    function ensureFolder(folder) {
        if (folder.exists) { return; }
        if (!folder.parent || key(folder.parent.fsName) === key(folder.fsName)) { throw Error(uatText('无法创建目录：') + folder.fsName); }
        ensureFolder(folder.parent);
        if (!folder.create()) { throw Error(uatText('无法创建目录：') + folder.fsName); }
    }
    function outputFolder(file, config) {
        if (!config.root) { return config.output; }
        var root = config.root.fullName, parent = file.parent.fullName;
        if (key(parent) === key(root)) { return config.output; }
        var relative = parent.substring(root.length + 1);
        return Folder(config.output.fullName + '/' + relative);
    }
    function findOpen(file) {
        for (var i = 0; i < app.documents.length; i++) {
            try { if (key(app.documents[i].fullName.fsName) === key(file.fsName)) { return app.documents[i]; } } catch (_) {}
        }
        return null;
    }
    function alphaBounds(doc, ignoredAlpha) {
        if (!ignoredAlpha) { return doc.activeLayer.bounds; }
        var alpha = null;
        try {
            var d = new ActionDescriptor(), dest = new ActionReference(), src = new ActionReference();
            dest.putProperty(charIDToTypeID('Chnl'), charIDToTypeID('fsel'));
            src.putEnumerated(charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Trsp'));
            d.putReference(charIDToTypeID('null'), dest); d.putReference(charIDToTypeID('T   '), src);
            executeAction(charIDToTypeID('setd'), d, DialogModes.NO);
            alpha = doc.channels.add();
            doc.selection.store(alpha); doc.selection.deselect();
            doc.activeChannels = [alpha];
            // Threshold only a disposable alpha channel; exported artwork stays untouched.
            var threshold = new ActionDescriptor();
            threshold.putInteger(charIDToTypeID('Lvl '), ignoredAlpha + 1);
            executeAction(charIDToTypeID('Thrs'), threshold, DialogModes.NO);
            doc.selection.load(alpha);
            try { return doc.selection.bounds; } catch (_) { return null; }
        } finally {
            doc.selection.deselect();
            doc.activeChannels = doc.componentChannels;
            if (alpha) { alpha.remove(); }
        }
    }
    function processFile(file, config) {
        var base = null, doc = null, opened = false;
        try {
            base = findOpen(file);
            if (!base) { base = app.open(file); opened = true; }
            doc = base.duplicate();
            if (opened) { base.close(SaveOptions.DONOTSAVECHANGES); base = null; }
            app.activeDocument = doc;
            var beforeW = Math.round(doc.width.as('px')), beforeH = Math.round(doc.height.as('px'));
            if (doc.mode === DocumentMode.BITMAP) { doc.changeMode(ChangeMode.GRAYSCALE); }
            if (doc.mode !== DocumentMode.RGB) { doc.changeMode(ChangeMode.RGB); }
            if (doc.bitsPerChannel !== BitsPerChannelType.EIGHT) { doc.bitsPerChannel = BitsPerChannelType.EIGHT; }
            // Merge against an empty layer so bounds describe the visible composite,
            // including masks and effects, even for a single visible source layer.
            var extra = doc.artLayers.add();
            extra.name = '__UnityAssetTrim_composite__';
            doc.mergeVisibleLayers();
            var bounds = doc.activeLayer.bounds;
            if (bounds[2].as('px') <= bounds[0].as('px') || bounds[3].as('px') <= bounds[1].as('px')) {
                return { status: uatText('跳过'), detail: uatText('全透明图片'), beforeW: beforeW, beforeH: beforeH };
            }
            if (doc.activeLayer.isBackgroundLayer) { doc.activeLayer.isBackgroundLayer = false; }
            bounds = alphaBounds(doc, config.alpha || 0);
            if (!bounds) { return { status: uatText('跳过'), detail: uatText('透明度阈值下无有效像素'), beforeW: beforeW, beforeH: beforeH }; }
            var left = Math.max(0, Math.floor(bounds[0].as('px')));
            var top = Math.max(0, Math.floor(bounds[1].as('px')));
            var right = Math.min(beforeW, Math.ceil(bounds[2].as('px')));
            var bottom = Math.min(beforeH, Math.ceil(bounds[3].as('px')));
            if (right <= left || bottom <= top) {
                return { status: uatText('跳过'), detail: uatText('可见画布内无像素'), beforeW: beforeW, beforeH: beforeH };
            }
            if (left || top || right !== beforeW || bottom !== beforeH) {
                doc.crop([UnitValue(left, 'px'), UnitValue(top, 'px'), UnitValue(right, 'px'), UnitValue(bottom, 'px')]);
            }
            var w = Math.round(doc.width.as('px')), h = Math.round(doc.height.as('px'));
            var newW = evenSize(w + config.padding * 2, config.even);
            var newH = evenSize(h + config.padding * 2, config.even);
            if (doc.activeLayer.isBackgroundLayer) { doc.activeLayer.isBackgroundLayer = false; }
            if (config.padding) {
                doc.resizeCanvas(UnitValue(w + config.padding * 2, 'px'), UnitValue(h + config.padding * 2, 'px'), AnchorPosition.MIDDLECENTER);
            }
            // Keep existing pixels fixed; odd-size correction adds transparent right/bottom pixels.
            if (Math.round(doc.width.as('px')) !== newW || Math.round(doc.height.as('px')) !== newH) {
                doc.resizeCanvas(UnitValue(newW, 'px'), UnitValue(newH, 'px'), AnchorPosition.TOPLEFT);
            }
            var folder = outputFolder(file, config);
            ensureFolder(folder);
            var target = uniqueFile(folder, safeName(file.name));
            var options = new PNGSaveOptions();
            options.interlaced = false;
            doc.saveAs(target, options, true, Extension.LOWERCASE);
            return { status: uatText('成功'), detail: target.fsName, beforeW: beforeW, beforeH: beforeH, width: newW, height: newH };
        } finally {
            if (doc) { doc.close(SaveOptions.DONOTSAVECHANGES); }
            if (opened && base) { base.close(SaveOptions.DONOTSAVECHANGES); }
        }
    }
    function cell(s) { return String(s === undefined ? '' : s).replace(/[\t\r\n]+/g, ' '); }
    function writeLog(folder, rows) {
        var log = File(folder.fsName + '/UnityAssetTrim-log-' + new Date().getTime() + '.tsv');
        log.encoding = 'UTF-8';
        if (!log.open('w')) { throw Error(log.error || uatText('无法写入日志')); }
        try { log.write('\uFEFF' + rows.join('\r\n')); } finally { log.close(); }
        return log;
    }
    function runBatch(files, config) {
        var ruler = app.preferences.rulerUnits, dialogs = app.displayDialogs;
        var previous = app.documents.length ? app.activeDocument : null;
        var rows = [uatText('状态\t源文件\t原宽\t原高\t导出宽\t导出高\t输出文件或说明')];
        var ok = 0, skipped = 0, failed = 0, cancelled = false;
        var progress = new Window('palette', uatText('Unity 资源批量裁剪'));
        progress.orientation = 'column'; progress.alignChildren = 'fill';
        var label = progress.add('statictext', undefined, uatText('准备处理…')); label.preferredSize.width = 460;
        var bar = progress.add('progressbar', undefined, 0, files.length);
        var cancel = progress.add('button', undefined, uatText('处理完当前图片后停止'));
        cancel.onClick = function () { cancelled = true; cancel.enabled = false; };
        progress.onClose = function () { cancelled = true; };
        progress.show();
        try {
            app.preferences.rulerUnits = Units.PIXELS;
            app.displayDialogs = DialogModes.NO;
            for (var i = 0; i < files.length; i++) {
                label.text = (i + 1) + ' / ' + files.length + '  ' + File.decode(files[i].name);
                progress.update();
                if (cancelled) { break; }
                var r;
                try {
                    r = processFile(files[i], config);
                    if (r.status === uatText('成功')) { ok++; } else { skipped++; }
                } catch (e) { failed++; r = { status: uatText('失败'), detail: e.message }; }
                rows.push(joinRow(r, files[i]));
                bar.value = i + 1;
                progress.update();
            }
        } finally {
            app.preferences.rulerUnits = ruler;
            app.displayDialogs = dialogs;
            try { if (previous) { app.activeDocument = previous; } } catch (_) {}
            progress.onClose = null;
            progress.close();
        }
        var logMessage;
        try { logMessage = uatText('日志：') + writeLog(config.output, rows).fsName; }
        catch (err) { logMessage = uatText('日志写入失败：') + err.message; }
        var message = (cancelled ? uatText('已停止。') : uatText('处理完成。')) + uatText('\n成功 ') + ok + uatText(' 张，跳过 ') + skipped + uatText(' 张，失败 ') + failed + uatText(' 张。\n') + logMessage;
        if (!config.silent) { alert(message); }
        return { message: message, success: ok, skipped: skipped, failed: failed, cancelled: cancelled };
    }
    function joinRow(r, file) {
        var items = [r.status, file.fsName, r.beforeW, r.beforeH, r.width, r.height, r.detail];
        for (var j = 0; j < items.length; j++) { items[j] = cell(items[j]); }
        return items.join('\t');
    }
    function main() {
        var files = [], root = null, output = null;
        var win = new Window('dialog', (UnityAssetTrimLanguage === 'zh' ? 'Unity 资源批量裁剪 v1.0.0' : 'Unity Asset Trim v1.0.0'));
        win.orientation = 'column'; win.alignChildren = 'fill'; win.spacing = 12; win.margins = 20;
        var languageRow = win.add('group');
        languageRow.add('statictext', undefined, 'Language / 语言:');
        var language = languageRow.add('dropdownlist', undefined, ['简体中文', 'English']);
        language.selection = UnityAssetTrimLanguage === 'zh' ? 0 : 1;
        language.onChange = function () {
            var next = language.selection.index === 0 ? 'zh' : 'en';
            if (next !== UnityAssetTrimLanguage) { UnityAssetTrimLanguage = next; win.close(2); }
        };
        win.add('statictext', undefined, uatText('裁掉透明边缘 · 原尺寸像素导出 · 源文件保留'));
        var input = win.add('panel', undefined, uatText('1. 输入图片')); input.alignChildren = 'fill';
        var buttons = input.add('group');
        var selectFiles = buttons.add('button', undefined, uatText('选择多张图片…'));
        var selectFolder = buttons.add('button', undefined, uatText('选择文件夹…'));
        var source = input.add('edittext', undefined, uatText('尚未选择'), { readonly: true }); source.preferredSize.width = 510;
        var recursive = input.add('checkbox', undefined, uatText('包含子文件夹（导出时保留目录结构）')); recursive.value = true;
        selectFiles.onClick = function () {
            var chosen = File.openDialog(uatText('选择图片（可多选）'), uatText('图片:*.png;*.psd;*.psb;*.tif;*.tiff;*.tga;*.webp;*.bmp;*.jpg;*.jpeg'), true);
            if (!chosen) { return; }
            files = chosen instanceof Array ? chosen : [chosen]; root = null;
            source.text = uatText('已选择 ') + files.length + uatText(' 张图片'); recursive.enabled = false;
        };
        selectFolder.onClick = function () {
            var chosen = Folder.selectDialog(uatText('选择待处理图片所在文件夹'));
            if (!chosen) { return; }
            root = chosen; files = []; source.text = root.fsName; recursive.enabled = true;
        };
        var destination = win.add('panel', undefined, uatText('2. 输出文件夹')); destination.alignChildren = 'fill';
        var pickOutput = destination.add('button', undefined, uatText('选择导出文件夹…'));
        var outputText = destination.add('edittext', undefined, uatText('尚未选择'), { readonly: true });
        pickOutput.onClick = function () {
            var chosen = Folder.selectDialog(uatText('选择 PNG 导出文件夹'));
            if (chosen) { output = chosen; outputText.text = output.fsName; }
        };
        var settings = win.add('panel', undefined, uatText('3. 裁剪选项')); settings.alignChildren = 'left';
        var even = settings.add('checkbox', undefined, uatText('宽高保持偶数（奇数时在右侧 / 底部补 1 像素透明边）')); even.value = true;
        var alphaRow = settings.add('group'); alphaRow.add('statictext', undefined, uatText('忽略边缘 Alpha ≤（0～254）：'));
        var alpha = alphaRow.add('edittext', undefined, '1'); alpha.characters = 6;
        settings.add('statictext', undefined, uatText('推荐 1：忽略几乎不可见的杂点；设为 0：严格保留所有非透明像素。'));
        var pad = settings.add('group'); pad.add('statictext', undefined, uatText('额外透明留边（每侧像素）：'));
        var padding = pad.add('edittext', undefined, '0'); padding.characters = 6;
        win.add('statictext', undefined, uatText('输出为 8 位 RGB PNG；同名自动编号。纯色背景不会被当成透明边缘。'));
        var actions = win.add('group'); actions.alignment = 'right';
        actions.add('button', undefined, uatText('取消'), { name: 'cancel' });
        var start = actions.add('button', undefined, uatText('开始批量裁剪'), { name: 'ok' });
        var config = null;
        start.onClick = function () {
            if (!output) { alert(uatText('请先选择导出文件夹。')); return; }
            if (!/^\d+$/.test(padding.text) || Number(padding.text) > 4096) { alert(uatText('留边请输入 0 到 4096 的整数。')); return; }
            if (!/^\d+$/.test(alpha.text) || Number(alpha.text) > 254) { alert(uatText('Alpha 阈值请输入 0 到 254 的整数。')); return; }
            if (root && key(root.fsName) === key(output.fsName)) { alert(uatText('导出文件夹应与输入文件夹不同，避免重复处理导出结果。')); return; }
            if (root) { files = []; collect(root, recursive.value, output, files, {}); }
            var unique = [], seen = {};
            for (var i = 0; i < files.length; i++) {
                var k = '$' + key(files[i].fsName);
                if (supported(files[i]) && !seen[k]) { unique.push(files[i]); seen[k] = true; }
            }
            files = unique;
            if (!files.length) { alert(uatText('没有找到支持的图片，请选择图片或文件夹。')); return; }
            config = { output: output, root: root, even: even.value, padding: Number(padding.text), alpha: Number(alpha.text) };
            win.close(1);
        };
        var result = win.show();
        if (result === 2) { main(); }
        else if (result === 1 && config) { runBatch(files, config); }
    }
    return { main: main, processFile: processFile, evenSize: evenSize, collect: collect, uniqueFile: uniqueFile, outputFolder: outputFolder, runBatch: runBatch };
}());
if (typeof UnityAssetTrimTestOnly === 'undefined' || !UnityAssetTrimTestOnly) {
    try { UnityAssetTrim.main(); } catch (error) { alert(uatText('裁剪工具遇到错误：\n') + error.message); }
}
