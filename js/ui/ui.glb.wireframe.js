// Preserve the exact materials (including arrays/shared references) and their flags.
export function createWireframeMode(model) {
  const originals=new Map();
  model.traverse(node=>{
    if (!node.isMesh) return;
    for (const material of Array.isArray(node.material)?node.material:[node.material]) {
      if (material && 'wireframe' in material && !originals.has(material)) originals.set(material,material.wireframe);
    }
  });
  let enabled=false,disposed=false;
  return {
    set(value){
      if(disposed)return false;
      enabled=Boolean(value);
      for(const [material,original] of originals) material.wireframe=enabled?true:original;
      return enabled;
    },
    get:()=>enabled,
    dispose(){if(disposed)return;for(const [material,original] of originals)material.wireframe=original;originals.clear();enabled=false;disposed=true;}
  };
}
