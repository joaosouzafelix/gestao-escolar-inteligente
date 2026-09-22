/* ---------------------------------------------------------
   1. UTILITÁRIOS
--------------------------------------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
));

const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isoSomaDias = (iso, dias) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const fmtData = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const fmtDataHora = (ts) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const iniciais = (nome) => String(nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const ehEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const mediaArr = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------
   2. PÁGINAS, PERMISSÕES E METADADOS
--------------------------------------------------------- */
const PAGINAS = {
  dashboard:    { titulo: 'Dashboard',        sub: 'Visão geral da escola' },
  alunos:       { titulo: 'Alunos',           sub: 'Cadastro e acompanhamento' },
  professores:  { titulo: 'Professores',      sub: 'Corpo docente' },
  turmas:       { titulo: 'Turmas',           sub: 'Turmas, salas e horários' },
  notas:        { titulo: 'Notas',            sub: 'Livro de notas e médias' },
  frequencia:   { titulo: 'Frequência',       sub: 'Chamada e relatórios' },
  agenda:       { titulo: 'Agenda Escolar',   sub: 'Eventos, provas e reuniões' },
  comunicacao:  { titulo: 'Comunicação',      sub: 'Avisos e mensagens' },
  relatorios:   { titulo: 'Relatórios',       sub: 'Análises e exportações' },
  configuracoes:{ titulo: 'Configurações',    sub: 'Sistema, usuários e permissões' }
};

const PERFIS = ['administrador', 'professor', 'aluno', 'responsavel'];

const ROTULO_PERFIL = {
  administrador: 'Administrador',
  professor: 'Professor',
  aluno: 'Aluno',
  responsavel: 'Responsável'
};

const PERMISSOES_PADRAO = {
  administrador: Object.keys(PAGINAS),
  professor: ['dashboard', 'alunos', 'turmas', 'notas', 'frequencia', 'agenda', 'comunicacao', 'relatorios'],
  aluno: ['dashboard', 'notas', 'frequencia', 'agenda', 'comunicacao'],
  responsavel: ['dashboard', 'alunos', 'notas', 'frequencia', 'agenda', 'comunicacao', 'relatorios']
};

/* ---------------------------------------------------------
   3. ESTADO DA APLICAÇÃO
--------------------------------------------------------- */
const State = {
  user: null,
  page: 'dashboard',
  calDate: new Date(),
  calSelecionado: null,
  chamada: {},            // { alunoId: true|false } em edição
  ultimoRelatorio: null   // { titulo, headers, rows }
};

/* ---------------------------------------------------------
   4. CAMADA DE DADOS (localStorage) + SEED DE DEMONSTRAÇÃO
--------------------------------------------------------- */
const DB = {
  KEY: 'smartschool_db_v1',
  SESSION_KEY: 'smartschool_session',
  data: null,

  init() {
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { salvo = null; }
    if (salvo && salvo.alunos && salvo.turmas) {
      this.data = salvo;
      this.padronizar();
    } else {
      this.data = this.seed();
      this.save();
    }
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* storage indisponível */ }
  },

  padronizar() {
    const d = this.data;
    d.permissoes = d.permissoes || JSON.parse(JSON.stringify(PERMISSOES_PADRAO));
    PERFIS.forEach((p) => { if (!Array.isArray(d.permissoes[p])) d.permissoes[p] = [...PERMISSOES_PADRAO[p]]; });
    d.notas = d.notas || [];
    d.frequencia = d.frequencia || [];
    d.eventos = d.eventos || [];
    d.avisos = d.avisos || [];
    d.mensagens = d.mensagens || [];
    d.usuarios = d.usuarios || [];
    d.prefs = Object.assign({ tema: 'light', sidebar: false, alertas: true, inicio: 'dashboard' }, d.prefs || {});
    d.escola = Object.assign({ nome: 'Escola Modelo SmartSchool', ano: String(new Date().getFullYear()), endereco: 'Av. da Educação, 1000', telefone: '(11) 3456-7890', email: 'contato@smartschool.edu.br' }, d.escola || {});
  },

  seed() {
    const rnd = mulberry32(20260922);
    const disciplinas = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês'];

    const turmas = [
      { id: 't1', nome: '6º Ano A',  serie: 'Ensino Fundamental II', sala: 'Sala 05', horario: '07:00 - 16:20', titular: 'p1', disciplinas },
      { id: 't2', nome: '7º Ano B',  serie: 'Ensino Fundamental II', sala: 'Sala 08', horario: '07:00 - 16:20', titular: 'p2', disciplinas },
      { id: 't3', nome: '8º Ano A',  serie: 'Ensino Fundamental II', sala: 'Sala 11', horario: '07:20 - 17:00', titular: 'p3', disciplinas },
      { id: 't4', nome: '9º Ano C',  serie: 'Ensino Fundamental II', sala: 'Sala 14', horario: '07:20 - 17:00', titular: 'p4', disciplinas }
    ];

    const professores = [
      { id: 'p1', nome: 'Carlos Mendes',    email: 'professor@smartschool.com', telefone: '(11) 98888-1001', horario: 'Seg a Sex · 07:00 - 12:00', disciplinas: ['Matemática'],            turmas: ['t1', 't2', 't3', 't4'] },
      { id: 'p2', nome: 'Fernanda Lima',    email: 'fernanda@smartschool.com',  telefone: '(11) 98888-1002', horario: 'Seg a Sex · 07:00 - 13:00', disciplinas: ['Português'],             turmas: ['t1', 't2', 't4'] },
      { id: 'p3', nome: 'Rafael Rodrigues', email: 'rafael@smartschool.com',    telefone: '(11) 98888-1003', horario: 'Seg a Sex · 08:00 - 14:00', disciplinas: ['Ciências'],              turmas: ['t2', 't3'] },
      { id: 'p4', nome: 'Patrícia Gomes',   email: 'patricia@smartschool.com',  telefone: '(11) 98888-1004', horario: 'Seg a Sex · 08:00 - 17:00', disciplinas: ['História'],              turmas: ['t1', 't3', 't4'] },
      { id: 'p5', nome: 'Marcos Ribeiro',   email: 'marcos@smartschool.com',    telefone: '(11) 98888-1005', horario: 'Seg a Qui · 09:00 - 15:00', disciplinas: ['Geografia'],             turmas: ['t1', 't2', 't3'] },
      { id: 'p6', nome: 'Juliana Alves',    email: 'juliana@smartschool.com',   telefone: '(11) 98888-1006', horario: 'Seg a Sex · 07:00 - 11:00', disciplinas: ['Inglês'],                turmas: ['t3', 't4'] }
    ];

    const nomes = [
      ['Ana Beatriz Souza',      'Mariana Souza',       't1'],
      ['Bruno Carvalho Lima',    'Ricardo Carvalho',    't1'],
      ['Camila Ferreira Dias',   'Simone Ferreira',     't1'],
      ['Daniel Almeida Rocha',   'Paulo Almeida',       't1'],
      ['Eduarda Menezes Silva',  'Cláudia Menezes',     't2'],
      ['Felipe Andrade Costa',   'Jorge Andrade',       't2'],
      ['Gabriel Santos Ribeiro', 'Luana Santos',        't2'],
      ['Heloísa Martins Prado',  'Denise Martins',      't2'],
      ['Igor Oliveira Pinto',    'Sérgio Oliveira',     't3'],
      ['Júlia Ramos Teixeira',   'Regina Ramos',        't3'],
      ['Kauã Barbosa Nunes',     'Vera Barbosa',        't3'],
      ['Larissa Gomes Cardoso',  'Marcos Gomes',        't3'],
      ['Matheus Freitas Lopes',  'Aline Freitas',       't4'],
      ['Nicole Costa Pereira',   'Eduardo Costa',       't4'],
      ['Otávio Melo Araújo',     'Sandra Melo',         't4'],
      ['Priscila Duarte Cruz',   'Heitor Duarte',       't4']
    ];

    const alunos = nomes.map((n, i) => ({
      id: `a${i + 1}`,
      nome: n[0],
      matricula: `2024${String(i + 1).padStart(4, '0')}`,
      nascimento: `20${13 - Math.floor(i / 4)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
      turmaId: n[2],
      responsavel: n[1],
      telefone: `(11) 9${String(7000 + i * 13).slice(0, 4)}-${String(1000 + i * 7).slice(0, 4)}`,
      email: `${n[0].split(' ')[0].toLowerCase()}.${n[0].split(' ').slice(-1)[0].toLowerCase()}@aluno.escola.edu.br`
    }));

    // Notas: 4 bimestres por disciplina da turma
    const notas = [];
    alunos.forEach((al) => {
      const turma = turmas.find((t) => t.id === al.turmaId);
      turma.disciplinas.forEach((disc) => {
        const base = 5 + rnd() * 4.4;
        notas.push({
          alunoId: al.id,
          disciplina: disc,
          b1: Math.round(clamp(base + (rnd() - 0.5) * 2, 0, 10) * 10) / 10,
          b2: Math.round(clamp(base + (rnd() - 0.5) * 2, 0, 10) * 10) / 10,
          b3: Math.round(clamp(base + (rnd() - 0.5) * 2, 0, 10) * 10) / 10,
          b4: Math.round(clamp(base + (rnd() - 0.5) * 2, 0, 10) * 10) / 10
        });
      });
    });

    // Frequência: últimos 40 dias úteis
    const frequencia = [];
    let contador = 0;
    while (contador < 40) {
      const iso = isoSomaDias(hojeISO(), -contador);
      const dow = new Date(`${iso}T12:00:00`).getDay();
      if (dow !== 0 && dow !== 6) {
        alunos.forEach((al) => {
          frequencia.push({ alunoId: al.id, data: iso, presente: rnd() > 0.085 });
        });
        contador++;
      } else {
        contador++;
      }
    }

    const eventos = [
      { id: uid('ev'), titulo: 'Reunião de pais e mestres', data: isoSomaDias(hojeISO(), 2),  hora: '19:00', tipo: 'reuniao',   desc: 'Apresentação do desempenho do 1º semestre.' },
      { id: uid('ev'), titulo: 'Prova de Matemática',       data: isoSomaDias(hojeISO(), 5),  hora: '08:00', tipo: 'prova',     desc: 'Unidade 3 — Frações e porcentagem.' },
      { id: uid('ev'), titulo: 'Feira de Ciências',         data: isoSomaDias(hojeISO(), 9), hora: '13:00', tipo: 'evento', desc: 'Projetos dos alunos do 8º e 9º ano.' },
      { id: uid('ev'), titulo: 'Atividade de Geografia',    data: isoSomaDias(hojeISO(), 12), hora: '10:00', tipo: 'atividade', desc: 'Mapa do relevo brasileiro.' },
      { id: uid('ev'), titulo: 'Prova de Português',        data: isoSomaDias(hojeISO(), -4), hora: '08:00', tipo: 'prova',     desc: 'Compreensão textual.' },
      { id: uid('ev'), titulo: 'Dia do Professor',          data: isoSomaDias(hojeISO(), 20), hora: '09:00', tipo: 'evento',    desc: 'Homenagem e confraternização.' },
      { id: uid('ev'), titulo: 'Conselho de classe',        data: isoSomaDias(hojeISO(), 26), hora: '18:30', tipo: 'reuniao',   desc: 'Fechamento do bimestre.' }
    ];

    const avisos = [
      { id: uid('av'), titulo: 'Matrículas 2027 abertas',      texto: 'As matrículas para o próximo ano letivo começam na próxima semana.', destinatario: 'todos',       autor: 'admin@smartschool.com', data: Date.now() - 3600e3 * 2 },
      { id: uid('av'), titulo: 'Calendário de provas publicado', texto: 'Confira na Agenda as datas das provas bimestrais de todas as turmas.', destinatario: 'todos',     autor: 'admin@smartschool.com', data: Date.now() - 3600e3 * 26 },
      { id: uid('av'), titulo: 'Reunião pedagógica',           texto: 'Professores: reunião na sala dos professores às 15h30.',               destinatario: 'professor',   autor: 'coordenacao@escola.edu.br', data: Date.now() - 3600e3 * 50 },
      { id: uid('av'), titulo: 'Alerta de frequência',         texto: 'Alunos com frequência abaixo de 75% serão convocados para orientação.', destinatario: 'responsavel', autor: 'admin@smartschool.com', data: Date.now() - 3600e3 * 74 }
    ];

    const mensagens = [
      { id: uid('ms'), de: 'professor@smartschool.com', para: 'admin@smartschool.com', assunto: 'Plano de aula',        texto: 'Segue o plano de aula do mês para revisão.',             data: Date.now() - 3600e3 * 3,  lida: false },
      { id: uid('ms'), de: 'responsavel@smartschool.com', para: 'professor@smartschool.com', assunto: 'Dúvida sobre nota', texto: 'Olá, professor. Poderia explicar a nota do 2º bimestre?', data: Date.now() - 3600e3 * 8, lida: false },
      { id: uid('ms'), de: 'admin@smartschool.com', para: 'responsavel@smartschool.com', assunto: 'Frequência',          texto: 'A frequência da Ana está dentro da média da turma.',      data: Date.now() - 3600e3 * 30, lida: true },
      { id: uid('ms'), de: 'aluno@smartschool.com', para: 'professor@smartschool.com', assunto: 'Atividade extra',      texto: 'Posso entregar a atividade na segunda-feira?',           data: Date.now() - 3600e3 * 52, lida: true }
    ];

    const usuarios = [
      { id: uid('u'), nome: 'Administrador Smart', email: 'admin@smartschool.com',      senha: '123456', perfil: 'administrador', status: 'ativo', vinculo: null },
      { id: uid('u'), nome: 'Carlos Mendes',       email: 'professor@smartschool.com',  senha: '123456', perfil: 'professor',     status: 'ativo', vinculo: 'p1' },
      { id: uid('u'), nome: 'Ana Beatriz Souza',   email: 'aluno@smartschool.com',      senha: '123456', perfil: 'aluno',         status: 'ativo', vinculo: 'a1' },
      { id: uid('u'), nome: 'Mariana Souza',       email: 'responsavel@smartschool.com', senha: '123456', perfil: 'responsavel',  status: 'ativo', vinculo: 'a1' },
      { id: uid('u'), nome: 'Fernanda Lima',       email: 'fernanda@smartschool.com',   senha: '123456', perfil: 'professor',     status: 'ativo', vinculo: 'p2' },
      { id: uid('u'), nome: 'Coordenação',         email: 'coordenacao@escola.edu.br',  senha: '123456', perfil: 'administrador', status: 'inativo', vinculo: null }
    ];

    return {
      version: 1,
      escola: { nome: 'Escola Modelo SmartSchool', ano: String(new Date().getFullYear()), endereco: 'Av. da Educação, 1000', telefone: '(11) 3456-7890', email: 'contato@smartschool.edu.br' },
      prefs: { tema: 'light', sidebar: false, alertas: true, inicio: 'dashboard' },
      permissoes: JSON.parse(JSON.stringify(PERMISSOES_PADRAO)),
      turmas, professores, alunos, notas, frequencia, eventos, avisos, mensagens, usuarios
    };
  },

  // Atalhos de consulta
  turma: (id) => DB.data.turmas.find((t) => t.id === id),
  aluno: (id) => DB.data.alunos.find((a) => a.id === id),
  professor: (id) => DB.data.professores.find((p) => p.id === id)
};

/* ---------------------------------------------------------
   5. REGRAS DE NEGÓCIO (notas, frequência, permissões)
--------------------------------------------------------- */
const Regras = {
  nota(alunoId, disciplina) {
    let n = DB.data.notas.find((x) => x.alunoId === alunoId && x.disciplina === disciplina);
    if (!n) {
      n = { alunoId, disciplina, b1: null, b2: null, b3: null, b4: null };
      DB.data.notas.push(n);
    }
    return n;
  },

  media(n) {
    const vs = [n.b1, n.b2, n.b3, n.b4].filter((v) => typeof v === 'number' && !Number.isNaN(v));
    return vs.length ? Math.round((vs.reduce((a, b) => a + b, 0) / vs.length) * 10) / 10 : 0;
  },

  situacao(m) {
    if (m >= 7) return { rotulo: 'Aprovado', cls: 'badge-green' };
    if (m >= 5) return { rotulo: 'Recuperação', cls: 'badge-amber' };
    return { rotulo: 'Reprovado', cls: 'badge-rose' };
  },

  mediaAluno(alunoId, turma) {
    const discs = (turma || {}).disciplinas || [];
    const medias = discs.map((d) => Regras.media(Regras.nota(alunoId, d))).filter((m) => m > 0);
    return Math.round(mediaArr(medias) * 10) / 10;
  },

  frequencia(alunoId, inicio, fim) {
    const regs = DB.data.frequencia.filter((f) =>
      f.alunoId === alunoId &&
      (!inicio || f.data >= inicio) &&
      (!fim || f.data <= fim)
    );
    const pres = regs.filter((r) => r.presente).length;
    const total = regs.length;
    return { total, pres, faltas: total - pres, pct: total ? Math.round((pres / total) * 100) : 0 };
  },

  pode(pagina) {
    if (!State.user) return false;
    const perms = DB.data.permissoes[State.user.perfil] || [];
    return perms.includes(pagina);
  },

  podeEditar(cadastro) {
    if (!State.user) return false;
    if (State.user.perfil === 'administrador') return true;
    if (State.user.perfil === 'professor') return cadastro !== 'config';
    return false;
  }
};

function alunosVisiveis() {
  const u = State.user;
  const todos = DB.data.alunos;
  if (!u) return todos;
  if ((u.perfil === 'aluno' || u.perfil === 'responsavel') && u.vinculo) {
    return todos.filter((a) => a.id === u.vinculo);
  }
  return todos;
}

/* ---------------------------------------------------------
   6. UI: toasts, modais, confirmação, animações
--------------------------------------------------------- */
const UI = {
  toast(msg, tipo = 'success') {
    const wrap = $('#toastWrap');
    const el = document.createElement('div');
    el.className = `toast ${tipo === 'error' ? 'error' : tipo === 'info' ? 'info' : ''}`;
    el.innerHTML = `<span>${tipo === 'error' ? '⚠️' : tipo === 'info' ? 'ℹ️' : '✅'}</span><span>${esc(msg)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
  },

  abrirModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  },

  fecharModais() { $$('.modal.open').forEach((m) => m.classList.remove('open')); },

  confirmar(texto) {
    return new Promise((resolve) => {
      let resolvido = false;
      const concluir = (valor) => {
        if (resolvido) return;
        resolvido = true;
        document.removeEventListener('keydown', tecla);
        $('#modalConfirm').removeEventListener('click', clique);
        UI.fecharModais();
        resolve(valor);
      };
      const tecla = (ev) => { if (ev.key === 'Escape') concluir(false); };
      const clique = (ev) => { if (ev.target === $('#modalConfirm')) concluir(false); };

      $('#modalConfirmTexto').textContent = texto;
      UI.abrirModal('modalConfirm');
      document.addEventListener('keydown', tecla);
      $('#modalConfirm').addEventListener('click', clique);

      const btn = $('#confirmarBtn');
      const novo = btn.cloneNode(true);
      btn.replaceWith(novo);
      novo.addEventListener('click', () => concluir(true), { once: true });
    });
  },

  marcarInvalido(input, invalido) {
    if (input) input.classList.toggle('invalid', !!invalido);
  }
};

/* ---------------------------------------------------------
   7. GRÁFICOS (canvas puro, sem bibliotecas)
--------------------------------------------------------- */
const Graficos = {
  preparar(canvas) {
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 600;
    const h = canvas.clientHeight || 220;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = '12px Segoe UI, system-ui, sans-serif';
    return { ctx, w, h };
  },

  estilo(base) {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      grid: dark ? 'rgba(148,163,184,.18)' : 'rgba(100,116,139,.18)',
      texto: dark ? '#94a3b8' : '#64748b',
      base
    };
  },

  barras(canvas, labels, values, corA = '#2563eb', corB = '#7c3aed', maxOverride) {
    const p = this.preparar(canvas);
    if (!p) return;
    const { ctx, w, h } = p;
    const est = this.estilo();
    const pad = { top: 26, right: 12, bottom: 34, left: 34 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    const max = maxOverride || Math.max(10, ...values.map((v) => v + 1));

    // grade + eixo Y
    ctx.strokeStyle = est.grid;
    ctx.fillStyle = est.texto;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      const val = Math.round(max - (max / 4) * i);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(String(val), pad.left - 7, y);
    }

    const slot = cw / Math.max(values.length, 1);
    const barW = Math.min(46, slot * 0.55);

    values.forEach((v, i) => {
      const x = pad.left + slot * i + (slot - barW) / 2;
      const bh = (v / max) * ch;
      const y = pad.top + ch - bh;
      const g = ctx.createLinearGradient(0, y, 0, pad.top + ch);
      g.addColorStop(0, corA); g.addColorStop(1, corB);
      ctx.fillStyle = g;
      Graficos.roundRect(ctx, x, y, barW, Math.max(bh, 2), 7);
      ctx.fill();

      ctx.fillStyle = est.texto;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const lab = String(labels[i] ?? '');
      ctx.fillText(lab.length > 12 ? `${lab.slice(0, 11)}…` : lab, x + barW / 2, pad.top + ch + 9);

      ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#e6edf7' : '#0f172a';
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(v), x + barW / 2, y - 5);
      ctx.font = '12px Segoe UI, system-ui, sans-serif';
    });
  },

  linha(canvas, labels, values, cor = '#7c3aed') {
    const p = this.preparar(canvas);
    if (!p) return;
    const { ctx, w, h } = p;
    const est = this.estilo();
    const pad = { top: 24, right: 14, bottom: 32, left: 34 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    const min = Math.max(0, Math.min(...values, 60) - 10);
    const max = 100;

    ctx.strokeStyle = est.grid;
    ctx.fillStyle = est.texto;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(max - ((max - min) / 4) * i)}%`, pad.left - 7, y);
    }

    const step = values.length > 1 ? cw / (values.length - 1) : cw;
    const pt = (v, i) => [pad.left + step * i, pad.top + ch - ((v - min) / (max - min)) * ch];

    // área
    ctx.beginPath();
    values.forEach((v, i) => { const [x, y] = pt(v, i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineTo(pad.left + step * (values.length - 1), pad.top + ch);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    g.addColorStop(0, 'rgba(124,58,237,.35)');
    g.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.fillStyle = g; ctx.fill();

    // linha
    ctx.beginPath();
    values.forEach((v, i) => { const [x, y] = pt(v, i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = cor; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

    // pontos + rótulos
    values.forEach((v, i) => {
      const [x, y] = pt(v, i);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = cor; ctx.fill();
      ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#111a2c' : '#fff';
      ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = est.texto;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      if (values.length <= 16 || i % 2 === 0) ctx.fillText(String(labels[i] ?? ''), x, pad.top + ch + 9);
    });
  },

  roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
};

/* ---------------------------------------------------------
   8. TEMA, SIDEBAR, NOTIFICAÇÕES
--------------------------------------------------------- */
const Interface = {
  aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    $('#btnTema').textContent = tema === 'dark' ? '☀️' : '🌙';
    $('#prefTema').checked = tema === 'dark';
    DB.data.prefs.tema = tema;
    DB.save();
    Graficos.redesenharVisiveis();
  },

  alternarTema() {
    this.aplicarTema(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  },

  alternarSidebar() {
    const app = $('#app');
    if (window.innerWidth <= 900) {
      app.classList.toggle('mobile-nav');
    } else {
      app.classList.toggle('sidebar-collapsed');
      DB.data.prefs.sidebar = app.classList.contains('sidebar-collapsed');
      DB.save();
      Graficos.redesenharVisiveis();
    }
  },

  fecharSidebarMobile() { $('#app').classList.remove('mobile-nav'); },

  notificacoes() {
    const u = State.user;
    const itens = [];
    (DB.data.mensagens || []).forEach((m) => {
      if (!m.lida && m.para === u.email) {
        itens.push({ ico: '💬', titulo: `Mensagem de ${m.de}`, sub: m.assunto });
      }
    });
    (DB.data.avisos || []).forEach((a) => {
      const recente = Date.now() - a.data < 3600e3 * 48;
      if (recente && (a.destinatario === 'todos' || a.destinatario === u.perfil)) {
        itens.push({ ico: '📢', titulo: a.titulo, sub: fmtDataHora(a.data) });
      }
    });
    return itens.slice(0, 8);
  },

  renderNotificacoes() {
    const itens = this.notificacoes();
    const badge = $('#notifBadge');
    badge.textContent = String(itens.length);
    badge.dataset.count = String(itens.length);
    $('#notifList').innerHTML = itens.length
      ? itens.map((i) => `<div class="notif-item"><span class="n-ico">${i.ico}</span><div><strong>${esc(i.titulo)}</strong><span>${esc(i.sub)}</span></div></div>`).join('')
      : '<div class="notif-item"><span class="n-ico">✅</span><div><strong>Sem novidades</strong><span>Você está em dia.</span></div></div>';
  },

  fecharDropdowns() {
    $('#userDropdown').classList.remove('open');
    $('#notifDropdown').classList.remove('open');
    $('#btnUserMenu').setAttribute('aria-expanded', 'false');
  }
};

Graficos.redesenharVisiveis = function () {
  if (State.page === 'dashboard') Dashboard.desenharGraficos();
  if (State.page === 'notas') Notas.desenharGrafico();
};

/* ---------------------------------------------------------
   9. AUTENTICAÇÃO
--------------------------------------------------------- */
const Auth = {
  entrar(email, senha) {
    const u = DB.data.usuarios.find((x) => x.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!u) return { ok: false, msg: 'E-mail não encontrado.' };
    if (u.senha !== senha) return { ok: false, msg: 'Senha incorreta.' };
    if (u.status !== 'ativo') return { ok: false, msg: 'Usuário inativo. Contate a secretaria.' };
    return { ok: true, user: u };
  },

  sessao(salvar) {
    try {
      if (salvar) localStorage.setItem(DB.SESSION_KEY, JSON.stringify(State.user));
      else sessionStorage.setItem(DB.SESSION_KEY, JSON.stringify(State.user));
    } catch (e) { /* ignorar */ }
  },

  restaurar() {
    try {
      const bruto = sessionStorage.getItem(DB.SESSION_KEY) || localStorage.getItem(DB.SESSION_KEY);
      if (!bruto) return null;
      const salvo = JSON.parse(bruto);
      return DB.data.usuarios.find((u) => u.id === salvo.id) || null;
    } catch (e) { return null; }
  },

  sair() {
    try {
      localStorage.removeItem(DB.SESSION_KEY);
      sessionStorage.removeItem(DB.SESSION_KEY);
    } catch (e) { /* ignorar */ }
    State.user = null;
    $('#app').classList.add('hidden');
    $('#loginScreen').classList.remove('hidden');
    $('#loginForm').reset();
    Interface.fecharDropdowns();
    UI.toast('Sessão encerrada com sucesso.', 'info');
  },

  entrarNoApp(user, lembrar) {
    State.user = user;
    this.sessao(!!lembrar);
    $('#loginScreen').classList.add('hidden');
    $('#app').classList.remove('hidden');

    $('#sideUserName').textContent = user.nome;
    $('#sideUserRole').textContent = ROTULO_PERFIL[user.perfil] || user.perfil;
    $('#topUserName').textContent = user.nome;
    $('#dropUserName').textContent = user.nome;
    $('#dropUserRole').textContent = ROTULO_PERFIL[user.perfil] || user.perfil;
    $('#sideAvatar').textContent = iniciais(user.nome);
    $('#topAvatar').textContent = iniciais(user.nome);
    $('#brandSchool').textContent = DB.data.escola.nome;

    this.aplicarPermissoes();
    Interface.renderNotificacoes();
    const inicio = Regras.pode(DB.data.prefs.inicio) ? DB.data.prefs.inicio : 'dashboard';
    Navegacao.ir(inicio);
    UI.toast(`Bem-vindo(a), ${user.nome.split(' ')[0]}!`);
  },

  aplicarPermissoes() {
    $$('#sidebarNav .nav-item').forEach((item) => {
      const pagina = item.dataset.page;
      item.classList.toggle('hidden', !Regras.pode(pagina));
    });
    const cfg = $$('#sidebarNav .nav-item').find((i) => i.dataset.page === 'configuracoes');
    const labelCfg = cfg ? cfg.previousElementSibling : null;
    if (labelCfg && labelCfg.classList.contains('nav-label')) {
      labelCfg.classList.toggle('hidden', !Regras.pode('configuracoes'));
    }
  }
};

/* ---------------------------------------------------------
   10. NAVEGAÇÃO / ROTEADOR
--------------------------------------------------------- */
const Navegacao = {
  ir(pagina) {
    if (!PAGINAS[pagina]) pagina = 'dashboard';
    if (!Regras.pode(pagina)) {
      UI.toast('Você não tem permissão para acessar esta área.', 'error');
      pagina = 'dashboard';
    }
    State.page = pagina;

    $$('#sidebarNav .nav-item').forEach((i) => i.classList.toggle('active', i.dataset.page === pagina));
    $$('.page').forEach((p) => p.classList.toggle('hidden', p.id !== `page-${pagina}`));

    $('#pageTitle').textContent = PAGINAS[pagina].titulo;
    $('#pageSub').textContent = PAGINAS[pagina].sub;
    document.title = `${PAGINAS[pagina].titulo} | SmartSchool`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Interface.fecharSidebarMobile();
    Interface.fecharDropdowns();

    Render[pagina] && Render[pagina]();
  }
};

/* ---------------------------------------------------------
   11. HELPERS DE RENDERIZAÇÃO COMPARTILHADOS
--------------------------------------------------------- */
const Helpers = {
  badgeSituacao(m) {
    const s = Regras.situacao(m);
    return `<span class="badge ${s.cls}">${s.rotulo}</span>`;
  },

  badgeFrequencia(pct) {
    const cls = pct >= 90 ? 'badge-green' : pct >= 75 ? 'badge-amber' : 'badge-rose';
    return `<span class="badge ${cls}">${pct}%</span>`;
  },

  turmaOptions(sel, incluirTodas = false) {
    const u = State.user;
    let turmas = DB.data.turmas;
    if (u && (u.perfil === 'aluno' || u.perfil === 'responsavel') && u.vinculo) {
      const al = DB.aluno(u.vinculo);
      turmas = al ? turmas.filter((t) => t.id === al.turmaId) : turmas;
    }
    const html = (incluirTodas ? '<option value="">Todas as turmas</option>' : '') +
      turmas.map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join('');
    if (sel) sel.innerHTML = html;
    return turmas;
  },

  vazio(colspan, texto) {
    return `<tr><td colspan="${colspan}" class="empty-state">${esc(texto)}</td></tr>`;
  },

  acoes(tipo, id) {
    return `<div class="row-actions">
      <button class="mini-btn" data-acao="ver" data-tipo="${tipo}" data-id="${id}" title="Ver perfil">👁</button>
      <button class="mini-btn" data-acao="editar" data-tipo="${tipo}" data-id="${id}" title="Editar">✏️</button>
      <button class="mini-btn danger" data-acao="excluir" data-tipo="${tipo}" data-id="${id}" title="Excluir">🗑</button>
    </div>`;
  }
};

/* ---------------------------------------------------------
   12. PÁGINA: DASHBOARD
--------------------------------------------------------- */
const Dashboard = {
  render() {
    const alunos = alunosVisiveis();
    const visiveisIds = new Set(alunos.map((a) => a.id));
    const notasGeral = DB.data.notas.filter((n) => visiveisIds.has(n.alunoId)).map((n) => Regras.media(n)).filter((m) => m > 0);
    const freqGeral = alunos.map((a) => Regras.frequencia(a.id).pct);

    $('#statAlunos').textContent = String(DB.data.alunos.length);
    $('#statProfessores').textContent = String(DB.data.professores.length);
    $('#statTurmas').textContent = String(DB.data.turmas.length);
    $('#statFrequencia').textContent = `${Math.round(mediaArr(freqGeral))}%`;
    $('#statNotas').textContent = (Math.round(mediaArr(notasGeral) * 10) / 10).toFixed(1).replace('.', ',');

    this.calendarioMini();
    this.avisos();
    this.atividades();
    requestAnimationFrame(() => this.desenharGraficos());
  },

  desenharGraficos() {
    // Desempenho por turma
    const labelsT = DB.data.turmas.map((t) => t.nome);
    const valoresT = DB.data.turmas.map((t) => {
      const als = DB.data.alunos.filter((a) => a.turmaId === t.id);
      return Math.round(mediaArr(als.map((a) => Regras.mediaAluno(a.id, t))) * 10) / 10;
    });
    Graficos.barras($('#chartDesempenho'), labelsT, valoresT, '#2563eb', '#7c3aed', 10);

    // Frequência dos últimos 15 dias úteis
    const dias = [];
    let i = 0;
    while (dias.length < 15 && i < 40) {
      const iso = isoSomaDias(hojeISO(), -i);
      const dow = new Date(`${iso}T12:00:00`).getDay();
      if (dow !== 0 && dow !== 6) dias.push(iso);
      i++;
    }
    const serie = dias.map((iso) => {
      const regs = DB.data.frequencia.filter((f) => f.data === iso);
      if (!regs.length) return 100;
      return Math.round((regs.filter((r) => r.presente).length / regs.length) * 100);
    }).reverse();
    Graficos.linha($('#chartFrequencia'), dias.map((d) => d.slice(8).padStart(2, '0') + '/' + d.slice(5, 7)), serie, '#7c3aed');
  },

  calendarioMini() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const primeiro = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const eventosMes = DB.data.eventos.filter((e) => {
      const [y, m] = e.data.split('-').map(Number);
      return y === ano && m === mes + 1;
    });

    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = `<div class="mini-cal-head">${nomes.map((n) => `<span>${n}</span>`).join('')}</div><div class="mini-cal-grid">`;

    const anteriorDias = new Date(ano, mes, 0).getDate();
    for (let i = primeiro - 1; i >= 0; i--) {
      html += `<div class="mini-day muted">${anteriorDias - i}</div>`;
    }
    for (let d = 1; d <= diasNoMes; d++) {
      const iso = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const doDia = eventosMes.filter((e) => e.data === iso);
      const ehHoje = d === hoje.getDate();
      const cores = [...new Set(doDia.map((e) => e.tipo === 'prova' ? 'purple' : e.tipo === 'reuniao' ? 'rose' : e.tipo === 'atividade' ? 'green' : 'blue'))];
      html += `<div class="mini-day ${ehHoje ? 'today' : ''}" title="${doDia.map((e) => e.titulo).join(' · ')}">
        <span>${d}</span>
        <span class="dots">${cores.slice(0, 3).map((c) => `<i class="dot ${c}"></i>`).join('')}</span>
      </div>`;
    }
    const resto = 7 - ((primeiro + diasNoMes) % 7 || 7);
    for (let d = 1; d <= resto; d++) html += `<div class="mini-day muted">${d}</div>`;
    html += '</div>';
    $('#miniCalendario').innerHTML = html;
  },

  avisos() {
    const u = State.user;
    const lista = (DB.data.avisos || [])
      .filter((a) => a.destinatario === 'todos' || a.destinatario === u.perfil)
      .slice(0, 4);
    $('#avisosRecentes').innerHTML = lista.length ? lista.map((a) => `
      <li class="feed-item">
        <div class="feed-ico purple">📢</div>
        <div class="feed-body">
          <strong>${esc(a.titulo)}</strong>
          <p>${esc(a.texto)}</p>
          <time>${fmtDataHora(a.data)}</time>
        </div>
      </li>`).join('') : '<li class="empty-state">Nenhum aviso no momento.</li>';
  },

  atividades() {
    const hoje = hojeISO();
    const futuros = (DB.data.eventos || [])
      .filter((e) => e.data >= hoje)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 5);
    $('#proximasAtividades').innerHTML = futuros.length ? futuros.map((e) => `
      <li class="feed-item">
        <div class="feed-ico ${e.tipo === 'prova' ? 'purple' : e.tipo === 'reuniao' ? 'rose' : e.tipo === 'atividade' ? 'green' : 'blue'}">${e.tipo === 'prova' ? '🧪' : e.tipo === 'reuniao' ? '👥' : e.tipo === 'atividade' ? '📄' : '🎉'}</div>
        <div class="feed-body">
          <strong>${esc(e.titulo)}</strong>
          <p>${fmtData(e.data)}${e.hora ? ` · ${esc(e.hora)}` : ''} · ${esc(e.tipo)}</p>
        </div>
      </li>`).join('') : '<li class="empty-state">Sem atividades programadas.</li>';
  }
};

/* ---------------------------------------------------------
   13. PÁGINA: ALUNOS
--------------------------------------------------------- */
const Alunos = {
  render() {
    Helpers.turmaOptions($('#alunoFiltroTurma'), true);
    const soPropria = ['aluno', 'responsavel'].includes(State.user.perfil);
    $('#btnNovoAluno').classList.toggle('hidden', soPropria || !Regras.podeEditar('alunos'));
    this.listar();
  },

  listar() {
    const busca = ($('#alunoBusca').value || '').toLowerCase().trim();
    const turmaId = $('#alunoFiltroTurma').value;
    const lista = alunosVisiveis().filter((a) => {
      const alvo = `${a.nome} ${a.matricula} ${a.email}`.toLowerCase();
      return (!busca || alvo.includes(busca)) && (!turmaId || a.turmaId === turmaId);
    });

    $('#alunosContagem').textContent = `${lista.length} aluno${lista.length === 1 ? '' : 's'}`;
    const editar = Regras.podeEditar('alunos') && !['aluno', 'responsavel'].includes(State.user.perfil);

    $('#alunosTbody').innerHTML = lista.length ? lista.map((a) => {
      const t = DB.turma(a.turmaId);
      const f = Regras.frequencia(a.id);
      return `<tr>
        <td><div class="cell-user"><span class="avatar sm">${iniciais(a.nome)}</span>
          <div><strong>${esc(a.nome)}</strong><span>${esc(a.email)}</span></div></div></td>
        <td>${esc(a.matricula)}</td>
        <td><span class="badge badge-blue">${esc(t ? t.nome : '—')}</span></td>
        <td>${esc(a.responsavel)}</td>
        <td>${esc(a.telefone)}</td>
        <td>${Helpers.badgeFrequencia(f.pct)}</td>
        <td>${editar || ['aluno', 'responsavel'].includes(State.user.perfil)
          ? `<div class="row-actions">
              <button class="mini-btn" data-acao="ver" data-tipo="aluno" data-id="${a.id}" title="Ver perfil">👁</button>
              ${editar ? `<button class="mini-btn" data-acao="editar" data-tipo="aluno" data-id="${a.id}" title="Editar">✏️</button>
              <button class="mini-btn danger" data-acao="excluir" data-tipo="aluno" data-id="${a.id}" title="Excluir">🗑</button>` : ''}
            </div>` : '—'}
      </tr>`;
    }).join('') : Helpers.vazio(7, 'Nenhum aluno encontrado.');
  },

  abrirFormulario(id) {
    $('#formAluno').reset();
    $('#formAlunoErro').textContent = '';
    $$('#formAluno .invalid').forEach((i) => i.classList.remove('invalid'));
    $('#alunoId').value = '';
    Helpers.turmaOptions($('#alunoTurma'));
    $('#modalAlunoTitulo').textContent = 'Novo aluno';

    if (id) {
      const a = DB.aluno(id);
      if (!a) return;
      $('#alunoId').value = a.id;
      $('#alunoNome').value = a.nome;
      $('#alunoMatricula').value = a.matricula;
      $('#alunoNascimento').value = a.nascimento;
      $('#alunoTurma').value = a.turmaId;
      $('#alunoResponsavel').value = a.responsavel;
      $('#alunoTelefone').value = a.telefone;
      $('#alunoEmail').value = a.email;
      $('#modalAlunoTitulo').textContent = 'Editar aluno';
    }
    UI.abrirModal('modalAluno');
  },

  salvar() {
    const campos = [
      ['#alunoNome', (v) => v.trim().length >= 3, 'Informe o nome completo (mín. 3 letras).'],
      ['#alunoMatricula', (v) => v.trim().length >= 3, 'Informe a matrícula.'],
      ['#alunoNascimento', (v) => !!v, 'Informe a data de nascimento.'],
      ['#alunoTurma', (v) => !!v, 'Selecione a turma.'],
      ['#alunoResponsavel', (v) => v.trim().length >= 3, 'Informe o responsável.'],
      ['#alunoTelefone', (v) => v.trim().length >= 8, 'Informe um telefone válido.'],
      ['#alunoEmail', ehEmail, 'Informe um e-mail válido.']
    ];
    let erro = '';
    campos.forEach(([sel, valida]) => {
      const el = $(sel);
      const ok = valida(el.value);
      UI.marcarInvalido(el, !ok);
      if (!ok && !erro) erro = 'Corrija os campos destacados.';
    });
    if (erro) { $('#formAlunoErro').textContent = erro; return; }

    const id = $('#alunoId').value;
    const dados = {
      nome: $('#alunoNome').value.trim(),
      matricula: $('#alunoMatricula').value.trim(),
      nascimento: $('#alunoNascimento').value,
      turmaId: $('#alunoTurma').value,
      responsavel: $('#alunoResponsavel').value.trim(),
      telefone: $('#alunoTelefone').value.trim(),
      email: $('#alunoEmail').value.trim()
    };

    if (id) {
      Object.assign(DB.aluno(id), dados);
      UI.toast('Aluno atualizado com sucesso.');
    } else {
      DB.data.alunos.push({ id: uid('al'), ...dados });
      UI.toast('Aluno cadastrado com sucesso.');
    }
    DB.save();
    UI.fecharModais();
    this.listar();
    Dashboard.render();
  },

  verPerfil(id) {
    const a = DB.aluno(id);
    if (!a) return;
    const t = DB.turma(a.turmaId);
    const f = Regras.frequencia(a.id);
    const medias = (t ? t.disciplinas : []).map((d) => {
      const m = Regras.media(Regras.nota(a.id, d));
      return { d, m };
    });
    const geral = Regras.mediaAluno(a.id, t);

    $('#modalPerfilTitulo').textContent = a.nome;
    $('#perfilAlunoConteudo').innerHTML = `
      <div class="perfil-top">
        <span class="avatar">${iniciais(a.nome)}</span>
        <div>
          <h4>${esc(a.nome)}</h4>
          <p>Matrícula ${esc(a.matricula)} · ${esc(t ? t.nome : '—')}</p>
        </div>
        <div style="margin-left:auto">${Helpers.badgeSituacao(geral)}</div>
      </div>

      <div class="perfil-grid">
        <div class="perfil-info"><span>Data de nascimento</span><strong>${fmtData(a.nascimento)}</strong></div>
        <div class="perfil-info"><span>Responsável</span><strong>${esc(a.responsavel)}</strong></div>
        <div class="perfil-info"><span>Telefone</span><strong>${esc(a.telefone)}</strong></div>
        <div class="perfil-info"><span>E-mail</span><strong>${esc(a.email)}</strong></div>
        <div class="perfil-info"><span>Frequência</span><strong>${f.pct}% (${f.faltas} falta${f.faltas === 1 ? '' : 's'})</strong></div>
        <div class="perfil-info"><span>Média geral</span><strong>${geral.toFixed(1).replace('.', ',')}</strong></div>
      </div>

      <div class="perfil-section">
        <h5>Histórico de notas</h5>
        <div class="table-wrap">
          <table class="table" style="min-width:520px">
            <thead><tr><th>Disciplina</th><th>1º</th><th>2º</th><th>3º</th><th>4º</th><th>Média</th><th>Situação</th></tr></thead>
            <tbody>
              ${medias.map(({ d, m }) => `<tr>
                <td>${esc(d)}</td>
                <td>${Regras.nota(a.id, d).b1 ?? '—'}</td>
                <td>${Regras.nota(a.id, d).b2 ?? '—'}</td>
                <td>${Regras.nota(a.id, d).b3 ?? '—'}</td>
                <td>${Regras.nota(a.id, d).b4 ?? '—'}</td>
                <td><b>${m ? m.toFixed(1).replace('.', ',') : '—'}</b></td>
                <td>${m ? Helpers.badgeSituacao(m) : '—'}</td>
              </tr>`).join('') || `<tr><td colspan="7" class="empty-state">Sem notas lançadas.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <div class="perfil-section">
        <h5>Frequência por período</h5>
        <div class="perfil-grid">
          <div class="perfil-info"><span>Últimos 30 dias</span><strong>${Regras.frequencia(a.id, isoSomaDias(hojeISO(), -30)).pct}%</strong></div>
          <div class="perfil-info"><span>Últimos 60 dias</span><strong>${Regras.frequencia(a.id, isoSomaDias(hojeISO(), -60)).pct}%</strong></div>
          <div class="perfil-info"><span>Total de registros</span><strong>${f.total} dias</strong></div>
          <div class="perfil-info"><span>Presenças / Faltas</span><strong>${f.pres} / ${f.faltas}</strong></div>
        </div>
      </div>`;
    UI.abrirModal('modalPerfilAluno');
  },

  excluir(id) {
    const a = DB.aluno(id);
    if (!a) return;
    UI.confirmar(`Excluir o aluno "${a.nome}"? Notas e frequência também serão removidas.`).then((ok) => {
      if (!ok) return;
      DB.data.alunos = DB.data.alunos.filter((x) => x.id !== id);
      DB.data.notas = DB.data.notas.filter((n) => n.alunoId !== id);
      DB.data.frequencia = DB.data.frequencia.filter((f) => f.alunoId !== id);
      DB.save();
      this.listar();
      Dashboard.render();
      UI.toast('Aluno excluído.');
    });
  }
};

/* ---------------------------------------------------------
   14. PÁGINA: PROFESSORES
--------------------------------------------------------- */
const Professores = {
  render() {
    const editar = Regras.podeEditar('professores');
    $('#btnNovoProfessor').classList.toggle('hidden', !editar);
    const lista = State.user.perfil === 'professor' && State.user.vinculo
      ? DB.data.professores.filter((p) => p.id === State.user.vinculo)
      : DB.data.professores;

    $('#professoresContagem').textContent = `${lista.length} professor${lista.length === 1 ? '' : 'es'}`;
    $('#professoresTbody').innerHTML = lista.length ? lista.map((p) => {
      const turmas = p.turmas.map((id) => DB.turma(id)).filter(Boolean);
      const qtdAlunos = DB.data.alunos.filter((a) => p.turmas.includes(a.turmaId)).length;
      return `<tr>
        <td><div class="cell-user"><span class="avatar sm">${iniciais(p.nome)}</span>
          <div><strong>${esc(p.nome)}</strong><span>${esc(p.email)} · ${esc(p.telefone)}</span></div></div></td>
        <td>${p.disciplinas.map((d) => `<span class="badge badge-purple">${esc(d)}</span>`).join(' ')}</td>
        <td>${turmas.map((t) => `<span class="badge badge-blue">${esc(t.nome)}</span>`).join(' ') || '—'}</td>
        <td>${esc(p.horario)}</td>
        <td>${qtdAlunos}</td>
        <td>${editar ? `<div class="row-actions">
            <button class="mini-btn" data-acao="ver" data-tipo="professor" data-id="${p.id}">👁</button>
            <button class="mini-btn" data-acao="editar" data-tipo="professor" data-id="${p.id}">✏️</button>
            <button class="mini-btn danger" data-acao="excluir" data-tipo="professor" data-id="${p.id}">🗑</button>
          </div>` : '—'}</td>
      </tr>`;
    }).join('') : Helpers.vazio(6, 'Nenhum professor cadastrado.');
  },

  abrirFormulario(id) {
    $('#formProfessor').reset();
    $('#formProfessorErro').textContent = '';
    $('#profId').value = '';
    $('#modalProfessorTitulo').textContent = 'Novo professor';

    const disciplinasBase = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Ed. Física', 'Artes'];
    $('#profDisciplinas').innerHTML = disciplinasBase.map((d) => `
      <label><input type="checkbox" value="${d}"> ${d}</label>`).join('');
    $('#profTurmas').innerHTML = DB.data.turmas.map((t) => `
      <label><input type="checkbox" value="${t.id}"> ${esc(t.nome)}</label>`).join('');

    if (id) {
      const p = DB.professor(id);
      if (!p) return;
      $('#profId').value = p.id;
      $('#profNome').value = p.nome;
      $('#profEmail').value = p.email;
      $('#profTelefone').value = p.telefone;
      $('#profHorario').value = p.horario;
      $$('#profDisciplinas input').forEach((c) => { c.checked = p.disciplinas.includes(c.value); });
      $$('#profTurmas input').forEach((c) => { c.checked = p.turmas.includes(c.value); });
      $('#modalProfessorTitulo').textContent = 'Editar professor';
    }
    UI.abrirModal('modalProfessor');
  },

  salvar() {
    const nome = $('#profNome').value.trim();
    const email = $('#profEmail').value.trim();
    const tel = $('#profTelefone').value.trim();
    const hor = $('#profHorario').value.trim();
    const discs = $$('#profDisciplinas input:checked').map((c) => c.value);
    const turms = $$('#profTurmas input:checked').map((c) => c.value);

    UI.marcarInvalido($('#profNome'), nome.length < 3);
    UI.marcarInvalido($('#profEmail'), !ehEmail(email));
    UI.marcarInvalido($('#profTelefone'), tel.length < 8);
    UI.marcarInvalido($('#profHorario'), hor.length < 3);

    let erro = '';
    if (nome.length < 3) erro = 'Informe o nome do professor.';
    else if (!ehEmail(email)) erro = 'Informe um e-mail válido.';
    else if (tel.length < 8) erro = 'Informe um telefone válido.';
    else if (hor.length < 3) erro = 'Informe o horário de trabalho.';
    else if (!discs.length) erro = 'Selecione ao menos uma disciplina.';

    if (erro) { $('#formProfessorErro').textContent = erro; return; }

    const id = $('#profId').value;
    const dados = { nome, email, telefone: tel, horario: hor, disciplinas: discs, turmas: turms };
    if (id) {
      Object.assign(DB.professor(id), dados);
      UI.toast('Professor atualizado.');
    } else {
      DB.data.professores.push({ id: uid('pf'), ...dados });
      UI.toast('Professor cadastrado.');
    }
    DB.save();
    UI.fecharModais();
    this.render();
    Dashboard.render();
  },

  verPerfil(id) {
    const p = DB.professor(id);
    if (!p) return;
    const turmas = p.turmas.map((t) => DB.turma(t)).filter(Boolean);
    const alunos = DB.data.alunos.filter((a) => p.turmas.includes(a.turmaId));
    $('#modalPerfilTitulo').textContent = p.nome;
    $('#perfilAlunoConteudo').innerHTML = `
      <div class="perfil-top">
        <span class="avatar">${iniciais(p.nome)}</span>
        <div><h4>${esc(p.nome)}</h4><p>${esc(p.email)} · ${esc(p.telefone)}</p></div>
      </div>
      <div class="perfil-grid">
        <div class="perfil-info"><span>Horário</span><strong>${esc(p.horario)}</strong></div>
        <div class="perfil-info"><span>Disciplinas</span><strong>${p.disciplinas.map(esc).join(', ')}</strong></div>
        <div class="perfil-info"><span>Turmas</span><strong>${turmas.map((t) => esc(t.nome)).join(', ') || '—'}</strong></div>
        <div class="perfil-info"><span>Total de alunos</span><strong>${alunos.length}</strong></div>
      </div>
      <div class="perfil-section">
        <h5>Lista de alunos</h5>
        <div class="table-wrap"><table class="table" style="min-width:520px">
          <thead><tr><th>Aluno</th><th>Turma</th><th>Matrícula</th></tr></thead>
          <tbody>${alunos.map((a) => `<tr>
            <td>${esc(a.nome)}</td><td>${esc(DB.turma(a.turmaId)?.nome || '—')}</td><td>${esc(a.matricula)}</td>
          </tr>`).join('') || `<tr><td colspan="3" class="empty-state">Sem alunos vinculados.</td></tr>`}</tbody>
        </table></div>
      </div>`;
    UI.abrirModal('modalPerfilAluno');
  },

  excluir(id) {
    const p = DB.professor(id);
    if (!p) return;
    UI.confirmar(`Excluir o professor "${p.nome}"?`).then((ok) => {
      if (!ok) return;
      DB.data.professores = DB.data.professores.filter((x) => x.id !== id);
      DB.data.turmas.forEach((t) => { if (t.titular === id) t.titular = ''; });
      DB.save();
      this.render();
      Dashboard.render();
      UI.toast('Professor excluído.');
    });
  }
};

/* ---------------------------------------------------------
   15. PÁGINA: TURMAS
--------------------------------------------------------- */
const Turmas = {
  render() {
    const editar = Regras.podeEditar('turmas');
    $('#btnNovaTurma').classList.toggle('hidden', !editar);

    let lista = DB.data.turmas;
    const u = State.user;
    if ((u.perfil === 'aluno' || u.perfil === 'responsavel') && u.vinculo) {
      const al = DB.aluno(u.vinculo);
      lista = al ? lista.filter((t) => t.id === al.turmaId) : [];
    } else if (u.perfil === 'professor' && u.vinculo) {
      const p = DB.professor(u.vinculo);
      lista = p ? lista.filter((t) => p.turmas.includes(t.id)) : lista;
    }

    $('#turmasContagem').textContent = `${lista.length} turma${lista.length === 1 ? '' : 's'} ativa${lista.length === 1 ? '' : 's'}`;

    $('#turmasGrid').innerHTML = lista.length ? lista.map((t) => {
      const alunos = DB.data.alunos.filter((a) => a.turmaId === t.id);
      const titular = DB.professor(t.titular);
      const freq = alunos.length ? Math.round(mediaArr(alunos.map((a) => Regras.frequencia(a.id).pct))) : 0;
      return `<article class="turma-card">
        <div class="turma-top">
          <div><h3>${esc(t.nome)}</h3><span>${esc(t.serie)}</span></div>
          <span class="badge badge-green">${alunos.length} alunos</span>
        </div>
        <div class="turma-meta">
          <div>👩‍🏫 Titular: <b>${esc(titular ? titular.nome : 'Não definido')}</b></div>
          <div>🕐 Horário: <b>${esc(t.horario)}</b></div>
          <div>🚪 Sala: <b>${esc(t.sala || '—')}</b></div>
          <div>🗓️ Frequência média: <b>${freq}%</b></div>
        </div>
        <div class="turma-tags">${t.disciplinas.map((d) => `<span class="chip">${esc(d)}</span>`).join('')}</div>
        <div class="turma-foot">
          <div class="avatars">${alunos.slice(0, 5).map((a) => `<span class="avatar" title="${esc(a.nome)}">${iniciais(a.nome)}</span>`).join('')}
            ${alunos.length > 5 ? `<span class="avatar">+${alunos.length - 5}</span>` : ''}</div>
          ${editar ? `<div class="row-actions">
            <button class="mini-btn" data-acao="editar" data-tipo="turma" data-id="${t.id}">✏️</button>
            <button class="mini-btn danger" data-acao="excluir" data-tipo="turma" data-id="${t.id}">🗑</button>
          </div>` : ''}
        </div>
      </article>`;
    }).join('') : '<p class="empty-state">Nenhuma turma encontrada.</p>';
  },

  abrirFormulario(id) {
    $('#formTurma').reset();
    $('#formTurmaErro').textContent = '';
    $('#turmaId').value = '';
    $('#modalTurmaTitulo').textContent = 'Nova turma';

    $('#turmaTitular').innerHTML = '<option value="">Sem titular</option>' +
      DB.data.professores.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join('');

    const base = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Ed. Física', 'Artes', 'Informática'];
    $('#turmaDisciplinas').innerHTML = base.map((d) => `<label><input type="checkbox" value="${d}"> ${d}</label>`).join('');

    if (id) {
      const t = DB.turma(id);
      if (!t) return;
      $('#turmaId').value = t.id;
      $('#turmaNome').value = t.nome;
      $('#turmaSerie').value = t.serie;
      $('#turmaSala').value = t.sala;
      $('#turmaTitular').value = t.titular || '';
      $('#turmaHorario').value = t.horario;
      $$('#turmaDisciplinas input').forEach((c) => { c.checked = t.disciplinas.includes(c.value); });
      $('#modalTurmaTitulo').textContent = 'Editar turma';
    }
    UI.abrirModal('modalTurma');
  },

  salvar() {
    const nome = $('#turmaNome').value.trim();
    const serie = $('#turmaSerie').value.trim();
    const horario = $('#turmaHorario').value.trim();
    const discs = $$('#turmaDisciplinas input:checked').map((c) => c.value);

    UI.marcarInvalido($('#turmaNome'), nome.length < 2);
    UI.marcarInvalido($('#turmaSerie'), serie.length < 3);
    UI.marcarInvalido($('#turmaHorario'), horario.length < 3);

    let erro = '';
    if (nome.length < 2) erro = 'Informe o nome da turma.';
    else if (serie.length < 3) erro = 'Informe a série ou etapa.';
    else if (horario.length < 3) erro = 'Informe o horário.';
    if (erro) { $('#formTurmaErro').textContent = erro; return; }

    const id = $('#turmaId').value;
    const dados = {
      nome, serie, horario,
      sala: $('#turmaSala').value.trim(),
      titular: $('#turmaTitular').value,
      disciplinas: discs.length ? discs : ['Matemática', 'Português']
    };

    if (id) {
      Object.assign(DB.turma(id), dados);
      UI.toast('Turma atualizada.');
    } else {
      DB.data.turmas.push({ id: uid('t'), ...dados });
      UI.toast('Turma criada com sucesso.');
    }
    DB.save();
    UI.fecharModais();
    this.render();
    Dashboard.render();
    Notas.sincronizarSelects();
  },

  excluir(id) {
    const t = DB.turma(id);
    if (!t) return;
    const qtd = DB.data.alunos.filter((a) => a.turmaId === id).length;
    UI.confirmar(`Excluir a turma "${t.nome}"? ${qtd ? `Há ${qtd} aluno(s) nela — eles ficarão sem turma.` : ''}`).then((ok) => {
      if (!ok) return;
      DB.data.turmas = DB.data.turmas.filter((x) => x.id !== id);
      DB.save();
      this.render();
      Dashboard.render();
      UI.toast('Turma excluída.');
    });
  }
};

/* ---------------------------------------------------------
   16. PÁGINA: NOTAS
--------------------------------------------------------- */
const Notas = {
  render() {
    this.sincronizarSelects();
    this.listar();
    requestAnimationFrame(() => this.desenharGrafico());
  },

  sincronizarSelects() {
    const turmaSel = $('#notasTurma');
    const atual = turmaSel.value;
    Helpers.turmaOptions(turmaSel);
    if ([...turmaSel.options].some((o) => o.value === atual)) turmaSel.value = atual;
    else if (turmaSel.options.length) turmaSel.selectedIndex = 0;

    const soPropria = ['aluno', 'responsavel'].includes(State.user.perfil);
    turmaSel.disabled = soPropria;
    this.disciplinas();
  },

  disciplinas() {
    const t = DB.turma($('#notasTurma').value) || DB.data.turmas[0];
    const sel = $('#notasDisciplina');
    const atual = sel.value;
    sel.innerHTML = (t ? t.disciplinas : []).map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
    if ([...sel.options].some((o) => o.value === atual)) sel.value = atual;
  },

  listar() {
    const turma = DB.turma($('#notasTurma').value) || DB.data.turmas[0];
    if (!turma) { $('#notasTbody').innerHTML = Helpers.vazio(7, 'Nenhuma turma cadastrada.'); return; }
    const disciplina = $('#notasDisciplina').value || turma.disciplinas[0];
    const busca = ($('#notaBusca').value || '').toLowerCase().trim();
    const permitidos = new Set(alunosVisiveis().map((a) => a.id));
    const alunos = DB.data.alunos
      .filter((a) => a.turmaId === turma.id && permitidos.has(a.id))
      .filter((a) => !busca || a.nome.toLowerCase().includes(busca));

    const editavel = Regras.podeEditar('notas') && State.user.perfil !== 'aluno' && State.user.perfil !== 'responsavel';

    if (!alunos.length) {
      $('#notasTbody').innerHTML = Helpers.vazio(7, 'Nenhum aluno nesta turma.');
      $('#notasSituacao').textContent = '—';
      return;
    }

    let soma = 0;
    $('#notasTbody').innerHTML = alunos.map((a) => {
      const n = Regras.nota(a.id, disciplina);
      const m = Regras.media(n);
      soma += m;
      const inp = (bim) => `<input class="nota-input" style="width:72px;padding:7px 9px;border:1px solid var(--border);border-radius:8px;background:var(--surface);text-align:center"
        type="number" min="0" max="10" step="0.1" value="${n[bim] ?? ''}"
        data-aluno="${a.id}" data-bim="${bim}" ${editavel ? '' : 'disabled'} aria-label="Nota ${bim} de ${esc(a.nome)}">`;
      return `<tr>
        <td><div class="cell-user"><span class="avatar sm">${iniciais(a.nome)}</span>
          <div><strong>${esc(a.nome)}</strong><span>${esc(a.matricula)}</span></div></div></td>
        <td>${inp('b1')}</td><td>${inp('b2')}</td><td>${inp('b3')}</td><td>${inp('b4')}</td>
        <td><b class="media-celula">${m ? m.toFixed(1).replace('.', ',') : '—'}</b></td>
        <td class="situacao-celula">${m ? Helpers.badgeSituacao(m) : '—'}</td>
      </tr>`;
    }).join('');

    const geral = mediaArr(alunos.map((a) => Regras.media(Regras.nota(a.id, disciplina))));
    $('#notasSituacao').textContent = `Média da turma em ${disciplina}: ${geral.toFixed(1).replace('.', ',')}`;
  },

  atualizarNota(input) {
    const alunoId = input.dataset.aluno;
    const bim = input.dataset.bim;
    const disciplina = $('#notasDisciplina').value;
    let v = input.value === '' ? null : Number(input.value);
    if (v !== null) {
      if (Number.isNaN(v)) v = null;
      else v = clamp(v, 0, 10);
      input.value = v === null ? '' : String(v);
    }
    const n = Regras.nota(alunoId, disciplina);
    n[bim] = v;
    DB.save();

    const linha = input.closest('tr');
    const m = Regras.media(n);
    linha.querySelector('.media-celula').textContent = m ? m.toFixed(1).replace('.', ',') : '—';
    linha.querySelector('.situacao-celula').innerHTML = m ? Helpers.badgeSituacao(m) : '—';

    const turma = DB.turma($('#notasTurma').value);
    const geral = mediaArr(
      DB.data.alunos.filter((a) => a.turmaId === turma.id)
        .map((a) => Regras.media(Regras.nota(a.id, disciplina)))
    );
    $('#notasSituacao').textContent = `Média da turma em ${disciplina}: ${geral.toFixed(1).replace('.', ',')}`;
    this.desenharGrafico();
    Dashboard.render();
  },

  desenharGrafico() {
    const turma = DB.turma($('#notasTurma').value) || DB.data.turmas[0];
    if (!turma) return;
    const medias = turma.disciplinas.map((d) => {
      const als = DB.data.alunos.filter((a) => a.turmaId === turma.id);
      return Math.round(mediaArr(als.map((a) => Regras.media(Regras.nota(a.id, d)))) * 10) / 10;
    });
    Graficos.barras($('#chartNotas'), turma.disciplinas, medias, '#7c3aed', '#2563eb', 10);
  }
};

/* ---------------------------------------------------------
   17. PÁGINA: FREQUÊNCIA
--------------------------------------------------------- */
const Frequencia = {
  render() {
    Helpers.turmaOptions($('#freqTurma'));
    const soPropria = ['aluno', 'responsavel'].includes(State.user.perfil);
    $('#freqTurma').disabled = soPropria;
    $('#freqData').value = $('#freqData').value || hojeISO();
    $('#freqInicio').value = $('#freqInicio').value || isoSomaDias(hojeISO(), -30);
    $('#freqFim').value = $('#freqFim').value || hojeISO();

    const blocosEdicao = [$('#freqTodosPresentes'), $('#freqTodosAusentes'), $('#freqSalvar')];
    blocosEdicao.forEach((b) => b.classList.toggle('hidden', soPropria));

    this.carregarChamada();
    this.relatorio();
  },

  alunosDaTurma() {
    const permitidos = new Set(alunosVisiveis().map((a) => a.id));
    const turmaId = $('#freqTurma').value;
    return DB.data.alunos.filter((a) => a.turmaId === turmaId && permitidos.has(a.id));
  },

  registrosDoDia() {
    const data = $('#freqData').value || hojeISO();
    return DB.data.frequencia.filter((f) => f.data === data);
  },

  carregarChamada() {
    const data = $('#freqData').value || hojeISO();
    const registros = this.registrosDoDia();
    const alunos = this.alunosDaTurma();
    const editavel = !['aluno', 'responsavel'].includes(State.user.perfil);
    State.chamada = {};

    $('#freqLista').innerHTML = alunos.length ? alunos.map((a) => {
      const reg = registros.find((r) => r.alunoId === a.id);
      const presente = reg ? reg.presente : null;
      State.chamada[a.id] = presente;
      const classe = presente === false ? 'falta' : '';
      const situacao = presente === null ? '<span class="badge badge-amber">Não lançada</span>'
        : presente ? '<span class="badge badge-green">Presente</span>'
          : '<span class="badge badge-rose">Falta</span>';
      const toggle = editavel
        ? `<div class="call-toggle">
            <button class="toggle-btn ${presente === true ? 'on-p' : ''}" data-presenca="1" data-aluno="${a.id}">✓ Presente</button>
            <button class="toggle-btn ${presente === false ? 'on-f' : ''}" data-presenca="0" data-aluno="${a.id}">✗ Falta</button>
           </div>`
        : situacao;
      return `<li class="call-item ${classe}" data-aluno="${a.id}">
        <div class="cell-user">
          <span class="avatar sm">${iniciais(a.nome)}</span>
          <div><strong>${esc(a.nome)}</strong><span>${esc(a.matricula)} · ${esc(DB.turma(a.turmaId)?.nome || '')}</span></div>
        </div>
        ${toggle}
      </li>`;
    }).join('') : '<li class="empty-state">Nenhum aluno nesta turma.</li>';

    this.resumo();
  },

  definir(alunoId, presente) {
    State.chamada[alunoId] = presente;
    const li = $(`#freqLista .call-item[data-aluno="${alunoId}"]`);
    if (li) {
      li.classList.toggle('falta', presente === false);
      li.querySelectorAll('.toggle-btn').forEach((b) => {
        b.classList.remove('on-p', 'on-f');
        if (b.dataset.presenca === '1' && presente) b.classList.add('on-p');
        if (b.dataset.presenca === '0' && !presente) b.classList.add('on-f');
      });
    }
    this.resumo();
  },

  marcarTodos(presente) {
    Object.keys(State.chamada).forEach((id) => this.definir(id, presente));
  },

  resumo() {
    const vals = Object.values(State.chamada);
    const pres = vals.filter((v) => v === true).length;
    const falt = vals.filter((v) => v === false).length;
    const pend = vals.length - pres - falt;
    $('#freqResumo').textContent = `${pres} presentes · ${falt} faltas · ${pend} pendente(s)`;
  },

  salvar() {
    const data = $('#freqData').value || hojeISO();
    let pendentes = 0;
    Object.entries(State.chamada).forEach(([alunoId, presente]) => {
      if (presente === null || presente === undefined) { pendentes++; return; }
      const idx = DB.data.frequencia.findIndex((f) => f.alunoId === alunoId && f.data === data);
      if (idx >= 0) DB.data.frequencia[idx].presente = presente;
      else DB.data.frequencia.push({ alunoId, data, presente });
    });
    DB.save();
    this.carregarChamada();
    this.relatorio();
    Dashboard.render();
    UI.toast(pendentes ? `Chamada salva (${pendentes} pendente(s)).` : 'Chamada salva com sucesso.', pendentes ? 'info' : 'success');
  },

  relatorio() {
    const inicio = $('#freqInicio').value;
    const fim = $('#freqFim').value;
    const alunos = this.alunosDaTurma();
    const alertas = [];

    $('#freqRelatorioTbody').innerHTML = alunos.length ? alunos.map((a) => {
      const f = Regras.frequencia(a.id, inicio, fim);
      const sit = f.pct >= 90 ? ['Excelente', 'badge-green'] : f.pct >= 75 ? ['Regular', 'badge-amber'] : ['Baixa frequência', 'badge-rose'];
      if (f.pct < 75 && f.total > 0) alertas.push(`${a.nome} — ${f.pct}% de presença`);
      return `<tr>
        <td><div class="cell-user"><span class="avatar sm">${iniciais(a.nome)}</span><div><strong>${esc(a.nome)}</strong></div></div></td>
        <td>${esc(DB.turma(a.turmaId)?.nome || '—')}</td>
        <td>${f.pres}</td><td>${f.faltas}</td><td><b>${f.pct}%</b></td>
        <td><span class="badge ${sit[1]}">${sit[0]}</span></td>
      </tr>`;
    }).join('') : Helpers.vazio(6, 'Selecione uma turma com alunos.');

    const alerta = $('#freqAlerta');
    if (alertas.length && DB.data.prefs.alertas) {
      alerta.classList.remove('hidden');
      alerta.innerHTML = `<span>⚠️</span><div><b>${alertas.length} aluno(s) com frequência abaixo de 75% no período:</b>
        <ul>${alertas.slice(0, 6).map((x) => `<li>• ${esc(x)}</li>`).join('')}</ul></div>`;
    } else {
      alerta.classList.add('hidden');
      alerta.innerHTML = '';
    }
  }
};

/* ---------------------------------------------------------
   18. PÁGINA: AGENDA
--------------------------------------------------------- */
const Agenda = {
  render() {
    this.titulo();
    this.calendario();
    this.eventos();
  },

  titulo() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const d = State.calDate;
    $('#calTitulo').textContent = `${meses[d.getMonth()]} de ${d.getFullYear()}`;
  },

  calendario() {
    const d = State.calDate;
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const inicio = new Date(ano, mes, 1).getDay();
    const dias = new Date(ano, mes + 1, 0).getDate();
    const antDias = new Date(ano, mes, 0).getDate();
    const hoje = hojeISO();
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    let html = nomes.map((n) => `<div class="cal-head">${n}</div>`).join('');

    for (let i = inicio - 1; i >= 0; i--) {
      html += `<button class="cal-day muted" data-data="${isoSomaDias(`${ano}-${String(mes + 1).padStart(2, '0')}-01`, -(i + 1))}"><span class="cal-num">${antDias - i}</span></button>`;
    }
    for (let dia = 1; dia <= dias; dia++) {
      const iso = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const doDia = DB.data.eventos.filter((e) => e.data === iso).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
      const cls = [iso === hoje ? 'today' : '', State.calSelecionado === iso ? 'selected' : ''].join(' ');
      html += `<button class="cal-day ${cls}" data-data="${iso}" aria-label="${fmtData(iso)}">
        <span class="cal-num">${dia}</span>
        ${doDia.slice(0, 2).map((e) => `<span class="cal-event ${e.tipo}">${esc(e.titulo)}</span>`).join('')}
        ${doDia.length > 2 ? `<span class="cal-event">+${doDia.length - 2} mais</span>` : ''}
      </button>`;
    }
    const resto = 7 - ((inicio + dias) % 7 || 7);
    for (let i = 1; i <= resto; i++) {
      html += `<button class="cal-day muted" data-data="${isoSomaDias(`${ano}-${String(mes + 1).padStart(2, '0')}-${String(dias).padStart(2, '0')}`, i)}"><span class="cal-num">${i}</span></button>`;
    }
    $('#agendaCalendario').innerHTML = html;
  },

  eventos() {
    let lista;
    if (State.calSelecionado) {
      lista = DB.data.eventos.filter((e) => e.data === State.calSelecionado);
      $('#eventosTitulo').textContent = `Eventos de ${fmtData(State.calSelecionado)}`;
    } else {
      const d = State.calDate;
      const prefixo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      lista = DB.data.eventos.filter((e) => e.data.startsWith(prefixo));
      $('#eventosTitulo').textContent = 'Eventos do mês';
    }
    lista = [...lista].sort((a, b) => a.data.localeCompare(b.data));
    const editar = Regras.podeEditar('agenda');

    $('#eventosLista').innerHTML = lista.length ? lista.map((e) => `
      <li class="feed-item">
        <div class="feed-ico ${e.tipo === 'prova' ? 'purple' : e.tipo === 'reuniao' ? 'rose' : e.tipo === 'atividade' ? 'green' : 'blue'}">
          ${e.tipo === 'prova' ? '🧪' : e.tipo === 'reuniao' ? '👥' : e.tipo === 'atividade' ? '📄' : '🎉'}
        </div>
        <div class="feed-body">
          <strong>${esc(e.titulo)}</strong>
          <p>${fmtData(e.data)}${e.hora ? ` · ${esc(e.hora)}` : ''}</p>
          ${e.desc ? `<p>${esc(e.desc)}</p>` : ''}
        </div>
        ${editar ? `<div class="feed-actions">
          <button class="mini-btn" data-acao="editar" data-tipo="evento" data-id="${e.id}">✏️</button>
          <button class="mini-btn danger" data-acao="excluir" data-tipo="evento" data-id="${e.id}">🗑</button>
        </div>` : ''}
      </li>`).join('') : '<li class="empty-state">Nenhum evento neste período. Clique em “＋ Novo evento”.</li>';
  },

  navegar(delta) {
    State.calDate = new Date(State.calDate.getFullYear(), State.calDate.getMonth() + delta, 1);
    State.calSelecionado = null;
    this.render();
  },

  abrirFormulario(id, dataSugerida) {
    $('#formEvento').reset();
    $('#formEventoErro').textContent = '';
    $('#eventoId').value = '';
    $('#modalEventoTitulo').textContent = 'Novo evento';
    $('#eventoData').value = dataSugerida || State.calSelecionado || hojeISO();

    if (id) {
      const e = DB.data.eventos.find((x) => x.id === id);
      if (!e) return;
      $('#eventoId').value = e.id;
      $('#eventoTitulo').value = e.titulo;
      $('#eventoData').value = e.data;
      $('#eventoTipo').value = e.tipo;
      $('#eventoHora').value = e.hora || '';
      $('#eventoDesc').value = e.desc || '';
      $('#modalEventoTitulo').textContent = 'Editar evento';
    }
    UI.abrirModal('modalEvento');
  },

  salvar() {
    const titulo = $('#eventoTitulo').value.trim();
    const data = $('#eventoData').value;
    UI.marcarInvalido($('#eventoTitulo'), titulo.length < 3);
    UI.marcarInvalido($('#eventoData'), !data);
    if (titulo.length < 3 || !data) {
      $('#formEventoErro').textContent = 'Informe um título (mín. 3 letras) e uma data válida.';
      return;
    }
    const id = $('#eventoId').value;
    const dados = {
      titulo, data,
      tipo: $('#eventoTipo').value,
      hora: $('#eventoHora').value,
      desc: $('#eventoDesc').value.trim()
    };
    if (id) {
      Object.assign(DB.data.eventos.find((e) => e.id === id), dados);
      UI.toast('Evento atualizado.');
    } else {
      DB.data.eventos.push({ id: uid('ev'), ...dados });
      UI.toast('Evento criado com sucesso.');
    }
    DB.save();
    UI.fecharModais();
    const [y, m] = data.split('-').map(Number);
    State.calDate = new Date(y, m - 1, 1);
    this.render();
    Dashboard.render();
  },

  excluir(id) {
    const e = DB.data.eventos.find((x) => x.id === id);
    if (!e) return;
    UI.confirmar(`Excluir o evento "${e.titulo}"?`).then((ok) => {
      if (!ok) return;
      DB.data.eventos = DB.data.eventos.filter((x) => x.id !== id);
      DB.save();
      this.render();
      Dashboard.render();
      UI.toast('Evento excluído.');
    });
  }
};

/* ---------------------------------------------------------
   19. PÁGINA: COMUNICAÇÃO
--------------------------------------------------------- */
const Comunicacao = {
  render() {
    this.avisos();
    this.mensagens();
    Interface.renderNotificacoes();
  },

  podeGerenciarAviso(autor) {
    return State.user.perfil === 'administrador' || autor === State.user.email;
  },

  avisos() {
    const u = State.user;
    const lista = (DB.data.avisos || [])
      .filter((a) => a.destinatario === 'todos' || a.destinatario === u.perfil)
      .sort((a, b) => b.data - a.data);

    $('#btnNovoAviso').classList.toggle('hidden', !['administrador', 'professor'].includes(u.perfil));

    $('#avisosLista').innerHTML = lista.length ? lista.map((a) => `
      <li class="feed-item">
        <div class="feed-ico purple">📢</div>
        <div class="feed-body">
          <strong>${esc(a.titulo)}</strong>
          <p>${esc(a.texto)}</p>
          <time>${esc(a.autor)} · ${fmtDataHora(a.data)} · destinatário: ${esc(a.destinatario)}</time>
        </div>
        ${this.podeGerenciarAviso(a.autor) ? `<div class="feed-actions">
          <button class="mini-btn" data-acao="editar" data-tipo="aviso" data-id="${a.id}">✏️</button>
          <button class="mini-btn danger" data-acao="excluir" data-tipo="aviso" data-id="${a.id}">🗑</button>
        </div>` : ''}
      </li>`).join('') : '<li class="empty-state">Nenhum aviso disponível.</li>';
  },

  mensagens() {
    const u = State.user;
    const lista = (DB.data.mensagens || [])
      .filter((m) => m.de === u.email || m.para === u.email)
      .sort((a, b) => b.data - a.data);

    // marca como lidas as recebidas
    let mudou = false;
    DB.data.mensagens.forEach((m) => {
      if (m.para === u.email && !m.lida) { m.lida = true; mudou = true; }
    });
    if (mudou) { DB.save(); Interface.renderNotificacoes(); }

    $('#mensagensLista').innerHTML = lista.length ? lista.map((m) => {
      const recebida = m.para === u.email;
      return `<li class="feed-item">
        <div class="feed-ico ${recebida ? 'blue' : 'green'}">${recebida ? '📥' : '📤'}</div>
        <div class="feed-body">
          <strong>${esc(m.assunto)}</strong>
          <p>${esc(m.texto)}</p>
          <time>${recebida ? 'De' : 'Para'}: ${esc(recebida ? m.de : m.para)} · ${fmtDataHora(m.data)}</time>
        </div>
        <div class="feed-actions">
          <button class="mini-btn danger" data-acao="excluir" data-tipo="mensagem" data-id="${m.id}">🗑</button>
        </div>
      </li>`;
    }).join('') : '<li class="empty-state">Nenhuma mensagem. Clique em “＋ Nova mensagem”.</li>';
  },

  abrirAviso(id) {
    $('#formAviso').reset();
    $('#formAvisoErro').textContent = '';
    $('#avisoId').value = '';
    if (id) {
      const a = DB.data.avisos.find((x) => x.id === id);
      if (!a) return;
      $('#avisoId').value = a.id;
      $('#avisoTitulo').value = a.titulo;
      $('#avisoTexto').value = a.texto;
      $('#avisoDestinatario').value = a.destinatario;
    }
    UI.abrirModal('modalAviso');
  },

  salvarAviso() {
    const titulo = $('#avisoTitulo').value.trim();
    const texto = $('#avisoTexto').value.trim();
    UI.marcarInvalido($('#avisoTitulo'), titulo.length < 3);
    UI.marcarInvalido($('#avisoTexto'), texto.length < 5);
    if (titulo.length < 3 || texto.length < 5) {
      $('#formAvisoErro').textContent = 'Preencha o título e a mensagem corretamente.';
      return;
    }
    const id = $('#avisoId').value;
    const dados = { titulo, texto, destinatario: $('#avisoDestinatario').value };
    if (id) {
      Object.assign(DB.data.avisos.find((a) => a.id === id), dados);
      UI.toast('Aviso atualizado.');
    } else {
      DB.data.avisos.unshift({ id: uid('av'), ...dados, autor: State.user.email, data: Date.now() });
      UI.toast('Aviso publicado!');
    }
    DB.save();
    UI.fecharModais();
    this.render();
    Dashboard.avisos();
  },

  abrirMensagem() {
    $('#formMensagem').reset();
    $('#formMensagemErro').textContent = '';
    const u = State.user;
    const alvos = DB.data.usuarios.filter((x) => x.email !== u.email && x.status === 'ativo');
    $('#msgPara').innerHTML = alvos.length
      ? alvos.map((x) => `<option value="${esc(x.email)}">${esc(x.nome)} — ${ROTULO_PERFIL[x.perfil]}</option>`).join('')
      : '<option value="">Nenhum destinatário disponível</option>';
    UI.abrirModal('modalMensagem');
  },

  enviarMensagem() {
    const para = $('#msgPara').value;
    const assunto = $('#msgAssunto').value.trim();
    const texto = $('#msgTexto').value.trim();
    UI.marcarInvalido($('#msgAssunto'), assunto.length < 3);
    UI.marcarInvalido($('#msgTexto'), texto.length < 5);
    if (!para || assunto.length < 3 || texto.length < 5) {
      $('#formMensagemErro').textContent = 'Selecione o destinatário e preencha assunto e mensagem.';
      return;
    }
    DB.data.mensagens.unshift({ id: uid('ms'), de: State.user.email, para, assunto, texto, data: Date.now(), lida: false });
    DB.save();
    UI.fecharModais();
    this.render();
    UI.toast('Mensagem enviada com sucesso.');
  },

  excluir(tipo, id) {
    const mapa = {
      aviso: { lista: () => DB.data.avisos, filtro: (x) => x.id !== id, msg: 'Aviso excluído.' },
      mensagem: { lista: () => DB.data.mensagens, filtro: (x) => x.id !== id, msg: 'Mensagem excluída.' }
    }[tipo];
    if (!mapa) return;
    const registro = mapa.lista().find((x) => x.id === id);
    if (!registro) return;
    UI.confirmar('Excluir este registro?').then((ok) => {
      if (!ok) return;
      const prop = tipo === 'aviso' ? 'avisos' : 'mensagens';
      DB.data[prop] = DB.data[prop].filter(mapa.filtro);
      DB.save();
      this.render();
      Dashboard.avisos();
      UI.toast(mapa.msg);
    });
  }
};

/* ---------------------------------------------------------
   20. PÁGINA: RELATÓRIOS
--------------------------------------------------------- */
const Relatorios = {
  render() {
    Helpers.turmaOptions($('#relTurma'), true);
    const alunosOpts = alunosVisiveis().map((a) => `<option value="${a.id}">${esc(a.nome)}</option>`).join('');
    $('#relAluno').innerHTML = '<option value="">Todos os alunos</option>' + alunosOpts;
    $('#relInicio').value = $('#relInicio').value || isoSomaDias(hojeISO(), -60);
    $('#relFim').value = $('#relFim').value || hojeISO();
    this.ajustarCampos();
    if (!State.ultimoRelatorio) this.gerar();
  },

  ajustarCampos() {
    const tipo = $('#relTipo').value;
    $('#relAluno').parentElement.classList.toggle('hidden', tipo !== 'individual');
    $('#relTurma').parentElement.classList.toggle('hidden', tipo === 'individual');
    $('#relInicio').parentElement.classList.toggle('hidden', tipo === 'notas');
    $('#relFim').parentElement.classList.toggle('hidden', tipo === 'notas');
  },

  cabecalho(titulo) {
    const e = DB.data.escola;
    return `<div class="rel-head">
      <div>
        <h3>${esc(titulo)}</h3>
        <p>${esc(e.nome)} · Ano letivo ${esc(e.ano)}</p>
      </div>
      <div style="text-align:right">
        <p><b>Emitido em:</b> ${fmtData(hojeISO())}</p>
        <p><b>Responsável:</b> ${esc(State.user.nome)}</p>
      </div>
    </div>`;
  },

  montarTabela(headers, rows) {
    return `<div class="table-wrap"><table class="table">
      <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  },

  filtrarAlunos() {
    const turmaId = $('#relTurma').value;
    const permitidos = new Set(alunosVisiveis().map((a) => a.id));
    return DB.data.alunos.filter((a) => permitidos.has(a.id) && (!turmaId || a.turmaId === turmaId));
  },

  gerar() {
    const tipo = $('#relTipo').value;
    const inicio = $('#relInicio').value;
    const fim = $('#relFim').value;
    let titulo = '';
    let headers = [];
    let rows = [];

    if (tipo === 'notas') {
      titulo = 'Relatório de notas';
      const turmaFiltro = $('#relTurma').value;
      const alunos = this.filtrarAlunos();

      if (turmaFiltro) {
        const t = DB.turma(turmaFiltro);
        headers = ['Aluno', ...t.disciplinas, 'Média geral', 'Situação'];
        rows = alunos.map((a) => {
          const geral = Regras.mediaAluno(a.id, t);
          return [`<b>${esc(a.nome)}</b>`,
            ...t.disciplinas.map((d) => {
              const m = Regras.media(Regras.nota(a.id, d));
              return m ? m.toFixed(1).replace('.', ',') : '—';
            }),
            `<b>${geral.toFixed(1).replace('.', ',')}</b>`, Helpers.badgeSituacao(geral)];
        });
      } else {
        headers = ['Aluno', 'Turma', 'Disciplinas avaliadas', 'Média geral', 'Situação'];
        rows = alunos.map((a) => {
          const t = DB.turma(a.turmaId);
          const geral = Regras.mediaAluno(a.id, t);
          return [`<b>${esc(a.nome)}</b>`, esc(t ? t.nome : '—'), String(t ? t.disciplinas.length : 0),
            `<b>${geral.toFixed(1).replace('.', ',')}</b>`, Helpers.badgeSituacao(geral)];
        });
      }
    }

    if (tipo === 'frequencia') {
      titulo = `Relatório de frequência (${fmtData(inicio)} a ${fmtData(fim)})`;
      headers = ['Aluno', 'Turma', 'Dias letivos', 'Presenças', 'Faltas', '%', 'Situação'];
      rows = this.filtrarAlunos().map((a) => {
        const f = Regras.frequencia(a.id, inicio, fim);
        const sit = f.pct >= 90 ? ['Excelente', 'badge-green'] : f.pct >= 75 ? ['Regular', 'badge-amber'] : ['Baixa frequência', 'badge-rose'];
        return [`<b>${esc(a.nome)}</b>`, esc(DB.turma(a.turmaId)?.nome || '—'), String(f.total), String(f.pres),
          String(f.faltas), `<b>${f.pct}%</b>`, `<span class="badge ${sit[1]}">${sit[0]}</span>`];
      });
    }

    if (tipo === 'turma') {
      titulo = 'Desempenho por turma';
      headers = ['Turma', 'Titular', 'Alunos', 'Média de notas', 'Frequência média', 'Aprovados', 'Recuperação', 'Reprovados'];
      rows = DB.data.turmas.map((t) => {
        const als = DB.data.alunos.filter((a) => a.turmaId === t.id);
        const medias = als.map((a) => Regras.mediaAluno(a.id, t));
        const freqs = als.map((a) => Regras.frequencia(a.id, inicio, fim).pct);
        const ap = medias.filter((m) => m >= 7).length;
        const rc = medias.filter((m) => m >= 5 && m < 7).length;
        const rp = medias.filter((m) => m < 5).length;
        const titular = DB.professor(t.titular);
        return [`<b>${esc(t.nome)}</b>`, esc(titular ? titular.nome : '—'), String(als.length),
          `<b>${mediaArr(medias).toFixed(1).replace('.', ',')}</b>`,
          `<b>${Math.round(mediaArr(freqs))}%</b>`, String(ap), String(rc), String(rp)];
      });
    }

    if (tipo === 'individual') {
      const id = $('#relAluno').value;
      if (!id) {
        State.ultimoRelatorio = null;
        $('#relResultado').innerHTML = '<p class="muted">Selecione um aluno na lista para gerar o desempenho individual.</p>';
        UI.toast('Selecione um aluno para o desempenho individual.', 'error');
        return;
      }
      const a = DB.aluno(id);
      const t = DB.turma(a.turmaId);
      const f = Regras.frequencia(a.id, inicio, fim);
      const geral = Regras.mediaAluno(a.id, t);
      titulo = `Desempenho individual — ${a.nome}`;

      const dados = `<div class="perfil-grid">
        <div class="perfil-info"><span>Matrícula</span><strong>${esc(a.matricula)}</strong></div>
        <div class="perfil-info"><span>Turma</span><strong>${esc(t ? t.nome : '—')}</strong></div>
        <div class="perfil-info"><span>Responsável</span><strong>${esc(a.responsavel)}</strong></div>
        <div class="perfil-info"><span>Frequência</span><strong>${f.pct}%</strong></div>
        <div class="perfil-info"><span>Presenças / Faltas</span><strong>${f.pres} / ${f.faltas}</strong></div>
        <div class="perfil-info"><span>Média geral</span><strong>${geral.toFixed(1).replace('.', ',')}</strong></div>
      </div>`;

      headers = ['Disciplina', '1º Bim', '2º Bim', '3º Bim', '4º Bim', 'Média', 'Situação'];
      rows = (t ? t.disciplinas : []).map((d) => {
        const n = Regras.nota(a.id, d);
        const m = Regras.media(n);
        return [`<b>${esc(d)}</b>`, n.b1 ?? '—', n.b2 ?? '—', n.b3 ?? '—', n.b4 ?? '—',
          `<b>${m ? m.toFixed(1).replace('.', ',') : '—'}</b>`, m ? Helpers.badgeSituacao(m) : '—'];
      });

      $('#relResultado').innerHTML = this.cabecalho(titulo) + dados + this.montarTabela(headers, rows);
      State.ultimoRelatorio = { titulo, headers, rows: rows.map((r) => r.map((c) => String(c).replace(/<[^>]*>/g, ''))) };
      UI.toast('Relatório gerado.');
      return;
    }

    if (!rows.length) rows = [['—', 'Nenhum dado encontrado.']];
    $('#relResultado').innerHTML = this.cabecalho(titulo) + this.montarTabela(headers, rows);
    State.ultimoRelatorio = { titulo, headers, rows: rows.map((r) => r.map((c) => String(c).replace(/<[^>]*>/g, ''))) };
    UI.toast('Relatório gerado.');
  },

  imprimir() {
    if (!State.ultimoRelatorio) this.gerar();
    setTimeout(() => window.print(), 120);
  },

  exportar() {
    if (!State.ultimoRelatorio) { UI.toast('Gere um relatório antes de exportar.', 'error'); return; }
    const { titulo, headers, rows } = State.ultimoRelatorio;
    const csv = [headers, ...rows]
      .map((linha) => linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo.replace(/[^\wÀ-ÿ ]/g, '').replace(/\s+/g, '_').toLowerCase()}_${hojeISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    UI.toast('Relatório exportado em CSV.');
  }
};

/* ---------------------------------------------------------
   21. PÁGINA: CONFIGURAÇÕES
--------------------------------------------------------- */
const Configuracoes = {
  render() {
    const e = DB.data.escola;
    $('#cfgNome').value = e.nome;
    $('#cfgAno').value = e.ano;
    $('#cfgEndereco').value = e.endereco;
    $('#cfgTelefone').value = e.telefone;
    $('#cfgEmail').value = e.email;

    $('#prefTema').checked = DB.data.prefs.tema === 'dark';
    $('#prefSidebar').checked = !!DB.data.prefs.sidebar;
    $('#prefAlertas').checked = !!DB.data.prefs.alertas;
    $('#cfgInicio').value = DB.data.prefs.inicio || 'dashboard';

    this.usuarios();
    this.permissoes();
  },

  salvarEscola() {
    const nome = $('#cfgNome').value.trim();
    const email = $('#cfgEmail').value.trim();
    UI.marcarInvalido($('#cfgNome'), nome.length < 3);
    UI.marcarInvalido($('#cfgEmail'), email && !ehEmail(email));
    if (nome.length < 3) { UI.toast('Informe um nome válido para a escola.', 'error'); return; }
    if (email && !ehEmail(email)) { UI.toast('E-mail inválido.', 'error'); return; }

    DB.data.escola = {
      nome,
      ano: $('#cfgAno').value.trim(),
      endereco: $('#cfgEndereco').value.trim(),
      telefone: $('#cfgTelefone').value.trim(),
      email
    };
    DB.save();
    $('#brandSchool').textContent = nome;
    UI.toast('Dados da escola salvos.');
  },

  salvarPrefs() {
    DB.data.prefs.tema = $('#prefTema').checked ? 'dark' : 'light';
    DB.data.prefs.sidebar = $('#prefSidebar').checked;
    DB.data.prefs.alertas = $('#prefAlertas').checked;
    DB.data.prefs.inicio = $('#cfgInicio').value;
    DB.save();
    Interface.aplicarTema(DB.data.prefs.tema);
    $('#app').classList.toggle('sidebar-collapsed', DB.data.prefs.sidebar);
    UI.toast('Preferências salvas.');
  },

  usuarios() {
    $('#usuariosTbody').innerHTML = DB.data.usuarios.length ? DB.data.usuarios.map((u) => `
      <tr>
        <td><div class="cell-user"><span class="avatar sm">${iniciais(u.nome)}</span><div><strong>${esc(u.nome)}</strong></div></div></td>
        <td>${esc(u.email)}</td>
        <td><span class="badge badge-purple">${ROTULO_PERFIL[u.perfil] || esc(u.perfil)}</span></td>
        <td><span class="badge ${u.status === 'ativo' ? 'badge-green' : 'badge-rose'}">${u.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
        <td><div class="row-actions">
          <button class="mini-btn" data-acao="editar" data-tipo="usuario" data-id="${u.id}">✏️</button>
          <button class="mini-btn danger" data-acao="excluir" data-tipo="usuario" data-id="${u.id}">🗑</button>
        </div></td>
      </tr>`).join('') : Helpers.vazio(5, 'Nenhum usuário cadastrado.');
  },

  abrirUsuario(id) {
    $('#formUsuario').reset();
    $('#formUsuarioErro').textContent = '';
    $('#usuarioId').value = '';
    $('#usuarioSenha').required = !id;
    if (id) {
      const u = DB.data.usuarios.find((x) => x.id === id);
      if (!u) return;
      $('#usuarioId').value = u.id;
      $('#usuarioNome').value = u.nome;
      $('#usuarioEmail').value = u.email;
      $('#usuarioPerfil').value = u.perfil;
      $('#usuarioStatus').value = u.status;
      $('#usuarioSenha').placeholder = 'Deixe em branco para manter';
    } else {
      $('#usuarioSenha').placeholder = '';
    }
    UI.abrirModal('modalUsuario');
  },

  salvarUsuario() {
    const id = $('#usuarioId').value;
    const nome = $('#usuarioNome').value.trim();
    const email = $('#usuarioEmail').value.trim();
    const senha = $('#usuarioSenha').value;
    const perfil = $('#usuarioPerfil').value;
    const status = $('#usuarioStatus').value;

    UI.marcarInvalido($('#usuarioNome'), nome.length < 3);
    UI.marcarInvalido($('#usuarioEmail'), !ehEmail(email));
    UI.marcarInvalido($('#usuarioSenha'), !id && senha.length < 6);

    if (nome.length < 3) { $('#formUsuarioErro').textContent = 'Informe o nome.'; return; }
    if (!ehEmail(email)) { $('#formUsuarioErro').textContent = 'E-mail inválido.'; return; }
    if (!id && senha.length < 6) { $('#formUsuarioErro').textContent = 'A senha deve ter ao menos 6 caracteres.'; return; }

    const emailDuplicado = DB.data.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
    if (emailDuplicado) { $('#formUsuarioErro').textContent = 'Este e-mail já está em uso.'; return; }

    if (id) {
      const u = DB.data.usuarios.find((x) => x.id === id);
      u.nome = nome; u.email = email; u.perfil = perfil; u.status = status;
      if (senha.length >= 6) u.senha = senha;
      if (State.user.id === u.id) State.user = u;
      UI.toast('Usuário atualizado.');
    } else {
      DB.data.usuarios.push({ id: uid('u'), nome, email, senha, perfil, status, vinculo: null });
      UI.toast('Usuário criado com sucesso.');
    }
    DB.save();
    UI.fecharModais();
    this.usuarios();
  },

  excluirUsuario(id) {
    const u = DB.data.usuarios.find((x) => x.id === id);
    if (!u) return;
    if (State.user.id === id) { UI.toast('Você não pode excluir o próprio usuário.', 'error'); return; }
    UI.confirmar(`Excluir o usuário "${u.nome}"?`).then((ok) => {
      if (!ok) return;
      DB.data.usuarios = DB.data.usuarios.filter((x) => x.id !== id);
      DB.save();
      this.usuarios();
      UI.toast('Usuário excluído.');
    });
  },

  permissoes() {
    $('#permissoesWrap').innerHTML = PERFIS.map((perfil) => `
      <div class="perm-card">
        <h4>${ROTULO_PERFIL[perfil]}</h4>
        ${Object.keys(PAGINAS).map((p) => `
          <label>
            <input type="checkbox" value="${p}" data-perfil="${perfil}"
              ${DB.data.permissoes[perfil].includes(p) ? 'checked' : ''}>
            ${PAGINAS[p].titulo}
          </label>`).join('')}
      </div>`).join('');
  },

  salvarPermissoes() {
    const novas = {};
    PERFIS.forEach((perfil) => {
      novas[perfil] = $$(`#permissoesWrap input[data-perfil="${perfil}"]:checked`).map((c) => c.value);
    });
    if (!novas.administrador.includes('dashboard')) novas.administrador.push('dashboard');
    if (!Object.values(novas).some((l) => l.length)) { UI.toast('Mantenha ao menos uma página liberada.', 'error'); return; }
    DB.data.permissoes = novas;
    DB.save();
    Auth.aplicarPermissoes();
    if (!Regras.pode(State.page)) Navegacao.ir('dashboard');
    UI.toast('Permissões salvas.');
  }
};

/* ---------------------------------------------------------
   22. MAPA DE RENDERIZAÇÃO
--------------------------------------------------------- */
const Render = {
  dashboard: () => Dashboard.render(),
  alunos: () => Alunos.render(),
  professores: () => Professores.render(),
  turmas: () => Turmas.render(),
  notas: () => Notas.render(),
  frequencia: () => Frequencia.render(),
  agenda: () => Agenda.render(),
  comunicacao: () => Comunicacao.render(),
  relatorios: () => Relatorios.render(),
  configuracoes: () => Configuracoes.render()
};

/* ---------------------------------------------------------
   23. EVENTOS GLOBAIS
--------------------------------------------------------- */
function registrarEventos() {

  /* ---------- Login ---------- */
  $('#loginForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const email = $('#loginEmail').value.trim();
    const senha = $('#loginSenha').value;
    let erro = '';

    UI.marcarInvalido($('#loginEmail'), !ehEmail(email));
    UI.marcarInvalido($('#loginSenha'), senha.length < 4);
    $('#loginEmailError').textContent = ehEmail(email) ? '' : 'Informe um e-mail válido.';
    $('#loginSenhaError').textContent = senha.length >= 4 ? '' : 'Informe sua senha.';

    if (!ehEmail(email)) erro = 'E-mail inválido.';
    else if (senha.length < 4) erro = 'Senha muito curta.';
    if (erro) return;

    const r = Auth.entrar(email, senha);
    if (!r.ok) {
      $('#loginSenhaError').textContent = r.msg;
      UI.marcarInvalido($('#loginSenha'), true);
      UI.toast(r.msg, 'error');
      return;
    }
    Auth.entrarNoApp(r.user, $('#lembrarMe').checked);
  });

  $('#toggleSenha').addEventListener('click', () => {
    const input = $('#loginSenha');
    const visivel = input.type === 'text';
    input.type = visivel ? 'password' : 'text';
    $('#toggleSenha').textContent = visivel ? '👁' : '🙈';
    $('#toggleSenha').setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');
  });

  $$('.demo-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $('#loginEmail').value = chip.dataset.email;
      $('#loginSenha').value = '123456';
      $('#loginEmailError').textContent = '';
      $('#loginSenhaError').textContent = '';
      UI.marcarInvalido($('#loginEmail'), false);
      UI.marcarInvalido($('#loginSenha'), false);
      UI.toast(`Perfil ${chip.textContent} preenchido — clique em Entrar.`, 'info');
    });
  });

  $('#btnEsqueciSenha').addEventListener('click', () => {
    $('#formRecuperar').reset();
    $('#formRecuperarErro').textContent = '';
    UI.abrirModal('modalRecuperar');
  });

  $('#formRecuperar').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const email = $('#recuperarEmail').value.trim();
    if (!ehEmail(email)) { $('#formRecuperarErro').textContent = 'Informe um e-mail válido.'; return; }
    const existe = DB.data.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existe) { $('#formRecuperarErro').textContent = 'Nenhum usuário com este e-mail.'; return; }
    UI.fecharModais();
    UI.toast('Link de recuperação enviado para o seu e-mail.');
  });

  /* ---------- Navegação ---------- */
  $('#sidebarNav').addEventListener('click', (ev) => {
    const item = ev.target.closest('.nav-item');
    if (item) Navegacao.ir(item.dataset.page);
  });

  $('#btnSidebar').addEventListener('click', () => Interface.alternarSidebar());
  $('#sidebarOverlay').addEventListener('click', () => Interface.fecharSidebarMobile());
  $('#btnTema').addEventListener('click', () => Interface.alternarTema());
  $('#btnSair').addEventListener('click', () => Auth.sair());

  $('#btnUserMenu').addEventListener('click', (ev) => {
    ev.stopPropagation();
    const dd = $('#userDropdown');
    const abrir = !dd.classList.contains('open');
    Interface.fecharDropdowns();
    dd.classList.toggle('open', abrir);
    $('#btnUserMenu').setAttribute('aria-expanded', String(abrir));
  });

  $('#btnNotificacoes').addEventListener('click', (ev) => {
    ev.stopPropagation();
    const dd = $('#notifDropdown');
    const abrir = !dd.classList.contains('open');
    Interface.fecharDropdowns();
    dd.classList.toggle('open', abrir);
    if (abrir) Interface.renderNotificacoes();
  });

  $('#userDropdown').addEventListener('click', (ev) => {
    const alvo = ev.target.closest('[data-page]');
    if (alvo) Navegacao.ir(alvo.dataset.page);
  });

  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('.user-menu') && !ev.target.closest('#notifDropdown') && !ev.target.closest('#btnNotificacoes')) {
      Interface.fecharDropdowns();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { UI.fecharModais(); Interface.fecharDropdowns(); }
  });

  /* ---------- Modais (fechar) ---------- */
  $$('.modal').forEach((modal) => {
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal || ev.target.closest('.modal-close')) modal.classList.remove('open');
    });
  });

  /* ---------- Alunos ---------- */
  $('#btnNovoAluno').addEventListener('click', () => Alunos.abrirFormulario());
  $('#formAluno').addEventListener('submit', (ev) => { ev.preventDefault(); Alunos.salvar(); });
  $('#alunoBusca').addEventListener('input', () => Alunos.listar());
  $('#alunoFiltroTurma').addEventListener('change', () => Alunos.listar());

  /* ---------- Professores ---------- */
  $('#btnNovoProfessor').addEventListener('click', () => Professores.abrirFormulario());
  $('#formProfessor').addEventListener('submit', (ev) => { ev.preventDefault(); Professores.salvar(); });

  /* ---------- Turmas ---------- */
  $('#btnNovaTurma').addEventListener('click', () => Turmas.abrirFormulario());
  $('#formTurma').addEventListener('submit', (ev) => { ev.preventDefault(); Turmas.salvar(); });

  /* ---------- Notas ---------- */
  $('#notasTurma').addEventListener('change', () => { Notas.disciplinas(); Notas.listar(); Notas.desenharGrafico(); });
  $('#notasDisciplina').addEventListener('change', () => { Notas.listar(); Notas.desenharGrafico(); });
  $('#notaBusca').addEventListener('input', () => Notas.listar());
  $('#notasTbody').addEventListener('change', (ev) => {
    if (ev.target.classList.contains('nota-input')) Notas.atualizarNota(ev.target);
  });
  $('#notasTbody').addEventListener('blur', (ev) => {
    if (ev.target.classList.contains('nota-input')) Notas.atualizarNota(ev.target);
  }, true);

  /* ---------- Frequência ---------- */
  $('#freqTurma').addEventListener('change', () => { Frequencia.carregarChamada(); Frequencia.relatorio(); });
  $('#freqData').addEventListener('change', () => Frequencia.carregarChamada());
  $('#freqLista').addEventListener('click', (ev) => {
    const btn = ev.target.closest('.toggle-btn');
    if (btn) Frequencia.definir(btn.dataset.aluno, btn.dataset.presenca === '1');
  });
  $('#freqTodosPresentes').addEventListener('click', () => Frequencia.marcarTodos(true));
  $('#freqTodosAusentes').addEventListener('click', () => Frequencia.marcarTodos(false));
  $('#freqSalvar').addEventListener('click', () => Frequencia.salvar());
  $('#freqGerar').addEventListener('click', () => Frequencia.relatorio());

  /* ---------- Agenda ---------- */
  $('#calAnterior').addEventListener('click', () => Agenda.navegar(-1));
  $('#calProximo').addEventListener('click', () => Agenda.navegar(1));
  $('#calHoje').addEventListener('click', () => {
    const h = new Date();
    State.calDate = new Date(h.getFullYear(), h.getMonth(), 1);
    State.calSelecionado = hojeISO();
    Agenda.render();
  });
  $('#btnNovoEvento').addEventListener('click', () => Agenda.abrirFormulario());
  $('#agendaCalendario').addEventListener('click', (ev) => {
    const dia = ev.target.closest('.cal-day');
    if (!dia) return;
    const iso = dia.dataset.data;
    State.calSelecionado = State.calSelecionado === iso ? null : iso;
    if (iso) {
      const [y, m] = iso.split('-').map(Number);
      if (y !== State.calDate.getFullYear() || m - 1 !== State.calDate.getMonth()) {
        State.calDate = new Date(y, m - 1, 1);
      }
    }
    Agenda.render();
  });
  $('#agendaCalendario').addEventListener('dblclick', (ev) => {
    const dia = ev.target.closest('.cal-day');
    if (dia && Regras.podeEditar('agenda')) Agenda.abrirFormulario(null, dia.dataset.data);
  });
  $('#formEvento').addEventListener('submit', (ev) => { ev.preventDefault(); Agenda.salvar(); });

  /* ---------- Comunicação ---------- */
  $('#btnNovoAviso').addEventListener('click', () => Comunicacao.abrirAviso());
  $('#formAviso').addEventListener('submit', (ev) => { ev.preventDefault(); Comunicacao.salvarAviso(); });
  $('#btnNovaMensagem').addEventListener('click', () => Comunicacao.abrirMensagem());
  $('#formMensagem').addEventListener('submit', (ev) => { ev.preventDefault(); Comunicacao.enviarMensagem(); });

  /* ---------- Relatórios ---------- */
  $('#relTipo').addEventListener('change', () => { Relatorios.ajustarCampos(); });
  $('#relGerar').addEventListener('click', () => Relatorios.gerar());
  $('#relImprimir').addEventListener('click', () => Relatorios.imprimir());
  $('#relExportar').addEventListener('click', () => Relatorios.exportar());

  /* ---------- Configurações ---------- */
  $('#formEscola').addEventListener('submit', (ev) => { ev.preventDefault(); Configuracoes.salvarEscola(); });
  $('#btnSalvarPrefs').addEventListener('click', () => Configuracoes.salvarPrefs());
  $('#prefTema').addEventListener('change', () => Interface.aplicarTema($('#prefTema').checked ? 'dark' : 'light'));
  $('#btnNovoUsuario').addEventListener('click', () => Configuracoes.abrirUsuario());
  $('#formUsuario').addEventListener('submit', (ev) => { ev.preventDefault(); Configuracoes.salvarUsuario(); });
  $('#btnSalvarPermissoes').addEventListener('click', () => Configuracoes.salvarPermissoes());

  /* ---------- Ações em tabelas/listas (delegação global) ---------- */
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-acao]');
    if (!btn) return;
    const { acao, tipo, id } = btn.dataset;

    if (acao === 'ver') {
      if (tipo === 'aluno') Alunos.verPerfil(id);
      if (tipo === 'professor') Professores.verPerfil(id);
      return;
    }

    if (acao === 'editar') {
      if (tipo === 'aluno') Alunos.abrirFormulario(id);
      if (tipo === 'professor') Professores.abrirFormulario(id);
      if (tipo === 'turma') Turmas.abrirFormulario(id);
      if (tipo === 'evento') Agenda.abrirFormulario(id);
      if (tipo === 'aviso') Comunicacao.abrirAviso(id);
      if (tipo === 'usuario') Configuracoes.abrirUsuario(id);
      return;
    }

    if (acao === 'excluir') {
      if (tipo === 'aluno') Alunos.excluir(id);
      if (tipo === 'professor') Professores.excluir(id);
      if (tipo === 'turma') Turmas.excluir(id);
      if (tipo === 'evento') Agenda.excluir(id);
      if (tipo === 'usuario') Configuracoes.excluirUsuario(id);
      if (tipo === 'aviso' || tipo === 'mensagem') Comunicacao.excluir(tipo, id);
    }
  });

  /* ---------- Redimensionamento ---------- */
  let tempo;
  window.addEventListener('resize', () => {
    clearTimeout(tempo);
    tempo = setTimeout(() => Graficos.redesenharVisiveis(), 220);
  });
}

/* ---------------------------------------------------------
   24. INICIALIZAÇÃO
--------------------------------------------------------- */
(function iniciar() {
  DB.init();
  registrarEventos();

  // Tema e preferências iniciais
  Interface.aplicarTema(DB.data.prefs.tema || 'light');
  if (DB.data.prefs.sidebar) $('#app').classList.add('sidebar-collapsed');

  // Restaura sessão (lembrar-me / sessão atual)
  const usuario = Auth.restaurar();
  if (usuario) Auth.entrarNoApp(usuario, false);
  else $('#loginScreen').classList.remove('hidden');
})();