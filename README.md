# Barbearia Vintage — Web

Interface do sistema interno de agendamentos da Barbearia Vintage.
React + Vite, sem framework de UI.

Backend: [`barbearia-vintage-api`](../barbearia-vintage-api) · Node + Express + PostgreSQL.

---

## Rodando

Pré-requisito: a **API precisa estar no ar** ([instruções aqui](../barbearia-vintage-api/README.md)).

```bash
git clone <url-deste-repositorio> barbearia-vintage-web
cd barbearia-vintage-web
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

### Acesso de teste

```
e-mail: marcelo@barbeariavintage.com
senha:  vintage123
```

Criado pelo `npm run seed` da API. As credenciais também aparecem na própria
tela de login, para o avaliador não precisar procurar.

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3333` | URL da API. |
| `VITE_TIMEZONE` | `America/Sao_Paulo` | Fuso da barbearia. Precisa bater com o `TIMEZONE` da API. |

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR. |
| `npm run build` | Build de produção em `dist/`. |
| `npm run preview` | Serve o build localmente, para conferir antes de publicar. |

---

## As telas

### Login
Única rota pública. O token vai para o `localStorage`; ao recarregar, o app
chama `/auth/me` antes de decidir se mostra a agenda ou volta ao login. Sessão
expirada derruba para cá com aviso, de qualquer lugar do sistema.

### Agenda — a tela principal
É onde o Marcelo passa o dia:

- navegação por dia (anterior / próximo / calendário / voltar para hoje);
- horário em destaque, cliente, serviço, preço e duração em cada linha;
- **pílula de status que vira menu**: um clique troca entre agendado, concluído,
  cancelado e não compareceu, sem abrir formulário;
- cancelado e não compareceu aparecem apagados e riscados — a agenda se lê de longe;
- quatro números do topo respondem à pergunta da carta: quantos atendimentos,
  quanto faturou, quantos faltaram e qual serviço foi mais pedido nos últimos 7 dias.

### Novo / editar agendamento
Cliente, serviço, data, horário e observações. Quando o backend recusa o horário
com `409`, a mensagem aparece **colada no campo de horário**, não num alerta
genérico no topo.

### Clientes
Busca com atraso de digitação, criação e edição em modal, contagem de
atendimentos por pessoa. A remoção pede confirmação **dizendo o nome** de quem
será removido, e a API recusa se houver horário futuro marcado.

### Serviços
Nome, duração, preço e situação. Serviço com histórico é desativado em vez de
apagado — a agenda antiga continua íntegra, e o sistema explica isso na hora.

---

## Decisões de interface

Quem usa isso todo dia são duas pessoas sem formação técnica. Isso guiou o resto:

- **Nada de jargão na tela.** "Não compareceu", não `NO_SHOW`. "Observações", não `notes`.
- **Toda ação dá retorno.** Ao criar um agendamento, o aviso diz para qual e-mail
  a confirmação foi enviada — o laço com a automação fecha na frente do usuário.
- **Estados sempre visíveis.** Carregando, vazio e erro têm tratamento próprio em
  cada tela; nenhuma delas fica em branco esperando.
- **Estados vazios que ensinam.** "Nenhum agendamento neste dia" vem com o botão
  de criar ao lado.
- **Confirmação nomeada.** "Remover João Pedro Silva?" em vez de "Tem certeza?".
- **Acessibilidade.** Rótulos ligados aos campos, foco visível, `Esc` fecha modal,
  menus com `aria`, e `prefers-reduced-motion` respeitado.
- **Responsivo.** A barra lateral vira topo abaixo de 820px; a agenda se reorganiza
  em duas linhas no celular.

---

## Estrutura

```
src/
├── main.jsx                  entrada
├── App.jsx                   rotas e providers
├── index.css                 design system (tokens, componentes, responsivo)
├── api/client.js             axios + interceptores + tradução de erro da API
├── auth/AuthContext.jsx      sessão, login e logout
├── lib/format.js             datas, moeda e rótulos de status
├── components/
│   ├── Layout.jsx            casca protegida, estado vazio, alerta de erro
│   ├── Field.jsx             campos com rótulo, dica e erro
│   ├── Modal.jsx             modal e confirmação
│   ├── StatusPill.jsx        pílula de status com menu
│   └── Toast.jsx             avisos de retorno
└── pages/
    ├── LoginPage.jsx
    ├── AgendaPage.jsx
    ├── AppointmentModal.jsx
    ├── ClientsPage.jsx
    └── ServicesPage.jsx
```

CSS escrito à mão em um arquivo, organizado por tokens no `:root`. Para cinco
telas, isso pesa menos e lê melhor que instalar uma biblioteca de componentes.

---

## Sobre o fuso horário

O front nunca usa o relógio do navegador para decidir que dia é "hoje" — usa
`VITE_TIMEZONE`, o mesmo fuso que a API. Se alguém abrir o sistema de outro país,
ou com o relógio da máquina errado, a agenda continua mostrando o dia certo da
barbearia.

O que trafega para a API é sempre `date` (`AAAA-MM-DD`) e `time` (`HH:MM`) no
fuso da barbearia; a conversão para UTC acontece no backend, num lugar só.

---

## Deploy

Build estático — Vercel, Netlify ou Cloudflare Pages servem direto.

```bash
npm run build     # gera dist/
```

Duas coisas para não esquecer:

1. Definir `VITE_API_URL` com a URL pública da API **antes** do build (o Vite
   embute o valor no bundle).
2. Adicionar essa origem ao `CORS_ORIGIN` do backend.

É uma SPA: configure o fallback para `index.html`, senão recarregar em `/agenda`
devolve 404. Na Vercel e na Netlify isso já é o padrão para projetos Vite.
