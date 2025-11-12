// ==========================================
// Arquivo: techtrade_produtos.js
// Integração Frontend (JavaScript) + Backend Flask
// Projeto: Tech Trade
// ==========================================

// Variável global para verificar o estado de login
let usuarioLogado = false;

// ==========================================
// FUNÇÃO DE ALERTA
// ==========================================
window.chamar_alerta = function (tipo, mensagem, fechar) {
    console.log(`[ALERTA - ${tipo}] ${mensagem}`);
    if (tipo === "erro") {
        alert(`Erro: ${mensagem}`);
    } else if (tipo === "sucesso") {
        alert(`✅ ${mensagem}`);
    } else {
        console.info(mensagem);
    }
};

// ==========================================
// INICIALIZAÇÃO GERAL
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // Verificar se usuário está logado
    verificarEstadoLogin();
    
    (async function () {
        await Promise.all([
            consultarCategorias(),
            carregarProdutos(),
        ]);
        console.log("Inicialização concluída: categorias e produtos carregados.");
    })();

    configurarCadastroVendedor();
    configurarEventosProdutos();
});

// ==========================================
// VERIFICAR ESTADO DE LOGIN
// ==========================================
function verificarEstadoLogin() {
    // Em uma aplicação real, isso viria do servidor/sessão
    // Por enquanto, vamos verificar se há um indicador no localStorage
    usuarioLogado = localStorage.getItem('usuario_logado') === 'true';
    console.log('Usuário logado:', usuarioLogado);
}

// ==========================================
// CADASTRO DE VENDEDOR
// ==========================================
function configurarCadastroVendedor() {
    const form = document.getElementById("formCadastroVendedor");

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const dados = {
                nome: document.getElementById("nome").value,
                email: document.getElementById("email").value,
                senha: document.getElementById("senha").value,
                meio_comunicacao: document.getElementById("meioComunicacao").value,
            };

            try {
                const resposta = await fetch("/api/vendedores", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dados),
                });

                if (resposta.ok) {
                    chamar_alerta("sucesso", "Vendedor cadastrado com sucesso!");
                    form.reset();
                } else {
                    const erroData = await resposta.json();
                    chamar_alerta("erro", erroData.erro || "Erro ao cadastrar vendedor.");
                }
            } catch (erro) {
                console.error("Erro:", erro);
                chamar_alerta("erro", "Falha de conexão com o servidor.");
            }
        });
    }
}

// ==========================================
// CONSULTA DE CATEGORIAS
// ==========================================
async function consultarCategorias() {
    try {
        const resposta = await fetch("/techtrade/categorias");
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        const categorias = await resposta.json();
        const selectCategoria = document.getElementById("categoria_id");
        if (!selectCategoria) return;

        selectCategoria.innerHTML = '<option value="">Todas as categorias</option>';

        categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat[0];
            option.textContent = cat[1];
            selectCategoria.appendChild(option);
        });

        // Adicionar evento de filtro
        selectCategoria.addEventListener("change", carregarProdutos);
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
        chamar_alerta("erro", "Não foi possível carregar as categorias.");
    }
}

// ==========================================
// CONSULTA E EXIBIÇÃO DE PRODUTOS
// ==========================================
async function carregarProdutos() {
    const container = document.getElementById("cards-produtos");
    if (!container) return;

    try {
        const categoriaId = document.getElementById("categoria_id")?.value || '';
        let url = "/techtrade/produtos/registros";
        if (categoriaId) {
            url += `?categoria_id=${categoriaId}`;
        }

        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        const data = await resposta.json();
        const produtos = data.json_produtos || [];

        container.innerHTML = "";

        if (produtos.length === 0) {
            container.innerHTML = "<p class='text-center text-muted'>Nenhum produto encontrado.</p>";
            return;
        }

        produtos.forEach(p => {
            const cardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm border-0">
                        <img src="${p.imagem}" class="card-img-top" alt="${p.nome}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${p.nome}</h5>
                            <p class="card-text text-muted small">${p.descricao.substring(0, 80)}...</p>
                            <p class="text-success fw-bold mb-2">R$ ${p.preco_formatado}</p>
                            <div class="mt-auto d-flex flex-column gap-2">
                                <button class="btn btn-outline-primary btn-detalhes" data-produto='${JSON.stringify(p).replace(/'/g, "&#39;")}'>
                                    Ver detalhes
                                </button>
                                <button class="btn btn-success btn-comprar-direto" data-id="${p.id_produto}">
                                    Comprar agora
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", cardHTML);
        });
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        container.innerHTML = "<p class='text-center text-danger'>Erro ao carregar produtos.</p>";
    }
}

// ==========================================
// MODAL DE DETALHES DE PRODUTO
// ==========================================
function mostrarDetalhesProduto(produto) {
    try {
        if (typeof produto === "string") produto = JSON.parse(produto);

        document.getElementById("detalhe-nome").textContent = produto.nome;
        document.getElementById("detalhe-descricao").textContent = produto.descricao;
        document.getElementById("detalhe-categoria").textContent = produto.categoria;
        document.getElementById("detalhe-preco").textContent = produto.preco_formatado;
        document.getElementById("detalhe-vendedor").textContent = produto.criado_por;
        document.getElementById("detalhe-imagem").src = produto.imagem;

        const selo = document.getElementById("selo-verificado");
        if (produto.verificado === true || produto.verificado === 1) {
            selo.classList.remove("d-none");
        } else {
            selo.classList.add("d-none");
        }

        const btnComprar = document.getElementById("btn-comprar");
        btnComprar.setAttribute("data-id-produto", produto.id_produto);
        btnComprar.onclick = () => verificarLoginAntesCompra(produto.id_produto);

        const modalEl = document.getElementById("modalDetalhesProduto");
        if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
            chamar_alerta("aviso", "Bootstrap Modal não está disponível.");
        }
    } catch (error) {
        console.error("Erro ao exibir detalhes:", error);
        chamar_alerta("erro", "Erro ao abrir detalhes do produto.");
    }
}

// ==========================================
// VERIFICA LOGIN ANTES DA COMPRA
// ==========================================
function verificarLoginAntesCompra(idProduto) {
    if (!usuarioLogado) {
        const modalLogin = document.getElementById("modalLoginNecessario");
        if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalLogin);
            modal.show();
        } else {
            chamar_alerta("aviso", "Faça login para continuar a compra.");
        }
    } else {
        window.location.href = `/techtrade/produtos/checkout/${idProduto}`;
    }
}

// ==========================================
// EVENTOS DE INTERAÇÃO (DELEGAÇÃO)
// ==========================================
function configurarEventosProdutos() {
    document.body.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-detalhes")) {
            const produtoData = e.target.getAttribute("data-produto");
            if (produtoData) mostrarDetalhesProduto(produtoData);
        }

        if (e.target.classList.contains("btn-comprar-direto")) {
            const idProduto = e.target.getAttribute("data-id");
            if (idProduto) verificarLoginAntesCompra(idProduto);
        }
    });
}