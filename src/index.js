const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const plivo = require("plivo");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Public base URL (ngrok)
if (!process.env.ANSWER_URL) {
  console.error("❌ ANSWER_URL is missing in .env");
  process.exit(1);
}
const BASE_URL = process.env.ANSWER_URL.replace("/answer", "");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static UI
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

/**
 * =========================================================
 * OUTBOUND CALL INITIATION
 * POST /make-call
 * =========================================================
 */
app.post("/make-call", async (req, res) => {
  const toNumber = req.body.to;
  const fromNumber = process.env.PLIVO_FROM_NUMBER;
  const answerUrl = process.env.ANSWER_URL;

  if (!toNumber) {
    return res.status(400).json({ error: "Missing 'to' phone number" });
  }

  if (!fromNumber) {
    return res.status(500).json({ error: "PLIVO_FROM_NUMBER not set" });
  }

  const client = new plivo.Client(
    process.env.PLIVO_AUTH_ID,
    process.env.PLIVO_AUTH_TOKEN
  );

  try {
    const response = await client.calls.create(
      fromNumber,
      toNumber,
      answerUrl,
      { answerMethod: "POST" }
    );

    return res.json({
      message: "Call initiated",
      callUuid: response.requestUuid || response.request_uuid,
    });
  } catch (err) {
    // 🔴 IMPORTANT: Full Plivo error logging
    console.error("\n========== PLIVO CALL ERROR ==========");
    console.error("Message:", err.message);
    console.error("Status:", err.status);
    console.error("Status Text:", err.statusText);
    console.error("API ID:", err.apiID);
    console.error("More Info:", err.moreInfo);
    console.error("=====================================\n");

    return res.status(500).json({
      error: "Call failed",
      plivoMessage: err.message,
      status: err.status,
      statusText: err.statusText,
      details: err.moreInfo,
    });
  }
});

/**
 * =========================================================
 * ANSWER WEBHOOK (GET + POST)
 * =========================================================
 */
app.all("/answer", (req, res) => {
  console.log("\n=== /answer HIT ===");

  const response = new plivo.Response();

  const getInput = response.addGetInput({
    action: `${BASE_URL}/ivr/language`,
    method: "POST",
    inputType: "dtmf",
    numDigits: 1,
    digitEndTimeout: 10,
    redirect: true,
  });

  getInput.addSpeak(
    "Welcome to InspireWorks demo IVR. " +
      "For English, press 1. " +
      "Para español, oprima el dos."
  );

  response.addSpeak("No input received. Goodbye.");

  const xml = response.toXML();
  console.log(xml);

  res.type("text/xml");
  res.send(xml);
});

/**
 * =========================================================
 * LANGUAGE SELECTION
 * =========================================================
 */
app.post("/ivr/language", (req, res) => {
  console.log("\n=== /ivr/language HIT ===");
  console.log(req.body);

  const digit = req.body.Digits;
  const response = new plivo.Response();

  let lang = null;
  if (digit === "1") lang = "en";
  if (digit === "2") lang = "es";

  if (!lang) {
    const retry = response.addGetInput({
      action: `${BASE_URL}/ivr/language`,
      method: "POST",
      inputType: "dtmf",
      numDigits: 1,
      redirect: true,
    });

    retry.addSpeak("Invalid input. Press 1 for English. Press 2 for Spanish.");
    return res.type("text/xml").send(response.toXML());
  }

  const menu = response.addGetInput({
    action: `${BASE_URL}/ivr/menu?lang=${lang}`,
    method: "POST",
    inputType: "dtmf",
    numDigits: 1,
    redirect: true,
  });

  if (lang === "en") {
    menu.addSpeak(
      "You selected English. Press 1 to hear a message. Press 2 to talk to an associate."
    );
  } else {
    menu.addSpeak(
      "Usted seleccionó español. Oprima uno para escuchar un mensaje. Oprima dos para hablar con un representante."
    );
  }

  res.type("text/xml").send(response.toXML());
});

/**
 * =========================================================
 * LEVEL 2 MENU
 * =========================================================
 */
app.post("/ivr/menu", (req, res) => {
  console.log("\n=== /ivr/menu HIT ===");
  console.log(req.body, req.query);

  const digit = req.body.Digits;
  const lang = req.query.lang || "en";
  const response = new plivo.Response();

  const associate = process.env.ASSOCIATE_NUMBER;
  const audio =
    process.env.AUDIO_URL ||
    "https://s3.amazonaws.com/plivocloud/music.mp3";

  if (digit === "1") {
    response.addSpeak(
      lang === "en"
        ? "Please listen to this message."
        : "Por favor escuche este mensaje."
    );
    response.addPlay(audio);
  } else if (digit === "2") {
    if (associate) {
      const dial = response.addDial();
      dial.addNumber(associate);
    } else {
      response.addSpeak(
        lang === "en"
          ? "No associate available. Goodbye."
          : "No hay representantes disponibles. Adiós."
      );
    }
  } else {
    const retry = response.addGetInput({
      action: `${BASE_URL}/ivr/menu?lang=${lang}`,
      method: "POST",
      inputType: "dtmf",
      numDigits: 1,
      redirect: true,
    });

    retry.addSpeak(
      lang === "en"
        ? "Invalid input. Press 1 or 2."
        : "Entrada inválida. Oprima uno o dos."
    );
  }

  res.type("text/xml").send(response.toXML());
});

/**
 * =========================================================
 * START SERVER
 * =========================================================
 */
app.listen(port, () => {
  console.log("\n=======================================");
  console.log(`Plivo IVR Server running`);
  console.log(`Local : http://localhost:${port}`);
  console.log(`Public: ${process.env.ANSWER_URL}`);
  console.log("=======================================\n");
});
