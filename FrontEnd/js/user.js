// CADASTRAR USUÁRIO
window.cadastrarUsuario = async function() {
    const nameInput = document.getElementById("cadNome")?.value;
    const emailInput = document.getElementById("cadEmail")?.value;
    const registrationInput = document.getElementById("cadMatricula")?.value;
    const passwordInput = document.getElementById("cadSenha")?.value;

    if (!nameInput || !emailInput || !registrationInput || !passwordInput) {
        mostrarToast("Preencha todos os campos!");
        return;
    }

    // Payload compatível com RegisterDTO / backend Spring Boot
    const payload = {
        registration: registrationInput,
        name: nameInput,
        email: emailInput,
        password: passwordInput,
        permission: "technician"
    };

    try {
        const response = await fetch("http://localhost:8080/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            if (typeof abrirModalConfirmacao === "function") {
                abrirModalConfirmacao();
            }

            // Limpa os campos após sucesso
            ["cadNome", "cadEmail", "cadMatricula", "cadSenha"].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = "";
            });

        } else {
            const errorMsg = await response.text();
            mostrarToast("Erro ao cadastrar: " + errorMsg);
        }

    } catch (error) {
        console.error("Connection error:", error);
        mostrarToast("Erro de conexão com o servidor.");
    }
};

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
    e.preventDefault(); // Bloqueia o refresh da página (essencial)
    
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