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

## Fase 3 — Página de release e camada de dados

- `release.html`: página de release eletrônico reutilizando o Core (header, navegação, hero, cards, chips, footer), com seções próprias: apresentação, biografia, integrantes, identidade musical, discografia, destaques, atuação/experiência, contratação e redes;
- Camada de dados: `src/js/content.js` expõe `window.OndaContent` (fetch de JSON com erro explícito, escape de HTML, aplicação de textos/parágrafos, imagens com fallback e renderizadores reutilizáveis de integrantes, discografia e links); `src/js/home.js` e `src/js/release.js` hidratam as páginas a partir de `data/band.json`, `data/links.json` e `data/release.json`;
- Modelo de fallback: as páginas trazem conteúdo estático de demonstração; servidas por HTTP, os JSONs substituem o conteúdo hidratando as seções. Em `file://` o `fetch` é bloqueado pelo navegador e o fallback estático permanece (com aviso no console);
- Dados ausentes não quebram o layout: seções sem conteúdo configurado são ocultadas (`hidden`), imagens ausentes recebem fallback (marca do Core no logotipo, iniciais nas capas, figura ocultada sem foto) e links de plataformas não informados não geram botões;
- Impressão/PDF: `src/css/print.css` (importado por `main.css`) sobrescreve os tokens dentro de `@media print` — oculta header/navegação/botões/rodapé, exibe a URL após links importantes, evita cortes entre seções (`break-inside: avoid`, `break-after: avoid`) e mantém a hierarquia de conteúdo; o botão “Baixar / imprimir release” chama `window.print()`;
- SEO: metadados estáticos no `<head>` do release (`description`, `og:title`, `og:description`, `og:type`) com sincronização via JS de `title`/`description`/`og:*` a partir dos dados; `og:image` só é definida quando há foto configurada. A centralização do SEO fica para uma fase futura.

## Fase 4 — Sistema de agenda de shows

- Arquitetura: `data/shows.json` → `src/js/shows.js` (Agenda Core: validação/normalização, classificação futuro/passado, ordenação, formatação de datas) → `src/components/show-card.js` (componente ShowCard) → páginas (`agenda.html`, Home e Release);
- `ShowCard` (`window.OndaShowCard.render`) renderiza data, horário, título, status textual, local, cidade/UF, endereço, descrição, ingressos, mapa e exportação `.ics` — é reutilizado por Home (próximo show) e Agenda (próximos/histórico), sem HTML de evento duplicado;
- Datas em ISO/`HH:mm`, formatadas com `Intl` (pt-BR: “Sábado, 12 de setembro de 2026”, “12 SET”); nenhuma conversão de fuso — eventos usam data/hora locais flutuantes (inclusive no `.ics`);
- Classificação automática pela data corrente: futuros (incluindo cancelados/adiados) em “Próximos shows” em ordem crescente; passados em “Shows anteriores” em ordem decrescente; a ordem do JSON é livre;
- Dados inválidos não quebram a página: sem título/data válida o evento é ignorado com `console.warn`; horário inválido é descartado mantendo o evento; status desconhecido cai em `confirmed`;
- Status (`confirmed`/`cancelled`/`postponed`) comunicados por texto (badges) além do estilo; cancelados perdem os botões de ingressos e calendário; adiados exibem nota com `originalDate`;
- “Adicionar ao calendário” gera `.ics` local (RFC 5545: UID estável, DTSTART/DTEND flutuantes, LOCATION, SUMMARY, DESCRIPTION, URL) via Blob — sem serviços externos (Google Calendar ficará para a Fase 5);
- Estados vazios: agenda exibe mensagem dedicada quando não há próximos shows; seção de histórico é oculta sem passados; Home exibe “Nenhum show agendado…”;
- Impressão: botões `.ics` ocultos em `@media print`; cards de show preservados entre páginas (`break-inside: avoid` via `.card`).

## Fase 5 — Integração opcional com Google Calendar

- **Solução escolhida**: alimentação **iCal pública** `https://calendar.google.com/calendar/ical/{calendarId}/public/basic.ics` (“Public address in iCal format”), um recurso público oficial que **não exige API Key, OAuth, backend nem banco**. Acessada em runtime via `fetch` (com abort após 8s), parseada localmente e convertida para o formato comum do Core. Sem credenciais no repositório (proíbido por política), sem serviço intermediário, sem Google Calendar API.
- **Arquitetura** (camada de fonte de dados, desacoplada da interface):
  `data/calendar.json` → `src/js/data.js` (orquestrador; decide fonte e gerencia fallback) → `src/js/sources/local.js` (`shows.json`) e `src/js/sources/google-icalendar.js` (parser ICS → normalização) → Agenda Core (`src/js/shows.js`: `normalizeShows`/`classifyShows`) → interface (Home, `agenda.html`, Release) via `OndaData.getAgenda()`, que devolve `{ events, source, note }`.
  A interface não sabe a origem dos eventos; `OndaShows.setAll()` registra os eventos carregados para o ShowCard resolver ids no `.ics`.
- **Configuração**: `data/calendar.json` — `enabled` (bool), `mode` (`"local"` | `"google"`), `provider`, `calendarId`, `publicUrl` (alternativa: qualquer URL de ICS, inclusive um `data/calendar.ics` no próprio repo). Fonte 100% explícita, nunca misturada (sem duplicação).
- **Fallback obrigatório**: `mode "google"` com falha (rede, CORS, HTTP, ICS inválido, calendário não público) → `shows.json` automaticamente, com `console.warn` técnico e mensagem amigável na página. Calendário público vazio ≠ falha: exibe o estado vazio da agenda. Configuração ativada sem `calendarId`/`publicUrl` também cai no fallback sem requisição externa.
- **Normalização Google → Core**: `UID` → `id` estável (`google-…`); `DTSTART`/`DTEND` (date-only, naive ou com `TZID`/`Z`/offset) → `date` ISO + `startTime`/`endTime` `HH:mm` (naive = local; Z/offset convertidos ao fuso do visitante); `SUMMARY`/`LOCATION`/`DESCRIPTION`/`URL` → `title`/`venue`/`description`/`ticketUrl`; `STATUS:CANCELED` → `cancelled` (senão `confirmed`). Desdobramento de linhas contínuas e desescape `\, \; \\ \n` (RFC 5545).
- **Limitações documentadas**: (1) CORS — o feed do Google pode ser bloqueado pelo navegador em hospedagens estáticas; fallback automático + alternativa `publicUrl` apontando para um `.ics` no próprio site; (2) recorrência — sem expansão própria, exibe-se a 1ª ocorrência de eventos com `RRULE`; (3) eventos não públicos falham como indisponibilidade; (4) calendário é público — privacidade do artista depende dele; (5) atrasos de propagação do Google.
- **Estados da interface**: “Carregando agenda…” (`aria-live`), erro amigável (“Não foi possível carregar a agenda externa — exibindo a agenda local.”) com detalhes técnicos só no console, e indicador opcional “Agenda atualizada pelo Google Calendar” quando a fonte é o Google. SEO/hierarquia da página intactos.
- **Como adicionar outra fonte** (futuro, ex.: ICS/Bandsintown): criar `src/js/sources/{nome}.js` com `load(config)` que devolve eventos no formato comum e registrá-lo no orquestrador `data.js` — a interface não muda.