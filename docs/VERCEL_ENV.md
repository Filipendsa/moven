# Variáveis de Ambiente na Vercel

Configure todas as variáveis abaixo em **Vercel → Project → Settings → Environment Variables** (marque **Production**, **Preview** e **Development** conforme necessário).

> **Importante:** Variáveis com prefixo `NEXT_PUBLIC_` são embutidas no código durante o build. Sempre que alterar alguma delas na Vercel, faça um **Redeploy** para que a mudança tenha efeito.

## Lista Completa (Copiar & Colar)

| Variável | Valor recomendado (Produção) | Visibilidade | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://seu-dominio.vercel.app` | Pública | URL base da aplicação (usada em callbacks e webhooks) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `pt` | Pública | Idioma padrão (`pt`, `es` ou `en`) |
| `NEXT_PUBLIC_POWERED_BY_URL` | `https://yesode.com` | Pública | Link do rodapé "Powered by Yesode" |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ciqerfzvuaypnwecesah.supabase.co` | Pública | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Pública | Chave pública (Publishable Key) do Supabase |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | **Servidor (Secreta)** | Chave secreta (Secret Key) do Supabase |
| `NEXT_PUBLIC_PAYMENT_MODE` | `EVEN3` | Pública | Gateway de cartão ativo: `EVEN3` ou `INFINITEPAY` |
| `EVEN3_SCHOOL_CHECKOUT_URL` | `https://ingressos.eventodaigreja.com.br/moven-nucleo-de-missoes-igreja-unasp-ht-404c03a0` | Servidor | Link de checkout da Escola de Missões no Even3 |
| `EVEN3_MISSION_CHECKOUT_URL` | `https://ingressos.eventodaigreja.com.br/missao-salva-vidas-amazonia-julho-2027-034970c3` | Servidor | Link de checkout da Missão Amazonas no Even3 |
| `INFINITEPAY_API_URL` | `https://api.infinitepay.io/v2/transactions/checkout` | Servidor | Endpoint da API de checkout do InfinitePay |
| `INFINITEPAY_API_KEY` | *(preencher quando ativar)* | **Servidor (Secreta)** | Chave da API do InfinitePay |
| `INFINITEPAY_WEBHOOK_SECRET` | *(preencher quando ativar)* | **Servidor (Secreta)** | Segredo de verificação de webhook do InfinitePay |
| `NEXT_PUBLIC_PIX_KEY` | `unaspht.apso@adventistas.org` | Pública | Chave Pix oficial que recebe as ofertas |
| `NEXT_PUBLIC_RECEIPT_WHATSAPP` | `5511972246881` | Pública | WhatsApp (DDI+DDD+Número) para envio de comprovantes |
| `NEXT_PUBLIC_RECEIPT_CONTACT_NAME` | `Gadiel` | Pública | Nome do responsável pelo recebimento dos comprovantes |
| `NEXT_PUBLIC_COMMUNITY_WHATSAPP` | `5511972246881` | Pública | WhatsApp da comunidade/dúvidas do MOVEN |
| `NEXT_PUBLIC_COMMUNITY_CONTACT_NAME` | `Henrique` | Pública | Nome do contato principal de dúvidas da comunidade |
