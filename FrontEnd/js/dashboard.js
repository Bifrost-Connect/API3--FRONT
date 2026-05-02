// js/dashboard.js

async function carregarMetricasDashboard() {
    try {
        const response = await fetch("http://localhost:8080/service/dashboard", {
            method: "GET"
        });

        if (response.ok) {
            const metricas = await response.json();

            document.getElementById("val-disponiveis").textContent = metricas.availableCars;
            document.getElementById("val-manutencao").textContent = metricas.maintenanceCars;
            document.getElementById("val-uso").textContent = metricas.inUseCars;
            document.getElementById("val-tecnicos-disp").textContent = metricas.availableTechnicians;
            document.getElementById("val-tecnicos-serv").textContent = metricas.onDutyTechnicians;
            document.getElementById("val-gasto-mensal").textContent = `R$ ${metricas.monthlyFuelSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            document.getElementById("val-preco-litro").textContent = `R$ ${metricas.averagePricePerLiter.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            document.getElementById("val-litros").textContent = `${metricas.totalLitersRefueled.toLocaleString('pt-BR')} L`;
        } else {
            console.error("Erro ao carregar métricas do dashboard. Status:", response.status);
        }
    } catch (error) {
        console.error("Erro de conexão ao buscar dashboard:", error);
    }
}

// Escuta o carregamento da página e, se for a tela do gestor, dispara a função
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("telainicial-gestor.html")) {
        carregarMetricasDashboard();
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