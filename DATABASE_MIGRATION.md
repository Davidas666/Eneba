# Duomenų Bazės Migracija į Google Cloud SQL

## 1️⃣ PARUOŠIMAS - GAUTI SENOS DB PRIEIGĄ

### Jūsų `.env` failą turėtumėte turėti:
```env
DB_HOST=localhost  # arba jūsų server IP
DB_PORT=5432
DB_NAME=eneba      # jūsų duomenų bazės vardas
DB_USER=postgres   # ar kitas naudotojas
DB_PASSWORD=your_password
DB_SSL=false
```

---

## 2️⃣ ŽINGSNIS 1: PADARYTI BACKUP IŠ SENOS DB

### A) Iš Windows (PowerShell arba CMD):
```bash
# Nustatyti PostgreSQL kelią (jei reikia)
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"

# Padaryti pilnų backup
pg_dump -h localhost -U postgres -d eneba > backup_eneba.sql

# Jei reikia šifravimo/kompresijos
pg_dump -h localhost -U postgres -d eneba | gzip > backup_eneba.sql.gz

# Jei reikalinga slaptažodžio:
# Sukurti .pgpass failą šiame kelyje: C:\Users\YourUsername\AppData\postgresql\pgpass.conf
# Formatas: hostname:port:database:username:password
# Pavyzdys: localhost:5432:eneba:postgres:your_password
```

### B) Jei duomenų bazė yra REMOTE serveryje:
```bash
pg_dump -h your.server.com -p 5432 -U postgres -d eneba > backup_eneba.sql
```

### C) Patikrinti, kad backup sėkmingas:
```bash
# Patikrinti failą
ls -la backup_eneba.sql  # Linux/Mac
dir backup_eneba.sql    # Windows

# Peržiūrėti pradžią
head -20 backup_eneba.sql
```

---

## 3️⃣ ŽINGSNIS 2: SUKURTI CLOUD SQL INSTANCIJĄ

### A) Sukurti duomenų bazę Google Cloud:
```bash
# Prisijungti (jei dar ne)
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Sukurti PostgreSQL instanciją
gcloud sql instances create eneba-db \
  --database-version=POSTGRES_15 \
  --region=europe-west1 \
  --tier=db-f1-micro \
  --storage-size=10GB \
  --storage-auto-increase \
  --availability-type=regional \
  --backup-start-time=03:00 \
  --enable-bin-log

# Patikrinti sukūrimo statusą
gcloud sql instances describe eneba-db
```

### B) Sukurti duomenų bazę ir naudotoją:
```bash
# Sukurti duomenų bazę
gcloud sql databases create eneba --instance=eneba-db

# Sukurti naudotoją (bus prašytas slaptažodis)
gcloud sql users create app-user --instance=eneba-db --password

# Arba be interaktyvaus režimo
gcloud sql users create app-user --instance=eneba-db --password=YOUR_PASSWORD
```

### C) Gauti Cloud SQL Instance Connection:
```bash
# Gauti connection string
gcloud sql instances describe eneba-db --format='value(connectionName)'

# Turėtumėte gauti: YOUR_PROJECT:europe-west1:eneba-db
```

---

## 4️⃣ ŽINGSNIS 3: IKELTI BACKUP Į GOOGLE CLOUD

### A) Su `gsutil` (rekomenduojama):
```bash
# 1. Sukurti Storage Bucket
gsutil mb gs://eneba-backups

# 2. Ikelti backup failą
gsutil cp backup_eneba.sql gs://eneba-backups/

# 3. Patikrinti
gsutil ls gs://eneba-backups/
```

### B) Cloud SQL Import (tiesioginė importa):
```bash
# 1. Ikelti į Storage (žr. 4A)

# 2. Importuoti iš Storage į Cloud SQL
gcloud sql import sql eneba-db \
  gs://eneba-backups/backup_eneba.sql \
  --database=eneba

# 3. Patikrinti importo statusą
gcloud sql operations list --instance=eneba-db
```

---

## 5️⃣ ŽINGSNIS 4: PATIKRINTI IR TIKRINTI DUOMENIS

### A) Prisijungti prie Cloud SQL:
```bash
# Su Cloud SQL Auth proxy
cloud-sql-proxy YOUR_PROJECT:europe-west1:eneba-db &

# Tada psql iš lokalaus kompo:
psql -h 127.0.0.1 -U app-user -d eneba
```

### B) Arba tiesiogiai:
```bash
# Paklausti duomenų
gcloud sql connect eneba-db --user=app-user

# Tada paleisti SQL:
SELECT * FROM games LIMIT 5;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM cart_items;
```

### C) Patikrinti lentelių skaičių:
```bash
\dt  # Jei psql

# Arba SQL query:
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public';
```

---

## 6️⃣ ŽINGSNIS 5: ATNAUJINTI .env BackEnd

Atnaujinti `.env` failą projekto BackEnd:

```env
# Senosios DB (jei vis dar reikalinga)
# DB_HOST=localhost
# DB_PORT=5432

# NAUJA CLOUD SQL DB
DB_HOST=/cloudsql/YOUR_PROJECT:europe-west1:eneba-db
DB_PORT=5432
DB_NAME=eneba
DB_USER=app-user
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_SSL=true

NODE_ENV=production

# Kiti kintamieji:
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret
```

---

## 7️⃣ ŽINGSNIS 6: DIEGTI BACKEND SU CLOUD RUN

### A) Sukurti Dockerfile (jei dar nėra):
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV PORT=8080

CMD ["node", "server.js"]
```

### B) Diegti į Cloud Run:
```bash
cd BackEnd

gcloud run deploy eneba-backend \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-cloudsql-instances=YOUR_PROJECT:europe-west1:eneba-db \
  --set-env-vars="DB_HOST=/cloudsql/YOUR_PROJECT:europe-west1:eneba-db,DB_USER=app-user,DB_NAME=eneba"
```

---

## 8️⃣ ŽINGSNIS 7: SAUGOS NUSTATYMAI

### A) Suimti duomenis Secret Manager:
```bash
# Sukurti sekretą
echo -n "YOUR_PASSWORD" | gcloud secrets create db-password --data-file=-

# Arba iš failo
gcloud secrets create db-password --data-file=password.txt

# Naudoti Cloud Run:
gcloud run deploy eneba-backend \
  --update-secrets DB_PASSWORD=db-password:latest
```

### B) Cloud SQL Proxy (jei nereikia Cloud Run):
```bash
# Atsisiųsti Cloud SQL Auth proxy
# https://cloud.google.com/sql/docs/postgres/quickstart-proxy-test

# Paleisti proxy
cloud-sql-proxy YOUR_PROJECT:europe-west1:eneba-db

# Tada iš kito terminal:
psql -h 127.0.0.1 -U app-user -d eneba
```

---

## 9️⃣ ŽINGSNIS 8: AUTOMATINIS BACKUP

```bash
# Nustatyti automatinį backup (Apple/Linux):
gcloud sql backups create \
  --instance=eneba-db

# Nustatyti automatinį backup Windows Task Scheduler:
# 1. Sukurti batch failą: backup.bat
# 2. Turinys:
@echo off
gcloud sql backups create --instance=eneba-db
# 3. Nustatyti Task Scheduler, kad vykdytų kasdien 3:00 AM
```

---

## 🔄 ŽINGSNIS 9: ATSARGI EKSPORTACIJA

### Jei reikia iš Cloud SQL atgal:
```bash
# Eksportuoti iš Cloud SQL
gcloud sql export sql eneba-db \
  gs://eneba-backups/backup_exported.sql \
  --database=eneba

# Atsisiųsti:
gsutil cp gs://eneba-backups/backup_exported.sql ./
```

---

## 📋 BENDRA KOMANDU SEKA (GREITAI)

```bash
# 1. Backup iš senos DB
pg_dump -h localhost -U postgres -d eneba > backup_eneba.sql

# 2. Google Cloud prisijungimas
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 3. Sukurti Cloud SQL
gcloud sql instances create eneba-db \
  --database-version=POSTGRES_15 \
  --region=europe-west1 \
  --tier=db-f1-micro

# 4. Sukurti duomenų bazę ir naudotoją
gcloud sql databases create eneba --instance=eneba-db
gcloud sql users create app-user --instance=eneba-db --password

# 5. Ikelti Storage
gsutil mb gs://eneba-backups
gsutil cp backup_eneba.sql gs://eneba-backups/

# 6. Importuoti į Cloud SQL
gcloud sql import sql eneba-db \
  gs://eneba-backups/backup_eneba.sql \
  --database=eneba

# 7. Patikrinti
gcloud sql connect eneba-db --user=app-user

# 8. Atnaujinti .env ir diegti Backend
# (Žr. žingsnius aukščiau)
```

---

## 🆘 PROBLEMOS IR SPRENDIMAI

| Problema | Priežastis | Sprendimas |
|----------|-----------|-----------|
| `pg_dump: command not found` | PostgreSQL tools neinstaliuoti | Atsisiųsti PostgreSQL ir pridėti PATH |
| `Connection refused` | Neteisingos duomenų bazės host/port | Patikrinti `.env` DB_HOST ir DB_PORT |
| `FATAL: password authentication failed` | Neteisingas naudotojo slaptažodis | Patikrinti `DB_PASSWORD` .env |
| `Import timeout` | Didelis backup failas | Naudoti kompresijąg zip arba dalinti į dalis |
| `Permission denied` | Cloud SQL nėra leidimų | Patikrinti IAM ir Service Account leidimus |
| `socket: cannot assign requested address` | Cloud SQL prievadas neveikia | Nustatyti Cloud SQL Auth proxy |

---

## 📞 NAUDINGOS NUORODOS

- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Google Cloud SQL Restore](https://cloud.google.com/sql/docs/postgres/backup-recovery)
- [Cloud SQL Admin API](https://cloud.google.com/sql/docs/postgres/admin-api)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
