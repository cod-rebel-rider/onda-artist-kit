/* ==========================================================================
   Onda Artist Kit — Configurador
   exporter.js — geração do site estático (.zip) a partir do estado.
   ========================================================================== */

(() => {
  "use strict";

  const { serializeAll } = window.OndaConfig;
  const { createZip } = window.OndaZip;

  /* Arquivos do Core reutilizados (relativos à raiz do repo). */
  const CORE_FILES = [
    "index.html", "agenda.html", "release.html",
    "src/css/reset.css", "src/css/variables.css", "src/css/base.css",
    "src/css/layout.css", "src/css/components.css", "src/css/main.css",
    "src/css/print.css",
    "src/js/main.js", "src/js/content.js", "src/js/shows.js",
    "src/js/home.js", "src/js/release.js", "src/js/data.js",
    "src/js/agenda.js", "src/js/theme-loader.js",
    "src/js/sources/local.js", "src/js/sources/google-icalendar.js",
    "src/components/show-card.js",
    "assets/icons/favicon.svg"
  ];

  /* Sanitiza um nome de arquivo: apenas [A-Za-z0-9._-], sem paths. */
  const sanitizeName = (name) => String(name || "arquivo").replace(/[^a-z0-9._-]/gi, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "arquivo";

  const parseDataUrl = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return null;
    const meta = dataUrl.slice(0, commaIndex);
    const base64 = meta.includes(";base64");
    const mime = meta.replace(/^data:/, "").replace(/;base64$/, "");
    const binary = base64
      ? Uint8Array.from(atob(dataUrl.slice(commaIndex + 1)), (c) => c.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(dataUrl.slice(commaIndex + 1)));
    return { mime, base64, bytes: binary };
  };

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif", "image/x-icon"];

  /* Processa imagens (logo/photo): dataURL → binário + reescreve caminhos. */
  const processImages = (bandJson) => {
    const entries = [];
    const processed = { ...bandJson };
    const handleImage = (field, fallbackName) => {
      const dataUrl = processed[field];
      if (typeof dataUrl !== "string" || dataUrl.startsWith("http")) return;
      const parsed = parseDataUrl(dataUrl);
      if (!parsed) return;
      if (!ALLOWED_IMAGE_TYPES.includes(parsed.mime)) {
        console.warn(`[Configurador] Tipo de imagem não permitido (${parsed.mime}) — ignorado.`);
        return;
      }
      const ext = parsed.mime.split("/").pop().replace("+xml", "").replace("jpeg", "jpg");
      const filename = sanitizeName(fallbackName) + "." + (ext || "bin");
      entries.push({ path: `assets/images/${filename}`, data: parsed.bytes });
      processed[field] = `assets/images/${filename}`;
    };
    handleImage("logo", "logo");
    handleImage("photo", "foto");
    return { entries, bandJson: processed };
  };

  /* Theme manifestados carregados (assets). */
  const THEME_ASSETS = { default: [], midnight: [], brutalist: ["assets/favicon.svg"] };

  const fetchText = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
    return response.text();
  };
  const fetchBytes = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  };

  const loadTheme = async (themeId) => {
    const base = `../themes/${themeId}/`;
    const entries = [];
    try {
      entries.push({ path: `themes/${themeId}/theme.json`, data: await fetchText(`${base}theme.json`) });
      entries.push({ path: `themes/${themeId}/theme.css`, data: await fetchText(`${base}theme.css`) });
      for (const asset of THEME_ASSETS[themeId] || []) {
        try { entries.push({ path: `themes/${themeId}/${asset}`, data: await fetchBytes(`${base}${asset}`) }); }
        catch { console.warn(`[Configurador] Asset de Theme ausente: ${themeId}/${asset}`); }
      }
      return { ok: true, entries };
    } catch (error) {
      return { ok: false, error: String(error), entries: [] };
    }
  };

  const buildPublishGuide = () => `# COMO PUBLICAR SEU SITE
# ---------------------------
# 1. Extraia este arquivo .zip em uma pasta vazia.
# 2. Abra "index.html" no navegador para testar localmente.
# 3. Escolha uma hospedagem (todas funcionam com este site estático).

## Opção A — GitHub Pages (gratuito)
# 1. Crie um repositório no GitHub (ex.: site-do-artista).
# 2. Envie TODOS os arquivos desta pasta para a branch "main".
# 3. Em Settings > Pages, escolha a branch "main" e pasta / (raiz).
# 4. Pronto! https://SEU-USUARIO.github.io/site-do-artista/
#    (pode levar alguns minutos na primeira publicação).

## Opção B — Outras hospedagens
# Envie todos os arquivos a qualquer provedor de hospedagem estática
# (Netlify, Vercel, Cloudflare Pages, hospedagem compartilhada, etc.).

# Dica: altere a aparência editando "data/site.json" → "theme":
# "default" | "midnight" | "brutalist" . Recarregue que muda tudo.

# Gerado pelo Onda Artist Kit (https://github.com/Onda-Noturna/onda-artist-kit) — MIT License.`;

  const exportSite = async (customState) => {
    const state = customState || window.OndaConfig.getState();
    const themeId = sanitizeName((state.themeId || "default").trim());
    const siteName = sanitizeName(state.configuracoes?.siteName || "onda-artist-kit-site");

    // 1. Dados serializados
    const serialized = serializeAll(state);
    const dataEntries = Object.entries(serialized).map(([path, obj]) => ({ path, data: JSON.stringify(obj, null, 2) }));

    // 2. Imagens → reescreve paths no band.json
    const bandEntry = dataEntries.find((e) => e.path === "data/band.json");
    const imageEntries = [];
    if (bandEntry) {
      const { entries: imgs, bandJson } = processImages(JSON.parse(bandEntry.data));
      imageEntries.push(...imgs);
      bandEntry.data = JSON.stringify(bandJson, null, 2);
    }

    // 3. Theme (com fallback)
    let themeEntries = (await loadTheme(themeId)).entries;
    if (!themeEntries.length && themeId !== "default") {
      const fallback = await loadTheme("default");
      themeEntries = fallback.entries;
    }

    // 4. Core reutilizado
    const coreEntries = [];
    for (const file of CORE_FILES) {
      try { coreEntries.push({ path: file, data: await fetchText(`../${file}`) }); }
      catch { console.warn(`[Configurador] Core não encontrado: ${file}`); }
    }

    // 5. Tudo junto (dedup, dados têm prioridade)
    const seen = new Set();
    const unique = [];
    for (const entry of [...themeEntries, ...coreEntries, ...imageEntries, ...dataEntries, { path: "COMO-PUBLICAR.txt", data: buildPublishGuide() }]) {
      if (seen.has(entry.path)) continue;
      seen.add(entry.path);
      unique.push(entry);
    }

    // 6. ZIP + download
    const zip = createZip(unique);
    const blob = new Blob([zip], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${siteName}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { ok: true, count: unique.length };
  };

  window.OndaExporter = { exportSite, CORE_FILES };
})();