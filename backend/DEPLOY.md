# Deploy do Backend Anjos Ambiental

Este guia considera o backend rodando em uma VPS Ubuntu 24.04 com Node.js 22, PM2 e Nginx ja instalados.

## 1. DNS

Antes do deploy, crie/valide o registro DNS:

- Tipo: A
- Nome: api
- Valor: IP publico da VPS
- Resultado esperado: api.anjosambiental.com.br apontando para a VPS

## 2. Arquivos de ambiente

No servidor, crie o arquivo `backend/.env` a partir de `.env.example` e ajuste o dominio do frontend se necessario.

```bash
cd /var/www/anjos-ambiental/backend
cp .env.example .env
nano .env
```

Conteudo inicial recomendado:

```env
NODE_ENV=production
PORT=3333
CORS_ORIGIN=https://anjosambiental.com.br,https://www.anjosambiental.com.br
```

## 3. Instalar e compilar

```bash
cd /var/www/anjos-ambiental/backend
npm ci
npm run build
```

## 4. PM2

```bash
cd /var/www/anjos-ambiental/backend
set -a
source .env
set +a
pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 status
curl http://127.0.0.1:3333/health
```

## 5. Nginx

```bash
cp /var/www/anjos-ambiental/backend/deploy/nginx/anjos-ambiental-api.conf /etc/nginx/sites-available/anjos-ambiental-api.conf
ln -sf /etc/nginx/sites-available/anjos-ambiental-api.conf /etc/nginx/sites-enabled/anjos-ambiental-api.conf
nginx -t
systemctl reload nginx
curl -I http://api.anjosambiental.com.br/health
```

## 6. SSL

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.anjosambiental.com.br
systemctl status certbot.timer
curl https://api.anjosambiental.com.br/health
```

## 7. Vercel

No painel da Vercel, configure a variavel do frontend:

```env
VITE_API_BASE_URL=https://api.anjosambiental.com.br
```

Depois faca um novo deploy do frontend.
