# Guia de deploy — Vercel + Neon + Resend

Passo a passo para colocar o Gestão de Lojas no ar com login, aprovação de cadastro e banco de dados na nuvem.

O site já rodava no Netlify e foi migrado pra Vercel (plano gratuito bem mais generoso, e dá pra fazer upgrade pago no mesmo lugar se o uso crescer, sem precisar trocar de plataforma de novo). O banco (Neon) e o envio de e-mail (Resend) continuam exatamente os mesmos — só a hospedagem do site e das functions mudou.

## 1. Criar o banco no Neon

Se você já tem o banco Neon rodando (de quando estava no Netlify), pode pular essa etapa — ele continua servindo normalmente, não precisa recriar nada.

1. Crie uma conta em neon.tech e um novo projeto (região mais próxima do Brasil, ex: US East, costuma ter boa latência).
2. No painel do projeto, copie a **connection string** (formato `postgresql://usuario:senha@host/banco?sslmode=require`). Essa é a sua `DATABASE_URL`.
3. Abra o **SQL Editor** do Neon e cole o conteúdo do arquivo `db/schema.sql` (está na raiz do projeto). Rode o script — ele cria as tabelas `users`, `app_state`, `password_reset_tokens`, `tickets`, `ticket_messages` e `auth_attempts`.

## 2. Criar conta no Resend (envio de e-mail)

Se você já tem uma chave do Resend configurada, também pode pular.

1. Crie uma conta em resend.com.
2. Em **API Keys**, gere uma chave (`RESEND_API_KEY`).
3. Para começar rápido, você pode usar o domínio de teste deles (`onboarding@resend.dev`) como remetente — funciona, mas só envia para o e-mail da conta que criou a chave. Para enviar para qualquer e-mail (inclusive o seu, se for diferente), verifique um domínio próprio em **Domains** e use um endereço desse domínio como `EMAIL_FROM` (ex: `Gestão de Lojas <contato@seudominio.com>`).

## 3. Subir o código para o GitHub

Suba os arquivos atualizados pro repositório pelo **Add file → Upload files** do GitHub. Arraste tudo, incluindo a pasta `api/` (é a nova pasta de functions, substitui a `netlify/` que existia antes — pode remover a `netlify/` e o `netlify.toml` antigos do repositório se ainda estiverem lá), `db/`, `package.json` e `vercel.json`.

## 4. Criar o projeto na Vercel

1. Em vercel.com, **Add New → Project**, conecte sua conta do GitHub e escolha o repositório `gestao_lojas`.
2. A Vercel detecta sozinha que é um site estático com functions em `/api` — não precisa configurar build command nem output directory, pode deixar tudo no automático ("Other" como framework preset).
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a connection string do Neon (passo 1) |
| `JWT_SECRET` | uma string aleatória longa (gere uma abaixo) |
| `RESEND_API_KEY` | a chave do Resend (passo 2) |
| `EMAIL_FROM` | opcional — remetente verificado, ou deixe sem essa variável para usar o domínio de teste do Resend |
| `OWNER_EMAIL` | `guilhermejbicudo@outlook.com` |
| `SITE_URL` | opcional — ex: `https://gestaolojas.vercel.app`. Usado para montar o link de recuperação de senha no e-mail; se não configurar, o sistema usa o domínio da própria requisição (funciona na maioria dos casos) |

Para gerar o `JWT_SECRET`, rode isso no terminal (Mac/Linux) ou peça pra mim gerar um:
```
openssl rand -base64 48
```

Se você já tinha essas variáveis configuradas no Netlify, use os mesmos valores aqui — principalmente o `JWT_SECRET`: se ele mudar, todo mundo que já tinha feito login precisa entrar de novo (as sessões antigas ficam inválidas), mas nada mais quebra.

4. Clique em **Deploy**. A Vercel instala as dependências do `package.json` e publica o site com as functions em `/api/*` automaticamente (sem precisar de nenhum arquivo de redirecionamento — isso já é o comportamento padrão dela pra pastas `api/`).

**Sobre o número de functions:** o plano gratuito (Hobby) da Vercel permite no máximo 12 Serverless Functions por deploy. Por isso as ~19 rotas que existiam (uma por arquivo, como era no Netlify) foram agrupadas em só 4 arquivos — `api/auth/[action].js` (login, cadastro, logout, sessão, recuperação de senha), `api/admin/[action].js` (aprovações, usuários, tickets do admin), `api/tickets/[action].js` (tickets do usuário) e `api/state.js` (salvar/carregar dados). A lógica de cada rota é a mesma de antes, só a organização dos arquivos mudou — isso também deixa bastante espaço pra crescer sem esbarrar no limite de novo.

## 5. Testar

1. Abra o site publicado. Você deve ver a tela de login/cadastro.
2. Se você já tinha conta (criada quando o site rodava no Netlify), ela continua funcionando normalmente — é o mesmo banco Neon, os dados não mudam.
3. Se for a primeira vez, cadastre-se com o e-mail `guilhermejbicudo@outlook.com` (o dono) — esse e-mail entra aprovado automaticamente, sem precisar de aprovação.
4. Peça para outra pessoa (ou você mesmo com outro e-mail) se cadastrar — o cadastro fica pendente e você recebe um e-mail avisando. Entre com sua conta e vá em **Administração → Usuários/Aprovações** para aprovar ou rejeitar.
5. Teste o "Esqueci minha senha" na tela de login: informe o e-mail cadastrado, você recebe um link por e-mail (válido por 1 hora) e consegue definir uma nova senha.
6. Teste também um ticket de suporte (se estiver bloqueado ou com o trial vencido) pra confirmar que a fila de tickets está funcionando.

## Observações importantes

- **Não foi possível testar essa parte localmente** neste ambiente: não há acesso a um banco Postgres local nem ao registro do npm para instalar os pacotes (`@neondatabase/serverless`, `bcryptjs`, `jsonwebtoken`, `resend`, `cookie`). Todo o código foi revisado com cuidado, validado com `node --check` (sem erros de sintaxe) e o adaptador que converte as functions do formato Netlify pro formato da Vercel foi testado com um handler simulado. Mas o teste de ponta a ponta de verdade (cadastro → aprovação → login → salvar dados → tickets) só vai acontecer quando o site estiver no ar na Vercel com o banco Neon conectado. Se algo não funcionar como esperado no primeiro teste, me avise com a mensagem de erro (aparece no console do navegador ou nos **Function Logs** da Vercel, aba "Deployments" → escolha o deploy → "Functions") que eu ajusto.
- Backup continua funcionando: os botões de exportar/importar backup ainda existem, agora como uma camada extra de segurança além dos dados salvos no banco.
- Pode desativar/apagar o site antigo no Netlify quando confirmar que está tudo certo na Vercel — o domínio `.netlify.app` vai parar de funcionar, então se você compartilhou esse link com alguém, avise pra trocarem pelo novo endereço `.vercel.app` (ou pelo domínio próprio, se configurar um).
