from flask import Flask, render_template
from produto import rotas_produto  # Importe do arquivo produto.py no mesmo diretório

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_muito_segura_123'  # IMPORTANTE: use uma chave segura

# Registre o blueprint
app.register_blueprint(rotas_produto)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)