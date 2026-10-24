param([Parameter(Mandatory=$true)][string]$Package)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Normalize-Json($Value) {
    if ($Value -is [System.Management.Automation.PSCustomObject]) {
        $sorted=[ordered]@{}
        foreach($property in ($Value.PSObject.Properties | Sort-Object Name)) { $sorted[$property.Name]=Normalize-Json $property.Value }
        return $sorted
    }
    if ($Value -is [Array]) { return ,@($Value | ForEach-Object { Normalize-Json $_ }) }
    return $Value
}
$archive=[IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Package).Path)
try {
    $expected=@(Get-ChildItem -LiteralPath (Join-Path $root 'uxp') -Recurse -File | Where-Object {$_.Name -ne '.uxprc'})
    $files=@($archive.Entries | Where-Object {-not $_.FullName.EndsWith('/')})
    if($files.Count -ne $expected.Count){throw 'CCX contains missing or unexpected files. Regenerate with Adobe UXP Developer Tools.'}
    foreach($source in $expected) {
        $relative=$source.FullName.Substring((Join-Path $root 'uxp').Length+1).Replace('\','/')
        $entry=$archive.GetEntry($relative)
        if(-not $entry){throw ('CCX missing '+$relative)}
        $stream=$entry.Open()
        try {
            if($relative -eq 'manifest.json') {
                $reader=[IO.StreamReader]::new($stream)
                try {$packed=Normalize-Json ($reader.ReadToEnd() | ConvertFrom-Json)}finally{$reader.Dispose()}
                $current=Normalize-Json (Get-Content -LiteralPath $source.FullName -Raw -Encoding UTF8 | ConvertFrom-Json)
                if(($packed | ConvertTo-Json -Depth 50 -Compress) -ne ($current | ConvertTo-Json -Depth 50 -Compress)){throw 'CCX manifest does not match source.'}
            } else {
                $hash=[Security.Cryptography.SHA256]::Create()
                try {$packedHash=[BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','')}finally{$hash.Dispose()}
                if($packedHash -ne (Get-FileHash -LiteralPath $source.FullName).Hash){throw ('CCX source mismatch: '+$relative)}
            }
        } finally {$stream.Dispose()}
    }
} finally {$archive.Dispose()}
Write-Output 'Verified Adobe-packaged CCX matches UXP source.'
