// Canonical URL utilities
export function cleanUrl(url: string): string {
  const urlObj = new URL(url);

  const trackingParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
    'msclkid',
    'twclid',
    'ref',
    'source',
    'campaign',
  ];

  trackingParams.forEach((param) => urlObj.searchParams.delete(param));
  return urlObj.toString();
}

