let mapaGestor = null;
let chamadosGestor = [];
let markersGestor = {};
let marcadorSelecaoGestor = null;
let localizacaoSelecionada = null;
let referenciaLocalizacaoSelecionada = {
    cep: ""
};

const CENTRO_PADRAO_MAPA = [-23.5567, -46.6457];

window.inicializarMapaGestor = function () {
    const mapaElement = document.getElementById("mapaGestor");
    if (!mapaElement || typeof L === "undefined") {
        console.error("Mapa nao disponivel ou Leaflet nao carregado");
        return;
    }

    mapaGestor = L.map(mapaElement, {
        center: CENTRO_PADRAO_MAPA,
        zoom: 13,
        scrollWheelZoom: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(mapaGestor);

    mapaGestor.on("click", (event) => {
        definirLocalizacaoSelecionada(
            event.latlng.lat,
            event.latlng.lng,
            obterCepDigitado(),
            "ajuste-manual"
        );
        mostrarToastSucesso("Ponto ajustado manualmente no mapa.");
    });

    carregarChamadosDaAPI();
    configurarFormularioChamado();
};

function configurarFormularioChamado() {
    const form = document.getElementById("formChamado");
    const btnBuscarCep = document.getElementById("btnBuscarCep");
    const inputCep = document.getElementById("cep");

    if (form) {
        form.addEventListener("submit", criarChamado);
        form.addEventListener("reset", () => {
            window.setTimeout(() => {
                limparLocalizacaoSelecionada();
            }, 0);
        });
    }

    if (btnBuscarCep) {
        btnBuscarCep.addEventListener("click", async () => {
            const localizado = await buscarLocalizacaoPorCep();
            if (!localizado && mapaGestor) {
                mapaGestor.getContainer().scrollIntoView({ behavior: "smooth", block: "center" });
                mapaGestor.invalidateSize();
            }
        });
    }

    if (inputCep) {
        inputCep.addEventListener("input", () => {
            inputCep.value = formatarCep(inputCep.value);
            if (localizacaoSelecionada && obterCepDigitado() !== referenciaLocalizacaoSelecionada.cep) {
                limparLocalizacaoSelecionada(false);
                atualizarResumoLocalizacao("CEP alterado. Busque novamente para posicionar o chamado.");
            }
        });

        inputCep.addEventListener("blur", () => {
            if (obterCepDigitado().length === 8 && obterCepDigitado() !== referenciaLocalizacaoSelecionada.cep) {
                buscarLocalizacaoPorCep(false);
            }
        });
    }

    atualizarResumoLocalizacao();
}

function formatarCep(valor) {
    const digitos = (valor || "").replace(/\D/g, "").slice(0, 8);
    if (digitos.length <= 5) {
        return digitos;
    }
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function obterCepDigitado() {
    const inputCep = document.getElementById("cep");
    return inputCep ? inputCep.value.replace(/\D/g, "") : "";
}

function obterEnderecoDigitado() {
    const inputEndereco = document.getElementById("endereco");
    return inputEndereco ? inputEndereco.value.trim() : "";
}

async function buscarLocalizacaoPorCep(exibirToast = true) {
    const cep = obterCepDigitado();
    const botao = document.getElementById("btnBuscarCep");

    if (cep.length !== 8) {
        mostrarToastErro("Informe um CEP valido com 8 digitos.");
        return false;
    }

    if (botao) {
        botao.disabled = true;
        botao.textContent = "Buscando...";
    }

    try {
        const dadosCep = await consultarCep(cep);
        const coordenadas = await geocodificarPorCep(cep, dadosCep);

        definirLocalizacaoSelecionada(coordenadas.latitude, coordenadas.longitude, cep, "cep");

        if (mapaGestor) {
            mapaGestor.setView([coordenadas.latitude, coordenadas.longitude], 16);
        }

        if (exibirToast) {
            mostrarToastSucesso("CEP localizado com sucesso.");
        }

        return true;
    } catch (error) {
        console.error("Erro ao buscar localizacao por CEP:", error);
        if (exibirToast) {
            mostrarToastErro("Nao foi possivel localizar esse CEP.");
        }
        return false;
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = "Buscar CEP";
        }
    }
}

async function consultarCep(cep) {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!resposta.ok) {
        throw new Error("Falha ao consultar CEP");
    }

    const dados = await resposta.json();
    if (dados.erro) {
        throw new Error("CEP nao encontrado");
    }

    const inputEndereco = document.getElementById("endereco");
    if (inputEndereco) {
        const enderecoAtual = inputEndereco.value.trim();
        if (!enderecoAtual) {
            inputEndereco.value = montarEnderecoPadrao(dados);
        }
    }

    return dados;
}

function montarEnderecoPadrao(dadosCep) {
    return [
        dadosCep.logradouro,
        dadosCep.bairro,
        dadosCep.localidade && dadosCep.uf ? `${dadosCep.localidade} - ${dadosCep.uf}` : dadosCep.localidade || dadosCep.uf
    ].filter(Boolean).join(", ");
}

async function geocodificarPorCep(cep, dadosCep) {
    const enderecoDigitado = obterEnderecoDigitado();
    const consultas = [
        `${cep}, Brasil`,
        [dadosCep.logradouro, dadosCep.localidade, dadosCep.uf, "Brasil"].filter(Boolean).join(", "),
        [dadosCep.bairro, dadosCep.localidade, dadosCep.uf, "Brasil"].filter(Boolean).join(", "),
        [enderecoDigitado, dadosCep.localidade, dadosCep.uf, "Brasil"].filter(Boolean).join(", ")
    ].filter((consulta, indice, lista) => consulta && lista.indexOf(consulta) === indice);

    for (const consulta of consultas) {
        const coordenadas = await geocodificarConsulta(consulta);
        if (coordenadas) {
            return coordenadas;
        }
    }

    throw new Error("CEP nao localizado no mapa");
}

async function geocodificarConsulta(consulta) {
    const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`,
        {
            headers: {
                Accept: "application/json"
            }
        }
    );

    if (!resposta.ok) {
        return null;
    }

    const resultados = await resposta.json();
    if (!Array.isArray(resultados) || resultados.length === 0) {
        return null;
    }

    return {
        latitude: Number(resultados[0].lat),
        longitude: Number(resultados[0].lon)
    };
}

function definirLocalizacaoSelecionada(latitude, longitude, cep, origem) {
    localizacaoSelecionada = {
        latitude: Number(latitude.toFixed(4)),
        longitude: Number(longitude.toFixed(4))
    };
    referenciaLocalizacaoSelecionada = {
        cep
    };

    if (!mapaGestor) {
        atualizarResumoLocalizacao();
        return;
    }

    if (!marcadorSelecaoGestor) {
        marcadorSelecaoGestor = L.circleMarker([localizacaoSelecionada.latitude, localizacaoSelecionada.longitude], {
            radius: 9,
            fillColor: "#002080",
            color: "#ffffff",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.95
        }).addTo(mapaGestor);
    } else {
        marcadorSelecaoGestor.setLatLng([localizacaoSelecionada.latitude, localizacaoSelecionada.longitude]);
    }

    const mensagemPopup = origem === "cep"
        ? "Local definido a partir do CEP informado."
        : "Local ajustado manualmente no mapa.";

    marcadorSelecaoGestor.bindPopup(mensagemPopup).openPopup();
    atualizarResumoLocalizacao();
}

function limparLocalizacaoSelecionada(restaurarMensagem = true) {
    localizacaoSelecionada = null;
    referenciaLocalizacaoSelecionada = {
        cep: ""
    };

    if (mapaGestor && marcadorSelecaoGestor) {
        mapaGestor.removeLayer(marcadorSelecaoGestor);
        marcadorSelecaoGestor = null;
    }

    atualizarResumoLocalizacao(
        restaurarMensagem
            ? ""
            : "CEP alterado. Busque novamente para posicionar o chamado."
    );
}

function atualizarResumoLocalizacao(mensagemCustomizada = "") {
    const resumo = document.getElementById("resumoLocalizacao");
    if (!resumo) {
        return;
    }

    if (localizacaoSelecionada) {
        resumo.classList.add("ativo");
        resumo.textContent = "CEP validado e ponto definido no mapa. Se necessario, ajuste clicando no mapa.";
        return;
    }

    resumo.classList.remove("ativo");
    resumo.textContent = mensagemCustomizada || "O ponto do chamado sera definido com base no CEP informado. O endereco abaixo pode ser ajustado como complemento.";
}

function carregarChamadosDaAPI() {
    fetch("http://localhost:8080/chamado/todos")
        .then((resposta) => resposta.json())
        .then((dados) => {
            chamadosGestor = dados.map(normalizarChamado);
            renderizarChamados();
            renderizarMarkersMapa();
        })
        .catch(() => {
            console.log("API nao disponivel, usando dados locais");
            carregarChamadosLocal();
        });
}

function carregarChamadosLocal() {
    const armazenados = localStorage.getItem("chamadosGestor");
    if (armazenados) {
        chamadosGestor = JSON.parse(armazenados).map(normalizarChamado);
        renderizarChamados();
        renderizarMarkersMapa();
    }
}

function salvarChamadosLocal() {
    localStorage.setItem("chamadosGestor", JSON.stringify(chamadosGestor));
}

function normalizarChamado(chamado) {
    return {
        id: chamado.id,
        endereco: chamado.endereco || chamado.title || "Endereco nao informado",
        cep: chamado.cep || "",
        tipoServico: chamado.tipoServico || chamado.serviceType || "Servico nao informado",
        tipoCNH: chamado.tipoCNH || chamado.cnhType || "Nao informado",
        tecnico: chamado.tecnicoResponsavel || chamado.tecnico || "Nao atribuido",
        latitude: Number(chamado.latitude ?? chamado.lat),
        longitude: Number(chamado.longitude ?? chamado.lng),
        observacoes: chamado.observacoes || chamado.observacao || "",
        status: chamado.status || "novo",
        dataCriacao: chamado.dataCriacao || chamado.createdAt || new Date().toLocaleString()
    };
}

function possuiCoordenadasValidas(chamado) {
    return Number.isFinite(chamado.latitude) && Number.isFinite(chamado.longitude);
}

function renderizarMarkersMapa() {
    if (!mapaGestor) {
        return;
    }

    Object.values(markersGestor).forEach((marker) => {
        mapaGestor.removeLayer(marker);
    });
    markersGestor = {};

    const bounds = [];

    chamadosGestor.forEach((chamado) => {
        if (!possuiCoordenadasValidas(chamado)) {
            return;
        }

        const cor = obterCorPorStatus(chamado.status);
        const marker = L.circleMarker([chamado.latitude, chamado.longitude], {
            radius: 8,
            fillColor: cor,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        }).addTo(mapaGestor);

        const popupConteudo = `
            <div class="popup-mapa">
                <strong>${chamado.endereco}</strong>
                <small>${chamado.tipoServico}</small><br>
                <strong>Status:</strong> ${formatarStatus(chamado.status)}<br>
                <button onclick="abrirDetalhesChamado(${chamado.id})" class="btn-popup-mapa">Ver detalhes</button>
            </div>
        `;

        marker.bindPopup(popupConteudo, { maxWidth: 240 });
        markersGestor[chamado.id] = marker;
        bounds.push([chamado.latitude, chamado.longitude]);
    });

    if (bounds.length > 0) {
        mapaGestor.fitBounds(bounds, { padding: [30, 30] });
    } else {
        mapaGestor.setView(CENTRO_PADRAO_MAPA, 13);
    }
}

function obterCorPorStatus(status) {
    switch (status) {
        case "novo":
            return "#FFD700";
        case "pendente":
            return "#FF9800";
        case "ativo":
            return "#4CAF50";
        case "concluido":
            return "#2196F3";
        default:
            return "#9E9E9E";
    }
}

function formatarStatus(status) {
    if (!status) {
        return "Novo";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
}

function renderizarChamados() {
    const container = document.getElementById("listaChamadosGestor");
    if (!container) {
        return;
    }

    if (chamadosGestor.length === 0) {
        container.innerHTML = `<p class="lista-vazia">Nenhum chamado criado ainda.</p>`;
        return;
    }

    container.innerHTML = chamadosGestor.map((chamado) => `
        <div class="item-chamado status-${chamado.status}">
            <div class="item-header">
                <strong>${chamado.endereco}</strong>
                <span class="status-badge">${formatarStatus(chamado.status)}</span>
            </div>
            <div class="item-info">
                <p><small><strong>CEP:</strong> ${chamado.cep || "Nao informado"}</small></p>
                <p><small><strong>Servico:</strong> ${chamado.tipoServico}</small></p>
                <p><small><strong>Tecnico:</strong> ${chamado.tecnico}</small></p>
            </div>
            <div class="item-acoes">
                <button class="btn-detalhe" onclick="abrirDetalhesChamado(${chamado.id})">Detalhes</button>
                <button class="btn-excluir" onclick="excluirChamado(${chamado.id})">Excluir</button>
            </div>
        </div>
    `).join("");
}

window.abrirDetalhesChamado = function (id) {
    const chamado = chamadosGestor.find((item) => item.id === id);
    if (!chamado) {
        return;
    }

    const conteudo = `
        <p><strong>Endereco:</strong> ${chamado.endereco}</p>
        <p><strong>CEP:</strong> ${chamado.cep || "Nao informado"}</p>
        <p><strong>Tipo de servico:</strong> ${chamado.tipoServico}</p>
        <p><strong>Tipo de CNH:</strong> ${chamado.tipoCNH}</p>
        <p><strong>Tecnico responsavel:</strong> ${chamado.tecnico}</p>
        <p><strong>Observacoes:</strong> ${chamado.observacoes || "Nenhuma"}</p>
        <p><strong>Status:</strong> ${formatarStatus(chamado.status)}</p>
        <p><strong>Data de criacao:</strong> ${chamado.dataCriacao}</p>
    `;

    document.getElementById("modalTitulo").textContent = `Chamado - ${chamado.endereco}`;
    document.getElementById("modalConteudo").innerHTML = conteudo;
    document.getElementById("modalDetalheChamado").style.display = "flex";
};

window.fecharModalDetalhes = function () {
    const modal = document.getElementById("modalDetalheChamado");
    if (modal) {
        modal.style.display = "none";
    }
};

window.excluirChamado = function (id) {
    if (!confirm("Tem certeza que deseja excluir este chamado?")) {
        return;
    }

    fetch(`http://localhost:8080/chamado/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
    })
        .then((resposta) => {
            if (!resposta.ok) {
                throw new Error("Falha ao excluir na API");
            }

            removerChamado(id);
            mostrarToastSucesso("Chamado excluido!");
        })
        .catch(() => {
            removerChamado(id);
            mostrarToastSucesso("Chamado excluido!");
        });
};

function removerChamado(id) {
    chamadosGestor = chamadosGestor.filter((chamado) => chamado.id !== id);
    salvarChamadosLocal();
    renderizarChamados();
    renderizarMarkersMapa();
}

document.addEventListener("DOMContentLoaded", () => {
    window.inicializarMapaGestor();
});

async function criarChamado(event) {
    event.preventDefault();

    const endereco = obterEnderecoDigitado();
    const cep = obterCepDigitado();
    const tipoServico = document.getElementById("tipoServico").value;
    const tipoCNH = document.getElementById("tipoCNH").value;
    const tecnico = document.getElementById("tecnicoResponsavel").value;
    const observacoes = document.getElementById("observacoes").value.trim();

    if (!endereco || cep.length !== 8 || !tipoServico || !tipoCNH || !tecnico) {
        mostrarToastErro("Preencha CEP, endereco e os demais campos obrigatorios.");
        return;
    }

    if (!localizacaoSelecionada || referenciaLocalizacaoSelecionada.cep !== cep) {
        const localizado = await buscarLocalizacaoPorCep(false);
        if (!localizado || !localizacaoSelecionada) {
            mostrarToastErro("Nao foi possivel validar o local com esse CEP.");
            return;
        }
    }

    const novoChamado = normalizarChamado({
        id: Date.now(),
        endereco,
        cep,
        tipoServico,
        tipoCNH,
        tecnicoResponsavel: tecnico,
        observacoes,
        latitude: localizacaoSelecionada.latitude,
        longitude: localizacaoSelecionada.longitude,
        status: "novo",
        dataCriacao: new Date().toLocaleString()
    });

    fetch("http://localhost:8080/chamado/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoChamado)
    })
        .then((resposta) => resposta.json())
        .then((dados) => {
            chamadosGestor.push(normalizarChamado(dados));
            finalizarCriacaoChamado();
        })
        .catch(() => {
            console.log("API nao disponivel, salvando localmente");
            chamadosGestor.push(novoChamado);
            finalizarCriacaoChamado();
        });
}

function finalizarCriacaoChamado() {
    salvarChamadosLocal();
    renderizarChamados();
    renderizarMarkersMapa();

    const form = document.getElementById("formChamado");
    if (form) {
        form.reset();
    }

    limparLocalizacaoSelecionada();
    mostrarToastSucesso("Chamado criado com sucesso!");
}

function mostrarToastSucesso(mensagem) {
    const toast = document.getElementById("toast-sucesso");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden");

        setTimeout(() => {
            toast.classList.add("toast-hidden");
            setTimeout(() => {
                toast.style.display = "none";
            }, 500);
        }, 3000);
    }
}

function mostrarToastErro(mensagem) {
    const toast = document.getElementById("toast-erro");
    if (toast) {
        toast.innerText = mensagem;
        toast.style.display = "block";
        toast.classList.remove("toast-hidden-erro");

        setTimeout(() => {
            toast.classList.add("toast-hidden-erro");
            setTimeout(() => {
                toast.style.display = "none";
            }, 500);
        }, 3000);
    }
}
