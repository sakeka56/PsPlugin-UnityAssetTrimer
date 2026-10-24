[CmdletBinding()]
param([string]$Installer)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $Installer) {
    $version = (Get-Content -LiteralPath (Join-Path $root 'VERSION') -Raw).Trim()
    $Installer = Join-Path $root "dist\UnityAssetTrim-Setup-$version.exe"
}
$assembly = [Reflection.Assembly]::LoadFile((Resolve-Path -LiteralPath $Installer).Path)
$core = $assembly.GetType('UnityAssetTrimSetup.InstallerCore', $true)
function Invoke-Core([string]$Method, [object[]]$Arguments) {
    $plain = [object[]]::new($Arguments.Length)
    for ($i = 0; $i -lt $Arguments.Length; $i++) { $plain[$i] = [string]$Arguments[$i] }
    $core.GetMethod($Method).Invoke($null, $plain)
}
function Assert([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "FAIL: $Message" }
    Write-Output "PASS: $Message"
}
$work = Join-Path $root ('.test-work\installer-' + [guid]::NewGuid().ToString('N'))
$photoshop = Join-Path $work 'Photoshop 空格路径'
New-Item -ItemType Directory -Path $photoshop -Force | Out-Null
[IO.File]::WriteAllBytes((Join-Path $photoshop 'Photoshop.exe'), [byte[]]@(0))
$payload = Invoke-Core 'ReadPayload' @()
$source = [IO.File]::ReadAllBytes((Join-Path $root 'src\UnityAssetTrim.jsx'))
Assert ([Convert]::ToBase64String($payload) -eq [Convert]::ToBase64String($source)) 'Embedded JSX matches source bytes'
$target = Invoke-Core 'Install' @($photoshop)
Assert (Test-Path -LiteralPath $target) 'Fresh installation creates the menu script'
Assert (Invoke-Core 'IsOurScript' @($target)) 'Installer recognizes its own script'
Assert ((Get-FileHash -LiteralPath $target).Hash -eq (Get-FileHash -LiteralPath (Join-Path $root 'src\UnityAssetTrim.jsx')).Hash) 'Installed script hash matches payload'
$null = Invoke-Core 'Install' @($photoshop)
Assert (@(Get-ChildItem -LiteralPath (Split-Path -Parent $target) -Filter '*.backup-*').Count -eq 0) 'Identical reinstall does not create a backup'
[IO.File]::WriteAllText($target, '// existing user file', [Text.Encoding]::UTF8)
$null = Invoke-Core 'Install' @($photoshop)
$backups = @(Get-ChildItem -LiteralPath (Split-Path -Parent $target) -Filter '*.backup-*')
Assert ($backups.Count -eq 1) 'Update backs up an existing file'
Assert ([IO.File]::ReadAllText($backups[0].FullName) -eq '// existing user file') 'Backup preserves original content'
Assert (Invoke-Core 'Uninstall' @($photoshop)) 'Uninstall removes the installed script'
Assert (-not (Test-Path -LiteralPath $target)) 'Menu script is absent after uninstall'
Assert (Test-Path -LiteralPath (Join-Path $photoshop 'Photoshop.exe')) 'Photoshop executable is untouched'
Assert (-not (Invoke-Core 'Uninstall' @($photoshop))) 'Repeated uninstall is safe'
[IO.File]::WriteAllText($target, '// unrelated file')
$refused = $false
try { $null = Invoke-Core 'Uninstall' @($photoshop) } catch { $refused = $true }
Assert ($refused -and [IO.File]::ReadAllText($target) -eq '// unrelated file') 'Uninstall refuses to remove unrelated content'
$refused = $false
try { $null = Invoke-Core 'Install' @($work) } catch { $refused = $true }
Assert $refused 'Rejects a folder without Photoshop.exe'
Assert ((Invoke-Core 'ValidateRoot' @((Join-Path $photoshop 'Photoshop.exe'))) -eq $photoshop) 'Accepts Photoshop.exe as the selected path'
$process = Start-Process -FilePath $Installer -ArgumentList @('/install', ('"' + $photoshop + '"'), '/quiet') -WindowStyle Hidden -Wait -PassThru
Assert ($process.ExitCode -eq 0 -and (Test-Path -LiteralPath $target)) 'Compiled EXE supports silent installation with Unicode and spaces'
$process = Start-Process -FilePath $Installer -ArgumentList @('/uninstall', ('"' + $photoshop + '"'), '/quiet') -WindowStyle Hidden -Wait -PassThru
Assert ($process.ExitCode -eq 0 -and -not (Test-Path -LiteralPath $target)) 'Compiled EXE supports silent uninstall'
$process = Start-Process -FilePath $Installer -ArgumentList @('/install', ('"' + $work + '"'), '/quiet') -WindowStyle Hidden -Wait -PassThru
Assert ($process.ExitCode -ne 0) 'Compiled EXE reports invalid path through exit code'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
$layoutExe = Join-Path $work 'LayoutTests.exe'
& $compiler /nologo /target:winexe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "/out:$layoutExe" (Join-Path $PSScriptRoot 'layout-tests.cs')
if ($LASTEXITCODE -ne 0) { throw 'Layout test compilation failed.' }
$process = Start-Process -FilePath $layoutExe -ArgumentList @(('"' + (Resolve-Path -LiteralPath $Installer).Path + '"'), ('"' + $work + '"')) -WindowStyle Hidden -Wait -PassThru
Get-Content -LiteralPath (Join-Path $work 'layout-results.txt')
Assert ($process.ExitCode -eq 0) 'Installer bilingual layout and resizing at simulated 100%, 150%, 200% scaling'
Write-Output 'Installer tests complete.'
