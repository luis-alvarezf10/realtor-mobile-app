import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.215.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SYSTEM_PROMPT = `Eres Hunterito, asistente operativo para agentes inmobiliarios.

Tu trabajo no es solo conversar: debes dar indicaciones accionables al asesor inmobiliario usando su contexto.

Capacidades esperadas:
- Revisar agenda del dia y detectar riesgos.
- Recordar citas, horarios, clientes y propiedades.
- Dar recomendaciones de atencion al cliente antes y despues de una cita.
- Si hay clima adverso cerca de una cita, sugiere opciones concretas.
- Estimar escenarios con porcentajes solo como heuristicas internas, sin fingir precision cientifica.
- Ayudar a preparar mensajes, objeciones, argumentos de venta y seguimiento.

Reglas:
- Responde siempre en espanol.
- Se breve, claro y practico.
- Si hay citas hoy, prioriza lo urgente.
- Cuando menciones porcentajes como rechazo, enganche o riesgo, aclara que son estimaciones operativas.
- Si no hay datos suficientes, dilo y sugiere el siguiente paso.
- No inventes citas, clima, propiedades ni clientes.`;

type AppointmentContext = {
  id: string;
  description: string | null;
  client_name: string | null;
  date: string | null;
  time: string | null;
  status: string | null;
  property?: {
    title: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string | null;
  } | null;
  weather?: WeatherContext | null;
};

type WeatherContext = {
  precipitationProbability: number | null;
  precipitation: number | null;
  note: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }

    const { message, history, localDate } = await req.json();

    if (!message || typeof message !== "string") {
      return jsonResponse({ error: "Mensaje requerido" }, 400);
    }

    const today = typeof localDate === "string" ? localDate : new Date().toISOString().slice(0, 10);
    const context = await safeBuildContext(req, today);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: buildContextPrompt(context, today) },
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 750,
        temperature: 0.55,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI error: ${error}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "";

    return jsonResponse({ reply, context });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";
    return jsonResponse({ error: message }, 500);
  }
});

async function buildAdvisorContext(supabase: any, userId: string, today: string) {
  const { data: appointments, error } = await supabase
    .from("schedule")
    .select(`
      id,
      description,
      client_name,
      date,
      time,
      status,
      properties (
        title,
        address,
        latitude,
        longitude,
        status
      )
    `)
    .eq("id_realtor", userId)
    .gte("date", today)
    .lte("date", today)
    .order("time", { ascending: true });

  if (error) {
    console.error("Context schedule error:", error);
    return { todayAppointments: [], weatherWarnings: [] };
  }

  const todayAppointments: AppointmentContext[] = [];

  for (const item of appointments || []) {
    const property = firstRelation(item.properties);
    const appointment: AppointmentContext = {
      id: item.id,
      description: item.description,
      client_name: item.client_name,
      date: item.date,
      time: item.time,
      status: item.status,
      property: property ? {
        title: property.title,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        status: property.status,
      } : null,
      weather: null,
    };

    if (property?.latitude && property?.longitude) {
      appointment.weather = await fetchWeather(property.latitude, property.longitude, item.time);
    }

    todayAppointments.push(appointment);
  }

  const weatherWarnings = todayAppointments
    .filter((appointment) => (appointment.weather?.precipitationProbability || 0) >= 45)
    .map((appointment) => ({
      appointmentId: appointment.id,
      client: appointment.client_name,
      probability: appointment.weather?.precipitationProbability,
      note: appointment.weather?.note,
    }));

  return { todayAppointments, weatherWarnings };
}

async function safeBuildContext(req: Request, today: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Context skipped: Supabase env vars missing");
    return null;
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error("Context skipped: user not authenticated", authError);
      return null;
    }

    return await buildAdvisorContext(supabase, authData.user.id, today);
  } catch (error) {
    console.error("Context skipped:", error);
    return null;
  }
}

async function fetchWeather(latitude: number, longitude: number, time?: string | null): Promise<WeatherContext | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("hourly", "precipitation_probability,precipitation");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    const hours: string[] = data.hourly?.time || [];
    const probabilities: Array<number | null> = data.hourly?.precipitation_probability || [];
    const precipitation: Array<number | null> = data.hourly?.precipitation || [];

    if (!hours.length) return null;

    const targetHour = time ? Number(time.split(":")[0]) : new Date().getHours();
    let bestIndex = 0;
    let bestDistance = Number.MAX_SAFE_INTEGER;

    hours.forEach((hour, index) => {
      const hourValue = Number(hour.slice(11, 13));
      const distance = Math.abs(hourValue - targetHour);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    const probability = probabilities[bestIndex] ?? null;
    const rain = precipitation[bestIndex] ?? null;

    return {
      precipitationProbability: probability,
      precipitation: rain,
      note: probability !== null
        ? `Probabilidad de lluvia cercana a la cita: ${probability}%.`
        : "Sin probabilidad de lluvia disponible.",
    };
  } catch (error) {
    console.error("Weather error:", error);
    return null;
  }
}

function buildContextPrompt(context: any, today: string) {
  if (!context) {
    return `Fecha local del asesor: ${today}. No se pudo cargar contexto autenticado.`;
  }

  return `Fecha local del asesor: ${today}.
Contexto operativo del asesor en JSON:
${JSON.stringify(context, null, 2)}

Instrucciones para usar contexto:
- Si el usuario pide "que hago hoy", "resumen", "recordatorios" o similar, resume citas de hoy.
- Si hay weatherWarnings, explica el riesgo y sugiere opciones.
- Ejemplo de estilo cuando llueve: "Hoy hay 67% de probabilidad de lluvia para la cita de las 3:00 PM. Puedes proponer moverla (riesgo estimado de rechazo 40%) o confirmar y llevar paraguas/plan B (enganche estimado 50%)."
- Las probabilidades de rechazo/enganche deben ser estimaciones operativas basadas en sentido comun, no datos reales medidos.`;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
