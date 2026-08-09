# Guia de deploy — Netlify + Neon + Resend

Passo a passo para colocar o Gestão de Lojas no ar com login, aprovação de cadastro e banco de dados na nuvem.

## 1. Criar o banco no Neon

1. Crie uma conta em neon.tech e um novo projeto (região mais próxima do Brasil, ex: US East, costuma ter boa latência).
2. No painel do projeto, copie a **connection string** (formato `postgresql://usuario:senha@host/banco?sslmode=require`). Essa é a sua `DATABASE_URL`.
3. Abra o **SQL Editor** do Neon e cole o conteúdo do arquivo `db/schema.sql` (está na raiz do projeto). Rode o script — ele cria as tabelas `users`, `app_state` e `password_reset_tokens` (essa última é usada pelo "esqueci minha senha").

## 2. Criar conta no Resend (envio de e-mail)

1. Crie uma conta em resend.com.
2. Em **API Keys**, gere uma chave (`RESEND_API_KEY`).
3. Para começar rápido, você pode usar o domínio de teste deles (`onboarding@resend.dev`) como remetente — funciona, mas só envia para o e-mail da conta que criou a chave. Para enviar para qualquer e-mail (inclusive o seu, se for diferente), verifique um domínio próprio em **Domains** e use um endereço desse domínio como `EMAIL_FROM` (ex: `Gestão de Lojas <contato@seudominio.com>`).

## 3. Subir o código para o GitHub

Como de costume, suba os arquivos atualizados para o repositório `GuiBicudo/gestao_lojas` pelo **Add file → Upload files** do GitHub (arraste todos os arquivos e pastas, incluindo `netlify/`, `db/`, `netlify.toml` e `package.json`). Depois eu te passo a frase do commit.

## 4. Criar o site no Netlify

1. Em app.netlify.com, **Add new site → Import an existing project**, conecte ao GitHub e escolha o repositório `gestao_lojas`.
2. Configurações de build: **Build command** vazio, **Publish directory** `.` (o `netlify.toml` já define isso, pode deixar no automático).
3. Antes ou depois do primeiro deploy, vá em **Site configuration → Environment variables** e adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a connection string do Neon (passo 1) |
| `JWT_SECRET` | uma string aleatória longa (gere uma abaixo) |
| `RESEND_API_KEY` | a chave do Resend (passo 2) |
| `EMAIL_FROM` | opcional — remetente verificado, ou deixe sem essa variável para usar o domínio de teste do Resend |
| `OWNER_EMAIL` | `guilhermejbicudo@outlook.com` |
| `SITE_URL` | opcional — ex: `https://gestaolojas.netlify.app`. Usado para montar o link de recuperação de senha no e-mail; se não configurar, o sistema usa o domínio da própria requisição (funciona na maioria dos casos) |

Para gerar o `JWT_SECRET`, rode isso no terminal (Mac/Linux) ou peça pra mim gerar um:
```
openssl rand -base64 48
```

4. Clique em **Deploy site**. O Netlify vai instalar as dependências do `package.json` e publicar o site com as functions em `/api/*`.

## 5. Testar

1. Abra o site publicado. Você deve ver a tela de login/cadastro.
2. Cadastre-se com o e-mail `guilhermejbicudo@outlook.com` (o dono) — esse e-mail entra aprovado automaticamente, sem precisar de aprovação.
3. Peça para outra pessoa (ou você mesmo com outro e-mail) se cadastrar — o cadastro fica pendente e você recebe um e-mail avisando. Entre com sua conta e vá em **Administração → Aprovações** para aprovar ou rejeitar.
4. Cada conta aprovada tem seus próprios dados, separados — nada é compartilhado entre usuários.
5. Teste o "Esqueci minha senha" na tela de login: informe o e-mail cadastrado, você recebe um link por e-mail (válido por 1 hora) e consegue definir uma nova senha.

## Observações importantes

- **Não foi possível testar essa parte localmente** neste ambiente: não há acesso a um banco Postgres local nem ao registro do npm para instalar os pacotes (`@neondatabase/serverless`, `bcryptjs`, `jsonwebtoken`, `resend`, `cookie`). Todo o código foi revisado com cuidado e validado com `node --check` (sem erros de sintaxe), mas o teste de ponta a ponta (cadastro → aprovação → login → salvar dados) só vai acontecer de fato quando o site estiver no ar no Netlify com o banco Neon conectado. Se algo não funcionar como esperado no primeiro teste, me avise com a mensagem de erro (aparece no console do navegador ou nos **Function logs** do Netlify) que eu ajusto.
- Backup continua funcionando: os botões de exportar/importar backup ainda existem, agora como uma camada extra de segurança além dos dados salvos no banco.
