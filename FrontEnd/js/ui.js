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

document.addEventListener("DOMContentLoaded", () => {

    // 1. FUNÇÃO PARA ABRIR O POPUP (Colocada no window para o HTML enxergar)
    window.abrirPopupAbastecimento = () => {
        const popup = document.getElementById("popupAbastecimento");
        if (popup) popup.style.display = "flex";
    };

    const popupAbs = document.getElementById('popupAbastecimento');
    const popupConf = document.getElementById('popupConfirmacao');
    const popupSuc = document.getElementById('popupSucesso');

    const btnSalvarAbs = document.getElementById('btn-salvar-abastecimento');
    const btnVoltar = document.getElementById("btn-voltar");
    const btnCancelaConf = document.getElementById('btn-cancelar-confirmacao');
    const btnConfirmaFin = document.getElementById('btn-confirmar-final');
    const btnFechaSuc = document.getElementById('btn-fechar-sucesso');


    // Botão Voltar (do formulário)
    if (btnVoltar) {
        btnVoltar.onclick = () => popupAbs.style.display = "none";
    }

    // Botão Salvar (Valida e abre Confirmação)
    if (btnSalvarAbs) {
        btnSalvarAbs.onclick = () => {
            const camposIds = ['litros-abastecimento', 'preco-litro', 'km-veiculo', 'nf-abastecimento', 'data-abastecimento', 'hora-abastecimento', 'troca-oleo'];
            let algumVazio = false;

            camposIds.forEach(id => {
                const input = document.getElementById(id);
                if (!input || input.value.trim() === "") {
                    if (input) input.style.borderColor = "red";
                    algumVazio = true;
                } else {
                    if (input) input.style.borderColor = "#252020";
                }
            });

            if (algumVazio) {
                mostrarToast("Preencha todos os campos!");
                return; // PARA AQUI se estiver vazio
            }

            // Se estiver tudo ok, troca de popup
            popupAbs.style.display = 'none';
            popupConf.style.display = 'flex';
        };
    }

    // Botão Cancelar (na confirmação)
    if (btnCancelaConf) {
        btnCancelaConf.onclick = () => {
            popupConf.style.display = 'none';
            popupAbs.style.display = 'flex';
        };
    }

    // Botão Confirmar Final (Envia e mostra Sucesso)
    if (btnConfirmaFin) {
        btnConfirmaFin.onclick = async () => {
            const serviceId = localStorage.getItem("activeServiceId");
            const litros = document.getElementById("litros-abastecimento")?.value;
            const data = document.getElementById("data-abastecimento")?.value;
            const hora = document.getElementById("hora-abastecimento")?.value;

            if (!serviceId) {
                mostrarToast("Nenhum serviço ativo.");
                return;
            }

            try {
                // Tenta enviar se tiver serviceId
                if (serviceId) {
                    await fetch(`http://localhost:8080/service/${serviceId}/fuel`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: parseFloat(litros),
                            date: data,
                            time: hora
                        })
                    });
                }

                if (response.ok) {
                    mostrarToast1("Abastecimento registrado!");
                    document.getElementById("popupAbastecimento").style.display = "none";

                    // Abre o popup de sucesso se ele existir no HTML
                    const popupSucesso = document.getElementById("popupSucesso");
                    if (popupSucesso) popupSucesso.style.display = "flex";
                } else {
                    mostrarToast("Erro ao salvar abastecimento.");
                }

            } catch (error) {
                console.error("Erro no Fetch:", error);
                mostrarToast("Erro de conexão.");
            }

            // Avança para a tela de sucesso de qualquer forma (para teste visual)
            popupConf.style.display = 'none';
            popupSuc.style.display = 'flex';
        };
    }

    // Botão Fechar Sucesso
    if (btnFechaSuc) {
        btnFechaSuc.onclick = () => popupSuc.style.display = 'none';
    }
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

//Função para mostrar o Toast
function mostrarToast1(mensagem) {
    const toast = document.getElementById("toast-aviso1");
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

// Variável global para guardar o valor antigo caso o usuário cancele
let valorKmOriginal = "";

function alternarEdicaoKM(editando) {
    const input = document.getElementById('quilometragem-inicial');
    const btnEdit = document.getElementById('btn-edit-km');
    const btnSave = document.getElementById('btn-save-km');
    const btnCancel = document.getElementById('btn-cancel-km');

    if (editando) {
        // Salva o valor atual antes de começar a editar
        valorKmOriginal = input.value;
        
        input.readOnly = false;
        input.focus();
        btnEdit.style.display = 'none';
        btnSave.style.display = 'flex';
        btnCancel.style.display = 'flex';
    } else {
        // Cancela: volta o valor original e tranca o campo
        input.value = valorKmOriginal;
        input.readOnly = true;
        btnEdit.style.display = 'flex';
        btnSave.style.display = 'none';
        btnCancel.style.display = 'none';
    }
}

function salvarEdicaoKM() {
    const input = document.getElementById('quilometragem-inicial');
    const btnEdit = document.getElementById('btn-edit-km');
    const btnSave = document.getElementById('btn-save-km');
    const btnCancel = document.getElementById('btn-cancel-km');

    //adiciona validações
    if (input.value.trim() === "") {
        mostrarToast("Por favor, digite um valor.");
        return;
    }

    // Tranca o campo e volta ao estado inicial de botões
    input.readOnly = true;
    btnEdit.style.display = 'flex';
    btnSave.style.display = 'none';
    btnCancel.style.display = 'none';
    
    mostrarToast1("Nova KM salva:", input.value);
}

// Selecionando os elementos
document.addEventListener('DOMContentLoaded', () => {
    // Selecionando os elementos com IDs exclusivos para evitar conflitos
    const btnAbrirPopup = document.getElementById('btn-cancelar-veiculo2');
    const popupCancelamento = document.getElementById('popupcancheckin');
    const popupSucessoCancelamento = document.getElementById('popupSucessoCancelamento');
    const campoTexto = document.getElementById('cancelamentocheckin');

    const btnVoltar = document.getElementById('btn-cancelar-confirmacao1');
    const btnConfirmarCancelamento = document.getElementById('btn-confirmar-cancelamento');
    const btnFecharSucessoCancelamento = document.getElementById('btn-fechar-sucesso-cancelamento');

    // Verifica se os elementos realmente existem na página antes de adicionar os eventos
    if (btnAbrirPopup && popupCancelamento) {
        // 1. Abrir o primeiro pop-up ao clicar no botão de cancelar
        btnAbrirPopup.addEventListener('click', () => {
            popupCancelamento.style.display = 'flex'; 
        });
    }

    if (btnVoltar && popupCancelamento && campoTexto) {
        // 2. Botão Voltar (fecha o pop-up sem fazer nada)
        btnVoltar.addEventListener('click', () => {
            popupCancelamento.style.display = 'none';
            campoTexto.value = ''; // Limpa o texto
        });
    }

    if (btnConfirmarCancelamento && campoTexto && popupCancelamento && popupSucessoCancelamento) {
        // 3. Botão Confirmar Final
        btnConfirmarCancelamento.addEventListener('click', () => {
            const motivo = campoTexto.value.trim();

            if (motivo === "") {
                // Verifica se a função mostrarToast existe (evita quebrar se estiver em outro arquivo)
                if (typeof mostrarToast === "function") {
                    mostrarToast("Por favor, digite o motivo do cancelamento.");
                } else {
                    mostrarToast("Por favor, digite o motivo do cancelamento.");
                }
                return;
            }

            console.log("Cancelamento confirmado. Motivo:", motivo);

            // Troca os pop-ups
            popupCancelamento.style.display = 'none';
            popupSucessoCancelamento.style.display = 'flex';
        });
    }

    if (btnFecharSucessoCancelamento && popupSucessoCancelamento && campoTexto) {
        // 4. Fechar pop-up de sucesso
        btnFecharSucessoCancelamento.addEventListener('click', () => {
            popupSucessoCancelamento.style.display = 'none';
            campoTexto.value = '';
        });
    }
});