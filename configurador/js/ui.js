/* ==========================================================================
   Onda Artist Kit — Configurador
   ui.js — interface interativa do configurador (renderização de etapas,
   binding de dados, preview e navegação).

   Carregamento de dependências (ordem garantida no index.html):
     zip.js → steps.js → state.js → ui.js → exporter.js
   ========================================================================== */

(() => {
  "use strict";

  const {
    getState, setState, resetState, getItem, setItem,
    addListItem, updateListItem, removeListItem, moveListItem,
    serializeAll, isValidUrl, isValidDate, isValidTime
  } = window.OndaConfig;
  const escapeHTML = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const STEPS = window.OndaConfigSteps;
  // Espelha o CATALOG de themes/theme-catalog.js (fonte oficial da lista).
  const AVAILABLE_THEMES = ["default", "midnight", "brutalist"];

  let cachedThemeCss = {}; // { [themeId]: cssText }
  let currentStep = "identidade";
  let previewDebounce;

  const qs = (sel, scope) => (scope || document).querySelector(sel);
  const qsa = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));

  /* Mensagens */
  const toast = (msg, isError = false) => {
    const el = document.getElementById("cfg-toast");
    el.textContent = msg;
    el.style.borderColor = isError ? "var(--cfg-accent-2)" : "var(--cfg-border)";
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 3500);
  };

  /* Carrega e cacheia o CSS + manifesto de cada Theme (para preview/catálogo). */
  let cachedThemeMeta = {}; // { [themeId]: { name, description, version } }
  const cacheThemeCss = async () => {
    await Promise.all(AVAILABLE_THEMES.map(async (id) => {
      try {
        const [cssRes, jsonRes] = await Promise.all([
          fetch(`../themes/${id}/theme.css`),
          fetch(`../themes/${id}/theme.json`)
        ]);
        if (cssRes.ok) cachedThemeCss[id] = await cssRes.text();
        if (jsonRes.ok) {
          const manifest = await jsonRes.json();
          cachedThemeMeta[id] = {
            name: manifest.name || id,
            description: manifest.description || "",
            version: manifest.version || "—"
          };
        }
      } catch { /* Theme indisponível: preview usa o Core puro */ }
    }));
  };

  /* ---------- Upload de imagens (dataURL no estado; binário só no export) ---------- */
  const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif", "image/x-icon"];
  const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

  const readImageFile = (file) => new Promise((resolve, reject) => {
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      reject(new Error("Tipo de arquivo não suportado. Use PNG, JPG, WebP, SVG ou GIF."));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("Imagem maior que 2 MB — reduza o tamanho do arquivo."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });

  /* ---------- Helpers de formulário ---------- */
  const setDeep = (obj, path, value) => {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  };

  const field = ({ label, key, value, type = "text", hint = "", placeholder = "", required = false, lines = false, rows = 4, min = null, max = null, choices = null }) => {
    const id = `f-${key.replace(/\./g, "-")}`;
    let control = "";
    if (type === "select") {
      control = `<select id="${id}" data-bind="${key}">${choices.map(([v, text]) =>
        `<option value="${escapeHTML(v)}"${String(value) === String(v) ? " selected" : ""}>${escapeHTML(text)}</option>`).join("")}</select>`;
    } else if (type === "textarea") {
      control = `<textarea id="${id}" data-bind="${key}"${lines ? " data-lines" : ""} rows="${rows}" placeholder="${escapeHTML(placeholder)}">${escapeHTML(lines ? (value || []).join("\n") : value ?? "")}</textarea>`;
    } else {
      control = `<input id="${id}" data-bind="${key}" type="${type}" value="${escapeHTML(value ?? "")}" placeholder="${escapeHTML(placeholder)}"${min !== null ? ` min="${min}"` : ""}${max !== null ? ` max="${max}"` : ""}>`;
    }
    return `
      <div class="cfg-field">
        <label for="${id}">${escapeHTML(label)}${required ? ` <span class="cfg-required" aria-hidden="true">*</span>` : ""}</label>
        ${control}
        ${hint ? `<p class="cfg-hint">${escapeHTML(hint)}</p>` : ""}
      </div>`;
  };

  const imageField = ({ title, key, altKey, hint = "" }) => {
    const value = getItem(key) || "";
    const id = `f-${key}`;
    return `
      <div class="cfg-field cfg-field--upload">
        <span class="cfg-field-label">${escapeHTML(title)}</span>
        <input id="${id}" class="cfg-file-input" type="file" accept="image/*" data-upload="${key}">
        <label for="${id}" class="cfg-file-label">${value ? "Trocar imagem" : "Enviar imagem"} — PNG, JPG, WebP, SVG ou GIF (máx. 2 MB)</label>
        ${hint ? `<p class="cfg-hint">${escapeHTML(hint)}</p>` : ""}
        <div class="cfg-upload-preview" data-upload-preview="${key}">${value ? `<img class="cfg-preview-img" src="${value}" alt="">` : ""}</div>
        ${field({ label: "Texto alternativo (descreva a imagem)", key: altKey, value: getItem(altKey) || "" })}
      </div>`;
  };

  const rowControls = (listKey, index, length) => `
    <span class="cfg-row-controls">
      <button type="button" class="btn btn--ghost btn--icon" data-action="move-up" data-list="${listKey}" data-index="${index}" aria-label="Mover para cima"${index === 0 ? " disabled" : ""}>↑</button>
      <button type="button" class="btn btn--ghost btn--icon" data-action="move-down" data-list="${listKey}" data-index="${index}" aria-label="Mover para baixo"${index === length - 1 ? " disabled" : ""}>↓</button>
      <button type="button" class="btn btn--ghost btn--icon btn--danger" data-action="remove" data-list="${listKey}" data-index="${index}" aria-label="Remover">✕</button>
    </span>`;

  const rowInput = ({ listKey, index, fieldKey, value, type = "text", placeholder = "", label }) =>
    `<input type="${type}" value="${escapeHTML(value ?? "")}" placeholder="${escapeHTML(placeholder)}" aria-label="${escapeHTML(label || fieldKey)}" data-row-list="${listKey}" data-row-index="${index}" data-row-field="${fieldKey}">`;

  /* ---------- Navegação de etapas ---------- */
  const renderSteps = () => {
    qs("#cfg-steps-list").innerHTML = STEPS.map((step, index) => `
      <li>
        <a class="cfg-step" href="#${step.id}" data-goto-step="${step.id}"${step.id === currentStep ? ` aria-current="step"` : ""}>
          <span class="cfg-step-num" aria-hidden="true">${index + 1}</span>
          <span aria-hidden="true">${step.icon}</span>
          <span>${escapeHTML(step.label)}</span>
        </a>
      </li>`).join("");
  };

  const goToStep = (id) => {
    if (!STEPS.some((s) => s.id === id)) id = "identidade";
    currentStep = id;
    if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
    renderSteps();
    renderStep();
  };

  const renderStep = () => {
    qs("#cfg-step-content").innerHTML = (RENDERERS[currentStep] || renderIdentidade)();
    if (currentStep === "preview") refreshPreview();
  };

  /* ---------- Etapa: Identidade ---------- */
  const renderIdentidade = () => {
    const i = getState().identidade;
    return `
      <h2>Identidade</h2>
      <p class="cfg-hint">Quem você é, de onde vem e o que toca. Isso alimenta o topo do site (hero) e o JSON de dados.</p>
      <form class="cfg-form" onsubmit="return false;">
        <fieldset>
          <legend>Informações básicas</legend>
          <div class="cfg-grid">
            ${field({ label: "Nome do artista/banda", key: "identidade.name", value: i.name, required: true, placeholder: "Ex.: Banda Exemplo" })}
            ${field({ label: "Cidade", key: "identidade.city", value: i.city, placeholder: "Ex.: Brasília" })}
            ${field({ label: "Estado (UF)", key: "identidade.state", value: i.state, placeholder: "Ex.: DF", max: 2 })}
            ${field({ label: "País", key: "identidade.country", value: i.country, placeholder: "Ex.: BR" })}
            ${field({ label: "Gênero musical", key: "identidade.genre", value: i.genre, placeholder: "Ex.: Rock independente" })}
            ${field({ label: "Ano de formação", key: "identidade.founded", value: i.founded, type: "number", min: 1900, max: 2100 })}
          </div>
          ${field({ label: "Frase de efeito (tagline)", key: "identidade.tagline", value: i.tagline, type: "textarea", rows: 3, hint: "Uma frase curta que aparece em destaque na home." })}
        </fieldset>
        <fieldset>
          <legend>Imagens</legend>
          ${imageField({ title: "Logo", key: "identidade.logo", altKey: "identidade.logoAlt", hint: "Usado no cabeçalho do site. Fundo transparente funciona melhor." })}
          ${imageField({ title: "Foto do artista/banda", key: "identidade.photo", altKey: "identidade.photoAlt", hint: "Usada na seção Sobre." })}
        </fieldset>
      </form>`;
  };

  /* ---------- Etapa: Release ---------- */
  const renderRelease = () => {
    const r = getState().release;
    const members = r.members || [];
    const discography = r.discography || [];
    return `
      <h2>Release</h2>
      <p class="cfg-hint">O texto oficial de apresentação — imprensa, contratantes e fãs vão ler isto.</p>
      <form class="cfg-form" onsubmit="return false;">
        ${field({ label: "Título/headline do release", key: "release.headline", value: r.headline })}
        ${field({ label: "Biografia (um parágrafo por linha)", key: "release.biography", value: r.biography, type: "textarea", lines: true, rows: 6, hint: "Cada linha vira um parágrafo na página de Release." })}
        ${field({ label: "Identidade musical", key: "release.musicalIdentity", value: r.musicalIdentity, type: "textarea", rows: 3 })}
        ${field({ label: "Destaques (um por linha)", key: "release.highlights", value: r.highlights, type: "textarea", lines: true, rows: 3, hint: "Ex.: \"Abertura para banda X\", \"Playlisted em Y\"." })}
        ${field({ label: "Experiência / história nos palcos", key: "release.experience", value: r.experience, type: "textarea", rows: 3 })}

        <fieldset>
          <legend>Integrantes</legend>
          ${members.length === 0 ? `<p class="cfg-list-empty">Nenhum integrante cadastrado.</p>` : ""}
          <ul class="cfg-list">
            ${members.map((m, index) => `
              <li class="cfg-list-item">
                ${rowInput({ listKey: "release.members", index, fieldKey: "name", value: m.name, placeholder: "Nome", label: "Nome do integrante" })}
                ${rowInput({ listKey: "release.members", index, fieldKey: "role", value: m.role, placeholder: "Função (ex.: Vocal)", label: "Função" })}
                ${rowControls("release.members", index, members.length)}
              </li>`).join("")}
          </ul>
          <div class="cfg-list-actions">
            <button type="button" class="btn btn--ghost" data-action="add" data-add-list="release.members" data-add-item='{"name":"","role":""}'>+ Adicionar integrante</button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Discografia</legend>
          ${discography.length === 0 ? `<p class="cfg-list-empty">Nenhum lançamento cadastrado.</p>` : ""}
          <ul class="cfg-list">
            ${discography.map((d, index) => `
              <li class="cfg-list-item">
                <div class="cfg-item-content cfg-grid">
                  ${rowInput({ listKey: "release.discography", index, fieldKey: "title", value: d.title, placeholder: "Título", label: "Título do lançamento" })}
                  ${rowInput({ listKey: "release.discography", index, fieldKey: "type", value: d.type, placeholder: "Tipo (EP, LP…)", label: "Tipo" })}
                  ${rowInput({ listKey: "release.discography", index, fieldKey: "year", value: d.year, type: "number", placeholder: "Ano", label: "Ano" })}
                  ${rowInput({ listKey: "release.discography", index, fieldKey: "links.spotify", value: d.links?.spotify || "", placeholder: "URL (Spotify, YouTube…)", label: "URL do lançamento" })}
                </div>
                ${rowControls("release.discography", index, discography.length)}
              </li>`).join("")}
          </ul>
          <div class="cfg-list-actions">
            <button type="button" class="btn btn--ghost" data-action="add" data-add-list="release.discography" data-add-item='{"title":"","type":"","year":null,"description":"","links":{"spotify":""}}'>+ Adicionar lançamento</button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Contratação (booking)</legend>
          ${field({ label: "Descrição", key: "release.booking.description", value: r.booking?.description || "", type: "textarea", rows: 3 })}
          <div class="cfg-grid">
            ${field({ label: "E-mail de contato", key: "release.booking.email", value: r.booking?.email || "", type: "email", placeholder: "contato@exemplo.com.br" })}
            ${field({ label: "Telefone (opcional)", key: "release.booking.phone", value: r.booking?.phone || "", type: "tel", placeholder: "(61) 90000-0000" })}
          </div>
        </fieldset>
      </form>`;
  };

  /* ---------- Etapa: Links ---------- */
  const renderLinks = () => {
    const l = getState().links;
    const linkList = (listKey, items, nameLabel, urlPlaceholder) => `
      ${items.length === 0 ? `<p class="cfg-list-empty">Nenhum link nesta lista.</p>` : ""}
      <ul class="cfg-list">
        ${items.map((item, index) => `
          <li class="cfg-list-item">
            ${rowInput({ listKey, index, fieldKey: "label", value: item.label, placeholder: nameLabel, label: "Rótulo do link" })}
            ${rowInput({ listKey, index, fieldKey: "url", value: item.url, type: "url", placeholder: urlPlaceholder, label: "URL do link" })}
            ${rowControls(listKey, index, items.length)}
          </li>`).join("")}
      </ul>
      <div class="cfg-list-actions">
        <button type="button" class="btn btn--ghost" data-action="add" data-add-list="${listKey}" data-add-item='{"label":"","url":""}'>+ Adicionar link</button>
      </div>`;
    return `
      <h2>Links</h2>
      <p class="cfg-hint">Plataformas de streaming, redes sociais e qualquer outro lugar onde o público encontra você. Use URLs completas (começando com https://).</p>
      <form class="cfg-form" onsubmit="return false;">
        <fieldset>
          <legend>Redes e plataformas</legend>
          ${linkList("links.social", l.social || [], "Ex.: Instagram", "https://instagram.com/suabanda")}
        </fieldset>
        <fieldset>
          <legend>Links personalizados</legend>
          ${linkList("links.custom", l.custom || [], "Ex.: Assine o clube", "https://exemplo.com/minha-pagina")}
        </fieldset>
      </form>`;
  };

  /* ---------- Etapa: Agenda ---------- */
  const SHOW_STATUS_CHOICES = [["confirmed", "Confirmado"], ["cancelled", "Cancelado"], ["postponed", "Adiado"]];

  const renderAgenda = () => {
    const agenda = getState().agenda;
    const shows = agenda.shows || [];
    const cal = agenda.calendar || {};
    const showRow = (show, index) => `
      <li class="cfg-list-item">
        <div class="cfg-item-content cfg-grid">
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "title", value: show.title, placeholder: "Nome do evento *", label: "Nome do evento" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "date", value: show.date, type: "date", label: "Data" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "startTime", value: show.startTime, type: "time", label: "Horário de início" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "endTime", value: show.endTime, type: "time", label: "Horário de fim" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "venue", value: show.venue, placeholder: "Local", label: "Local" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "city", value: show.city, placeholder: "Cidade", label: "Cidade" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "state", value: show.state, placeholder: "UF", label: "UF" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "ticketUrl", value: show.ticketUrl, type: "url", placeholder: "URL de ingressos", label: "URL de ingressos" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "mapUrl", value: show.mapUrl, type: "url", placeholder: "URL do mapa", label: "URL do mapa" })}
          ${rowInput({ listKey: "agenda.shows", index, fieldKey: "description", value: show.description, placeholder: "Descrição curta", label: "Descrição" })}
          <select aria-label="Status do show" data-row-list="agenda.shows" data-row-index="${index}" data-row-field="status">
            ${SHOW_STATUS_CHOICES.map(([v, text]) => `<option value="${v}"${(show.status || "confirmed") === v ? " selected" : ""}>${text}</option>`).join("")}
          </select>
        </div>
        ${rowControls("agenda.shows", index, shows.length)}
      </li>`;
    return `
      <h2>Agenda</h2>
      <p class="cfg-hint">Escolha de onde vêm os shows: a lista local abaixo ou um Google Calendar público (via iCal — sem API key, sem backend).</p>
      <form class="cfg-form" onsubmit="return false;">
        ${field({ label: "Fonte da agenda", key: "agenda.calendar.mode", value: cal.mode || "local", type: "select", choices: [["local", "Lista de shows (abaixo)"], ["google", "Google Calendar público (iCal)"]] })}

        <fieldset data-calendar-fields>
          <legend>Integração Google Calendar</legend>
          <div class="cfg-field">
            <label><input type="checkbox" data-bind="agenda.calendar.enabled"${cal.enabled ? " checked" : ""}> Ativar integração</label>
            <p class="cfg-hint">Quando ativa com fonte "google", o site busca os eventos do calendário público informado.</p>
            <p class="cfg-hint"><strong>Atenção (CORS):</strong> um calendário público pode ter a leitura direta bloqueada pelo navegador. Nesse caso, o site exibe automaticamente a agenda local — sem API Key e sem backend. Para hospedagem estática, a alternativa recomendada é uma cópia do arquivo .ics dentro do próprio projeto, no campo “URL pública do iCal” abaixo.</p>
          </div>
          <div class="cfg-grid">
            ${field({ label: "ID do calendário", key: "agenda.calendar.calendarId", value: cal.calendarId || "", placeholder: "abc123@group.calendar.google.com" })}
            ${field({ label: "URL pública do iCal (alternativa)", key: "agenda.calendar.publicUrl", value: cal.publicUrl || "", type: "url", placeholder: "https://calendar.google.com/calendar/ical/…/public/basic.ics", hint: "Recomendado em hospedagem estática: baixe o .ics do Google Calendar, salve uma cópia no projeto (ex.: data/calendar.ics) e aponte para este campo. Atualizar a agenda exige recolocar o arquivo — não há sincronização automática." })}
          </div>
        </fieldset>

        <fieldset>
          <legend>Lista de shows (fonte local)</legend>
          ${shows.length === 0 ? `<p class="cfg-list-empty">Nenhum show cadastrado — a agenda ficará vazia, o que também é válido.</p>` : ""}
          <ul class="cfg-list">
            ${shows.map(showRow).join("")}
          </ul>
          <div class="cfg-list-actions">
            <button type="button" class="btn btn--ghost" data-action="add" data-add-list="agenda.shows" data-add-item='{"title":"","date":"","startTime":"","endTime":"","venue":"","city":"","state":"","address":"","description":"","mapUrl":"","ticketUrl":"","status":"confirmed"}'>+ Adicionar show</button>
          </div>
        </fieldset>
      </form>`;
  };

  /* ---------- Etapa: Theme (aparência) ---------- */
  const renderTheme = () => {
    const current = getState().themeId || "default";
    const cards = AVAILABLE_THEMES.map((id) => {
      const meta = cachedThemeMeta[id] || { name: id, description: "", version: "—" };
      const isCurrent = id === current;
      return `
        <article class="card cfg-theme-card" aria-pressed="${isCurrent}">
          <h3 class="cfg-theme-title">${escapeHTML(meta.name)}</h3>
          <p class="cfg-hint"><code>${escapeHTML(id)}</code> · v${escapeHTML(meta.version)}</p>
          <p>${escapeHTML(meta.description)}</p>
          <button type="button" class="btn ${isCurrent ? "btn--primary" : "btn--ghost"}" data-theme-apply="${escapeHTML(id)}"${isCurrent ? " aria-pressed=\"true\"" : ""}>
            ${isCurrent ? "Em uso ✓" : "Aplicar theme"}
          </button>
          ${isCurrent ? `<span class="cfg-theme-badge">Theme ativo</span>` : ""}
        </article>`;
    }).join("");
    return `
      <h2>Aparência (Theme)</h2>
      <p class="cfg-hint">O Theme troca tokens visuais (cores, fontes, formas) sem tocar na estrutura. A prévia completa fica na etapa "Visualizar".</p>
      <div class="cfg-theme-grid">${cards}</div>`;
  };

  /* ---------- Etapa: Configurações ---------- */
  const renderConfiguracoes = () => {
    const c = getState().configuracoes || {};
    return `
      <h2>Configurações</h2>
      <p class="cfg-hint">Ajustes gerais do site gerado. Tudo é salvo automaticamente no navegador.</p>
      <form class="cfg-form" onsubmit="return false;">
        ${field({ label: "Nome do site (arquivo do .zip)", key: "configuracoes.siteName", value: c.siteName || "", hint: "Gerará <nome>.zip — sem espaços ou acentos. Ex.: minha-banda-site" })}
      </form>
      <div class="cfg-section-gap">
        <button type="button" class="btn btn--ghost btn--danger" data-action="reset">↺ Restaurar dados de exemplo</button>
        <p class="cfg-hint">Volta ao estado inicial (Banda Exemplo). Útil para testar — apaga suas edições deste navegador.</p>
      </div>`;
  };

  /* ---------- Etapa: Visualizar (preview com o CSS do Core + Theme) ---------- */
  const STATUS_LABELS = { confirmed: "Confirmado", cancelled: "Cancelado", postponed: "Adiado" };

  const shortDateParts = (dateStr) => {
    const [y, m, d] = String(dateStr || "").split("-").map(Number);
    if (!y || !m || !d) return { day: "--", month: "" };
    const month = new Date(y, m - 1, 1).toLocaleString("pt-BR", { month: "short" }).replace(".", "");
    return { day: String(d), month };
  };

  const formatPreviewDate = (dateStr) => {
    const [y, m, d] = String(dateStr || "").split("-").map(Number);
    if (!y || !m || !d) return "";
    try { return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }); }
    catch { return dateStr; }
  };

  const pickNextShow = (shows) => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = (shows || [])
      .filter((s) => s && s.date && s.title && s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] || null;
  };

  const BRAND_MARK = `<svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><path d="M12 40c6-14 12-14 18 0s12 14 18 0" fill="none" stroke="url(#brand-grad)" stroke-width="7" stroke-linecap="round"/></svg>`;

  /* Réplica do DOM gerado por src/components/show-card.js (mesmas classes). */
  const previewShowCard = (show) => {
    if (!show) return `<p class="agenda-empty">Nenhum show agendado no momento.</p>`;
    const { day, month } = shortDateParts(show.date);
    const status = show.status || "confirmed";
    const cancelled = status === "cancelled";
    const place = [show.venue, [show.city, show.state].filter(Boolean).join(" - ")].filter(Boolean).join(" · ");
    const when = [formatPreviewDate(show.date), show.startTime ? `· ${show.startTime}${show.endTime ? `–${show.endTime}` : ""}` : ""].filter(Boolean).join(" ");
    return `<article class="card show-card${cancelled ? " show-card--cancelled" : ""}">
      <p class="event-card__date"><time datetime="${escapeHTML(show.date)}"><span class="event-card__day">${escapeHTML(day)}</span><span class="event-card__month">${escapeHTML(month)}</span></time></p>
      <div class="show-card__body">
        <div class="show-card__head">
          <h3 class="card__title">${escapeHTML(show.title)}</h3>
          <span class="badge badge--${escapeHTML(status)}">${escapeHTML(STATUS_LABELS[status] || status)}</span>
        </div>
        <p class="show-card__when"><time datetime="${escapeHTML(show.date)}">${escapeHTML(when)}</time></p>
        ${place ? `<p class="card__meta">${escapeHTML(place)}</p>` : ""}
        ${show.description ? `<p class="show-card__desc">${escapeHTML(show.description)}</p>` : ""}
        ${show.ticketUrl && !cancelled ? `<div class="show-card__actions"><a class="btn btn--primary btn--sm" href="${escapeHTML(show.ticketUrl)}" target="_blank" rel="noopener noreferrer">Ingressos <span aria-hidden="true">↗</span></a></div>` : ""}
      </div>
    </article>`;
  };

  const buildPreviewHtml = (state) => {
    const themeId = state.themeId || "default";
    const i = state.identidade || {};
    const links = [...(state.links?.social || []), ...(state.links?.custom || [])];
    const eyebrow = [[i.city, i.state].filter(Boolean).join(", "), i.genre].filter(Boolean).join(" · ");
    const logoImg = i.logo
      ? `<img class="brand__img" src="${i.logo}" alt="${escapeHTML(i.logoAlt || "")}">`
      : BRAND_MARK;
    const themeCss = cachedThemeCss[themeId] || "";
    return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="${escapeHTML(themeId)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prévia — ${escapeHTML(i.name || "Site do artista")}</title>
<link rel="stylesheet" href="../src/css/main.css">
<style>${themeCss}</style>
</head>
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <span class="brand">
      <span class="brand__logo">${logoImg}</span>
      <span class="brand__name">${escapeHTML(i.name || "Seu artista")}</span>
    </span>
  </div>
</header>
<main>
  <section class="hero" id="inicio">
    <div class="container hero__inner">
      <p class="hero__eyebrow">${escapeHTML(eyebrow)}</p>
      <h1>${escapeHTML(i.name || "Seu artista")}</h1>
      <p class="hero__tagline">${escapeHTML(i.tagline || "Descreva seu som no configurador.")}</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="#links">Ouvir</a>
        <a class="btn btn--ghost" href="#agenda">Ver agenda</a>
      </div>
    </div>
  </section>
  <section class="section" id="agenda">
    <div class="container">
      <header class="section__header">
        <p class="section__eyebrow">Agenda</p>
        <h2>Próximo show</h2>
      </header>
      ${previewShowCard(pickNextShow(state.agenda?.shows || []))}
    </div>
  </section>
  <section class="section" id="links">
    <div class="container">
      <header class="section__header">
        <p class="section__eyebrow">Links</p>
        <h2>Ouça e acompanhe</h2>
      </header>
      ${links.length ? `<ul class="chip-list" role="list">${links.map((l) => `<li><a class="chip" href="${escapeHTML(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(l.label || "Link")} <span aria-hidden="true">↗</span></a></li>`).join("")}</ul>` : `<p class="agenda-empty">Nenhum link cadastrado ainda.</p>`}
    </div>
  </section>
</main>
<footer class="site-footer">
  <div class="container site-footer__inner">
    <p>${escapeHTML(i.name || "Seu artista")} · Feito com Onda Artist Kit</p>
  </div>
</footer>
</body>
</html>`;
  };

  const DEVICE_WIDTHS = { desktop: "100%", tablet: "768px", mobile: "390px" };
  let previewDevice = "desktop";

  const renderPreview = () => `
    <h2>Visualizar</h2>
    <p class="cfg-hint">Prévia ao vivo com o CSS do Core e o Theme ativo. Alterações aparecem aqui automaticamente.</p>
    <div class="cfg-preview-controls" role="group" aria-label="Tamanho do dispositivo">
      <button type="button" class="btn btn--ghost cfg-device-btn" data-device="desktop" aria-pressed="${previewDevice === "desktop"}">🖥 Desktop</button>
      <button type="button" class="btn btn--ghost cfg-device-btn" data-device="tablet" aria-pressed="${previewDevice === "tablet"}">📱 Tablet</button>
      <button type="button" class="btn btn--ghost cfg-device-btn" data-device="mobile" aria-pressed="${previewDevice === "mobile"}">📲 Celular</button>
    </div>
    <div class="cfg-preview-frame">
      <iframe class="cfg-preview-iframe" id="cfg-preview-frame" title="Pré-visualização do site do artista"></iframe>
    </div>`;

  const refreshPreview = () => {
    const frame = qs("#cfg-preview-frame");
    if (!frame) return;
    frame.style.width = DEVICE_WIDTHS[previewDevice] || "100%";
    frame.style.height = "640px";
    frame.srcdoc = buildPreviewHtml(getState());
  };

  const schedulePreviewRefresh = () => {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(refreshPreview, 300);
  };

  /* ---------- Etapa: Exportar ---------- */
  const buildChecklist = () => {
    const s = getState();
    const items = [];
    const push = (level, text) => items.push({ level, text });

    if (!s.identidade?.name?.trim()) push("block", "Nome do artista/banda é obrigatório (etapa Identidade).");
    else push("ok", `Nome: ${s.identidade.name}`);

    if (!s.identidade?.tagline?.trim() && !(s.release?.biography || []).length) {
      push("warn", "Sem tagline nem biografia — o hero ficará genérico.");
    } else push("ok", "Apresentação definida (tagline/biografia).");

    const links = [...(s.links?.social || []), ...(s.links?.custom || [])];
    const withoutUrl = links.filter((l) => !String(l.url || "").trim());
    const invalid = links.filter((l) => String(l.url || "").trim() && !isValidUrl(l.url));
    if (!links.length) push("warn", "Nenhum link cadastrado — a seção Links ficará vazia.");
    else if (invalid.length) push("block", `URLs inválidas: ${invalid.map((l) => l.label || l.url).join(", ")}. Corrija na etapa Links.`);
    else push("ok", `${links.length} link(s) configurado(s).`);
    if (withoutUrl.length) push("warn", `${withoutUrl.length} link(s) sem URL serão ignorados.`);

    const shows = s.agenda?.shows || [];
    const badShows = shows.filter((sh) => (sh.title || sh.date) && !(sh.title && isValidDate(sh.date)));
    if (shows.length && badShows.length) {
      push("warn", `${badShows.length} show(s) com título sem data (ou vice-versa) serão ignorados pelo Core.`);
    } else push("ok", shows.length ? `${shows.length} show(s) na agenda.` : "Agenda vazia (ok — você pode preencher depois).");

    if (s.agenda?.calendar?.mode === "google" && s.agenda?.calendar?.enabled) {
      if (!s.agenda.calendar.calendarId && !s.agenda.calendar.publicUrl) {
        push("block", "Google Calendar ativado sem ID nem URL pública do iCal.");
      } else {
        push("ok", "Google Calendar configurado (fonte google).");
        push("warn", "O feed público do Google pode ter a leitura bloqueada pelo navegador (CORS) — nesse caso o site usa a agenda local automaticamente. Para hospedagem estática, prefira um .ics dentro do projeto (ex.: data/calendar.ics) na URL pública do iCal.");
      }
    } else push("ok", "Fonte da agenda: lista local de shows.");

    const email = s.release?.booking?.email || "";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) push("warn", "E-mail de booking parece inválido.");
    return items;
  };

  const renderExportar = () => {
    const checklist = buildChecklist();
    const hasBlock = checklist.some((item) => item.level === "block");
    const themeId = getState().themeId || "default";
    return `
      <h2>Exportar site</h2>
      <p class="cfg-hint">Gera um .zip com o site estático completo: Core + Theme + seus dados + imagens. Extraia, teste no navegador e publique — o guia vem dentro.</p>
      <h3>Checklist</h3>
      <ul class="cfg-checklist">
        ${checklist.map((item) => `<li class="${item.level}"><span aria-hidden="true">${item.level === "ok" ? "✓" : item.level === "warn" ? "!" : "✕"}</span> ${escapeHTML(item.text)}</li>`).join("")}
      </ul>
      <h3>O que vai no .zip</h3>
      <ul class="cfg-file-tree">
        <li><strong>index.html</strong>, release.html, agenda.html</li>
        <li><strong>data/</strong> — band.json, release.json, links.json, shows.json, site.json, calendar.json</li>
        <li><strong>src/</strong> — CSS, JS e componentes do Core</li>
        <li><strong>themes/${escapeHTML(themeId)}/</strong> — theme.json + theme.css${themeId !== "default" ? " (+ fallback default)" : ""}</li>
        <li><strong>assets/</strong> — favicon e imagens enviadas</li>
        <li><strong>COMO-PUBLICAR.txt</strong> — guia de publicação (GitHub Pages e afins)</li>
      </ul>
      <div class="cfg-list-actions">
        <button type="button" class="btn btn--primary" data-action="export"${hasBlock ? " disabled" : ""}>📦 Gerar e baixar .zip</button>
        ${hasBlock ? `<p class="cfg-hint">Corrija os itens em vermelho para habilitar o botão.</p>` : ""}
      </div>
      <div class="cfg-export-status" id="cfg-export-status" aria-live="polite"></div>`;
  };

  const handleExport = async (button) => {
    if (!button || button.disabled) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Gerando…";
    try {
      const result = await window.OndaExporter.exportSite();
      toast(`Site exportado: ${result.count} arquivos no .zip.`);
      const status = qs("#cfg-export-status");
      if (status) status.innerHTML = `<p>✅ <strong>${escapeHTML(String(result.count))}</strong> arquivos gerados. Confira a pasta de downloads e siga o <em>COMO-PUBLICAR.txt</em>.</p>`;
    } catch (error) {
      console.error("[Configurador] Falha ao exportar:", error);
      toast("Falha ao exportar o site.", true);
      const status = qs("#cfg-export-status");
      if (status) status.innerHTML = `<p>❌ Falha ao gerar o .zip: ${escapeHTML(String(error?.message || error))}</p>`;
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  };

  /* ---------- Dispatcher e binding ---------- */
  const RENDERERS = {
    identidade: renderIdentidade,
    release: renderRelease,
    links: renderLinks,
    agenda: renderAgenda,
    theme: renderTheme,
    configuracoes: renderConfiguracoes,
    preview: renderPreview,
    exportar: renderExportar
  };

  const coerceBindValue = (el) => {
    if (el.type === "checkbox") return el.checked;
    if (el.type === "number") return el.value === "" ? null : Number(el.value);
    if (el.dataset.lines !== undefined) return el.value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    return el.value;
  };

  /* Reconstrói o item a partir de todos os inputs da linha (inclui chaves aninhadas). */
  const buildRowItem = (scope, listKey, index) => {
    const inputs = qsa(`[data-row-list="${listKey}"][data-row-index="${index}"]`, scope);
    const item = {};
    for (const input of inputs) {
      let value = input.value;
      if (input.type === "number") value = value === "" ? null : Number(value);
      if (input.dataset.rowField.includes(".")) setDeep(item, input.dataset.rowField, value);
      else item[input.dataset.rowField] = value;
    }
    return item;
  };

  /* ---------- Inicialização ---------- */
  const init = async () => {
    await cacheThemeCss();

    const content = qs("#cfg-step-content");

    /* Digitação: campos simples (data-bind) e linhas de listas (data-row-list). */
    content.addEventListener("input", (event) => {
      const target = event.target;
      if (target.matches("[data-bind]")) {
        const value = coerceBindValue(target);
        setItem(target.dataset.bind, value);
        // Selecionar "google" como fonte ativa a integração automaticamente.
        if (target.dataset.bind === "agenda.calendar.mode" && value === "google") {
          setItem("agenda.calendar.enabled", true);
        }
        return;
      }
      if (target.matches("[data-row-list]")) {
        const listKey = target.dataset.rowList;
        const index = Number(target.dataset.rowIndex);
        updateListItem(listKey, index, buildRowItem(content, listKey, index));
      }
    });

    /* Upload de imagens (logo/foto) → dataURL no estado. */
    content.addEventListener("change", async (event) => {
      const target = event.target;
      if (!target.matches("[data-upload]")) return;
      const file = target.files && target.files[0];
      if (!file) return;
      try {
        const dataUrl = await readImageFile(file);
        setItem(target.dataset.upload, dataUrl);
        renderStep();
        toast("Imagem carregada.");
      } catch (error) {
        toast(error.message, true);
        target.value = "";
      }
    });

    /* Cliques: navegação, dispositivos, themes, ações de lista, export/reset. */
    content.addEventListener("click", (event) => {
      const goto = event.target.closest("[data-goto-step]");
      if (goto) { event.preventDefault(); goToStep(goto.dataset.gotoStep); return; }

      const device = event.target.closest("[data-device]");
      if (device) {
        previewDevice = device.dataset.device;
        qsa("[data-device]", content).forEach((b) => b.setAttribute("aria-pressed", String(b === device)));
        refreshPreview();
        return;
      }

      const themeButton = event.target.closest("[data-theme-apply]");
      if (themeButton) {
        setItem("themeId", themeButton.dataset.themeApply);
        renderStep();
        toast(`Theme "${themeButton.dataset.themeApply}" aplicado.`);
        return;
      }

      const action = event.target.closest("[data-action]");
      if (!action) return;
      const name = action.dataset.action;
      if (name === "add") {
        try {
          addListItem(action.dataset.addList, JSON.parse(action.dataset.addItem));
          renderStep();
        } catch { toast("Não foi possível adicionar o item.", true); }
        return;
      }
      const list = action.dataset.list;
      const index = Number(action.dataset.index);
      if (name === "remove") { removeListItem(list, index); renderStep(); return; }
      if (name === "move-up") { moveListItem(list, index, index - 1); renderStep(); return; }
      if (name === "move-down") { moveListItem(list, index, index + 1); renderStep(); return; }
      if (name === "export") { handleExport(action); return; }
      if (name === "reset" && window.confirm("Restaurar os dados de exemplo? Suas edições neste navegador serão perdidas.")) {
        resetState();
        renderStep();
        toast("Dados de exemplo restaurados.");
      }
    });

    window.addEventListener("hashchange", () => goToStep(location.hash.replace("#", "")));

    /* Estado mudou: preview em tempo real + badge de theme. */
    window.addEventListener("onda-state-change", () => {
      if (currentStep === "preview") schedulePreviewRefresh();
      else if (currentStep === "theme") renderStep();
    });

    const initial = location.hash.replace("#", "");
    currentStep = RENDERERS[initial] ? initial : "identidade";
    renderSteps();
    renderStep();
  };

  window.OndaConfigUI = { init, goToStep, getState };
})();