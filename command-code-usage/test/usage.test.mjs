/**
 * Live verification for the Host half. Reads COMMAND_CODE_API_KEY from the
 * environment or the local DSH credential file, then exercises both
 * `collectUsage` and the registered `/api/command-code/usage` route.
 *
 * Run: node test/usage.test.mjs
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply, collectUsage } from '../index.js'

function localKey() {
  if (process.env.COMMAND_CODE_API_KEY) return process.env.COMMAND_CODE_API_KEY.trim()
  const file = path.join(os.homedir(), '.dsh', '.credentials.yaml')
  const text = fs.readFileSync(file, 'utf8')
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*COMMAND_CODE_API_KEY:\s*(.+?)\s*$/)
    if (match) return match[1].replace(/^['"]|['"]$/g, '')
  }
  throw new Error('COMMAND_CODE_API_KEY is not configured')
}

function offlineKey() {
  return 'test-key-that-command-code-rejects'
}

function stubContext(key) {
  let fetchRoute = null
  const ctx = {
    connection: {
      fetch: {
        register(route) {
          fetchRoute = route
        },
      },
    },
    credentials: {
      async resolve() {
        return key === undefined ? undefined : { value: key }
      },
    },
    effect(fn) {
      return fn()
    },
  }
  return { ctx, route: () => fetchRoute }
}

function useRoute(key) {
  const { ctx, route } = stubContext(key)
  apply(ctx)
  assert.equal(route().path, '/api/command-code/usage')
  assert.deepEqual(route().methods, ['GET'])
  return route()
}

async function main() {
  const key = localKey()

  console.log('1) collectUsage with the configured key')
  const usage = await collectUsage({ apiKey: key })
  assert.equal(usage.ok, true)
  assert.ok(['GOAT', 'Go', 'Pro', 'Max', 'Ultra', 'Teams Pro', 'Provider', 'Command Code'].includes(usage.plan.name))
  assert.ok(Number.isFinite(usage.credits.monthlyRemaining))
  assert.ok(Number.isFinite(usage.credits.totalRemaining))
  assert.ok(usage.limits.fiveHour === null || usage.limits.fiveHour.cap >= 0)
  assert.ok(usage.limits.weekly === null || usage.limits.weekly.cap >= 0)
  if (usage.plan.id === 'individual-goat') {
    assert.equal(usage.plan.name, 'GOAT')
    assert.equal(usage.credits.monthlyTotal, 70)
    assert.ok(usage.credits.monthlyRemaining <= 70)
    assert.ok(usage.limits.fiveHour.cap === 14)
    assert.ok(usage.limits.weekly.cap === 35)
  }
  console.log(
    `   ${usage.plan.name} · credits ${usage.credits.monthlyRemaining.toFixed(2)} / ${usage.credits.monthlyTotal ?? '?'} · ` +
      `5h ${usage.limits.fiveHour?.percent ?? '-'}% · week ${usage.limits.weekly?.percent ?? '-'}%`,
  )

  console.log('2) authenticated route returns the same shape')
  const route = useRoute(key)
  const response = await route.fetch(new Request('http://127.0.0.1/api/command-code/usage?refresh=1'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json()
  assert.equal(body.ok, true)
  assert.equal(body.plan.name, usage.plan.name)
  assert.equal(body.credits.monthlyRemaining, usage.credits.monthlyRemaining)

  console.log('3) missing credential produces a typed 401')
  const original = process.env.COMMAND_CODE_API_KEY
  delete process.env.COMMAND_CODE_API_KEY
  try {
    const missingRoute = useRoute(undefined)
    const missing = await missingRoute.fetch(
      new Request('http://127.0.0.1/api/command-code/usage?refresh=1'),
    )
    assert.equal(missing.status, 401)
    const failure = await missing.json()
    assert.equal(failure.ok, false)
    assert.equal(failure.error.code, 'missing_key')
  } finally {
    if (original !== undefined) process.env.COMMAND_CODE_API_KEY = original
  }

  console.log('4) rejected key produces a typed 401/upstream failure')
  const badRoute = useRoute(offlineKey())
  const rejected = await badRoute.fetch(
    new Request('http://127.0.0.1/api/command-code/usage?refresh=1'),
  )
  assert.ok([401, 429, 502].includes(rejected.status))
  const rejectedBody = await rejected.json()
  assert.equal(rejectedBody.ok, false)
  assert.ok(typeof rejectedBody.error.code === 'string')

  console.log('\nAll host checks passed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
