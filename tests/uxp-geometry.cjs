const assert = require('node:assert/strict');
const g = require('../uxp/geometry');
const rgba = new Uint8Array(20 * 18 * 4);
for (let y = 4; y < 13; y++) for (let x = 3; x < 10; x++) rgba[(y * 20 + x) * 4 + 3] = 255;
rgba[3] = 1;
assert.deepEqual(g.scanPixels(rgba,20,18,4,1),{left:3,top:4,right:10,bottom:13});
assert.deepEqual(g.scanPixels(rgba,20,18,4,0),{left:0,top:0,right:10,bottom:13});
assert.equal(g.scanPixels(new Uint8Array(16),2,2,4,0),null);
for (const even of [true,false]) for(const padding of [0,1,2,5]) {
  const plan = g.canvasPlan(20,18,{left:3,top:4,right:10,bottom:13},{even,padding,alpha:1});
  const last = plan[plan.length-1];
  assert.equal(last.width,7+2*padding+(even?1:0));
  assert.equal(last.height,9+2*padding+(even?1:0));
  // Simulate canvas anchors: every surviving source pixel keeps its relative spacing.
  let w=20,h=18,x=3,y=4;
  for(const step of plan){if(step.anchor==='BOTTOMRIGHT'){x+=step.width-w;y+=step.height-h;}else if(step.anchor==='MIDDLECENTER'){x+=(step.width-w)/2;y+=(step.height-h)/2;} w=step.width;h=step.height;}
  assert.equal(x,padding);assert.equal(y,padding);
}
assert.throws(()=>g.options({alpha:255}),/ALPHA_RANGE/);
assert.throws(()=>g.options({padding:-1}),/PADDING_RANGE/);
assert.equal(g.findBatchCommand({submenu:[{title:'Unity Asset Trim',command:123}]}),123);
assert.equal(g.findBatchCommand({submenu:[{title:'Other',command:123}]}),null);
console.log('PASS UXP bounds, alpha, even dimensions, anchors, options, batch menu lookup');
