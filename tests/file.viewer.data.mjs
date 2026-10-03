import test from "node:test";
import assert from "node:assert/strict";
import { checkText, parseViewerCsv, parseViewerJson, viewerLimits, viewerSourceUrl, readViewerResponse } from "../js/ui/ui.file.viewer.data.js";
test("CSV preserves quoted commas, escaped quotes, newlines and empty final cells", () => {
  const result = parseViewerCsv('a,b,c\r\n"one,two","say ""yes""",\r\n"two\nlines",003,=1+1\r\n');
  assert.deepEqual(result.rows, [{id:0,c0:"one,two",c1:'say "yes"',c2:""}, {id:1,c0:"two\nlines",c1:"003",c2:"=1+1"}]);
});
test("CSV headers remain labels, including duplicates and prototype-like names", () => {
  assert.deepEqual(parseViewerCsv('__proto__,a,a\n1,2,3').columns.map(x=>x.key), ['c0','c1','c2']);
  assert.equal(parseViewerCsv('a,b\nc,d',{headers:false}).rows.length,2);
  assert.equal(parseViewerCsv('""',{headers:false}).rows[0].c0,"");
});
test("CSV malformed quotes and ragged records are rejected", () => {
  for (const text of ['a,b\n1', 'a\n"unterminated', 'a\nab"cd', 'a\n"x"oops']) assert.throws(()=>parseViewerCsv(text),SyntaxError);
});
test("CSV row/column/cell budgets reject without truncation", () => {
  assert.throws(()=>parseViewerCsv('a\n1\n2',{maxRows:1}),RangeError);
  assert.throws(()=>parseViewerCsv('a,b',{maxColumns:1}),RangeError);
  assert.throws(()=>parseViewerCsv('a\n1',{maxCells:1}),RangeError);
});
test("JSON parses data only and enforces depth and node budgets", () => {
  assert.equal(parseViewerJson('null'),null);
  assert.equal(parseViewerJson('{"__proto__":{"polluted":true}}').__proto__.polluted,true);
  assert.equal({}.polluted,undefined);
  assert.throws(()=>parseViewerJson('[1,2]',{maxNodes:2,maxDepth:3}),RangeError);
  assert.throws(()=>parseViewerJson('[[1]]',{maxNodes:10,maxDepth:1}),RangeError);
  assert.throws(()=>parseViewerJson('{x:1}'),SyntaxError);
});
test("UTF-8 byte bounds, BOM and source URL policy", () => {
  assert.equal(checkText('\uFEFF{}',20),'{}');
  assert.throws(()=>checkText('éé',3),RangeError);
  assert.throws(()=>viewerLimits('csv',{maxRows:30000}),RangeError);
  assert.equal(viewerSourceUrl('/file','https://example.org'),'https://example.org/file');
  for (const url of ['javascript:alert(1)','data:text/html,x','https://user:pass@example.org']) assert.throws(()=>viewerSourceUrl(url,'https://example.org'));
});
test("stream reader bounds decoded bytes, rejects invalid UTF-8 and honors cancellation", async () => {
  const signal = new AbortController().signal;
  assert.equal(await readViewerResponse(new Response('hello'),5,signal),'hello');
  await assert.rejects(readViewerResponse(new Response('hello'),4,signal),RangeError);
  await assert.rejects(readViewerResponse(new Response(new Uint8Array([255])),10,signal),TypeError);
  await assert.rejects(readViewerResponse(new Response('',{status:403}),10,signal),/HTTP 403/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(readViewerResponse(new Response('hello'),10,controller.signal),/abort/i);
});
