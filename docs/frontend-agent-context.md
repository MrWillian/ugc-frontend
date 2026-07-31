# UGC Frontend — Contexto para agentes (Next.js)

Documento para o agente de IA no projeto **frontend** (Next.js).  
Objetivo: produto + contrato da API NestJS, com assertividade alta nas implementações.

**Fonte da verdade do backend:** código em `ugc-backend` + `docs/HANDOFF.md`.  
Este arquivo é um **espelho de consumo** — não altera a API; se houver divergência, priorize o código.

Última sincronização com o backend: **2026-07-15**.

---

## 1. Como usar este doc

No projeto Next.js:

```
@docs/frontend-agent-context.md

Implementar [tela/fluxo]. Seguir o contrato HTTP e as regras de domínio abaixo.
Não inventar rotas, campos ou estados que não estejam documentados.
```

**O front faz:** dashboard autenticado, UX de onboarding Instagram, CRUD de campanhas/widgets, fila de moderação, cópia de `consent_link` / embed, checkout Stripe (redirect).

**O front NÃO faz:** webhook Meta/Stripe, job Bull de coleta, Graph API, página HTML pública de consentimento (já é servida pela API em `GET /consent`).

---

## 2. Produto e domínio

Plataforma **multi-tenant UGC**: cada **Client** (tenant) roda **Campaigns** (hashtag), conecta **Instagram Business** (OAuth Meta), **coleta posts**, **modera**, obtém **consentimento do criador** e **exibe** conteúdo aprovado via **widgets** embutíveis. Billing via **Stripe** + **limites por plano**.

### Fluxo canônico

```text
Signup/Login (JWT)
    → Conectar Instagram (OAuth)
    → Criar Campaign (hashtag + terms_text)
    → Coletar posts (job 1h ou collect-now)
    → Moderar (approve / reject)
         approve → rights_status=PENDING, display_status=HIDDEN
                   + consent_link (UgcPermission)
    → Autor abre link → granted | rejected
         granted → rights_status=GRANTED, display_status=VISIBLE
                   (+ auto-associação ao widget default)
    → Widget público mostra só VISIBLE + GRANTED
    → (opcional) Upgrade Stripe / limites de plano
```

### Entidades que o dashboard manipula

| Conceito | Papel no UI |
|----------|-------------|
| **Client** | Conta logada (`/auth/me`): plan, subdomain, Stripe |
| **Campaign** | Campanha de hashtag; limite de ativas por plano |
| **PlatformAccount** | Status da conexão Instagram (ACTIVE / EXPIRED / REVOKED) |
| **CollectedPost** | Post na fila; três eixos de status (ver §4.3) |
| **ModerationResult** | Histórico de decisões (somente leitura no detalhe) |
| **UgcPermission** | Token/link de consentimento por post |
| **Widget** | Embed configurável + `embedCode` |
| **Subscription** | Checkout / cancel / plano atual |

---

## 3. Mapa de telas sugeridas (Next.js)

Rotas sugeridas (App Router). Ajuste nomes, mas preserve o mapeamento API ↔ tela.

| Rota front | Auth | APIs principais |
|------------|------|-----------------|
| `/login`, `/signup` | — | `POST /auth/login`, `POST /auth/signup` |
| `/dashboard` | JWT | `GET /auth/me`, `GET /subscription/current`, `GET /platform/instagram/status` |
| `/dashboard/instagram` | JWT | `POST …/auth-url`, callback → `POST …/callback`, `GET …/status` |
| `/dashboard/campaigns` | JWT | CRUD `/campaigns` |
| `/dashboard/campaigns/[id]` | JWT | `GET /campaigns/:id`, `GET …/posts`, `POST …/collect-now` |
| `/dashboard/moderation` | JWT | `GET /posts/pending`, `GET /posts`, approve/reject |
| `/dashboard/posts/[id]` | JWT | `GET /posts/:id`, consent status/generate/resend |
| `/dashboard/widgets` | JWT | CRUD `/widgets`, copiar `embedCode` |
| `/dashboard/widgets/[id]/preview` | JWT | Injeta embed (requer CORS na API em produção) |
| `/dashboard/billing` | JWT | `GET /subscription/current`, `POST …/create-checkout`, `POST …/cancel` |
| `/auth/instagram/callback` | JWT | Página que lê `?code=&state=` e chama `POST /platform/instagram/callback` |

**Público (fora do dashboard Next):**

- Consentimento do autor: **`GET/POST /consent` na API** (HTML). O dashboard só **copia/envia** o `consent_link`.
- Embed do cliente final: script `GET /api/widget/:id.js` (não é rota do Next, a menos que o front hospede um preview).

### Onboarding mínimo pós-signup

1. Conectar Instagram (`reconnectRequired === false` e `status === ACTIVE`).
2. Criar ao menos 1 campanha ativa.
3. Coletar / aguardar job → moderar → gerar/copiar consent link.
4. Criar widget `default` (ou qualquer um) e copiar embed.

---

## 4. Contrato HTTP

### 4.1 Base e convenções

| Item | Valor |
|------|--------|
| Base URL (dev) | `http://localhost:3000` |
| Env front | `NEXT_PUBLIC_API_URL` **sem** path extra |
| Prefixo global | **Não há** `/api` global. Exceção: widget público em `/api/widget/*` (e alias `/widget/*`) |
| Auth | Header `Authorization: Bearer <accessToken>` |
| Content-Type | `application/json` (exceto embed `.js` e HTML de consent) |
| Validação | `whitelist` + `forbidNonWhitelisted` → campos extras = **400** |
| IDs | UUID (`ParseUUIDPipe` nas rotas) |
| Health | `GET /health` → `{ status: "ok", timestamp }` |

**Naming (importante — misto de propósito):**

- Respostas JWT/admin na maior parte: **camelCase** Prisma (`campaignId`, `rightsStatus`, `embedCode`, `accessToken`).
- Bodies de campanha/moderação: alguns campos **snake_case** (`terms_text`, `rejection_reasons`).
- Approve response: campo extra **`consent_link`** (snake_case).
- JSON público do widget: **snake_case** (`content_url`, `author_data`, `posted_at`).

Não “normalizar” no cliente assumindo um único estilo — espelhe o backend.

### 4.2 Auth

| Método | Rota | Auth | Body / notas |
|--------|------|------|----------------|
| POST | `/auth/signup` | — | `email`, `password` (≥8), `name`, `subdomain` (hostname-style), `plan?`, `companyName?` |
| POST | `/auth/login` | — | `email`, `password` |
| POST | `/auth/logout` | JWT | Stateless — **não invalida** token no servidor; limpe storage no client |
| GET | `/auth/me` | JWT | Client sem `passwordHash` |

**Resposta login/signup:**

```json
{
  "accessToken": "<jwt>",
  "client": {
    "id": "uuid",
    "email": "a@b.com",
    "name": "Acme",
    "subdomain": "acme",
    "plan": "FREE",
    "stripeCustomerId": null,
    "stripeSubscriptionId": null,
    "subscriptionStatus": null,
    "currentPeriodEnd": null,
    "companyName": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Armazene `accessToken` (cookie httpOnly preferível, ou storage conforme decisão do front). Em toda request autenticada: `Authorization: Bearer …`.

### 4.3 Máquina de estados do post

Três eixos independentes:

| Campo | Valores (JSON) | Significado |
|-------|----------------|-------------|
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` | Moderação interna |
| `rightsStatus` | `PENDING` \| `GRANTED` \| `REJECTED` | Direitos do autor |
| `displayStatus` | `VISIBLE` \| `HIDDEN` | Elegibilidade de exibição |

**Transições que o UI deve refletir:**

| Ação | `status` | `rightsStatus` | `displayStatus` |
|------|----------|----------------|-----------------|
| Coletado (novo) | `PENDING` | `PENDING` | `HIDDEN` (típico) |
| Approve | `APPROVED` | `PENDING` | `HIDDEN` |
| Reject | `REJECTED` | `REJECTED` | `HIDDEN` |
| Consent granted | (inalterado) | `GRANTED` | `VISIBLE` |
| Consent rejected | (inalterado) | `REJECTED` | `HIDDEN` |

**Regra de exibição no widget (não negociável):**

`displayStatus === "VISIBLE"` **E** `rightsStatus === "GRANTED"`.

Badge sugerido na fila:

- Moderação pendente → “Aguardando moderação”
- Aprovado sem consent → “Aguardando consentimento” + botão copiar link
- GRANTED + VISIBLE → “Pronto para widget”
- REJECTED (moderation ou rights) → “Recusado”

### 4.4 Paginação

Query: `page` (default 1), `limit` (default 20, max 100).

```json
{
  "data": [ /* items */ ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

Usado em listagens de posts (campanha, client, moderação).

### 4.5 Campaigns (JWT)

| Método | Rota | Body |
|--------|------|------|
| POST | `/campaigns` | `{ "name", "hashtag", "terms_text?" }` |
| GET | `/campaigns` | — |
| GET | `/campaigns/:id` | — |
| PATCH | `/campaigns/:id` | partial: `name?`, `hashtag?`, `terms_text?`, `active?` |
| DELETE | `/campaigns/:id` | — |

- `hashtag`: só `[a-zA-Z0-9_]`, sem `#`.
- `name`: 3–100 chars.
- Resposta: modelo Campaign em camelCase (`termsText`, `clientId`, `active`, …).
- Limite de **campanhas ativas** por plano → **403** com mensagem em PT.

### 4.6 Coleta e listagem de posts (JWT)

| Método | Rota | Notas |
|--------|------|--------|
| POST | `/campaigns/:campaignId/collect-now` | **Síncrono** — pode demorar; UI com loading/timeout generoso |
| GET | `/campaigns/:campaignId/posts` | `?status=&page=&limit=` — `status` aceita case-insensitive → enum UPPER |
| GET | `/client/posts` | Mesmos query params; todos os posts do tenant |

**Item `PostResponseDto` (camelCase):**

`id`, `campaignId`, `platform`, `externalId`, `contentType`, `contentUrl`, `thumbnailUrl`, `caption`, `authorData`, `metrics`, `postedAt`, `status`, `rightsStatus`, `displayStatus`, `createdAt`, `updatedAt`.

Enums típicos: `platform: "INSTAGRAM"`, `contentType: "IMAGE"|"VIDEO"|"CAROUSEL"`.

### 4.7 Instagram OAuth (JWT)

| Método | Rota | Resposta / body |
|--------|------|-----------------|
| POST | `/platform/instagram/auth-url` | `{ authUrl, state }` — `state` = `clientId` |
| POST | `/platform/instagram/callback` | `code` + `state` (query **ou** body) |
| GET | `/platform/instagram/status` | ver abaixo |

**Status:**

```ts
{
  connected: boolean;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | null;
  accountId: string | null;
  accountUsername: string | null;
  pageName: string | null;
  expiresAt: string | null;       // ISO
  daysUntilExpiry: number | null;
  reconnectRequired: boolean;
}
```

**Fluxo UI recomendado:**

1. `POST auth-url` → `window.location = authUrl` (ou popup).
2. Meta redireciona para `INSTAGRAM_OAUTH_REDIRECT_URI` (config da API) com `?code=&state=`.
3. Página Next com JWT válido chama `POST /platform/instagram/callback` com esses params.
4. Poll/refresh em `GET …/status`. Se `REVOKED` / `reconnectRequired`, CTA “Reconectar”.

**MVP:** 1 conta Instagram por Client (upsert no callback).

### 4.8 Moderação (JWT)

| Método | Rota | Body / query |
|--------|------|----------------|
| GET | `/posts/pending` | `?page=&limit=` (sempre pending) |
| GET | `/posts` | `?status=pending\|approved\|rejected&page=&limit=` — **lowercase** |
| GET | `/posts/:id` | inclui `moderationResults[]` |
| POST | `/posts/:id/approve` | body opcional; resposta = post + **`consent_link`** |
| POST | `/posts/:id/reject` | `{ "rejection_reasons": "…" }` **obrigatório** |

Após approve: mostre o `consent_link` com botão copiar; explique que Instagram **não** entrega e-mail do autor — envio é manual (DM/e-mail) no MVP.

### 4.9 Consentimento

| Método | Rota | Auth | Uso no front |
|--------|------|------|----------------|
| GET | `/consent?token=` | — | HTML na API — **não reimplementar** no Next (salvo white-label futuro) |
| POST | `/consent` | — | Body `{ token, decision: "granted"\|"rejected" }` — autor |
| POST | `/posts/:postId/consent/generate` | JWT | `{ channel?, email? }` — regenera; e-mail se `channel=email` + `email` |
| POST | `/consent/resend/:permissionId` | JWT | Reenvio (canal e-mail) |
| GET | `/posts/:postId/consent/status` | JWT | Status para o dashboard |

**`ConsentStatusResult`:**

```ts
{
  postId: string;
  rightsStatus: "PENDING" | "GRANTED" | "REJECTED";
  displayStatus: "VISIBLE" | "HIDDEN";
  permission: {
    id: string;
    channel: "EMAIL" | "WHATSAPP" | "DIRECT_MESSAGE"; // enum Prisma na resposta
    status: "pending" | "granted" | "rejected";
    consentUrl: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    attemptCount: number;
    lastAttemptAt: string | null;
  } | null;
}
```

Channels no **body** de generate: `email` | `whatsapp` | `direct_message` (enum string lowercase do DTO).

### 4.10 Widgets

#### Admin (JWT)

| Método | Rota | Body |
|--------|------|------|
| POST | `/widgets` | `{ name, layout?, filters? }` |
| GET | `/widgets` | lista |
| GET | `/widgets/:id` | inclui `embedCode` |
| PATCH | `/widgets/:id` | partial |
| DELETE | `/widgets/:id` | — |
| POST | `/widgets/:id/posts/:postId` | associa post |
| DELETE | `/widgets/:id/posts/:postId` | remove associação |

- `layout`: enum Prisma `GRID` | `CAROUSEL` | `MASONRY` (mensagem de validação cita grid/carousel/masonry — envie o valor do enum TS).
- `filters`: objeto JSON livre (ex. `maxPosts`, `showCaptions`, `theme`).
- `embedCode` exemplo:

```html
<div id="ugc-widget-{uuid}"></div>
<script src="http://localhost:3000/api/widget/{uuid}.js" defer></script>
```

Nome `default` (case-insensitive) recebe auto-associação quando o autor concede consentimento; senão, o widget mais antigo do cliente.

#### Público (sem JWT)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/widget/:widgetId.js` | Script embed (`application/javascript`, cache Redis ~5 min) |
| GET | `/api/widget/:widgetId/posts` | Array JSON snake_case |
| GET | `/widget/posts?client_id=` | Legado: posts consentidos do tenant |

Item público:

```json
{
  "id": "...",
  "content_url": "https://...",
  "thumbnail_url": "https://...",
  "caption": "...",
  "author_data": { "username": "autor" },
  "posted_at": "2026-05-30T12:00:00.000Z"
}
```

### 4.11 Assinatura / Stripe (JWT)

| Método | Rota | Body | Resposta |
|--------|------|------|----------|
| POST | `/subscription/create-checkout` | `{ priceId }` **ou** `{ plan: "STARTER"\|"PRO"\|"ENTERPRISE" }` | `{ sessionId, url }` → redirect |
| POST | `/subscription/cancel` | — | `{ subscriptionStatus: "canceled" }` |
| GET | `/subscription/current` | — | `plan`, `subscriptionStatus`, `currentPeriodEnd`, `stripeCustomerId`, `stripeSubscriptionId` |

Webhook `POST /stripe/webhook` é **só backend**. Após checkout, confie no webhook + `GET /subscription/current` (e/ou success URL).

`plan: FREE` **não** é válido no checkout.

### 4.12 Limites por plano

| Tier | Planos | Campanhas ativas | Posts/mês (coleta) | Widgets |
|------|--------|------------------|--------------------|---------|
| starter | FREE, STARTER | 1 | 500 | 1 |
| growth | PRO | 5 | 5 000 | 5 |
| scale | ENTERPRISE | 15 | 50 000 | 15 |

Estouro → **403** `ForbiddenException` com mensagem PT (ex.: “Limite de campanhas ativas atingido…”).  
UI: desabilitar CTA + link para `/dashboard/billing`.

### 4.13 Erros HTTP comuns

| Status | Quando |
|--------|--------|
| 400 | Validação DTO / campos extras / callback sem `code` |
| 401 | JWT ausente/inválido |
| 403 | Limite de plano; às vezes tenant/regra de negócio |
| 404 | Recurso de outro tenant ou inexistente |
| 409 | Conflitos (ex. email/subdomain duplicado no signup — verificar mensagem) |

Formato Nest padrão: `{ statusCode, message, error }` (`message` string ou array de strings de validação).

---

## 5. Regras que o front não pode inventar

1. **Tenant isolation:** nunca enviar `clientId` no body para “escolher” tenant — o JWT define o client.
2. **Logout** não revoga JWT no servidor.
3. **Um Instagram por client** — UI de “contas múltiplas” está fora do MVP.
4. **`collect-now` é síncrono** — não assumir 202 + polling de job id.
5. **Approve ≠ visível no widget** — falta consentimento (`GRANTED` + `VISIBLE`).
6. **Página de consentimento** vive na API; o dashboard só distribui o link.
7. **CORS** ainda não está habilitado na API — embed em domínio externo / preview cross-origin pode falhar até o backend ligar `enableCors()`.
8. **Carousel/masonry** no script gerado ainda renderizam grid básico (MVP).
9. **Hashtag search** Meta é limitada — coleta pode retornar pouco/nada; não é bug do front.
10. Token Instagram ~60 dias — se `reconnectRequired`, priorize CTA de reconexão.

---

## 6. Env e responsabilidades

### Front (Next.js)

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_API_URL` | Base da API (ex. `http://localhost:3000` ou URL Railway) |

Redirects de Stripe (`STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL`) e OAuth Meta (`INSTAGRAM_OAUTH_REDIRECT_URI`) são configurados **na API**. O front deve expor as rotas/páginas que essas URLs apontam (ex. `/dashboard/billing?success=1`, `/auth/instagram/callback`).

### Só backend (não chamar do browser)

- Job Bull `collect-campaign-posts` (1h)
- `POST /stripe/webhook`, `GET|POST /webhook/instagram`
- Graph API / refresh de token Instagram
- SMTP / mock de e-mail

---

## 7. Checklist de implementação por domínio

**Auth:** signup/login → persistir token → interceptor fetch → `/auth/me` no layout dashboard → logout limpa client.

**Instagram:** status badge → conectar → callback page com JWT → tratar REVOKED.

**Campaigns:** form `terms_text` snake_case → lista com toggle `active` → respeitar 403 de limite.

**Moderation:** fila pending → approve mostra `consent_link` → reject exige motivo → detalhe com `moderationResults`.

**Consent (admin):** status chip + copiar URL + generate/resend quando houver e-mail.

**Widgets:** CRUD + copiar embed + preview opcional + explicar critério VISIBLE+GRANTED.

**Billing:** current plan → checkout redirect → success refetch → cancel confirmação → paywall em 403 de limites.

---

## 8. Prompt modelo (colar no projeto Next.js)

```
@docs/frontend-agent-context.md

Continuar o ugc-frontend (Next.js). Objetivo desta sessão: [UMA tela ou fluxo].

Restrições:
- Consumir apenas rotas documentadas em frontend-agent-context.md
- JWT em Authorization: Bearer; nunca confiar em clientId do body
- Respeitar naming misto (camelCase vs snake_case) do backend
- Post no widget só com displayStatus=VISIBLE e rightsStatus=GRANTED
- Não reimplementar GET/POST /consent HTML nem webhooks
- Não inventar campos de API
```

---

## 9. Referências no repositório backend

| Arquivo | Quando abrir |
|---------|----------------|
| `docs/HANDOFF.md` | Detalhe de fases, backlog, Docker |
| `docs/MANUAL_TESTING.md` | Passo a passo manual / OAuth |
| `docs/insomnia/ugc-backend.insomnia.json` | Exemplos de request |
| `prisma/schema.prisma` | Enums e modelos canônicos |

**Manutenção:** ao mudar rotas/DTOs no Nest, atualizar este arquivo na mesma PR (ou imediatamente depois), para o agente do front não ficar desatualizado.
