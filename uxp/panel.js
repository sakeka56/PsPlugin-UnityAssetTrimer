const ps = require('photoshop');
const { entrypoints, storage } = require('uxp');
const { createOperations } = require('./operations.js');
const geometry = require('./geometry.js');
const ops = createOperations(ps);
const $ = id => document.getElementById(id);
let language = /^zh/i.test(require('uxp').host.uiLocale || '') ? 'zh' : 'en', busy = false, timer;
const text = {
  zh: { heading: '画布裁剪', intro: '收紧透明边缘，保留原始图案比例。', documentLabel: '当前文档', none: '尚未打开文档', evenLabel: '宽高保持偶数', alphaLabel: '忽略边缘 Alpha ≤', paddingLabel: '额外留边（每侧像素）', trim: '裁剪当前文档', trimHint: '只调整画布；保留图层、不保存，可一步撤销。', export: '裁剪当前图片并导出…', exportHint: '在副本中裁剪并导出 PNG，当前 PSD 保持不变。', batch: '批量裁剪图片…', batchHint: '打开原有的批量图片与文件夹处理窗口。', working: '正在处理…', skipped: '没有高于阈值的可见像素，未作修改。', done: '完成：', unchanged: '画布已经符合设置。', saved: 'PNG 已导出：', NO_DOCUMENT: '请先打开一个文档。', DOCUMENT_CLOSED: '所选文档已关闭，请重试。', ALPHA_RANGE: 'Alpha 阈值请输入 0～254 的整数。', PADDING_RANGE: '留边请输入 0～4096 的整数。', ARTBOARDS: '当前为多画板文档，请先将目标画板另存为普通文档。', BACKGROUND_PADDING: '背景图层无法添加透明边，请先将背景转换为普通图层。', BATCH_NOT_INSTALLED: '请先用安装器安装批量脚本并重启 PS，然后重试。', BATCH_UNAVAILABLE: '暂时无法打开批量窗口，请结束其他对话框后重试。', CANCELLED: '操作已取消。' },
  en: { heading: 'Trim canvas', intro: 'Tighten transparent borders. Keep artwork at its original scale.', documentLabel: 'ACTIVE DOCUMENT', none: 'No document open', evenLabel: 'Keep even dimensions', alphaLabel: 'Ignore edge alpha ≤', paddingLabel: 'Padding (pixels per side)', trim: 'Trim current document', trimHint: 'Canvas only. Keeps layers, never saves. One-step undo.', export: 'Trim current image and export…', exportHint: 'Export a cropped PNG copy. Your current PSD stays unchanged.', batch: 'Batch-trim images…', batchHint: 'Open the existing image and folder batch window.', working: 'Working…', skipped: 'No visible pixels above the threshold. Nothing changed.', done: 'Complete: ', unchanged: 'Canvas already matches these settings.', saved: 'PNG exported: ', NO_DOCUMENT: 'Open a document first.', DOCUMENT_CLOSED: 'The selected document was closed. Try again.', ALPHA_RANGE: 'Alpha must be an integer from 0 to 254.', PADDING_RANGE: 'Padding must be an integer from 0 to 4096.', ARTBOARDS: 'Save the target artboard as a regular document first.', BACKGROUND_PADDING: 'Convert the background into a regular layer to add transparent padding.', BATCH_NOT_INSTALLED: 'Install the batch script with Setup, restart Photoshop and try again.', BATCH_UNAVAILABLE: 'Close other dialogs before opening the batch window.', CANCELLED: 'Operation cancelled.' }
};
const t = key => text[language][key] || key;
function refresh() {
  const doc = ps.app.documents.length ? ps.app.activeDocument : null;
  $('documentName').textContent = doc ? `${doc.title} · ${doc.width} × ${doc.height}` : t('none');
  $('documentName').title = doc ? doc.title : '';
  $('trim').disabled = $('export').disabled = busy || !doc;
  $('batch').disabled = busy;
  $('language').disabled = busy;
}
function localize() {
  for (const id of ['heading', 'intro', 'documentLabel', 'evenLabel', 'alphaLabel', 'paddingLabel', 'trim', 'trimHint', 'export', 'exportHint', 'batch', 'batchHint']) $(id).textContent = t(id);
  $('language').value = language; refresh();
}
function settings() { return geometry.options({ even: $('even').checked, alpha: $('alpha').value, padding: $('padding').value }); }
async function run(action) {
  if (busy) return;
  busy = true; $('status').className = ''; $('status').textContent = t('working'); refresh();
  try { await action(); }
  catch (error) { $('status').className = 'error'; $('status').textContent = t(error.message) === error.message ? error.message : t(error.message); }
  finally { busy = false; refresh(); }
}
$('language').addEventListener('change', () => { language = $('language').value; $('status').textContent = ''; localize(); });
$('trim').addEventListener('click', () => run(async () => {
  const result = await ops.trimCurrent(ops.activeID(), settings());
  $('status').textContent = result.skipped ? t('skipped') : !result.changed ? t('unchanged') : `${t('done')}${result.width} × ${result.height}`;
}));
$('export').addEventListener('click', () => run(async () => {
  const id = ops.activeID(), config = settings();
  const name = ps.app.activeDocument.title.replace(/\.[^.]+$/, '') + '.png';
  const entry = await storage.localFileSystem.getFileForSaving(name, { types: ['png'] });
  if (!entry) { $('status').textContent = t('CANCELLED'); return; }
  const result = await ops.exportCurrent(id, entry, config);
  $('status').textContent = result.skipped ? t('skipped') : t('saved') + entry.nativePath;
}));
$('batch').addEventListener('click', () => run(async () => { await ops.openBatch(); $('status').textContent = ''; }));
entrypoints.setup({ panels: { trimPanel: {
  show() { localize(); if (!timer) timer = setInterval(refresh, 1000); },
  hide() { clearInterval(timer); timer = null; },
  destroy() { clearInterval(timer); timer = null; }
} } });
localize();
