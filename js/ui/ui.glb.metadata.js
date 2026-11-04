// GLTFLoader 0.187.0 uses extras.pivot as a private exporter convention.
// Ordinary descriptive extras must not be interpreted as transform vectors.
export function sanitizeNodePivots(json) {
  for (const node of json.nodes || []) {
    const extras = node?.extras;
    if (!extras || typeof extras !== 'object' || !Object.hasOwn(extras, 'pivot')) continue;
    const pivot = extras.pivot;
    if (Array.isArray(pivot) && pivot.length === 3 && pivot.every(value => typeof value === 'number' && Number.isFinite(value))) continue;
    // Parser JSON is detached from input bytes. Copy extras before removing only
    // the unsupported transform hint; preserve all other descriptive metadata.
    node.extras = {...extras};
    delete node.extras.pivot;
  }
}
