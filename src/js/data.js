/* ==========================================================================
   Onda Artist Kit — Core
   data.js — camada de fonte de dados da agenda (orquestrador)

   Decide a fonte dos eventos com base em data/calendar.json:

   mode "local"  → data/shows.json
   mode "google" → feed público do Google Calendar (ICS), com FALLBACK
                   automático para data/shows.json em qualquer falha
                   (indisponibilidade, CORS, configuração inválida, etc.).

   Nunca mistura as duas fontes (evita eventos duplicados). Retorna
   { events, source, note } — a interface apenas recebe eventos no
   formato comum e não sabe de onde vieram.
   ========================================================================== */

(() => {
  "use strict";

  const { loadJSON } = window.OndaContent;

  const DEFAULT_CONFIG = {
    enabled: false,
    mode: "local",
    provider: "google",
    calendarId: "",
    publicUrl: ""
  };

  /* Carrega a configuração; sem arquivo, a integração fica desativada. */
  const loadConfig = async () => {
    try {
      return { ...DEFAULT_CONFIG, ...(await loadJSON("data/calendar.json")) };
    } catch (error) {
      console.warn("[Onda] Sem data/calendar.json — integração Google desativada.", error);
      return { ...DEFAULT_CONFIG };
    }
  };

  const localResult = async (note) => {
    const events = await window.OndaSourceLocal.load();
    window.OndaShows.setAll(events);
    return { events, source: "local", note };
  };

  const getAgenda = async () => {
    const config = await loadConfig();

    /* Fonte local explícita ou integração desativada: nenhuma requisição externa. */
    if (config.enabled !== true || config.mode !== "google") {
      return localResult("local");
    }

    /* Ativado sem configuração válida → fallback (Cenário 4). */
    const hasExternal = Boolean(
      (config.calendarId ?? "").trim() || (config.publicUrl ?? "").trim()
    );
    if (!hasExternal) {
      console.warn("[Onda] Google Calendar habilitado, mas sem calendarId ou publicUrl — usando agenda local.");
      return localResult("fallback");
    }

    try {
      const events = await window.OndaSourceGoogleCalendar.load(config);
      if (events.length === 0) {
        /* Calendário público vazio não é falha: exibe o estado vazio. */
        window.OndaShows.setAll(events);
        return { events, source: "google", note: "empty" };
      }
      window.OndaShows.setAll(events);
      return { events, source: "google", note: "ok" };
    } catch (error) {
      /* Falha externa (rede, CORS, HTTP, ICS inválido) → fallback local.
         Detalhes técnicos ficam no console, nunca na interface. */
      console.warn("[Onda] Google Calendar indisponível — usando agenda local (fallback).", error);
      return localResult("fallback");
    }
  };

  window.OndaData = { getAgenda, loadConfig };
})();