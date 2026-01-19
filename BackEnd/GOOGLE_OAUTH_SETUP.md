# Google OAuth Setup Guide

## 1. Sukurti Google Cloud Project

1. Eikite į [Google Cloud Console](https://console.cloud.google.com/)
2. Sukurkite naują projektą arba pasirinkite esamą
3. Įsitikinkite, kad projektas yra pasirinktas viršutiniame meniu

## 2. Įjungti Google+ API

1. Eikite į **APIs & Services** > **Library**
2. Ieškokite "Google+ API"
3. Paspauskite **Enable**

## 3. Sukurti OAuth 2.0 Credentials

1. Eikite į **APIs & Services** > **Credentials**
2. Paspauskite **Create Credentials** > **OAuth client ID**
3. Jei reikia, sukonfigūruokite OAuth consent screen:
   - User Type: **External**
   - App name: `Eneba Clone`
   - User support email: jūsų email
   - Developer contact: jūsų email
   - Scopes: Add `email` ir `profile`
   - Test users: pridėkite savo Google email (development mode)

4. Sukurkite OAuth client ID:
   - Application type: **Web application**
   - Name: `Eneba Backend`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Frontend)
     - `http://localhost:5000` (Backend)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/v1/auth/google/callback`

5. Nukopijuokite **Client ID** ir **Client Secret**

## 4. Sukonfigūruoti .env failą

Pridėkite į `.env` failą:

\`\`\`env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
\`\`\`

## 5. API Endpoints

### Backend Routes:

- **GET** `/api/v1/auth/google` - Pradeda Google OAuth flow
- **GET** `/api/v1/auth/google/callback` - OAuth callback (automatiškai)

### Frontend Integration:

#### Login Button:
\`\`\`jsx
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:5000/api/v1/auth/google';
};

<button onClick={handleGoogleLogin}>
  Sign in with Google
</button>
\`\`\`

#### Success Handler (frontend route `/auth/success`):
\`\`\`jsx
// Frontend: /auth/success page
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Token is already set as cookie by backend
      // Redirect to dashboard or home
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div>Logging in...</div>;
}
\`\`\`

## 6. Testing

1. Paleiskite backend: `npm start`
2. Paleiskite frontend
3. Spauskite "Sign in with Google"
4. Pasirinkite Google account
5. Jūs turėtumėte būti nukreipti į frontend su JWT token

## 7. Production Setup

Production aplinkoje:

1. Pakeiskite redirect URIs į production URLs:
   - `https://yourdomain.com/api/v1/auth/google/callback`
   
2. Atnaujinkite .env:
\`\`\`env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback
FRONTEND_URL=https://yourdomain.com
\`\`\`

3. Google Console > OAuth consent screen > Publish app (išeiti iš testing mode)

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Patikrinkite, ar redirect URI Google Console atitinka backend URL
- Įsitikinkite, kad nėra trailing slash skirtumų

### Error: "Access blocked: This app's request is invalid"
- Sukonfigūruokite OAuth consent screen
- Pridėkite test users (development mode)

### Token not being set
- Patikrinkite CORS settings
- Įsitikinkite, kad `credentials: true` yra backend CORS config
