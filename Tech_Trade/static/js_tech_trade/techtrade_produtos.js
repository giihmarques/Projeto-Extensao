// ==========================
// Arquivo: techtrade_produtos.js
// ==========================

(function () {
  'use strict';

  // Função de alerta (simples)
  window.chamar_alerta = function (tipo, mensagem, fechar) {
    console.log(`[ALERTA - ${tipo}] ${mensagem}`);
  };

  // Inicialização
  consultar_categorias();
  carregarProdutos();
})();

// ==========================
// CADASTRO DE VENDEDOR
// ==========================
document.addEventListener("DOMContentLoaded", function () {
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
          alert("Vendedor cadastrado com sucesso!");
          form.reset();
        } else {
          alert("Erro ao cadastrar vendedor.");
        }
      } catch (erro) {
        console.error("Erro:", erro);
        alert("Erro de conexão com o servidor.");
      }
    });
  }
});

// ==========================
// FUNÇÕES DE PRODUTOS
// ==========================

function consultar_categorias() {
  $.ajax({
    url: "/techtrade/categorias",
    type: "GET",
    dataType: "json",
    success: function (categorias) {
      const $selectCategoria = $("#categoria_id");
      $selectCategoria.empty();
      $selectCategoria.append(
        $("<option>", { value: "", text: "Selecione a Categoria" })
      );
      categorias.forEach(function (cat) {
        $selectCategoria.append(
          $("<option>", {
            value: cat[0],
            text: cat[1],
          })
        );
      });
    },
    error: function () {
      console.error("Erro ao carregar categorias.");
    },
  });
}

function carregarProdutos() {
  $.ajax({
    url: "/techtrade/produtos/registros",
    type: "GET",
    dataType: "json",
    success: function (response) {
      const produtos = response.json_produtos || [];
      const container = $("#cards-produtos");
      container.empty();

      if (produtos.length === 0) {
        container.append(
          "<p class='text-center text-muted'>Nenhum produto encontrado.</p>"
        );
        return;
      }

      produtos.forEach((p) => {
        const card = `
          <div class="col-md-4">
            <div class="card h-100 shadow-sm border-0">
              <img src="${p.imagem}" class="card-img-top" alt="${p.nome}">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${p.nome}</h5>
                <p class="card-text text-muted small">${p.descricao.substring(
                  0,
                  80
                )}...</p>
                <p class="text-success fw-bold mb-2">R$ ${p.preco_formatado}</p>

                <div class="mt-auto d-flex flex-column gap-2">
                  <button class="btn btn-outline-primary btn-detalhes" data-produto='${JSON.stringify(
                    p
                  )}'>
                    Ver detalhes
                  </button>
                  <button class="btn btn-success btn-comprar-direto" data-id="${
                    p.id_produto
                  }">
                    Comprar agora
                  </button>
                </div>
              </div>
            </div>
          </div>`;
        container.append(card);
      });
    },
    error: function () {
      $("#cards-produtos").html(
        "<p class='text-center text-danger'>Erro ao carregar produtos.</p>"
      );
    },
  });
}

function mostrarDetalhesProduto(produto) {
  try {
    if (typeof produto === "string") produto = JSON.parse(produto);

    $("#detalhe-nome").text(produto.nome);
    $("#detalhe-descricao").text(produto.descricao);
    $("#detalhe-categoria").text(produto.categoria);
    $("#detalhe-preco").text(`R$ ${produto.preco_formatado}`);
    $("#detalhe-vendedor").text(produto.criado_por);
    $("#detalhe-imagem").attr("src", produto.imagem);

    if (produto.verificado === true || produto.verificado === 1) {
      $("#selo-verificado").removeClass("d-none");
    } else {
      $("#selo-verificado").addClass("d-none");
    }

    // 🔹 Atualiza o botão de compra
    $("#btn-comprar")
      .attr("data-id-produto", produto.id_produto)
      .off("click")
      .on("click", function () {
        verificarLoginAntesCompra(produto.id_produto);
      });

    const modal = new bootstrap.Modal(
      document.getElementById("modalDetalhesProduto")
    );
    modal.show();
  } catch (error) {
    console.error("Erro ao exibir detalhes:", error);
  }
}

// ==========================
// EVENTOS DE INTERAÇÃO
// ==========================

// Botão "Ver detalhes"
$(document).on("click", ".btn-detalhes", function () {
  const produto = $(this).data("produto");
  mostrarDetalhesProduto(produto);
});

// Botão "Comprar agora" direto do card
$(document).on("click", ".btn-comprar-direto", function () {
  const idProduto = $(this).data("id");
  verificarLoginAntesCompra(idProduto);
});

// ==========================
// FUNÇÃO PRINCIPAL DE LOGIN CHECK
// ==========================
function verificarLoginAntesCompra(idProduto) {
  if (!usuarioLogado) {
    // Abre o modal de login necessário
    const modalLogin = new bootstrap.Modal(
      document.getElementById("modalLoginNecessario")
    );
    modalLogin.show();
  } else {
    // Redireciona direto para checkout
    window.location.href = `/techtrade/produtos/checkout/${idProduto}`;
  }
}
