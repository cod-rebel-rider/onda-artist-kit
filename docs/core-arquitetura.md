# Arquitetura do Core (Fase 1)

Referência das decisões técnicas tomadas na implementação do Core do Onda Artist Kit. O objetivo é manter o projeto **simples e portátil**, sem abrir mão de uma base preparada para evoluir (conteúdo em JSON, Themes, agenda etc.).

## Princípios

- **Site 100% estático**: HTML + CSS + JavaScript vanilla, sem etapa de build, sem frameworks e sem dependências externas;
- **Portátil**: funciona abrindo o `index.html` diretamente ou servido por qualquer servidor estático (GitHub Pages incluído);
- **Neutro para Themes**: nenhum valor visual é escrito diretamente nos componentes — tudo passa por tokens definidos em `variables.css`;
- **Mobile-first**: estilos base para telas pequenas, com melhorias progressivas em `min-width`.

## Estrutura de arquivos

```text
onda-artist-kit/
├── assets/
│   └── icons/favicon.svg      # favicon original do projeto (MIT)
├── src/
│   ├── css/
│   │   ├── reset.css          # reset minimalista moderno
│   │   ├── variables.css      # tokens de design (cores, espaçamento, foco…)
│   │   ├── base.css           # tipografia, links, foco, reduced-motion
│   │   ├── layout.css         # container, seções, grids, hero, rodapé
│   │   ├── components.css     # padrões reutilizáveis (BEM-like)
│   │   └── main.css           # ponto de entrada (@import na ordem da cascata)
│   ├── js/main.js             # JS mínimo de interface (menu, scrollspy, ano)
│   ├── components/            # reservada (sem build, ainda sem arquivos)
│   └── pages/components.html  # página de teste visual dos componentes
├── docs/                      # esta documentação
├── index.html                 # página inicial (site demo "Banda Exemplo")
└── …
```

## CSS

- Camadas importadas por `main.css`, na ordem: `reset` → `variables` → `base` → `layout` → `components`;
- Tokens como `--color-accent`, `--space-md`, `--focus-ring` etc. formam o contrato visual do Core;
- Breakpoints: `40em` (tablet) e `56.25em` (desktop), em unidades relativas;
- Acessibilidade embutida: `:focus-visible` com anel visível, suporte a `prefers-reduced-motion`, utilitário `.visually-hidden`;
- Themes futuros: bastará importar um arquivo após `components.css` sobrescrevendo os tokens.

## HTML e navegação

- Semântico: `header`, `nav`, `main`, `section`, `article`, `footer`; um único `h1` por página e hierarquia de headings sem saltos;
- Seções identificadas com `aria-labelledby`; âncoras com `scroll-margin-top` para compensar o header fixo;
- Navegação principal: **Início** (`#inicio`), **Sobre** (`#sobre`), **Agenda** (`#agenda`), **Release** (`#release`) e **Links** (`#links`, bloco dentro da seção Contato) — todos com destino existente nesta fase;
- As páginas completas de Agenda, Release e Links chegarão em fases futuras; a navegação está pronta para receber novos itens sem alterar padrões.

## JavaScript

- `src/js/main.js`: IIFE, sem frameworks, carregado com `defer`;
- Responsabilidades: menu mobile (botão com `aria-expanded`, fecha com `Esc` ou ao clicar em um link), destaque da seção visível na navegação (`IntersectionObserver`) e ano corrente no rodapé;
- Sem JavaScript o conteúdo continua acessível — apenas o painel do menu mobile depende de JS.

## Componentes

Padrões documentados em `src/pages/components.html` (ferramenta de desenvolvimento, marcada com `noindex`): `container`, `section`, `site-header`, `site-nav`/`nav-toggle`, `btn` (`--primary`, `--ghost`, `--sm`), `card` (+ `event-card`, `release-card`), `badge`, `chip`, `field`/`input`/`textarea`/`select`/`checkbox` e amostras de paleta.

## Conteúdo e assets

- O conteúdo é claramente demonstrativo: **Banda Exemplo** é uma banda fictícia (Brasília, DF · rock independente);
- Links externos (Spotify, Instagram, YouTube, Bandcamp) apontam para as homepages das plataformas — são demonstrativos e serão substituídos pelo sistema de conteúdo;
- `assets/icons/favicon.svg` é uma criação original deste projeto, licenciada junto com o código (MIT). Nenhum asset de terceiros foi utilizado;
- `assets/images/` e `assets/fonts/` permanecem reservados (sem arquivos inventados só para preenchê-los).

## Como executar e publicar

- Local: abrir `index.html` no navegador ou `python3 -m http.server 8000`;
- GitHub Pages: publicar a raiz do repositório — nenhum passo de build é necessário.

## Limitações atuais (fase 1)

- Conteúdo fixo no HTML (o sistema de conteúdo baseado em JSON vem em fase futura);
- Agenda, release e links são seções demonstrativas, não sistemas;
- O painel do menu mobile depende de JavaScript;
- Ainda não há testes automatizados nem linting de front-end.