"""Mux continuous real UI recording, locally generated English speech, and captions."""
import hashlib, json, pathlib, re, subprocess, textwrap
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'video'

def run(args):
    subprocess.run(args, cwd=ROOT, check=True)

def stamp(t):
    n = round(t * 1000)
    return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'

scenes = json.loads((OUT / 'timeline.json').read_text(encoding='utf-8'))
recording = json.loads((OUT / 'recording.json').read_text(encoding='utf-8'))
offset = 0.0
captions = []
for scene in scenes:
    sentences = re.split(r'(?<=[.!?])\s+', scene['narration'])
    words_total = sum(len(s.split()) for s in sentences)
    position = 0
    for sentence in sentences:
        words = sentence.split()
        # Keep every caption short enough for two readable lines.
        chunks = [' '.join(words[i:i+13]) for i in range(0, len(words), 13)]
        for chunk in chunks:
            count = len(chunk.split())
            start = offset + scene['audioDuration'] * position / words_total
            end = offset + scene['audioDuration'] * (position + count) / words_total
            captions.append(f'{len(captions)+1}\n{stamp(start)} --> {stamp(end)}\n' + '\n'.join(textwrap.wrap(chunk, width=66)) + '\n')
            position += count
    offset += scene['duration']
(OUT / 'demo-en.srt').write_text('\n'.join(captions), encoding='utf-8')
inputs = []
filters = []
for i, scene in enumerate(scenes):
    inputs += ['-i', str(ROOT / scene['audioFile'])]
    filters.append(f'[{i}:a]aresample=48000,apad=pad_dur=0.8,atrim=duration={scene["duration"]},asetpts=PTS-STARTPTS[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(len(scenes))) + f'concat=n={len(scenes)}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=7[a]')
run(['ffmpeg','-y','-hide_banner','-loglevel','warning',*inputs,'-filter_complex',';'.join(filters),'-map','[a]','-c:a','pcm_s16le',str(OUT/'narration.wav')])
raw = pathlib.Path(recording['source'])
raw_duration = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(raw)], text=True))
# Page setup before the first scene is the only trim. No interface state is recreated.
captured_scene_duration = recording['marks'][-1]['start'] + recording['marks'][-1]['duration']
lead = max(0.0, raw_duration - captured_scene_duration)
vf = "scale=1440:810,pad=1600:900:80:0:color=0x202820,subtitles=video/demo-en.srt:force_style='FontName=Arial,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H00202820,BorderStyle=1,Outline=1,Shadow=0,MarginV=10',scale=1920:1080"
target = OUT / 'household-repair-desk-demo.mp4'
run(['ffmpeg','-y','-hide_banner','-loglevel','warning','-ss',str(lead),'-i',str(raw),'-i',str(OUT/'narration.wav'),'-t',str(offset),'-vf',vf,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','160k','-movflags','+faststart',str(target)])
probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(target)],text=True))
duration = float(probe['format']['duration'])
assert duration < 180, duration
assert any(s['codec_type']=='audio' for s in probe['streams'])
assert any(s.get('width')==1920 and s.get('height')==1080 for s in probe['streams'])
result = {'durationSeconds':duration,'resolution':'1920x1080','source':'continuous real app recording','trimmedSetupSeconds':lead,'voice':'Microsoft David Desktop, synthetic English narration','captions':'English burned-in and separate SRT; sentence/word-weight timing','sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'underThreeMinutes':True,'externalBooking':False,'alexaDeviceConnected':False,'qualifyingYouTubeOrVimeoPublic':False,'githubReviewCopyPublic':False}
(OUT/'video-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
