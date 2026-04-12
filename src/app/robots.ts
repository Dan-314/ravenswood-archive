import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ravenswoodarchive.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/profile',
        '/api/',
        '/favourites',
        '/preferences',
        '/submit',
        '/login',
        '/signup',
        '/confirm-email',
        '/scripts/*/edit',
        '/scripts/*/customise',
        '/competitions/create',
        '/competitions/*/manage',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
