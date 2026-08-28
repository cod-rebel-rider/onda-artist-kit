/* ==========================================================================
   Onda Artist Kit — Core
   shows.js — Agenda Core (data loader + classificação + formatação)

   Pipeline: data/shows.json → validação/normalização → classificação
   (próximos/passados) → ordenação → renderização (ShowCard).

   Datas são armazenadas em ISO (YYYY-MM-DD) e horários em HH:mm; a
   formatação amigável usa Intl com o locale do projeto (pt-BR). Eventos
   são locais: nenhuma conversão de fuso horário é aplicada.
   ========================================================================== */

(() => {
  "use strict";

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const STATUS_LABELS = {
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    postponed: "Adiado"
  };

  /* Converte "YYYY-MM-DD" em Date local (meia-noite) ou null se inválida. */
  const parseDate = (value) => {
    if (typeof value !== "string" || !DATE_RE.test(value)) {
      return null;
    }
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null; /* datas inexistentes (ex.: 30/02) */
    }
    return date;
  };

  /* Monta o datetime local do evento (data + horário, sem fuso). */
  const showDateTime = (show) => {
    const date = parseDate(show.date);
    if (!date) {
      return null;
    }
    if (show.startTime) {
      const [hours, minutes] = show.startTime.split(":").map(Number);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    }
    return date;
  };

  /* Valida e normaliza um show bruto; retorna { ok, show?, reason? }. */
  const normalizeShow = (raw, index) => {
    if (!raw || typeof raw !== "object") {
      return { ok: false, reason: "entrada não é um objeto" };
    }
    const warn = (reason) => ({ ok: false, reason });

    if (!raw.title || typeof raw.title !== "string") {
      return warn("show sem título");
    }
    if (!parseDate(raw.date)) {
      return warn(`data inválida (${JSON.stringify(raw.date)})`);
    }

    const id = typeof raw.id === "string" && raw.id.trim() !== ""
      ? raw.id
      : `show-sem-id-${index + 1}`;
    if (id !== raw.id) {
      console.warn(`[Onda] Show "${raw.title}" sem id — usando identificador provisório "${id}".`);
    }

    const clean = {
      id,
      title: raw.title,
      date: raw.date,
      startTime: null,
      endTime: null,
      venue: raw.venue ?? "",
      city: raw.city ?? "",
      state: raw.state ?? "",
      country: raw.country ?? "",
      description: raw.description ?? "",
      address: raw.address ?? "",
      mapUrl: raw.mapUrl ?? "",
      ticketUrl: raw.ticketUrl ?? "",
      status: "confirmed",
      originalDate: null,
      recurring: Boolean(raw.recurring) /* eventos recorrentes (ex.: Google Calendar) */
    };

    if (raw.startTime) {
      if (TIME_RE.test(raw.startTime)) {
        clean.startTime = raw.startTime;
      } else {
        console.warn(`[Onda] Show "${raw.title}": horário inicial inválido (${JSON.stringify(raw.startTime)}) — evento exibido sem horário.`);
      }
    }
    if (raw.endTime) {
      if (TIME_RE.test(raw.endTime) && clean.startTime) {
        clean.endTime = raw.endTime;
      } else {
        console.warn(`[Onda] Show "${raw.title}": horário final inválido ou sem horário inicial — ignorado.`);
      }
    }
    if (raw.status && Object.hasOwn(STATUS_LABELS, raw.status)) {
      clean.status = raw.status;
    } else if (raw.status) {
      console.warn(`[Onda] Show "${raw.title}": status desconhecido (${JSON.stringify(raw.status)}) — tratado como confirmado.`);
    }
    if (raw.originalDate) {
      if (parseDate(raw.originalDate)) {
        clean.originalDate = raw.originalDate;
      } else {
        console.warn(`[Onda] Show "${raw.title}": originalDate inválido — ignorado.`);
      }
    }
    return { ok: true, show: clean };
  };

  /* Separa próximos (a partir de hoje) e passados, já ordenados.
     Não depende da ordem do JSON nem da existência de horário. */
  const classifyShows = (shows, now = new Date()) => {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcoming = [];
    const past = [];
    shows.forEach((show) => {
      const datetime = showDateTime(show);
      if (!datetime) {
        return;
      }
      if (datetime >= startOfToday) {
        upcoming.push(show);
      } else {
        past.push(show);
      }
    });
    upcoming.sort((a, b) => showDateTime(a) - showDateTime(b));
    past.sort((a, b) => showDateTime(b) - showDateTime(a));
    return { upcoming, past };
  };

  /* Valida uma lista bruta, ignorando eventos problemáticos com aviso. */
  const normalizeShows = (rawShows) => {
    const valid = [];
    (rawShows ?? []).forEach((raw, index) => {
      const result = normalizeShow(raw, index);
      if (result.ok) {
        valid.push(result.show);
      } else {
        console.warn(`[Onda] Show ignorado (posição ${index + 1}): ${result.reason}.`, raw);
      }
    });
    return valid;
  };

  /* "2026-09-12" → "sábado, 12 de setembro de 2026" (Intl, pt-BR). */
  const formatFullDate = (dateStr) => {
    const date = parseDate(dateStr);
    if (!date) {
      return "";
    }
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  /* "2026-09-12" → "12 SET" (para badges e listas curtas). */
  const formatShortDate = (dateStr) => {
    const date = parseDate(dateStr);
    if (!date) {
      return "";
    }
    const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
    const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase();
    return `${day} ${month}`;
  };

  const statusLabel = (status) => STATUS_LABELS[status] ?? STATUS_LABELS.confirmed;

  let allShows = [];

  /* Registra os eventos carregados (qualquer fonte) para o ShowCard
     resolver ids na exportação .ics. */
  const setAll = (events) => {
    allShows = events ?? [];
  };

  /* Carrega e normaliza diretamente data/shows.json (fonte local padrão). */
  const loadLocalShows = async () => {
    const data = await window.OndaContent.loadJSON("data/shows.json");
    return normalizeShows(data.shows ?? []);
  };

  const getById = (id) => allShows.find((show) => show.id === id) ?? null;

  window.OndaShows = {
    setAll,
    loadLocalShows,
    normalizeShows,
    classifyShows,
    parseDate,
    showDateTime,
    formatFullDate,
    formatShortDate,
    statusLabel,
    getById
  };
})();
