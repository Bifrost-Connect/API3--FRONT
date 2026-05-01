// ESCUTA GLOBAL DA TECLA ENTER
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const focusedElement = document.activeElement;
        if (focusedElement.id === 'matricula' || focusedElement.id === 'senha') {
            event.preventDefault();
            if (typeof btnindex === "function") btnindex();
        }
        if (focusedElement.id === 'quilometragem-inicial' || focusedElement.id === 'observacoes') {
            event.preventDefault();
            if (typeof salvarVeiculoInfo === "function") salvarVeiculoInfo();
        }
    }
});

// CARREGAMENTO INICIAL, SIDEBAR E TRAVA DE SEGURANÇA POR PERFIL
document.addEventListener('DOMContentLoaded', () => {
    // Garantimos que a permissão lida do storage seja sempre maiúscula
    const permission = localStorage.getItem("userPermission") ? localStorage.getItem("userPermission").toUpperCase() : "";
    const currentPage = window.location.pathname;

    const gestorPages = [
        "telainicial-gestor.html",
        "relatorios.html",
        "configuracoes-gestor.html",
        "cadastrousuarios.html",
        "cadastroveiculos.html"
    ];
    const technicianPages = [
        "telainicial.html",
        "chamados.html",
        "configuracoes-tecnico.html"
    ];

    // Trava de segurança por perfil
    if (permission) {
        const isGestorPage = gestorPages.some(page => currentPage.includes(page));
        const isTechnicianPage = technicianPages.some(page => currentPage.includes(page));

        if (isGestorPage && permission !== "ADMINISTRATOR") {
            window.location.href = "telainicial.html";
            return;
        }
        if (isTechnicianPage && permission !== "TECHNICIAN") {
            window.location.href = "telainicial-gestor.html";
            return;
        }
    }

    // Só chama a função se ela existir na página atual
    if (typeof carregarDadosTelaInicial === "function") {
        carregarDadosTelaInicial();
    }

    const btnMenu = document.getElementById("btnmenu");
    const sidebar = document.getElementById("sidebar");
    const overlaySidebar = document.getElementById("overlayBlurSidebar");

    const closeSidebar = () => {
        if (sidebar) sidebar.style.width = "0";
        if (overlaySidebar) overlaySidebar.classList.remove("active");
    };

    if (btnMenu && sidebar) btnMenu.onclick = () => {
        sidebar.style.width = "250px";
        if (overlaySidebar) overlaySidebar.classList.add("active");
    };

    const btnClose = document.getElementById("btnx");
    if (btnClose) btnClose.onclick = closeSidebar;
    if (overlaySidebar) overlaySidebar.onclick = closeSidebar;

    document.querySelectorAll(".sobreposicao").forEach(overlay => {
        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                fecharTodosModais();
            }
        });
    });
});

// MODAIS GERAIS
window.abrirModalConfirmacao = () => {
    const modal = document.getElementById("modalConfirmacao");
    if (modal) modal.style.display = "flex";
};

window.fecharTodosModais = () => {
    ["modalConfirmacao", "modalDetalhesVeiculo", "popupAbastecimento", "modalAvisoCheckout"].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = "none";
    });

    const sidebar = document.getElementById("sidebar");
    const overlaySidebar = document.getElementById("overlayBlurSidebar");
    if (sidebar) sidebar.style.width = "0";
    if (overlaySidebar) overlaySidebar.classList.remove("active");
};

// CARREGAR DADOS TELA INICIAL (NOME E VEICULO)
window.carregarDadosTelaInicial = function() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        const technGreeting = document.getElementById('boas-vindas-titulo');
        const mangGreeting = document.getElementById('nome-usuario-logado');
        if (technGreeting) technGreeting.textContent = `Bem vindo, ${userName}!`;
        if (mangGreeting) mangGreeting.textContent = userName;
    }

    const vehicleData = localStorage.getItem("selectedVehicle");
    const postCheckin = document.getElementById("secao-pos-checkin");
    const infoDados = document.getElementById("info-veiculo-dados");
    const btnCheckin = document.getElementById("container-checkin-botao");

    // SE NÃO HOUVER VEÍCULO NO STORAGE
    if (!vehicleData || vehicleData === "null") {
        if (btnCheckin) btnCheckin.style.setProperty('display', 'block', 'important');
        if (infoDados) infoDados.style.setProperty('display', 'none', 'important');
        if (postCheckin) postCheckin.style.setProperty('display', 'none', 'important');
        return;
    }

    // SE HOUVER VEÍCULO NO STORAGE
    try {
        const vehicle = JSON.parse(vehicleData);
        if (btnCheckin) btnCheckin.style.setProperty('display', 'none', 'important');
        if (infoDados) infoDados.style.setProperty('display', 'block', 'important');
        if (postCheckin) postCheckin.style.setProperty('display', 'block', 'important');

        if (document.getElementById("display-modelo")) document.getElementById("display-modelo").textContent = vehicle.model;
        if (document.getElementById("display-placa")) document.getElementById("display-placa").textContent = vehicle.licensePlate;
        if (document.getElementById("display-prefixo")) document.getElementById("display-prefixo").textContent = vehicle.prefix;

        const kmInput = document.getElementById("quilometragem-inicial");
        const obsInput = document.getElementById("observacoes");
        if (kmInput) kmInput.value = localStorage.getItem("km") || "";
        if (obsInput) obsInput.value = localStorage.getItem("obs") || "";
    } catch (e) {
        localStorage.removeItem("selectedVehicle");
    }
};

// --- POPUP ABASTECIMENTO ---
window.abrirPopupAbastecimento = () => {
    const popup = document.getElementById("popupAbastecimento");
    if (popup) popup.style.display = "flex";
};

document.addEventListener("DOMContentLoaded", () => {

    const btnVoltar = document.getElementById("btn-voltar");
    if (btnVoltar) {
        btnVoltar.addEventListener("click", () => {
            const popup = document.getElementById("popupAbastecimento");
            if (popup) popup.style.display = "none";
        });
    }

    const btnSalvar = document.getElementById("btn-salvar-abastecimento");
    if (btnSalvar) {
        btnSalvar.addEventListener("click", async () => {

            const valor = document.getElementById("valor-abastecimento")?.value;
            const data = document.getElementById("data-abastecimento")?.value;
            const hora = document.getElementById("hora-abastecimento")?.value;

            const serviceId = localStorage.getItem("activeServiceId");

            if (!valor || !data || !hora) {
                alert("Preencha todos os campos.");
                return;
            }

            if (!serviceId) {
                alert("Nenhum serviço ativo.");
                return;
            }

            try {
                const response = await fetch(`http://localhost:8080/service/${serviceId}/fuel`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        amount: parseFloat(valor),
                        date: data,
                        time: hora
                    })
                });

                if (response.ok) {
                    alert("Abastecimento registrado!");
                    const popup = document.getElementById("popupAbastecimento");
                    if (popup) popup.style.display = "none";
                } else {
                    alert("Erro ao salvar abastecimento.");
                }

            } catch (error) {
                console.error(error);
                alert("Erro de conexão.");
            }
        });
    }

});

// pesquisa veículos.


function filtrarVeiculos() {
    const input = document.getElementById('inputPesquisa');
    const filtro = input.value.toLowerCase();
    const lista = document.getElementById('listaVeiculos');
    const botoes = lista.getElementsByTagName('button');

    for (let i = 0; i < botoes.length; i++) {
        let texto = botoes[i].textContent || botoes[i].innerText;
        if (texto.toLowerCase().indexOf(filtro) > -1) {
            botoes[i].style.display = "";
        } else {
            botoes[i].style.display = "none";
        }
    }
}


// filtração veículos

function filtrarVeiculos() {
    // Pega os valores dos filtros
    const termoPesquisa = document.getElementById('inputPesquisa').value.toUpperCase();
    const categoriaSelecionada = document.getElementById('filtroCategoria').value.toUpperCase();
    
    // Pega todos os botões de veículos
    const listaVeiculos = document.getElementById('listaVeiculos');
    const botoes = listaVeiculos.getElementsByClassName('btn-veiculo');

    for (let i = 0; i < botoes.length; i++) {
        const btn = botoes[i];
        const nomeVeiculo = btn.textContent || btn.innerText;
        const tipoVeiculo = btn.getAttribute('data-tipo').toUpperCase();

        // Lógica: Se o nome contém a pesquisa E (a categoria é 'TODOS' ou igual ao tipo do veículo)
        const correspondeNome = nomeVeiculo.toUpperCase().indexOf(termoPesquisa) > -1;
        const correspondeCategoria = (categoriaSelecionada === "TODOS" || tipoVeiculo === categoriaSelecionada);

        if (correspondeNome && correspondeCategoria) {
            btn.style.display = ""; // Mostra
        } else {
            btn.style.display = "none"; // Esconde
        }
    }
}

// / Funções para abrir/fechar o modal de filtro
function abrirModalFiltro() {
    document.getElementById('modalFiltroAvancado').style.display = 'flex';
}

function fecharModalFiltro() {
    document.getElementById('modalFiltroAvancado').style.display = 'none';
}

function aplicarFiltros() {
    const pesquisa = document.getElementById('inputPesquisa').value.toUpperCase();
    const tipo = document.getElementById('filtroTipo').value.toUpperCase();
    const marca = document.getElementById('filtroMarca').value.toUpperCase();
    
    const botoes = document.querySelectorAll('.btn-veiculo');

    botoes.forEach(btn => {
        const txtBotao = btn.textContent.toUpperCase();
        const vTipo = btn.getAttribute('data-tipo').toUpperCase();
        const vMarca = btn.getAttribute('data-marca').toUpperCase();

        // Checa todas as condições simultaneamente
        const batePesquisa = txtBotao.includes(pesquisa);
        const bateTipo = (tipo === "TODOS" || vTipo === tipo);
        const bateMarca = (marca === "TODOS" || vMarca === marca);

        if (batePesquisa && bateTipo && bateMarca) {
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }
    });

    fecharModalFiltro(); // Fecha após aplicar
}

// Vincula a pesquisa por texto para rodar a mesma lógica
function filtrarVeiculos() {
    aplicarFiltros(); 

}