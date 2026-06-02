# Guía de Despliegue: Manevo Money

Esta guía detalla el paso a paso para desplegar la aplicación en tu servidor de Ubuntu utilizando **Docker** para encapsular los servicios de backend/frontend y aprovechando tu base de datos **PostgreSQL nativa** y servidor **Nginx local**.

---

## Configuración y Paso a Paso

### 1. Crear la Base de Datos en tu PostgreSQL del Servidor
Conéctate a PostgreSQL en tu servidor Ubuntu usando tu usuario `postgres` y la contraseña `root`, y crea la base de datos `manevo_money`:

```bash
# Conectarse a PostgreSQL local
PGPASSWORD=root psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE \"manevo_money\";"
```

### 2. Clonar / Mover el Código al VPS
Coloca el repositorio en la carpeta correspondiente en tu servidor, por ejemplo:
`/var/www/manevo-money`

### 3. Ejecutar los Contenedores con Docker Compose
Desde la carpeta raíz `/var/www/manevo-money` en tu servidor, levanta los contenedores. Docker compilará los proyectos y los pondrá en marcha:

```bash
# Compilar y arrancar la API (Puerto 4000) y Web (Puerto 3000)
sudo docker compose up -d --build
```

### 4. Sincronizar el esquema de base de datos con Prisma
Una vez levantado el contenedor de la API, ejecuta la migración para crear las tablas necesarias en la base de datos `manevo_money`:

```bash
sudo docker compose exec api npx prisma db push --schema=./apps/api/prisma/schema.prisma
```

---

### 5. Configurar Nginx Nativo en tu Servidor
Dado que tienes otros sitios activos sirviéndose en Nginx, crearemos una configuración dedicada para Manevo Money en el Nginx del host.

1. Crea el archivo de configuración:
   ```bash
   sudo nano /etc/nginx/sites-available/manevo-money
   ```

2. Pega el siguiente contenido (que mapea tu dominio, redirige las peticiones al contenedor frontend en el puerto `3000` y las peticiones `/api` al backend en el puerto `4000`):

   ```nginx
   server {
       listen 80;
       server_name manevo-money.devsuitpress.com;

       # Frontend (React PWA)
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend (NestJS API)
       location /api {
           proxy_pass http://127.0.0.1:4000/api;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Guarda el archivo (`Ctrl + O`, luego `Enter` y `Ctrl + X` para salir).
4. Habilita el sitio creando el enlace simbólico en `sites-enabled`:
   ```bash
   sudo ln -s /etc/nginx/sites-available/manevo-money /etc/nginx/sites-enabled/
   ```
5. Valida y reinicia Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

### 6. Instalar Certificado SSL (HTTPS) con Certbot
Para que la aplicación se comporte como una **PWA instalable** en teléfonos móviles, es **obligatorio** que corra bajo HTTPS.

Instala y ejecuta Certbot para obtener y configurar el certificado SSL de forma automática:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d manevo-money.devsuitpress.com
```

Certbot actualizará automáticamente tu archivo de Nginx `/etc/nginx/sites-available/manevo-money` para redireccionar todo el tráfico HTTP a HTTPS de manera segura. ¡Tu PWA estará lista para instalarse en cualquier dispositivo!
