export async function callN8nWebhook<T = any>(endpoint: string, body?: any, method: "POST" | "GET" = "POST"): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error("Erro ao comunicar com n8n");
  return res.json();
} 