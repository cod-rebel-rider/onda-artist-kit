/* ==========================================================================
   Onda Artist Kit — Core
   agenda.js — página de agenda (agenda.html)

   Pede os eventos à camada de dados (OndaData), independente da fonte
   (local ou Google Calendar), classifica pela Agenda Core e renderiza
   com o ShowCard. Gerencia estados de carregamento, erro amigável,
   fallback e o indicador opcional de fonte.

   Requer content.js, shows.js, sources/*, data.js e show-card.js antes.
   ========================================================================== */

(() => {
  "use strict";

  const { renderList } = window.OndaContent;
  const { classifyShows } = window.OndaShows;
  const { render } = window.OndaShowCard;

  const statusEl = document.querySelector("[data-agenda-status]");
  const indicatorEl = document.querySelector("[data-google-indicator]");

  const setStatus = (text, { error = false } = {}) => {
    if (!statusEl) {
      return;
    }
    if (text) {
      statusEl.textContent = text;
      statusEl.hidden = false;
      statusEl.classList.toggle("agenda-status--error", error);
    } else {
      statusEl.hidden = true;
      statusEl.textContent = "";
    }
  };

  const hydrate = async () => {
    setStatus("Carregando agenda...");

    let result;
    try {
      result = await window.OndaData.getAgenda();
    } catch (error) {
      console.warn("[Onda] Agenda indisponível.", error);
      result = { events: [], source: "local", note: "error" };
    }

    const { upcoming, past } = classifyShows(result.events);

    renderList("[data-upcoming]", upcoming.map(render));
    renderList("[data-past]", past.map(render));

    const emptyMessage = document.querySelector("[data-empty-upcoming]");
    if (emptyMessage) {
      emptyMessage.hidden = upcoming.length > 0;
    }

    const pastSection = document.getElementById("anteriores");
    if (pastSection) {
      pastSection.hidden = past.length === 0;
    }

    /* Mensagens amigáveis; detalhes técnicos ficam no console. */
    if (result.note === "fallback") {
      setStatus("Não foi possível carregar a agenda externa — exibindo a agenda local.", { error: true });
    } else if (result.note === "error") {
      setStatus("Não foi possível carregar a agenda neste momento.", { error: true });
    } else {
      setStatus("");
    }

    if (indicatorEl) {
      const hasEvents = upcoming.length + past.length > 0;
      indicatorEl.hidden = !(result.source === "google" && result.note === "ok" && hasEvents);
    }
  };

  hydrate().catch((error) => {
    setStatus("Não foi possível carregar a agenda neste momento.", { error: true });
    console.warn("[Onda] Agenda indisponível — exibindo conteúdo de demonstração estático.", error);
  });
})();