/* ==========================================================================
   Onda Artist Kit — Core
   theme-loader.js — carrega o Theme configurado (src/js/../themes)

   Fluxo:
     data/site.json  ("theme": "midnight")
        ↓
     themes/midnight/theme.json + theme.css   (validação)
        ↓
     aplica theme.css via <style> e marca <html data-theme="midnight">

   Fallback (nunca quebra o site):
     - sem data/site.json            → "default"
     - tema inexistente/incompleto   → "default"
     - "default" incompleto/falha     → nenhum style injetado
       (src/css/variables.css já fornece a aparência base)

   100% estático: funciona em GitHub Pages e qualquer hospedagem estática.
   ========================================================================== */

(() => {
  "use strict";

  const DEFAULT_THEME = "default";
  const ID_RE = /^[a-z0-9_-]+$/;
  const STYLE_ID = "onda-theme-style";

  /* Base relativa: usa `data-base` do script (ex.: pagina em themes/ usa ".."). */
  const BASE = ((document.currentScript && document.currentScript.dataset.base) || ".").replace(/\/$/, "");
  const withBase = (url) => `${BASE}${url}`;

  /* Lê e interpreta data/site.json — retorna o id do tema. */
  const readSiteConfig = async () => {
    try {
      const response = await fetch(withBase("/data/site.json"));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const theme = data && typeof data.theme === "string" ? data.theme.trim() : "";
      return ID_RE.test(theme) ? theme : DEFAULT_THEME;
    } catch (error) {
      /* file:// (fetch bloqueado) ou falha HTTP: usa o snapshot embutido
         gerado pelo Configurador (onda-data.js), se existir. */
      const key = withBase("/data/site.json").replace(/^(?:\.\/|\.\.\/)+/, "");
      const embedded = window.ONDA_DATA && typeof window.ONDA_DATA === "object" ? window.ONDA_DATA[key] : null;
      const embeddedTheme = embedded && typeof embedded.theme === "string" ? embedded.theme.trim() : "";
      if (ID_RE.test(embeddedTheme)) {
        return embeddedTheme;
      }
      console.warn("[Onda] data/site.json indisponível — usando o Theme default.", error);
      return DEFAULT_THEME;
    }
  };

  /* Lê o texto de um arquivo; lança erro se indisponível. */
  const readText = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  };

  /* Valida um tema (theme.json com "id" + theme.css) e retorna o CSS. */
  const loadThemeCss = async (themeId) => {
    const base = withBase(`/themes/${themeId}/`);
    const manifest = await readText(`${base}theme.json`);      /* arquivo obrigatório */
    const parsed = JSON.parse(manifest);
    if (!parsed || typeof parsed.id !== "string" || parsed.id !== themeId) {
      throw new Error(`theme.json inválido para "${themeId}"`);
    }
    const css = await readText(`${base}theme.css`);            /* arquivo obrigatório */
    return { css, meta: parsed };
  };

  /* Aplica o tema no documento (style, data-theme, theme-color). */
  const applyTheme = async (themeId) => {
    const { css, meta } = await loadThemeCss(themeId);

    const existing = document.getElementById(STYLE_ID);
    if (existing) {
      existing.remove();
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);

    document.documentElement.dataset.theme = themeId;

    if (meta.themeColor) {
      const metaColor = document.querySelector('meta[name="theme-color"]');
      if (metaColor) {
        metaColor.setAttribute("content", meta.themeColor);
      }
    }
  };

  const boot = async () => {
    const theme = await readSiteConfig();

    try {
      await applyTheme(theme);
    } catch (error) {
      // Theme invalido/inexistente → Tenta o default.
      if (theme !== DEFAULT_THEME) {
        console.warn(`[Onda] Theme "${theme}" inválido — usando o Theme default.`, error);
        try {
          await applyTheme(DEFAULT_THEME);
          return;
        } catch (defaultError) {
          console.warn("[Onda] Theme default indisponível — usando a aparência base do Core.", defaultError);
        }
      } else {
        console.warn("[Onda] Theme default indisponível — usando a aparência base do Core.", error);
      }
      document.documentElement.dataset.theme = DEFAULT_THEME;
    }
  };

  boot();

  /* Exposto apenas para testes (a suíte em Node valida o fallback embutido). */
  window.OndaThemeLoader = { readSiteConfig };
})();