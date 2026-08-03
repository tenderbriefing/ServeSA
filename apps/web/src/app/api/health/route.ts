export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      ui: "servesa-web",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}
