# react-native-app-attestation

A complete mobile app security solution for React Native apps.

## The Problem

Without this library, anyone can send fake requests to your API:

```bash
# Anyone can do this from their terminal
curl -X POST https://api.yourapp.com/send-otp \
  -d '{"phone": "9999999999"}'

# Or loop it 1000 times
for i in {1..1000}; do
  curl -X POST https://api.yourapp.com/send-otp \
    -d '{"phone": "9999999999"}'
done
```

This leads to:
- OTP bombing — spamming any phone number with OTPs
- Fake account creation using bots
- API abuse causing server crashes
- Data scraping

## The Solution

This library proves to your server that every request comes from your **genuine, official app** installed on a **real device** — not from scripts or bots.

It does this using:
- **Android**: Google Play Integrity API — Google guarantees the request is from your genuine app
- **iOS**: Apple App Attest — Apple guarantees the request is from your genuine app

Every API request automatically includes security headers that your server can verify.

---

## How It Works

```
Your App                    Your Backend
   |                             |
   |  1. Get nonce               |
   |  ─────────────────────────> |
   |                             |
   |  2. nonce received          |
   |  <───────────────────────── |
   |                             |
   |  3. Send nonce to Google/Apple
   |  ──────────> Google/Apple   |
   |                             |
   |  4. Signed attestation token|
   |  <────────── Google/Apple   |
   |                             |
   |  5. API request with token  |
   |  ─────────────────────────> |
   |                             |
   |  6. Server verifies token   |
   |     with Google/Apple       |
   |                             |
   |  7. Request allowed         |
   |  <───────────────────────── |
```

---

## What Gets Sent With Every Request

```
POST /api/send-otp
User-Agent:      App/1.0.0 (Android)
X-App-Platform:  android
X-App-Version:   1.0.0
X-Device-ID:     8f3c7e9d-21ab-4d5e-b3c2-9a7f1e6d4c8b
X-Timestamp:     1710249381
X-Attestation:   eyJhbGciOiJSUzI1NiJ9...
```

Your server checks all of these on every request.

---

## Installation

```bash
npm install react-native-app-attestation
cd ios && pod install
```

That's it! Autolinking handles the native module setup automatically.

---

## Android Setup

These steps are one-time only.

### Step 1: Link your app in Google Play Console

This tells Google that your app is allowed to use Play Integrity API.

```
1. Go to play.google.com/console
2. Select your app
3. Left menu: Release → Setup → App Integrity
4. Find "Play Integrity API" section
5. Click "Link"
6. Select your Google Cloud project
7. Confirm
```

> Note: Your app must already be uploaded to Play Console at least once.

### Step 2: Enable Play Integrity API in Google Cloud

```
1. Go to console.cloud.google.com
2. Select the same project you linked above
3. Left menu: APIs & Services → Library
4. Search for "Play Integrity API"
5. Click on it → Click "ENABLE"
```

### Step 3: Add SDK dependency

In `android/app/build.gradle`:

```gradle
dependencies {
    // ... your existing dependencies
    implementation 'com.google.android.play:integrity:1.3.0'
}
```

---

## iOS Setup

These steps are one-time only.

### Step 1: Add App Attest capability in Xcode

```
1. Open your project in Xcode
2. Click your project name in the left sidebar (blue icon)
3. Select your app target
4. Click "Signing & Capabilities" tab
5. Click "+ Capability" button
6. Search for "App Attest"
7. Double click to add it
```

### Step 2: Set up Bridging Header

```
1. Open Xcode
2. Click your project → Select your target
3. Go to "Build Settings" tab
4. Search for "Objective-C Bridging Header"
5. Set the value to:
   YourProjectName/ReactNativeAppAttestation-Bridging-Header.h
```

---

## Code Setup

### Step 1: Initialize in App.tsx

Call `initAttestation` once when your app starts.

```typescript
import { initAttestation } from 'react-native-app-attestation';

// With MMKV (recommended — fast synchronous storage)
import { MMKV } from 'react-native-mmkv';
const mmkv = new MMKV();

initAttestation({
  // Tell the library how to store the device ID
  // You can use any storage — MMKV, AsyncStorage, etc.
  storage: {
    get: (key) => mmkv.getString(key) ?? null,
    set: (key, val) => mmkv.set(key, val),
    delete: (key) => mmkv.delete(key),
  },

  // Your backend endpoint that returns a nonce
  nonceEndpoint: 'https://api.yourapp.com/auth/nonce',

  // Your app version — sent in every request header
  appVersion: '1.0.0',

  // Show debug logs in development
  debug: __DEV__,
});
```

```typescript
// With AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

initAttestation({
  storage: {
    get: (key) => AsyncStorage.getItem(key),
    set: (key, val) => AsyncStorage.setItem(key, val),
    delete: (key) => AsyncStorage.removeItem(key),
  },
  nonceEndpoint: 'https://api.yourapp.com/auth/nonce',
  appVersion: '1.0.0',
});
```

---

### Step 2: Secure your API calls

#### With Axios

```typescript
import axios from 'axios';
import { setupAxios } from 'react-native-app-attestation';

const api = axios.create({
  baseURL: 'https://api.yourapp.com',
  timeout: 15000,
});

// One line — all requests secured automatically
setupAxios(api);

// Use api normally — security headers added behind the scenes
const response = await api.get('/user/profile');
const response = await api.post('/send-otp', { phone: '9876543210' });
```

#### With Fetch

```typescript
import { secureGet, securePost } from 'react-native-app-attestation';

// GET request — replaces fetch()
const response = await secureGet('https://api.yourapp.com/user');
const data = await response.json();

// POST request — replaces fetch() with method POST
const response = await securePost(
  'https://api.yourapp.com/login',
  { phone: '9876543210' }
);
```

#### With any other HTTP client

```typescript
import { getSecurityHeaders } from 'react-native-app-attestation';

// Get all headers as an object and add them manually
const headers = await getSecurityHeaders();

myHttpClient.request({
  url: '/endpoint',
  headers: {
    ...headers,
    'Authorization': `Bearer ${token}`,
  }
});
```

---

### Step 3: Sensitive operations

For payments or login, always use a fresh token.
This prevents replay attacks on critical endpoints.

```typescript
import { getFreshAttestationToken } from 'react-native-app-attestation';

const makePayment = async (paymentData) => {
  // Force a fresh token — always bypasses cache
  const freshToken = await getFreshAttestationToken();

  await api.post('/payment', paymentData, {
    headers: { 'X-Attestation': freshToken }
  });
};
```

---

### Step 4: Logout

Clear the attestation cache when the user logs out.

```typescript
import { clearAttestationCache } from 'react-native-app-attestation';

const logout = () => {
  clearAttestationCache();
  // ... rest of your logout logic
};
```

---

## Backend Setup

### Nonce Endpoint

Create a `GET /auth/nonce` endpoint that returns a random one-time string.

```javascript
// Node.js example
const crypto = require('crypto');

app.get('/auth/nonce', async (req, res) => {
  const nonce = crypto.randomBytes(32).toString('hex');

  await db.nonces.create({
    nonce,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    used: false,
  });

  res.json({ nonce });
});
```

### Request Validation

Validate these headers on every incoming request:

```javascript
const validateRequest = async (req) => {

  // 1. Check User-Agent
  if (!req.headers['user-agent']?.includes('App/')) {
    throw new Error('Invalid client');
  }

  // 2. Reject requests older than 5 minutes (prevents replay attacks)
  const timestamp = parseInt(req.headers['x-timestamp']);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error('Request expired');
  }

  // 3. Check Device ID format
  const deviceId = req.headers['x-device-id'];
  if (!/^[0-9a-f-]{36}$/i.test(deviceId)) {
    throw new Error('Invalid device ID');
  }

  // 4. Verify attestation token with Google/Apple
  const isValid = await verifyAttestationToken(
    req.headers['x-attestation'],
    req.headers['x-app-platform']
  );
  if (!isValid) throw new Error('Attestation failed');
};
```

### Verify Android Token (Play Integrity)

```javascript
const verifyAndroidToken = async (token) => {
  const response = await fetch(
    `https://playintegrity.googleapis.com/v1/${PACKAGE_NAME}:decodeIntegrityToken`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${GOOGLE_ACCESS_TOKEN}` },
      body: JSON.stringify({ integrity_token: token }),
    }
  );

  const data = await response.json();

  return (
    data.tokenPayloadExternal?.appIntegrity?.appRecognitionVerdict === 'PLAY_RECOGNIZED' &&
    data.tokenPayloadExternal?.deviceIntegrity?.deviceRecognitionVerdict
      ?.includes('MEETS_DEVICE_INTEGRITY')
  );
};
```

### Verify iOS Token (App Attest)

```javascript
const verifyIOSToken = async (token) => {
  // Full guide: https://developer.apple.com/documentation/devicecheck/validating_apps_that_connect_to_your_server
  const attestation = Buffer.from(token, 'base64');
  // ... Apple certificate chain verification
};
```

---

## Token Caching

The library automatically caches the attestation token for 10 minutes.
Google/Apple is only called once every 10 minutes — not on every request.

```
10:00 → App opens  — fresh token fetched, cached for 10 min
10:02 → API call   — cached token used  (no Google/Apple call)
10:05 → API call   — cached token used  (no Google/Apple call)
10:08 → API call   — cached token used  (no Google/Apple call)
10:10 → Cache expired — fresh token fetched automatically
10:15 → Payment    — getFreshAttestationToken() always bypasses cache
```

Customize the cache duration:

```typescript
initAttestation({
  tokenCacheDurationMs: 5 * 60 * 1000, // 5 minutes instead of default 10
});
```

---

## API Reference

| Function | Description |
|----------|-------------|
| `initAttestation(config)` | Initialize once at app start |
| `setupAxios(instance)` | Setup axios interceptor — one line secures all requests |
| `secureGet(url, options?)` | Secure replacement for fetch GET |
| `securePost(url, body, options?)` | Secure replacement for fetch POST |
| `getDeviceID()` | Get persistent device UUID |
| `getAttestationToken(forceRefresh?)` | Get cached or fresh attestation token |
| `getFreshAttestationToken()` | Always fresh token — use for payments and login |
| `getSecurityHeaders()` | Get all security headers as an object |
| `clearAttestationCache()` | Clear token cache — call on logout |
| `resetDeviceID()` | Delete stored device ID |

---

## Requirements

- React Native >= 0.70
- iOS >= 14.0
- Android API level >= 24

---

## License

MIT
