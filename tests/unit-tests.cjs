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
