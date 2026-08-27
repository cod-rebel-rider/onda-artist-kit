/* ==========================================================================
   Onda Artist Kit — Core
   main.js — JavaScript mínimo de interface.

   Responsabilidades atuais:
   1. menu mobile (abrir/fechar, teclado, clique em link);
   2. destaque do item de navegação conforme a seção visível (scrollspy);
   3. ano corrente no rodapé.

   Sem frameworks. Sem carregamento de dados externos (fases posteriores).
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------
   * 1. Menu mobile
   * ------------------------------------------------------------------ */
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("menu-principal");

  if (toggle && menu) {
    const label = toggle.querySelector(".visually-hidden");

    const setMenu = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.dataset.open = String(open);
      if (label) {
        label.textContent = open ? "Fechar menu" : "Abrir menu";
      }
    };

    setMenu(false);

    toggle.addEventListener("click", () => {
      setMenu(menu.dataset.open !== "true");
    });

    // Fecha o menu ao escolher um destino
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        setMenu(false);
      }
    });

    // Fecha com a tecla Esc e devolve o foco ao botão
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.dataset.open === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
   * 2. Scrollspy: marca como atual a seção visível na navegação
   * ------------------------------------------------------------------ */
  const navLinks = Array.from(document.querySelectorAll('.nav__link[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length > 0) {
    const linkBySection = new Map();
    sections.forEach((section) => {
      const link = navLinks.find((candidate) => candidate.hash === `#${section.id}`);
      if (link) {
        linkBySection.set(section, link);
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          navLinks.forEach((link) => link.removeAttribute("aria-current"));
          const current = linkBySection.get(entry.target);
          if (current) {
            current.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------
   * 3. Ano corrente no rodapé
   * ------------------------------------------------------------------ */
  const year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();