#target photoshop
var UnityAssetTrimTestOnly = true;
var UnityAssetTrimLanguage = 'zh';
var UnityAssetTrimTestRoot = File($.fileName).parent;
$.evalFile(File(UnityAssetTrimTestRoot.parent.fsName + '/src/UnityAssetTrim.jsx'));
(function () {
    var run = Folder(UnityAssetTrimTestRoot.fsName + '/results/run-' + new Date().getTime());
    Folder(UnityAssetTrimTestRoot.fsName + '/results').create(); run.create();
    var folder = Folder(run.fsName + '/input'); folder.create();
    var output = Folder(folder.fsName + '/output'); output.create();
    if (app.documents.length) { throw Error('Close documents before running integration tests.'); }
    var results = [], failures = 0, oldUnits = app.preferences.rulerUnits, oldDialogs = app.displayDialogs;
    function assert(value, label) {
        results.push((value ? 'PASS ' : 'FAIL ') + label);
        if (!value) { failures++; }
    }
    function fixture(name, w, h, rect) {
        var doc = app.documents.add(w, h, 72, name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
        if (rect) {
            doc.selection.select([[rect[0], rect[1]], [rect[2], rect[1]], [rect[2], rect[3]], [rect[0], rect[3]]]);
            var color = new SolidColor(); color.rgb.red = 255; color.rgb.green = 40; color.rgb.blue = 10;
            doc.selection.fill(color); doc.selection.deselect();
        }
        var file = File(folder.fsName + '/' + name + '.png');
        doc.saveAs(file, new PNGSaveOptions(), true, Extension.LOWERCASE);
        doc.close(SaveOptions.DONOTSAVECHANGES);
        return file;
    }
    function check(file, even, padding, w, h, name) {
        var r = UnityAssetTrim.processFile(file, { output: output, root: null, even: even, padding: padding });
        assert(r.status === '成功' && r.width === w && r.height === h, name + ' dimensions: ' + r.width + 'x' + r.height);
        if (r.status === '成功') {
            var exported = app.open(File(r.detail));
            assert(Math.round(exported.width.as('px')) === w && Math.round(exported.height.as('px')) === h, name + ' saved PNG dimensions');
            var b = exported.activeLayer.bounds;
            assert(b[0].as('px') === padding && b[1].as('px') === padding, name + ' artwork anchor');
            exported.close(SaveOptions.DONOTSAVECHANGES);
        }
        return r;
    }
    try {
        app.preferences.rulerUnits = Units.PIXELS;
        app.displayDialogs = DialogModes.NO;
        var odd = fixture('odd', 20, 18, [3, 4, 10, 13]);
        var even = fixture('even', 20, 18, [3, 4, 11, 14]);
        var empty = fixture('empty', 20, 18, null);
        var full = fixture('full', 7, 9, [0, 0, 7, 9]);
        var a = check(odd, true, 0, 8, 10, 'odd -> even');
        var b = check(odd, false, 0, 7, 9, 'odd exact trim');
        assert(a.detail !== b.detail, 'same name never overwrites');
        check(even, true, 0, 8, 10, 'even unchanged');
        check(odd, true, 2, 12, 14, 'padding plus even');
        check(full, true, 0, 8, 10, 'opaque odd canvas');
        var r = UnityAssetTrim.processFile(empty, { output: output, even: true, padding: 0 });
        assert(r.status === '跳过', 'fully transparent skipped');
        var original = app.open(odd);
        var originalId = original.id;
        original.artLayers.add().name = 'unsaved-edit';
        var originalLayers = original.layers.length;
        check(odd, true, 0, 8, 10, 'already open source');
        assert(original.id === originalId && original.layers.length === originalLayers && !original.saved, 'open document and unsaved changes preserved');
        original.close(SaveOptions.DONOTSAVECHANGES);
        var faintDoc = app.open(odd);
        faintDoc.artLayers.add().opacity = 0.4;
        faintDoc.selection.select([[0, 0], [1, 0], [1, 1], [0, 1]]);
        var faintColor = new SolidColor(); faintColor.rgb.red = 255;
        faintDoc.selection.fill(faintColor); faintDoc.selection.deselect();
        var faint = File(folder.fsName + '/faint.png');
        faintDoc.saveAs(faint, new PNGSaveOptions(), true, Extension.LOWERCASE);
        faintDoc.close(SaveOptions.DONOTSAVECHANGES);
        r = UnityAssetTrim.processFile(faint, { output: output, even: false, padding: 0, alpha: 0 });
        assert(r.status === '成功' && r.width === 10 && r.height === 13, 'strict alpha retains faint edge pixel');
        r = UnityAssetTrim.processFile(faint, { output: output, even: true, padding: 0, alpha: 1 });
        assert(r.status === '成功' && r.width === 8 && r.height === 10, 'alpha threshold excludes faint edge pixel');
        r = UnityAssetTrim.processFile(full, { output: output, even: true, padding: 0, alpha: 1 });
        assert(r.status === '成功' && r.width === 8 && r.height === 10, 'threshold on opaque image');
        var discovered = [];
        UnityAssetTrim.collect(folder, true, output, discovered, {});
        assert(discovered.length === 5, 'recursive traversal excludes output directory');
        var bad = File(folder.fsName + '/invalid.png'); bad.open('w'); bad.write('invalid image fixture'); bad.close();
        var summary = '';
        var logsBefore = output.getFiles('UnityAssetTrim-log-*.tsv').length;
        var unitsBefore = app.preferences.rulerUnits, dialogsBefore = app.displayDialogs;
        try {
            summary = UnityAssetTrim.runBatch([bad, empty, odd], { output: output, root: null, even: true, padding: 0, alpha: 1, silent: true }).message;
        } finally { bad.remove(); }
        results.push('BATCH_SUMMARY ' + summary.replace(/\n/g, ' | '));
        assert(summary.indexOf('成功 1 张，跳过 1 张，失败 1 张') >= 0, 'batch continues after failed image and reports counts');
        assert(output.getFiles('UnityAssetTrim-log-*.tsv').length === logsBefore + 1, 'batch TSV log saved');
        assert(app.preferences.rulerUnits === unitsBefore && app.displayDialogs === dialogsBefore, 'batch restores Photoshop preferences');
        UnityAssetTrimLanguage = 'en';
        r = UnityAssetTrim.processFile(odd, { output: output, even: true, padding: 0, alpha: 1 });
        assert(r.status === 'Success' && r.width === 8 && r.height === 10, 'English localization keeps crop behavior');
        UnityAssetTrimLanguage = 'zh';
        assert(app.documents.length === 0, 'no leaked test documents');
    } catch (e) { failures++; results.push('ERROR ' + e.message + ' line ' + e.line); }
    finally {
        app.preferences.rulerUnits = oldUnits;
        app.displayDialogs = oldDialogs;
        var log = File(UnityAssetTrimTestRoot.fsName + '/results/photoshop-results.txt'); log.encoding = 'UTF-8'; log.open('w');
        log.write(results.join('\n') + '\nFAILURES ' + failures); log.close();
    }
}());
