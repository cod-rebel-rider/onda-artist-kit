/* ==========================================================================
   Onda Artist Kit — Core
   agenda.js — página de agenda (agenda.html)

   Carrega a agenda via Agenda Core e renderiza:
   - próximos shows (com estado vazio dedicado);
   - shows anteriores (seção oculta quando não há histórico).

   Requer content.js, shows.js e components/show-card.js carregados antes.
   Sem servidor HTTP, o conteúdo estático de demonstração permanece.
   ========================================================================== */

(() => {
  "use strict";

  const { renderList } = window.OndaContent;
  const { loadShows } = window.OndaShows;
  const { render } = window.OndaShowCard;

  const hydrate = async () => {
    const { upcoming, past } = await loadShows();

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
  };

  hydrate().catch((error) => {
    console.warn("[Onda] Agenda indisponível — exibindo conteúdo de demonstração estático.", error);
  });
})();