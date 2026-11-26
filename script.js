
/* =================================
   VR PRESENTE - JAVASCRIPT
================================= */

// MÓDULOS DE CADA PERFIL

const data = {

    "Direção": [
        ["📊", "Visão geral", "Indicadores e acompanhamento da escola."],
        ["👥", "Equipe escolar", "Consultar equipes e responsáveis."],
        ["📣", "Comunicados", "Publicar avisos institucionais."],
        ["📅", "Calendário escolar", "Eventos e reuniões."],
        ["📈", "Relatórios", "Acompanhar dados da escola."],
        ["⚙️", "Configurações", "Gerenciar setores e permissões."]
    ],

    "Secretaria": [
        ["🧑‍🎓", "Alunos", "Consultar cadastros de alunos."],
        ["🗂️", "Matrículas", "Acompanhar matrículas."],
        ["📄", "Documentos", "Organizar documentos."],
        ["📆", "Calendário", "Consultar datas importantes."],
        ["📣", "Comunicados", "Enviar informações."],
        ["📋", "Relatórios", "Relatórios administrativos."]
    ],

    "Professores": [
        ["📝", "Diário de classe", "Acessar registros pedagógicos."],
        ["✅", "Frequência", "Registrar presença nas aulas."],
        ["📚", "Turmas e disciplinas", "Consultar suas turmas."],
        ["📊", "Avaliações", "Organizar avaliações."],
        ["📣", "Comunicados", "Enviar avisos às turmas."],
        ["📅", "Horários", "Consultar horários de aula."]
    ],

    "Pedagogos": [
        ["🎓", "Acompanhamento", "Demandas pedagógicas."],
        ["🤝", "Atendimento", "Organizar atendimentos."],
        ["📈", "Desempenho", "Acompanhar evolução das turmas."],
        ["📌", "Ocorrências", "Acompanhar registros."],
        ["📣", "Comunicados", "Orientações pedagógicas."],
        ["📅", "Agenda pedagógica", "Organizar reuniões."]
    ],

    "Portaria": [
        ["🚪", "Controle de entrada", "Registrar entrada e saída."],
        ["🪪", "Visitantes", "Cadastrar visitantes."],
        ["📦", "Entregas", "Registrar recebimentos."],
        ["📣", "Avisos da portaria", "Consultar orientações."],
        ["📅", "Agenda do dia", "Ver eventos previstos."],
        ["📋", "Registros", "Consultar registros autorizados."]
    ],

    "Líder de turma": [
        ["📋", "Faltas da turma", "Acompanhar informações de frequência."],
        ["🕒", "Horário da turma", "Consultar horários das aulas."],
        ["🪑", "Mapeamento de sala", "Organizar o mapa de carteiras."],
        ["📣", "Recados da turma", "Compartilhar comunicados."],
        ["🗓️", "Agenda da turma", "Consultar provas e trabalhos."],
        ["💬", "Sugestões", "Enviar sugestões à equipe escolar."]
    ]

};


// ELEMENTOS DO SITE

const login = document.getElementById("login");
const app = document.getElementById("app");
const modulePage = document.getElementById("modulePage");

const loginForm = document.getElementById("loginForm");

const roleSelect = document.getElementById("role");
const emailInput = document.getElementById("email");

const modulesContainer = document.getElementById("modules");

let currentRole = "";
let currentEmail = "";


// =================================
// ENTRAR NO SISTEMA
// =================================

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const role = roleSelect.value;
    const email = emailInput.value.trim();

    if (!role) {
        alert("Selecione seu perfil.");
        return;
    }

    if (!email || !emailInput.checkValidity()) {
        alert("Digite um e-mail válido.");
        return;
    }

    currentRole = role;
    currentEmail = email;

    showDashboard();

});


// =================================
// MOSTRAR PAINEL
// =================================

function showDashboard() {

    login.classList.add("hidden");

    modulePage.classList.add("hidden");

    app.classList.remove("hidden");

    document.getElementById("roleTag").textContent =
        currentRole;

    document.getElementById("hello").textContent =
        "Olá! " + currentEmail;

    document.getElementById("dashboardTitle").textContent =
        currentRole === "Líder de turma"
            ? "Painel do representante"
            : "Painel " + currentRole;

    document.getElementById("subtitle").textContent =
        "Bem-vindo ao sistema de gestão escolar.";

    document.getElementById("today").textContent =
        new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

    renderModules();

    window.scrollTo(0, 0);

}


// =================================
// CRIAR CARTÕES DOS MÓDULOS
// =================================

function renderModules() {

    modulesContainer.replaceChildren();

    const modules = data[currentRole];

    if (!modules) {
        alert("Perfil não encontrado.");
        return;
    }

    modules.forEach(function(module) {

        const card = document.createElement("button");

        card.type = "button";

        card.className = "module-card";

        const icon = document.createElement("span");
        icon.className = "module-icon";
        icon.textContent = module[0];

        const title = document.createElement("strong");
        title.textContent = module[1];

        const description = document.createElement("small");
        description.textContent = module[2];

        const arrow = document.createElement("span");
        arrow.className = "module-arrow";
        arrow.textContent = "→";

        card.append(
            icon,
            title,
            description,
            arrow
        );

        card.addEventListener("click", function() {
            openModule(module);
        });

        modulesContainer.appendChild(card);

    });

}


// =================================
// ABRIR UM MÓDULO
// =================================

function openModule(module) {

    app.classList.add("hidden");

    modulePage.classList.remove("hidden");

    document.getElementById("moduleProfile").textContent =
        currentRole;

    document.getElementById("moduleTitle").textContent =
        module[1];

    document.getElementById("moduleDescription").textContent =
        module[2];

    document.getElementById("moduleMessage").textContent =
        "O espaço de " + module[1] +
        " está preparado para receber suas funcionalidades.";

    window.scrollTo(0, 0);

}


// =================================
// VOLTAR AO PAINEL
// =================================

document.getElementById("backButton").addEventListener(
    "click",
    function() {

        modulePage.classList.add("hidden");

        app.classList.remove("hidden");

        window.scrollTo(0, 0);

    }
);


// =================================
// SAIR DO SISTEMA
// =================================

document.getElementById("logoutButton").addEventListener(
    "click",
    function() {

        const confirmLogout = confirm(
            "Deseja realmente sair do sistema?"
        );

        if (!confirmLogout) {
            return;
        }

        currentRole = "";
        currentEmail = "";

        app.classList.add("hidden");

        modulePage.classList.add("hidden");

        login.classList.remove("hidden");

        loginForm.reset();

        window.scrollTo(0, 0);

    }
);
