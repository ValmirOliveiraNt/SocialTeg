export function getPublicTagUrl(publicId: string): string {
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))

  const baseUrl = isLocal ? 'https://socialtag.pages.dev' : window.location.origin
  return `${baseUrl}/t/${publicId}`
}
