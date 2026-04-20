const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "bookings";
const BOOKINGS_ADMIN_KEY = process.env.BOOKINGS_ADMIN_KEY || "";

function buildCorsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Key",
    "Cache-Control": "no-store",
  };
}

function createRequestUrl(request, fallbackOrigin) {
  const host = request.headers.host || new URL(fallbackOrigin).host;
  const protocol =
    request.headers["x-forwarded-proto"] ||
    (fallbackOrigin.startsWith("https") ? "https" : "http");

  return new URL(request.url || "/", `${protocol}://${host}`);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, buildCorsHeaders());

  response.end(JSON.stringify(payload));
}

function sendOptions(response) {
  response.writeHead(204, buildCorsHeaders());
  response.end();
}

function isOpaqueSupabaseKey(key) {
  return typeof key === "string" && key.startsWith("sb_");
}

function looksLikeMalformedOpaqueKey(key) {
  if (!isOpaqueSupabaseKey(key)) return false;

  // Official opaque key format:
  // sb_secret_<22-char-random>_<8-char-checksum>
  // sb_publishable_<22-char-random>_<8-char-checksum>
  return !/^sb_(secret|publishable)_[A-Za-z0-9]{22}_[A-Za-z0-9]{8}$/.test(key);
}

function createSupabaseFetch(supabaseKey) {
  return async (input, init = {}) => {
    const headers = new Headers(init.headers || {});

    // Keep the apikey header, but avoid sending an opaque key as a fake JWT
    // when the client falls back to Authorization: Bearer <apikey>.
    if (isOpaqueSupabaseKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

function getSupabase() {
  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (looksLikeMalformedOpaqueKey(SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error(
      "Supabase secret key looks malformed. Copy the full key again from API Keys and paste it into .env."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateReference() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CDM-${yyyy}${mm}${dd}-${rand}`;
}

function normalizeBooking(input) {
  const booking = {
    name: String(input.name || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    phone: String(input.phone || "").trim(),
    date: String(input.date || "").trim(),
    time: String(input.time || "").trim(),
    guests: Number(input.guests),
    notes: String(input.notes || "").trim(),
    language: String(input.language || "en").trim().toLowerCase() || "en",
    source: String(input.source || "website").trim() || "website",
  };

  if (!booking.name) throw new Error("Name is required");
  if (!booking.email || !isValidEmail(booking.email)) throw new Error("Valid email is required");
  if (!booking.phone) throw new Error("Phone is required");
  if (!booking.date) throw new Error("Date is required");
  if (!booking.time) throw new Error("Time is required");
  if (!Number.isInteger(booking.guests) || booking.guests < 1 || booking.guests > 12) {
    throw new Error("Guests must be between 1 and 12");
  }

  return booking;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });

    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    request.on("error", (error) => {
      reject(error);
    });
  });
}

async function createBooking(payload) {
  const booking = normalizeBooking(payload);
  const supabase = getSupabase();

  const row = {
    reference: generateReference(),
    source: booking.source,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    booking_date: booking.date,
    booking_time: booking.time,
    guests: booking.guests,
    notes: booking.notes || "",
    language: booking.language || "en",
  };

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .insert([row])
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create booking");
  }

  return data;
}

async function listBookings() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load bookings");
  }

  return data || [];
}

function isAuthorized(request) {
  if (!BOOKINGS_ADMIN_KEY) return true;

  const authHeader = request.headers.authorization || "";
  const legacyHeader = String(request.headers["x-admin-key"] || "").trim();
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  let queryToken = "";
  try {
    const url = new URL(request.url || "/", "http://localhost");
    queryToken = url.searchParams.get("key") || "";
  } catch (error) {
    queryToken = "";
  }

  return (
    bearerToken === BOOKINGS_ADMIN_KEY ||
    legacyHeader === BOOKINGS_ADMIN_KEY ||
    queryToken === BOOKINGS_ADMIN_KEY
  );
}

async function handleBookingsApi(request, response) {
  try {
    if (request.method === "OPTIONS") {
      sendOptions(response);
      return;
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const booking = await createBooking(body);

      sendJson(response, 201, {
        ok: true,
        booking,
        storage: "supabase",
        feedUrl: "/api/bookings",
      });
      return;
    }

    if (request.method === "GET") {
      if (!isAuthorized(request)) {
        sendJson(response, 401, {
          ok: false,
          error: "Invalid API key",
        });
        return;
      }

      const bookings = await listBookings();

      sendJson(response, 200, {
        ok: true,
        count: bookings.length,
        generatedAt: new Date().toISOString(),
        storage: "supabase",
        bookings,
      });
      return;
    }

    sendJson(response, 405, {
      ok: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Bookings API error:", error);

    sendJson(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function ensureBookingsStore() {
  const supabase = getSupabase();

  const { error } = await supabase.from(SUPABASE_TABLE).select("id").limit(1);

  if (error) {
    throw new Error(error.message || "Could not connect to bookings table");
  }

  return true;
}

module.exports = {
  ensureBookingsStore,
  handleBookingsApi,
  createRequestUrl,
};
