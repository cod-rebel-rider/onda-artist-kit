/* ==========================================================================
   Onda Artist Kit — Issue #4: fallback da agenda em file://

   Testes do fluxo da agenda (src/js/agenda.js) e do orquestrador de fontes
   (src/js/data.js):

   - fonte indisponível (fetch bloqueado em file://) → preserva o conteúdo
     estático de demonstração do HTML (não limpa containers, não oculta e
     não exibe "agenda vazia");
   - fonte carregada com eventos → renderização normal;
   - fonte carregada sem eventos → estado vazio apropriado (e os eventos
     estáticos são substituídos);
   - fallback externo do Google Calendar continua funcionando.

   Mesmo padrão da suíte da Issue #3: Node.js puro, sem dependências, sem
   build. Carrega as IIFEs reais do Core com um DOM mínimo.

   Como executar (raiz do repositório):
       node test/agenda-file-fallback.test.cjs
   ========================================================================== */

"use strict";

/* Silencia os warnings esperados da aplicação (falha/fallback) para manter
   a saída da suíte focada nos resultados. */
console.warn = () => {};

const { join } = require("node:path");

const AGENDA_PATH = join(__dirname, "..", "src", "js", "agenda.js");
const DATA_PATH = join(__dirname, "..", "src", "js", "data.js");

/* Ambiente mínimo tipo-navegador para executar as IIFEs do Core no Node. */
global.window = {};
global.document = { addEventListener() {} };

require("../src/js/content.js");
require("../src/js/shows.js");
require("../src/components/show-card.js");

/* --------------------------------------------------------------------------
   Mini DOM: contêineres com estado (innerHTML/hidden) para verificar o
   comportamento da página sem um navegador.
   -------------------------------------------------------------------------- */

const makeElement = (html = "", initialHidden = false) => ({
  hidden: initialHidden,
  textContent: "",
  innerHTML: html,
  classList: { toggle() {} }
});

/* Recarrega agenda.js com o mock de getAgenda e um HTML inicial estático.
   Preenche os mesmos seletores usados por agenda.html/agenda.js, com o
   estado inicial real da página: mensagem de vazio, status e indicador
   começam ocultos; containers e seção de anteriores começam visíveis. */
async function runAgenda({ getAgenda, initial = {} }) {
  const store = new Map();
  const getEl = (key, html = "", initialHidden = false) => {
    if (!store.has(key)) {
      store.set(key, makeElement(html, initialHidden));
    }
    return store.get(key);
  };

  global.document = {
    querySelector: (selector) => getEl(selector),
    getElementById: (id) => getEl(`#${id}`),
    addEventListener() {}
  };

  getEl("[data-upcoming]", initial.upcoming ?? '<article class="card show-card">Show estático</article>', false);
  getEl("[data-past]", initial.past ?? '<article class="card show-card">Histórico estático</article>', false);
  const empty = getEl("[data-empty-upcoming]", "", true);
  const pastSection = getEl("#anteriores", "", false);
  const status = getEl("[data-agenda-status]", "", true);
  const indicator = getEl("[data-google-indicator]", "", true);

  window.OndaData = { getAgenda };
  delete require.cache[require.resolve(AGENDA_PATH)];
  require(AGENDA_PATH);

  /* aguarda o hydrate() (assíncrono) concluir. */
  await new Promise((resolve) => setTimeout(resolve, 10));

  return {
    up: store.get("[data-upcoming]"),
    past: store.get("[data-past]"),
    empty,
    pastSection,
    status,
    indicator,
    store
  };
}

/* Carrega data.js (orquestrador) com as fontes mockadas. */
async function loadDataEnv({ loadJSON, localLoad, googleLoad }) {
  window.OndaShows.setAll = () => {};
  window.OndaContent.loadJSON = loadJSON;
  window.OndaSourceLocal = { load: localLoad };
  window.OndaSourceGoogleCalendar = { load: googleLoad };
  delete require.cache[require.resolve(DATA_PATH)];
  require(DATA_PATH);
  return window.OndaData;
}
/* --------------------------------------------------------------------------
   Eventos no formato comum do Core (datas relativas para nunca envelhecer).
   -------------------------------------------------------------------------- */
const pad2 = (n) => String(n).padStart(2, "0");
const dateOffset = (days) => {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const upcomingShow = () => ({
  id: "show-001",
  title: "Festival Noite Alta",
  date: dateOffset(30),
  startTime: "20:00",
  endTime: "21:00",
  venue: "Centro Cultural Vilanova",
  city: "Brasília",
  state: "DF",
  country: "BR",
  description: "Evento de teste.",
  mapUrl: "",
  ticketUrl: "https://sympla.example/",
  status: "confirmed"
});

const pastShow = () => ({
  id: "show-005",
  title: "Centro Cultural Marta",
  date: dateOffset(-45),
  startTime: "19:30",
  venue: "Centro Cultural Marta",
  city: "São Paulo",
  state: "SP",
  country: "BR",
  status: "confirmed"
});

/* --------------------------------------------------------------------------
   Mini harness de testes (zero dependências) e assertivas.
   -------------------------------------------------------------------------- */
const tests = [];
let passed = 0;
const failures = [];

const test = (name, fn) => tests.push({ name, fn });

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || "assertiva falhou");
  }
};

/* --------------------------------------------------------------------------
   Cenário 1 — fonte indisponível (fetch bloqueado em file://).
   Esperado: conteúdo estático preservado, containers visíveis, estado
   vazio NÃO exibido.
   -------------------------------------------------------------------------- */
test("Cenário 1 - fonte falhou: preserva estáticos, containers visíveis, sem estado vazio", async () => {
  const upcomingHTML = '<article class="card show-card">Festival Noite Alta (demo)</article>';
  const pastHTML = '<article class="card show-card">Centro Cultural Marta (demo)</article>';

  const ctx = await runAgenda({
    getAgenda: async () => {
      throw new Error("fetch bloqueado em file://");
    },
    initial: { upcoming: upcomingHTML, past: pastHTML }
  });

  assert(ctx.up.innerHTML === upcomingHTML, "conteúdo estático de 'próximos' foi alterado/apagado");
  assert(ctx.up.hidden === false, "container de 'próximos' foi ocultado indevidamente");
  assert(ctx.past.innerHTML === pastHTML, "conteúdo estático de 'passados' foi alterado/apagado");
  assert(ctx.past.hidden === false, "container de 'passados' foi ocultado indevidamente");
  assert(ctx.empty.hidden === true, "estado 'nenhum show agendado' não deveria ser exibido");
  assert(ctx.pastSection.hidden === false, "seção 'Shows anteriores' não deveria ser ocultada");
  assert(ctx.status.hidden === true, "status deveria ficar limpo (sem mensagem residual)");
});

test("Cenário 1b - fonte retornou note 'error': tratada como indisponível, não vira agenda vazia", async () => {
  const upcomingHTML = '<article class="card show-card">Festival Noite Alta (demo)</article>';

  const ctx = await runAgenda({
    getAgenda: async () => ({ events: [], source: "local", note: "error" }),
    initial: { upcoming: upcomingHTML }
  });

  assert(ctx.up.innerHTML === upcomingHTML, "conteúdo estático foi alterado/apagado");
  assert(ctx.up.hidden === false, "container foi ocultado indevidamente");
  assert(ctx.empty.hidden === true, "estado 'nenhum show agendado' não deveria ser exibido");
});

test("Cenário 1c - integração: Google e local indisponíveis (file://) preservam estáticos", async () => {
  const upcomingHTML = '<article class="card show-card">Festival Noite Alta (demo)</article>';

  const OndaData = await loadDataEnv({
    loadJSON: async () => ({ enabled: true, mode: "google", calendarId: "abc", publicUrl: "" }),
    localLoad: async () => {
      throw new Error("fetch bloqueado em file://");
    },
    googleLoad: async () => {
      throw new Error("CORS/fetch bloqueado em file://");
    }
  });

  const ctx = await runAgenda({ getAgenda: OndaData.getAgenda, initial: { upcoming: upcomingHTML } });

  assert(ctx.up.innerHTML === upcomingHTML, "conteúdo estático foi alterado/apagado");
  assert(ctx.up.hidden === false, "container foi ocultado indevidamente");
  assert(ctx.empty.hidden === true, "estado 'nenhum show agendado' não deveria ser exibido");
});

/* Cenário 1d — caminho fiel de file://: até o data/calendar.json falha.
   A orquestração cai no padrão (local), o shows.json também é bloqueado e
   getAgenda() lança; a página deve preservar os estáticos do mesmo jeito. */
test("Cenário 1d - file:// integral (config e JSONs bloqueados): estáticos preservados", async () => {
  const upcomingHTML = '<article class="card show-card">Festival Noite Alta (demo)</article>';

  const OndaData = await loadDataEnv({
    loadJSON: async () => {
      throw new Error("fetch bloqueado em file://");
    },
    localLoad: async () => {
      throw new Error("fetch bloqueado em file://");
    },
    googleLoad: async () => {
      throw new Error("não deveria ser chamado (integração desativada)");
    }
  });

  const ctx = await runAgenda({ getAgenda: OndaData.getAgenda, initial: { upcoming: upcomingHTML } });

  assert(ctx.up.innerHTML === upcomingHTML, "conteúdo estático foi alterado/apagado");
  assert(ctx.up.hidden === false, "container foi ocultado indevidamente");
  assert(ctx.past.hidden === false, "container de 'passados' foi ocultado indevidamente");
  assert(ctx.empty.hidden === true, "estado 'nenhum show agendado' não deveria ser exibido");
  assert(ctx.pastSection.hidden === false, "seção 'Shows anteriores' não deveria ser ocultada");
});

/* --------------------------------------------------------------------------
   Cenário 2 — fonte carregou com eventos.
   Esperado: renderização normal dos shows.
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   Cenário 2 — fonte carregou com eventos.
   Esperado: renderização normal dos shows.
   -------------------------------------------------------------------------- */
test("Cenário 2 - fonte carregou com eventos: renderização normal", async () => {
  const ctx = await runAgenda({
    getAgenda: async () => ({ events: [upcomingShow(), pastShow()], source: "local", note: "local" })
  });

  assert(ctx.up.innerHTML.includes("Festival Noite Alta"), "evento de 'próximos' deveria ser renderizado");
  assert(ctx.up.hidden === false, "container de 'próximos' deveria permanecer visível");
  assert(ctx.past.innerHTML.includes("Centro Cultural Marta"), "evento de 'passados' deveria ser renderizado");
  assert(ctx.past.hidden === false, "container de 'passados' deveria permanecer visível");
  assert(ctx.empty.hidden === true, "estado vazio não deveria aparecer");
  assert(ctx.pastSection.hidden === false, "seção de anteriores deveria permanecer visível");
  assert(ctx.status.hidden === true, "status deveria ficar limpo apos carregar");
});

/* --------------------------------------------------------------------------
   Cenário 3 — fonte carregou sem eventos (agenda realmente vazia).
   Esperado: estado vazio apropriado; eventos estáticos NÃO permanecem.
   -------------------------------------------------------------------------- */
test("Cenário 3 - fonte carregou sem eventos: estado vazio, estáticos substituídos", async () => {
  const ctx = await runAgenda({
    getAgenda: async () => ({ events: [], source: "local", note: "local" }),
    initial: {
      upcoming: '<article class="card show-card">Festival Noite Alta (demo)</article>',
      past: '<article class="card show-card">Centro Cultural Marta (demo)</article>'
    }
  });

  assert(ctx.up.innerHTML === "", "container de 'próximos' deveria ser limpo (fonte carregou vazia)");
  assert(ctx.up.hidden === true, "container de 'próximos' deveria ser ocultado");
  assert(ctx.past.innerHTML === "", "container de 'passados' deveria ser limpo");
  assert(ctx.empty.hidden === false, "estado 'nenhum show agendado' deveria ser exibido");
  assert(ctx.pastSection.hidden === true, "seção de anteriores deveria ser ocultada");
  assert(!ctx.up.innerHTML.includes("demo"), "eventos estáticos não deveriam permanecer com fonte vazia");
});

test("Cenário 3b - fonte Google carregou vazia (note 'empty'): estado vazio, não preserva estáticos", async () => {
  const ctx = await runAgenda({
    getAgenda: async () => ({ events: [], source: "google", note: "empty" }),
    initial: { upcoming: '<article class="card show-card">Festival Noite Alta (demo)</article>' }
  });

  assert(ctx.up.innerHTML === "", "agenda Google vazia e vazio de verdade, não falha");
  assert(ctx.up.hidden === true, "container deveria ser ocultado");
  assert(ctx.empty.hidden === false, "estado 'nenhum show agendado' deveria ser exibido");
  assert(ctx.pastSection.hidden === true, "seção de anteriores deveria ser ocultada");
});
/* --------------------------------------------------------------------------
   Cenário 4 — Google Calendar (fallback externo) continua funcionando.
   -------------------------------------------------------------------------- */
test("Cenário 4 - fonte Google carregou com eventos: render normal e indicador visível", async () => {
  const ctx = await runAgenda({
    getAgenda: async () => ({ events: [upcomingShow()], source: "google", note: "ok" })
  });

  assert(ctx.up.innerHTML.includes("Festival Noite Alta"), "evento do Google deveria ser renderizado");
  assert(ctx.up.hidden === false, "container deveria permanecer visível");
  assert(ctx.empty.hidden === true, "estado vazio não deveria aparecer");
  assert(ctx.indicator.hidden === false, "indicador 'Agenda atualizada pelo Google Calendar' deveria aparecer");
  assert(ctx.status.hidden === true, "status deveria ficar limpo quando o Google é a fonte");
});

test("Cenário 4b - orquestrador: Google OK entrega { source: 'google', note: 'ok' }", async () => {
  const OndaData = await loadDataEnv({
    loadJSON: async () => ({ enabled: true, mode: "google", calendarId: "abc", publicUrl: "" }),
    localLoad: async () => [pastShow()],
    googleLoad: async () => [upcomingShow()]
  });

  const { source, note, events } = await OndaData.getAgenda();
  assert(source === "google" && note === "ok", `esperava google/ok, recebeu ${source}/${note}`);
  assert(events.length === 1, "esperava 1 evento do Google");
});

test("Cenário 4c - orquestrador: Google indisponível aciona fallback local (note 'fallback')", async () => {
  const OndaData = await loadDataEnv({
    loadJSON: async () => ({ enabled: true, mode: "google", calendarId: "abc", publicUrl: "" }),
    localLoad: async () => [pastShow()],
    googleLoad: async () => {
      throw new Error("CORS ou indisponibilidade do Google");
    }
  });

  const { source, note, events } = await OndaData.getAgenda();
  assert(source === "local" && note === "fallback", `esperava local/fallback, recebeu ${source}/${note}`);
  assert(events.length === 1, "fallback deveria carregar a agenda local");
});

test("Cenário 4d - orquestrador: modo local segue entregando { source: 'local', note: 'local' }", async () => {
  const OndaData = await loadDataEnv({
    loadJSON: async () => ({ enabled: false, mode: "local", provider: "google", calendarId: "", publicUrl: "" }),
    localLoad: async () => [upcomingShow()],
    googleLoad: async () => {
      throw new Error("não deveria ser chamado");
    }
  });

  const { source, note, events } = await OndaData.getAgenda();
  assert(source === "local" && note === "local", `esperava local/local, recebeu ${source}/${note}`);
  assert(events.length === 1, "deveria carregar a agenda local normalmente");
});

/* --------------------------------------------------------------------------
   Resumo final.
   -------------------------------------------------------------------------- */
(async () => {
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`ok - ${name}`);
    } catch (error) {
      failures.push({ name, error });
      console.error(`falhou - ${name}`);
      console.error(`  ${error.message}`);
    }
  }
  console.log(`\n${passed} teste(s) passaram; ${failures.length} falharam.`);
  if (failures.length > 0) {
    console.error("\nFalhas:");
    failures.forEach(({ name, error }) => console.error(`- ${name}: ${error.message}`));
    process.exitCode = 1;
  }
})();