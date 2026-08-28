/* ==========================================================================
   Onda Artist Kit — Configurador
   state.js — estado central do configurador (única fonte de verdade).
   ========================================================================== */

(() => {
  "use strict";

  const STORAGE_KEY = "onda-config";

  // Estado inicial padrão (artist demo para não iniciar em branco).
  const DEFAULT_STATE = {
    identidade: {
      name: "Banda Exemplo",
      tagline: "Som feito de madrugada: guitarras densas, sintetizadores frios e letras sobre a cidade depois que ela apaga as luzes.",
      city: "Brasília",
      state: "DF",
      country: "BR",
      genre: "Rock independente",
      founded: 2024,
      logo: null,
      logoAlt: "",
      photo: null,
      photoAlt: ""
    },
    release: {
      headline: "Release oficial para contratação e imprensa",
      biography: ["A Banda Exemplo é um projeto fictício de rock independente de Brasília criado para demonstrar o Onda Artist Kit."],
      musicalIdentity: "Rock alternativo com elementos de pós-punk, música eletrônica e estética urbana.",
      members: [
        { name: "Pessoa 1", role: "Vocal" },
        { name: "Pessoa 2", role: "Guitarra" },
        { name: "Pessoa 3", role: "Baixo" },
        { name: "Pessoa 4", role: "Bateria" }
      ],
      discography: [
        { title: "Maré Alta", type: "EP", year: 2026, description: "", links: { spotify: "https://open.spotify.com/" } }
      ],
      highlights: ["Projeto demonstrativo do Onda Artist Kit"],
      experience: "",
      booking: { description: "Para shows e parcerias, entre em contato.", email: "contato@bandaexemplo.com.br", phone: "" }
    },
    links: {
      social: [
        { label: "Instagram", url: "https://www.instagram.com/" },
        { label: "Spotify", url: "https://open.spotify.com/" }
      ],
      custom: []
    },
    agenda: {
      source: "local",
      calendar: { enabled: false, mode: "local", provider: "google", calendarId: "", publicUrl: "" },
      shows: []
    },
    themeId: "default",
    configuracoes: { siteName: "onda-artist-kit-site" }
  };

  function deepMerge(a, b) {
    if (typeof a !== "object" || a === null) return b;
    if (typeof b !== "object" || b === null) return b;
    if (Array.isArray(b)) return b;
    for (const key of Object.keys(b)) { a[key] = deepMerge(a[key], b[key]); }
    return a;
  }

  // ---- Serialização: estado → JSONs do Core ----
  const toBandJson = (s) => {
    const i = s.identidade;
    const genres = i.genre ? [i.genre] : [];
    return {
      name: i.name || "", tagline: i.tagline || "", city: i.city || "",
      state: i.state || "", genre: i.genre || "", genres: genres,
      founded: i.founded || null, about: [],
      members: s.release.members || [],
      musicalIdentity: s.release.musicalIdentity || "", influences: [],
      logo: i.logo || null, logoAlt: i.logoAlt || "",
      photo: i.photo || null, photoAlt: i.photoAlt || ""
    };
  };

  const toReleaseJson = (s) => {
    const r = s.release;
    return {
      title: "Release", headline: r.headline || "", presentation: null,
      biography: r.biography || [], musicalIdentity: r.musicalIdentity || "",
      influences: [], highlights: r.highlights || [], experience: r.experience || "",
      discography: r.discography || [],
      booking: { description: r.booking?.description || "", email: r.booking?.email || "", phone: r.booking?.phone || "" }
    };
  };

  const toLinksJson = (s) => ({ links: [...(s.links.social || []).map(l => ({ label: l.label, url: l.url })), ...(s.links.custom || [])] });
  const toShowsJson = (s) => ({ shows: s.agenda.shows || [] });
  const toSiteJson = (s) => ({ theme: s.themeId || "default" });
  const toCalendarJson = (s) => s.agenda.calendar;

  const serializeAll = (s = state) => ({
    "data/band.json": toBandJson(s),
    "data/release.json": toReleaseJson(s),
    "data/links.json": toLinksJson(s),
    "data/shows.json": toShowsJson(s),
    "data/site.json": toSiteJson(s),
    "data/calendar.json": toCalendarJson(s)
  });

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
      }
    } catch (error) {
      console.warn("[Configurador] Não foi possível ler o estado salvo — usando padrões.", error);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  let state = loadFromStorage();

  function saveToStorage(s = state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
    catch (error) { console.warn("[Configurador] Não foi possível salvar o estado localmente.", error); }
  }

  const getState = () => state;
  const setState = (patch) => {
    state = deepMerge(state, patch);
    saveToStorage(state);
    window.dispatchEvent(new CustomEvent("onda-state-change", { detail: { state } }));
    return state;
  };
  const resetState = () => { state = JSON.parse(JSON.stringify(DEFAULT_STATE)); saveToStorage(state); return state; };
  const clearStorage = () => { localStorage.removeItem(STORAGE_KEY); };

  const setItem = (key, value) => {
    const parts = key.split(".");
    const patch = {};
    let cur = patch;
    for (let i = 0; i < parts.length - 1; i++) { cur = cur[parts[i]] = {}; }
    cur[parts[parts.length - 1]] = value;
    return setState(patch);
  };
  const getItem = (key) => {
    const parts = key.split(".");
    let cur = state;
    for (const part of parts) { if (cur == null || typeof cur !== "object") return undefined; cur = cur[part]; }
    return cur;
  };
  const addListItem = (listKey, item) => { const arr = getItem(listKey) ?? []; arr.push(item); setItem(listKey, arr); return arr; };
  const updateListItem = (listKey, index, item) => { const arr = getItem(listKey) ?? []; arr[index] = item; setItem(listKey, arr); return arr; };
  const removeListItem = (listKey, index) => { const arr = getItem(listKey) ?? []; arr.splice(index, 1); setItem(listKey, arr); return arr; };
  const moveListItem = (listKey, fromIndex, toIndex) => {
    const arr = getItem(listKey) ?? [];
    if (toIndex < 0 || toIndex >= arr.length) return arr;
    const [removed] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, removed);
    setItem(listKey, arr);
    return arr;
  };

  const isValidUrl = (value) => {
    if (!value || !value.trim()) return false;
    try { const parsed = new URL(value.trim()); return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol); } catch { return false; }
  };
  const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");
  const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");

  window.OndaConfig = {
    getState, setState, resetState, clearStorage, setItem, getItem,
    addListItem, updateListItem, removeListItem, moveListItem,
    serializeAll, toBandJson, toReleaseJson, toLinksJson, toShowsJson, toSiteJson, toCalendarJson,
    isValidUrl, isValidDate, isValidTime, STORAGE_KEY,
    DEFAULT_STATE: JSON.parse(JSON.stringify(DEFAULT_STATE))
  };
})();