# Onda Artist Kit

Kit open source para criação de sites estáticos voltados a artistas independentes — bandas, músicos, DJs, artistas solo, coletivos e outros projetos da cena independente.

A proposta é oferecer uma base simples, leve e de baixo custo para que qualquer artista consiga colocar sua presença digital no ar sem depender de plataformas fechadas, assinaturas caras ou conhecimento avançado de desenvolvimento web.

## Proposta

- Criação de sites para bandas, músicos, DJs, artistas solo, coletivos e outros projetos independentes;
- Baixo custo de operação;
- Possibilidade de hospedagem gratuita;
- Compatibilidade com GitHub Pages, sem excluir outras opções;
- Liberdade para utilizar outras hospedagens, sem depender de um provedor específico;
- Agenda de shows;
- Divulgação de release eletrônico;
- Links e presença digital reunidos em um só lugar;
- Sistema de Themes, com aparência separada do conteúdo;
- Projeto aberto à contribuição da comunidade.

> **Importante:** o Onda Artist Kit está em desenvolvimento inicial. Os recursos acima são o escopo planejado do projeto e serão implementados gradualmente — nenhum deles está pronto ainda.

## Objetivos do projeto

- Reduzir a barreira técnica e financeira para artistas independentes terem um site próprio;
- Oferecer uma base de código limpa, leve, bem documentada e fácil de personalizar;
- Garantir autonomia: quem utiliza mantém o controle total do conteúdo e dos dados;
- Evitar dependência de plataformas ou provedores específicos (sem *lock-in*);
- Estimular a colaboração da comunidade, por meio de Themes, exemplos e documentação.

## Principais recursos planejados

| Recurso | Descrição | Situação |
| --- | --- | --- |
| Core do site (Fase 1) | Página inicial, componentes base e navegação responsiva | Implementado (base) |
| Agenda de shows (Fase 4) | Próximos shows, histórico, status, ingressos, mapa e exportação .ics — via `data/shows.json` | Implementado |
| Google Calendar (Fase 5) | Fonte opcional da agenda via calendário público (sem API Key/OAuth) com fallback local | Implementado (opcional) |
| Release eletrônico (Fase 3) | Página de release com biografia, integrantes, discografia, destaques, contratação e exportação em PDF | Implementado |
| Links e presença digital | Bloco de links para redes sociais, streaming e contato | Planejado |
| Sistema de Themes (Fase 6) | Aparência separada do conteúdo — seleção por `data/site.json`, temas Default, Midnight e Brutalist, com fallback | Implementado |

## Estrutura inicial

```text
onda-artist-kit/
│
├── assets/              # arquivos estáticos
│   ├── images/          # imagens gerais
│   ├── icons/           # ícones e favicon
│   └── fonts/           # fontes utilizadas
│
├── data/                # conteúdo e dados (agenda, releases, links)
│
├── src/
│   ├── css/             # estilos base
│   ├── js/              # scripts base
│   ├── components/      # componentes reutilizáveis
│   └── pages/           # páginas do kit
│
├── themes/
│   ├── default/           # Theme padrão (referência) — theme.json + theme.css
│   ├── midnight/          # Theme noturno/tecnológico
│   ├── brutalist/         # Theme cru/experimental
│   ├── index.html         # catálogo de Themes
│   └── theme-catalog.js
│
├── docs/                # documentação adicional
│
├── examples/            # exemplos de uso
│
├── index.html
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── .gitignore
```

## Como executar

O Core é 100% estático — basta abrir o `index.html` no navegador. Para servir localmente (recomendado para validar navegação e caminhos):

```bash
python3 -m http.server 8000
# ou, com Node.js:
npx serve .
```

- Página inicial do site: `index.html`
- Release eletrônico: `release.html` — o botão “Baixar / imprimir release” abre a janela de impressão do navegador (Ctrl+P → “Salvar como PDF”)
- Agenda de shows: `agenda.html` — próximos shows, histórico, status, ingressos, mapa e “Adicionar ao calendário” (.ics)
- Catálogo de Themes: `themes/` — pré-visualize os temas disponíveis
- Página de componentes (ferramenta de desenvolvimento): `src/pages/components.html`
- Decisões técnicas do Core: [`docs/core-arquitetura.md`](docs/core-arquitetura.md)

As páginas carregam os dados de `data/*.json` via `fetch`. Servindo localmente (comandos acima), o conteúdo exibido vem dos JSONs; abrindo os arquivos diretamente (`file://`), o navegador bloqueia o `fetch` e o conteúdo estático de demonstração é exibido como fallback.

## Dados do conteúdo (`data/`)

O conteúdo do site e do release é carregado dos arquivos JSON do diretório `data/` — personalize-os para usar o kit com o seu projeto:

### `data/band.json` — dados do artista

| Campo | Uso |
| --- | --- |
| `name`, `tagline`, `city`, `state`, `genre` | identificação exibida no site e no release |
| `genres` | lista de gêneros (badges na identidade musical) |
| `founded` | ano de início (ficha técnica) |
| `about` | parágrafos da seção Sobre |
| `members` | lista de `{ name, role }` (integrantes) |
| `musicalIdentity` | texto da identidade musical no release |
| `logo`, `logoAlt` | logotipo (opcional; sem ele, usa-se a marca do Core) |
| `photo`, `photoAlt` | foto principal do release (opcional; sem ela, o elemento é ocultado) |

### `data/links.json` — redes e links

Lista `links` com `{ label, url }` — apenas as plataformas configuradas são exibidas, no site e no release.

### `data/release.json` — dados do release

| Campo | Uso |
| --- | --- |
| `headline` | chamada exibida no topo do release |
| `presentation` | texto de apresentação |
| `biography` | parágrafos da biografia |
| `highlights` | lista de destaques (a seção é ocultada se vazia) |
| `experience` | atuação/experiência (a seção é ocultada se vazia) |
| `discography` | lançamentos: `title`, `type` (single, EP, álbum), `year`, `description`, `cover` (opcional) e `links` (ex.: `spotify`, `youtube`, `bandcamp` — apenas links informados geram botões) |
| `booking` | `description`, `email`, `phone` (opcionais; vazios não são exibidos) |

Campos de imagem (`logo`, `photo`, `cover`) aceitam caminhos em `assets/` ou `null` — o Core aplica fallback (marca do Core, iniciais da capa) ou oculta o elemento, sem imagens quebradas.

### `data/shows.json` — agenda de shows

Cada show é um objeto dentro da lista `shows`. Datas em ISO (`YYYY-MM-DD`) e horários em `HH:mm` — a apresentação amigável (“Sábado, 12 de setembro de 2026”, “12 SET”) é feita pelo Core com `Intl`; nenhuma conversão de fuso horário é aplicada (data e hora locais).

| Campo | Obrigatório | Uso |
| --- | --- | --- |
| `id` | sim (estável) | identificador único do evento — não use índice de array |
| `title` | sim | nome do evento |
| `date` | sim | data em ISO `YYYY-MM-DD` |
| `startTime` / `endTime` | opcional | horários em `HH:mm` |
| `venue`, `city`, `state`, `country` | opcional | local e cidade |
| `address` | opcional | endereço completo |
| `description` | opcional | descrição do evento |
| `mapUrl` | opcional | link externo para mapa (botão “Ver no mapa”) |
| `ticketUrl` | opcional | link de ingressos (botão “Ingressos”; vazio = sem botão) |
| `status` | opcional | `confirmed` (padrão), `cancelled` ou `postponed` |
| `originalDate` | opcional | data original do show, quando adiado |

Exemplo completo:

```json
{
  "shows": [
    {
      "id": "show-001",
      "title": "Festival da Cena Independente",
      "date": "2026-09-12",
      "startTime": "20:00",
      "endTime": "21:00",
      "venue": "Nome do Local",
      "city": "Brasília",
      "state": "DF",
      "country": "BR",
      "description": "Descrição do evento.",
      "address": "Endereço do local",
      "mapUrl": "https://www.openstreetmap.org/",
      "ticketUrl": "https://plataforma-de-ingressos.exemplo/",
      "status": "confirmed"
    }
  ]
}
```

**Como adicionar um show:** copie um objeto existente dentro de `shows`, altere `id`, dados e publique o site novamente. A classificação (próximos/passados) e a ordenação são automáticas — a ordem dos itens no arquivo é livre.

**Como cancelar um show:** mude o `status` para `"cancelled"`. O evento continua visível com o selo **CANCELADO** e deixa de exibir botão de ingressos e de calendário.

**Como adiar um show:** mude o `status` para `"postponed"`, atualize `date` com a nova data e informe `originalDate` com a data anterior — a interface exibe o selo **ADIADO** e a nota “Adiado de … para …”.

Eventos com dados inválidos (título ou data ausente/inválida) são ignorados com aviso no console, sem quebrar a página. Futuros (incluindo cancelados e adiados) aparecem em “Próximos shows”; passados vão para “Shows anteriores”.

## Usando Google Calendar

O Onda Artist Kit pode usar um **Google Calendar público** como fonte da agenda, no lugar de editar `data/shows.json`. A integração é **opcional** e **não usa API Key, OAuth, senha nem acesso à sua conta Google**: utiliza apenas o endereço público que o próprio Google disponibiliza para calendários públicos.

### Como configurar

1. Crie um calendário no Google Calendar (ou use um existente);
2. Deixe-o **público**: em Configurações → *Access permissions for events* → marque **Make available to public**;
3. Copie o endereço do calendário. Em Configurações → *Integrate calendar*, existe a opção **Public address in iCal format**, com um formato parecido com:

   ```text
   https://calendar.google.com/calendar/ical/xxxxxxxx%40group.calendar.google.com/public/basic.ics
   ```

   (iCal é só outro nome para o formato de calendário compartilhável. O `calendarId` é a parte `xxxxxxxx@group.calendar.google.com`.)

4. Em `data/calendar.json`, ative a integração — informando `calendarId` **ou** `publicUrl`:

   ```json
   {
     "enabled": true,
     "mode": "google",
     "provider": "google",
     "calendarId": "xxxxxxxx@group.calendar.google.com",
     "publicUrl": ""
   }
   ```

5. Publique o site.

Para desativar e voltar ao arquivo local, mude para `"enabled": false` (ou `"mode": "local"`).

### Como funciona

- `mode: "local"` → agenda a partir de `data/shows.json`;
- `mode: "google"` → agenda a partir do Google Calendar público. Se o Google estiver indisponível, o navegador bloquear o acesso ou a configuração estiver incompleta, o kit **usa automaticamente `data/shows.json`** (fallback) — o site nunca fica sem agenda por causa do serviço externo;
- as duas fontes **nunca são misturadas** (evita shows duplicados);
- os eventos aparecem nos horários locais de quem visita; eventos sem fuso usam data/hora como cadastrados.

### Google Calendar e CORS

**Um calendário público não significa leitura liberada pelo navegador.** O endereço `.ics` público funciona para assinar o calendário em apps e para abrir direto no navegador, mas isso **não garante** que uma página hospedada em outro domínio consiga ler esse endereço com `fetch()` (JavaScript). O Google pode não enviar as permissões necessárias (*CORS*) e o navegador bloqueia a leitura — é uma política de segurança dos navegadores, **não** um defeito do Google Calendar nem do Onda Artist Kit.

Na prática:

- a integração externa é **opcional** e nunca é requisito: se a leitura for bloqueada (*CORS*, rede ou calendário indisponível), o kit **usa automaticamente a agenda local** (`data/shows.json`) — o site continua funcionando, sem backend, proxy nem API Key;
- para hospedagem estática (GitHub Pages, Netlify, Vercel etc.), a **solução recomendada** é usar uma **cópia do `.ics` dentro do próprio projeto** — assim o arquivo passa a ser lido do mesmo domínio do site, sem bloqueio de CORS:

  ```text
  Google Calendar
        ↓
  exportar/obter o .ics público
        ↓
  data/calendar.ics  (cópia versionada no projeto)
        ↓
  Onda Artist Kit (lê do próprio site — sem CORS)
  ```

  Passo a passo:

  1. abra o endereço `.ics` público (passo 3 de “Como configurar”) no navegador;
  2. salve o conteúdo como `data/calendar.ics` dentro do projeto;
  3. em `data/calendar.json`, aponte o `publicUrl` para o arquivo:

     ```json
     {
       "enabled": true,
       "mode": "google",
       "provider": "google",
       "calendarId": "",
       "publicUrl": "data/calendar.ics"
     }
     ```

  4. publique o site (ou gere o `.zip` no configurador) normalmente.

- **sem sincronização automática**: o `data/calendar.ics` é uma “fotografia” do calendário — sempre que a agenda mudar, baixe o `.ics` novamente e republique. Em troca, a leitura funciona em qualquer hospedagem estática e não depende do Google no momento da visita;
- um **proxy** (serviço intermediário que repassa o feed com CORS liberado) poderia contornar essa limitação, mas é apenas uma **possibilidade futura/opcional**: a arquitetura do kit permanece “site estático + dados locais + fallback externo opcional”, sem depender de proxy, backend ou credenciais.

### Privacidade e limitações

- **Use apenas informações públicas**: qualquer pessoa que abrir o site verá os eventos do calendário;
- não coloque dados privados no calendário usado pelo site;
- o kit nunca pede senha, token nem acesso à sua conta — somente o endereço público;
- mudanças no calendário podem levar alguns minutos para aparecer no site;
- **eventos recorrentes**: o kit exibe a primeira ocorrência de cada evento repetido (expansão completa ainda não é suportada);
- a leitura do endereço do Google pode ser bloqueada pelo navegador (técnica chamada *CORS*) — veja a seção **Google Calendar e CORS** acima: o fallback local entra sozinho e a alternativa recomendada é o `.ics` dentro do projeto.

## Hospedagem

Como o resultado é um site 100% estático (HTML, CSS e JavaScript), ele pode ser publicado praticamente em qualquer lugar:

- **GitHub Pages** — hospedagem gratuita integrada ao fluxo de trabalho do projeto;
- **Netlify, Vercel, Cloudflare Pages** e outros serviços com planos gratuitos;
- Hospedagens tradicionais, via envio dos arquivos por FTP/SFTP.

O projeto **não fica preso a nenhum provedor**: os arquivos gerados pertencem a você e podem ser movidos para outra hospedagem quando quiser. A escolha do serviço fica sempre a critério de quem usa o kit.

## Themes

Um dos pilares do projeto é separar a **aparência** do **conteúdo**. Cada Theme controla apenas a identidade visual; os dados do artista (`data/`) e o funcionamento do Core (`src/`) ficam intactos.

### Como selecionar um Theme

No arquivo `data/site.json`, defina a propriedade `theme` com o id do tema:

```json
{ "theme": "midnight" }
```

Valores válidos incluídos: `default`, `midnight` e `brutalist`. Ao trocar e recarregar o site, a aparência muda — o conteúdo permanece o mesmo. Se o tema informado não existir ou estiver incompleto, o kit usa automaticamente o **Theme Default** (o site nunca quebra).

### Estrutura de um Theme

Cada Theme é uma unidade independente em `themes/<id>/`:

```text
themes/meu-tema/
├── theme.json     # manifesto (obrigatório)
├── theme.css      # estilo (obrigatório)
└── assets/        # opcional: imagens, fontes, texturas, SVGs do tema
```

O `theme.json` descreve o tema:

```json
{
  "id": "meu-tema",
  "name": "Meu Tema",
  "version": "1.0.0",
  "description": "Descrição curta.",
  "author": "Seu nome",
  "license": "MIT",
  "themeColor": "#0e1016"
}
```

O `theme.css` sobrescreve os tokens de design do Core (`src/css/variables.css`) usando CSS Custom Properties — por exemplo `--color-accent`, `--font-display`, `--radius-lg`, `--space-md`. Consulte o **Theme Contract** em [`docs/core-arquitetura.md#themes`](docs/core-arquitetura.md#themes) para a lista completa de variáveis e componentes estilizáveis.

### Assets, fontes e licença

- Assets específicos de um tema ficam **dentro da pasta do tema** (não em `assets/` global);
- Prefira fontes livres e forneça **fallback** — não dependa exclusivamente de uma fonte externa;
- Assets/fontes de terceiros exigem documentação de origem e licença compatível com a MIT License do projeto;
- **O Theme não deve conter dados do artista** (nome, biografia, agenda, links) — eles pertencem a `data/`.

### Contribuindo com Themes

Veja o fluxo completo (fork → branch → criar theme → testar → PR) no [`CONTRIBUTING.md`](CONTRIBUTING.md#themes). O catálogo de temas do projeto fica em [`themes/`](themes/index.html).

## Status do projeto

O projeto está em **desenvolvimento inicial**, avançando por fases. A **Fase 1 — Core do Site** já está implementada: página inicial funcional, componentes base reutilizáveis, CSS modular orientado a tokens (preparado para os Themes) e navegação responsiva e acessível. O conteúdo exibido é demonstrativo — "Banda Exemplo", uma banda fictícia.

Próximas fases planejadas: sistema de conteúdo baseado em JSON, agenda integrada, sistema de Themes e os demais recursos da proposta. As decisões técnicas do Core estão documentadas em [`docs/core-arquitetura.md`](docs/core-arquitetura.md).

## Contribuição

Contribuições são muito bem-vindas! Para saber como participar — criação de branches, convenção de commits, envio de Pull Requests e futuras diretrizes de Themes — consulte o [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

Este projeto é distribuído sob a [MIT License](LICENSE).
