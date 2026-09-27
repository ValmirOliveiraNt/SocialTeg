interface Env {
  DB: D1Database
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host === '::1' || host.endsWith('.local')) return true
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true
  const match = host.match(/^172\.(\d+)\./)
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31)
}

function dataImageResponse(source: string) {
  const match = source.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=]+)$/i)
  if (!match) return new Response('Imagem inválida', { status: 415 })
  const binary = atob(match[2])
  if (binary.length > MAX_IMAGE_BYTES) return new Response('Imagem muito grande', { status: 413 })
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new Response(bytes, { headers: { 'Content-Type': match[1], 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } })
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestUrl = new URL(context.request.url)
  const businessId = requestUrl.searchParams.get('id')?.trim()
  const kind = requestUrl.searchParams.get('kind') === 'cover' ? 'cover_url' : 'logo_url'
  if (!businessId) return new Response('Estabelecimento não informado', { status: 400 })

  const business = await context.env.DB
    .prepare(`SELECT ${kind} AS image_url FROM businesses WHERE id = ?`)
    .bind(businessId)
    .first<{ image_url: string | null }>()
  const source = business?.image_url?.trim()
  if (!source) return new Response('Imagem não encontrada', { status: 404 })
  if (source.startsWith('data:image/')) return dataImageResponse(source)

  let imageUrl: URL
  try {
    imageUrl = new URL(source)
  } catch {
    return new Response('Endereço de imagem inválido', { status: 400 })
  }
  if (!['http:', 'https:'].includes(imageUrl.protocol) || isPrivateHost(imageUrl.hostname)) {
    return new Response('Endereço de imagem não permitido', { status: 400 })
  }

  let currentUrl = imageUrl
  let upstream: Response | null = null
  for (let redirectCount = 0; redirectCount < 4; redirectCount += 1) {
    upstream = await fetch(currentUrl.toString(), {
      redirect: 'manual',
      headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8' },
    })
    if (![301, 302, 303, 307, 308].includes(upstream.status)) break
    const location = upstream.headers.get('Location')
    if (!location) break
    const redirectedUrl = new URL(location, currentUrl)
    if (!['http:', 'https:'].includes(redirectedUrl.protocol) || isPrivateHost(redirectedUrl.hostname)) {
      return new Response('Redirecionamento de imagem não permitido', { status: 400 })
    }
    currentUrl = redirectedUrl
  }
  if (!upstream) return new Response('Não foi possível carregar a imagem', { status: 502 })
  if (!upstream.ok) return new Response('Não foi possível carregar a imagem', { status: 502 })
  const contentType = upstream.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() || ''
  if (!contentType.startsWith('image/')) return new Response('O endereço não retornou uma imagem', { status: 415 })
  const declaredSize = Number(upstream.headers.get('Content-Length') || 0)
  if (declaredSize > MAX_IMAGE_BYTES) return new Response('Imagem muito grande', { status: 413 })
  const image = await upstream.arrayBuffer()
  if (image.byteLength > MAX_IMAGE_BYTES) return new Response('Imagem muito grande', { status: 413 })

  return new Response(image, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
