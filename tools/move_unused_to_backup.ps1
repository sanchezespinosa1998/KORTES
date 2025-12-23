$ErrorActionPreference = 'Stop'

$root = (Get-Location).Path
$backup = Join-Path $root '_unused_backup'
New-Item -ItemType Directory -Force -Path $backup | Out-Null

$exclude = @(
  '_unused_backup',
  '_used_files.txt',
  '_unused_files.txt',
  'tools\collect_used_assets.mjs',
  'tools\move_unused_to_backup.ps1'
)

$listPath = Join-Path $root '_unused_files.txt'
if (-not (Test-Path -LiteralPath $listPath)) {
  throw \"No existe $listPath. Ejecuta primero: node tools/collect_used_assets.mjs\"
}

$list = Get-Content -LiteralPath $listPath
foreach ($rel in $list) {
  if ([string]::IsNullOrWhiteSpace($rel)) { continue }
  $rel = $rel.Trim()
  if ($exclude -contains $rel) { continue }
  if ($rel -like '_unused_backup*') { continue }

  $src = Join-Path $root $rel
  if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { continue }

  $dst = Join-Path $backup $rel
  $dstDir = Split-Path -Parent $dst
  New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

  Move-Item -LiteralPath $src -Destination $dst -Force
}

Write-Host 'Movido a _unused_backup. Puedes borrar esa carpeta cuando verifiques que todo va bien.'






