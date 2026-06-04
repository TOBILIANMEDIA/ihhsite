const PAYSTACK_BASE = "https://api.paystack.co"

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY)
}

export async function paystackInit(params: {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  })
  const json = await res.json()
  if (!json.status) throw new Error(json.message || "Paystack init failed")
  return json.data as { authorization_url: string; access_code: string; reference: string }
}

export async function paystackVerify(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const json = await res.json()
  if (!json.status) throw new Error(json.message || "Paystack verify failed")
  return json.data as { status: string; amount: number; reference: string }
}
