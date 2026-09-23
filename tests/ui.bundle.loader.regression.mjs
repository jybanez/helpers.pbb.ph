import assert from "node:assert/strict";
import { createBundleLoader } from "../js/ui/ui.bundle.loader.js";

const links = [];
let fail = true;
let requests = 0;
const parent = {
  querySelectorAll: () => links,
  appendChild(link) {
    links.push(link);
    requests++;
    queueMicrotask(() => {
      if (!fail) link.sheet = {};
      link.dispatchEvent(new Event(fail ? "error" : "load"));
    });
  },
};
globalThis.document = {
  head: parent,
  createElement() {
    const link = new EventTarget();
    link.remove = () => links.splice(links.indexOf(link), 1);
    return link;
  },
};
try {
  const factory = () => "created";
  const loader = createBundleLoader({ test: { js: "./test.js?v=1", export: "factory" } },
    { "./test.js": { factory } }, "https://example.test/dist/helpers.ui.bundle.min.css?v=1");
  const failed = await Promise.allSettled([loader.get("test"), loader.get("test")]);
  assert.ok(failed.every((result) => result.status === "rejected"));
  assert.equal(requests, 1);
  assert.equal(links.length, 0);
  fail = false;
  assert.deepEqual(await Promise.all([loader.get("test"), loader.get("test")]), [factory, factory]);
  assert.equal(requests, 2);
  assert.equal(await loader.create("test"), "created");
  assert.equal(requests, 2);
  // A separate accessor reuses an already loaded stylesheet.
  await createBundleLoader({ test: { js: "./test.js" } }, { "./test.js": {} }, links[0].href).get("test");
  assert.equal(requests, 2);
  console.log("Bundle loader CSS deduplication, failure, retry, and reuse passed.");
} finally {
  delete globalThis.document;
}
