/**
 * ===================================================================
 * ARQUIVO: service.js
 * RESPONSABILIDADE: Gerenciar o ciclo de vida operacional da frota
 * (Check-in, Check-out, Abastecimento e Edição de KM).
 * ===================================================================
 */

// ===================================================================
// 0. CONTROLE DE EDIÇÃO DA QUILOMETRAGEM INICIAL (✏️)
// ===================================================================

window.alternarEdicaoKM = function(permitirEditar) {
    const inputKM = document.getElementById("quilometragem-inicial");
    const btnEdit = document.getElementById("btn-edit-km");
    const btnSave = document.getElementById("btn-save-km");
    const btnCancel = document.getElementById("btn-cancel-km");

    if (!inputKM) return;

    if (permitirEditar) {
        inputKM.removeAttribute("readonly");
        inputKM.focus();
        if (btnEdit) btnEdit.style.display = "none";
        if (btnSave) btnSave.style.display = "inline-block";
        if (btnCancel) btnCancel.style.display = "inline-block";
    } else {
        inputKM.setAttribute("readonly", "true");
        const kmSalvo = localStorage.getItem("km");
        if (kmSalvo) inputKM.value = kmSalvo;
        if (btnEdit) btnEdit.style.display = "inline-block";
        if (btnSave) btnSave.style.display = "none";
        if (btnCancel) btnCancel.style.display = "none";
    }
};

window.salvarEdicaoKM = function() {
    const inputKM = document.getElementById("quilometragem-inicial");
    if (!inputKM) return;

    const novoValor = inputKM.value.trim();
    if (novoValor === "" || isNaN(parseFloat(novoValor.replace(',', '.')))) {
        window.mostrarToast("Por favor, digite um número de quilometragem válido.");
        return;
    }

    localStorage.setItem("km", novoValor);
    window.mostrarToast("Quilometragem alterada com sucesso!", "toast-aviso1");

    inputKM.setAttribute("readonly", "true");
    if (document.getElementById("btn-edit-km")) document.getElementById("btn-edit-km").style.display = "inline-block";
    if (document.getElementById("btn-save-km")) document.getElementById("btn-save-km").style.display = "none";
    if (document.getElementById("btn-cancel-km")) document.getElementById("btn-cancel-km").style.display = "none";
};

// ===================================================================
// 1. CHECK-IN (INÍCIO DE SERVIÇO)
// ===================================================================

window.salvarVeiculoInfo = async function () {
    const kmInput = document.getElementById("quilometragem-inicial")?.value;
    const obsInput = document.getElementById("observacoes")?.value || "";
    const matricula = localStorage.getItem("userRegistration");

    const vehicleData = localStorage.getItem('selectedVehicle');
    const vehicle = vehicleData ? JSON.parse(vehicleData) : null;

    if (!vehicle || !matricula) {
        window.mostrarToast("Erro: Matrícula do usuário ou veículo não encontrados.");
        return;
    }

    if (!kmInput) {
        window.mostrarToast("Por favor, preencha a quilometragem inicial.");
        return;
    }

    try {
        const response = await window.apiFetch("/service/start", {
            method: "POST",
            body: JSON.stringify({
                carPrefix: vehicle.prefix.trim(),
                userRegistration: matricula,
                recordKm: parseFloat(kmInput.replace(',', '.')),
                note: obsInput,
                destinationRequester: "Não informado",
                priority: "MEDIUM"
            })
        });

        if (response && response.ok) {
            const data = await response.json();
            const idServico = data.serviceId || data.id;
            localStorage.setItem("activeServiceId", idServico);
            localStorage.setItem("km", kmInput);
            localStorage.setItem("obs", obsInput);

            window.mostrarToast("Check-in confirmado no sistema!", "toast-aviso1");
            if (typeof transicaoPosCheckin === "function") transicaoPosCheckin();
        } else if (response) {
            const erro = await response.json();
            window.mostrarToast("Erro: " + (erro.error || "Falha ao realizar check-in."));
        }
    } catch (error) {
        console.error("Erro na API de Check-in:", error);
        window.mostrarToast("Falha de conexão com o servidor.");
    }
};

// ===================================================================
// 2. CHECK-OUT (ENCERRAMENTO DE SERVIÇO)
// ===================================================================

window.checkoutChamado = async () => {
    const serviceId = localStorage.getItem("activeServiceId");
    const kmInicialSalvo = parseFloat(localStorage.getItem("km")?.replace(',', '.')) || 0;
    const inputFinal = document.getElementById("quilometragem-final")?.value || document.getElementById("quilometragem-inicial")?.value;

    if (!serviceId) {
        window.mostrarToast("Nenhum serviço ativo encontrado para fazer check-out.");
        return;
    }

    if (!inputFinal || inputFinal.trim() === "") {
        window.mostrarToast("Por favor, insira a quilometragem final de chegada.");
        return;
    }

    // Tratamento rigoroso do número para evitar problemas de conversão no servidor Java/C#
    const kmFinalValue = parseFloat(inputFinal.replace(',', '.'));

    if (kmFinalValue < kmInicialSalvo) {
        window.mostrarToast(`Erro: A KM Final (${kmFinalValue}) não pode ser menor que a Inicial (${kmInicialSalvo}).`);
        return;
    }

    try {
        // Mudamos o corpo do JSON para passar tanto o serviceId quanto o recordKm
        // para cobrir qualquer variação de contrato do DTO do Back-end.
        const response = await window.apiFetch(`/service/finalize/${serviceId}`, {
            method: "POST",
            body: JSON.stringify({
                id: parseInt(serviceId),
                serviceId: parseInt(serviceId),
                recordKm: kmFinalValue
            })
        });

        if (response && response.ok) {
            // Limpeza completa da sessão de trabalho do veículo
            localStorage.removeItem("selectedVehicle");
            localStorage.removeItem("km");
            localStorage.removeItem("obs");
            localStorage.removeItem("activeServiceId");

            const modalNovo = document.getElementById("modalAvisoCheckout");
            if (modalNovo) {
                modalNovo.style.display = "flex";
            } else {
                window.mostrarToast("Check-out realizado com sucesso!", "toast-aviso1");
                setTimeout(() => window.location.reload(), 2000);
            }
        } else if (response) {
            const erro = await response.json();
            window.mostrarToast("Erro: " + (erro.error || "Erro ao fazer o check-out."));
        }
    } catch (error) {
        console.error("Erro na API de Checkout:", error);
        window.mostrarToast("Falha de conexão com o servidor.");
    }
};

window.finalizarCheckout = () => {
    window.location.reload();
};

// ===================================================================
// 3. ABASTECIMENTO
// ===================================================================

window.abrirPopupAbastecimento = function() {
    const popup = document.getElementById('popupAbastecimento');
    if (popup) popup.style.display = 'flex';
};

window.fecharPopupAbastecimento = function() {
    const popup = document.getElementById('popupAbastecimento');
    if (popup) popup.style.display = 'none';
};

window.registrarAbastecimento = function () {
    const serviceId = localStorage.getItem("activeServiceId");
    const litros = document.getElementById("litros-abastecimento")?.value;
    const preco = document.getElementById("preco-litro")?.value;
    const data = document.getElementById("data-abastecimento")?.value;
    const hora = document.getElementById("hora-abastecimento")?.value;

    // CORRIGIDO: ID alterado para bater com o seu HTML (km-veiculo)
    const kmAbastecimento = document.getElementById("km-veiculo")?.value;

    if (!serviceId) {
        window.mostrarToast("Nenhum serviço ativo. Faça o check-in primeiro.");
        return;
    }

    if (!litros || !preco || !data || !hora || !kmAbastecimento) {
        window.mostrarToast("Preencha todos os campos obrigatórios do abastecimento.");
        return;
    }

    // Fecha popup de dados e abre o de confirmação intermediária
    window.fecharPopupAbastecimento();
    const popupConf = document.getElementById('popupConfirmacao');
    if (popupConf) popupConf.style.display = 'flex';
};

window.fecharPopupConfirmacaoAbastecimento = function() {
    const popupConf = document.getElementById('popupConfirmacao');
    if (popupConf) popupConf.style.display = 'none';
    window.abrirPopupAbastecimento();
};

window.confirmarAbastecimentoFinal = async function() {
    const serviceId = localStorage.getItem("activeServiceId");
    const litros = document.getElementById("litros-abastecimento")?.value.replace(',', '.');
    const preco = document.getElementById("preco-litro")?.value.replace(',', '.');
    const kmVeiculo = document.getElementById("km-veiculo")?.value.replace(',', '.');
    const data = document.getElementById("data-abastecimento")?.value;
    const hora = document.getElementById("hora-abastecimento")?.value;

    const litrosNum = parseFloat(litros);
    const precoNum = parseFloat(preco);
    const kmNum = parseFloat(kmVeiculo);
    const valorTotal = (litrosNum * precoNum).toFixed(2);
    const dataHoraIso = `${data}T${hora}:00`;

    try {
        const response = await window.apiFetch(`/service/${serviceId}/fuel`, {
            method: 'POST',
            body: JSON.stringify({
                amount: litrosNum,
                totalValue: parseFloat(valorTotal),
                date: dataHoraIso,
                recordKm: kmNum
            })
        });

        if (response && response.ok) {
            document.getElementById('popupConfirmacao').style.display = 'none';
            const popupSucesso = document.getElementById('popupSucesso');
            if (popupSucesso) popupSucesso.style.display = 'flex';
        } else if (response) {
            const erro = await response.json();
            window.mostrarToast("Erro ao abastecer: " + (erro.error || "Falha na operação"));
        }
    } catch (error) {
        console.error("Erro na requisição de abastecimento:", error);
        window.mostrarToast("Falha ao conectar com o servidor.");
    }
};

window.fecharPopupSucessoAbastecimento = function() {
    const popupSucesso = document.getElementById('popupSucesso');
    if (popupSucesso) popupSucesso.style.display = 'none';
};

// ===================================================================
// 4. CANCELAMENTO DE CHECK-IN E CHAMADOS
// ===================================================================

window.abrirPopupCancelamento = function() {
    const popup = document.getElementById('popupcancheckin');
    if (popup) {
        popup.style.display = 'flex';
    } else {
        console.error("Erro: Elemento 'popupcancheckin' não encontrado no HTML.");
    }
};

window.fecharPopupCancelamento = function() {
    const popup = document.getElementById('popupcancheckin');
    if (popup) popup.style.display = 'none';
};

window.confirmarCancelamentoCheckin = function() {
    const motivo = document.getElementById('cancelamentocheckin')?.value;

    if (!motivo || motivo.trim() === "") {
        window.mostrarToast("Por favor, digite o motivo do cancelamento.");
        return;
    }

    // Fecha o popup de pergunta
    window.fecharPopupCancelamento();

    // Abre o popup de sucesso
    const popupSucesso = document.getElementById('popupSucessoCancelamento');
    if (popupSucesso) popupSucesso.style.display = 'flex';
};

window.fecharPopupSucessoCancelamento = function() {
    const popupSucesso = document.getElementById('popupSucessoCancelamento');
    if (popupSucesso) {
        popupSucesso.style.display = 'none';
    }

    // Limpeza radical do estado local para destravar o sistema
    localStorage.removeItem("selectedVehicle");
    localStorage.removeItem("km");
    localStorage.removeItem("obs");
    localStorage.removeItem("activeServiceId");
    localStorage.removeItem("chamadoPendenteId");

    // Força a página a recarregar limpa
    window.location.reload();
};

// Adicionando uma função genérica para o caso do HTML estar chamando outro nome
window.fecharPopupSucesso = function() {
    const popupSucesso = document.getElementById('popupSucesso');
    if (popupSucesso) popupSucesso.style.display = 'none';
    window.location.reload();
};

// ===================================================================
// 5. INTEGRAÇÕES DE INTERFACE ADICIONAIS
// ===================================================================

window.transicaoPosCheckin = function () {
    const IDsEsconder = ['grupo-km-inicial', 'btn-salvar-veiculo', 'btn-cancelar-veiculo'];
    IDsEsconder.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const IDsMostrar = ['grupo-km-final', 'btn-abs-veiculo', 'btn-checkout', 'btn-cancelar-veiculo2'];
    IDsMostrar.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'inline-block';
    });

    const inputKmFinal = document.getElementById("quilometragem-final");
    const kmInicialSalvo = localStorage.getItem("km");
    if (inputKmFinal && kmInicialSalvo) {
        inputKmFinal.value = kmInicialSalvo;
    }
};

window.cancelarVeiculoInfo = function () {
    const secaoPosCheckin = document.getElementById('secao-pos-checkin');
    const infoVeiculoDados = document.getElementById('info-veiculo-dados');
    const containerCheckinBotao = document.getElementById('container-checkin-botao');

    if (secaoPosCheckin) secaoPosCheckin.style.display = 'none';
    if (infoVeiculoDados) infoVeiculoDados.style.display = 'none';
    if (containerCheckinBotao) containerCheckinBotao.style.display = 'block';

    localStorage.removeItem("selectedVehicle");
};

window.carregarChamadosDisponiveis = async function() {
    const container = document.getElementById("lista-chamados-container");
    if (!container) return;

    try {
        const response = await window.apiFetch("/service/pending", { method: "GET" });
        if (response && response.ok) {
            const chamados = await response.json();
            if (chamados.length === 0) {
                container.innerHTML = `<p style="text-align: center; color: #666;">Nenhum chamado disponível no momento.</p>`;
                return;
            }
            container.innerHTML = "";
            chamados.forEach(chamado => {
                const card = `
                    <div class="chamado-card">
                        <h2 class="chamado-titulo">Serviço #${chamado.id} - Prioridade: ${chamado.priority}</h2>
                        <div class="chamado-conteudo">
                            <p><strong>Destino/Cliente:</strong> ${chamado.destinationRequester || 'Não informado'}</p>
                            <p><strong>Descrição:</strong> ${chamado.description || 'Sem descrição'}</p>
                            <p><strong>Previsão:</strong> ${chamado.expectedCompletionTime ? new Date(chamado.expectedCompletionTime).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                        </div>
                        <button class="btn-aceitar" onclick="localStorage.setItem('chamadoPendenteId', ${chamado.id}); if(typeof abrirModalConfirmacao==='function')abrirModalConfirmacao();">
                            Aceitar chamado
                        </button>
                    </div>`;
                container.insertAdjacentHTML('beforeend', card);
            });
        } else {
            container.innerHTML = `<p style="text-align: center; color: red;">Erro ao carregar chamados.</p>`;
        }
    } catch (error) {
        console.error("Erro ao buscar chamados:", error);
        container.innerHTML = `<p style="text-align: center; color: red;">Falha de ligação com o servidor.</p>`;
    }
};

// Fallbacks para as funções de modais de outros arquivos não travarem a UI
const fallbacks = ['abrirModalConfirmacao', 'filtrarVeiculos', 'abrirModalFiltro', 'fecharModalFiltro', 'aplicarFiltros', 'voltarParaVeiculos', 'confirmarVeiculo', 'fecharModalMensagem'];
fallbacks.forEach(fn => { if (typeof window[fn] !== "function") window[fn] = function() { console.warn(`Método ${fn} não implementado.`); }; });