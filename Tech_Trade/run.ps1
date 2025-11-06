# run.ps1 - Ativa o venv (se existir) e inicia o app
# Uso: .\run.ps1

# Vai para a raiz do repositório (onde este script está)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Ativar o virtualenv se existir
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    Write-Host "Ativando ambiente virtual .venv..."
    & .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "Nenhum .venv encontrado na raiz. Certifique-se de ativar seu ambiente manualmente se necessário."
}

# Rodar a aplicação Flask (arquivo dentro da pasta Tech-Trade)
Write-Host "Iniciando o servidor Flask (produto.py)..."
python .\Tech-Trade\produto.py

# Sugestão: para usar MySQL, defina variáveis de ambiente antes de rodar:
# $env:MYSQL_HOST = '127.0.0.1'; $env:MYSQL_USER = 'root'; $env:MYSQL_PASSWORD = 'senha'; $env:MYSQL_DB = 'tech_trade'
# Em seguida, execute: .\run.ps1
