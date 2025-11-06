from flask import Flask, render_template
from produto import rotas_produto
import os

app = Flask(__name__)

# 🔑 Define a chave secreta — necessária para usar sessions
# Pode ser uma string fixa ou gerada automaticamente
app.secret_key = os.urandom(24)

# 🔗 Registra as rotas do Blueprint
app.register_blueprint(rotas_produto)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
