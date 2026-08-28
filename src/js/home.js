/* ==========================================================================
   Onda Artist Kit — Core
   home.js — hidratação da página inicial a partir de data/*.json

   Requer content.js carregado antes deste arquivo. Em caso de falha
   (ex.: aberto via file://), o conteúdo estático de demonstração permanece.
   ========================================================================== */

(() => {
  "use strict";

  const { loadJSON, setTextAll, setParagraphs, renderDiscography, renderLinks } = window.OndaContent;

  const hydrate = async () => {
    const [band, linksData, releaseData] = await Promise.all([
      loadJSON("data/band.json"),
      loadJSON("data/links.json"),
      loadJSON("data/release.json")
    ]);

    /* Hero e marca */
    setTextAll("[data-band-name]", band.name);
    setTextAll("[data-hero-eyebrow]", `${band.city}, ${band.state} · ${band.genre}`);
    setTextAll("[data-band-tagline]", band.tagline);

    /* Sobre */
    setParagraphs("[data-about-text]", band.about);
    const ficha = {
      origem: `${band.city}, ${band.state}`,
      genero: band.genre,
      desde: band.founded,
      formacao: `${(band.members ?? []).length} integrantes`
    };
    Object.entries(ficha).forEach(([key, value]) => {
      setTextAll(`[data-ficha="${key}"]`, String(value));
    });

    /* Música (discografia compartilhada com o release) */
    renderDiscography("[data-discography]", releaseData.discography, { showDescription: false });

    /* Contato para contratação */
    const booking = releaseData.booking ?? {};
    setTextAll("[data-booking-description]", booking.description);
    const emailLink = document.querySelector("[data-booking-email]");
    if (emailLink) {
      if (booking.email) {
        emailLink.href = `mailto:${booking.email}`;
        emailLink.textContent = booking.email;
        emailLink.hidden = false;
      } else {
        emailLink.hidden = true;
      }
    }

    /* Redes e links */
    renderLinks("[data-links]", linksData.links);

    /* Próximo show (usa a fonte de dados — local ou Google Calendar) */
    if (window.OndaData && window.OndaShowCard) {
      const { events } = await window.OndaData.getAgenda();
      const { upcoming } = window.OndaShows.classifyShows(events);
      const nextShow = upcoming.find((show) => show.status !== "cancelled");
      const container = document.querySelector("[data-next-show]");
      const emptyMessage = document.querySelector("[data-next-show-empty]");
      if (container) {
        if (nextShow) {
          container.innerHTML = window.OndaShowCard.render(nextShow);
        } else {
          container.hidden = true;
          if (emptyMessage) {
            emptyMessage.hidden = false;
          }
        }
      }
    }
  };

  hydrate().catch((error) => {
    console.warn("[Onda] Conteúdo JSON indisponível — exibindo conteúdo de demonstração estático.", error);
  });
})();