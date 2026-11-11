# 打包成阿里云函数计算（FC）可直接上传的 zip
# 结构：server.mjs + assets/js/prompt.js + assets/js/data.js
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $PSScriptRoot 'a2a-fc.zip'
if (Test-Path $out) { Remove-Item $out -Force }

$tmp = Join-Path $env:TEMP ('a2a-fc-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $tmp 'assets\js') -Force | Out-Null

Copy-Item (Join-Path $PSScriptRoot 'server.mjs') (Join-Path $tmp 'server.mjs')
Copy-Item (Join-Path $root 'assets\js\prompt.js') (Join-Path $tmp 'assets\js\prompt.js')
Copy-Item (Join-Path $root 'assets\js\data.js') (Join-Path $tmp 'assets\js\data.js')

Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $out -Force
Remove-Item $tmp -Recurse -Force
Write-Host "OK: $out"
