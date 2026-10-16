$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$projectRoot = Split-Path -Parent $PSScriptRoot
$scenes = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'video\scenes.json') | ConvertFrom-Json
$audioDir = Join-Path $projectRoot 'video\audio'
New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$english = $speaker.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'en-US' } | Select-Object -First 1
if (-not $english) { throw 'No installed en-US voice available.' }
$speaker.SelectVoice($english.VoiceInfo.Name)
$speaker.Rate = 0
foreach ($scene in $scenes) {
    $outputPath = Join-Path $audioDir ($scene.id + '.wav')
    $speaker.SetOutputToWaveFile($outputPath)
    $speaker.Speak($scene.narration)
    $speaker.SetOutputToNull()
    $duration = [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $outputPath)
    $scene | Add-Member -NotePropertyName audioDuration -NotePropertyValue $duration -Force
    $scene | Add-Member -NotePropertyName duration -NotePropertyValue ($duration + 0.8) -Force
    $scene | Add-Member -NotePropertyName audioFile -NotePropertyValue ('video/audio/' + $scene.id + '.wav') -Force
    Write-Output ($scene.id + ': ' + [math]::Round($duration, 2) + 's')
}
$speaker.Dispose()
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $projectRoot 'video\timeline.json'), ($scenes | ConvertTo-Json -Depth 5), $encoding)
Write-Output ('Voice: ' + $english.VoiceInfo.Name)
