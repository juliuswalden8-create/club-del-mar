const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");

loadLocalEnv();

const DATA_DIR = path.join(ROOT, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const BOOKINGS_ADMIN_KEY = process.env.BOOKINGS_ADMIN_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "bookings";
const MAX_BODY_SIZE = 1_000_000;

const SELECT_FIELDS = [
  "id",
  "reference",
  "source",
  "name",
  "email",
  "phone",
  "booking_date",
  "booking_time",
  "guests",
  "notes",
  "language",
  "created_at",
].join(",");

let bookingWriteQueue = Promise.resolve();

function loadLocalEnv() {
  const envFiles = [".env", ".env.local"];

  envFiles.forEach((filename) => {
    const filePath = path.join(ROOT, filename);

    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, "utf8");

    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendOptions(response) {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "no-store",
  });
  response.end();
}

async function ensureBookingsStore() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  try {
    await fsp.access(BOOKINGS_FILE);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fsp.writeFile(BOOKINGS_FILE, "[]\n", "utf8");
  }
}

async function readLocalBookings() {
  await ensureBookingsStore();
  const raw = await fsp.readFile(BOOKINGS_FILE, "utf8");

  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLocalBooking(booking) {
  bookingWriteQueue = bookingWriteQueue.catch(() => undefined).then(async () => {
    const bookings = await readLocalBookings();
    bookings.unshift(booking);
    await fsp.writeFile(BOOKINGS_FILE, `${JSON.stringify(bookings, null, 2)}\n`, "utf8");
    return booking;
  });

  return bookingWriteQueue;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    let done = false;

    request.setEncoding("utf8");

    request.on("data", (chunk) => {
      if (done) return;

      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_SIZE) {
        done = true;
        reject(new Error("Request body too large"));
        request.destroy();
        return;
      }

      body += chunk;
    });

    request.on("end", () => {
      if (done) return;
      done = true;
      resolve(body);
    });

    request.on("error", (error) => {
      if (done) return;
      done = true;
      reject(error);
    });
  });
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanNotes(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\r\n/g, "\n").slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const stamp = new Date(`${value}T00:00:00`);
  return !Number.isNaN(stamp.getTime());
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value);
}

function buildReference() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `CDM-${datePart}-${suffix}`;
}

function normalizeBooking(payload) {
  const name = cleanText(payload.name, 120);
  const email = cleanText(payload.email, 160).toLowerCase();
  const phone = cleanText(payload.phone, 40);
  const date = cleanText(payload.date, 10);
  const time = cleanText(payload.time, 5);
  const notes = cleanNotes(payload.notes, 500);
  const guests = Number.parseInt(String(payload.guests || ""), 10);
  const language = ["en", "es", "sv"].includes(payload.language) ? payload.language : "en";

  if (!name || !email || !phone || !date || !time || Number.isNaN(guests)) {
    return { error: "Please fill in all required booking fields." };
  }

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (!isValidDate(date)) {
    return { error: "Please choose a valid booking date." };
  }

  if (!isValidTime(time)) {
    return { error: "Please choose a valid booking time." };
  }

  if (guests < 1 || guests > 12) {
    return { error: "Bookings must be for between 1 and 12 guests." };
  }

  return {
    booking: {
      id: randomUUID(),
      reference: buildReference(),
      source: "website",
      name,
      email,
      phone,
      date,
      time,
      guests,
      notes,
      language,
      createdAt: new Date().toISOString(),
    },
  };
}

function hasAdminAccess(request, requestUrl) {
  if (!BOOKINGS_ADMIN_KEY) return true;

  const headerKey = cleanText(request.headers["x-admin-key"], 200);
  const queryKey = cleanText(requestUrl.searchParams.get("key"), 200);

  return headerKey === BOOKINGS_ADMIN_KEY || queryKey === BOOKINGS_ADMIN_KEY;
}

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseEndpoint() {
  return new URL(`/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`, SUPABASE_URL.endsWith("/") ? SUPABASE_URL : `${SUPABASE_URL}/`);
}

function usesOpaqueSupabaseKey() {
  return SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_");
}

async function callSupabase({ method, searchParams, body, prefer }) {
  const endpoint = getSupabaseEndpoint();

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        endpoint.searchParams.set(key, String(value));
      }
    });
  }

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
  };

  if (!usesOpaqueSupabaseKey()) {
    headers.Authorization = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let payload = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      payload = raw;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? payload.message
        : "Supabase request failed.";
    throw new Error(message);
  }

  return { response, payload };
}

function toSupabaseRow(booking) {
  return {
    id: booking.id,
    reference: booking.reference,
    source: booking.source,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    booking_date: booking.date,
    booking_time: booking.time,
    guests: booking.guests,
    notes: booking.notes,
    language: booking.language,
    created_at: booking.createdAt,
  };
}

function fromSupabaseRow(row) {
  return {
    id: row.id,
    reference: row.reference,
    source: row.source,
    name: row.name,
    email: row.email,
    phone: row.phone,
    date: row.booking_date,
    time: row.booking_time,
    guests: row.guests,
    notes: row.notes || "",
    language: row.language || "en",
    createdAt: row.created_at,
  };
}

async function createBooking(booking) {
  if (!isSupabaseConfigured()) {
    return {
      booking: await saveLocalBooking(booking),
      storage: "local",
    };
  }

  const { payload } = await callSupabase({
    method: "POST",
    body: toSupabaseRow(booking),
    prefer: "return=representation",
  });

  const savedRow = Array.isArray(payload) ? payload[0] : payload;
  return {
    booking: fromSupabaseRow(savedRow),
    storage: "supabase",
  };
}

async function listBookings(limit) {
  if (!isSupabaseConfigured()) {
    const bookings = await readLocalBookings();
    return {
      bookings: bookings.slice(0, limit),
      count: bookings.length,
      storage: "local",
    };
  }

  const { response, payload } = await callSupabase({
    method: "GET",
    searchParams: {
      select: SELECT_FIELDS,
      order: "created_at.desc",
      limit,
    },
    prefer: "count=exact",
  });

  const contentRange = response.headers.get("content-range") || "";
  const countText = contentRange.split("/")[1];
  const count = Number.parseInt(countText || String(Array.isArray(payload) ? payload.length : 0), 10);

  return {
    bookings: Array.isArray(payload) ? payload.map(fromSupabaseRow) : [],
    count: Number.isNaN(count) ? 0 : count,
    storage: "supabase",
  };
}

async function handleBookingsApi(request, response, requestUrl) {
  if (request.method === "OPTIONS") {
    sendOptions(response);
    return;
  }

  if (request.method === "POST") {
    let rawBody = "";

    try {
      rawBody = await readRequestBody(request);
    } catch (error) {
      sendJson(response, 413, { error: "The booking request was too large." });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody || "{}");
    } catch (error) {
      sendJson(response, 400, { error: "Invalid booking payload." });
      return;
    }

    const { booking, error } = normalizeBooking(payload);
    if (error) {
      sendJson(response, 422, { error });
      return;
    }

    try {
      const result = await createBooking(booking);
      sendJson(response, 201, {
        ok: true,
        booking: result.booking,
        feedUrl: "/api/bookings",
        storage: result.storage,
      });
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : "The booking could not be saved.",
      });
    }

    return;
  }

  if (request.method === "GET") {
    if (!hasAdminAccess(request, requestUrl)) {
      sendJson(response, 401, { error: "Admin key required." });
      return;
    }

    const limit = Math.max(
      1,
      Math.min(Number.parseInt(requestUrl.searchParams.get("limit") || "100", 10) || 100, 500)
    );

    try {
      const result = await listBookings(limit);
      sendJson(response, 200, {
        ok: true,
        count: result.count,
        generatedAt: new Date().toISOString(),
        storage: result.storage,
        bookings: result.bookings,
      });
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : "The booking feed could not be loaded.",
      });
    }

    return;
  }

  sendJson(response, 405, { error: "Method not allowed." });
}

function createRequestUrl(request, fallbackOrigin = "http://127.0.0.1:3000") {
  const origin = request.headers?.host ? `http://${request.headers.host}` : fallbackOrigin;
  return new URL(request.url || "/", origin);
}

module.exports = {
  ensureBookingsStore,
  handleBookingsApi,
  createRequestUrl,
};
