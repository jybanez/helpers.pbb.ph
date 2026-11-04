# Synthetic room/prop fixture, generated locally; no third-party model assets.
import json,struct,zlib,binascii
from pathlib import Path
faces=[([1,0,0],[[1,-1,-1],[1,-1,1],[1,1,1],[1,1,-1]]),([-1,0,0],[[-1,-1,1],[-1,-1,-1],[-1,1,-1],[-1,1,1]]),([0,1,0],[[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]]),([0,-1,0],[[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1]]),([0,0,1],[[1,-1,1],[-1,-1,1],[-1,1,1],[1,1,1]]),([0,0,-1],[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]])]
pos=[];norm=[];uv=[];indices=[]
for n,verts in faces:
 base=len(pos)//3
 for v,t in zip(verts,[[0,0],[1,0],[1,1],[0,1]]):pos+=v;norm+=n;uv+=t
 indices += [base,base+1,base+2,base,base+2,base+3]
def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',binascii.crc32(t+b)&0xffffffff)
pixels=b''.join(b'\0'+b''.join(bytes(([220,150,60] if (x+y)%2 else [40,110,160])) for x in range(8)) for y in range(8))
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',8,8,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(pixels))+chunk(b'IEND',b'')
parts=[struct.pack('<%sf'%len(pos),*pos),struct.pack('<%sf'%len(norm),*norm),struct.pack('<%sf'%len(uv),*uv),struct.pack('<%sH'%len(indices),*indices),png]
binary=b'';views=[]
for part in parts:
 views.append({'buffer':0,'byteOffset':len(binary),'byteLength':len(part)})
 binary+=part;binary+=b'\0'*(-len(binary)%4)
doc={'asset':{'version':'2.0','generator':'Helper synthetic fixture'},'scene':0,'scenes':[{'nodes':[0,1,2]}],'nodes':[{'mesh':0,'scale':[3,.1,2],'translation':[0,-1,0]},{'mesh':0,'scale':[.6,.8,.6],'translation':[-1,0,0]},{'mesh':0,'scale':[.35,.4,.35],'translation':[1,-.5,.3]}],'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'TEXCOORD_0':2},'indices':3,'material':0}]}],'accessors':[{'bufferView':0,'componentType':5126,'count':24,'type':'VEC3','min':[-1,-1,-1],'max':[1,1,1]},{'bufferView':1,'componentType':5126,'count':24,'type':'VEC3'},{'bufferView':2,'componentType':5126,'count':24,'type':'VEC2'},{'bufferView':3,'componentType':5123,'count':36,'type':'SCALAR'}],'materials':[{'doubleSided':True,'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':0,'roughnessFactor':.8}}],'textures':[{'source':0}],'images':[{'bufferView':4,'mimeType':'image/png'}],'bufferViews':views,'buffers':[{'byteLength':len(binary)}]}
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*(-len(j)%4)
Path('tests/fixtures/textured-room.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)

# Required specular extension with embedded intensity and color texture maps.
doc['extensionsUsed']=['KHR_materials_specular']
doc['extensionsRequired']=['KHR_materials_specular']
doc['materials'][0]['extensions']={'KHR_materials_specular':{'specularFactor':0.8,'specularColorFactor':[0.8,0.9,1.0],'specularTexture':{'index':0},'specularColorTexture':{'index':0}}}
doc['materials'][0]['pbrMetallicRoughness']['roughnessFactor']=0.25
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*(-len(j)%4)
Path('tests/fixtures/specular-room.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)

# Parent-with-child exporter pivot convention and ordinary descriptive extras.
import copy
for label,pivot in [('string','hinge near the trunk'),('numeric',[1,0,0]),('container',None)]:
    model=copy.deepcopy(doc)
    model['nodes']=[{'name':'parent','translation':[2,1,0],'rotation':[0,0,0.7071067811865476,0.7071067811865476],'children':[1],'extras':{'description':'Synthetic parent','pivot':pivot}}, {'mesh':0,'translation':[-1,0,0]}]
    if label=='container':del model['nodes'][0]['extras']['pivot']
    model['scenes']=[{'nodes':[0]}]
    j=json.dumps(model,separators=(',',':')).encode();j+=b' '*(-len(j)%4)
    Path(f'tests/fixtures/pivot-{label}.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)

# Optional variant mappings must leave the specular base material unchanged.
model=copy.deepcopy(doc)
model['extensionsUsed'].append('KHR_materials_variants')
model['extensionsRequired']=[]
model['extensions']={'KHR_materials_variants':{'variants':[{'name':'Magenta alternate'}]}}
model['materials'].append({'pbrMetallicRoughness':{'baseColorFactor':[1,0,1,1]}})
model['meshes'][0]['primitives'][0]['extensions']={'KHR_materials_variants':{'mappings':[{'material':1,'variants':[0]}]}}
for label in ['optional','required']:
    if label=='required':model['extensionsRequired']=['KHR_materials_variants']
    j=json.dumps(model,separators=(',',':')).encode();j+=b' '*(-len(j)%4)
    Path(f'tests/fixtures/variants-{label}.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)

# Unsupported optional payloads include a real Three material handler.
model=copy.deepcopy(doc)
model['extensionsUsed']+=['EXT_helper_invented','KHR_materials_transmission']
model['extensionsRequired']=[]
model['extensions']={'EXT_helper_invented':{'note':'standard fallback'}}
model['materials'][0]['extensions']['KHR_materials_transmission']={'transmissionFactor':1}
for label in ['optional','required']:
    if label=='required':model['extensionsRequired']=['EXT_helper_invented']
    j=json.dumps(model,separators=(',',':')).encode();j+=b' '*(-len(j)%4)
    Path(f'tests/fixtures/extensions-{label}.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)
