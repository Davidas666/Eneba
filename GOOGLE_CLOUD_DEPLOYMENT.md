# Google Cloud Diegimas - Eneba Projektas

## 1️⃣ PARUOŠIMAS PRIEŠ DIEGIMĄ

### Reikalingi įrankiai:
- Google Cloud Console paskyra (https://console.cloud.google.com)
- Google Cloud CLI (`gcloud` komanda)
- Git
- Node.js 18+

### Žingsniai:
```bash
# 1. Atsisiųsti Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# 2. Prisijungti prie Google Cloud
gcloud auth login

# 3. Nustatyti numatytąjį projektą
gcloud config set project YOUR_PROJECT_ID
```

---

## 2️⃣ BACKEND DIEGIMAS (App Engine arba Cloud Run)

### A) App Engine variantas (paprastesnis)

#### Žingsnis 1: Sukurti `app.yaml` faile BackEnd direktorijoje:
```yaml
runtime: nodejs20
env: standard

env_variables:
  NODE_ENV: "production"
  PORT: "8080"

handlers:
- url: /.*
  script: auto
```

#### Žingsnis 2: Nustatyti aplinkos kintamuosius
```bash
cd BackEnd
gcloud app create  # Jei pirmą kartą
gcloud config set app/cloud_build_timeout 1600s
```

#### Žingsnis 3: Diegti
```bash
gcloud app deploy
```

### B) Cloud Run variantas (rekomenduojamas - labiau skalus)

#### Žingsnis 1: Sukurti `.dockerignore` ir `Dockerfile`:

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV PORT=8080

CMD ["node", "server.js"]
```

**.dockerignore:**
```
node_modules
npm-debug.log
.git
.env.local
```

#### Žingsnis 2: Sukurti Cloud SQL instanciją (duomenų bazė)
```bash
# Sukurti PostgreSQL duomenų bazę
gcloud sql instances create eneba-db \
  --database-version=POSTGRES_15 \
  --region=europe-west1 \
  --tier=db-f1-micro

# Sukurti duomenų bazę
gcloud sql databases create eneba --instance=eneba-db

# Sukurti naudotoją
gcloud sql users create app-user --instance=eneba-db --password
```

#### Žingsnis 3: Atnaujinti `.env` kintamuosius
```env
DB_USER=app-user
DB_PASSWORD=your_password
DB_HOST=/cloudsql/YOUR_PROJECT:europe-west1:eneba-db
DB_NAME=eneba
DB_PORT=5432

GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret
```

#### Žingsnis 4: Sukurti `app.yaml` Cloud Run:
```yaml
runtime: nodejs20

env:
  flexible: true

env_variables:
  NODE_ENV: "production"

cloudsql_instances:
  - YOUR_PROJECT:europe-west1:eneba-db
```

#### Žingsnis 5: Diegti
```bash
cd BackEnd

# Statyti ir diegti su Cloud Build
gcloud run deploy eneba-backend \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated

# Pabraižyti Cloud SQL prievadą (jei reikia testo)
gcloud sql connect eneba-db --user=app-user
```

---

## 3️⃣ FRONTEND DIEGIMAS (Cloud Storage + CDN)

### Žingsnis 1: Sukurti Storage Bucket
```bash
gsutil mb gs://eneba-frontend

# Nustatyti viešą prieigą
gsutil iam ch allUsers:objectViewer gs://eneba-frontend
```

### Žingsnis 2: Pastatyti ir ikelti
```bash
cd FrontEnd

# Pastatyti projektą
npm run build

# Ikelti failus į Storage
gsutil -m cp -r dist/* gs://eneba-frontend/

# CORS konfigūracija (jei reikia)
gsutil cors set cors.json gs://eneba-frontend
```

**cors.json:**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

### Žingsnis 3: Nustatyti Cloud CDN
```bash
# Sukurti load balancer su CDN
gcloud compute backend-buckets create eneba-frontend \
  --gcs-uri-prefix=gs://eneba-frontend \
  --enable-cdn

# Sukurti URL map
gcloud compute url-maps create eneba-url-map \
  --default-backend-bucket=eneba-frontend

# Sukurti HTTPS proxy
gcloud compute target-https-proxies create eneba-proxy \
  --url-map=eneba-url-map \
  --ssl-certificates=your-cert

# Sukurti viešą IP
gcloud compute addresses create eneba-frontend-ip \
  --global

# Sukurti taisytę
gcloud compute forwarding-rules create eneba-rule \
  --global \
  --target-https-proxy=eneba-proxy \
  --address=eneba-frontend-ip
```

---

## 4️⃣ ATNAUJINTI FRONTEND API NUORODAS

**services/api.js atnaujinti:**
```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'https://YOUR_CLOUD_RUN_URL/api';

export const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  return response.json();
};
```

**vite.config.js:**
```javascript
export default {
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://YOUR_CLOUD_RUN_URL/api'),
  },
};
```

---

## 5️⃣ DOMENO NUSTATYMAS

```bash
# Pridėti custom domeną
gcloud app custom-domains create www.eneba.com
gcloud app custom-domains create eneba.com

# Arba Cloud Run:
gcloud run services update eneba-backend \
  --region=europe-west1 \
  --custom-domain www.eneba.com
```

---

## 6️⃣ DUOMENŲ BAZĖS MIGRACIJOS

```bash
# Iš kompiuterio į Cloud SQL
gcloud sql backups create \
  --instance=eneba-db

# Arba tiesiogiai paleisti SQL skriptus
gcloud sql connect eneba-db --user=app-user < DB_EXAMPLES.sql
```

---

## 7️⃣ MONITORINGAS IR ŽURNALAI

```bash
# App Engine žurnalai
gcloud app logs read

# Cloud Run žurnalai
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Tikrinti serverio statusą
gcloud run services describe eneba-backend --region=europe-west1
```

---

## 8️⃣ BUDGET IR SĄNAUDOS

```bash
# Nustatyti biudžetą
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ID \
  --display-name="Eneba Budget" \
  --budget-amount=50
```

---

## ⚠️ SVARBUS PATARIMAI

1. **Slaptažodžiai**: Naudoti Google Secret Manager
   ```bash
   gcloud secrets create db-password --data-file=-
   ```

2. **SSL Sertifikatai**: Naudoti Cloud Armor arba Google-managed certificates

3. **Aplinkos**: Nustatyti atskirus projektus dev/prod

4. **Backup**: Automatizuoti Cloud SQL backupus

5. **Scaling**: Cloud Run automatiškai skaliuojasi pagal apkrovą

---

## 🆘 DAŽNI KLAIDOS

| Klaida | Sprendimas |
|--------|-----------|
| 403 Forbidden | Patikrinti IAM leidimus ir Service Account |
| Connection timeout | Patikrinti Cloud SQL prievado jungtis |
| 502 Bad Gateway | Patikrinti App Engine/Cloud Run logs |
| CORS blokada | Patikrinti cors.json ir viešąją prieigą |

---

## 📞 PAGALBA

- [Google Cloud Docs](https://cloud.google.com/docs)
- [Cloud Run Guide](https://cloud.google.com/run/docs)
- [Cloud SQL Docs](https://cloud.google.com/sql/docs)
