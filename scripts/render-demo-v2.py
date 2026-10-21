"""Render the real 16:9 browser recording with stock neural narration."""
import hashlib,json,pathlib,re,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
import os,sys
os.chdir(ROOT)
output=sys.argv[1] if len(sys.argv)>1 else 'video/v2'
assert re.fullmatch(r'video/v\d+',output),'Use a project-local video/vN output folder.'
OUT=pathlib.Path(output)
def run(args): subprocess.run(args,cwd=ROOT,check=True)
def stamp(t):
    n=round(t*1000)
    return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
scenes=json.loads((OUT/'timeline.json').read_text(encoding='utf-8'))
recording=json.loads((OUT/'recording.json').read_text(encoding='utf-8'))
captions=[];offset=0
for scene,mark in zip(scenes,recording['marks']):
    words=scene['narration'].split();chunks=[];chunk=[]
    for word in words:
        if chunk and (len(chunk)>=7 or len(' '.join(chunk+[word]))>54):
            chunks.append(chunk);chunk=[]
        chunk.append(word)
    if chunk: chunks.append(chunk)
    position=0
    for chunk in chunks:
        start=mark['start']+scene['audioDuration']*position/len(words)
        position+=len(chunk)
        end=mark['start']+scene['audioDuration']*position/len(words)
        captions.append(f'{len(captions)+1}\n{stamp(start)} --> {stamp(end)}\n'+ ' '.join(chunk)+'\n')
    offset=mark['start']+scene['duration']
(OUT/'demo-en.srt').write_text('\n'.join(captions),encoding='utf-8')
inputs=[];filters=[]
for i,(scene,mark) in enumerate(zip(scenes,recording['marks'])):
    end=recording['marks'][i+1]['start'] if i+1<len(scenes) else offset
    inputs+=['-i',scene['audioFile']]
    filters.append(f'[{i}:a]aresample=48000,apad,atrim=duration={end-mark["start"]},asetpts=PTS-STARTPTS[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(len(scenes)))+f'concat=n={len(scenes)}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=7[a]')
run(['ffmpeg','-y','-hide_banner','-loglevel','warning',*inputs,'-filter_complex',';'.join(filters),'-map','[a]','-c:a','pcm_s16le',str(OUT/'narration.wav')])
raw=pathlib.Path(recording['source']).relative_to(ROOT)
raw_duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(raw)],text=True))
# Detect the discarded sync slate in encoded frames, not wall-clock duration.
rate_text=subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=avg_frame_rate','-of','default=nw=1:nk=1',str(raw)],text=True).strip()
numerator,denominator=map(float,rate_text.split('/'));fps=numerator/denominator
pixels=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(raw),'-vf','crop=2:2:0:0','-pix_fmt','rgb24','-f','rawvideo','pipe:1'])
slate=[i//12 for i in range(0,len(pixels),12) if pixels[i]>220 and pixels[i+1]<35 and pixels[i+2]>220]
assert slate,'Missing encoded synchronization slate'
lead=(max(slate)+1)/fps
vf=f"scale=1920:1080,subtitles={OUT.as_posix()}/demo-en.srt:force_style='FontName=Arial,FontSize=10,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1.3,Shadow=0,MarginV=14'"
target=OUT/'household-repair-desk-demo.mp4'
run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-ss',str(lead),'-i',str(raw),'-i',str(OUT/'narration.wav'),'-t',str(offset),'-vf',vf,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','160k','-movflags','+faststart',str(target)])
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(target)],text=True))
duration=float(probe['format']['duration'])
assert duration<180
assert any(s['codec_type']=='audio' for s in probe['streams'])
assert any(s.get('width')==1920 and s.get('height')==1080 for s in probe['streams'])
result={'durationSeconds':duration,'resolution':'1920x1080','source':'continuous real app recording; fixture household; actual HTTP MCP calls','trimmedSetupSeconds':lead,'voice':'Kokoro af_heart, stock synthetic voice, local inference; no voice cloning','captions':'single-line English; word-weighted timing; separate SRT','sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'underThreeMinutes':True,'alexaDeviceConnected':False,'qualifyingYouTubeOrVimeoPublic':False}
(OUT/'video-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
