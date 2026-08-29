/* ==========================================================================
   Onda Artist Kit — Issue #3: eventos CANCELLED do Google Calendar

   Testes do parser de ICS do Google Calendar
   (src/js/sources/google-icalendar.js) e do tratamento de eventos
   cancelados pela interface (src/components/show-card.js).

   O projeto é vanilla JS, sem build e sem frameworks; esta suíte segue o
   mesmo princípio: apenas Node.js puro, sem dependências externas.

   Como executar (na raiz do repositório):
       node test/google-icalendar.test.cjs

   A suíte carrega as IIFEs reais do Core (content.js, shows.js,
   google-icalendar.js e show-card.js) e reproduz o pipeline do load()
   (parseIcs → toEvent → normalizeShows) usando uma fixture realista de um
   calendário público do Google — sem requisições de rede.
   ========================================================================== */

"use strict";

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

/* Ambiente mínimo tipo-navegador para executar as IIFEs do Core no Node. */
global.window = {};
global.document = { addEventListener() {} };

require("../src/js/content.js");
require("../src/js/shows.js");
require("../src/js/sources/google-icalendar.js");
require("../src/components/show-card.js");

const { parseIcs, toEvent } = window.OndaSourceGoogleCalendar;
const { normalizeShows } = window.OndaShows;
const { render } = window.OndaShowCard;

/* Mesmo pipeline do load() (sem a etapa de rede): parseIcs → toEvent → normalizeShows. */
const pipeline = (text) => normalizeShows(parseIcs(text).map(toEvent).filter(Boolean));

/* VEVENT mínimo para testes focados no mapeamento de STATUS. */
const icsWith = (statusLine) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Onda Artist Kit//Teste//PT-BR",
    "BEGIN:VEVENT",
    "UID:teste-status@google.com",
    "DTSTART:20260912T200000Z",
    "DTEND:20260912T210000Z",
    "SUMMARY:Show da Banda",
    statusLine, /* "" → evento sem STATUS */
    "END:VEVENT",
    "END:VCALENDAR"
  ]
    .filter((line) => line !== "")
    .join("\n");

/* Fixture realista (mesma estrutura de um arquivo .ics exportado pelo Google). */
const googleIcs = readFileSync(join(__dirname, "fixtures", "google-calendar.ics"), "utf8");

/* --------------------------------------------------------------------------
   Mini harness de testes (zero dependências).
   -------------------------------------------------------------------------- */
let passed = 0;
const failures = [];

const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`falhou - ${name}`);
    console.error(`  ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || "assertiva falhou");
  }
};

const findByTitle = (events, title) => events.find((event) => event.title === title);

/* --------------------------------------------------------------------------
   Parser — STATUS:CANCELLED (duplo L, usado pelo Google Calendar).
   -------------------------------------------------------------------------- */

test('STATUS:CANCELLED resulta em status "cancelled"', () => {
  const events = pipeline(icsWith("STATUS:CANCELLED"));
  assert(events.length === 1, "esperava 1 evento no resultado");
  assert(
    events[0].status === "cancelled",
    `esperava status "cancelled", recebeu ${JSON.stringify(events[0].status)}`
  );
});

test('STATUS:CANCELLED na fixture realista do Google resulta em status "cancelled"', () => {
  const events = pipeline(googleIcs);
  const show = findByTitle(events, "Show da Banda");
  assert(Boolean(show), "evento cancelado não encontrado na fixture");
  assert(
    show.status === "cancelled",
    `esperava status "cancelled", recebeu ${JSON.stringify(show.status)}`
  );
});

test('STATUS:CONFIRMED continua resultando em status "confirmed"', () => {
  const events = pipeline(icsWith("STATUS:CONFIRMED"));
  assert(events.length === 1, "esperava 1 evento no resultado");
  assert(
    events[0].status === "confirmed",
    `esperava status "confirmed", recebeu ${JSON.stringify(events[0].status)}`
  );
});

test('STATUS:CONFIRMED na fixture realista continua confirmado', () => {
  const events = pipeline(googleIcs);
  const show = findByTitle(events, "Festival Noite Alta");
  assert(Boolean(show), "evento confirmado não encontrado na fixture");
  assert(
    show.status === "confirmed",
    `esperava status "confirmed", recebeu ${JSON.stringify(show.status)}`
  );
});

test('evento sem STATUS continua confirmado (comportamento atual)', () => {
  const events = pipeline(icsWith(""));
  assert(events.length === 1, "esperava 1 evento no resultado");
  assert(
    events[0].status === "confirmed",
    `esperava status "confirmed", recebeu ${JSON.stringify(events[0].status)}`
  );
});

test("evento sem STATUS na fixture realista continua confirmado", () => {
  const events = pipeline(googleIcs);
  const show = findByTitle(events, "Ensaio Aberto");
  assert(Boolean(show), "evento sem STATUS não encontrado na fixture");
  assert(
    show.status === "confirmed",
    `esperava status "confirmed", recebeu ${JSON.stringify(show.status)}`
  );
});

test('STATUS:CANCELED (grafia antiga, um L) continua resultando em "cancelled"', () => {
  const events = pipeline(icsWith("STATUS:CANCELED"));
  assert(
    events[0].status === "cancelled",
    `esperava status "cancelled", recebeu ${JSON.stringify(events[0].status)}`
  );
});

test('valor em minúsculas (STATUS:cancelled) também é normalizado para "cancelled"', () => {
  const events = pipeline(icsWith("STATUS:cancelled"));
  assert(
    events[0].status === "cancelled",
    `esperava status "cancelled", recebeu ${JSON.stringify(events[0].status)}`
  );
});

/* --------------------------------------------------------------------------
   Interface — evento cancelado do Google recebe o mesmo tratamento dos
   eventos locais cancelados (badge, sem ingresso e sem download .ics).
   -------------------------------------------------------------------------- */

test("evento cancelado do Google é renderizado como cancelado (badge e classe)", () => {
  const events = pipeline(googleIcs);
  const show = findByTitle(events, "Show da Banda");
  const html = render(show);
  assert(html.includes("badge badge--cancelled"), "esperava badge badge--cancelled");
  assert(html.includes("Cancelado"), "esperava o rótulo textual 'Cancelado'");
  assert(html.includes("show-card--cancelled"), "esperava a classe show-card--cancelled");
});

test("evento cancelado do Google não exibe botão de ingressos nem de download .ics", () => {
  const events = pipeline(googleIcs);
  const show = findByTitle(events, "Show da Banda");
  const html = render(show);
  assert(!html.includes("Ingressos"), "evento cancelado não pode exibir botão de ingressos");
  assert(!html.includes("data-ics="), "evento cancelado não pode exibir botão de download .ics");
});

test("evento confirmado do Google mantém ingressos, download .ics e badge confirmado", () => {
  const events = pipeline(googleIcs);
  const show = findByTitle(events, "Festival Noite Alta");
  const html = render(show);
  assert(html.includes("badge badge--confirmed"), "esperava badge badge--confirmed");
  assert(html.includes("Ingressos"), "evento confirmado deveria manter botão de ingressos");
  assert(html.includes("data-ics="), "evento confirmado deveria manter botão de download .ics");
});

/* --------------------------------------------------------------------------
   Resumo final.
   -------------------------------------------------------------------------- */
console.log(`\n${passed} teste(s) passaram; ${failures.length} falharam.`);
if (failures.length > 0) {
  console.error("\nFalhas:");
  failures.forEach(({ name, error }) => console.error(`- ${name}: ${error.message}`));
  process.exitCode = 1;
}