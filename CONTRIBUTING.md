# Contribuindo com o Onda Artist Kit

Obrigado pelo interesse em contribuir! Este documento explica como participar do projeto, desde a primeira alteração até o envio de um Pull Request.

Se ainda não conhece o projeto, comece lendo o [`README.md`](README.md) para entender a proposta e o estado atual do desenvolvimento.

## Como contribuir

O fluxo básico de contribuição é:

1. Faça um fork;
2. Clone o repositório;
3. Crie uma branch para a sua tarefa;
4. Desenvolva a alteração;
5. Teste;
6. Faça o commit;
7. Envie um Pull Request.

### 1. Fork

Faça um fork do repositório para sua conta do GitHub clicando em **Fork** na página do projeto.

### 2. Clone

Clone o seu fork:

```bash
git clone git@github.com:SEU-USUARIO/onda-artist-kit.git
cd onda-artist-kit
```

Se contribui com frequência, vale adicionar o repositório oficial como remote:

```bash
git remote add upstream git@github.com:Onda-Noturna/onda-artist-kit.git
```

Assim, `origin` aponta para o seu fork e `upstream` para o repositório oficial do projeto.

### 3. Crie uma branch

Sempre crie uma branch nova **a partir da `dev`**, que é a branch de desenvolvimento do projeto:

```bash
# atualize a referência local da dev
git fetch upstream
git switch dev
git merge --ff-only upstream/dev

# crie a branch da sua tarefa
git switch -c feature/nome-da-funcionalidade
```

Nunca faça alterações diretamente na `dev`.

### 4. Desenvolva a alteração

Implemente a sua tarefa mantendo o código organizado e coerente com a estrutura existente do projeto.

### 5. Teste

O projeto ainda não possui suíte de testes automatizados. Por enquanto, valide suas alterações manualmente:

- Abra o `index.html` no navegador e confirme que tudo funciona como esperado;
- Revise o HTML/CSS/JavaScript produzido em diferentes tamanhos de tela;
- Garanta que nada existente foi quebrado.

Evite adicionar dependências ou frameworks sem necessidade real.

### 6. Faça o commit

Escreva o commit seguindo a [convenção de commits](#commits) do projeto:

```bash
git add .
git commit -m "feat: adiciona página de agenda"
```

Prefira commits pequenos e objetivos: um commit deve representar uma única mudança lógica.

### 7. Envie um Pull Request

Envie a branch para o seu fork e abra o Pull Request:

```bash
git push -u origin feature/nome-da-funcionalidade
```

Abra o Pull Request direcionado à branch **`dev`** do repositório oficial do projeto.

## Branches

O projeto utiliza uma convenção simples de nomes de branches:

| Prefixo | Uso |
| --- | --- |
| `feature/nome-da-funcionalidade` | novas funcionalidades |
| `fix/nome-do-problema` | correção de problemas |
| `docs/nome-da-documentacao` | documentação |
| `style/nome-da-alteracao` | ajustes de estilo/visual |
| `chore/nome-da-tarefa` | tarefas de manutenção e infraestrutura |

Regras:

- `dev` é a branch de desenvolvimento do projeto;
- **alterações não devem ser feitas diretamente na `dev`** (nem na `main`);
- cada tarefa deve possuir sua própria branch;
- a branch deve ser sempre criada a partir da versão mais recente da `dev`;
- as alterações retornam para a `dev` através de Pull Request, quando aplicável.

## Commits

O projeto utiliza commits em português, no formato:

```text
tipo: descrição curta e objetiva
```

Tipos disponíveis:

| Tipo | Uso |
| --- | --- |
| `feat:` | nova funcionalidade |
| `fix:` | correção de bug |
| `docs:` | documentação |
| `style:` | formatação ou ajustes visuais |
| `refactor:` | refatoração de código sem mudança de comportamento |
| `test:` | criação ou ajuste de testes |
| `chore:` | tarefas de manutenção e infraestrutura |

Exemplos:

```text
feat: adiciona página de agenda
fix: corrige exibição dos eventos
docs: atualiza documentação de contribuição
style: ajusta layout do tema
refactor: reorganiza componentes
test: adiciona testes para agenda
chore: atualiza estrutura do projeto
```

Boas práticas:

- escreva a descrição em minúsculas, sem ponto final;
- mantenha o assunto curto (até ~72 caracteres);
- um commit deve cobrir uma única mudança lógica.

## Pull Requests

Ao abrir um Pull Request, procure garantir que ele:

- possua **título objetivo** (de preferência alinhado ao commit principal);
- **explique o que foi alterado**;
- **explique o motivo** da alteração, quando necessário;
- **informe os testes realizados**;
- **não misture várias tarefas independentes** — um Pull Request por tarefa.

Todos os Pull Requests devem ter como destino a branch `dev`.

## Themes

A comunidade pode criar e compartilhar Themes — conjuntos de estilos que definem a aparência do site independentemente do conteúdo. O sistema de Themes já está implementado no projeto.

Para contribuir com um Theme, siga o mesmo fluxo geral de contribuição:

1. **Fork** o repositório;
2. **Atualize a `dev`** (fetch + `git pull --ff-only origin dev`);
3. **Crie uma branch** a partir da `dev` — ex.: `feat/theme-meu-tema`);
4. **Crie o Theme** em `themes/meu-tema/` com pelo menos `theme.json` e `theme.css` (veja [`docs/core-arquitetura.md#themes`](docs/core-arquitetura.md#themes));
5. **Teste** aplicando o tema pelo `data/site.json` em pelo menos Home, Release, Agenda, mobile e impressão;
6. **Commit** (`feat: adiciona tema X` ou `style: ...`);
7. **Push** e **Pull Request** para a `dev`.

### Boas práticas para Themes

Os Themes contribuídos devem:

- **funcionar com o Core** e com todos os componentes (header, navegação, botões, cards, ShowCard, footer);
- usar **CSS Custom Properties** (tokens) sempre que possível, sobrescrevendo os valores definidos em `src/css/variables.css`;
- fornecer **fallback** e não depender exclusivamente de fontes ou serviços externos;
- ser **responsivos** em mobile, tablet e desktop;
- ser **acessíveis**: contraste adequado, foco visível, `prefers-reduced-motion` quando houver animação, status comunicados por texto;
- respeitar **licenças** e documentar qualquer asset/fonte de terceiros com sua atribuição;
- **não conter malware, rastreadores ocultos, coleta de dados, redirecionamentos, iframes suspeitos ou dependências externas desnecessárias**;

Themes são tratados como **código de terceiros** e devem ser revisáveis e o mais simples possível (priorize CSS; JavaScript dentro de Themes só se houver real necessidade, devidamente isolado).

> O Theme não deve conter dados do artista (nome, biografia, agenda, links). Esses dados pertencem a `data/`. O Theme fornece apenas a apresentação visual.

## Código de conduta

Ainda não existe um documento formal de código de conduta, mas buscamos manter um ambiente colaborativo, respeitoso e inclusivo. Trate todas as pessoas com consideração — críticas devem ser construtivas e focadas no projeto, nunca nas pessoas.