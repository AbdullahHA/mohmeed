// Proxies Google Places API (New) Text Search so the API key stays on the
// server (GOOGLE_PLACES_API_KEY secret) and never ships inside the app bundle.
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OurCategory = "restaurant" | "cafe" | "hotel" | "shopping" | "attraction" | "other";

const CATEGORY_BY_PRIMARY_TYPE: Record<string, OurCategory> = {
  restaurant: "restaurant",
  meal_takeaway: "restaurant",
  meal_delivery: "restaurant",
  fast_food_restaurant: "restaurant",
  cafe: "cafe",
  coffee_shop: "cafe",
  bakery: "cafe",
  lodging: "hotel",
  hotel: "hotel",
  resort_hotel: "hotel",
  shopping_mall: "shopping",
  store: "shopping",
  clothing_store: "shopping",
  supermarket: "shopping",
  tourist_attraction: "attraction",
  museum: "attraction",
  park: "attraction",
  amusement_park: "attraction",
  historical_landmark: "attraction",
  art_gallery: "attraction",
};

function toOurCategory(primaryType?: string): OurCategory {
  if (!primaryType) return "other";
  return CATEGORY_BY_PRIMARY_TYPE[primaryType] ?? "other";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!GOOGLE_API_KEY) {
    return new Response(JSON.stringify({ error: "places_search_not_configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { query, lat, lng } = await req.json();

    if (typeof query !== "string" || !query.trim()) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Record<string, unknown> = {
      textQuery: query.trim(),
      languageCode: "ar",
      regionCode: "SA",
    };

    if (typeof lat === "number" && typeof lng === "number") {
      body.locationBias = {
        circle: { center: { latitude: lat, longitude: lng }, radius: 15000 },
      };
    }

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.primaryType,places.location",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("places-search upstream error:", response.status, await response.text());
      return new Response(JSON.stringify({ error: "places_search_failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const places = Array.isArray(data.places) ? data.places : [];

    const results = places
      .filter((p: any) => p?.id && p?.displayName?.text)
      .map((p: any) => ({
        id: p.id as string,
        name: p.displayName.text as string,
        address: (p.formattedAddress as string) ?? "",
        category: toOurCategory(p.primaryType),
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
      }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("places-search error:", error);
    return new Response(JSON.stringify({ error: "places_search_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
