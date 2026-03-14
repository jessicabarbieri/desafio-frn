import type { ServiceContext } from '@vtex/api'

import type { Clients } from '../clients'

const DATA_ENTITY = 'PR'

type ProductReportBody = {
  clientName?: string
  email?: string
  phone?: string
  orderId?: string
  invoiceNumber?: string
  skuId?: string
  ean?: string
  productName?: string
  message?: string
  image?: string
}

type Context = ServiceContext<Clients>

function readRawBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function getBody(ctx: Context): Promise<ProductReportBody | null> {
  const req = ctx.request as { body?: ProductReportBody } | undefined
  if (req?.body != null && typeof req.body === 'object') {
    return req.body as ProductReportBody
  }
  const raw = await readRawBody(ctx.req)
  if (!raw || !raw.trim()) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === 'object' && parsed !== null ? (parsed as ProductReportBody) : null
  } catch {
    return null
  }
}

export async function productReport(ctx: Context, next: () => Promise<void>) {
  const body = await getBody(ctx)
  if (!body || typeof body !== 'object') {
    ctx.status = 400
    ctx.body = { error: 'Invalid or missing JSON body' }
    await next()
    return
  }

  const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!clientName || !email || !message) {
    ctx.status = 400
    ctx.body = { error: 'Missing required fields: clientName, email, message' }
    await next()
    return
  }

  const emailRegex = /\S+@\S+\.\S+/
  if (!emailRegex.test(email)) {
    ctx.status = 400
    ctx.body = { error: 'Invalid email format' }
    await next()
    return
  }

  const fields: Record<string, string | undefined> = {
    clientName,
    email,
    message,
    phone: typeof body.phone === 'string' ? body.phone.trim() || undefined : undefined,
    orderId: typeof body.orderId === 'string' ? body.orderId.trim() || undefined : undefined,
    invoiceNumber: typeof body.invoiceNumber === 'string' ? body.invoiceNumber.trim() || undefined : undefined,
    skuId: typeof body.skuId === 'string' ? body.skuId.trim() || undefined : undefined,
    ean: typeof body.ean === 'string' ? body.ean.trim() || undefined : undefined,
    productName: typeof body.productName === 'string' ? body.productName.trim() || undefined : undefined,
    image: typeof body.image === 'string' ? body.image || undefined : undefined,
  }

  try {
    const result = await ctx.clients.md.createDocument({
      dataEntity: DATA_ENTITY,
      fields: fields as Record<string, unknown>,
    })

    const id = result?.DocumentId ?? (result as { Id?: string })?.Id ?? (result as { id?: string })?.id ?? null
    if (!id) {
      ctx.status = 500
      ctx.body = { error: 'Master Data did not return document id' }
      await next()
      return
    }

    ctx.status = 201
    ctx.body = { id }
  } catch (err) {
    ctx.status = 500
    ctx.body = { error: err instanceof Error ? err.message : 'Failed to create document' }
  }

  await next()
}
