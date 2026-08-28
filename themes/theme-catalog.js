/* ==========================================================================
   Onda Artist Kit — Catálogo de Themes
   themes/theme-catalog.js — renderiza o catálogo e aplica o preview.

   Renderiza os cards de cada Theme a partir do seu theme.json e injeta o
   CSS do tema escolhido na própria página (prévia). Ferramenta de apoio,
   sem admin e sem editor visual.
   ========================================================================== */

(() => {
  "use strict";

  const CATALOG = ["default", "midnight", "brutalist"];
  const STYLE_ID = "onda-theme-style";
  const container = document.querySelector("[data-themes-catalog]");

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);

  const loadManifest = async (themeId) => {
    const response = await fetch(`${themeId}/theme.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  };

  const applyPreview = async (themeId) => {
    const response = await fetch(`${themeId}/theme.css`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const css = await response.text();
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = css;
    document.documentElement.dataset.theme = themeId;
    const label = document.querySelector("[data-theme-label]");
    if (label) {
      label.textContent = `Pré-visualizando: ${themeId}`;
    }
  };

  const buildCatalog = async () => {
    if (!container) {
      return;
    }
    for (const themeId of CATALOG) {
      try {
        const m = await renderManifest(themeId);
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <h3 class="card__title">${escapeHTML(m.name)}</h3>
          <p class="card__meta"><code>${escapeHTML(m.id)}</code> · v${escapeHTML(m.version)}</p>
          <p class="card__text">${escapeHTML(m.description)}</p>
          <div class="show-card__actions">
            <button class="btn btn--primary btn--sm" type="button" data-theme-preview="${escapeHTML(m.id)}">Pré-visualizar</button>
          </div>`;
        container.appendChild(card);
      } catch (error) {
        console.warn(`[Onda] Tema "${themeId}" incompleto e não foi listado no catálogo.`, error);
      }
    }
  };

  const renderManifest = async (themeId) => {
    const manifest = await loadManifest(themeId);
    return {
      id: themeId,
      name: manifest.name || themeId,
      version: manifest.version || "—",
      description: manifest.description || "Sem descrição."
    };
  };

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-theme-preview]");
    if (!button) {
      return;
    }
    try {
      await applyPreview(button.dataset.themePreview);
    } catch (error) {
      console.warn("[Onda] Não foi possível pré-visualizar o tema.", error);
      window.alert("Não foi possível pré-visualizar este tema.");
    }
  });

  buildCatalog().catch((error) => {
    console.warn("[Onda] Catálogo de temas indisponível.", error);
  });
})();