import { expect, test } from '@playwright/test'

test('authenticated campus routes redirect unauthenticated visitors to sign in', async ({ request }) => {
  const response = await request.get('/feed', { maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(response.headers().location).toContain('/auth/sign-in')
})

test('public Passport URLs are public routes and return a clean not-found for unknown handles', async ({ request }) => {
  const response = await request.get('/u/qampus_route_test_unknown')
  expect(response.status()).toBe(404)
})

test('anchor indexing rejects cross-site requests before requiring a session', async ({ request }) => {
  const response = await request.post('/api/anchor/index', { data: { postId: '00000000-0000-0000-0000-000000000001', txHash: `0x${'1'.repeat(64)}` } })
  expect(response.status()).toBe(403)
})

test('moderation queue is protected by the authenticated campus layout', async ({ request }) => {
  const response = await request.get('/moderation', { maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(response.headers().location).toContain('/auth/sign-in')
})

test('AI verifier requires an authenticated user', async ({ request }) => {
  const response = await request.post('/api/verifier', { data: { postId: '00000000-0000-4000-8000-000000000001' } })
  expect(response.status()).toBe(401)
})

test('baseline response security headers are present', async ({ request }) => {
  const response = await request.get('/')
  const headers = response.headers()
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('SAMEORIGIN')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['content-security-policy-report-only']).toContain("default-src 'self'")
})
