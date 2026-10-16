"""Download the public Apache-2.0 Kokoro model in resumable HTTP ranges."""
import concurrent.futures, hashlib, pathlib, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]/'video/models'
root.mkdir(parents=True,exist_ok=True)
url='https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx'
size=325505369
chunk=8*1024*1024
expected='beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a'
def get(index):
    start=index*chunk; end=min(size-1,start+chunk-1); part=root/f'model.part-{index:03}'
    if part.exists() and part.stat().st_size==end-start+1: return part
    for attempt in range(3):
        try:
            req=urllib.request.Request(f'{url}?segment={index}',headers={'Range':f'bytes={start}-{end}','User-Agent':'HouseholdRepairDesk-model-setup/0.2'})
            with urllib.request.urlopen(req,timeout=45) as response:
                if response.status!=206: raise RuntimeError(f'Expected range response, got {response.status}')
                assert response.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/')
                with part.open('wb') as output:
                    while block:=response.read(256*1024): output.write(block)
            assert part.stat().st_size==end-start+1
            print(f'Model segment {index+1}/{(size+chunk-1)//chunk} verified',flush=True); return part
        except Exception as error:
            print(f'Segment {index+1} retry {attempt+1}: {type(error).__name__}',flush=True)
            if attempt==2: raise
indices=range((size+chunk-1)//chunk)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: parts=list(pool.map(get,indices))
target=root/'kokoro-v1.0.onnx'
with target.open('wb') as output:
    for part in parts: output.write(part.read_bytes())
assert hashlib.sha256(target.read_bytes()).hexdigest()==expected
print('Full model SHA-256 verified.',flush=True)
