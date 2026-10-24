#target photoshop
(function () {
    var root = File($.fileName).parent;
    var file = File(root.parent.fsName + '/src/UnityAssetTrim.jsx'); file.encoding = 'UTF-8'; file.open('r');
    var source = file.read().replace(/^#target.*$/mg, ''); file.close();
    var nativeWindow = Window, lines = [], failures = 0;
    function scenario(actions) {
        var shown = 0;
        function testWindow(type, title) {
            var win = new nativeWindow(type, title);
            if (type === 'dialog') {
                if (shown >= actions.length) { throw Error('Dialog reopened after cancellation'); }
                var action = actions[shown++];
                // The external helper drives the native dialog after it is visible.
                // Closing inside onShow is too early for Photoshop's native window.
                win.text = 'UAT regression 1.0.1 ' + action;
            }
            return win;
        }
        var load = new Function('Window', 'var UnityAssetTrimTestOnly=true; var UnityAssetTrimLanguage="zh";\n' + source + '\nreturn UnityAssetTrim;');
        var tool = load(testWindow);
        tool.main();
        if (shown !== actions.length) { throw Error('Unexpected dialog count'); }
        lines.push('PASS native ScriptUI ' + actions.join(' -> ') + ' dialogs=' + shown);
    }
    try {
        // Cancel/button, Escape and language switching are covered by the
        // deterministic unit scenarios; exercise native window-close here.
        scenario(['window-close']);
    } catch (error) { failures++; lines.push('FAIL ' + error.message + ' line ' + error.line); }
    var log = File(root.fsName + '/results/dialog-results.txt'); log.encoding = 'UTF-8'; log.open('w');
    log.write(lines.join('\n') + '\nFAILURES ' + failures); log.close();
}());
