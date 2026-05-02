const tecnicosSample = [
    {
        id: 1,
        name: "Ana Paula Martins",
        email: "ana.martins@example.com",
        registration: "T-001",
        phone: "(11) 94567-1234",
        setor: "Manutenção",
        perfil: "Técnico de campo",
        status: "Ativo"
    },
    {
        id: 2,
        name: "Bruno Lima",
        email: "bruno.lima@example.com",
        registration: "T-002",
        phone: "(11) 93451-9876",
        setor: "Fiscalização",
        perfil: "Técnico especializado",
        status: "Ativo"
    },
    {
        id: 3,
        name: "Carla Mendes",
        email: "carla.mendes@example.com",
        registration: "T-003",
        phone: "(11) 99876-5544",
        setor: "Documentação",
        perfil: "Analista técnico",
        status: "Suspenso"
    },
    {
        id: 4,
        name: "Juliana Costa",
        email: "juliana.costa@example.com",
        registration: "T-004",
        phone: "(11) 91234-6677",
        setor: "Operação",
        perfil: "Técnico de frota",
        status: "Inativo"
    }
];

let tecnicosAtuais = [...tecnicosSample];
let tecnicoEditandoId = null;

//Back -> Front
function traduzirStatus(statusBackend) {
    switch (statusBackend) {
        case "AVAILABLE": return "Ativo";
        case "ON_DUTY": return "Ativo";
        case "DISMISSED": return "Inativo";
        default: return "Ativo";
    }
}

// Front -> Back
function traduzirStatusParaBackend(statusFrontend) {
    switch (statusFrontend) {
        case "Ativo": return "AVAILABLE";
        case "Inativo": return "DISMISSED";
        case "Suspenso": return "DISMISSED";
        default: return "AVAILABLE";
    }
}

function renderizarTecnicos(lista) {
    const corpo = document.getElementById("tecnicosTabelaCorpo");
    if (!corpo) return;

    if (!lista || lista.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 32px 0; color: #4a5c7f;">Nenhum técnico encontrado.</td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = lista.map(tecnico => {
        return `
            <tr>
                <td>${tecnico.name}</td>
                <td>${tecnico.registration}</td>
                <td>${tecnico.email}</td>
                <td>${tecnico.setor}</td>
                <td>${tecnico.perfil}</td>
                <td><span class="status-badge status-${tecnico.status}">${tecnico.status}</span></td>
                <td><button class="btn-tecnico-editar" type="button" onclick="abrirEditarTecnico('${tecnico.id}')">Editar</button></td>
            </tr>
        `;
    }).join("");
}

function aplicarFiltroTecnicos() {
    const termo = document.getElementById("filtroBuscaTecnico").value.trim().toLowerCase();
    const filtrados = tecnicosAtuais.filter(tecnico => {
        return [
            tecnico.name,
            tecnico.email,
            tecnico.registration,
            tecnico.setor,
            tecnico.perfil,
            tecnico.status
        ].some(valor => (valor || "").toLowerCase().includes(termo));
    });
    renderizarTecnicos(filtrados);
}

function limparFiltroTecnicos() {
    const campo = document.getElementById("filtroBuscaTecnico");
    if (campo) campo.value = "";
    renderizarTecnicos(tecnicosAtuais);
}

function abrirEditarTecnico(id) {
    tecnicoEditandoId = id;
    const tecnico = tecnicosAtuais.find(item => item.id == id);
    if (!tecnico) return;

    document.getElementById("editarNome").value = tecnico.name;
    document.getElementById("editarEmail").value = tecnico.email;
    document.getElementById("editarMatricula").value = tecnico.registration;
    document.getElementById("editarTelefone").value = tecnico.phone || "";
    document.getElementById("editarSetor").value = tecnico.setor || "";
    document.getElementById("editarPerfil").value = tecnico.perfil || "";
    document.getElementById("editarStatus").value = tecnico.status || "Ativo";

    const popup = document.getElementById("popupEditarTecnico");
    if (popup) popup.style.display = "flex";
}

function fecharPopupEditarTecnico() {
    const popup = document.getElementById("popupEditarTecnico");
    if (popup) popup.style.display = "none";
}

function salvarAlteracoesTecnico() {
    const nome = document.getElementById("editarNome").value.trim();
    const email = document.getElementById("editarEmail").value.trim();
    const matricula = document.getElementById("editarMatricula").value.trim();
    const telefone = document.getElementById("editarTelefone").value.trim();
    const setor = document.getElementById("editarSetor").value.trim();
    const perfil = document.getElementById("editarPerfil").value.trim();
    const status = document.getElementById("editarStatus").value;

    if (!nome || !email || !matricula) {
        mostrarToast("Nome, e-mail e matrícula são obrigatórios.");
        return;
    }

    //Update no back
    fetch(`http://localhost:8080/user/${tecnicoEditandoId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: nome,
            email: email,
            registration: matricula,
            phone: telefone,
            employeeStatus: traduzirStatusParaBackend(status)
        })
    })
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(() => {
        carregarTecnicosBackend();
        fecharPopupEditarTecnico();
    })
    .catch(() => {
        mostrarToast("Erro ao atualizar técnico");
    });
}

//Get no back
function carregarTecnicosBackend() {
    fetch("http://localhost:8080/user/tecnicos")
        .then(response => response.json())
        .then(data => {

            tecnicosAtuais = data.map(user => ({
                id: user.registration,
                name: user.name,
                email: user.email,
                registration: user.registration,
                phone: user.phone || "",
                setor: "",
                perfil: "",
                status: traduzirStatus(user.employeeStatus)
            }));

            renderizarTecnicos(tecnicosAtuais);
        })
        .catch(() => {
            renderizarTecnicos(tecnicosAtuais);
        });
}

window.addEventListener("DOMContentLoaded", () => {
    carregarTecnicosBackend();
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