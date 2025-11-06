from flask import Blueprint, jsonify, render_template, request, abort
from datetime import datetime
from src.utils.bd import ConexaoBD
from flask import Blueprint, jsonify, render_template, request, abort, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
rotas_produto = Blueprint('produto', __name__)

# ------------------- RENDERIZAÇÃO DE PÁGINAS -------------------

@rotas_produto.route('/login', methods=['GET', 'POST'])
def login():
    try:
        if request.method == 'POST':
            email = request.form.get('email')
            senha = request.form.get('senha')

            conexao = ConexaoBD()
            sql = "SELECT id_cliente, nome, senha FROM clientes_tt WHERE email = %s"
            usuario = conexao.select(sql, (email,))
            conexao.close()

            if usuario and check_password_hash(usuario[0][2], senha):
                session['usuario_logado'] = True
                session['usuario_nome'] = usuario[0][1]
                session['usuario_id'] = usuario[0][0]
                print(f"✅ Login realizado por {usuario[0][1]}")
                return redirect(url_for('produto.renderizar_produtos'))
            else:
                erro = "E-mail ou senha incorretos."
                return render_template('login.html', erro=erro)

        return render_template('login.html')

    except Exception as err:
        print(f"❌ Erro ao processar login: {err}")
        abort(500)

# ------------------- CADASTRO DE CLIENTE -------------------

@rotas_produto.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    try:
        if request.method == 'POST':
            nome = request.form.get('nome')
            email = request.form.get('email')
            senha = request.form.get('senha')
            telefone = request.form.get('telefone')

            if not nome or not email or not senha or not telefone:
                return render_template('cadastro.html', erro="Preencha todos os campos obrigatórios.")

            conexao = ConexaoBD()

            # Verifica se o e-mail já está cadastrado
            sql_verifica = "SELECT id_cliente FROM clientes_tt WHERE email = %s"
            existente = conexao.select(sql_verifica, (email,))
            if existente:
                conexao.close()
                return render_template('cadastro.html', erro="E-mail já cadastrado. Faça login.")

            # Insere novo cliente com senha criptografada
            hash_senha = generate_password_hash(senha)
            sql = """
                INSERT INTO clientes_tt (nome, email, senha, telefone, criado_em)
                VALUES (%s, %s, %s, %s, NOW())
            """
            conexao.insert(sql, (nome, email, hash_senha, telefone))
            conexao.close()

            print(f"✅ Novo cliente cadastrado: {nome} ({email})")

            # Cria sessão
            session['usuario_logado'] = True
            session['usuario_nome'] = nome

            return redirect(url_for('produto.renderizar_produtos'))

        return render_template('cadastro.html')

    except Exception as err:
        print(f"❌ Erro ao cadastrar cliente: {err}")
        return render_template('cadastro.html', erro="Erro ao cadastrar. Tente novamente mais tarde.")


# ------------------- RENDERIZAÇÃO DE PÁGINAS -------------------       
@rotas_produto.route("/produtos")
def renderizar_produtos():
    try:
        return render_template("produtos.html")
    except Exception as err:
        print(f"Erro ao renderizar produtos: {err}")
        abort(404)

# ------------------- CONSULTAS AO BANCO -------------------

@rotas_produto.get("/techtrade/categorias")
def consultar_categorias_produtos():
    """Retorna as categorias dos produtos"""
    # try:
    conexao = ConexaoBD()
    categorias = conexao.select("SELECT id_categoria, nome FROM categorias_produtos_tt")
    conexao.close()
    return jsonify(categorias)
    # except Exception as err:
    #     erro = str(err).replace("'", '"')
    #     return jsonify({"erro": erro}), 500


@rotas_produto.get("/techtrade/produtos/registros")
def consultar_produtos():
    """Retorna a lista de produtos"""
    try:
        conexao_bd = ConexaoBD()
        retorno_bd = conexao_bd.select("""
            SELECT 
                p.id_produto,
                p.nome,
                p.descricao,
                c.nome AS categoria,
                p.preco,
                p.estoque,
                p.criado_em,
                p.criado_por,
                p.imagem,
                p.verificado,
                p.verificado_por,
                p.verificado_em,
                p.verificacao_obs
            FROM produtos_tt p
            LEFT JOIN categorias_produtos_tt c ON p.categoria_id = c.id_categoria
            ORDER BY p.id_produto DESC
        """)
        conexao_bd.close()

        # --- Funções auxiliares ---
        def formata_data(data):
            if isinstance(data, datetime):
                return data.strftime('%d/%m/%Y')
            return str(data) if data else ""

        def safe_float(x):
            try:
                return float(x) if x is not None else 0.0
            except (TypeError, ValueError):
                return 0.0

        def safe_int(x):
            try:
                return int(x) if x is not None else 0
            except (TypeError, ValueError):
                try:
                    return int(float(x))
                except Exception:
                    return 0

        # --- Monta o JSON final ---
        json_produtos = []
        for row in retorno_bd:
            json_produtos.append({
                "id_produto": row[0],
                "nome": row[1] or "",
                "descricao": row[2] or "",
                "categoria": row[3] or "",
                "preco": round(safe_float(row[4]), 2),
                "preco_formatado": f"{safe_float(row[4]):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
                "estoque": safe_int(row[5]),
                "disponivel": safe_int(row[5]) > 0,
                "criado_em": formata_data(row[6]),
                "criado_por": row[7] or "",
                "imagem": f"/static/tech_trade_imagens/{row[8]}" if row[8] else "/static/tech_trade_imagens/default.jpg",
                "verificado": row[9] if len(row) > 9 else True,
                "verificado_por": row[10] or "",
                "verificado_em": formata_data(row[11]) if row[11] else "",
                "verificacao_obs": row[12] or ""
            })

        return jsonify({"json_produtos": json_produtos})

    except Exception as err:
        erro = str(err).replace("'", '"')
        return jsonify({"erro": erro}), 500
    

@rotas_produto.route('/techtrade/produtos/verificar', methods=['POST'])
def verificar_produto():
    """Marca um produto como verificado"""
    try:
        dados = request.get_json()
        id_produto = dados.get('id_produto')
        verificado = dados.get('verificado', True)
        verificado_por = dados.get('verificado_por', 'Sistema')
        verificacao_obs = dados.get('verificacao_obs', '')

        if not id_produto:
            return jsonify({"erro": "ID do produto é obrigatório"}), 400

        conexao = ConexaoBD()
        sql = """
            UPDATE produtos_tt
            SET verificado = %s,
                verificado_por = %s,
                verificado_em = NOW(),
                verificacao_obs = %s
            WHERE id_produto = %s
        """
        conexao.insert(sql, (1 if verificado else 0, verificado_por, verificacao_obs, id_produto))
        conexao.close()

        return jsonify({"mensagem": "Produto verificado com sucesso!"}), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ------------------- PÁGINA DE CHECKOUT -------------------
@rotas_produto.route("/techtrade/produtos/checkout/<int:id_produto>")
def checkout_produto(id_produto):
    """Renderiza a página de checkout de um produto específico"""
    try:
        conexao = ConexaoBD()

        sql = """
            SELECT 
                p.id_produto,
                p.nome,
                p.descricao,
                p.preco,
                p.estoque,
                p.imagem,
                p.verificado,
                p.verificado_por,
                p.verificado_em,
                p.criado_por
            FROM produtos_tt p
            WHERE p.id_produto = %s
        """
        resultado = conexao.select(sql, (id_produto,))
        conexao.close()

        if not resultado or len(resultado) == 0:
            abort(404)

        # Extrai os dados
        p = resultado[0]

        produto = {
            "id_produto": p[0],
            "nome": p[1],
            "descricao": p[2],
            "preco": float(p[3]),
            "estoque": int(p[4]),
            "imagem": f"/static/tech_trade_imagens/{p[5]}" if p[5] else "/static/tech_trade_imagens/default.jpg",
            "verificado": bool(p[6]),
            "verificado_por": p[7] or "Sistema TechTrade",
            "verificado_em": p[8],
            "vendedor": p[9] or "Vendedor não informado"
        }

        return render_template("checkout.html", produto=produto)

    except Exception as err:
        print(f"❌ Erro ao carregar checkout: {err}")
        abort(500)

# ------------------- CADASTRO DE VENDEDORES -------------------

@rotas_produto.route('/api/vendedores', methods=['POST'])
def cadastrar_vendedor():
    try:
        dados = request.get_json()

        nome = dados.get('nome')
        email = dados.get('email')
        senha = dados.get('senha')
        meio_comunicacao = dados.get('meio_comunicacao')

        # --- Validação básica ---
        if not nome or not email or not senha or not meio_comunicacao:
            return jsonify({"erro": "Campos obrigatórios faltando"}), 400

        # --- Inserir no banco de dados ---
        conexao = ConexaoBD()
        sql = """
            INSERT INTO vendedores_tt (nome, email, senha, meio_comunicacao, criado_em)
            VALUES (%s, %s, %s, %s, NOW())
        """
        conexao.insert(sql, (nome, email, senha, meio_comunicacao))
        conexao.close()

        print(f"✅ Novo vendedor cadastrado: {nome} ({meio_comunicacao})")

        return jsonify({"mensagem": "Vendedor cadastrado com sucesso!"}), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ------------------- CONCLUIR COMPRA (simulação) -------------------
@rotas_produto.route("/techtrade/produtos/checkout/<int:id_produto>", methods=["GET", "POST"])
def checkout(id_produto):
    from src.utils.bd import ConexaoBD
    bd = ConexaoBD()
    cursor = bd.con.cursor(dictionary=True)

    # ✅ Corrigido o nome da tabela
    cursor.execute("SELECT * FROM produtos_tt WHERE id_produto = %s", (id_produto,))
    produto = cursor.fetchone()

    if not produto:
        abort(404, "Produto não encontrado")

    if request.method == "POST":
        metodo = request.form.get("metodo")
        if not metodo:
            return "Método de pagamento não selecionado.", 400

        mensagem = f"Compra do produto '{produto['nome']}' realizada com sucesso via {metodo}!"
        if request.method == "POST":
            metodo = request.form.get("metodo")
        if not metodo:
            return "Método de pagamento não selecionado.", 400  

    # Mensagem de sucesso para o comprador
        mensagem = f"Compra do produto '{produto['nome']}' realizada com sucesso via {metodo}!"

        # 🔹 Passo extra: buscar vendedor e registrar notificação
        try:
            # Busca o vendedor relacionado ao produto
            vendedor_id = produto.get("criado_por")  # ou produto["vendedor_id"] se for o nome da sua coluna
            if vendedor_id:
                cursor.execute("SELECT nome, email, meio_comunicacao FROM vendedores_tt WHERE id_vendedor = %s", (vendedor_id,))
                vendedor = cursor.fetchone()

                if vendedor:
                    nome_vend = vendedor["nome"]
                    meio = vendedor["meio_comunicacao"]

                    # Simular notificação
                    print(f"📩 Vendedor {nome_vend} foi notificado via {meio} sobre a venda de '{produto['nome']}'.")

                    # Opcional: gravar em uma tabela de notificações
                    cursor.execute("""
                        INSERT INTO notificacoes_tt (id_vendedor, mensagem, data_envio)
                        VALUES (%s, %s, NOW())
                    """, (vendedor_id, f"Seu produto '{produto['nome']}' foi vendido via {metodo}!"))
                    bd.con.commit()

        except Exception as e:
            print(f"⚠️ Falha ao notificar vendedor: {e}")

        return render_template("confirmacao.html", mensagem=mensagem)
    
# --------------------------- LISTAR NOTIFICAÇÕES DO VENDEDOR -------------------

@rotas_produto.route("/vendedor/<int:id_vendedor>/notificacoes")
def listar_notificacoes(id_vendedor):
    try:
        conexao = ConexaoBD()
        sql = """
            SELECT mensagem, data_envio, lida
            FROM notificacoes_tt
            WHERE id_vendedor = %s
            ORDER BY data_envio DESC
        """
        notificacoes = conexao.select(sql, (id_vendedor,))
        conexao.close()

        return render_template("notificacoes.html", notificacoes=notificacoes)
    except Exception as e:
        print(f"Erro ao listar notificações: {e}")
        abort(500)

