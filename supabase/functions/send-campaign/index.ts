// Sends an email to every row in the `subscribers` table via Resend.
// Trigger with: POST, header `x-trigger-secret: <CAMPAIGN_TRIGGER_SECRET>`,
// JSON body { "subject": "...", "html": "..." }
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const trigger = req.headers.get('x-trigger-secret');
  if (trigger !== Deno.env.get('CAMPAIGN_TRIGGER_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { subject, html } = await req.json();
  if (!subject || !html) {
    return new Response('Missing subject or html', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const listRes = await fetch(`${supabaseUrl}/rest/v1/subscribers?select=email`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  if (!listRes.ok) {
    return new Response(JSON.stringify({ error: await listRes.text() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const subscribers: { email: string }[] = await listRes.json();

  const resendKey = Deno.env.get('RESEND_API_KEY')!;
  let sent = 0;
  let failed = 0;

  for (const { email } of subscribers ?? []) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'resolve.directory <onboarding@resend.dev>',
        to: email,
        subject,
        html
      })
    });
    if (res.ok) sent++; else failed++;
  }

  return new Response(
    JSON.stringify({ total: subscribers?.length ?? 0, sent, failed }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
