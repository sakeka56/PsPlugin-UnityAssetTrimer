[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $root 'VERSION') -Raw).Trim()
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'VERSION must contain a semantic version.' }
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path -LiteralPath $compiler)) { throw 'The .NET Framework 4.x C# compiler is required.' }
$dist = Join-Path $root 'dist'
$stage = Join-Path $root ('.build\portable-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $dist,$stage -Force | Out-Null
$exe = Join-Path $dist "UnityAssetTrim-Setup-$version.exe"
$script = Join-Path $root 'src\UnityAssetTrim.jsx'
& $compiler /nologo /target:winexe /platform:anycpu /optimize+ /utf8output `
    "/out:$exe" "/resource:$script,UnityAssetTrim.jsx" `
    "/win32manifest:$(Join-Path $root 'installer\app.manifest')" `
    /reference:System.Windows.Forms.dll /reference:System.Drawing.dll `
    (Join-Path $root 'installer\Installer.cs')
if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed.' }
Copy-Item -LiteralPath $script -Destination (Join-Path $stage 'Unity Asset Trim.jsx')
foreach ($name in @('README.md','README.zh-CN.md','LICENSE','CHANGELOG.md')) {
    Copy-Item -LiteralPath (Join-Path $root $name) -Destination $stage
}
New-Item -ItemType Directory -Path (Join-Path $stage 'docs\assets') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'docs\assets\trim-example.svg') -Destination (Join-Path $stage 'docs\assets')
Copy-Item -LiteralPath (Join-Path $root 'docs\assets\trim-example.zh-CN.svg') -Destination (Join-Path $stage 'docs\assets')
$zip = Join-Path $dist "UnityAssetTrim-Portable-$version.zip"
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal
$hashes = foreach ($file in @($exe,$zip)) {
    $hash = Get-FileHash -LiteralPath $file -Algorithm SHA256
    '{0}  {1}' -f $hash.Hash.ToLowerInvariant(), (Split-Path -Leaf $file)
}
[IO.File]::WriteAllText((Join-Path $dist 'SHA256SUMS.txt'), ($hashes -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
Get-Item -LiteralPath $exe,$zip,(Join-Path $dist 'SHA256SUMS.txt') | Select-Object Name,Length
