/* ==========================================================================
   Onda Artist Kit — Core
   sources/google-icalendar.js — fonte pública do Google Calendar (ICS)

   Lê um calendário público do Google pela alimentação iCal oficial
   (Public address in iCal format), SEM API Key, sem OAuth e sem backend.
   O conteúdo .ics é convertido para o formato comum do Core (mesmos
   campos do data/shows.json) antes de chegar à Agenda Core.

   Fonte da URL (recurso público oficial):
   https://calendar.google.com/calendar/ical/{calendarId}/public/basic.ics

   Limitações técnicas conhecidas (tratadas e documentadas):
   - O navegador pode bloquear o fetch por CORS; nesse caso a camada de
     dados faz fallback automático para data/shows.json.
   - Eventos recorrentes chegam com RRULE não expandido: exibimos a primeira
     ocorrência e documentamos a limitação (sem sistema próprio de recorrência).
   - Se o calendário não for público, a alimentação falha e o fallback local
     é usado.
   ========================================================================== */

(() => {
  "use strict";

  const { normalizeShows, parseDate } = window.OndaShows;

  const cleanId = (value) => String(value).replace(/[^a-zA-Z0-9._-]/g, "-");

  /* Remove os escapes de texto do iCal (\, \; \\ \n). */
  const unescapeText = (value) =>
    String(value ?? "")
      .replace(/\\n/g, " ")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\");

  /* Parsea DTSTART/DTEND do ICS em { date: "YYYY-MM-DD", time: "HH:mm" | "" }.
     - valores sem fuso (naive) usam data/hora locais (política da Fase 4);
     - valores com Z/offset são convertidos para o fuso local do visitante. */
  const parseIcsDateTime = (startOrNull) => {
    if (!startOrNull || !startOrNull.value) {
      return null;
    }
    const value = String(startOrNull.value).trim();
    const pad = (n) => String(n).padStart(2, "0");

    const dateOnly = startOrNull.valueType === "DATE" || /^\d{8}$/.test(value);
    if (dateOnly) {
      const d = value.match(/^(\d{4})(\d{2})(\d{2})/);
      if (!d) {
        return null;
      }
      const date = `${d[1]}-${d[2]}-${d[3]}`;
      return parseDate(date) ? { date, time: "" } : null;
    }

    const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z|[+-]\d{4})?$/);
    if (!m) {
      return null;
    }
    const year = +m[1];
    const month = +m[2];
    const day = +m[3];
    const hour = +m[4];
    const minute = +m[5];
    const second = +(m[6] ?? 0);
    const suffix = m[7];

    let local;
    if (suffix === "Z") {
      local = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    } else if (suffix) {
      const sign = suffix.charAt(0) === "+" ? 1 : -1;
      const offHours = +suffix.slice(1, 3);
      const offMinutes = +suffix.slice(3, 5);
      const utcMillis =
        Date.UTC(year, month - 1, day, hour, minute, second) -
        sign * (offHours * 3600 + offMinutes * 60) * 1000;
      local = new Date(utcMillis);
    } else {
      local = new Date(year, month - 1, day, hour, minute, second);
    }
    if (Number.isNaN(local.getTime())) {
      return null;
    }
    const date = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
    const time = `${pad(local.getHours())}:${pad(local.getMinutes())}`;
    return { date, time };
  };

/* Parseta um texto ICS (desdobrando linhas) e devolve os blocos VEVENT
     com propriedades úteis: { uid, summary, description, location,
     dtstart, dtend, status, rrule, url }. */
  const parseIcs = (text) => {
    const rawLines = [];
    let current = "";
    String(text).split(/\r?\n/).forEach((line) => {
      if (/^[ \t]/.test(line)) {
        current += line.slice(1);
      } else {
        if (current) {
          rawLines.push(current);
        }
        current = line;
      }
    });
    if (current) {
      rawLines.push(current);
    }

    const events = [];
    let event = null;
    rawLines.forEach((line) => {
      if (line === "BEGIN:VEVENT") {
        event = {};
        return;
      }
      if (line === "END:VEVENT") {
        if (event) {
          events.push(event);
        }
        event = null;
        return;
      }
      if (!event) {
        return;
      }
      const colon = line.indexOf(":");
      if (colon === -1) {
        return;
      }
      let key = line.slice(0, colon);
      const value = line.slice(colon + 1);
      let valueType = null;
      let tzid = null;
      const semi = key.indexOf(";");
      if (semi !== -1) {
        const params = key.slice(semi + 1);
        key = key.slice(0, semi);
        params.split(";").forEach((param) => {
          const eq = param.indexOf("=");
          if (eq === -1) {
            return;
          }
          const name = param.slice(0, eq).toUpperCase();
          const raw = param.slice(eq + 1);
          if (name === "VALUE") {
            valueType = raw.toUpperCase();
          } else if (name === "TZID") {
            tzid = raw;
          }
        });
      }
      const mapped = key.toUpperCase();
      if (mapped === "UID") {
        event.uid = value;
      } else if (mapped === "SUMMARY") {
        event.summary = value;
      } else if (mapped === "DESCRIPTION") {
        event.description = value;
      } else if (mapped === "LOCATION") {
        event.location = value;
      } else if (mapped === "DTSTART") {
        event.dtstart = { value, valueType, tzid };
      } else if (mapped === "DTEND") {
        event.dtend = { value, valueType, tzid };
      } else if (mapped === "STATUS") {
        event.status = value.toUpperCase();
      } else if (mapped === "RRULE") {
        event.rrule = value;
      } else if (mapped === "URL") {
        event.url = value;
      }
    });
    return events;
  };

/* Converte um VEVENT do ICS no formato comum do Core
     (mesmo esquema do data/shows.json). Retorna null se inválido. */
  const toEvent = (content) => {
    const start = parseIcsDateTime(content.dtstart);
    if (!start || !start.date) {
      return null;
    }
    const end = content.dtend ? parseIcsDateTime(content.dtend) : null;
    const rawStatus = (content.status ?? "CONFIRMED").toUpperCase();
    const status = rawStatus === "CANCELED" ? "cancelled" : "confirmed";
    const location = unescapeText(content.location);
    const event = {
      id: content.uid ? `google-${cleanId(content.uid)}` : `google-${start.date}-${cleanId(content.summary ?? "evento")}`,
      title: unescapeText(content.summary) || "Evento sem título",
      date: start.date,
      startTime: start.time || "",
      endTime: end?.time || "",
      venue: location,
      city: "",
      state: "",
      country: "",
      description: content.description ? unescapeText(content.description) : "",
      address: "",
      mapUrl: "",
      ticketUrl: content.url ?? "",
      status
    };
    if (content.rrule) {
      /* Recorrência: exibimos a primeira ocorrência (sem sistema próprio
         de recorrência — limitação documentada). */
      event.recurring = true;
    }
    return event;
  };

  /* Monta a URL pública do ICS do calendário. Aceita também uma URL
     explícita (publicUrl), por exemplo um arquivo .ics local/espelhado. */
  const buildUrl = (config) => {
    const explicit = (config.publicUrl ?? "").trim();
    if (explicit) {
      return explicit;
    }
    const id = (config.calendarId ?? "").trim();
    if (!id) {
      throw new Error("calendarId vazio");
    }
    return `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`;
  };

  /* Busca o ICS com timeout. Requisições externas são feitas apenas
     quando a integração está habilitada (mode: "google"). */
  const load = async (config) => {
    const url = buildUrl(config);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "text/calendar" }
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao acessar o calendário externo.`);
    }

    const text = await response.text();
    if (!String(text).trim().startsWith("BEGIN:VCALENDAR")) {
      throw new Error("Resposta do calendário externo não é um arquivo ICS válido.");
    }

    const events = parseIcs(text)
      .map(toEvent)
      .filter(Boolean);

    return normalizeShows(events);
  };

  window.OndaSourceGoogleCalendar = { load, buildUrl, parseIcs, toEvent };
})();