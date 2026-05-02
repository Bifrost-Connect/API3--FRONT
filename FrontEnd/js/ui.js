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
window.carregarDadosTelaInicial = function () {
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

            const campos = ['litros-abastecimento', 'preco-litro', 'km-veiculo', 'nf-abastecimento', 'data-abastecimento', 'hora-abastecimento', 'troca-oleo'];
            let algumVazio = false;

            campos.forEach(id => {
                const input = document.getElementById(id);
                if (input.value === "") {
                    input.style.borderColor = "red"; // Marca de vermelho
                    algumVazio = true;
                } else {
                    input.style.borderColor = "#252020"; // Volta ao normal
                }
            });

            if (algumVazio) {
                mostrarToast("Preencha todos os campos.");
                return;
            }


            const serviceId = localStorage.getItem("activeServiceId");


            if (!serviceId) {
                mostrarToast("Nenhum serviço ativo.");
                return;
            }

            popupAbastecimento.style.display = 'none';
            popupConfirmacao.style.display = 'flex';

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
                    mostrarToast("Abastecimento registrado!");
                    const popup = document.getElementById("popupAbastecimento");
                    if (popup) popup.style.display = "none";
                } else {
                    mostrarToast("Erro ao salvar abastecimento.");
                }

            } catch (error) {
                console.error(error);
                mostrarToast("Erro de conexão.");
            }
        });
    }

});

// confirmação de abastecimento

const popupAbastecimento = document.getElementById('popupAbastecimento');
const popupConfirmacao = document.getElementById('popupConfirmacao');
const popupSucesso = document.getElementById('popupSucesso');

const btnSalvarAbastecimento = document.getElementById('btn-salvar-abastecimento');
const btnCancelarConfirmacao = document.getElementById('btn-cancelar-confirmacao');
const btnConfirmarFinal = document.getElementById('btn-confirmar-final');
const btnFecharSucesso = document.getElementById('btn-fechar-sucesso');

btnSalvarAbastecimento.addEventListener('click', () => {
    popupAbastecimento.style.display = 'none'; // Esconde o formulário
    popupConfirmacao.style.display = 'flex'; // Mostra a confirmação
});

btnCancelarConfirmacao.addEventListener('click', () => {
    popupConfirmacao.style.display = 'none';
    popupAbastecimento.style.display = 'flex'; // Volta para o formulário
});

btnConfirmarFinal.addEventListener('click', () => {

    popupConfirmacao.style.display = 'none';
    popupSucesso.style.display = 'flex'; // Mostra o sucesso
});

btnFecharSucesso.addEventListener('click', () => {
    popupSucesso.style.display = 'none';
});

//Função para mostrar o Toast
function mostrarToast(mensagem) {
    const toast = document.getElementById("toast-aviso");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        // Esconde após 3 segundos
        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => { toast.style.display = "none"; }, 500);
        }, 3000);
    }
}

