# Free dev ports 5173 (Vite) and 3001 (Speech API)
foreach ($port in 5173, 3001) {
  $procIds = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $procIds) {
    if ($procId -and $procId -ne 0) {
      Write-Host "Stopping PID $procId on port $port"
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
  }
}
Write-Host "Done. Run: npm run dev"
