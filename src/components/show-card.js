/* ==========================================================================
   Onda Artist Kit — Core
   components/show-card.js — componente ShowCard

   Renderiza um card de show a partir dos dados normalizados pela Agenda
   Core (src/js/shows.js). Reutiliza os padrões visuais do Core (card,
   badge, botões) e é usado por Home, Agenda e qualquer página futura.

   Responsabilidades: data, horário, título, status textual, local,
   cidade/UF, endereço, descrição, ingressos, mapa e exportação .ics
   (100% local, sem serviços externos).
   ========================================================================== */

(() => {
  "use strict";

  const { escapeHTML } = window.OndaContent;
  const { formatFullDate, formatShortDate, statusLabel } = window.OndaShows;

  /* Escapa texto conforme RFC 5545 (TEXT). */
  const icsEscape = (value) =>
    String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");

  /* "2026-09-12" + "20:00" → "20260912T200000" (hora local flutuante). */
  const icsLocal = (dateStr, timeStr) =>
    `${dateStr.replace(/-/g, "")}T${(timeStr ?? "00:00").replace(":", "")}00`;

  /* Compõe o LOCATION sem duplicar a cidade quando o endereço já a contém. */
  const icsLocation = (show) => {
    const parts = [show.venue, show.address];
    const cityState = [show.city, show.state].filter(Boolean).join(", ");
    if (cityState && !String(show.address ?? "").includes(cityState)) {
      parts.push(cityState);
    }
    return parts.filter(Boolean).join(", ");
  };

  /* Gera o conteúdo .ics do evento (título, data, horário, local, descrição). */
  const buildIcs = (show) => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Onda Artist Kit//Agenda//PT-BR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${show.id}@onda-artist-kit`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsLocal(show.date, show.startTime)}`
    ];
    if (show.endTime) {
      lines.push(`DTEND:${icsLocal(show.date, show.endTime)}`);
    }
    const location = icsLocation(show);
    if (location) {
      lines.push(`LOCATION:${icsEscape(location)}`);
    }
    lines.push(`SUMMARY:${icsEscape(show.title)}`);
    if (show.description) {
      lines.push(`DESCRIPTION:${icsEscape(show.description)}`);
    }
    if (show.ticketUrl) {
      lines.push(`URL:${show.ticketUrl}`);
    }
    lines.push("END:VEVENT", "END:VCALENDAR");
    return lines.join("\r\n") + "\r\n";
  };

  /* Dispara o download do arquivo .ics do evento. */
  const downloadIcs = (show) => {
    const blob = new Blob([buildIcs(show)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${show.id}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* Renderiza o card do show. Dados opcionais simplesmente não aparecem. */
  const render = (show) => {
    const [day, monthRaw] = formatShortDate(show.date).split(" ");
    const month = (monthRaw ?? "").toLowerCase();
    const cancelled = show.status === "cancelled";
    const when = [formatFullDate(show.date), show.startTime ? `· ${show.startTime}${show.endTime ? `–${show.endTime}` : ""}` : ""]
      .filter(Boolean)
      .join(" ");
    const place = [show.venue, [show.city, show.state].filter(Boolean).join(" - ")]
      .filter(Boolean)
      .join(" · ");

    const actions = [];
    if (show.mapUrl) {
      actions.push(`<a class="btn btn--ghost btn--sm" href="${escapeHTML(show.mapUrl)}" target="_blank" rel="noopener noreferrer">Ver no mapa <span aria-hidden="true">↗</span></a>`);
    }
    if (show.ticketUrl && !cancelled) {
      actions.push(`<a class="btn btn--primary btn--sm" href="${escapeHTML(show.ticketUrl)}" target="_blank" rel="noopener noreferrer">Ingressos <span aria-hidden="true">↗</span></a>`);
    }
    if (!cancelled) {
      actions.push(`<button class="btn btn--ghost btn--sm" type="button" data-ics="${escapeHTML(show.id)}">Adicionar ao calendário</button>`);
    }

    const note = show.status === "postponed" && show.originalDate
      ? `<p class="show-card__note">Adiado de ${escapeHTML(formatShortDate(show.originalDate))} para ${escapeHTML(formatShortDate(show.date))}.</p>`
      : "";

    return `<article class="card show-card${cancelled ? " show-card--cancelled" : ""}" data-show-id="${escapeHTML(show.id)}">
  <p class="event-card__date"><time datetime="${escapeHTML(show.date)}"><span class="event-card__day">${escapeHTML(day)}</span><span class="event-card__month">${escapeHTML(month)}</span></time></p>
  <div class="show-card__body">
    <div class="show-card__head">
      <h3 class="card__title">${escapeHTML(show.title)}</h3>
      <span class="badge badge--${escapeHTML(show.status)}">${escapeHTML(statusLabel(show.status))}</span>
    </div>
    <p class="show-card__when"><time datetime="${escapeHTML(show.date)}${show.startTime ? `T${escapeHTML(show.startTime)}:00` : ""}">${escapeHTML(when)}</time></p>
    <p class="card__meta">${escapeHTML(place)}</p>
    ${show.address ? `<p class="show-card__address">${escapeHTML(show.address)}</p>` : ""}
    ${show.description ? `<p class="show-card__desc">${escapeHTML(show.description)}</p>` : ""}
    ${note}
    ${actions.length > 0 ? `<div class="show-card__actions">${actions.join("")}</div>` : ""}
  </div>
</article>`;
  };

  /* Ação "Adicionar ao calendário" — delegação global, um único listener. */
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ics]");
    if (!button) {
      return;
    }
    const show = window.OndaShows.getById(button.getAttribute("data-ics"));
    if (show) {
      downloadIcs(show);
    } else {
      console.warn(`[Onda] Show "${button.getAttribute("data-ics")}" não encontrado para exportar .ics.`);
    }
  });

  window.OndaShowCard = { render, buildIcs, downloadIcs };
})();
