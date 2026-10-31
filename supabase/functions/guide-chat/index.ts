import Anthropic from "npm:@anthropic-ai/sdk@0.69.0";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DestinationContext = {
  name: string;
  whyVisit?: string;
  topHotels?: string[];
  topRestaurants?: string[];
  bestMonths?: number[];
};

function buildSystemPrompt(destinations: DestinationContext[]): string {
  const destinationsContext = destinations
    .map((d) => {
      const hotels = (d.topHotels ?? []).join("، ");
      const restaurants = (d.topRestaurants ?? []).join("، ");
      return `- ${d.name}: ${d.whyVisit ?? ""} أفضل الفنادق: ${hotels || "غير متوفر"}. أفضل المطاعم: ${restaurants || "غير متوفر"}.`;
    })
    .join("\n");

  return `أنت "دليل السفر"، مساعد سفر ودود داخل تطبيق "يلا نسافر" الموجّه للمسافرين السعوديين. ترد دائمًا بالعربية بأسلوب ودود ومباشر، وبإجابات مختصرة (لا تتجاوز 4-5 جمل عادة). لا تخترع أسماء فنادق أو مطاعم أو أسعار غير موجودة في البيانات أدناه؛ إذا سُئلت عن وجهة أو معلومة غير مذكورة، قل بصراحة إنك لا تملك معلومات دقيقة عنها بدلاً من التخمين.

الوجهات المتوفرة حاليًا في التطبيق:
${destinationsContext || "لا توجد وجهات مسجلة حاليًا."}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, destinations } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicMessages = messages
      .filter((m: any) => m && typeof m.content === "string" && m.content.trim())
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content as string,
      }));

    const response = await anthropic.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 1024,
      system: buildSystemPrompt(Array.isArray(destinations) ? destinations : []),
      messages: anthropicMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && "text" in textBlock ? textBlock.text : "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("guide-chat error:", error);
    return new Response(JSON.stringify({ error: "guide_chat_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
