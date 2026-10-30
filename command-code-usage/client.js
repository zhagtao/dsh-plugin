/**
 * dsh-command-code-usage — Client half.
 *
 * A bottom-right GOAT plan card. It renders into `shell.overlay` (the layout's
 * full-frame overlay layer) and reads the owner-only Host route through the
 * page's authenticated cookie. No secret is read here.
 */

window.__ModuleLoader__.load({
  id: 'dsh-command-code-usage',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'command-code-usage'
    const ENDPOINT = '/api/command-code/usage'
    const AUTO_REFRESH_MS = 2 * 60 * 1000
    const STORAGE_KEY = 'dsh.command-code-usage.expanded'

    const LOCALES = {
      en: {
        'widget.fiveHour': '5h',
        'widget.weekly': 'Week',
        'widget.plan': 'Plan',
        'widget.status': 'Status',
        'widget.monthlyCredits': 'Monthly credits',
        'widget.extraCredits': 'Extra credits',
        'widget.usageLimits': 'Rolling limits',
        'widget.renews': 'Renews',
        'widget.left': 'left',
        'widget.of': 'of',
        'widget.updated': 'Updated {time}',
        'widget.resetsIn': 'resets in {time}',
        'widget.resetting': 'resetting now',
        'widget.retry': 'Retry',
        'widget.refresh': 'Refresh usage',
        'widget.openStudio': 'Open Studio',
        'widget.collapse': 'Collapse usage card',
        'widget.expand': 'Expand usage card',
        'widget.limited': 'Limit reached',
        'widget.active': 'active',
        'widget.inactive': 'inactive',
        'widget.loading': 'Reading usage…',
        'widget.errorMissingKey': 'Add COMMAND_CODE_API_KEY in Settings → Models, then retry.',
        'widget.errorInvalidKey': 'Command Code rejected the API key.',
        'widget.errorRateLimited': 'Command Code is rate limiting requests. Try again shortly.',
        'widget.errorNetwork': 'Could not reach Command Code.',
        'widget.errorTimeout': 'Command Code did not answer in time.',
        'widget.errorUpstream': 'Command Code returned an unusable response.',
        'widget.partial': 'Subscription details unavailable.',
      },
      zh: {
        'widget.fiveHour': '5 小时',
        'widget.weekly': '每周',
        'widget.plan': '套餐',
        'widget.status': '状态',
        'widget.monthlyCredits': '月度额度',
        'widget.extraCredits': '额外额度',
        'widget.usageLimits': '滚动限额',
        'widget.renews': '续费',
        'widget.left': '剩余',
        'widget.of': '共',
        'widget.updated': '{time} 更新',
        'widget.resetsIn': '{time} 后重置',
        'widget.resetting': '正在重置',
        'widget.retry': '重试',
        'widget.refresh': '刷新用量',
        'widget.openStudio': '打开 Studio',
        'widget.collapse': '收起用量卡片',
        'widget.expand': '展开用量卡片',
        'widget.limited': '已达限额',
        'widget.active': '生效中',
        'widget.inactive': '未生效',
        'widget.loading': '正在读取用量…',
        'widget.errorMissingKey': '请先在「设置 → 模型」中配置 COMMAND_CODE_API_KEY，然后重试。',
        'widget.errorInvalidKey': 'Command Code 拒绝了该 API Key。',
        'widget.errorRateLimited': 'Command Code 正在限流，请稍后重试。',
        'widget.errorNetwork': '无法连接 Command Code。',
        'widget.errorTimeout': 'Command Code 响应超时。',
        'widget.errorUpstream': 'Command Code 返回了无法解析的数据。',
        'widget.partial': '订阅详情暂不可用。',
      },
    }

    const CSS = `
.ccu-root{position:absolute;right:18px;bottom:18px;z-index:30;width:264px;max-width:calc(100vw - 32px);font-size:12px;line-height:1.45;color:var(--dsw-alias-label-primary);pointer-events:auto;font-family:inherit;text-align:left}
.ccu-card{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 94%,transparent);box-shadow:0 10px 30px #00000024;backdrop-filter:blur(14px) saturate(1.2);transition:width .18s ease}
.ccu-root[data-expanded=true]{width:300px;max-width:calc(100vw - 32px)}
.ccu-header{display:flex;align-items:center;gap:8px;width:100%;padding:9px 10px 8px;border:0;border-radius:14px 14px 0 0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.ccu-header:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ccu-header:focus-visible{outline:2px solid var(--dsw-alias-label-primary-bluish);outline-offset:-2px}
.ccu-mark{flex:none;display:block;color:var(--dsw-alias-label-primary-bluish)}
.ccu-heading{display:flex;flex-direction:column;min-width:0;flex:1}
.ccu-plan{font-size:12.5px;font-weight:650;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccu-sub{font-size:10px;color:var(--dsw-alias-label-tertiary);line-height:1.25}
.ccu-dot{width:6px;height:6px;flex:none;border-radius:50%;background:var(--dsw-alias-label-tertiary);margin-left:auto}
.ccu-dot[data-tone=active]{background:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 18%,transparent)}
.ccu-dot[data-tone=warn]{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-warn-primary) 18%,transparent)}
.ccu-dot[data-tone=error]{background:var(--dsw-alias-state-error-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-error-primary) 18%,transparent)}
.ccu-chevron{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-tertiary);transition:transform .18s ease}
.ccu-root[data-expanded=true] .ccu-chevron{transform:rotate(180deg)}
.ccu-body{padding:0 10px 8px}
.ccu-meter{display:flex;align-items:center;gap:7px;margin-top:5px}
.ccu-meter-label{width:30px;flex:none;font-size:10px;letter-spacing:.03em;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.ccu-meter-label:empty{display:none}
.ccu-track{height:4px;flex:1;overflow:hidden;border-radius:999px;background:var(--dsw-alias-border-l2)}
.ccu-fill{height:100%;border-radius:999px;transition:width .35s ease}
.ccu-meter-pct{width:34px;flex:none;text-align:right;font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
.ccu-foot{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 10px 8px;border-top:1px solid var(--dsw-alias-separator-primary)}
.ccu-credits{font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap}
.ccu-dim{color:var(--dsw-alias-label-tertiary)}
.ccu-clock{font-size:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-variant-numeric:tabular-nums}
.ccu-details{padding:8px 10px 9px;border-top:1px solid var(--dsw-alias-separator-primary)}
.ccu-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:5px}
.ccu-row:first-child{margin-top:0}
.ccu-row-label{color:var(--dsw-alias-label-tertiary);font-size:10.5px;white-space:nowrap}
.ccu-row-value{font-size:11px;font-variant-numeric:tabular-nums;text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ccu-section{margin-top:9px;padding-top:7px;border-top:1px dashed var(--dsw-alias-separator-primary)}
.ccu-section-title{font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);margin-bottom:2px}
.ccu-reset{margin:1px 0 0 37px;font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.ccu-actions{display:flex;align-items:center;gap:6px;margin-top:9px;padding-top:8px;border-top:1px solid var(--dsw-alias-separator-primary)}
.ccu-action{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10.5px;cursor:pointer;text-decoration:none;white-space:nowrap}
.ccu-action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ccu-action:focus-visible{outline:2px solid var(--dsw-alias-label-primary-bluish);outline-offset:1px}
.ccu-action[disabled]{opacity:.5;cursor:default}
.ccu-action-primary{margin-left:auto;border-color:transparent;color:var(--dsw-alias-label-primary-bluish)}
.ccu-error{margin:2px 0 0;color:var(--dsw-alias-state-error-primary);font-size:10.5px;line-height:1.4}
.ccu-warn{margin:6px 0 0;color:var(--dsw-alias-state-warn-primary);font-size:10px;line-height:1.35}
.ccu-loading{display:flex;flex-direction:column;gap:7px;padding-bottom:10px}
.ccu-skeleton{height:4px;border-radius:999px;background:linear-gradient(90deg,var(--dsw-alias-border-l2),var(--dsw-alias-border-l1),var(--dsw-alias-border-l2));background-size:200% 100%;animation:ccu-shimmer 1.4s ease-in-out infinite}
.ccu-skeleton-wide{width:100%}.ccu-skeleton-mid{width:72%}.ccu-skeleton-short{width:44%}
@keyframes ccu-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
@media (prefers-reduced-motion:reduce){.ccu-skeleton{animation:none}.ccu-card,.ccu-fill,.ccu-chevron{transition:none}}
@media (max-width:720px){.ccu-root{right:10px;bottom:10px;width:238px}.ccu-root[data-expanded=true]{width:calc(100vw - 20px)}}
`

    function readExpanded() {
      try {
        return window.localStorage.getItem(STORAGE_KEY) === '1'
      } catch {
        return false
      }
    }

    function writeExpanded(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
      } catch {
        // Private browsing or a locked-down storage policy: keep the state in React.
      }
    }

    function money(value) {
      return `$${Number(value || 0).toFixed(2)}`
    }

    function percentText(value) {
      return `${Math.round(Number(value || 0))}%`
    }

    function toneFor(percent) {
      if (percent >= 85) return 'error'
      if (percent >= 65) return 'warn'
      return 'business'
    }

    function colorFor(percent) {
      if (percent >= 85) return 'var(--dsw-alias-state-error-primary)'
      if (percent >= 65) return 'var(--dsw-alias-state-warn-primary)'
      return 'var(--dsw-alias-state-business-primary)'
    }

    function duration(ms) {
      const minutes = Math.max(1, Math.ceil(ms / 60000))
      if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440)
        const hours = Math.floor((minutes % 1440) / 60)
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`
      }
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
      }
      return `${minutes}m`
    }

    function resetText(resetAt, now, t) {
      if (!resetAt) return null
      const remaining = resetAt - now
      if (remaining <= 0) return t('widget.resetting')
      return t('widget.resetsIn', { time: duration(remaining) })
    }

    function clock(ts) {
      if (!ts) return ''
      try {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch {
        return ''
      }
    }

    function dateText(value) {
      if (!value) return '—'
      try {
        return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
      } catch {
        return '—'
      }
    }

    function GoatMark({ size = 24 }) {
      return h(
        'svg',
        {
          className: 'ccu-mark',
          viewBox: '0 0 32 32',
          width: size,
          height: size,
          'aria-hidden': true,
          focusable: 'false',
        },
        h('path', {
          d: 'M11 10.5C9.4 7.9 6.8 6.4 4.2 7.2c1 3.2 3.1 5.2 6.2 5.7',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M21 10.5c1.6-2.6 4.2-4.1 6.8-3.3-1 3.2-3.1 5.2-6.2 5.7',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M10.4 12.1c0 7.3 2.5 11.7 5.6 11.7s5.6-4.4 5.6-11.7c0-2.5-2.5-4.1-5.6-4.1s-5.6 1.6-5.6 4.1Z',
          fill: 'currentColor',
          opacity: 0.16,
        }),
        h('path', {
          d: 'M10.4 12.1c0 7.3 2.5 11.7 5.6 11.7s5.6-4.4 5.6-11.7c0-2.5-2.5-4.1-5.6-4.1s-5.6 1.6-5.6 4.1Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinejoin: 'round',
        }),
        h('circle', { cx: 13.3, cy: 13.4, r: 1.05, fill: 'currentColor' }),
        h('circle', { cx: 18.7, cy: 13.4, r: 1.05, fill: 'currentColor' }),
        h('path', {
          d: 'M16 21v3.4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
        }),
      )
    }

    function Meter({ label, windowLimit, now, t, full }) {
      if (!windowLimit) return null
      const percent = Number(windowLimit.percent || 0)
      const fill = colorFor(percent)
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'ccu-meter' },
          h('span', { className: 'ccu-meter-label' }, label),
          h(
            'span',
            { className: 'ccu-track' },
            h('span', {
              className: 'ccu-fill',
              style: {
                width: `${Math.min(100, Math.max(percent > 0 ? 1.5 : 0, percent))}%`,
                background: fill,
              },
            }),
          ),
          h('span', { className: 'ccu-meter-pct', style: { color: fill } }, percentText(percent)),
        ),
        full
          ? h(
              'div',
              { className: 'ccu-reset' },
              `${windowLimit.used.toFixed(2)} / ${windowLimit.cap.toFixed(2)}`,
              resetText(windowLimit.resetAt, now, t)
                ? ` · ${resetText(windowLimit.resetAt, now, t)}`
                : '',
            )
          : null,
      )
    }

    function UsageWidget({ t }) {
      const [expanded, setExpanded] = React.useState(readExpanded)
      const [state, setState] = React.useState({
        phase: 'loading',
        data: null,
        error: null,
        refreshing: false,
        updatedAt: 0,
      })
      const [now, setNow] = React.useState(() => Date.now())
      const alive = React.useRef(true)
      const lastLoaded = React.useRef(0)

      const load = React.useCallback(async (force) => {
        setState((previous) => ({ ...previous, refreshing: true }))
        try {
          const response = await fetch(force ? `${ENDPOINT}?refresh=1` : ENDPOINT, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { accept: 'application/json' },
          })
          const body = await response.json().catch(() => null)
          if (!alive.current) return
          if (!response.ok || !body || body.ok !== true) {
            const code =
              body?.error?.code ??
              (response.status === 401 ? 'missing_key' : 'upstream_error')
            setState((previous) =>
              previous.data
                ? { ...previous, refreshing: false, error: code }
                : {
                    phase: 'error',
                    data: null,
                    error: code,
                    refreshing: false,
                    updatedAt: 0,
                  },
            )
            return
          }
          lastLoaded.current = Date.now()
          setState({
            phase: 'ready',
            data: body,
            error: null,
            refreshing: false,
            updatedAt: body.fetchedAt || Date.now(),
          })
        } catch {
          if (!alive.current) return
          setState((previous) =>
            previous.data
              ? { ...previous, refreshing: false, error: 'network' }
              : {
                  phase: 'error',
                  data: null,
                  error: 'network',
                  refreshing: false,
                  updatedAt: 0,
                },
          )
        }
      }, [])

      React.useEffect(() => {
        alive.current = true
        load(false)
        const refreshTimer = window.setInterval(() => load(false), AUTO_REFRESH_MS)
        const clockTimer = window.setInterval(() => setNow(Date.now()), 30000)
        const onVisibility = () => {
          if (document.visibilityState === 'visible' && Date.now() - lastLoaded.current > 60000) {
            load(false)
          }
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
          alive.current = false
          window.clearInterval(refreshTimer)
          window.clearInterval(clockTimer)
          document.removeEventListener('visibilitychange', onVisibility)
        }
      }, [load]) // eslint-disable-line react-hooks/exhaustive-deps

      React.useEffect(() => {
        if (!expanded) return undefined
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setExpanded(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [expanded])

      const toggle = () => {
        setExpanded((value) => {
          const next = !value
          writeExpanded(next)
          return next
        })
      }

      const data = state.data
      const planName = data?.plan?.name || 'Command Code'
      const planStatus = data?.plan?.status
      const fiveHour = data?.limits?.fiveHour ?? null
      const weekly = data?.limits?.weekly ?? null
      // `windowLimits.limited` means the plan has rolling windows at all; only
      // `exceeded` means one of them is actually spent.
      const limitReached = fiveHour?.exceeded === true || weekly?.exceeded === true
      const worstPercent = Math.max(fiveHour?.percent ?? 0, weekly?.percent ?? 0)
      const worst =
        worstPercent >= 85
          ? 'error'
          : worstPercent >= 65
            ? 'warn'
            : state.phase === 'error'
              ? 'error'
              : 'active'
      const statusTone = state.phase === 'error' ? 'error' : state.error ? 'warn' : worst
      const remaining = data?.credits?.totalRemaining ?? data?.credits?.monthlyRemaining
      const monthlyTotal = data?.credits?.monthlyTotal
      const monthlyPercent = data?.credits?.monthlyPercent
      const extra =
        (data?.credits?.purchasedRemaining ?? 0) + (data?.credits?.freeRemaining ?? 0)
      const partial = Array.isArray(data?.warnings) && data.warnings.includes('subscription_unavailable')
      const errorKey = {
        missing_key: 'widget.errorMissingKey',
        invalid_key: 'widget.errorInvalidKey',
        rate_limited: 'widget.errorRateLimited',
        network: 'widget.errorNetwork',
        timeout: 'widget.errorTimeout',
        upstream_error: 'widget.errorUpstream',
        unexpected_error: 'widget.errorUpstream',
      }[state.error]

      const statusLabel =
        planStatus === 'active'
          ? t('widget.active')
          : planStatus
            ? planStatus
            : state.phase === 'loading'
              ? t('widget.loading')
              : '—'

      return h(
        'div',
        { className: 'ccu-root', 'data-expanded': expanded ? 'true' : 'false' },
        h('style', null, CSS),
        h(
          'section',
          {
            className: 'ccu-card',
            'aria-label': t('widget.plan'),
          },
          h(
            'button',
            {
              type: 'button',
              className: 'ccu-header',
              onClick: toggle,
              'aria-expanded': expanded,
              'aria-controls': 'ccu-details',
              title: expanded ? t('widget.collapse') : t('widget.expand'),
            },
            h(GoatMark, null),
            h(
              'span',
              { className: 'ccu-heading' },
              h('span', { className: 'ccu-plan' }, planName),
              h(
                'span',
                { className: 'ccu-sub' },
                limitReached ? t('widget.limited') : `Command Code · ${statusLabel}`,
              ),
            ),
            h('span', {
              className: 'ccu-dot',
              'data-tone': statusTone,
              title: limitReached ? t('widget.limited') : statusLabel,
            }),
            h(
              'svg',
              {
                className: 'ccu-chevron',
                viewBox: '0 0 12 12',
                width: 12,
                height: 12,
                'aria-hidden': true,
              },
              h('path', {
                d: 'M2.5 4.5 6 8l3.5-3.5',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }),
            ),
          ),
          state.phase === 'loading'
            ? h(
                'div',
                { className: 'ccu-body ccu-loading' },
                h('span', { className: 'ccu-skeleton ccu-skeleton-wide' }),
                h('span', { className: 'ccu-skeleton ccu-skeleton-mid' }),
                h('span', { className: 'ccu-skeleton ccu-skeleton-short' }),
              )
            : state.phase === 'error'
              ? h(
                  'div',
                  { className: 'ccu-body' },
                  h('div', { className: 'ccu-error' }, t(errorKey || 'widget.errorUpstream')),
                  h(
                    'div',
                    { className: 'ccu-actions' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'ccu-action',
                        onClick: () => load(true),
                        disabled: state.refreshing,
                      },
                      t('widget.retry'),
                    ),
                  ),
                )
              : h(
                  React.Fragment,
                  null,
                  h(
                    'div',
                    { className: 'ccu-body' },
                    h(Meter, {
                      label: t('widget.fiveHour'),
                      windowLimit: fiveHour,
                      now,
                      t,
                    }),
                    h(Meter, {
                      label: t('widget.weekly'),
                      windowLimit: weekly,
                      now,
                      t,
                    }),
                  ),
                  h(
                    'div',
                    { className: 'ccu-foot' },
                    h(
                      'span',
                      { className: 'ccu-credits' },
                      money(remaining),
                      h('span', { className: 'ccu-dim' }, ` ${t('widget.left')}`),
                    ),
                    h(
                      'span',
                      { className: 'ccu-clock' },
                      t('widget.updated', { time: clock(state.updatedAt) || '—' }),
                    ),
                  ),
                  expanded
                    ? h(
                        'div',
                        { className: 'ccu-details', id: 'ccu-details' },
                        h(
                          'div',
                          { className: 'ccu-row' },
                          h('span', { className: 'ccu-row-label' }, t('widget.plan')),
                          h(
                            'span',
                            { className: 'ccu-row-value' },
                            `${planName}${planStatus ? ` · ${statusLabel}` : ''}`,
                          ),
                        ),
                        h(
                          'div',
                          { className: 'ccu-row' },
                          h('span', { className: 'ccu-row-label' }, t('widget.monthlyCredits')),
                          h(
                            'span',
                            { className: 'ccu-row-value' },
                            monthlyTotal === null
                              ? money(data.credits.monthlyRemaining)
                              : `${money(data.credits.monthlyRemaining)} ${t('widget.of')} ${money(monthlyTotal)}`,
                          ),
                        ),
                        monthlyPercent !== null
                          ? h(Meter, {
                              label: '',
                              windowLimit: {
                                used: data.credits.monthlyUsed,
                                cap: monthlyTotal,
                                percent: monthlyPercent,
                                resetAt: data.plan.currentPeriodEnd
                                  ? Date.parse(data.plan.currentPeriodEnd)
                                  : null,
                              },
                              now,
                              t,
                            })
                          : null,
                        fiveHour || weekly
                          ? h(
                              'div',
                              { className: 'ccu-section' },
                              h('div', { className: 'ccu-section-title' }, t('widget.usageLimits')),
                              h(Meter, {
                                label: t('widget.fiveHour'),
                                windowLimit: fiveHour,
                                now,
                                t,
                                full: true,
                              }),
                              h(Meter, {
                                label: t('widget.weekly'),
                                windowLimit: weekly,
                                now,
                                t,
                                full: true,
                              }),
                            )
                          : null,
                        extra > 0
                          ? h(
                              'div',
                              { className: 'ccu-row', style: { marginTop: 8 } },
                              h(
                                'span',
                                { className: 'ccu-row-label' },
                                t('widget.extraCredits'),
                              ),
                              h('span', { className: 'ccu-row-value' }, money(extra)),
                            )
                          : null,
                        data.plan.currentPeriodEnd
                          ? h(
                              'div',
                              { className: 'ccu-row' },
                              h('span', { className: 'ccu-row-label' }, t('widget.renews')),
                              h(
                                'span',
                                { className: 'ccu-row-value' },
                                dateText(data.plan.currentPeriodEnd),
                              ),
                            )
                          : null,
                        partial
                          ? h('p', { className: 'ccu-warn' }, t('widget.partial'))
                          : null,
                        state.error
                          ? h(
                              'p',
                              { className: 'ccu-warn' },
                              t(errorKey || 'widget.errorUpstream'),
                            )
                          : null,
                        h(
                          'div',
                          { className: 'ccu-actions' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'ccu-action',
                              onClick: () => load(true),
                              disabled: state.refreshing,
                              title: t('widget.refresh'),
                            },
                            t('widget.refresh'),
                          ),
                          h(
                            'a',
                            {
                              className: 'ccu-action ccu-action-primary',
                              href: 'https://commandcode.ai/usage',
                              target: '_blank',
                              rel: 'noreferrer noopener',
                            },
                            t('widget.openStudio'),
                          ),
                        ),
                      )
                    : null,
                ),
        ),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NS, LOCALES),
          'command-code-usage: labels',
        )
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'command-code-usage',
              order: 60,
              locale: NS,
            },
            UsageWidget,
          ),
        )
      },
    }
  },
})
