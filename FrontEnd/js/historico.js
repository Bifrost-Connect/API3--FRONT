/**
 * ===================================================================
 * ARQUIVO: historico.js
 * REFERÊNCIA GLOBAL: Requer 'basic.js' (Utiliza apiFetch e exibirErro)
 * RESPONSABILIDADE: Buscar, formatar, filtrar e exibir a linha do tempo
 * (log de auditoria do Hibernate Envers) de todos os chamados.
 * ===================================================================
 */

// ===================================================================
// 1. ESTADO GLOBAL
// ===================================================================
let chamadosHistorico = [];

// ===================================================================
// 2. INTEGRAÇÃO API E PROCESSAMENTO DE DADOS
// ===================================================================

/**
 * Função: inicializarHistorico
 * O que faz: Busca o log de auditoria do backend, faz o mapeamento
 * (parse) das revisões do banco de dados para um formato legível,
 * atualiza os KPIs e dispara a renderização dos cards na tela.
 * Requisição: GET /dashboard/history
 */
async function inicializarHistorico() {
    const container = document.getElementById("historicoLista");
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando histórico de auditoria...</p>';

    try {
        // Usa o wrapper global que injeta o Bearer Token automaticamente
        const response = await window.apiFetch("/dashboard/history", { method: "GET" });
        if (!response) return; // basic.js intercepta redirecionamentos se sessão expirar

        if (!response.ok) {
            const erroTexto = await response.text();
            // Injeta o bloco visual de erro crítico dentro da div de histórico
            window.exibirErro(`Status HTTP: ${response.status} (${response.statusText})`, erroTexto, "#historicoLista");
            return;
        }

        const data = await response.json();

        // Faz o mapeamento (parse) dos dados complexos da auditoria para um modelo de front-end mais simples
        chamadosHistorico = data.map(rev => {
            if (!rev.entity) return null; // Prevenção contra registros corrompidos na auditoria

            const isFinalizado = rev.entity.completionTime !== null;
            const statusStr = isFinalizado ? "finalizado" : "andamento";
            const statusLabelStr = isFinalizado ? "Finalizado" : "Em andamento";

            // Puxa a data exata em que a auditoria registrou a modificação no banco
            const dataAbertura = new Date(rev.revisionDate || rev.entity.departureTime || new Date());
            const dia = String(dataAbertura.getDate()).padStart(2, '0');
            const mes = String(dataAbertura.getMonth() + 1).padStart(2, '0');
            const ano = dataAbertura.getFullYear();
            const horaStr = `${String(dataAbertura.getHours()).padStart(2, '0')}:${String(dataAbertura.getMinutes()).padStart(2, '0')}`;

            // Mapeamento e Estilização de Prioridade
            const rawPriority = rev.entity.priority || "MEDIUM";
            let prioLabel = "Média";
            let prioClass = "prioridade-baixa";

            if (rawPriority === "HIGH") {
                prioLabel = "Alta";
                prioClass = "prioridade-alta";
            } else if (rawPriority === "LOW" || rawPriority === "SCHEDULED") {
                prioLabel = rawPriority === "LOW" ? "Baixa" : "Agendado";
                prioClass = "prioridade-baixa";
            }

            // Mapeia se o registro foi uma criação (ADD) ou atualização/edição (MOD)
            const tipoAuditoria = rev.revisionType === 'ADD' ? "Novo Registro" : "Modificação";

            // Retorna o objeto polido pronto para a interface
            return {
                id: rev.entity.id,
                matricula: rev.entity.user?.registration || "N/A",
                status: statusStr,
                statusLabel: statusLabelStr,
                title: rev.revisionType === 'ADD' ? "Abertura de Chamado" : "Atualização/Baixa",
                subtitle: `Viatura ${rev.entity.car?.prefix || "N/A"}`,
                priorityClass: prioClass,
                priorityLabel: prioLabel,
                tipoRegistro: tipoAuditoria,
                dia: dia,
                mes: mes,
                ano: ano,
                prefixo: rev.entity.car?.prefix,
                tecnico: rev.entity.user?.name || "Desconhecido",
                responsavel: rev.entity.user?.name || "Desconhecido",
                abertura: `${dia}/${mes}/${ano} às ${horaStr}`,
                local: rev.entity.destinationRequester || "Não informado",
                observacao: rev.entity.description || "Sem observações.",
                execucao: isFinalizado ? formatarData(rev.entity.completionTime) : "",
            };
        }).filter(item => item !== null); // Remove os nulos da lista gerada

        renderizarChamados(chamadosHistorico);
        atualizarKpisHistorico(chamadosHistorico);

    } catch (error) {
        console.error("Erro Crítico no Histórico:", error);
        window.exibirErro("Erro de Comunicação JavaScript", error.message, "#historicoLista");
    }
}


// ===================================================================
// 3. COMPONENTES VISUAIS (Cards, Resumos e Utils)
// ===================================================================

function atualizarKpisHistorico(lista) {
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('kpi-total', lista.length);
    setText('kpi-finalizados', lista.filter(c => c.status === 'finalizado').length);
    setText('kpi-andamento', lista.filter(c => c.status === 'andamento').length);
    setText('kpi-novos', lista.filter(c => c.tipoRegistro === 'Novo Registro').length);
}

function formatarData(dataString) {
    if (!dataString) return "";
    return new Date(dataString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function montarDetalhe(label, value) {
    return `<div class="detalhe-bloco"><span class="detalhe-label">${label}</span><strong>${value || "Não há"}</strong></div>`;
}

/**
 * Função: renderizarChamados
 * O que faz: Constrói dinamicamente os cartões (<article>) do histórico baseados na lista recebida.
 */
function renderizarChamados(lista) {
    const container = document.getElementById("historicoLista");
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = `<div class="nenhum-registro" style="text-align: center; padding: 30px;">Nenhuma auditoria encontrada no momento.</div>`;
        return;
    }

    container.innerHTML = lista.map((chamado) => {
        const statusClass = chamado.status === "andamento" ? "status-andamento" : "status-finalizado";
        const itemClass = chamado.status === "andamento" ? "item-andamento" : "item-finalizado";

        let detalhes = montarDetalhe("Responsável", chamado.responsavel)
            + montarDetalhe("Registro", chamado.abertura)
            + montarDetalhe("Destino", chamado.local);

        if (chamado.status === "finalizado") {
            detalhes += montarDetalhe("Conclusão", chamado.execucao);
        }

        return `
            <article class="historico-item ${itemClass}">
                <div class="historico-item-topo">
                    <div>
                        <div class="historico-header-linha">
                            <span class="historico-numero">Auditoria ID: ${chamado.id}</span>
                            <span class="status-chip ${statusClass}">${chamado.statusLabel}</span>
                        </div>
                        <h3>${chamado.title}</h3>
                        <p class="historico-subtitulo">${chamado.subtitle}</p>
                    </div>
                    <div class="historico-prioridade ${chamado.priorityClass}">${chamado.priorityLabel}</div>
                </div>
                
                <div class="historico-detalhes">${detalhes}</div>
                
                <p class="historico-observacao">${chamado.observacao}</p>
                
                <button type="button" class="btn-detalhes" onclick="window.abrirDetalhesChamado(${chamado.id})">
                    Ver detalhes completos
                </button>
            </article>
        `;
    }).join("");
}


// ===================================================================
// 4. SISTEMA DE BUSCA E FILTROS RÁPIDOS
// ===================================================================

/**
 * Função: aplicarFiltrosHistorico
 * O que faz: Varre o cache de chamados em memória verificando o termo
 * digitado pelo gestor em atributos chave (Matrícula, Técnico, Prefixo, Título).
 */
window.aplicarFiltrosHistorico = function () {
    const input = document.getElementById("filtroBusca");
    if (!input) return;

    const busca = input.value.trim().toLowerCase();

    const filtrados = chamadosHistorico.filter((c) => {
        if (!busca) return true; // Se vazio, retorna todos
        return (c.matricula || "").toLowerCase().includes(busca) ||
            (c.tecnico || "").toLowerCase().includes(busca) ||
            (c.prefixo || "").toLowerCase().includes(busca) ||
            (c.title || "").toLowerCase().includes(busca);
    });

    renderizarChamados(filtrados);
};


// ===================================================================
// 5. CONTROLE DE MODAIS (Popups de Detalhes)
// ===================================================================

window.abrirDetalhesChamado = function (id) {
    const chamado = chamadosHistorico.find((item) => item.id === id);
    if (!chamado) return;

    // Atualiza cabeçalho
    const popupTitulo = document.getElementById("popupDetalhesTitulo");
    if (popupTitulo) popupTitulo.textContent = `${chamado.title} • ${chamado.statusLabel}`;

    // Atualiza corpo com as informações mapeadas
    const popupConteudo = document.getElementById("popupDetalhesConteudo");
    if (popupConteudo) {
        popupConteudo.innerHTML = `
            <div class="popup-grid">
                ${montarDetalhe("Tipo Aud.", chamado.tipoRegistro)}
                ${montarDetalhe("Técnico", chamado.tecnico)}
                ${montarDetalhe("Matrícula", chamado.matricula)}
                ${montarDetalhe("Data (Audit)", chamado.abertura)}
                ${montarDetalhe("Local/Destino", chamado.local)}
                ${montarDetalhe("Prioridade", chamado.priorityLabel)}
                ${montarDetalhe("Situação Atual", chamado.statusLabel)}
                ${chamado.status === "finalizado" ? montarDetalhe("Data de Conclusão", chamado.execucao) : ""}
            </div>
            <div class="popup-obs" style="margin-top: 15px;">
                <strong>Observação registrada:</strong>
                <p style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px; border-left: 3px solid #1a3c6d;">
                    ${chamado.observacao}
                </p>
            </div>
        `;
    }

    const modal = document.getElementById("popupChamadoDetalhes");
    if (modal) modal.style.display = "flex";
};

window.fecharPopupChamadoDetalhes = function () {
    const modal = document.getElementById("popupChamadoDetalhes");
    if (modal) modal.style.display = "none";
};


// ===================================================================
// 6. INICIALIZAÇÃO DE EVENTOS DOM
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Garante que só roda se a div principal de histórico existir na tela atual
    if (document.getElementById("historicoLista")) {
        inicializarHistorico();

        // Adiciona atalho de teclado para rodar o filtro de busca via Enter
        const busca = document.getElementById("filtroBusca");
        if (busca) {
            busca.addEventListener("keyup", (e) => {
                if (e.key === "Enter") window.aplicarFiltrosHistorico();
            });
        }
    }
});