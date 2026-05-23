window.inicializarMapaChamados = function() {
    const mapaElement = document.getElementById("mapaChamados");
    if (!mapaElement || typeof L === "undefined") {
        console.error("Mapa não disponível ou Leaflet não carregado");
        return;
    }

    const map = L.map(mapaElement, {
        center: [-23.5567, -46.6457],
        zoom: 13,
        scrollWheelZoom: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Carregar chamados do gestor via API
    carregarChamadosDaAPITecnico(map);
};

function carregarChamadosDaAPITecnico(map) {
    fetch("http://localhost:8080/chamado/todos")
        .then(res => res.json())
        .then(data => {
            renderizarMarkersTecnico(map, data);
        })
        .catch(err => {
            console.log("API não disponível, usando dados locais");
            carregarChamadosLocalTecnico(map);
        });
}

function carregarChamadosLocalTecnico(map) {
    const stored = localStorage.getItem("chamadosGestor");
    if (stored) {
        const chamados = JSON.parse(stored);
        renderizarMarkersTecnico(map, chamados);
    } else {
        // Dados de exemplo
        const chamadosExample = [
            {
                endereco: "Rua das Flores, 123",
                tipoServico: "Manutenção Corretiva",
                latitude: -23.5567,
                longitude: -46.6457,
                status: "novo",
                observacoes: "Verificar painel elétrico e quadro de distribuição."
            },
            {
                endereco: "Av. Paulista, 1522",
                tipoServico: "Troca de Válvula",
                latitude: -23.5645,
                longitude: -46.6534,
                status: "ativo",
                observacoes: "Substituir válvula danificada no sistema de água fria."
            },
            {
                endereco: "Rua da Paz, 890",
                tipoServico: "Inspeção Preventiva",
                latitude: -23.5483,
                longitude: -46.6348,
                status: "pendente",
                observacoes: "Checar orientação e registrar fotos do equipamento."
            }
        ];
        renderizarMarkersTecnico(map, chamadosExample);
    }
}

function renderizarMarkersTecnico(map, chamados) {
    const markers = chamados.map(chamado => {
        const cor = obterCorPorStatusTecnico(chamado.status || "novo");
        const marker = L.circleMarker(
            [chamado.latitude || chamado.lat, chamado.longitude || chamado.lng],
            {
                radius: 8,
                fillColor: cor,
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }
        ).addTo(map);

        const popupConteudo = `
            <div class="popup-mapa">
                <strong>${chamado.endereco || chamado.title}</strong><br>
                <small>${chamado.tipoServico || chamado.title}</small><br>
                <strong>Status:</strong> ${chamado.status || "novo"}<br>
                <p>${chamado.observacoes || chamado.observacao || ""}</p>
            </div>
        `;
        marker.bindPopup(popupConteudo, { maxWidth: 260 });
        return marker;
    });

    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
    }
}

function obterCorPorStatusTecnico(status) {
    switch (status) {
        case "novo": return "#FFD700";
        case "pendente": return "#FF9800";
        case "ativo": return "#4CAF50";
        case "concluido": return "#2196F3";
        default: return "#9E9E9E";
    }
}

window.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("chamados.html")) {
        window.inicializarMapaChamados();
    }
});
