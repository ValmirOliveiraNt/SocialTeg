interface ImageConversionOptions {
  maxWidth: number
  maxHeight: number
  quality?: number
  maxDataLength?: number
}

export async function imageFileToDataUrl(
  file: File,
  { maxWidth, maxHeight, quality = 0.86, maxDataLength = 650_000 }: ImageConversionOptions
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem válido.')
  if (file.size > 8 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 8 MB.')

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Não foi possível abrir esta imagem. Tente PNG, JPG ou WebP.'))
      element.src = objectUrl
    })

    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Seu navegador não conseguiu processar a imagem.')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    let currentQuality = quality
    let result = canvas.toDataURL('image/webp', currentQuality)
    while (result.length > maxDataLength && currentQuality > 0.45) {
      currentQuality -= 0.1
      result = canvas.toDataURL('image/webp', currentQuality)
    }
    if (result.length > maxDataLength) throw new Error('A imagem ainda ficou muito grande. Escolha um arquivo menor.')
    return result
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
