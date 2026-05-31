
let relatoriosDoBanco = [];
let selectedReportIndex = 0;
let selectedCategoria = "Chamados";
let selectedDateRange = { from: "", to: "" };

const categoriasRelatorio = ["Chamados", "Gastos", "Abastecimento", "Ocorrências"];

const relatoriosSample = [
    {
        monthLabel: "Abril",
        year: 2026,
        status: "Relatório parcial",
        totalCalls: 42,
        completedCalls: 28,
        openCalls: 14,
        isCurrentMonth: true,
        entries: [
            {
                id: 7345,
                carPrefix: "Ford Ka | 1234",
                userName: "Ana Paula",
                description: "Verificação de bomba de combustível",
                departureTime: "20/04/2026 08:10",
                completionTime: "20/04/2026 10:00",
                status: "Aberto"
            },
            {
                id: 7343,
                carPrefix: "Fiat Mobi | 9012",
                userName: "Bruno Lima",
                description: "Manutenção preventiva de radar",
                departureTime: "17/04/2026 15:05",
                completionTime: "17/04/2026 16:40",
                status: "Finalizado"
            },
            {
                id: 7341,
                carPrefix: "Toyota Hilux | 7890",
                userName: "Juliana Costa",
                description: "Verificação de cronotacógrafos",
                departureTime: "20/04/2026 07:40",
                completionTime: "--",
                status: "Em andamento"
            }
        ],
        gastos: [
            { id: 1, type: "Combustível", vehicle: "Fiat Mobi | 9012", amount: "R$ 1.340,50", date: "17/04/2026", description: "Abastecimento e troca de óleo" },
            { id: 2, type: "Peças", vehicle: "Ford Ka | 1234", amount: "R$ 520,00", date: "20/04/2026", description: "Substituição de pastilhas de freio" }
        ],
        abastecimentos: [
            { id: 1, vehicle: "Fiat Mobi | 9012", driver: "Bruno Lima", liters: "35 L", cost: "R$ 220,00", date: "17/04/2026" },
            { id: 2, vehicle: "Toyota Hilux | 7890", driver: "Juliana Costa", liters: "50 L", cost: "R$ 310,00", date: "15/04/2026" }
        ],
        ocorrencias: [
            { id: 1, vehicle: "Ford Ka | 1234", technician: "Ana Paula", occurrence: "Avaria no sensor de velocidade", date: "12/04/2026", status: "Aberto" },
            { id: 2, vehicle: "Fiat Mobi | 9012", technician: "Bruno Lima", occurrence: "Troca de pneu emergencial", date: "08/04/2026", status: "Finalizado" }
        ]
    }
];

window.addEventListener("DOMContentLoaded", () => {
    if (typeof carregarDadosTelaInicial === "function") carregarDadosTelaInicial();
    configurarRelatorios();
    carregarRelatoriosDaAPI();
});

function configurarRelatorios() {
    const btnEscolher = document.getElementById("btn-escolher-datas");
    const btnGerar = document.getElementById("btn-gerar-relatorio");

    if (btnEscolher) btnEscolher.addEventListener("click", abrirEscolherDatas);
    if (btnGerar) btnGerar.addEventListener("click", gerarRelatorio);
}

async function carregarRelatoriosDaAPI() {
    try {
        const response = await fetch("http://localhost:8080/service/reports", {
            method: "GET"
            // Sem header de Authorization por enquanto, conforme acordado
        });

        if (response.ok) {
            relatoriosDoBanco = await response.json();
            inicializarRelatorios();
        } else {
            console.error("Erro ao buscar relatórios. Status:", response.status);
            relatoriosDoBanco = relatoriosSample;
            inicializarRelatorios();
            mostrarErroNaTabela("Falha ao carregar os dados do servidor.");
        }
    } catch (error) {
        console.error("Erro de conexão com a API:", error);
        relatoriosDoBanco = relatoriosSample;
        inicializarRelatorios();
        mostrarErroNaTabela("Erro de conexão. Verifique se o back-end está rodando.");
    }
}

function inicializarRelatorios() {
    if (!document.getElementById("categorias-list")) return;

    if (relatoriosDoBanco.length === 0) {
        relatoriosDoBanco = relatoriosSample;
    }

    renderizarCategorias();
    selecionarRelatorio(0);
}

function renderizarCategorias() {
    const container = document.getElementById("categorias-list");
    if (!container) return;

    container.innerHTML = categoriasRelatorio
        .map(categoria => `
            <button type="button" class="categoria-btn ${categoria === selectedCategoria ? "active" : ""}" onclick="selecionarCategoria('${categoria}')">${categoria}</button>
        `)
        .join("");
}

function selecionarCategoria(categoria) {
    selectedCategoria = categoria;
    renderizarCategorias();
    atualizarConteudo();
}

function selecionarRelatorio(index) {
    selectedReportIndex = index;
    if (selectedReportIndex >= relatoriosDoBanco.length) selectedReportIndex = 0;
    renderizarCategorias();
    atualizarStatusEResumo();
    atualizarConteudo();
}

function mostrarStatus(text) {
    // Seleciona o primeiro 'strong' dentro do primeiro 'article' dos KPIs
    const statusElement = document.querySelector(".relatorios-kpis article:nth-child(1) strong");
    if (statusElement) statusElement.textContent = text;
}

function atualizarResumo(total, completed, open) {
    const kpis = document.querySelectorAll(".relatorios-kpis article strong");
    if (kpis.length >= 4) {
        kpis[1].textContent = total;
        kpis[2].textContent = completed;
        kpis[3].textContent = open;
    }
}

function atualizarTabela(entries) {
    const tbody = document.querySelector(".relatorios-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!entries || entries.length === 0) {
        mostrarErroNaTabela(`Nenhum registro de ${selectedCategoria.toLowerCase()} disponível.`);
        return;
    }

    const headerRow = document.querySelector(".relatorios-table thead tr");
    if (headerRow) headerRow.innerHTML = cabecalhoPorCategoria();

    entries.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = linhaPorCategoria(entry);
        tbody.appendChild(row);
    });
}

function atualizarStatusEResumo() {
    const report = relatoriosDoBanco[selectedReportIndex];
    mostrarStatus(report.status);
    atualizarResumo(report.totalCalls, report.completedCalls, report.openCalls);
    atualizarBotaoGerar(report);
}

function atualizarBotaoGerar(report) {
    const btn = document.getElementById("btn-gerar-relatorio");
    if (!btn) return;
    btn.textContent = isRelatorioParcial(report) ? "Gerar relatório parcial" : "Gerar relatório completo";
}

function isRelatorioParcial(report) {
    if (!report) return false;
    if (report.isCurrentMonth != null) return report.isCurrentMonth;
    if (report.isPartial != null) return report.isPartial;
    if (report.status) return /parcial/i.test(report.status);

    const now = new Date();
    if (report.month && report.year) {
        return Number(report.month) === now.getMonth() + 1 && Number(report.year) === now.getFullYear();
    }

    if (report.monthLabel && report.year) {
        return report.monthLabel.toLowerCase().includes("abril") && now.getMonth() + 1 === 4 && now.getFullYear() === report.year;
    }

    return false;
}

function atualizarConteudo() {
    const report = relatoriosDoBanco[selectedReportIndex] || relatoriosSample[0];
    atualizarBannerPeriodo(report);
    const dados = obterDadosPorCategoria(report);
    atualizarTabela(dados);
}

function atualizarBannerPeriodo(report) {
    const label = document.getElementById("report-range-label");
    if (!label) return;

    if (selectedDateRange.from && selectedDateRange.to) {
        label.textContent = `Período selecionado: ${formatDate(selectedDateRange.from)} até ${formatDate(selectedDateRange.to)}`;
        return;
    }

    if (report.monthLabel && report.year) {
        label.textContent = `Período atual: ${report.monthLabel} ${report.year}`;
        return;
    }

    label.textContent = `Período atual: ${selectedCategoria}`;
}

function obterDadosPorCategoria(report) {
    switch (selectedCategoria) {
        case "Gastos":
            return report.gastos?.length ? report.gastos : extrairGastos(report);
        case "Abastecimento":
            return report.abastecimentos?.length ? report.abastecimentos : extrairAbastecimentos(report);
        case "Ocorrências":
            return report.ocorrencias?.length ? report.ocorrencias : extrairOcorrencias(report);
        default:
            return report.entries?.length ? report.entries : [];
    }
}

function cabecalhoPorCategoria() {
    switch (selectedCategoria) {
        case "Gastos":
            return `<th>ID</th><th>Tipo</th><th>Veículo</th><th>Valor</th><th>Data</th><th>Descrição</th>`;
        case "Abastecimento":
            return `<th>ID</th><th>Veículo</th><th>Motorista</th><th>Litros</th><th>Custo</th><th>Data</th>`;
        case "Ocorrências":
            return `<th>ID</th><th>Veículo</th><th>Técnico</th><th>Ocorrência</th><th>Data</th><th>Status</th>`;
        default:
            return `<th>ID</th><th>Veículo</th><th>Técnico</th><th>Descrição</th><th>Saída</th><th>Conclusão</th><th>Status</th>`;
    }
}

function linhaPorCategoria(entry) {
    switch (selectedCategoria) {
        case "Gastos":
            return `<td>${entry.id || "-"}</td><td>${entry.type || entry.tipo || "-"}</td><td>${entry.vehicle || entry.veiculo || "-"}</td><td>${entry.amount || entry.valor || "-"}</td><td>${entry.date || entry.data || "-"}</td><td>${entry.description || entry.descricao || "-"}</td>`;
        case "Abastecimento":
            return `<td>${entry.id || "-"}</td><td>${entry.vehicle || entry.veiculo || "-"}</td><td>${entry.driver || entry.motorista || "-"}</td><td>${entry.liters || entry.litros || "-"}</td><td>${entry.cost || entry.custo || "-"}</td><td>${entry.date || entry.data || "-"}</td>`;
        case "Ocorrências":
            return `<td>${entry.id || "-"}</td><td>${entry.vehicle || entry.veiculo || "-"}</td><td>${entry.technician || entry.tecnico || "-"}</td><td>${entry.occurrence || entry.ocorrencia || entry.description || "-"}</td><td>${entry.date || entry.data || "-"}</td><td>${entry.status || "-"}</td>`;
        default: {
            let statusClass = "status-indicar";
            if (entry.status === "Finalizado") statusClass = "status-finalizado";
            else if (entry.status === "Em andamento") statusClass = "status-andamento";

            return `<td>${entry.id || "-"}</td><td>${entry.carPrefix || entry.vehicle || entry.veiculo || "-"}</td><td>${entry.userName || entry.userRegistration || entry.technician || entry.tecnico || "-"}</td><td>${entry.description || entry.descricao || "-"}</td><td>${entry.departureTime || entry.dataSaida || "-"}</td><td>${entry.completionTime || entry.conclusionTime || "-"}</td><td><span class="status-chip ${statusClass}">${entry.status || "-"}</span></td>`;
        }
    }
}

function extrairGastos(report) {
    return (report.entries || []).map((entry, index) => ({
        id: entry.id || index + 1,
        type: entry.expenseType || "Gasto",
        vehicle: entry.carPrefix || entry.vehicle || "-",
        amount: entry.cost || entry.valor || "R$ 0,00",
        date: entry.date || entry.data || "-",
        description: entry.description || entry.descricao || "-"
    }));
}

function extrairAbastecimentos(report) {
    return (report.entries || []).map((entry, index) => ({
        id: entry.id || index + 1,
        vehicle: entry.carPrefix || entry.vehicle || "-",
        driver: entry.userName || entry.driver || "-",
        liters: entry.liters || entry.litros || "-",
        cost: entry.cost || entry.custo || "R$ 0,00",
        date: entry.date || entry.data || "-"
    }));
}

function extrairOcorrencias(report) {
    return (report.entries || []).map((entry, index) => ({
        id: entry.id || index + 1,
        vehicle: entry.carPrefix || entry.vehicle || "-",
        technician: entry.userName || entry.technician || "-",
        occurrence: entry.occurrence || entry.ocorrencia || entry.description || "Ocorrência registrada",
        date: entry.date || entry.data || "-",
        status: entry.status || "Aberto"
    }));
}

function abrirEscolherDatas() {
    const popup = document.getElementById("popupRelatorioDatas");
    if (popup) popup.style.display = "flex";
}

function fecharEscolherDatas() {
    const popup = document.getElementById("popupRelatorioDatas");
    if (popup) popup.style.display = "none";
}

function confirmarPeriodoRelatorio() {
    const inicio = document.getElementById("relatorio-data-inicio").value;
    const fim = document.getElementById("relatorio-data-fim").value;

    if (!inicio || !fim) {
        mostrarToast("Escolha data de início e fim.");
        return;
    }

    selectedDateRange = { from: inicio, to: fim };
    atualizarBannerPeriodo(relatoriosDoBanco[selectedReportIndex] || relatoriosSample[0]);
    fecharEscolherDatas();
    mostrarToast1(`Período definido: ${formatDate(inicio)} até ${formatDate(fim)}.`);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
}

function gerarRelatorio() {
    const report = relatoriosDoBanco[selectedReportIndex] || relatoriosSample[0];
    const mensagem = isRelatorioParcial(report) ? "Gerando relatório parcial..." : "Gerando relatório completo...";
    mostrarToast1(mensagem);
}

function mostrarErroNaTabela(mensagem) {
    const tbody = document.querySelector(".relatorios-table tbody");
    if (tbody) {
        const colspan = selectedCategoria === "Chamados" ? 7 : 6;
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; color:#67717b; padding:28px 0;">${mensagem}</td></tr>`;
    }
}

window.exportCsvForSelectedMonth = function() {
    mostrarToast1("Exportação habilitada para uma futura integração.");
}

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