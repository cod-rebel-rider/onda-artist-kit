/* ==========================================================================
   Onda Artist Kit — Correção da exportação do Configurador

   Garante que o site gerado (.zip) exiba os dados do artista preenchidos
   no Configurador também sem servidor (file://), em vez do conteúdo de
   demonstração do Core:

   - src/js/content.js → loadJSON com fallback para window.ONDA_DATA;
   - src/js/theme-loader.js → readSiteConfig com o mesmo fallback;
   - configurador/js/exporter.js → gera onda-data.js (snapshot dos
     data/*.json) e injeta/personaliza as páginas HTML.

   A suíte segue o princípio do projeto: apenas Node.js puro, sem
   dependências externas, carregando as IIFEs reais do Core e do
   Configurador com um ambiente tipo-navegador mínimo.

   Como executar (na raiz do repositório):
       node test/configurador-export.test.cjs
   ========================================================================== */

"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

/* Ambiente mínimo tipo-navegador para executar as IIFEs no Node. */
global.window = {};
global.document = {
  addEventListener() {},
  getElementById: () => null,
  head: { appendChild() {} },
  documentElement: { dataset: {} }
  /* currentScript ausente → theme-loader usa BASE "." (mesmo caso real). */
};

/* Stubs exigidos na carga do exporter (módulos do navegador). */
window.OndaConfig = { serializeAll: () => ({}) };
window.OndaZip = { createZip: () => new Uint8Array() };

/* Silencia os avisos esperados das IIFEs (fallbacks intencionais do
   theme-loader e do loadJSON) para manter a saída da suíte focada nos
   resultados — mesmo padrão de test/agenda-file-fallback.test.cjs. */
console.warn = () => {};
console.info = () => {};

require("../src/js/content.js");
require("../src/js/theme-loader.js");
require("../configurador/js/exporter.js");

const { loadJSON } = window.OndaContent;
const { readSiteConfig } = window.OndaThemeLoader;
const { buildEmbeddedDataScript, injectEmbeddedDataScript, personalizeHtml } = window.OndaExporter;

const fetchFails = () => {
  global.fetch = async () => {
    throw new TypeError("Failed to fetch (simulação de file://)");
  };
};

test("loadJSON: dados embutidos assumem quando o fetch falha (file://)", async () => {
  fetchFails();
  window.ONDA_DATA = { "data/band.json": { name: "Minha Banda Real", city: "São Paulo" } };
  const band = await loadJSON("data/band.json");
  assert.equal(band.name, "Minha Banda Real");
  assert.equal(band.city, "São Paulo");
});

test("loadJSON: retorna clone profundo — mutação não vaza para ONDA_DATA", async () => {
  fetchFails();
  window.ONDA_DATA = { "data/band.json": { name: "Banda Clone" } };
  const band = await loadJSON("data/band.json");
  band.name = "Mutação Local";
  assert.equal(window.ONDA_DATA["data/band.json"].name, "Banda Clone");
});

test("loadJSON: fetch bem-sucedido tem prioridade sobre os dados embutidos", async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ source: "fetch" }) });
  window.ONDA_DATA = { "data/band.json": { source: "embutido" } };
  const data = await loadJSON("data/band.json");
  assert.equal(data.source, "fetch");
});

test("loadJSON: sem fetch e sem dado embutido, o erro é preservado", async () => {
  fetchFails();
  delete window.ONDA_DATA;
  await assert.rejects(() => loadJSON("data/band.json"), /Failed to fetch/);
});

test("theme-loader: theme embutido é aplicado quando data/site.json é inacessível", async () => {
  fetchFails();
  window.ONDA_DATA = { "data/site.json": { theme: "midnight" } };
  assert.equal(await readSiteConfig(), "midnight");
});

test("theme-loader: sem dados embutidos cai no tema default (comportamento original)", async () => {
  fetchFails();
  delete window.ONDA_DATA;
  assert.equal(await readSiteConfig(), "default");
});

test("theme-loader: theme embutido inválido é descartado (usa default)", async () => {
  fetchFails();
  window.ONDA_DATA = { "data/site.json": { theme: "Tema Inválido!" } };
  assert.equal(await readSiteConfig(), "default");
});

/* HTML de exemplo com as mesmas marcas do Core (marco do theme-loader,
   title, metas e rodapé de demonstração). */
const demoHtml = (page) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>Banda Exemplo — demo</title>
    <meta name="description" content="Site de demonstração da Banda Exemplo, banda fictícia.">
    <meta property="og:title" content="Banda Exemplo — demo">
    <meta property="og:description" content="Conteúdo demonstrativo do Onda Artist Kit.">
    <script src="src/js/theme-loader.js" defer></script>
</head>
<body>
    <footer><small>© <span data-year>2026</span> Banda Exemplo — ${page === "index" ? "site" : page} de demonstração com banda fictícia.</small></footer>
</body>
</html>`;

const userBand = {
  name: "Os Trilhos",
  tagline: "Sons urbanos do interior.",
  genre: "Pós-punk",
  city: "Campinas",
  state: "SP"
};

test("exporter: onda-data.js embute o snapshot completo dos dados", () => {
  const script = buildEmbeddedDataScript({
    "data/band.json": { name: "Os Trilhos" },
    "data/site.json": { theme: "midnight" }
  });
  assert.match(script, /window\.ONDA_DATA = \{/);
  assert.match(script, /"data\/band\.json"/);
  assert.match(script, /"theme": "midnight"/);
});

test("exporter: injeta onda-data.js antes do theme-loader em todas as páginas", () => {
  for (const page of ["index", "agenda", "release"]) {
    const html = injectEmbeddedDataScript(demoHtml(page));
    const dataPos = html.indexOf('<script src="onda-data.js"></script>');
    const themePos = html.indexOf('<script src="src/js/theme-loader.js"');
    assert.ok(dataPos !== -1, `${page}: marca de injeção ausente`);
    assert.ok(themePos > dataPos, `${page}: onda-data.js precisa vir antes do theme-loader`);
  }
});

test("exporter: injeção é idempotente e tolera páginas sem o marco", () => {
  const once = injectEmbeddedDataScript(demoHtml("index"));
  const twice = injectEmbeddedDataScript(once);
  assert.equal(once, twice, "não pode injetar duas vezes");
  const noMarker = "<html><head><title>x</title></head></html>";
  assert.equal(injectEmbeddedDataScript(noMarker), noMarker);
});

test("exporter: title, metas e rodapé saem com os dados do artista (sem demo)", () => {
  const html = personalizeHtml("index", demoHtml("index"), userBand);
  assert.ok(html.includes("<title>Os Trilhos — Pós-punk · Campinas, SP</title>"), "title personalizado");
  assert.ok(html.includes('content="Sons urbanos do interior. Pós-punk de Campinas, SP"'), "meta description personalizada");
  assert.ok(!html.includes("Banda Exemplo"), "nenhum resquício do nome demo");
  assert.ok(!html.includes("de demonstração com banda fictícia"), "nenhuma frase de demonstração");
  assert.ok(html.includes("Os Trilhos."), "rodapé com o nome real");
});

test("exporter: títulos seguem o formato de cada página do Core", () => {
  assert.ok(personalizeHtml("agenda", demoHtml("agenda"), userBand).includes("<title>Agenda — Os Trilhos · Pós-punk · Campinas, SP</title>"));
  assert.ok(personalizeHtml("release", demoHtml("release"), userBand).includes("<title>Os Trilhos — Release · Pós-punk · Campinas, SP</title>"));
});

test("exporter: valores do usuário são escapados nos atributos HTML", () => {
  const evil = { name: 'Banda "Injetora" <script>', tagline: "x", genre: "", city: "", state: "" };
  const html = personalizeHtml("index", demoHtml("index"), evil);
  assert.ok(html.includes("&quot;Injetora&quot; &lt;script&gt;"), "conteúdo escapado no title");
  assert.ok(!html.includes('content="Banda "'), "aspas do usuário não fecham o atributo");
});

test("integração: onda-data.js gerado é executável e alimenta o loadJSON do Core", async () => {
  fetchFails();
  const script = buildEmbeddedDataScript({
    "data/band.json": { name: "Banda Integração", shows: [] }
  });
  /* Avalia o onda-data.js exatamente como o navegador faria. */
  new Function(script)();
  const band = await loadJSON("data/band.json");
  assert.equal(band.name, "Banda Integração");
});

test("integração: os HTML do Core possuem o marco de injeção esperado pelo exporter", () => {
  for (const file of ["index.html", "agenda.html", "release.html"]) {
    const html = readFileSync(join(__dirname, "..", file), "utf8");
    assert.ok(
      html.includes('<script src="src/js/theme-loader.js" defer></script>'),
      `${file}: marco do theme-loader ausente — a injeção do exporter quebraria`
    );
  }
});

