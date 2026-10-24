const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'UnityAssetTrim.jsx'), 'utf8').replace(/^#target.*$/mg, '');
for (const language of ['zh', 'en']) {
  const context = { UnityAssetTrimTestOnly: true, UnityAssetTrimLanguage: language };
  vm.createContext(context);
  vm.runInContext(source, context);
  for (let n = 1; n < 10000; n++) {
    assert.equal(context.UnityAssetTrim.evenSize(n, true), n + n % 2);
    assert.equal(context.UnityAssetTrim.evenSize(n, false), n);
  }
  assert.equal(context.uatText('成功'), language === 'zh' ? '成功' : 'Success');
  assert.equal(context.uatText('未翻译的字符串'), '未翻译的字符串');
  console.log(`PASS ${language}: script loads, dimension rules and localization`);
}

function dialogScenario(actions) {
  let shown = 0;
  const dialogs = [];
  function control(type, text, options) {
    const item = { type, text, options, preferredSize: {}, children: [], selection: null };
    item.add = function (kind, bounds, label, opts) {
      const child = control(kind, label, opts); item.children.push(child); return child;
    };
    return item;
  }
  function Window() {
    const win = control('dialog'); dialogs.push(win);
    win.close = value => { win.result = value; };
    win.show = () => {
      assert.ok(shown < actions.length, 'Cancel must not reopen the dialog');
      const action = actions[shown++];
      const descendants = [];
      function visit(node) { descendants.push(node); node.children.forEach(visit); } visit(win);
      if (action === 'language') {
        const dropdown = descendants.find(c => c.type === 'dropdownlist');
        dropdown.selection = { index: 1 }; dropdown.onChange();
      } else if (action === 'cancel-button') {
        descendants.find(c => c.options?.name === 'cancel').onClick();
      } else { return action; }
      return win.result;
    };
    return win;
  }
  const context = { UnityAssetTrimTestOnly: true, UnityAssetTrimLanguage: 'zh', Window };
  vm.createContext(context); vm.runInContext(source, context); context.UnityAssetTrim.main();
  assert.equal(shown, actions.length);
  return { context, dialogs, shown };
}
for (const cancel of [2, 0, 'cancel-button']) {
  assert.equal(dialogScenario([cancel]).shown, 1);
  const switched = dialogScenario(['language', cancel]);
  assert.equal(switched.shown, 2);
  assert.equal(switched.context.UnityAssetTrimLanguage, 'en');
}
console.log('PASS dialog lifecycle: Cancel, Escape/window close, language change then cancel');
