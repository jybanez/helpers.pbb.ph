/* Classic worker, copied beside pinned Draco WASM assets by the runtime build. */
importScripts('./draco_wasm_wrapper.js');
const moduleReady = DracoDecoderModule({locateFile: () => new URL('./draco_decoder.wasm',self.location.href).href});
let queue = Promise.resolve(), allocated = 0;
const types = {Float32Array:[Float32Array,'DT_FLOAT32'],Int8Array:[Int8Array,'DT_INT8'],Uint8Array:[Uint8Array,'DT_UINT8'],Int16Array:[Int16Array,'DT_INT16'],Uint16Array:[Uint16Array,'DT_UINT16'],Uint32Array:[Uint32Array,'DT_UINT32']};
self.onmessage = ({data}) => {
  queue = queue.then(async () => {
    const draco = await moduleReady;
    let decoder, mesh, status;
    try {
      decoder = new draco.Decoder(); mesh = new draco.Mesh();
      const input = new Int8Array(data.buffer);
      if (decoder.GetEncodedGeometryType(input) !== draco.TRIANGULAR_MESH) throw Error('Draco preview requires triangle meshes.');
      status = decoder.DecodeArrayToMesh(input,input.byteLength,mesh);
      if (!status.ok() || !mesh.ptr) throw Error('Invalid Draco geometry. Export the model again.');
      const points = mesh.num_points(), indices = mesh.num_faces()*3;
      const first = data.definitions[0];
      for (const def of data.definitions) {
        if (def.indices !== indices || def.points !== points || def.indexType!==first.indexType || JSON.stringify(def.attributes)!==JSON.stringify(first.attributes)) throw Error('Decoded Draco counts or attributes differ from validated accessors.');
      }
      let bytes = indices*4;
      const attributes = [];
      for (const [name,id] of Object.entries(data.ids)) {
        const spec = first.attributes[id], attr = decoder.GetAttributeByUniqueId(mesh,id), type = types[data.types[name]];
        if (!spec || !attr?.ptr || !type || attr.num_components() !== spec.size || points !== spec.count) throw Error('Decoded Draco attribute differs from validated accessor.');
        bytes += points*spec.size*type[0].BYTES_PER_ELEMENT;
        attributes.push({name,attr,type,itemSize:spec.size});
      }
      // Hard aggregate output ceiling before allocating transferable JS arrays.
      if (!Number.isSafeInteger(bytes) || bytes > 128*1024*1024-allocated) throw Error('Decoded Draco output exceeds the 128 MiB preview budget.');
      allocated += bytes;
      const copy = (length, Type, fill) => {
        const ptr = draco._malloc(length);
        if (!ptr) throw Error('Draco decoder memory limit reached. Export a smaller mesh.');
        try {if (!fill(ptr)) throw Error('Draco data extraction failed.');return new Type(draco.HEAPU8.buffer,ptr,length/Type.BYTES_PER_ELEMENT).slice();}
        finally {draco._free(ptr);}
      };
      const index = copy(indices*4,Uint32Array,ptr=>decoder.GetTrianglesUInt32Array(mesh,indices*4,ptr));
      for (const i of index) if (i >= points || (first.indexType===5123 && i>65535) || (first.indexType===5121 && i>255)) throw Error('Decoded Draco index exceeds its accessor range.');
      const output = attributes.map(({name,attr,type,itemSize}) => {
        const length=points*itemSize*type[0].BYTES_PER_ELEMENT;
        const array=copy(length,type[0],ptr=>decoder.GetAttributeDataArrayForAllPoints(mesh,attr,draco[type[1]],length,ptr));
        if (type[0]===Float32Array) for (const value of array) if (!Number.isFinite(value)) throw Error('Draco attribute contains non-finite values.');
        return {name,itemSize,array};
      });
      self.postMessage({id:data.id,index,attributes:output},[index.buffer,...output.map(a=>a.array.buffer)]);
    } finally {
      if (status) draco.destroy(status);
      if (mesh) draco.destroy(mesh);
      if (decoder) draco.destroy(decoder);
    }
  }).catch(error => self.postMessage({id:data.id,error:`Unable to decode Draco: ${error.message || 'decoder memory limit reached'}`}));
};
