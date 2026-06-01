$env:PORT="8081"
$process = Start-Process node -ArgumentList ".output/server/index.mjs" -PassThru -NoNewWindow -RedirectStandardOutput "server.log" -RedirectStandardError "server.log"
Start-Sleep -Seconds 3
Invoke-WebRequest -Uri "http://localhost:8081/fleet" -UseBasicParsing -OutFile "output.html" -ErrorAction SilentlyContinue
Stop-Process -Id $process.Id -Force
Get-Content "server.log"
