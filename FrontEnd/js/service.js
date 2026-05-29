/**
 * ===================================================================
 * ARQUIVO: service.js
 * REFERÊNCIA GLOBAL: Requer 'basic.js' (Utiliza apiFetch e mostrarToast)
 * RESPONSABILIDADE: Gerenciar o ciclo de vida operacional da frota
 * (Check-in, Check-out, Abastecimento) e controlar as transições de
 * interface durante um chamado ativo.
 * ===================================================================
 */

// ===================================================================
// 1. CHECK-IN (INÍCIO DE SERVIÇO)
// ===================================================================

/**
 * Função: salvarVeiculoInfo
 * O que faz: Captura as informações de partida (Viatura, Usuário e KM inicial),
 * envia para a API para iniciar um novo registro de serviço (chamado).
 * Em caso de sucesso, armazena o ID do serviço localmente para uso futuro.
 * Requisição: POST /service/start
 */
window.salvarVeiculoInfo = async function () {
    const kmInput = document.getElementById("quilometragem-inicial")?.value;
    const obsInput = document.getElementById("observacoes")?.value || "";
    const matricula = localStorage.getItem("userRegistration");

    // Obtém o veículo previamente selecionado na interface
    const vehicleData = localStorage.getItem('selectedVehicle');
    const vehicle = vehicleData ? JSON.parse(vehicleData) : null;

    // Validações de segurança antes de disparar a requisição
    if (!vehicle || !matricula) {
        window.mostrarToast("Erro: Matrícula do usuário ou veículo não encontrados.");
        return;
    }

    if (!kmInput) {
        window.mostrarToast("Por favor, preencha a quilometragem inicial.");
        return;
    }

    try {
        // Envia os dados para a API via wrapper global
        const response = await window.apiFetch("/service/start", {
            method: "POST",
            body: JSON.stringify({
                carPrefix: vehicle.prefix.trim(),
                userRegistration: matricula,
                recordKm: parseFloat(kmInput),
                note: obsInput,
                destinationRequester: "Não informado", // Requisito do DTO do Backend
                priority: "MEDIUM"                     // Requisito do DTO do Backend
            })
        });

        if (response && response.ok) {
            const data = await response.json();

            // Salva o ID do serviço gerado pelo Backend (necessário para o check-out/abastecimento)
            const idServico = data.serviceId || data.id;
            localStorage.setItem("activeServiceId", idServico);

            // Guarda o KM inicial para validação contra fraudes/erros no momento do Check-out
            localStorage.setItem("km", kmInput);
            localStorage.setItem("obs", obsInput);

            window.mostrarToast("Check-in confirmado no sistema!", "toast-aviso1");

            // Aciona a transição visual da tela para "Em Serviço" caso a função exista
            if (typeof transicaoPosCheckin === "function") transicaoPosCheckin();

        } else if (response) {
            const erro = await response.json();
            window.mostrarToast("Erro: " + (erro.error || "Falha ao realizar check-in no banco."));
        }
    } catch (error) {
        console.error("Erro na API de Check-in:", error);
        window.mostrarToast("Falha de conexão com o servidor.");
    }
};


// ===================================================================
// 2. CHECK-OUT (ENCERRAMENTO DE SERVIÇO)
// ===================================================================

/**
 * Função: checkoutChamado
 * O que faz: Finaliza o serviço ativo enviando a KM de chegada. Possui
 * validação rigorosa para impedir que a KM final seja menor que a inicial.
 * Requisição: POST /service/finalize/{serviceId}
 */
window.checkoutChamado = async () => {
    const serviceId = localStorage.getItem("activeServiceId");
    const kmInicialSalvo = parseFloat(localStorage.getItem("km")) || 0;

    // Fallback: Busca o valor final no ID específico ou reaproveita o ID inicial dependendo de como o HTML mockado foi estruturado
    const inputFinal = document.getElementById("quilometragem-final")?.value || document.getElementById("quilometragem-inicial")?.value;

    if (!serviceId) {
        window.mostrarToast("Nenhum serviço ativo encontrado para fazer check-out.");
        return;
    }

    if (!inputFinal || inputFinal.trim() === "") {
        window.mostrarToast("Por favor, insira a quilometragem final de chegada.");
        return;
    }

    const kmFinalValue = parseFloat(inputFinal);

    // Impede Check-out inconsistente
    if (kmFinalValue < kmInicialSalvo) {
        window.mostrarToast(`Erro: A KM Final (${kmFinalValue}) não pode ser menor que a Inicial (${kmInicialSalvo}).`);
        return;
    }

    try {
        const response = await window.apiFetch(`/service/finalize/${serviceId}`, {
            method: "POST",
            body: JSON.stringify({ recordKm: kmFinalValue })
        });

        if (response && response.ok) {
            // Limpeza completa da sessão de trabalho do veículo
            localStorage.removeItem("selectedVehicle");
            localStorage.removeItem("km");
            localStorage.removeItem("obs");
            localStorage.removeItem("activeServiceId");

            // Aciona o novo modal de sucesso da interface mockada
            const modalNovo = document.getElementById("modalAvisoCheckout");
            if (modalNovo) {
                modalNovo.style.display = "flex";
            } else {
                // Fallback para caso a tela antiga ainda esteja sendo usada
                window.mostrarToast("Check-out realizado com sucesso!", "toast-aviso1");
                setTimeout(() => window.location.reload(), 2000);
            }
        } else if (response) {
            const erro = await response.json();
            window.mostrarToast("Erro: " + (erro.error || "Erro ao fazer o check-out no servidor."));
        }
    } catch (error) {
        console.error("Erro na API de Checkout:", error);
        window.mostrarToast("Falha de conexão com o servidor.");
    }
};

/**
 * Função: finalizarCheckout
 * O que faz: Conectada ao botão de fechamento do Modal de Checkout da nova
 * interface mockada. Apenas recarrega a página para resetar o layout.
 */
window.finalizarCheckout = () => {
    window.location.reload();
};


// ===================================================================
// 3. ABASTECIMENTO (DURANTE O SERVIÇO)
// ===================================================================

window.abrirPopupAbastecimento = function() {
    const popup = document.getElementById('popupAbastecimento');
    if (popup) popup.style.display = 'flex';
};

/**
 * Função: registrarAbastecimento
 * O que faz: Relaciona um registro de combustível ao serviço ativo atual.
 * Calcula o valor total e consome o endpoint de injeção de combustível.
 * Requisição: POST /service/{serviceId}/fuel
 */
window.registrarAbastecimento = async function () {
    const serviceId = localStorage.getItem("activeServiceId");

    // Captura os dados
    const litros = document.getElementById("litros-abastecimento")?.value;
    const preco = document.getElementById("preco-litro")?.value;
    const data = document.getElementById("data-abastecimento")?.value;
    const hora = document.getElementById("hora-abastecimento")?.value;

    // NOVO: Captura a KM exata do momento do abastecimento
    const kmAbastecimento = document.getElementById("km-abastecimento")?.value;

    if (!serviceId) {
        window.mostrarToast("Nenhum serviço ativo. Faça o check-in primeiro.");
        return;
    }

    if (!litros || !preco || !data || !hora || !kmAbastecimento) {
        window.mostrarToast("Preencha Litros, Preço, Data, Horário e a KM atual.");
        return;
    }

    // CORREÇÃO: Substitui vírgula por ponto para o parseFloat funcionar no padrão PT-BR
    const litrosNum = parseFloat(litros.replace(',', '.'));
    const precoNum = parseFloat(preco.replace(',', '.'));
    const kmNum = parseFloat(kmAbastecimento.replace(',', '.'));

    // Calcula o valor total com os números corrigidos
    const valorTotal = (litrosNum * precoNum).toFixed(2);
    const dataHoraIso = `${data}T${hora}:00`;

    try {
        const response = await window.apiFetch(`/service/${serviceId}/fuel`, {
            method: 'POST',
            body: JSON.stringify({
                amount: litrosNum,
                totalValue: parseFloat(valorTotal),
                date: dataHoraIso,
                recordKm: kmNum // NOVO: Enviando a KM atualizada para o backend
            })
        });

        if (response && response.ok) {
            const popupConfAbs = document.getElementById('popupConfirmacaoAbs');
            const popupAbs = document.getElementById('popupAbastecimento');
            if (popupConfAbs) popupConfAbs.style.display = 'none';
            if (popupAbs) popupAbs.style.display = 'none';

            window.mostrarToast("Abastecimento registrado com sucesso!", "toast-aviso1");
        } else if (response) {
            const erro = await response.json();
            window.mostrarToast("Erro ao abastecer: " + (erro.error || "Falha na operação"));
        }
    } catch (error) {
        console.error("Erro na requisição de abastecimento:", error);
        window.mostrarToast("Falha ao conectar com o servidor.");
    }
};


// ===================================================================
// 4. CONTROLES DE INTERFACE (UI)
// ===================================================================

/**
 * Função: transicaoPosCheckin
 * O que faz: Altera dinamicamente os botões na tela inicial, escondendo
 * a preparação de serviço e habilitando os botões de Check-out e Abastecimento.
 */
window.transicaoPosCheckin = function () {
    const IDsEsconder = ['grupo-km-inicial', 'btn-salvar-veiculo', 'btn-cancelar-veiculo'];
    IDsEsconder.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const IDsMostrar = ['grupo-km-final', 'btn-abs-veiculo', 'btn-checkout'];
    IDsMostrar.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'inline-block';
    });

    // Tenta preencher automaticamente o campo final com o valor salvo para agilizar a digitação
    const inputKmFinal = document.getElementById("quilometragem-final");
    const kmInicialSalvo = localStorage.getItem("km");
    if (inputKmFinal && kmInicialSalvo) {
        inputKmFinal.value = kmInicialSalvo;
    }
};

/**
 * Função: cancelarVeiculoInfo
 * O que faz: Interrompe a intenção de Check-in (antes de enviar à API),
 * restaurando a interface para o momento de seleção de viaturas.
 */
window.cancelarVeiculoInfo = function () {
    const secaoPosCheckin = document.getElementById('secao-pos-checkin');
    const infoVeiculoDados = document.getElementById('info-veiculo-dados');
    const containerCheckinBotao = document.getElementById('container-checkin-botao');

    if (secaoPosCheckin) secaoPosCheckin.style.display = 'none';
    if (infoVeiculoDados) infoVeiculoDados.style.display = 'none';
    if (containerCheckinBotao) containerCheckinBotao.style.display = 'block';

    localStorage.removeItem("selectedVehicle");
};