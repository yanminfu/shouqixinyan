# 为 GitHub Pages 部署打通 github.com（DNS 指向了不可达 IP 时的临时加速）
# 删除本脚本写入的行即可恢复原状
$hosts = Join-Path $env:windir 'System32\drivers\etc\hosts'
$marker = '# shouqixinyan-github-pages'
$line = '140.82.113.3 github.com'

$content = Get-Content -LiteralPath $hosts -Raw -Encoding UTF8
if ($content -match [regex]::Escape($marker)) {
    Write-Output 'SKIP: 已存在，无需重复写入'
} else {
    $append = "`r`n$marker`r`n$line`r`n"
    Add-Content -LiteralPath $hosts -Value $append -Encoding UTF8
    Write-Output 'OK: 已写入 hosts'
}

Clear-DnsClientCache -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
try {
    $r = Invoke-WebRequest -Uri 'https://github.com' -MaximumRedirection 0 -TimeoutSec 15 -UseBasicParsing
    Write-Output ("VERIFY: github.com -> " + $r.StatusCode)
} catch {
    Write-Output ("VERIFY-FAIL: " + $_.Exception.Message)
}
