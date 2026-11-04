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

  return `أنت "دليل السفر"، مساعد سفر ودود داخل تطبيق "يلا نسافر" الموجّه للمسافرين السعوديين. ترد دائمًا بالعربية بأسلوب ودود ومباشر. لا تخترع أسماء فنادق أو مطاعم أو أسعار غير موجودة في البيانات أدناه؛ إذا سُئلت عن وجهة أو معلومة غير مذكورة، قل بصراحة إنك لا تملك معلومات دقيقة عنها بدلاً من التخمين.

لازم ترد دائمًا باستدعاء أداة "respond". إذا طلب المستخدم خطة أو جدول رحلة لعدة أيام، املأ "days" بكل يوم وأنشطته (نص قصير لكل نشاط، بدون أسعار أو تفاصيل غير مؤكدة). إذا كان السؤال عام (نصيحة، معلومة، مقارنة) بدون طلب خطة أيام، اترك "days" فاضية [] ورد بـ "intro" فقط كفقرة طبيعية مختصرة (3-5 جمل).

الوجهات المتوفرة حاليًا في التطبيق:
${destinationsContext || "لا توجد وجهات مسجلة حاليًا."}`;
}

const RESPOND_TOOL = {
  name: "respond",
  description: "رد دليل السفر على رسالة المستخدم، إما كفقرة نصية أو كخطة أيام منظمة.",
  input_schema: {
    type: "object" as const,
    properties: {
      intro: {
        type: "string",
        description: "الرد النصي الأساسي — فقرة كاملة إذا ما فيه خطة أيام، أو جملة تمهيدية قصيرة قبل الأيام إذا فيه خطة.",
      },
      days: {
        type: "array",
        description: "فاضية [] إذا السؤال ما يحتاج جدول أيام. كل عنصر يوم من خطة رحلة متعددة الأيام.",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "مثال: اليوم 1 · التاريخ" },
            activities: { type: "array", items: { type: "string" }, description: "نشاطات مختصرة، نشاط واحد لكل سطر" },
          },
          required: ["label", "activities"],
        },
      },
    },
    required: ["intro", "days"],
  },
};

function flattenToText(intro: string, days: Array<{ label: string; activities: string[] }>): string {
  if (!days || days.length === 0) return intro;
  const daysText = days
    .map((d) => `${d.label}:\n${(d.activities ?? []).map((a) => `- ${a}`).join("\n")}`)
    .join("\n\n");
  return `${intro}\n\n${daysText}`;
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
      max_tokens: 1536,
      system: buildSystemPrompt(Array.isArray(destinations) ? destinations : []),
      messages: anthropicMessages,
      tools: [RESPOND_TOOL],
      tool_choice: { type: "tool", name: "respond" },
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    const input = toolUse && "input" in toolUse ? (toolUse.input as any) : null;

    const intro = typeof input?.intro === "string" ? input.intro : "";
    const days = Array.isArray(input?.days)
      ? input.days.filter((d: any) => d && typeof d.label === "string" && Array.isArray(d.activities))
      : [];

    const reply = flattenToText(intro, days);

    return new Response(JSON.stringify({ reply, intro, days }), {
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
