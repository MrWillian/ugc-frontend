# Planos e cobrança: checkout Stripe e paywall de limites

## Problem Statement

O Client que se cadastra na plataforma entra no plano FREE e não tem como sair
dele pelo produto. A tela de Configurações mostra o plano atual e um botão
"Upgrade — em breve" permanentemente desabilitado, então a única forma de
alguém pagar hoje é um atendimento manual fora do dashboard.

O problema fica pior quando o Client esbarra nos limites do plano. Ao tentar
criar uma segunda campanha ativa ou um segundo widget no tier starter, o
backend recusa com 403 e uma mensagem em português que explica exatamente o
que aconteceu e sugere o upgrade. O dashboard descarta essa informação: o
cliente HTTP do front lança um `Error` só com o texto, sem o status, e o
formulário exibe a mensagem como se fosse um erro de preenchimento, sem
nenhum caminho para resolver. O usuário vê "Limite de widgets atingido para o
seu plano (1)" e não tem para onde clicar.

O resultado é que o momento de maior intenção de compra — a pessoa tentando
fazer mais do que o plano permite — termina num beco sem saída.

## Solution

Uma superfície de Planos e cobrança no dashboard, e a ligação dela com os
pontos onde o limite é atingido.

O Client passa a ter uma página `/billing` que mostra o plano atual com o
status da assinatura e a data de renovação, compara os três tiers com os
limites reais de cada um, e permite fazer upgrade. O upgrade redireciona para
o Stripe Checkout e, na volta, o dashboard confirma o novo plano. Quem já tem
assinatura pode cancelar, com confirmação explícita de que isso rebaixa a
conta para STARTER.

E quando o backend recusa uma criação por limite de plano, o front passa a
reconhecer esse caso específico: exibe a mensagem do backend e um link direto
para `/billing`, transformando o beco sem saída numa rota de upgrade.

## User Stories

1. Como Client autenticado, quero acessar uma página de Planos pelo menu
   lateral, para encontrar cobrança sem precisar adivinhar a URL.
2. Como Client autenticado, quero ver qual é o meu plano atual em destaque,
   para saber onde estou antes de decidir mudar.
3. Como Client com assinatura paga, quero ver o status da minha assinatura
   (ativa, cancelada, pagamento atrasado), para saber se existe algo pendente
   da minha parte.
4. Como Client com assinatura paga, quero ver a data da próxima renovação,
   para me planejar financeiramente.
5. Como Client no plano FREE, quero que a ausência de data de renovação não
   pareça um erro, para não achar que a página está quebrada.
6. Como Client autenticado, quero ver os três planos pagos lado a lado, para
   comparar antes de escolher.
7. Como Client autenticado, quero ver quantas campanhas ativas, quantos posts
   por mês e quantos widgets cada plano permite, para escolher com base no meu
   uso real e não no nome do plano.
8. Como Client autenticado, quero que o meu plano atual esteja marcado
   visualmente na comparação, para não contratar o que já tenho.
9. Como Client autenticado, quero clicar em um plano e ser levado ao
   pagamento, para concluir a compra sem falar com ninguém.
10. Como Client autenticado, quero ver um estado de carregamento enquanto a
    sessão de checkout é criada, para não clicar duas vezes e gerar duas
    sessões.
11. Como Client que concluiu o pagamento, quero voltar para uma página de
    confirmação no dashboard, para ter certeza de que a compra foi registrada.
12. Como Client que concluiu o pagamento, quero que o plano exibido já reflita
    a compra quando eu voltar, para não precisar recarregar a página.
13. Como Client que concluiu o pagamento, quero um caminho claro de volta ao
    dashboard a partir da confirmação, para retomar o trabalho.
14. Como Client que desistiu no Stripe, quero voltar para uma página que diz
    que nada foi cobrado, para não ficar em dúvida se paguei.
15. Como Client que desistiu no Stripe, quero poder tentar o upgrade de novo
    com um clique, para não recomeçar o fluxo do zero.
16. Como Client com assinatura ativa, quero poder cancelar pelo dashboard,
    para não depender de suporte.
17. Como Client prestes a cancelar, quero uma confirmação que diga que a conta
    será rebaixada para STARTER, para não cancelar por engano.
18. Como Client sem assinatura ativa, quero que a opção de cancelar não
    apareça, para não receber um erro ao clicar em algo inaplicável.
19. Como Client que acabou de cancelar, quero ver o plano e o status
    atualizados na própria página, para confirmar que o cancelamento valeu.
20. Como Client autenticado, quero que falhas ao carregar a assinatura apareçam
    como erro com opção de tentar de novo, para não ficar com a tela vazia.
21. Como Client autenticado, quero que falhas ao iniciar o checkout apareçam
    perto do botão que cliquei, para entender o que falhou.
22. Como Client no tier starter tentando criar uma segunda campanha, quero ver
    a mensagem do backend explicando o limite e um link para Planos, para
    conseguir resolver na hora.
23. Como Client tentando reativar uma campanha acima do limite, quero o mesmo
    tratamento do cadastro de campanha, para ter uma experiência consistente.
24. Como Client no tier starter tentando criar um segundo widget, quero ver a
    mensagem do limite e um link para Planos, para conseguir resolver na hora.
25. Como Client autenticado, quero que erros de validação comuns continuem
    aparecendo como antes, sem link de upgrade, para não ser empurrado a pagar
    por um erro de digitação.
26. Como Client na tela de Configurações, quero que o botão "Upgrade" leve a
    algum lugar de verdade, para não encontrar uma promessa vazia.
27. Como visitante não autenticado, quero ser mandado para o login ao tentar
    abrir `/billing`, para que os dados de cobrança fiquem protegidos.
28. Como Client autenticado, quero que a página funcione em telas estreitas,
    para conseguir fazer upgrade pelo celular.
29. Como usuário de leitor de tela, quero que erros e estados de carregamento
    sejam anunciados, para acompanhar o fluxo de pagamento sem ver a tela.

## Implementation Decisions

### Contrato do backend (verificado no código do `ugc-backend`)

O `SubscriptionController` expõe três rotas, todas sob `JwtAuthGuard`:

- `GET /subscription/current` devolve `plan`, `subscriptionStatus`,
  `currentPeriodEnd`, `stripeCustomerId` e `stripeSubscriptionId`. O serviço só
  consulta o Stripe para refrescar status e período quando existe
  `stripeSubscriptionId`. Em FREE e STARTER sem assinatura, `subscriptionStatus`
  e `currentPeriodEnd` vêm `null` — **estado normal, não erro**.
- `POST /subscription/create-checkout` aceita `{ priceId }` ou `{ plan }` e
  devolve `{ sessionId, url }`. Cria o customer no Stripe na primeira compra.
  FREE é recusado com 400.
- `POST /subscription/cancel` devolve 400 com "Nenhuma assinatura ativa
  encontrada para este cliente." quando não há `stripeSubscriptionId`. No
  sucesso, rebaixa o Client para STARTER com `subscriptionStatus: "canceled"`
  e devolve `{ subscriptionStatus: "canceled" }`.

Os limites de plano **são aplicados**, mas não pelo caminho que o doc espelho
sugere. O decorator `@CheckPlanLimit` existe no backend e não está aplicado em
nenhum controller; a checagem real acontece dentro dos services, via
`LimitService`. Os 403 que o front vai encontrar vêm de:

- `POST /campaigns` (criar campanha)
- `PATCH /campaigns/:id` quando reativa uma campanha
- `POST /widgets` (criar widget)

As mensagens já vêm em português e já incluem o número do limite, por exemplo
"Limite de widgets atingido para o seu plano (1). Remova um widget existente ou
faça upgrade do plano." A UI exibe a mensagem do backend; não reescreve.

### Decisão: o erro de API passa a carregar o status HTTP

Esta é a decisão estruturante da entrega.

Hoje `src/features/campaigns/api.ts` e `src/features/widgets/api.ts` contêm
cópias byte a byte de uma função `responseMessage` e lançam `new Error(texto)`,
descartando o status da resposta. Sem o status, distinguir um 403 de limite de
plano de um 400 de validação exigiria casar substring de mensagem — frágil e
acoplado a texto do backend.

A duplicação é eliminada em vez de triplicada: um módulo compartilhado em
`src/lib` passa a ser o único lugar que lê o corpo de erro do Nest (`message`
como string ou array) e lança um erro tipado que preserva o status.

```ts
export class ApiError extends Error {
  readonly status: number;
}

/** Lança ApiError quando a resposta não é ok; devolve a resposta quando é. */
export async function ensureOk(response: Response): Promise<Response>;
```

Os módulos de API de campaigns, widgets e subscription passam a consumir esse
módulo. Posts e dashboard ficam como estão nesta entrega — a migração deles não
é necessária para o paywall e aumentaria o diff sem benefício.

O paywall vira então uma condição explícita: o erro é um `ApiError` com status
403. Nesse caso o formulário renderiza a mensagem do backend mais um link para
`/billing`; em qualquer outro status, o comportamento atual de exibir só a
mensagem é preservado.

### Módulos criados

**Rotas BFF** em `src/app/api/subscription/`, cobrindo `current`,
`create-checkout` e `cancel`. Seguem o padrão já estabelecido: leem o cookie
HTTP-only via `requireAccessToken`, chamam `backendRequest` com o header
`Authorization`, e devolvem status e mensagem do Nest sem reinterpretar. O
token nunca chega ao browser.

A rota de checkout encaminha apenas os campos documentados. O dashboard envia
`{ plan }`; `priceId` não é exposto na UI, porque o mapeamento de price ID vive
nas variáveis `STRIPE_PRICE_*` do backend e não deve ser replicado no front.

**Feature** em `src/features/billing/`, com o módulo de API do browser, os
hooks React Query e os componentes de apresentação. A divisão espelha
`src/features/widgets/`: um `api.ts` com as chamadas, um `hooks.ts` com
`useQuery`/`useMutation`, e componentes que recebem estado pronto.

A query da assinatura usa a chave `["subscription"]`. A mutation de cancelar
invalida essa chave no sucesso, para que o plano e o status na tela reflitam o
rebaixamento sem recarregar. A mutation de checkout não invalida nada: ela faz
um redirect de página inteira para a URL devolvida pelo Stripe.

**Tabela de limites** no front, espelhando `PLAN_LIMITS` do backend: starter
com 1 campanha ativa, 500 posts/mês e 1 widget; growth com 5, 5000 e 5; scale
com 15, 50000 e 15. FREE e STARTER mapeiam para o tier starter, PRO para
growth, ENTERPRISE para scale. Esses números são duplicados de propósito, como
conteúdo de UI; a fonte da verdade continua sendo o backend, que é quem
recusa.

### Rotas do front

`/billing` dentro do grupo `(authenticated)`, herdando a proteção de sessão já
existente no layout.

`/billing/success` e `/billing/cancel` como **rotas próprias**, não query
params. Essa é uma restrição do contrato: o backend lê `STRIPE_SUCCESS_URL` e
`STRIPE_CANCEL_URL` da configuração e os valores apontam para esses caminhos.
O front precisa ser dono deles para que o retorno do Stripe não caia em 404.

A rota de sucesso invalida a query da assinatura ao montar, de modo que o
dashboard já mostre o plano novo. Ela não tenta confirmar o pagamento por conta
própria: quem promove o Client é o webhook do Stripe no backend, e a página de
sucesso apenas relê `GET /subscription/current`. Se o webhook ainda não tiver
processado, a página mostra o estado atual sem afirmar nada falso.

### Superfícies existentes alteradas

A navegação lateral ganha um item "Planos" apontando para `/billing`.

Em Configurações, o cartão "Plano" troca o botão desabilitado "Upgrade — em
breve" por um link para `/billing`.

Os formulários de criar campanha e de criar widget passam a tratar o 403: hoje
ambos guardam o texto do erro num estado de string e o renderizam num parágrafo
com `role="alert"`. O estado passa a guardar também a informação de que foi um
limite de plano, e o parágrafo passa a incluir o link de upgrade nesse caso. O
caminho de erro comum não muda.

## Testing Decisions

Um bom teste aqui descreve o que o Client percebe, não como o código está
organizado. Os testes afirmam sobre texto visível, papéis acessíveis e
requisições efetivamente disparadas. Não afirmam sobre nomes de hooks, chaves
de query internas ou estrutura de componentes — isso é detalhe de
implementação e torna o teste um obstáculo a refatorações futuras.

Duas costuras existentes são reaproveitadas sem mudança. Uma terceira é
introduzida, e é a única: o módulo compartilhado de erro de API. Ela se
justifica porque sem o status HTTP o paywall não é implementável sem casar
substring de mensagem, e porque ela *reduz* a superfície total ao absorver as
duas cópias de `responseMessage` que existem hoje.

**Costura 1: rotas BFF, com `fetch` global stubado.** Prior art em
`src/app/api/widgets/routes.test.ts` e `src/app/api/platform/instagram/routes.test.ts`:
`next/headers` é mockado para devolver o cookie, `fetch` é stubado, e o teste
afirma sobre a URL chamada, o método, o header `Authorization` e o corpo
encaminhado. Os testes das rotas de subscription cobrem o encaminhamento
autenticado das três rotas, a recusa quando não há cookie, a preservação do
status e da mensagem de erro do Nest, e o fato de que o checkout encaminha
apenas os campos documentados.

**Costura 2: componentes, via Testing Library.** Prior art em
`src/features/widgets/widgets-list.test.tsx` e
`src/features/dashboard/dashboard.test.tsx`: o componente é montado com um
`QueryClientProvider`, as chamadas de rede são stubadas na borda do `fetch`, e
o teste afirma sobre o que aparece na tela. A cobertura inclui o plano atual e
a renovação renderizados, a ausência de renovação tratada como estado normal,
o plano atual marcado na comparação, o clique em upgrade disparando o redirect
de página inteira para a URL do Stripe, a confirmação de cancelamento, a
ausência do cancelar quando não há assinatura, e os estados de erro com nova
tentativa.

**Costura 3 (nova): o módulo compartilhado de erro de API.** É testado
diretamente sobre objetos `Response`, no espírito de
`src/features/widgets/filters.test.ts` — uma função pura o suficiente para ser
testada sem montar componente. Os casos são: resposta ok
passa adiante, erro com `message` string, erro com `message` array, corpo
ausente ou não-JSON caindo na mensagem padrão, e o status preservado em todos
os casos de erro.

O paywall é testado na costura de componente, não na de módulo: um 403 stubado
na criação de campanha e na criação de widget deve produzir a mensagem do
backend e um link para `/billing` na tela, e um 400 deve produzir a mensagem
sem o link.

Ao final: `npm test`, `npm run lint` e `npm run build`.

## Out of Scope

- Webhook do Stripe e qualquer reconciliação de pagamento. É responsabilidade
  exclusiva do backend; o front confia em `GET /subscription/current`.
- Portal de faturas, histórico de pagamentos e download de recibos.
- Troca de método de pagamento e atualização de dados de cobrança.
- Contadores de uso em tempo real ("você usou 3 de 5 widgets"). A comparação de
  planos mostra os limites, não o consumo atual. Não há endpoint de consumo
  documentado.
- Downgrade direto entre planos pagos sem passar pelo Stripe Checkout.
- O 403 de limite mensal de posts coletados. Ele vem de
  `POST /campaigns/:id/collect-now`, cuja rota BFF ainda não existe no front;
  tratá-lo exigiria construir o fluxo de coleta, que é outra entrega.
- Trial, cupons e preços promocionais.
- Qualquer alteração no repositório `ugc-backend`.

## Further Notes

**Pré-requisito externo que bloqueia o teste manual.** No `ugc-backend`,
`STRIPE_SUCCESS_URL` e `STRIPE_CANCEL_URL` estão configurados como
`http://localhost:3000/billing/success` e `.../billing/cancel`. A porta 3000 é
a do próprio Nest (`PORT=3000`, e o front consome
`NEXT_PUBLIC_API_URL=http://localhost:3000`), então em desenvolvimento o Stripe
redirecionaria de volta para a API em vez do dashboard. Essas variáveis
precisam apontar para a porta do Next antes de qualquer verificação manual do
fluxo. Isso não bloqueia a implementação nem os testes automatizados, que
stubam a borda de rede.

**CORS.** O backend ainda não habilitou `enableCors()`, mas isso não afeta esta
entrega: toda chamada passa pelo BFF do Next, mesma origem.

**`currentPeriodEnd` é `Date` no backend e chega como string ISO no JSON.** O
tipo `CurrentSubscription` em `src/types/index.ts` já reflete isso como
`string | null`, junto com `CheckoutPlan`, `CreateCheckoutBody`,
`CreateCheckoutResponse` e `CancelSubscriptionResponse`. Todos já existem e são
reaproveitados; nenhum tipo novo de domínio é necessário.

**Sobre o cancelamento rebaixar para STARTER e não para FREE.** É o
comportamento do `SubscriptionService` do backend. A confirmação de
cancelamento na UI precisa dizer STARTER, não "plano gratuito", para não
mentir sobre o que vai acontecer.
