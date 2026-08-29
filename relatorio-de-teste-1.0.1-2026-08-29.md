# Relatório de teste 1.0.1 — 2026-08-29

**Versão testada:** 1.0.1 — build de correções sobre a 1.0.0 (correções vindas da `dev` `3ac056c`, mescladas na branch `teste` no commit `410446e`). O repositório não possui bump explícito de versão; a numeração segue a do relatório anterior + patch, por se tratar de ciclo de correções de bugs.
**Data do teste:** 2026-08-29
**Correções verificadas (vindas da `dev`):**

| Commit | Correção |
| --- | --- |
| `c807821` | `fix/theme-loader` — corrige aplicação dos Themes (`STORAGE_ID` → `STYLE_ID`) |
| `8503fc4` | `fix/google-calendar-cancelled-status` — aceita `STATUS:CANCELLED` (RFC 5545) no parser ICS |
| `a6e1dc7` | `fix/agenda-file-fallback` — preserva o conteúdo estático da agenda quando a fonte falha (`file://`) |

**Ambiente de teste:**
- Windows, Node.js v24.17.0, Python 3.13.5, Chrome (headless) para testes reais de navegador;
- Site servido localmente em `http://127.0.0.1:8123` (`python -m http.server`);
- Dados de exemplo do kit ("Banda Exemplo", `data/shows.json`, etc.);
- Calendário Google de teste: `75442eb11fb0b3be4c8d0383da3b2e5d8979f9472d13e420dfa88b408932614a@group.calendar.google.com` (neste teste, com 2 eventos — o evento "Teste 001" foi removido do calendário desde o teste anterior);
- Suite de testes própria do projeto adicionada nesta versão: `test/google-icalendar.test.cjs` e `test/agenda-file-fallback.test.cjs`.

**Escopo:** reexecução completa da bateria de testes do `README.md` + verificação específica das 3 correções. **Nenhuma correção foi feita nesta rodada** — apenas testes e registro.

---

## Resumo executivo

| Item | Resultado |
| --- | --- |
| Correção 1 — Themes voltaram a ser aplicados | ✅ **Verificada e funcionando** |
| Correção 2 — Eventos cancelados do Google renderizam como "Cancelado" | ✅ **Verificada e funcionando** |
| Correção 3 — Agenda preserva fallback estático em `file://` | ✅ **Verificada e funcionando** |
| Suite própria do projeto (`test/`) | ✅ 22/22 testes passando |
| Regressão: páginas, agenda local, release, configurador, `.ics` | ✅ Sem regressões |
| Google Calendar direto no navegador (limitação conhecida) | ⚠️ Continua barrado por CORS do Google (fallback funciona) — **não é bug do kit** |

---

## 1. Correção 1 — Themes (`theme-loader.js`)

**Antes (1.0.0):** `ReferenceError: STORAGE_ID is not defined` em todas as páginas; o CSS do tema nunca era injetado e o site usava apenas a aparência base do Core.

**Agora (1.0.1):**

| Verificação | Resultado |
| --- | --- |
| `<style id="onda-theme-style">` presente no DOM de `index.html`, `agenda.html`, `release.html` e `themes/` | ✅ (injetado em todas) |
| `data-theme="default"` aplicado com `data/site.json` → `default` | ✅ |
| **Theme Midnight aplicado ponta a ponta** (troca temporária de `data/site.json` para `"midnight"`): `data-theme="midnight"`, CSS do tema injetado, `<meta name="theme-color">` atualizado para `#04060c` | ✅ |
| Console do navegador **sem erros** em todas as páginas (o erro `STORAGE_ID` desapareceu) | ✅ |
| Catálogo `themes/` lista os 3 temas (Default, Midnight, Brutalist) | ✅ |

**Conclusão:** a correção `c807821` resolveu o problema — o Sistema de Themes voltou a funcionar.

## 2. Correção 2 — Status cancelado do Google Calendar (`google-icalendar.js`)

**Antes (1.0.0):** `STATUS:CANCELLED` (grafia do Google/RFC 5545) era tratado como `confirmed`.

**Agora (1.0.1):**

| Verificação | Resultado |
| --- | --- |
| Suite do projeto (`test/google-icalendar.test.cjs`): 11/11 — `CANCELLED` e `CANCELED` → `cancelled`; `CONFIRMED`/ausência de STATUS → `confirmed`; badge e botões corretos | ✅ 11/11 |
| Teste no navegador com evento `STATUS:CANCELLED` injetado no feed (UID `cancelled-fixture@test`): card renderizado com **badge "Cancelado"**, **sem** botão "Ingressos" e **sem** botão "Adicionar ao calendário" | ✅ |
| Eventos confirmados do mesmo feed continuam com badge Confirmado e botões | ✅ |
| Harness Node com ICS de exemplo (`STATUS:CANCELLED`) → status `cancelled` | ✅ (antes: `confirmed`) |

**Conclusão:** a correção `8503fc4` resolveu o problema.

## 3. Correção 3 — Fallback estático da agenda em `file://` (`agenda.js`)

**Antes (1.0.0):** ao abrir `agenda.html` direto do disco, o fetch falhava, o `renderList` limpava os grids e a página ficava sem eventos, contrariando o README.

**Agora (1.0.1):**

| Verificação | Resultado |
| --- | --- |
| Suite do projeto (`test/agenda-file-fallback.test.cjs`): 11/11 — falha de fonte preserva estáticos; `note: "error"` tratado como indisponível; `file://` integral (config + JSONs bloqueados) preserva estáticos; fontes com eventos/sem eventos seguem renderizando normalmente | ✅ 11/11 |
| Teste real no Chrome via `file:///.../agenda.html`: cards estáticos de demonstração **preservados** (show-001 em "Próximos", show-005 em "Anteriores"), grids visíveis, sem mensagem de erro | ✅ |
| `index.html` e `release.html` em `file://` continuam com fallback estático (regressão) | ✅ |

**Conclusão:** a correção `a6e1dc7` resolveu o problema — o comportamento agora bate com o descrito no `README.md`.

---

## 4. Regressão geral (todas as funcionalidades re-testadas)

### 4.1 Validações estáticas

| Item | Resultado |
| --- | --- |
| JSON de `data/` (6 arquivos) | ✅ Todos parseiam |
| Sintaxe JS/CJS (23 arquivos, incluindo os novos `test/*.cjs`) | ✅ `node --check` sem erros |
| Suite do projeto (`test/google-icalendar.test.cjs` + `test/agenda-file-fallback.test.cjs`) | ✅ 22/22 |

### 4.2 Páginas no navegador (HTTP local)

| Página | Resultado | Console |
| --- | --- | --- |
| `index.html` — hero, ficha, sobre, discografia, links, booking, próximo show | ✅ | Sem mensagens |
| `agenda.html` — agenda local completa (6 cards: 4 confirmed, 1 postponed, 1 cancelled) | ✅ | Sem mensagens |
| `release.html` — título, seções, integrantes, discografia, destaques, próximas datas | ✅ | Sem mensagens |
| `themes/` — catálogo com os 3 temas + tema aplicado | ✅ | Sem mensagens |
| `configurador/` — 8 etapas, passo Identidade renderizado | ✅ | Sem mensagens |

### 4.3 Agenda local (`data/shows.json`, `mode: local`)

| Evento | Exibição |
| --- | --- |
| Festival Noite Alta (2026-09-12) | Confirmado · Próximos ✅ |
| Sala Subsolo (2026-10-03) | Confirmado · Próximos ✅ |
| Bar Onda (2026-11-14, adiado de 26/09) | Adiado + nota "Adiado de 26 SET para 14 NOV." · Próximos ✅ |
| Festival Inverno Alto (2026-12-05) | Cancelado · sem Ingressos/.ics · Próximos ✅ |
| Centro Cultural Marta (2026-06-20) / Cerrado Sessions (2026-05-09) | Anteriores ✅ |

### 4.4 Exportação `.ics` (Node + navegador)

- `buildIcs` gera VCALENDAR válido (UID, DTSTAMP, DTSTART/DTEND, LOCATION, SUMMARY, DESCRIPTION, URL) ✅
- Botão "Adicionar ao calendário" presente em confirmados/adiados e ausente em cancelados ✅

### 4.5 Configurador

- Estado, serialização dos 6 JSONs e geração de ZIP seguem funcionando (código não alterado nesta rodada; ZIP validado por extração no ciclo anterior) ✅

---

## 5. Google Calendar (re-teste completo)

Calendário público de teste — estado atual (2 eventos; "Teste 001" foi removido do calendário desde o teste de 2026-08-28):
- **Teste 002** — 2026-09-02 14:30 (horário local) · sem local · confirmado
- **Teste 003 convite** — 2026-08-27 16:30 · Moto Rock e Cia (Taguatinga) · confirmado

| Cenário | Resultado |
| --- | --- |
| Feed acessível fora do navegador (`calendarId` e `publicUrl`): HTTP 200, `text/calendar`, ICS válido | ✅ |
| Parser do projeto sobre o feed real: 2 eventos convertidos com data/hora/local corretos | ✅ |
| `OndaData.getAgenda()` modo `google`: `source: "google"`, `note: "ok"`, classificação correta (1 próximo, 1 passado) | ✅ |
| **No navegador, modo `google` com `calendarId` externo:** bloqueado por CORS ("No 'Access-Control-Allow-Origin' header is present") → mensagem amigável "Não foi possível carregar a agenda externa — exibindo a agenda local." e agenda local renderizada | ⚠️ limitação do Google (fallback funciona como projetado) |
| **No navegador, `publicUrl: "data/calendar.ics"` (espelho no próprio site):** eventos do Google renderizados (Teste 002, Teste 003), indicador "Agenda atualizada pelo Google Calendar." visível | ✅ |
| **No navegador, feed com evento `STATUS:CANCELLED`:** badge "Cancelado", sem botões de Ingressos/.ics | ✅ (correção desta versão) |

**Nota sobre CORS:** segue sendo limitação do lado do Google (o endpoint público `basic.ics` não envia `Access-Control-Allow-Origin`). Não é regressão nem bug do kit — o README já documenta a alternativa oficial (espelhar o `.ics` em `data/`), que foi testada e funciona.

## 6. Limitações e observações

- **CORS do Google Calendar** (item 5): permanece como limitação externa documentada; o fallback e a alternativa com `.ics` espelhado funcionam.
- Nenhum erro de console em nenhuma página testada (HTTP e `file://`).
- Nenhuma regressão introduzida pelas correções.
- Alterações temporárias de teste (`data/site.json` → midnight, `data/calendar.json` → google, `data/calendar.ics`) foram revertidas após os testes; o repositório está limpo.

## 7. Resultado geral

✅ **Aprovado.** As três correções trazidas pela `dev` foram verificadas e estão funcionando:

1. **Themes aplicados novamente** — CSS injetado, atributo `data-theme`, `theme-color` e preview do catálogo OK; console limpo.
2. **Eventos cancelados do Google Calendar** — status, badge e botões corretos.
3. **Fallback estático da agenda em `file://`** — conteúdo de demonstração preservado, alinhado ao `README.md`.

A suite de testes do projeto (`test/`) cobre os pontos corrigidos e passou integralmente (22/22). O único comportamento que segue diferente do fluxo ideal é o carregamento direto do Google Calendar no navegador, barrado por CORS do Google — limitação externa já documentada no `README.md`, sem impacto para o usuário final graças ao fallback automático.

---

Nenhuma correção foi aplicada nesta rodada — apenas atualização da branch, testes e registro. Este é o único arquivo novo adicionado ao histórico de versão nesta branch.