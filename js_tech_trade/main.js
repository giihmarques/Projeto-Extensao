// Arquivo: techtrade_produtos.js (Exemplo para o projeto TechTrade)

/**
 * Função global para inicializar a validação e eventos.
 */
(function () {
    'use strict'

    // Função de utilidade para chamar um alerta (Simulação)
    window.chamar_alerta = function(tipo, mensagem, fechar) {
        console.log(`[ALERTA - ${tipo}] ${mensagem}`);
        // Implemente a lógica real de exibição de alerta aqui (Bootstrap, etc.)
    };

    // 1. Validação e Submissão do Formulário de Produto
    const form_produto = document.getElementById('form-produto');
    if (form_produto) {
        form_produto.addEventListener('submit', function (event) {
            
            event.preventDefault(); 
            event.stopPropagation(); 
            form_produto.classList.add('was-validated');

            if (!form_produto.checkValidity()) {
                return;
            }

            // Decide entre criar ou editar
            if ($('#btn-salvar-produto').data('action') === 'create') {
                criar_produto();
            } else {
                editar_produto();
            }
            
        }, false);
    }
    
    // Chamada inicial para carregar dados ao carregar a página
    consultar_produtos();
    consultar_categorias();
    
})();
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formCadastroVendedor");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nome = document.getElementById("nome").value;
      const email = document.getElementById("email").value;
      const senha = document.getElementById("senha").value;
      const meioComunicacao = document.getElementById("meioComunicacao").value;

      const dados = {
        nome: nome,
        email: email,
        senha: senha,
        meio_comunicacao: meioComunicacao
      };

      try {
        const resposta = await fetch("/api/vendedores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
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


/**
 * Carrega e exibe a lista de produtos na interface.
 */
function consultar_produtos() {
    console.log("Consultando produtos...");
    $.ajax({
        url: "/techtrade/produtos/registros",
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log("Produtos carregados:", response.json_produtos);
            // Lógica para preencher a tabela HTML aqui
        },
        error: function (jqXHR) {
            const erro = jqXHR.responseJSON ? jqXHR.responseJSON.erro : 'Erro ao carregar a lista de produtos.';
            chamar_alerta('alerta_erro', erro, 'sim');
        }
    });
}

/**
 * Carrega as categorias e preenche o select/dropdown.
 */
function consultar_categorias() {
    console.log("Consultando categorias...");
    $.ajax({
        url: "/techtrade/produtos/categorias",
        type: 'GET',
        dataType: 'json',
        success: function (categorias) {
            const $selectCategoria = $('#categoria_id');
            $selectCategoria.empty();
            $selectCategoria.append($('<option>', { value: '', text: 'Selecione a Categoria' }));
            categorias.forEach(function(cat) {
                $selectCategoria.append($('<option>', {
                    value: cat[0], // id_categoria
                    text: cat[1]    // nome da categoria
                }));
            });
        },
        error: function (jqXHR) {
            console.error("Erro ao carregar categorias:", jqXHR);
        }
    });
}

/**
 * Cria um novo produto (POST).
 */
function criar_produto() {
    const dados = {
        nome: $('#nome_produto').val(),
        categoria_id: $('#categoria_id').val() || null,
        preco: parseFloat($('#preco_produto').val()),
        estoque: parseInt($('#estoque_produto').val()) || 0
    };

    $.ajax({
        url: "/techtrade/produtos",
        type: 'POST',
        data: JSON.stringify(dados),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (response) {
            chamar_alerta('alerta_sucesso', response.mensagem, 'sim');
            consultar_produtos(); 
            // Fechar modal e resetar formulário aqui
        },
        error: function (jqXHR) {
            const erro = jqXHR.responseJSON ? jqXHR.responseJSON.erro : 'Erro desconhecido ao criar o produto.';
            chamar_alerta('alerta_erro', erro, 'sim');
        }
    });
}

/**
 * Edita um produto existente (PUT).
 */
function editar_produto() {
    const idProduto = $('#id_produto').val(); // Assumindo um campo hidden para o ID
    const dados = {
        id_produto: idProduto,
        nome: $('#nome_produto').val(),
        categoria_id: $('#categoria_id').val() || null,
        preco: parseFloat($('#preco_produto').val()),
        estoque: parseInt($('#estoque_produto').val()) || 0
    };

    $.ajax({
        url: "/techtrade/produtos",
        type: 'PUT',
        data: JSON.stringify(dados),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (response) {
            chamar_alerta('alerta_sucesso', response, 'sim');
            consultar_produtos(); 
            // Fechar modal e resetar formulário aqui
        },
        error: function (jqXHR) {
            const erro = jqXHR.responseJSON ? jqXHR.responseJSON.erro : 'Erro desconhecido ao editar o produto.';
            chamar_alerta('alerta_erro', erro, 'sim');
        }
    });
}