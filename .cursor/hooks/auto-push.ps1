# Auto commit & push after Cursor Agent completes (when there are local changes).
# Respects .gitignore — .env and node_modules are never staged.

$null = [Console]::In.ReadToEnd()

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

if (-not (Test-Path ".git")) {
  exit 0
}

$changes = git status --porcelain 2>$null
if (-not $changes) {
  exit 0
}

git add -A 2>$null
if ($LASTEXITCODE -ne 0) {
  exit 0
}

$staged = git diff --cached --name-only 2>$null
if (-not $staged) {
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $branch) {
  $branch = "main"
}

$msg = "chore: auto-sync $timestamp"
git commit -m $msg 2>$null
if ($LASTEXITCODE -ne 0) {
  exit 0
}

git push origin $branch 2>$null
exit 0
