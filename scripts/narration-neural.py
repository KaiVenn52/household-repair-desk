"""Local stock neural narration. No account, paid API, or voice cloning."""
import hashlib, json, os, pathlib, time
os.environ.setdefault('OMP_NUM_THREADS','2')
import soundfile as sf
from kokoro_onnx import Kokoro, EspeakConfig
import ctypes, espeakng_loader
from phonemizer.backend.espeak.wrapper import EspeakWrapper
root=pathlib.Path(__file__).absolute().parents[1]
model=root/'video/models/kokoro-v1.0.onnx'
assert hashlib.sha256(model.read_bytes()).hexdigest()=='beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a'
data_path=espeakng_loader.get_data_path()
os.environ['ESPEAK_DATA_PATH']=os.path.relpath(data_path,root)
os.chdir(root)
if os.name=='nt':
    # espeak's C file loader needs the Windows short path for Unicode workspaces.
    buf=ctypes.create_unicode_buffer(32768)
    if ctypes.windll.kernel32.GetShortPathNameW(data_path,buf,len(buf)):
        data_path=buf.value
    # Keep an ASCII subst drive intact: pathlib.resolve would expand it to Unicode.
    if data_path.isascii():
        EspeakWrapper.data_path=property(lambda self:pathlib.Path(data_path))
kokoro=Kokoro(str(model),str(root/'video/models/voices-v1.0.bin'),espeak_config=EspeakConfig(data_path=data_path))
out=root/'video/v2/audio';out.mkdir(parents=True,exist_ok=True)
scenes=json.loads((root/'video/v2/scenes.json').read_text(encoding='utf-8'))
for scene in scenes:
    target=out/(scene['id']+'.wav')
    if not target.exists():
        began=time.monotonic()
        samples,rate=kokoro.create(scene['narration'],voice='af_heart',speed=0.99,lang='en-us',sentence_pause=0.28,clause_pause=0.12)
        sf.write(target,samples,rate,subtype='PCM_16')
        print(scene['id'],'rendered in',round(time.monotonic()-began,1),'seconds',flush=True)
    info=sf.info(target)
    minimum={'budget':12,'plan':11.5,'source':8,'replan':10,'consent':9,'proof':10}.get(scene['id'],0)
    scene['audioDuration']=info.duration;scene['duration']=max(info.duration+0.65,minimum)
    scene['audioFile']=target.relative_to(root).as_posix()
    scene['voice']='Kokoro af_heart, stock synthetic English voice, local inference'
(root/'video/v2/timeline.json').write_text(json.dumps(scenes,indent=2),encoding='utf-8')
print('Narration duration:',round(sum(s['duration'] for s in scenes),2),flush=True)
