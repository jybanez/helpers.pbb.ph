param([Parameter(Mandatory = $true)][string]$OutputPath)

# Disposable synthesized English only. Does not access the physical microphone.
Add-Type -AssemblyName System.Speech
$speechFixturePath = [System.IO.Path]::GetFullPath($OutputPath)
$speechFixtureDirectory = [System.IO.Path]::GetDirectoryName($speechFixturePath)
[System.IO.Directory]::CreateDirectory($speechFixtureDirectory) | Out-Null
$speechFixtureSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $speechFixtureFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $speechFixtureSynth.SetOutputToWaveFile($speechFixturePath, $speechFixtureFormat)
    $speechFixturePrompt = New-Object System.Speech.Synthesis.PromptBuilder
    $speechFixturePrompt.StartVoice('Microsoft David Desktop')
    $speechFixturePrompt.AppendBreak([TimeSpan]::FromSeconds(2))
    $speechFixturePrompt.AppendText('Please open the door. The blue notebook is on the table. This is an offline recording test. We are testing English speech recognition.')
    $speechFixturePrompt.AppendBreak([TimeSpan]::FromSeconds(2))
    $speechFixturePrompt.AppendText('Please open the door. The blue notebook is on the table.')
    $speechFixturePrompt.EndVoice()
    $speechFixtureSynth.Speak($speechFixturePrompt)
} finally {
    $speechFixtureSynth.Dispose()
}
Get-FileHash -Algorithm SHA256 -LiteralPath $speechFixturePath
