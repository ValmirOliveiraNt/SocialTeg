interface ViaCepResponse {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

const json = (data: unknown, status = 200, cacheControl = 'no-store') =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    },
  })

export const onRequestGet: PagesFunction = async (context) => {
  const requestUrl = new URL(context.request.url)
  const cep = (requestUrl.searchParams.get('cep') || '').replace(/\D/g, '')

  if (cep.length !== 8) {
    return json({ error: 'Informe um CEP válido com 8 números.' }, 400)
  }

  try {
    const upstream = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { Accept: 'application/json' },
    })

    if (!upstream.ok) {
      return json({ error: 'O serviço de CEP está temporariamente indisponível.' }, 502)
    }

    const result = (await upstream.json()) as ViaCepResponse
    if (result.erro === true || result.erro === 'true') {
      return json({ error: 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.' }, 404)
    }

    return json(
      {
        cep: result.cep || cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
        street: result.logradouro?.trim() || '',
        complement: result.complemento?.trim() || '',
        neighborhood: result.bairro?.trim() || '',
        city: result.localidade?.trim() || '',
        state: result.uf?.trim().toUpperCase() || '',
      },
      200,
      'public, max-age=86400'
    )
  } catch {
    return json({ error: 'Não foi possível consultar o CEP agora. Preencha o endereço manualmente.' }, 502)
  }
}
