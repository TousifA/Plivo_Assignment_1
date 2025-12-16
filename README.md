## InspireWorks Plivo IVR Demo

This project is a small Node.js/Express application that demonstrates a multi-level IVR using the Plivo Voice API.

**Features**
- **Outbound call**: Initiate an outbound call to a target phone number using Plivo.
- **Level 1 IVR (language selection)**:  
  - Press 1 for English  
  - Press 2 for Spanish
- **Level 2 IVR (per language)**:  
  - Press 1 to play a short audio message (public MP3)  
  - Press 2 to connect to a live associate (placeholder/test number)
- **Graceful handling of invalid inputs**: Repeats menus when DTMF input is invalid.

---

## Prerequisites

- **Node.js** (v18+ recommended) and **npm**
- **Plivo account** with:
  - Auth ID
  - Auth Token
  - A Plivo phone number that can make outbound calls
- A **publicly accessible URL** for webhook callbacks (e.g. using `ngrok`)
- A test phone number you can receive calls on

---

## Installation

1. **Clone the repository**

```bash
git clone <your-github-repo-url> plivo-ivr-demo
cd plivo-ivr-demo
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment configuration**

Create a `.env` file in the project root:

```bash
PLIVO_AUTH_ID=YOUR_PLIVO_AUTH_ID
PLIVO_AUTH_TOKEN=YOUR_PLIVO_AUTH_TOKEN
PLIVO_FROM_NUMBER=YOUR_PLIVO_PLONE_NUMBER_IN_E164_FORMAT
ASSOCIATE_NUMBER=DESTINATION_NUMBER_FOR_LIVE_ASSOCIATE_E164
AUDIO_URL=https://s3.amazonaws.com/plivocloud/music.mp3
PORT=3000
ANSWER_URL=https://<your-public-domain-or-ngrok-url>/answer
```

- **PLIVO_FROM_NUMBER**: Your Plivo number, e.g. `+14155550123`
- **ASSOCIATE_NUMBER**: The number to forward calls to when the caller presses 2 at Level 2. Can be your mobile or a placeholder test number.
- **AUDIO_URL**: Public MP3 URL. You can use Plivo’s sample or your own.
- **ANSWER_URL**: Publicly accessible URL that points to the `/answer` endpoint of this app. If you use `ngrok` with port 3000, and `ngrok` gives you `https://abc123.ngrok.io`, set:

```bash
ANSWER_URL=https://abc123.ngrok.io/answer
```

---

## Running the Application

1. **Start the server**

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

2. **Expose your local server to the internet**

In a separate terminal:

```bash
ngrok http 3000
```

Copy the HTTPS URL from `ngrok` (e.g. `https://abc123.ngrok.io`) and update `ANSWER_URL` in your `.env` file accordingly.

Restart the Node server if you changed environment variables.

---

## Endpoints and Call Flow

### 1. Initiate an Outbound Call

- **Endpoint**: `POST /make-call`
- **Body (JSON)**:

```json
{
  "to": "+1XXXXXXXXXX"
}
```

Where `"to"` is the target phone number to call in E.164 format.

If configured correctly, Plivo will:
- Make an outbound call from `PLIVO_FROM_NUMBER` to `to`
- On answer, request `ANSWER_URL` (your `/answer` endpoint)

### 2. Level 1 – Language Selection (`/answer`)

- When the call is answered, Plivo hits:
  - **Endpoint**: `POST /answer`
  - **Response**: Plivo XML that:
    - Welcomes the caller
    - Prompts:  
      - Press 1 for English  
      - Press 2 for Spanish
    - Uses `GetInput` to capture DTMF and POST to `/ivr/language`

### 3. Handle Language Selection (`/ivr/language`)

- **Endpoint**: `POST /ivr/language`
- **Behavior**:
  - If digit = `1` → `lang=en`
  - If digit = `2` → `lang=es`
  - On valid selection, responds with a second `GetInput`:
    - English:  
      - Press 1 to hear a short message  
      - Press 2 to speak to a live associate
    - Spanish:  
      - Oprima 1 para escuchar un mensaje  
      - Oprima 2 para hablar con un representante
  - Invalid digit → Repeats the language selection menu.

### 4. Level 2 – Menu Actions (`/ivr/menu`)

- **Endpoint**: `POST /ivr/menu?lang=en|es`
- **Behavior**:
  - Digit = `1`:
    - Speaks a brief prompt in the chosen language
    - Plays `AUDIO_URL` using Plivo `<Play>`
  - Digit = `2`:
    - Dials `ASSOCIATE_NUMBER` using `<Dial><Number>`
  - Invalid digit:
    - Re-prompts the same Level 2 menu (English or Spanish) using `GetInput`.

---

## Web Interface

A simple web interface is available at `http://localhost:3000` when the server is running. Simply:

1. Open your browser and navigate to `http://localhost:3000`
2. Enter a phone number in E.164 format (e.g., `+1234567890`)
3. Click "Make Call" to initiate the outbound call

The interface provides real-time feedback on call initiation status.

## Alternative: Manual API Trigger

The `/make-call` endpoint can also be called directly via API:

**Windows PowerShell:**
```powershell
curl -Method POST http://localhost:3000/make-call `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "to": "+1XXXXXXXXXX" }'
```

**macOS/Linux:**
```bash
curl -X POST http://localhost:3000/make-call \
  -H "Content-Type: application/json" \
  -d '{ "to": "+1XXXXXXXXXX" }'
```

You can also use Postman or any REST client to trigger the call.

---

## How to Demo (for your video)

1. **Show code overview**
   - Show `src/index.js` for:
     - `/make-call`
     - `/answer`
     - `/ivr/language`
     - `/ivr/menu`
2. **Start backend & `ngrok`**
   - Run `npm start`
   - Run `ngrok http 3000` and copy the URL to `.env` (`ANSWER_URL`)
3. **Trigger outbound call**
   - Option A: Open `http://localhost:3000` in your browser and use the web form
   - Option B: Use `curl` or Postman to `POST /make-call` with your mobile number as `"to"`
4. **Navigate IVR on the phone**
   - Level 1:
     - Press 1 → English, or 2 → Spanish
   - Level 2:
     - Press 1 → hear audio message
     - Press 2 → connect to associate number

Record the above steps in a 3–5 minute screen + phone demo.

---

## Notes

- All branching logic is done via **Plivo XML** using `<GetInput>`, `<Speak>`, `<Play>`, and `<Dial>`.
- For production, you would typically:
  - Persist call state
  - Add logging/monitoring
  - Add retries and better error handling


