@echo off
echo ============================================================
echo  IMPORTADOR CATALOGO IRON 2025 - Marquinho Moto Pecas
echo ============================================================
echo.

:: Verifica se o servidor Next.js esta rodando
echo [1/3] Verificando servidor Next.js...
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:3000 -TimeoutSec 3 -ErrorAction Stop; Write-Host '  OK - Servidor rodando' } catch { Write-Host '  ERRO - Servidor nao encontrado em http://localhost:3000'; Write-Host '  Inicie o servidor com: npm run dev'; exit 1 }"

:: Executa a importacao via curl
echo.
echo [2/3] Enviando produtos para o banco de dados...
echo   (Isto pode levar alguns minutos para 3.738 produtos...)

powershell -Command ^
  "$json = Get-Content -Raw 'scripts\catalogo-iron-final.json' | ConvertFrom-Json; ^
   $body = @{ produtos = $json; batchSize = 100 } | ConvertTo-Json -Depth 3; ^
   Write-Host '  Enviando ' $json.Count ' produtos...'; ^
   $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/admin/importar-catalogo-iron' -Method POST -Body $body -ContentType 'application/json'; ^
   Write-Host ''; ^
   Write-Host '============================================================'; ^
   Write-Host 'RESULTADO DA IMPORTACAO'; ^
   Write-Host '============================================================'; ^
   Write-Host ('  Importados:        ' + $result.imported); ^
   Write-Host ('  Ja existiam:       ' + $result.skipped); ^
   Write-Host ('  Total no JSON:     ' + $result.totalProdutosArquivo); ^
   Write-Host ('  Total IRON no BD:  ' + $result.totalIRONnoBanco); ^
   if ($result.errors.Count -gt 0) { ^
     Write-Host ('  Erros:             ' + $result.errors.Count); ^
     Write-Host '  Primeiros erros:'; ^
     $result.errors | Select-Object -First 5 | ForEach-Object { Write-Host ('    - ' + $_) } ^
   }; ^
   Write-Host ''; ^
   Write-Host 'Importacao concluida!'"

echo.
echo [3/3] Processo finalizado.
pause
