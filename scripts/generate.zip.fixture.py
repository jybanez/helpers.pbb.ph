"""Synthetic ZIP fixtures; no user data or third-party archive contents."""
import io, zipfile, struct
from pathlib import Path
root=Path('tests/fixtures')
def build(entries):
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w') as z:
        for name,data,method in entries:
            info=zipfile.ZipInfo(name,(2026,1,1,0,0,0));info.compress_type=method
            z.writestr(info,data)
    return out.getvalue()
valid=build([('models/',b'',0),('models/room.glb',(root/'specular-room.glb').read_bytes(),8),('notes/readme.txt',b'Synthetic archive preview.\n',0)])
(root/'preview.zip').write_bytes(valid)
(root/'zip-traversal.zip').write_bytes(build([('../escape.txt',b'blocked',0)]))
(root/'zip-duplicate.zip').write_bytes(build([('A.txt',b'one',0),('a.txt',b'two',0)]))
bomb=bytearray(build([('expanded.txt',b'a'*1000000,8)]))
c=bomb.index(b'PK\x01\x02');struct.pack_into('<I',bomb,22,1);struct.pack_into('<I',bomb,c+24,1)
(root/'zip-expansion.zip').write_bytes(bomb)
bad=bytearray(valid);c=bad.index(b'PK\x01\x02');struct.pack_into('<I',bad,c+42,0xffffff00)
(root/'zip-range.zip').write_bytes(bad)
bad=bytearray(build([('crc.txt',b'Integrity check',0)]));bad[30+len('crc.txt')]^=1
(root/'zip-crc.zip').write_bytes(bad)
# Non-seekable writer creates ordinary signed data descriptors.
class Stream(io.BytesIO):
    def seekable(self): return False
    def seek(self,*args): raise io.UnsupportedOperation()
out=Stream()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:z.writestr('streamed.txt',b'Data descriptor')
(root/'zip-descriptor.zip').write_bytes(out.getvalue())

(root/'zip-grid.zip').write_bytes(build([('models/',b'',0),('models/room.glb',(root/'specular-room.glb').read_bytes(),8),('notes/readme.txt',b'Synthetic archive preview.\n',0),('root.txt',b'x'*2048,8)]+[(f'notes/file-{i:02}.txt',b'example',0) for i in range(30)]))
