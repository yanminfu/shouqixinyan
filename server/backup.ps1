$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root "backup-v4.0-20261109.zip"
if (Test-Path $out) { Remove-Item $out -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')
Get-ChildItem -Recurse -File $root | Where-Object {
  $_.FullName -notlike (Join-Path $root ".git*") -and $_.Extension -ne ".zip"
} | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length + 1).Replace("\", "/")
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel) | Out-Null
}
$zip.Dispose()
Write-Host "backup ok: $out"
