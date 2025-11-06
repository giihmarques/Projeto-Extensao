# Tech-Trade
PIM

## Usando MySQL (MySQL Workbench)

Este projeto por padrão usa SQLite local (`tech_trade.db`) quando não há variáveis de ambiente de conexão com MySQL.

Se você prefere usar MySQL (por exemplo MySQL Workbench), siga estes passos:

1. Abra o MySQL Workbench e conecte ao seu servidor MySQL.
2. No menu de query, abra e execute o arquivo `sql/schema.sql` para criar o database `tech_trade` e a tabela `produto`.
3. Ainda no Workbench, execute `sql/seed.sql` para inserir dados de exemplo.

Variáveis de ambiente (opcionais). Se definidas, o app tentará usar MySQL ao invés de SQLite:

- MYSQL_HOST (ex: 127.0.0.1)
- MYSQL_PORT (padrão: 3306)
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_DB (padrão sugerido no schema: tech_trade)

Exemplo (Windows PowerShell):

```powershell
$env:MYSQL_HOST = '127.0.0.1'; $env:MYSQL_USER = 'root'; $env:MYSQL_PASSWORD = 'senha'; $env:MYSQL_DB = 'tech_trade'
python produto.py
```

Depois de configurar e importar o schema/seed, a rota `/registros_sgs/produtos` vai buscar os dados diretamente do banco MySQL.

Observação: se `mysql-connector-python` não estiver instalado, instale com:

```powershell
pip install mysql-connector-python
```

