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
| Agenda de shows | Lista dos próximos eventos do artista | Planejado |
| Release eletrônico (Fase 3) | Página de release com biografia, integrantes, discografia, destaques, contratação e exportação em PDF | Implementado |
| Links e presença digital | Bloco de links para redes sociais, streaming e contato | Planejado |
| Sistema de Themes | Aparência separada do conteúdo, com temas oficiais e da comunidade | Planejado |

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
│   ├── official/        # Themes oficiais do projeto
│   └── community/       # Themes criados pela comunidade
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

## Hospedagem

Como o resultado é um site 100% estático (HTML, CSS e JavaScript), ele pode ser publicado praticamente em qualquer lugar:

- **GitHub Pages** — hospedagem gratuita integrada ao fluxo de trabalho do projeto;
- **Netlify, Vercel, Cloudflare Pages** e outros serviços com planos gratuitos;
- Hospedagens tradicionais, via envio dos arquivos por FTP/SFTP.

O projeto **não fica preso a nenhum provedor**: os arquivos gerados pertencem a você e podem ser movidos para outra hospedagem quando quiser. A escolha do serviço fica sempre a critério de quem usa o kit.

## Themes

Um dos pilares do projeto é separar a **aparência** do **conteúdo**:

- Todo o material do artista (dados, textos, imagens, agenda, links) fica isolado do visual;
- A aparência é definida por **Themes**, que podem ser trocados sem afetar o conteúdo;
- Haverá Themes **oficiais**, mantidos pelo projeto, e Themes **da comunidade**, criados e compartilhados por qualquer pessoa;
- As diretrizes para criar e enviar Themes constam no [`CONTRIBUTING.md`](CONTRIBUTING.md).

> O sistema de Themes ainda não foi implementado — nesta fase apenas reservamos a estrutura de diretórios (`themes/official` e `themes/community`) e definimos os princípios que guiarão seu design.

## Status do projeto

O projeto está em **desenvolvimento inicial**, avançando por fases. A **Fase 1 — Core do Site** já está implementada: página inicial funcional, componentes base reutilizáveis, CSS modular orientado a tokens (preparado para os Themes) e navegação responsiva e acessível. O conteúdo exibido é demonstrativo — "Banda Exemplo", uma banda fictícia.

Próximas fases planejadas: sistema de conteúdo baseado em JSON, agenda integrada, sistema de Themes e os demais recursos da proposta. As decisões técnicas do Core estão documentadas em [`docs/core-arquitetura.md`](docs/core-arquitetura.md).

## Contribuição

Contribuições são muito bem-vindas! Para saber como participar — criação de branches, convenção de commits, envio de Pull Requests e futuras diretrizes de Themes — consulte o [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

Este projeto é distribuído sob a [MIT License](LICENSE).
