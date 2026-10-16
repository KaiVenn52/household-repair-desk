"""Generate English demo narration from project-owned text using Edge TTS.
No credentials or browser profile access. Requires installed edge-tts and ffprobe.
"""
import asyncio, json, pathlib, subprocess
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]

async def main():
    scenes = json.loads((ROOT / 'video/scenes.json').read_text(encoding='utf-8'))
    out = ROOT / 'video/audio'
    out.mkdir(parents=True, exist_ok=True)
    for scene in scenes:
        target = out / (scene['id'] + '.mp3')
        if not target.exists():
            await edge_tts.Communicate(scene['narration'], 'en-US-GuyNeural', rate='+3%').save(str(target))
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(target)], text=True))
        scene['audioDuration'] = duration
        scene['duration'] = duration + 0.8
        print(scene['id'], round(duration, 2), flush=True)
    (ROOT / 'video/timeline.json').write_text(json.dumps(scenes, indent=2), encoding='utf-8')

if __name__ == '__main__':
    asyncio.run(main())
