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

## Themes da comunidade

Uma parte importante do projeto é permitir que a comunidade crie e compartilhe seus próprios Themes — conjuntos de estilos que definem a aparência do site de forma independente do conteúdo.

> O sistema de Themes ainda **não foi implementado**. A seguir estão apenas os princípios que guiarão o formato definitivo, que será documentado quando os contratos do projeto estiverem definidos. Por isso, **não há instruções técnicas de implementação nesta fase**.

Quando o sistema estiver disponível, os Themes da comunidade deverão:

- respeitar a **estrutura e os contratos definidos pelo projeto**;
- seguir boas práticas de **acessibilidade**;
- ser **responsivos** em diferentes tamanhos de tela;
- manter **compatibilidade com os recursos oficiais** do kit (agenda, release eletrônico, links e presença digital);
- possuir **licença adequada** e compatível com a licença do projeto;
- **não conter conteúdo ilegal** nem material incompatível com os valores do projeto.

O diretório `themes/official` é reservado aos Themes mantidos pela equipe do projeto; o diretório `themes/community` receberá os Themes enviados pela comunidade.

## Código de conduta

Ainda não existe um documento formal de código de conduta, mas buscamos manter um ambiente colaborativo, respeitoso e inclusivo. Trate todas as pessoas com consideração — críticas devem ser construtivas e focadas no projeto, nunca nas pessoas.