/* ==========================================================================
   Onda Artist Kit — Core
   content.js — camada de conteúdo (carregamento de dados e renderizadores)

   Helpers compartilhados por todas as páginas: carregamento de JSON,
   escape de HTML, aplicação de textos/parágrafos, imagens com fallback
   e renderizadores reutilizáveis (integrantes, discografia, links).

   Modelo de funcionamento: as páginas carregam conteúdo estático de
   demonstração como fallback; quando servidas por HTTP, os dados de
   data/*.json hidratam as seções. Sem servidor (file://), o fetch falha
   e o fallback estático permanece, com aviso no console.
   ========================================================================== */

(() => {
  "use strict";

  /* Carrega um JSON e falha de forma explícita em caso de erro HTTP. */
  const loadJSON = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao carregar ${url} (HTTP ${response.status})`);
    }
    return response.json();
  };

  /* Escapa todo texto proveniente dos dados antes de montar HTML. */
  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  /* Define textContent em todos os elementos que casarem com o seletor. */
  const setTextAll = (selector, text) => {
    if (text === null || text === undefined || text === "") {
      return;
    }
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = text;
    });
  };

  /* Substitui o conteúdo de um container por parágrafos <p>. */
  const setParagraphs = (selector, texts) => {
    const container = document.querySelector(selector);
    if (!container) {
      return;
    }
    const list = (texts ?? []).filter((text) => String(text ?? "").trim() !== "");
    container.innerHTML = list.map((text) => `<p>${escapeHTML(text)}</p>`).join("");
    container.hidden = list.length === 0;
  };

  /* Substitui o conteúdo de um container por blocos de HTML pronto. */
  const renderList = (selector, htmlItems) => {
    const container = document.querySelector(selector);
    if (!container) {
      return;
    }
    container.innerHTML = htmlItems.join("");
    container.hidden = htmlItems.length === 0;
  };

  /* Aplica uma imagem com alt; quando não há imagem, esconde o wrapper. */
  const setArtwork = (imgSelector, wrapperSelector, src, alt) => {
    const wrapper = wrapperSelector ? document.querySelector(wrapperSelector) : null;
    const img = document.querySelector(imgSelector);
    if (!img) {
      return;
    }
    if (src) {
      img.src = src;
      img.alt = alt || "";
      img.hidden = false;
      if (wrapper) {
        wrapper.hidden = false;
      }
    } else if (wrapper) {
      wrapper.hidden = true;
    }
  };

  /* Iniciais para capas sem imagem (fallback visual). */
  const coverInitials = (title) =>
    String(title ?? "")
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");

  /* Rótulos das plataformas de links de lançamentos. */
  const PLATFORM_LABELS = {
    spotify: "Spotify",
    youtube: "YouTube",
    bandcamp: "Bandcamp",
    deezer: "Deezer",
    applemusic: "Apple Music",
    soundcloud: "SoundCloud",
    website: "Site oficial"
  };

  const platformLabel = (key) => PLATFORM_LABELS[key] ?? key;

  /* Renderiza chips de links de um lançamento (apenas links existentes). */
  const discographyLinksHTML = (title, links) =>
    Object.entries(links ?? {})
      .filter(([, url]) => Boolean(url))
      .map(([key, url]) => {
        const label = platformLabel(key);
        return `<a class="chip" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="Ouvir ${escapeHTML(title)} no ${escapeHTML(label)} (link demonstrativo)">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`;
      })
      .join("");

  /* Renderiza a discografia (reutilizada pelo site e pelo release).
     `selector` é um seletor CSS completo, ex.: "[data-discography]". */
  const renderDiscography = (selector, items, { showDescription = true } = {}) => {
    const html = (items ?? []).map((item, index) => {
      const variant = index % 3 === 1 ? " release-card__cover--alt" : index % 3 === 2 ? " release-card__cover--deep" : "";
      const cover = item.cover
        ? `<img class="release-card__cover" src="${escapeHTML(item.cover)}" alt="Capa de ${escapeHTML(item.title)}">`
        : `<div class="release-card__cover${variant}" aria-hidden="true">${escapeHTML(coverInitials(item.title))}</div>`;
      const description = showDescription && item.description ? `<p class="card__text">${escapeHTML(item.description)}</p>` : "";
      return `<article class="card release-card">
  ${cover}
  <h3 class="card__title">${escapeHTML(item.title)}</h3>
  <p class="card__meta">${escapeHTML(item.type ?? "")}${item.year ? ` · ${escapeHTML(item.year)}` : ""}</p>
  ${description}
  ${discographyLinksHTML(item.title, item.links)}
</article>`;
    });
    renderList(selector, html);
  };

  /* Renderiza a lista de links/redes (data/links.json). */
  const renderLinks = (selector, links) => {
    const html = (links ?? [])
      .filter((link) => link && link.url)
      .map(
        (link) => `<li><a class="chip" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)} <span aria-hidden="true">↗</span></a></li>`
      );
    renderList(selector, html);
  };

  /* Renderiza integrantes (Nome + Função). */
  const renderMembers = (selector, members) => {
    const html = (members ?? []).map(
      (member) => `<article class="card member-card">
  <h3 class="card__title">${escapeHTML(member.name)}</h3>
  <p class="card__meta">${escapeHTML(member.role)}</p>
</article>`
    );
    renderList(selector, html);
  };

  window.OndaContent = {
    loadJSON,
    escapeHTML,
    setTextAll,
    setParagraphs,
    renderList,
    setArtwork,
    coverInitials,
    platformLabel,
    discographyLinksHTML,
    renderDiscography,
    renderLinks,
    renderMembers
  };
})();
