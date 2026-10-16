"""Package only the files in the public delivery manifest and verify every hash."""
import hashlib, json, pathlib, subprocess, zipfile
root = pathlib.Path(__file__).resolve().parents[1]
subprocess.run(['node', 'scripts/manifest.mjs'], cwd=root, check=True)
manifest = json.loads((root/'delivery/manifest.json').read_text(encoding='utf-8'))
version = json.loads((root/'package.json').read_text())['version']
target = root/f'delivery/household-repair-desk-v{version}-source.zip'
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
    for item in manifest['files']:
        name = item['path']
        assert not any(part in name.split('/') for part in ['.git','.local-browser','.voice-env','models','node_modules','data','raw','audio','rehearsal'])
        archive.write(root/name, arcname=name)
    archive.write(root/'delivery/manifest.json', arcname='manifest.json')
with zipfile.ZipFile(target) as archive:
    for item in manifest['files']:
        assert hashlib.sha256(archive.read(item['path'])).hexdigest() == item['sha256'], item['path']
print(json.dumps({'archive':target.name,'verifiedFiles':len(manifest['files']),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()},indent=2))
