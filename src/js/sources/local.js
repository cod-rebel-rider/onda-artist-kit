/* ==========================================================================
   Onda Artist Kit — Core
   sources/local.js — fonte local de eventos (data/shows.json)

   Fonte padrão do projeto: não depende de nenhum serviço externo.
   A lista bruta do JSON é validada/normalizada pelo Agenda Core e
   entregue no formato comum esperado pela interface.
   ========================================================================== */

(() => {
  "use strict";

  const load = async () => {
    if (!window.OndaShows.loadLocalShows) {
      throw new Error("Agenda Core (shows.js) não carregado.");
    }
    return window.OndaShows.loadLocalShows();
  };

  window.OndaSourceLocal = { load };
})();