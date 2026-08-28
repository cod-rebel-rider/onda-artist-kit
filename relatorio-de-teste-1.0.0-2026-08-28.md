# Relatório de teste 1.0.0 — 2026-08-28

**Versão testada:** 1.0.0 (branch `teste`, criada a partir de `dev` `cfda828`)
**Data do teste:** 2026-08-28
**Ambiente de teste:**
- Windows, Node.js v24.17.0, Python 3.13.5, Chrome (headless) para testes reais de navegador;
- Site servido localmente em `http://127.0.0.1:8123` (`python -m http.server`);
- Dados de exemplo: conteúdo demonstrativo do kit ("Banda Exemplo", `data/shows.json`, etc.);
- Calendário Google de teste: `75442eb11fb0b3be4c8d0383da3b2e5d8979f9472d13e420dfa88b408932614a@group.calendar.google.com`.

**Escopo:** verificação de todas as funcionalidades descritas no `README.md`. **Nenhuma correção de código foi feita** — apenas testes e registro de resultados.

---

## Resumo executivo

| Recurso | Resultado |
| --- | --- |
| Páginas e navegação (index, agenda, release, themes, componentes, configurador) | ✅ Funciona |
| Hidratação de conteúdo a partir de `data/*.json` | ✅ Funciona |
| Agenda local (`data/shows.json`) — classificação, badges, status | ✅ Funciona |
| Exportação `.ics` ("Adicionar ao calendário") | ✅ Funciona |
| Google Calendar — acesso ao feed público (HTTP/parser) | ✅ Funciona |
| Google Calendar — carregamento direto **no navegador** | ❌ Barrado por **CORS** (cai no fallback) |
| Google Calendar — via `.ics` espelhado no próprio site | ✅ Funciona |
| Sistema de Themes (aplicação automática da aparência) | ❌ **Erro de runtime** — tema nunca é aplicado |
| Configurador (passos, estado, geração de ZIP) | ✅ Funciona |
| Fallback `file://` (index e release) | ✅ Funciona |
| Fallback `file://` na **agenda** | ❌ Contradiz o README (conteúdo some) |

---

## 1. Validações estáticas

| Item | Resultado | Detalhe |
| --- | --- | --- |
| JSON de `data/` (6 arquivos) | ✅ | Todos parseiam corretamente |
| Sintaxe JS (21 arquivos) | ✅ | `node --check` sem erros |
| Servidor estático | ✅ | Todas as páginas respondem HTTP 200 |

---

## 2. Página inicial (`index.html`)

| Item | Resultado |
| --- | --- |
| Hero (nome, tagline, gênero/cidade) vindos de `data/band.json` | ✅ |
| Ficha técnica (origem, gênero, desde, formação) | ✅ |
| Sobre (parágrafos) | ✅ |
| Discografia (3 lançamentos de `data/release.json`) | ✅ |
| Links/redes de `data/links.json` | ✅ |
| Botão de contato (booking) | ✅ |
| Próximo show (usa a fonte de agenda) | ✅ (exibiu show-001 — Festival Noite Alta) |
| Erros no console | ⚠️ apenas o erro de Theme (item 6 abaixo) |

## 3. Agenda local (`agenda.html` com `data/calendar.json` → `mode: local`)

Testado com a data atual do sistema (2026-08-28). Resultado renderizado na página:

| Evento | Status exibido | Classificação |
| --- | --- | --- |
| Festival Noite Alta (2026-09-12) | badge Confirmado | Próximos ✅ |
| Sala Subsolo (2026-10-03) | badge Confirmado | Próximos ✅ |
| Bar Onda (2026-11-14, adiado de 26/09) | badge Adiado + nota "Adiado de 26 SET para 14 NOV." | Próximos ✅ |
| Festival Inverno Alto (2026-12-05) | badge Cancelado, **sem** botão Ingressos e **sem** botão .ics | Próximos ✅ |
| Centro Cultural Marta (2026-06-20) | Confirmado | Anteriores ✅ |
| Cerrado Sessions (2026-05-09) | Confirmado | Anteriores ✅ |

- Ordenação crescente (próximos) e decrescente (passados) ✅
- Horários formatados em pt-BR ("Sábado, 12 de setembro de 2026 · 20:00–21:00") ✅
- Indicador "Agenda atualizada pelo Google Calendar." **oculto** (correto em modo local) ✅
- Sem mensagem de erro ✅

## 4. Google Calendar

Calendário usado nos testes (público, com 3 eventos de exemplo):
- **Teste 001** — 2026-09-01 14:30 · Torre de TV Digital de Brasília
- **Teste 002** — 2026-09-02 14:30 · sem local
- **Teste 003 convite** — 2026-08-27 16:30 · Moto Rock e Cia (Taguatinga)

### 4.1 Acesso ao feed público (independente do navegador)

| Cenário | Resultado |
| --- | --- |
| URL montada a partir do `calendarId` | ✅ HTTP 200, `text/calendar; charset=utf-8`, ICS válido (1.748 bytes) |
| `publicUrl` fornecida (formato iCal oficial) | ✅ HTTP 200, mesmo conteúdo |
| Parser do projeto (`google-icalendar.js`) | ✅ Converteu os 3 eventos corretamente (datas, horários, locais) |
| `OndaData.getAgenda()` em modo `google` | ✅ Retornou `source: "google"`, `note: "ok"`, 3 eventos; classificação: 2 próximos + 1 passado |
### 4.2 No navegador (Chrome)

| Cenário | Resultado |
| --- | --- |
| `mode: google` com `calendarId` externo | ❌ **CORS**: `TypeError: Failed to fetch` → mensagem "Não foi possível carregar a agenda externa — exibindo a agenda local." e agenda local renderizada (o fallback funcionou) |
| `mode: google` com `publicUrl` externa | ❌ **CORS**: mesmo comportamento de fallback |
| `mode: google` com `publicUrl: "data/calendar.ics"` (espelho do ICS no próprio site) | ✅ Renderizou os 3 eventos do Google como cards (horários, locais, badge Confirmado, botão .ics) e exibiu o indicador "Agenda atualizada pelo Google Calendar." |

**Descrição do erro (4.2, carregamento direto):** o navegador bloqueia o `fetch` para `https://calendar.google.com/.../basic.ics` por **CORS**. O header `Access-Control-Allow-Origin` está **ausente** na resposta do Google (confirmado na inspeção dos cabeçalhos da resposta — `access-control-allow-origin: null`).

**Suspeita da causa:** o Google Calendar não habilita CORS no endpoint público `basic.ics` (política do lado do Google, não é bug do código do kit). Por isso, em hospedagem estática (GitHub Pages etc.) o carregamento direto falha e o kit recorre ao fallback local — comportamento que o próprio README documenta como limitação ("alguns navegadores/hospedagens podem bloquear a leitura direta... Nesse caso o fallback entra em ação sozinho"). **A alternativa de espelhar o `.ics` na pasta `data/` funciona perfeitamente** (testada no item acima), assim como um proxy que acrescente o header CORS.

## 5. Release eletrônico (`release.html`)

| Item | Resultado |
| --- | --- |
| Título e metadados SEO atualizados | ✅ |
| Apresentação, biografia, identidade musical, gêneros | ✅ |
| Integrantes (4) | ✅ |
| Discografia (3 itens com links por plataforma) | ✅ |
| Destaques e experiência | ✅ |
| Contratação (e-mail; telefone oculto quando vazio) | ✅ |
| Próximas apresentações (3 datas da agenda) | ✅ |
| Botão "Baixar / imprimir release" presente | ✅ |

## 6. Sistema de Themes ❌

**Descrição do erro:** em **todas** as páginas que carregam `src/js/theme-loader.js`, o console registra:

```text
ReferenceError: STORAGE_ID is not defined
[Onda] Theme default indisponível — usando a aparência base do Core.
```

**Suspeita/causa raiz:** em `theme-loader.js:78` o código usa `style.id = STORAGE_ID;`, mas a constante definida no arquivo é `STYLE_ID` (usada na linha anterior, `getElementById(STYLE_ID)`). `STORAGE_ID` não existe → `applyTheme()` lança exceção antes de injetar o `<style>` do tema; o `boot()` captura e cai no fallback.

**Consequência:** o CSS do Theme (**Default, Midnight ou Brutalist**) **nunca é aplicado** — o site sempre usa a aparência base do Core (`src/css/*`), mesmo com `data/site.json` → `"theme": "midnight"`. A troca de aparência, recurso central do kit, fica inoperante.

**O que funciona no tema:** o catálogo `themes/index.html` lista os 3 temas corretamente a partir dos `theme.json`, e o `theme-catalog.js` usa a constante correta (`STYLE_ID`) no preview manual — mas o carregamento automático do tema do site está quebrado pelo erro acima.
## 7. Configurador (`configurador/`)

| Item | Resultado |
| --- | --- |
| Abre e renderiza as 8 etapas (Identidade → Exportar) | ✅ |
| Primeiro passo (Identidade) com formulário | ✅ |
| Serialização do estado → `data/*.json` (6 arquivos) | ✅ |
| `toShowsJson` / `toCalendarJson` / `toSiteJson` no formato esperado pelo Core | ✅ |
| Geração de ZIP (`zip.js` + `exporter.js`) | ✅ ZIP válido; extração validada (assinatura PK, EOCD e arquivos `index.html`, `data/shows.json`, `assets/logo.png` extraídos sem erro) |
| Download do ZIP no navegador | ⚠️ não automatizável no teste headless — requer clicar em "Exportar" manualmente para confirmação final |

## 8. Comportamento `file://` (abrir o HTML direto do disco)

O README afirma que, sem servidor, "o conteúdo estático de demonstração é exibido como fallback".

| Página | Resultado |
| --- | --- |
| `index.html` | ✅ Conteúdo estático de demonstração preservado (fetch bloqueado por CORS, fallback estático visível) |
| `release.html` | ✅ Idem |
| `agenda.html` | ❌ **NÃO preserva o conteúdo estático** — a página fica sem eventos, com a mensagem "Não foi possível carregar a agenda neste momento." |

**Descrição do erro (8, agenda):** com `file://`, o `fetch` é bloqueado (origin `null`). Enquanto `home.js`/`release.js` apenas deixam de hidratar (mantendo o HTML estático), o `agenda.js` chama `renderList("[data-upcoming]", [])`, que **substitui o conteúdo por vazio e oculta o container** (`container.hidden = true`). A seção de passados também é ocultada. O resultado é uma agenda sem nenhum evento, diferente do fallback prometido no README e inconsistente com as outras páginas.

**Suspeita da causa:** o `agenda.js` re-renderiza os containers mesmo quando a fonte falha (lista vazia), em vez de manter o conteúdo existente; e o `renderList` do `content.js` sempre sobrescreve o `innerHTML` e oculta quando a lista está vazia, sem diferenciar "sem dados" de "fonte indisponível". O caminho de fallback estático descrito no README não é seguido pela agenda.

## 9. Outros pontos observados

- **Eventos cancelados vindos do Google: ❌ status incorreto.** Em `src/js/sources/google-icalendar.js` (função `toEvent`), a comparação de status usa `"CANCELED"` (um "L"), mas o padrão iCalendar/Google emitem `"CANCELLED"` (dois "L"). Em teste com um evento `STATUS:CANCELLED`, o parser retornou `confirmed` em vez de `cancelled`. **Suspeita:** erro de digitação na constante. Eventos cancelados de um calendário Google apareceriam como "Confirmado" (com botão de .ics/ingressos). (Sem correção aplicada, conforme solicitado.)
- Descrições de eventos do Google contendo HTML aparecem escapadas (texto puro/seguro) ✅
- `.ics` exportado é válido (`BEGIN:VCALENDAR...DTSTART:20260912T200000...`), com UID, DTSTAMP, LOCATION, SUMMARY, DESCRIPTION e URL ✅
- Eventos recorrentes: exibem a primeira ocorrência (limitação já documentada no README) — confirmado no parser, sem quebrar ✅

---

## Resultado geral

**⚠️ A maior parte funciona; há 2 bugs de código e 2 limitações/discordâncias registradas:**

**Funciona:** páginas e navegação, hidratação via `data/*.json`, agenda local (completa), exportação `.ics`, release eletrônico, catálogo de temas, configurador (passos + ZIP), Google Calendar via `.ics` espelhado no próprio site, fallbacks de `index`/`release` em `file://` e fallback automático quando o serviço externo falha.

**Não funciona / limitações (com descrição e suspeita):**
1. **Theme nunca é aplicado** (crítico) — `theme-loader.js:78` usa `STORAGE_ID` inexistente (deveria ser `STYLE_ID`). Suspeita: erro de digitação de variável; resultado: o site sempre fica com a aparência base.
2. **Google Calendar direto no navegador é bloqueado por CORS** — o endpoint público do Google não envia `Access-Control-Allow-Origin`. Suspeita: política CORS do Google; **contornável** espelhando o `.ics` no site (testado e aprovado) ou usando proxy com CORS.
3. **Eventos cancelados do Google ficam como "Confirmado"** — comparação `"CANCELED"` vs. padrão `"CANCELLED"`. Suspeita: erro de digitação na constante.
4. **Agenda em `file://` não mostra o fallback estático** (contraria o README) — `agenda.js` apaga o conteúdo quando a fonte falha. Suspeita: `renderList` sempre sobrescreve/oculta e a agenda não preserva o demo como `home`/`release`.

---

Nenhuma correção foi aplicada — apenas testes e registro. Alterações temporárias de teste (`data/calendar.json`, `data/calendar.ics`) foram revertidas; o repositório está limpo. Este é o único arquivo adicionado ao histórico de versão nesta branch.