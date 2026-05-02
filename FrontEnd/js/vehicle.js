// SELEÇÃO DE VEÍCULO
let tempVehicle = {};

window.selecionarVeiculo = (title, model, brand, type, prefix, licensePlate) => {
    tempVehicle = { title, model, brand, type, prefix, licensePlate };

    if (document.getElementById("fotoVeiculo")) document.getElementById("fotoVeiculo").src = "img/carro 1.jpg";
    if (document.getElementById("modeloVeiculo")) document.getElementById("modeloVeiculo").textContent = model;
    if (document.getElementById("marcaVeiculo")) document.getElementById("marcaVeiculo").textContent = brand;
    if (document.getElementById("placaVeiculo")) document.getElementById("placaVeiculo").textContent = licensePlate;
    if (document.getElementById("prefixoVeiculo")) document.getElementById("prefixoVeiculo").textContent = prefix;

    if (document.getElementById("modalConfirmacao")) document.getElementById("modalConfirmacao").style.display = "none";
    if (document.getElementById("modalDetalhesVeiculo")) document.getElementById("modalDetalhesVeiculo").style.display = "flex";
};

window.voltarParaVeiculos = () => {
    if (document.getElementById("modalDetalhesVeiculo")) document.getElementById("modalDetalhesVeiculo").style.display = "none";
    if (document.getElementById("modalConfirmacao")) document.getElementById("modalConfirmacao").style.display = "flex";
};

// CONFIRMAR CHECK-IN
window.confirmarVeiculo = () => {
    localStorage.setItem("selectedVehicle", JSON.stringify(tempVehicle));
    localStorage.setItem("activeServiceId", "12345"); // ID fictício para o abastecimento funcionar
    fecharTodosModais();

    if (window.location.pathname.includes("chamados.html")) {
        window.location.href = "telainicial.html";
    } else {
        if (typeof carregarDadosTelaInicial === "function") carregarDadosTelaInicial();
    }
};

// SALVAR INFORMAÇÕES DO VEÍCULO (API)
window.salvarVeiculoInfo = async function () {
    const mileageInput = document.getElementById("quilometragem-inicial")?.value;
    const notesInput = document.getElementById("observacoes")?.value;

    localStorage.setItem("km", mileageInput);
    localStorage.setItem("obs", notesInput);

    const vehicle = JSON.parse(localStorage.getItem('selectedVehicle'));

    if (vehicle && vehicle.prefix) {
        try {
            await fetch(`http://localhost:8080/vehicle/${vehicle.prefix}/update-data`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mileage: mileageInput,
                    observations: notesInput
                })
            });
            mostrarToast1("Dados salvos!");
        } catch (error) {
            console.error("API error:", error);
            mostrarToast("Salvo localmente.");
        }
    }
};

// CADASTRAR VEÍCULO
window.cadastrarVeiculo = async function () {
    const payload = {
        prefix: document.getElementById("cad-prefixo")?.value,
        licensePlate: document.getElementById("cad-placa")?.value,

        // FIX PRINCIPAL: agora compatível com backend
        typeId: document.getElementById("cad-tipo")?.value,

        color: document.getElementById("cad-cor")?.value,
        fuel: document.getElementById("cad-combustivel")?.value,

        // opcional mas aceito pelo DTO/backend
        currentKm: 0,
        nextOilChangeKm: 0
    };

    try {
        const response = await fetch("http://localhost:8080/vehicle/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            mostrarToast1("Veículo cadastrado com sucesso!");
        } else {
            mostrarToast("Erro ao cadastrar veículo.");
        }

    } catch (error) {
        console.error("API error:", error);
        mostrarToast("Erro de conexão.");
    }
};

// ABRIR FILTRO

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

// salvar info

const popupConfirmacao = document.getElementById('popupConfirmacao');
const popupSucesso = document.getElementById('popupSucesso');
const btncadastrar = document.getElementById('btncadastrar');
const btnCancelar = document.getElementById('btn-cancelar-confirmacao');
const btnConfirmarFinal = document.getElementById('btn-confirmar-final');
const btnFecharSucesso = document.getElementById('btn-fechar-sucesso');

btncadastrar.addEventListener('click', () => {
    popupConfirmacao.style.display = 'flex';
});

btnCancelar.addEventListener('click', () => {
    popupConfirmacao.style.display = 'none';
    return
});

btnConfirmarFinal.onclick = (e) => {
    e.preventDefault();

    popupConfirmacao.style.display = 'none';
    popupSucesso.style.display = 'flex';
};

// 4. Fechar o popup de sucesso final
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

// arruma interface tela esquerda

function salvarVeiculoInfo() {
    // Esconde o que é do Check-in
    document.getElementById('grupo-km-inicial').style.display = 'none';
    document.getElementById('btn-salvar-veiculo').style.display = 'none';
    document.getElementById('btn-cancelar-veiculo').style.display = 'none';

    // Mostra o que é do Pós-Check-in
    document.getElementById('grupo-km-final').style.display = 'block';
    document.getElementById('btn-abs-veiculo').style.display = 'inline-block';
    document.getElementById('btn-checkout').style.display = 'inline-block';
}

function cancelarVeiculoInfo() {
    document.getElementById('secao-pos-checkin').style.display = 'none';
    document.getElementById('info-veiculo-dados').style.display = 'none';
    document.getElementById('container-checkin-botao').style.display = 'block';
}