# 📞 Plivo IVR Assignment – Node.js

This repository contains a **multi-level IVR (Interactive Voice Response) system**
built as part of a **Plivo Voice API assignment** using **Node.js** and **Express**.

The application demonstrates how to:
- Initiate outbound calls using Plivo
- Handle call webhooks using Plivo XML
- Collect DTMF input
- Route calls based on user input
- Expose local services securely using ngrok

---

## 🎯 Assignment Objective

To design and implement a **Plivo-based IVR system** that:
- Initiates outbound calls
- Plays voice prompts
- Accepts user input via keypad (DTMF)
- Routes calls to different actions based on input

---

## 🚀 Features Implemented

- Outbound call initiation using Plivo REST API
- Webhook handling via `/answer` endpoint
- Multi-level IVR using Plivo XML
- Language selection (English / Spanish)
- Audio playback option
- Live associate call transfer option
- Retry handling for invalid inputs
- Secure configuration using environment variables

---

## 🛠 Technology Stack

- **Node.js**
- **Express.js**
- **Plivo Node SDK**
- **Plivo XML**
- **ngrok**
- **dotenv**

---

## 📁 Project Structure
Plivo_Assignment_1/
│
├── src/
│ └── index.js # Main IVR logic and webhook handling
│
├── public/
│ └── index.html # UI to trigger outbound calls
│
├── .gitignore
├── package.json
├── README.md
