[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$photoshop = New-Object -ComObject Photoshop.Application
if ($photoshop.Documents.Count -ne 0) { throw 'Close all Photoshop documents before running integration tests.' }
$null = $photoshop.DoJavaScriptFile((Join-Path $root 'tests\photoshop-integration.jsx'))
$result = Get-Content -LiteralPath (Join-Path $root 'tests\results\photoshop-results.txt') -Encoding UTF8
$result
if ($result[-1] -ne 'FAILURES 0') { throw 'Photoshop integration tests failed.' }
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
$driver = Join-Path $root 'tests\results\DialogDriver.exe'
& $compiler /nologo /target:winexe "/out:$driver" (Join-Path $root 'tests\dialog-driver.cs')
if ($LASTEXITCODE -ne 0) { throw 'Dialog driver compilation failed.' }
$driverProcess = Start-Process -FilePath $driver -WindowStyle Hidden -PassThru
$null = $photoshop.DoJavaScriptFile((Join-Path $root 'tests\photoshop-dialogs.jsx'))
$driverProcess.WaitForExit()
if ($driverProcess.ExitCode -ne 0) { throw 'Dialog driver did not handle all test windows.' }
$dialogs = Get-Content -LiteralPath (Join-Path $root 'tests\results\dialog-results.txt') -Encoding UTF8
$dialogs
if ($dialogs[-1] -ne 'FAILURES 0') { throw 'Photoshop dialog regression tests failed.' }
