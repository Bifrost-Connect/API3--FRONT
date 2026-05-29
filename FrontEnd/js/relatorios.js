/**
 * ===================================================================
 * ARQUIVO: relatorios.js
 * REFERÊNCIA GLOBAL: Requer 'basic.js' (Utiliza apiFetch, baixarArquivo, mostrarToast)
 * RESPONSABILIDADE: Carregar os relatórios mensais do dashboard do gestor,
 * manipular a exibição de meses, KPIs, tabela de chamados e gerenciar
 * a exportação de arquivos CSV.
 * ===================================================================
 */

// ===================================================================
// 1. ESTADO GLOBAL
// ===================================================================
let relatoriosDoBanco = [];
let selectedReportIndex = 0;

// ===================================================================
// 2. BUSCA E RENDERIZAÇÃO DA API
// ===================================================================

/**
 * Função: carregarRelatoriosDaAPI
 * O que faz: Busca os relatórios dos últimos meses na API. Corrige o mapeamento
 * lendo a propriedade "reports" retornada pelo Map.of() no Spring Boot.
 * Requisição: GET /dashboard/reports
 */
async function carregarRelatoriosDaAPI() {
    const tbody = document.querySelector(".relatorios-table tbody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">Carregando relatórios...</td></tr>`;
    }

    try {
        // Usa o wrapper global do basic.js batendo na rota correta do Controller
        const response = await window.apiFetch("/dashboard/reports", { method: "GET" });
        if (!response) return; // basic.js intercepta se token estiver inválido

        if (response.ok) {
            const data = await response.json();
            // O backend (DashboardController) retorna { "reports": [...] }
            relatoriosDoBanco = data.reports || [];
            inicializarRelatorios();
        } else {
            console.error("Erro ao buscar relatórios. Status:", response.status);
            mostrarErroNaTabela("Falha ao carregar os dados do servidor.");
        }
    } catch (error) {
        console.error("Erro de conexão com a API:", error);
        mostrarErroNaTabela("Erro de conexão. Verifique se o back-end está rodando.");
    }
}

/**
 * Função: inicializarRelatorios
 * O que faz: Valida se há dados para exibir. Se houver, aciona a criação
 * dos botões dos meses e seleciona o mais recente por padrão (índice 0).
 */
function inicializarRelatorios() {
    const containerMeses = document.getElementById("months-list");
    if (!containerMeses) return;

    if (!relatoriosDoBanco || relatoriosDoBanco.length === 0) {
        mostrarErroNaTabela("Nenhum relatório encontrado no banco de dados.");
        return;
    }

    renderizarMeses();
    window.selecionarRelatorio(0); // Força a exibição do primeiro mês da lista
}

/**
 * Função: renderizarMeses
 * O que faz: Cria dinamicamente os botões de navegação lateral com o Mês/Ano,
 * aplicando a classe 'active' ao botão do relatório atualmente selecionado.
 */
function renderizarMeses() {
    const container = document.getElementById("months-list");
    if (!container) return;

    container.innerHTML = ""; // Limpa os botões antes de recriar

    relatoriosDoBanco.forEach((month, index) => {
        const button = document.createElement("button");
        button.textContent = `${month.monthLabel} ${month.year}`;
        button.className = index === selectedReportIndex ? "periodo active" : "periodo";
        // Vincula o clique à função de seleção no escopo global
        button.onclick = () => window.selecionarRelatorio(index);
        container.appendChild(button);
    });
}

// ===================================================================
// 3. ATUALIZAÇÃO DA INTERFACE (UI) E SELEÇÃO
// ===================================================================

/**
 * Função: selecionarRelatorio (Global)
 * O que faz: Atualiza o estado da aplicação apontando para o mês escolhido.
 * Recarrega os componentes visuais (Status, Resumos, Tabela e Botões).
 */
window.selecionarRelatorio = function (index) {
    selectedReportIndex = index;
    renderizarMeses(); // Atualiza a marcação visual do botão 'active'

    const report = relatoriosDoBanco[selectedReportIndex];
    if (!report) return;

    mostrarStatus(report.status);
    atualizarResumo(report.totalCalls, report.completedCalls, report.openCalls);
    atualizarTabela(report.entries);

    // Altera a label do botão de exportação se o mês ainda não fechou
    const btnExport = document.querySelector(".btn-gerar");
    if (btnExport) {
        btnExport.textContent = report.isCurrentMonth ? "Gerar relatório parcial" : "Exportar CSV";
    }
};

/**
 * Funções de Atualização Fragmentada do DOM
 * O que fazem: Injetam os dados contidos no relatório selecionado dentro
 * de seções específicas da tela (KPIs e Tabela de Registros).
 */
function mostrarStatus(text) {
    const statusElement = document.querySelector(".relatorios-kpis article:nth-child(1) strong");
    if (statusElement) statusElement.textContent = text || "-";
}

function atualizarResumo(total, completed, open) {
    const kpis = document.querySelectorAll(".relatorios-kpis article strong");
    if (kpis.length >= 4) {
        kpis[1].textContent = total ?? "0";
        kpis[2].textContent = completed ?? "0";
        kpis[3].textContent = open ?? "0";
    }
}

function atualizarTabela(entries) {
    const tbody = document.querySelector(".relatorios-table tbody");
    if (!tbody) return;

    tbody.innerHTML = ""; // Limpa a tabela

    if (!entries || entries.length === 0) {
        mostrarErroNaTabela("Nenhum chamado registrado neste mês.");
        return;
    }

    entries.forEach(entry => {
        const row = document.createElement("tr");
        let statusClass = "status-indicar"; // Laranja/Aberto por padrão

        if (entry.status === "Finalizado") statusClass = "status-finalizado"; // Verde
        else if (entry.status === "Em andamento") statusClass = "status-andamento"; // Azul

        row.innerHTML = `
            <td>${entry.id}</td>
            <td>${entry.carPrefix || "-"}</td>
            <td>${entry.userName || entry.userRegistration || "-"}</td>
            <td>${entry.description || "-"}</td>
            <td>${entry.departureTime || "-"}</td>
            <td>${entry.completionTime || "-"}</td>
            <td><span class="status-chip ${statusClass}">${entry.status || "-"}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function mostrarErroNaTabela(mensagem) {
    const tbody = document.querySelector(".relatorios-table tbody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#67717b; padding:28px 0;">${mensagem}</td></tr>`;
    }
}

// ===================================================================
// 4. EXPORTAÇÃO DE ARQUIVOS
// ===================================================================

/**
 * Função: gerardownload (Global)
 * O que faz: Extrai os parâmetros do mês selecionado e aciona a função
 * global baixarArquivo() (do basic.js) para se comunicar com o backend
 * e iniciar o download do arquivo.
 */
window.gerardownload = async function () {
    if (!relatoriosDoBanco || relatoriosDoBanco.length === 0) {
        window.mostrarToast("Nenhum dado para exportar.", "toast-aviso");
        return;
    }

    const report = relatoriosDoBanco[selectedReportIndex];

    // Parâmetros de consulta (Query Params) para repassar à API de exportação
    const parametros = {
        mes: report.monthLabel,
        ano: report.year
    };

    const nomeArquivo = `relatorio_chamados_${report.monthLabel}_${report.year}`;

    try {
        window.mostrarToast("Iniciando exportação...", "toast-aviso1");
        // Delegado para a função padronizada de exportação (ExportController)
        await window.baixarArquivo("csv", "reports", parametros, nomeArquivo);
    } catch (error) {
        console.error("Erro durante a exportação:", error);
        window.mostrarToast("Erro ao exportar arquivo.", "toast-aviso");
    }
};

// Cria um alias para garantir compatibilidade caso algum botão use o nome antigo
window.exportCsvForSelectedMonth = window.gerardownload;

// ===================================================================
// 5. INICIALIZAÇÃO
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Compatibilidade com possíveis scripts de layout global
    if (typeof carregarDadosTelaInicial === "function") carregarDadosTelaInicial();

    // Valida se a página atual é a de relatórios antes de disparar o fetch
    if (document.getElementById("months-list") || document.querySelector(".relatorios-table")) {
        carregarRelatoriosDaAPI();
    }
});