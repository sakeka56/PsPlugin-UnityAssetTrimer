const geometry = require('./geometry.js');

function createOperations(ps) {
  const { app, core, imaging, constants, action } = ps;
  function activeID() { if (!app.documents.length) throw new Error('NO_DOCUMENT'); return app.activeDocument.id; }
  function documentByID(id) {
    const doc = app.documents.find(item => item.id === id);
    if (!doc) throw new Error('DOCUMENT_CLOSED');
    return doc;
  }
  async function boundsFor(doc, alpha, context) {
    let bounds = null;
    // Bound working memory for large layered PSDs; every tile stays at native resolution.
    const width = Math.round(doc.width), height = Math.round(doc.height);
    for (let top = 0; top < height; top += 128) {
      if (context.isCancelled) throw new Error('CANCELLED');
      const result = await imaging.getPixels({ documentID: doc.id,
        sourceBounds: { left: 0, top, right: width, bottom: Math.min(height, top + 128) },
        colorSpace: 'RGB', componentSize: 8, applyAlpha: false });
      if (!result.imageData) continue;
      const image = result.imageData;
      try {
        if (result.level !== 0) throw new Error('PIXEL_RESOLUTION');
        if (image.width && image.height) {
          const data = await image.getData({ chunky: true });
          bounds = geometry.union(bounds, geometry.scanPixels(data, image.width, image.height, image.components, alpha, result.sourceBounds));
        }
      } finally { image.dispose(); }
    }
    return bounds;
  }
  async function rejectArtboards(doc) {
    const descriptors = await action.batchPlay([{ _obj: 'get', _target: [{ _ref: 'document', _id: doc.id }], _options: { dialogOptions: 'dontDisplay' } }], {});
    if (descriptors[0]?.artboards?.list?.length) throw new Error('ARTBOARDS');
  }
  async function trimDocument(doc, config, context) {
    await rejectArtboards(doc);
    const before = { width: Math.round(doc.width), height: Math.round(doc.height) };
    const bounds = await boundsFor(doc, config.alpha, context);
    if (!bounds) return { skipped: true, ...before };
    const plan = geometry.canvasPlan(before.width, before.height, bounds, config);
    // A background layer cannot expose transparency when the canvas is extended.
    if (doc.backgroundLayer && plan.some(step => step.width > before.width || step.height > before.height)) throw new Error('BACKGROUND_PADDING');
    for (const step of plan) {
      if (context.isCancelled) throw new Error('CANCELLED');
      await doc.resizeCanvas(step.width, step.height, constants.AnchorPosition[step.anchor]);
    }
    return { skipped: false, changed: plan.length > 0, before, width: Math.round(doc.width), height: Math.round(doc.height) };
  }
  async function trimCurrent(id, settings) {
    const config = geometry.options(settings);
    return core.executeAsModal(async context => {
      const doc = documentByID(id);
      const history = await context.hostControl.suspendHistory({ documentID: id, name: 'Unity Asset Trim — canvas' });
      try {
        const result = await trimDocument(doc, config, context);
        await context.hostControl.resumeHistory(history, true);
        return result;
      } catch (error) {
        if (!context.isCancelled) await context.hostControl.resumeHistory(history, false);
        throw error;
      }
    }, { commandName: 'Trim current canvas' });
  }
  async function exportCurrent(id, entry, settings) {
    const config = geometry.options(settings);
    if (!entry) return { cancelled: true };
    return core.executeAsModal(async context => {
      const source = documentByID(id);
      let copy;
      try {
        copy = await source.duplicate('Unity Asset Trim export', true);
        context.hostControl.registerAutoCloseDocument(copy.id);
        const result = await trimDocument(copy, config, context);
        if (result.skipped) return result;
        // PNG normalization happens exclusively on the export duplicate.
        if (copy.mode !== constants.DocumentMode.RGB || copy.bitsPerChannel !== constants.BitsPerChannelType.EIGHT) {
          const converted = await action.batchPlay([{ _obj: 'convertMode', to: { _class: 'RGBColorMode' }, depth: 8, merge: true, _options: { dialogOptions: 'dontDisplay' } }], {});
          if (converted[0]?._obj === 'error') throw new Error(converted[0].message);
        }
        await copy.saveAs.png(entry, { compression: 6, interlaced: false }, true);
        return { ...result, exported: true, path: entry.nativePath };
      } finally {
        if (copy && !context.isCancelled) {
          await copy.closeWithoutSaving();
          context.hostControl.unregisterAutoCloseDocument(copy.id);
        }
      }
    }, { commandName: 'Trim and export current document' });
  }
  async function openBatch() {
    const result = await action.batchPlay([{ _obj: 'get', _target: [{ _property: 'menuBarInfo' }, { _ref: 'application', _enum: 'ordinal', _value: 'targetEnum' }] }], {});
    const commandID = geometry.findBatchCommand(result);
    if (commandID === null) throw new Error('BATCH_NOT_INSTALLED');
    const ok = await core.performMenuCommand({ commandID });
    if (!ok) throw new Error('BATCH_UNAVAILABLE');
  }
  return { activeID, trimCurrent, exportCurrent, openBatch, boundsFor, trimDocument };
}
module.exports = { createOperations };
