// دليل السفر: يسأل Claude ويرجع خطة JSON بنفس شكل GuidePlan في التطبيق.
// الأسرار المطلوبة: ANTHROPIC_API_KEY (supabase secrets set ANTHROPIC_API_KEY=...)
import Anthropic from 'npm:@anthropic-ai/sdk';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk/helpers/zod';
import { z } from 'npm:zod';
import { createClient } from 'npm:@supabase/supabase-js@2';

const Plan = z.object({
  text: z.string().describe('رد قصير بالعامية السعودية، جملة أو جملتين'),
  plan: z
    .object({
      cityId: z.string(),
      intro: z.string(),
      days: z.array(z.object({ title: z.string(), placeIds: z.array(z.string()), notes: z.array(z.string()) })),
    })
    .nullable()
    .describe('null لو السؤال مو طلب خطة'),
});

const SYSTEM = `أنت «دليل السفر» في تطبيق يلا نسافر، لمسافرين سعوديين وخليجيين.
اكتب بالعامية السعودية المهذبة، باختصار ووضوح.
لما يطلب المستخدم خطة: اختر الأماكن من قائمة الأماكن المرفقة فقط (بالـ id)، 2 إلى 4 أماكن في اليوم، ورتبها منطقياً (صباح، غداء، عصر/عشاء).
راعِ اهتمامات المستخدم وميزانيته ونوع رحلته وقيوده الغذائية. أضف ملاحظة قصيرة لو مكان يحتاج حجز مسبق أو أفضل وقت له محدد.
التطبيق ما يحجز ولا يستلم فلوس، فلا تعرض حجز.`;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { question, profile, previousPlan } = await req.json();
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const [{ data: cities }, { data: places }] = await Promise.all([
      sb.from('cities').select('id,name,country').eq('deleted', false),
      sb.from('places').select('id,name,category,city_id,kind,price_level,rating,amenities,best_time').eq('deleted', false).limit(400),
    ]);
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low', format: zodOutputFormat(Plan) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ question, profile, previousPlan, cities, places }),
        },
      ],
    });
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return Response.json({ text: 'ما قدرت أجاوب على هذا. جرّب تسألني عن وجهة أو خطة رحلة.', plan: null }, { headers: cors });
    }
    return Response.json(response.parsed_output, { headers: cors });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'guide_failed' }, { status: 500, headers: cors });
  }
});
