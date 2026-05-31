const veiculosSample = [
    {
        id: 101,
        model: "Fiat Mobi",
        brand: "Fiat",
        type: "Sedan",
        prefix: "1234",
        licensePlate: "ABC-1234",
        status: "Disponível"
    },
    {
        id: 102,
        model: "VW Gol",
        brand: "Volkswagen",
        type: "Hatch",
        prefix: "5678",
        licensePlate: "DEF-5678",
        status: "Em manutenção"
    },
    {
        id: 103,
        model: "Toyota Hilux",
        brand: "Toyota",
        type: "Pick-up",
        prefix: "7890",
        licensePlate: "GHI-9012",
        status: "Em uso"
    },
    {
        id: 104,
        model: "Chevrolet Onix",
        brand: "Chevrolet",
        type: "Hatch",
        prefix: "3456",
        licensePlate: "JKL-3456",
        status: "Disponível"
    }
];

let veiculosAtuais = [...veiculosSample];
let veiculosFiltrados = [...veiculosAtuais];

function renderizarVeiculos(lista) {
    const corpo = document.getElementById("veiculosTabelaCorpo");
    if (!corpo) return;

    if (!lista || lista.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 32px 0; color: #4a5c7f;">Nenhum veículo encontrado.</td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = lista.map(veiculo => {
        return `
            <tr>
                <td>${veiculo.model}</td>
                <td>${veiculo.brand}</td>
                <td>${veiculo.prefix}</td>
                <td>${veiculo.licensePlate}</td>
                <td>${veiculo.type}</td>
                <td><span class="status-badge ${obterStatusClass(veiculo.status)}">${veiculo.status}</span></td>
            </tr>
        `;
    }).join("");
}

function obterStatusClass(status) {
    return `status-${String(status).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')}`;
}

function aplicarFiltroVeiculos() {
    const termo = document.getElementById("filtroBuscaVeiculo").value.trim().toLowerCase();
    const filtrados = veiculosAtuais.filter(veiculo => {
        return [
            veiculo.model,
            veiculo.brand,
            veiculo.prefix,
            veiculo.licensePlate,
            veiculo.type,
            veiculo.status
        ].some(valor => (valor || "").toLowerCase().includes(termo));
    });

    veiculosFiltrados = filtrados;
    renderizarVeiculos(veiculosFiltrados);
}

function limparFiltroVeiculos() {
    const campo = document.getElementById("filtroBuscaVeiculo");
    if (campo) campo.value = "";
    veiculosFiltrados = [...veiculosAtuais];
    renderizarVeiculos(veiculosFiltrados);
}

window.addEventListener("DOMContentLoaded", () => {
    renderizarVeiculos(veiculosFiltrados);
});