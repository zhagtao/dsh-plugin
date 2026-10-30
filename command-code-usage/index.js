/**
 * dsh-command-code-usage — Host half.
 *
 * Reads the Command Code GOAT plan usage with the same API key the
 * `command-code` provider uses, and exposes one owner-only route for the
 * browser widget:
 *
 *   GET /api/command-code/usage[?refresh=1]
 *
 * The key never reaches the page. The route is registered through the Host
 * Connection service, which authenticates the browser cookie and restricts
 * exact routes to the owner Peer.
 */

const DEFAULT_BASE_URL = 'https://api.commandcode.ai'
const KEY_REF = 'COMMAND_CODE_API_KEY'
const CACHE_TTL_MS = 30_000
const REQUEST_TIMEOUT_MS = 15_000
const ROUTE_PATH = '/api/command-code/usage'

/**
 * Monthly credit pools published by the Command Code CLI (`getPlanTotalCredits`).
 * Only the plan name and pool size are used; the API remains authoritative for
 * remaining credits and rolling-window caps.
 */
const PLANS = {
  'individual-go': { name: 'Go', monthlyCredits: 10 },
  'individual-goat': { name: 'GOAT', monthlyCredits: 70 },
  'individual-pro': { name: 'Pro', monthlyCredits: 30 },
  'individual-pro-v1': { name: 'Pro', monthlyCredits: 80 },
  'individual-max': { name: 'Max', monthlyCredits: 150 },
  'individual-ultra': { name: 'Ultra', monthlyCredits: 300 },
  'individual-provider': { name: 'Provider', monthlyCredits: 15 },
  'teams-pro': { name: 'Teams Pro', monthlyCredits: 40 },
}

class UsageError extends Error {
  constructor(code, message, status = 502) {
    super(message)
    this.name = 'UsageError'
    this.code = code
    this.status = status
  }
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function round(value, digits = 2) {
  const scale = 10 ** digits
  return Math.round((value + Number.EPSILON) * scale) / scale
}

function planFor(planId) {
  if (typeof planId !== 'string' || planId.length === 0) return null
  const normalized = planId.toLowerCase().replaceAll('_', '-')
  // Longest prefix first: `individual-goat` must beat `individual-go`.
  const keys = Object.keys(PLANS).sort((left, right) => right.length - left.length)
  for (const key of keys) {
    if (normalized.startsWith(key)) return { id: planId, ...PLANS[key] }
  }
  return { id: planId, name: planId, monthlyCredits: null }
}

function normalizeWindow(raw) {
  if (raw === null || typeof raw !== 'object') return null
  const used = round(Math.max(0, finite(raw.used)))
  const cap = round(Math.max(0, finite(raw.cap)))
  return {
    used,
    cap,
    percent: cap > 0 ? round(Math.min(100, (used / cap) * 100), 1) : 0,
    resetAt: Number.isFinite(raw.resetAt) ? raw.resetAt : null,
    exceeded: raw.exceeded === true,
  }
}

function normalizeUsage({ creditsBody, subscriptionBody, now }) {
  const credits = creditsBody?.credits ?? {}
  const windowLimits = creditsBody?.windowLimits ?? null
  const subscription = subscriptionBody?.data ?? null
  const plan = planFor(subscription?.planId)

  const monthlyRemaining = round(Math.max(0, finite(credits.monthlyCredits)))
  const purchasedRemaining = round(Math.max(0, finite(credits.purchasedCredits)))
  const freeRemaining = round(Math.max(0, finite(credits.freeCredits)))
  const totalRemaining = round(monthlyRemaining + purchasedRemaining + freeRemaining)
  const monthlyTotal = plan?.monthlyCredits ?? null
  const monthlyUsed = monthlyTotal === null ? null : round(Math.max(0, monthlyTotal - monthlyRemaining))
  const monthlyPercent =
    monthlyTotal !== null && monthlyTotal > 0
      ? round(Math.min(100, ((monthlyTotal - monthlyRemaining) / monthlyTotal) * 100), 1)
      : null

  return {
    ok: true,
    fetchedAt: now,
    source: DEFAULT_BASE_URL,
    plan: {
      id: plan?.id ?? null,
      name: plan?.name ?? 'Command Code',
      status: typeof subscription?.status === 'string' ? subscription.status : null,
      currentPeriodStart: subscription?.currentPeriodStart ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    },
    credits: {
      monthlyRemaining,
      monthlyTotal,
      monthlyUsed,
      monthlyPercent,
      purchasedRemaining,
      freeRemaining,
      totalRemaining,
      belowThreshold: credits.belowThreshold === true,
    },
    limits: {
      limited: windowLimits?.limited === true,
      fiveHour: normalizeWindow(windowLimits?.fiveHour),
      weekly: normalizeWindow(windowLimits?.weekly),
    },
    sandbox: {
      access: creditsBody?.sandboxAccess === true,
      usedMinutes: finite(creditsBody?.sandboxMinutes?.usedMinutes),
      limitMinutes: finite(creditsBody?.sandboxMinutes?.limitMinutes),
    },
  }
}

async function commandCodeGet(pathname, apiKey, baseUrl, signal) {
  const response = await fetch(new URL(pathname, baseUrl), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    signal,
  })

  if (response.status === 401 || response.status === 403) {
    throw new UsageError('invalid_key', 'Command Code rejected the API key.', 401)
  }
  if (response.status === 429) {
    throw new UsageError('rate_limited', 'Command Code is rate limiting usage requests.', 429)
  }
  if (!response.ok) {
    throw new UsageError('upstream_error', `Command Code returned HTTP ${response.status}.`)
  }

  try {
    return await response.json()
  } catch {
    throw new UsageError('upstream_error', 'Command Code returned an unreadable response.')
  }
}

let cache = null

/**
 * Collect the two billing documents and normalize them for the widget.
 * Exported so the local test can exercise it without booting a profile.
 */
export async function collectUsage({ apiKey, baseUrl = DEFAULT_BASE_URL, now = Date.now() }) {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const [credits, subscription] = await Promise.allSettled([
    commandCodeGet('/alpha/billing/credits', apiKey, baseUrl, signal),
    commandCodeGet('/alpha/billing/subscriptions', apiKey, baseUrl, signal),
  ])

  if (credits.status === 'rejected') throw credits.reason
  if (credits.value?.credits === undefined) {
    throw new UsageError('upstream_error', 'Command Code returned no credit information.')
  }

  const subscriptionBody = subscription.status === 'fulfilled' ? subscription.value : null
  const payload = normalizeUsage({
    creditsBody: credits.value,
    subscriptionBody,
    now,
  })

  // A missing subscription document is not fatal: credits still drive the
  // meters, and the widget simply cannot print a plan name or renewal date.
  if (subscription.status === 'rejected') {
    payload.warnings = ['subscription_unavailable']
  }

  return payload
}

async function resolveApiKey(ctx) {
  let stored = null
  try {
    const hit = await ctx.credentials.resolve(KEY_REF)
    stored = hit?.value ?? null
  } catch {
    // A credentials provider failure falls back to the inherited environment,
    // the same precedence the LLM provider documents for its own key.
  }
  const apiKey = stored || process.env[KEY_REF] || ''
  if (apiKey.trim().length === 0) {
    throw new UsageError(
      'missing_key',
      `No ${KEY_REF} credential is configured for Command Code.`,
      401,
    )
  }
  return apiKey.trim()
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

async function handleRequest(ctx, request) {
  const url = new URL(request.url)
  const refresh = url.searchParams.get('refresh') === '1'
  if (!refresh && cache !== null && Date.now() - cache.at < CACHE_TTL_MS) {
    return json(200, cache.payload)
  }

  try {
    const apiKey = await resolveApiKey(ctx)
    const payload = await collectUsage({ apiKey })
    cache = { at: Date.now(), payload }
    return json(200, payload)
  } catch (error) {
    const known = error instanceof UsageError
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
    const unreachable = error?.name === 'TypeError'
    const code = known
      ? error.code
      : timedOut
        ? 'timeout'
        : unreachable
          ? 'network'
          : 'unexpected_error'
    const status = known ? error.status : timedOut ? 504 : 502
    const message = known
      ? error.message
      : timedOut
        ? 'Command Code did not answer in time.'
        : unreachable
          ? 'Could not reach Command Code.'
          : 'Could not read Command Code usage.'
    return json(status, { ok: false, error: { code, message } })
  }
}

export const name = 'command-code-usage'
export const inject = ['connection', 'credentials']

export function apply(ctx) {
  ctx.connection.fetch.register({
    path: ROUTE_PATH,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: (request) => handleRequest(ctx, request),
  })

  // Drop a cached document when the plugin unloads so a remount cannot show
  // a stale plan after the credential or account changed.
  ctx.effect(() => () => {
    cache = null
  }, 'command-code-usage: cache')
}
