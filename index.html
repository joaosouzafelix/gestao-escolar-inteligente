
// DADOS DOS SETORES
const data = {
  direcao: {
    nome: "Direção",
    titulo: "Painel da Direção",
    descricao: "Gerencie as principais atividades da escola.",
    modulos: [
      ["📊", "Visão geral", "Resumo das atividades escolares."],
      ["👥", "Gestão de alunos", "Área de informações dos alunos."],
      ["👨‍🏫", "Gestão de funcionários", "Organização da equipe escolar."],
      ["📢", "Comunicados", "Publicação de avisos escolares."],
      ["📅", "Calendário escolar", "Datas e eventos da escola."],
      ["📈", "Relatórios", "Relatórios administrativos."]
    ]
  },

  secretaria: {
    nome: "Secretaria",
    titulo: "Painel da Secretaria",
    descricao: "Organize os serviços administrativos.",
    modulos: [
      ["📝", "Matrículas", "Área de matrículas escolares."],
      ["👥", "Cadastro de alunos", "Cadastro e consulta de alunos."],
      ["📄", "Documentos", "Organização de documentos escolares."],
      ["📋", "Declarações", "Emissão de declarações."],
      ["📅", "Calendário", "Consulta de datas escolares."],
      ["📢", "Comunicados", "Avisos da secretaria."]
    ]
  },

  professores: {
    nome: "Professores",
    titulo: "Painel dos Professores",
    descricao: "Acesse suas ferramentas de trabalho.",
    modulos: [
      ["📚", "Minhas turmas", "Consulta das turmas."],
      ["📝", "Registro de aulas", "Registro de conteúdos trabalhados."],
      ["📊", "Notas", "Área de lançamento de notas."],
      ["📅", "Horários", "Consulta dos horários de aulas."],
      ["📋", "Frequência", "Registro de frequência dos alunos."],
      ["📢", "Comunicados", "Avisos para os professores."]
    ]
  },

  pedagogos: {
    nome: "Pedagogos",
    titulo: "Painel da Pedagogia",
    descricao: "Acompanhe o desenvolvimento pedagógico.",
    modulos: [
      ["👨‍🎓", "Acompanhamento de alunos", "Acompanhamento escolar."],
      ["📊", "Frequência", "Consulta de frequência."],
      ["📚", "Planejamento", "Organização pedagógica."],
      ["👨‍🏫", "Professores", "Acompanhamento docente."],
      ["📋", "Ocorrências", "Registro de ocorrências escolares."],
      ["📢", "Comunicados", "Avisos pedagógicos."]
    ]
  },

  portaria: {
    nome: "Portaria",
    titulo: "Painel da Portaria",
    descricao: "Organize o controle de acesso escolar.",
    modulos: [
      ["🚪", "Entrada de alunos", "Área de controle de entrada."],
      ["🚶", "Saída de alunos", "Área de controle de saída."],
      ["👥", "Visitantes", "Registro de visitantes."],
      ["📋", "Autorizações", "Consulta de autorizações."],
      ["🕒", "Horários", "Consulta de horários."],
      ["📢", "Comunicados", "Avisos da portaria."]
    ]
  },

  lider: {
    nome: "Líder de turma",
    titulo: "Painel do Líder de Turma",
    descricao: "Acompanhe as informações da sua turma.",
    modulos: [
      ["📋", "Faltas", "Consulta de informações sobre faltas."],
      ["🕒", "Horário da turma", "Consulte o horário das aulas."],
      ["🪑", "Mapeamento de sala", "Visualização dos lugares da sala."],
      ["📢", "Comunicados", "Avisos para a turma."],
      ["📚", "Atividades", "Informações sobre atividades."],
      ["💬", "Sugestões", "Espaço para sugestões da turma."]
    ]
  }
};

// ELEMENTOS DA PÁGINA
const login = document.getElementById("login");
const app = document.getElementById("app");
const modulePage = document.getElementById("modulePage");

const loginForm = document.getElementById("loginForm");
const role = document.getElementById("role");
const email = document.getElementById("email");

const modules = document.getElementById("modules");
const roleTag = document.getElementById("roleTag");
const hello = document.getElementById("hello");
const dashboardTitle = document.getElementById("dashboardTitle");
const subtitle = document.getElementById("subtitle");
const today = document.getElementById("today");

const moduleProfile = document.getElementById("moduleProfile");
const moduleTitle = document.getElementById("moduleTitle");
const moduleDescription = document.getElementById("moduleDescription");
const moduleMessage = document.getElementById("moduleMessage");

const backButton = document.getElementById("backButton");
const logoutButton = document.getElementById("logoutButton");

// TEMA CLARO E ESCURO
const themeButtons = document.querySelectorAll(".theme-button");

function atualizarTema() {
  const temaSalvo = localStorage.getItem("vrTema");

  document.body.classList.toggle(
    "light-mode",
    temaSalvo === "claro"
  );

  atualizarBotoesTema();
}

function atualizarBotoesTema() {
  const estaClaro = document.body.classList.contains("light-mode");

  themeButtons.forEach((button) => {
    button.textContent = estaClaro
      ? "🌙 Modo escuro"
      : "☀️ Modo claro";
  });
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const estaClaro =
      document.body.classList.contains("light-mode");

    localStorage.setItem(
      "vrTema",
      estaClaro ? "claro" : "escuro"
    );

    atualizarBotoesTema();
  });
});

// APLICA O TEMA SALVO AO ABRIR A PÁGINA
atualizarTema();

// DATA ATUAL
function atualizarData() {
  const dataAtual = new Date();

  today.textContent = dataAtual.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

// MOSTRAR O PAINEL
function mostrarPainel(setor, enderecoEmail) {
  const perfil = data[setor];

  if (!perfil) {
    alert("Selecione um setor válido.");
    return;
  }

  login.classList.add("hidden");
  modulePage.classList.add("hidden");
  app.classList.remove("hidden");

  roleTag.textContent = perfil.nome;
  hello.textContent = "Bem-vindo ao VR Presente!";
  dashboardTitle.textContent = perfil.titulo;
  subtitle.textContent = perfil.descricao;

  atualizarData();

  modules.innerHTML = "";

  perfil.modulos.forEach((modulo, index) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "module-card";

    const icon = document.createElement("div");
    icon.className = "module-icon";
    icon.textContent = modulo[0];

    const title = document.createElement("h3");
    title.textContent = modulo[1];

    const description = document.createElement("p");
    description.textContent = modulo[2];

    card.append(icon, title, description);

    card.addEventListener("click", () => {
      abrirModulo(setor, index);
    });

    modules.appendChild(card);
  });
}

// ABRIR UM MÓDULO
function abrirModulo(setor, index) {
  const perfil = data[setor];
  const modulo = perfil.modulos[index];

  if (!modulo) return;

  app.classList.add("hidden");
  login.classList.add("hidden");
  modulePage.classList.remove("hidden");

  moduleProfile.textContent = perfil.nome.toUpperCase();
  moduleTitle.textContent = modulo[1];
  moduleDescription.textContent = modulo[2];

  moduleMessage.textContent =
    "O módulo " + modulo[1] +
    " está preparado para receber suas funcionalidades.";
}

// LOGIN DE DEMONSTRAÇÃO
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const setorSelecionado = role.value;
  const emailDigitado = email.value.trim();

  if (!setorSelecionado || !emailDigitado) {
    alert("Preencha todos os campos.");
    return;
  }

  mostrarPainel(setorSelecionado, emailDigitado);
});

// VOLTAR AO PAINEL
backButton.addEventListener("click", () => {
  modulePage.classList.add("hidden");
  app.classList.remove("hidden");
});

// SAIR DO SISTEMA
logoutButton.addEventListener("click", () => {
  app.classList.add("hidden");
  modulePage.classList.add("hidden");
  login.classList.remove("hidden");

  loginForm.reset();
});
