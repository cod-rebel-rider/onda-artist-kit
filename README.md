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
| Estrutura base do projeto | Organização de diretórios e documentação inicial | Em construção |
| Agenda de shows | Lista dos próximos eventos do artista | Planejado |
| Release eletrônico | Espaço para divulgação de lançamentos, com links para streaming/download | Planejado |
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

O projeto está em **desenvolvimento inicial**. Nenhum recurso foi implementado até o momento: o foco desta fase é estabelecer a fundação — estrutura de diretórios, documentação, convenções de versionamento e padrões de contribuição. À medida que os recursos forem evoluindo, esta seção será atualizada.

## Contribuição

Contribuições são muito bem-vindas! Para saber como participar — criação de branches, convenção de commits, envio de Pull Requests e futuras diretrizes de Themes — consulte o [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

Este projeto é distribuído sob a [MIT License](LICENSE).
