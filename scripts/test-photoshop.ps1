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
