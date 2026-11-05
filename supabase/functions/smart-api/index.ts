import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid_session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();
    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "not_admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, profileIds } = await req.json();
    if (!title?.trim() || !body?.trim()) {
      return new Response(JSON.stringify({ error: "missing_title_or_body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // profileIds narrows delivery to a real audience segment computed by
    // the caller (e.g. "signed up this week", "has a trip") — omit it for
    // the original broadcast-to-everyone behavior.
    let tokenQuery = admin.from("push_tokens").select("expo_push_token");
    if (Array.isArray(profileIds) && profileIds.length > 0) {
      tokenQuery = tokenQuery.in("profile_id", profileIds);
    }
    const { data: tokenRows } = await tokenQuery;
    const tokens = Array.from(new Set((tokenRows ?? []).map((r) => r.expo_push_token).filter(Boolean)));

    let delivered = 0;
    const invalidTokens: string[] = [];

    for (const batch of chunk(tokens, 90)) {
      const messages = batch.map((to) => ({ to, title: title.trim(), body: body.trim(), sound: "default" }));
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const tickets = Array.isArray(json?.data) ? json.data : [];
      tickets.forEach((ticket: any, i: number) => {
        if (ticket.status === "ok") {
          delivered += 1;
        } else if (ticket.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(batch[i]);
        }
      });
    }

    if (invalidTokens.length) {
      await admin.from("push_tokens").delete().in("expo_push_token", invalidTokens);
    }

    return new Response(JSON.stringify({ success: true, attempted: tokens.length, delivered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-notification error:", error);
    return new Response(JSON.stringify({ error: "send_notification_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
