# Ubuntu Setup - Pilnas Eneba Projektas

## 1️⃣ PARUOŠIMAS - UBUNTU SISTEMOS ATNAUJINIMAS

```bash
# Atnaujinti sistemą
sudo apt update
sudo apt upgrade -y

# Instaliuoti pagrindinius tools
sudo apt install -y curl wget git build-essential
```

---

## 2️⃣ NODE.JS IR NPM INSTALIACIJA

### Variantas A: Node Version Manager (NVM) - REKOMENDUOJAMA
```bash
# Atsisiųsti NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Atnaujinti shell session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instaliuoti Node.js 20 (LTS)
nvm install 20
nvm use 20

# Patikrinti versions
node --version
npm --version
```

### Variantas B: NodeSource Repository
```bash
# Atsisiųsti Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instaliuoti
sudo apt install -y nodejs

# Patikrinti
node -v
npm -v
```

---

## 3️⃣ POSTGRESQL INSTALIACIJA

```bash
# Instaliuoti PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Paleisti PostgreSQL servisą
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Paleisti kiekvieną kartą įjungiant

# Patikrinti statusą
sudo systemctl status postgresql

# Patikrinti versiją
psql --version
```

---

## 4️⃣ POSTGRESQL KONFIGŪRACIJA

### A) Prisijungti prie PostgreSQL:
```bash
# Prisijungti kaip postgres naudotojas
sudo -u postgres psql

# Tada terminale matsite: postgres=#
```

### B) Sukurti naudotoją ir duomenų bazę:
```sql
-- Sukurti naudotoją
CREATE USER app_user WITH PASSWORD 'your_strong_password_here';

-- Suteikti leidimus
ALTER ROLE app_user WITH CREATEDB;
ALTER ROLE app_user WITH SUPERUSER;

-- Sukurti duomenų bazę
CREATE DATABASE eneba OWNER app_user;

-- Patikrinti
\l  -- Pamatys sąrašą duomenų bazių
\du -- Pamatys naudotojus

-- Išeiti
\q
```

---

## 5️⃣ DUOMENŲ BAZĖS BACKUP IŠ WINDOWS → UBUNTU

### A) Jei turite backup failą (backup_eneba.sql):

**Iš Windows → Ubuntu (SFTP arba SCP):**
```bash
# Ubuntu terminale - gauти savo IP
ip addr show

# Tada Windows PowerShell (jei SSH Setup):
scp C:\Users\kvadr\Desktop\Eneba\backup_eneba.sql username@ubuntu_ip:/home/username/

# Arba naudoti WinSCP - GUI tool
```

### B) Importuoti backup į PostgreSQL:
```bash
# Jei turite backup failą home direktorijoje:
psql -U app_user -d eneba < ~/backup_eneba.sql

# Arba su host nurodymu:
psql -h localhost -U app_user -d eneba < ~/backup_eneba.sql

# Patikrinti - peržiūrėti lentelės
psql -U app_user -d eneba -c "SELECT * FROM games LIMIT 5;"
```

### C) Jei nėra backup failo - sukurti test duomenis:
```bash
# Prisijungti prie PostgreSQL
psql -U app_user -d eneba

# Tada paleisti setup SQL skriptą (iš jūsų DB_EXAMPLES.sql)
# Arba rankiniu būdu:
```

---

## 6️⃣ BACKEND NUSTATYMAS

### A) Nukopijuoti BackEnd failai:
```bash
# Jei turite projektas savo kompe - per SCP/SSH
scp -r C:\Users\kvadr\Desktop\Eneba\BackEnd username@ubuntu_ip:/home/username/

# Arba per GitHub (rekomenduojama):
cd ~/
git clone https://github.com/YOUR_USERNAME/eneba-backend.git
cd eneba-backend
```

### B) Instaliuoti NPM priklausomybes:
```bash
# Būdamas BackEnd direktorijoje
npm install

# Patikrinti
npm list
```

### C) Sukurti .env failą:
```bash
# Sukurti .env BackEnd direktorijoje
nano .env

# Dėti šį turinį:
```

```env
# PostgreSQL Konfigūracija (Ubuntu lokalaus)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eneba
DB_USER=app_user
DB_PASSWORD=your_strong_password_here
DB_SSL=false
NODE_ENV=development

# Kiti kintamieji (iš jūsų)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret_key

# API Port
PORT=5000
```

```bash
# Išsaugoti: Ctrl+X, Y, Enter
```

### D) Patikrinti duomenų bazės ryšį:
```bash
# Iš BackEnd direktorijos
npm run init-db

# Turėtumėte pamatyti: "Successful connection to database"
```

---

## 7️⃣ PALEISTI BACKEND

### A) Development režime:
```bash
# Iš BackEnd direktorijos
npm run dev

# Arba
npm start

# Turėtumėte matyti:
# Serveris paleistas: http://localhost:5000
```

### B) Patikrinti ar veikia:
```bash
# Iš kito terminal lango:
curl http://localhost:5000/api/health

# Arba PowerShell:
Invoke-WebRequest -Uri http://localhost:5000/api/health
```

### C) Production režime:
```bash
# Instaliuoti PM2 (process manager)
npm install -g pm2

# Paleisti su PM2
pm2 start server.js --name "eneba-backend"

# Monitorinti
pm2 monit

# Žurnalai
pm2 logs eneba-backend

# Automatinis restartavimas bootai
pm2 startup
pm2 save
```

---

## 8️⃣ FRONTEND NUSTATYMAS

### A) Nukopijuoti FrontEnd failai:
```bash
# Per GitHub
git clone https://github.com/YOUR_USERNAME/eneba-frontend.git
cd eneba-frontend

# Arba per SCP
scp -r C:\Users\kvadr\Desktop\Eneba\FrontEnd username@ubuntu_ip:/home/username/
```

### B) Instaliuoti ir sukonfigūruoti:
```bash
# Instaliuoti priklausomybes
npm install

# Sukurti .env failą
nano .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
# Išsaugoti: Ctrl+X, Y, Enter
```

### C) Development režime:
```bash
# Paleisti development serverį
npm run dev

# Atvers http://localhost:5173/
```

### D) Production build:
```bash
# Pastatyti
npm run build

# Turėtumėte gauti `dist/` folderį

# Testuoti production build
npm run preview
```

---

## 9️⃣ VISOS KOMANDOS PER UBUNTU - GREITAI

```bash
# ============= SETUP =============
sudo apt update && sudo apt upgrade -y

# Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib postgresql-client
sudo systemctl start postgresql
sudo systemctl enable postgresql

# ============= PostgreSQL Setup =============
sudo -u postgres psql

# Tada šios komandos:
# CREATE USER app_user WITH PASSWORD 'password123';
# ALTER ROLE app_user WITH SUPERUSER;
# CREATE DATABASE eneba OWNER app_user;
# \q

# ============= Backend =============
git clone https://github.com/YOUR_USERNAME/eneba-backend.git
cd eneba-backend
npm install

# Sukurti .env su DB credentials

npm run dev  # arba npm start

# ============= Frontend (iš kito terminal) =============
cd ~/
git clone https://github.com/YOUR_USERNAME/eneba-frontend.git
cd eneba-frontend
npm install

npm run dev

# ============= Patikrinti =============
curl http://localhost:5000/api/health
# Būtina matyti sukūrę frontend: http://localhost:5173
```

---

## 🔟 NUSTATINIAI - NUOLATINIS VEIKIMAS

### A) PM2 - Process Manager:
```bash
# Instaliuoti globaliai
npm install -g pm2

# Backend su PM2
cd ~/eneba-backend
pm2 start npm --name "eneba-backend" -- start

# Frontend su PM2
cd ~/eneba-frontend
pm2 start npm --name "eneba-frontend" -- preview

# Žiūrėti veikiančius procesus
pm2 list

# Žurnalai
pm2 logs

# Automatinis paleidimas bootai
pm2 startup
pm2 save
```

### B) Nginx - Reverse Proxy (viešam internete):
```bash
# Instaliuoti
sudo apt install -y nginx

# Konfigūruoti
sudo nano /etc/nginx/sites-available/default
```

```nginx
upstream backend {
    server 127.0.0.1:5000;
}

upstream frontend {
    server 127.0.0.1:5173;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Testuoti konfigūraciją
sudo nginx -t

# Paleisti/restartinti
sudo systemctl start nginx
sudo systemctl enable nginx

# Patikrinti statusą
sudo systemctl status nginx
```

---

## 1️⃣1️⃣ PATIKRINIMAS - VEIKLUMO TESTAI

```bash
# ============= Duomenų bazė =============
psql -U app_user -d eneba -c "SELECT COUNT(*) FROM games;"
psql -U app_user -d eneba -c "SELECT COUNT(*) FROM users;"

# ============= Backend API =============
curl -i http://localhost:5000/api/games
curl -i http://localhost:5000/api/health

# ============= Frontend =============
# Atidarykite: http://localhost:5173 (dev) arba http://localhost:3000 (prod)

# ============= Процесса veikimo =============
pm2 list
pm2 monit
```

---

## 1️⃣2️⃣ KLAIDOS IR SPRENDIMAI

| Klaida | Sprendimas |
|--------|-----------|
| `psql: command not found` | `sudo apt install -y postgresql-client` |
| `Connection refused` | Patikrinti ar PostgreSQL paleistas: `sudo systemctl status postgresql` |
| `FATAL: password authentication failed` | Patikrinti `.env` slaptažodį |
| `npm: command not found` | Instaliuoti Node.js (žr. žingsnį 2) |
| `Cannot find module` | Paleisti `npm install` iš naujo |
| `Port already in use` | Keisti PORT `.env` arba `lsof -i :5000` ir kill |
| `Nginx 502 Bad Gateway` | Backend neveikia - patikrinti PM2 `pm2 logs` |

---

## 1️⃣3️⃣ LINUX NAUDINGOS KOMANDOS

```bash
# Direktorijos navigacija
cd ~              # Home direktorija
cd /path/to/dir   # Kelias
ls                # Sąrašas failų
ls -la            # Detalus sąrašas
pwd               # Dabartinis kelias

# Failai
nano file.txt     # Redaguoti failą
cat file.txt      # Peržiūrėti
rm file.txt       # Panaikinti
cp file.txt file2.txt  # Kopijuoti
mv file.txt path/ # Perkelti

# Procesai
ps aux            # Visi procesai
kill -9 pid       # Nužudyti procesą
top               # Sistemos apkrova
htop              # Interaktyvus top

# Portai
lsof -i :5000     # Kas naudoja 5000 portą
netstat -tulnp    # Visi atidaryti portai

# SSH/SCP
ssh user@host     # Prisijungti
scp file user@host:/path  # Iš Windows/Mac kopijuoti

# Sistemine
sudo              # Gauti admin leidimus
sudo systemctl start service   # Paleisti servisą
sudo systemctl status service  # Statusas
journalctl -u service -f       # Žurnalai
```

---

## 🆘 PAGALBOS NUORODOS

- [Ubuntu Docs](https://ubuntu.com/tutorials)
- [Node.js Setup](https://nodejs.org/en/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [PM2 Docs](https://pm2.keymetrics.io/)
- [Nginx Docs](https://nginx.org/en/docs/)

---

## 📝 BENDRA ŽEMĖLAPIS

```
Ubuntu Server
├── Node.js v20
├── PostgreSQL
│   └── eneba (duomenų bazė)
│       ├── games
│       ├── users
│       ├── cart
│       └── favorites
├── Backend (Node.js + Express)
│   └── PORT 5000
├── Frontend (Vite + React)
│   └── PORT 5173
└── Nginx (Reverse Proxy)
    └── PORT 80/443
```

**Sėkmės! 🚀**
