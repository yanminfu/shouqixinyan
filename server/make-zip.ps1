$src = Join-Path (Split-Path $PSScriptRoot -Parent) "publish"
$out = Join-Path (Split-Path $PSScriptRoot -Parent) "site-bundle.zip"
if (Test-Path $out) { Remove-Item $out -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')
Get-ChildItem -Recurse -File $src | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length + 1).Replace("\", "/")
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel) | Out-Null
}
$zip.Dispose()
Write-Host "OK: $out"
