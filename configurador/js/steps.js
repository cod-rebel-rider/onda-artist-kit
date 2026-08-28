/* ==========================================================================
   Onda Artist Kit — Configurador
   steps.js — definições das etapas (wizards) do fluxo.

   Cada etapa é declarada aqui de forma declarativa: id, título, ícone.
   O ui.js percorre STEPS para montar a navegação lateral e orquestrar o
   fluxo de configuração. Centralizar aqui evita acoplar a UI ao fluxo.
   ========================================================================== */

(() => {
  "use strict";

  // Ordem definida pela tarefa: Identidade → Release → Links → Agenda → Theme → Configurações → Preview → Exportar
  const STEPS = [
    { id: "identidade", label: "Identidade", icon: "🎤" },
    { id: "release", label: "Release", icon: "📄" },
    { id: "links", label: "Links", icon: "🔗" },
    { id: "agenda", label: "Agenda", icon: "📅" },
    { id: "theme", label: "Aparência", icon: "🎨" },
    { id: "configuracoes", label: "Configurações", icon: "⚙️" },
    { id: "preview", label: "Visualizar", icon: "👁" },
    { id: "exportar", label: "Exportar", icon: "📦" }
  ];

  window.OndaConfigSteps = STEPS;
})();