/**
 * dsh-command-code-usage — Client half.
 *
 * The account menu in the sidebar footer is a single `settings.launcher`
 * occupant owned by DSH, so there is no item-level slot to extend. This client
 * therefore renders headless into `shell.overlay` and attaches one extra
 * section to the already-open account menu (detected by its Settings/Feedback
 * menu items). The section is a React portal into a host node owned by this
 * plugin; it never rewrites the menu items, and the observer and host are
 * removed when the menu closes or the plugin unloads.
 *
 * Usage comes from the owner-only Host route through the page's authenticated
 * cookie. No secret is read here.
 */

window.__ModuleLoader__.load({
  id: 'dsh-command-code-usage',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement

    const NS = 'command-code-usage'
    const ENDPOINT = '/api/command-code/usage'
    const AUTO_REFRESH_MS = 2 * 60 * 1000

    const LOCALES = {
      en: {
        'widget.title': 'Command Code',
        'widget.remainingUsage': 'Remaining usage',
        'widget.menuLabel': 'Command Code usage',
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
        'widget.refresh': 'Refresh',
        'widget.refreshing': 'Refreshing…',
        'widget.openStudio': 'Studio',
        'widget.openStudioTitle': 'Open Command Code Studio',
        'widget.collapse': 'Collapse usage details',
        'widget.expand': 'Expand usage details',
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
        'widget.title': 'Command Code',
        'widget.remainingUsage': '剩余用量',
        'widget.menuLabel': 'Command Code 用量',
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
        'widget.refresh': '刷新',
        'widget.refreshing': '刷新中…',
        'widget.openStudio': 'Studio',
        'widget.openStudioTitle': '打开 Command Code Studio',
        'widget.collapse': '收起用量详情',
        'widget.expand': '展开用量详情',
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
.ccu-menu{display:flex;flex-direction:column;box-sizing:border-box;min-width:0;max-width:calc(100vw - 24px);max-height:min(46vh,380px);margin:0 0 4px;padding:9px 10px 8px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;border-bottom:1px solid var(--dsw-alias-separator-primary);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;line-height:1.45;text-align:left}
.ccu-menu > *{flex:none}
.ccu-head{display:flex;align-items:center;gap:7px;min-width:0;width:100%;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.ccu-head:focus-visible{outline:2px solid var(--dsw-alias-label-primary-bluish);outline-offset:2px}
.ccu-content[hidden]{display:none}
.ccu-mark{flex:none;display:block;color:var(--dsw-alias-label-primary-bluish)}
.ccu-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:650;letter-spacing:.01em}
.ccu-plan{min-width:0;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:1px 6px;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary-bluish) 32%,transparent);border-radius:999px;color:var(--dsw-alias-label-primary-bluish);font-size:10px;font-weight:600;letter-spacing:.02em}
.ccu-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}
.ccu-dot[data-tone=active]{background:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 18%,transparent)}
.ccu-dot[data-tone=warn]{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-warn-primary) 18%,transparent)}
.ccu-dot[data-tone=error]{background:var(--dsw-alias-state-error-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-error-primary) 18%,transparent)}
.ccu-toggle{display:inline-flex;flex:none;align-items:center;justify-content:center;width:22px;height:22px;margin-left:auto;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer}
.ccu-toggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ccu-toggle:focus-visible,.ccu-action:focus-visible{outline:2px solid var(--dsw-alias-label-primary-bluish);outline-offset:1px}
.ccu-toggle[disabled]{cursor:default;opacity:.55}
.ccu-chevron{transition:transform .18s ease}
.ccu-menu[data-expanded=true] .ccu-chevron{transform:rotate(180deg)}
.ccu-metrics{display:flex;flex-direction:column;gap:5px;margin-top:8px}
.ccu-meter{display:flex;align-items:center;gap:7px;min-width:0}
.ccu-meter-label{flex:none;width:36px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:10px;letter-spacing:.02em}
.ccu-meter-label:empty{display:none}
.ccu-track{flex:1;height:4px;min-width:24px;overflow:hidden;border-radius:999px;background:var(--dsw-alias-border-l2)}
.ccu-fill{display:block;height:100%;border-radius:999px;transition:width .3s ease}
.ccu-pct{flex:none;width:34px;text-align:right;color:var(--dsw-alias-label-secondary);font-size:10.5px;font-variant-numeric:tabular-nums}
.ccu-sub{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:6px;color:var(--dsw-alias-label-tertiary);font-size:10px;font-variant-numeric:tabular-nums}
.ccu-sub > span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ccu-details{margin-top:7px;padding-top:7px;border-top:1px dashed var(--dsw-alias-separator-primary)}
.ccu-details[hidden]{display:none}
.ccu-actions + .ccu-details{margin-top:7px;padding-top:0;border-top:0}
.ccu-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:5px}
.ccu-row:first-child{margin-top:0}
.ccu-row-label{flex:none;color:var(--dsw-alias-label-tertiary);font-size:10.5px;white-space:nowrap}
.ccu-row-value{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;font-size:11px;font-variant-numeric:tabular-nums}
.ccu-section{margin-top:8px;padding-top:7px;border-top:1px dashed var(--dsw-alias-separator-primary)}
.ccu-section-title{margin-bottom:3px;color:var(--dsw-alias-label-tertiary);font-size:9.5px;letter-spacing:.04em;text-transform:uppercase}
.ccu-reset{margin:2px 0 0 43px;color:var(--dsw-alias-label-tertiary);font-size:9.5px;font-variant-numeric:tabular-nums}
.ccu-section > div + div{margin-top:7px}
.ccu-section .ccu-meter + .ccu-reset{margin-top:2px}
.ccu-warn{margin:6px 0 0;color:var(--dsw-alias-state-warn-primary);font-size:10px;line-height:1.4}
.ccu-error{margin:8px 0 0;color:var(--dsw-alias-state-error-primary);font-size:10.5px;line-height:1.4}
.ccu-actions{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:8px;padding-top:7px;border-top:1px solid var(--dsw-alias-separator-primary)}
.ccu-updated{margin-right:auto;color:var(--dsw-alias-label-tertiary);font-size:9.5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.ccu-action{display:inline-flex;align-items:center;height:22px;padding:0 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10px;line-height:1;white-space:nowrap;text-decoration:none;cursor:pointer}
.ccu-action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ccu-action[disabled]{cursor:default;opacity:.55}
.ccu-action-primary{border-color:transparent;color:var(--dsw-alias-label-primary-bluish)}
.ccu-loading{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.ccu-skeleton{height:4px;border-radius:999px;background:linear-gradient(90deg,var(--dsw-alias-border-l2),var(--dsw-alias-border-l1),var(--dsw-alias-border-l2));background-size:200% 100%;animation:ccu-shimmer 1.4s ease-in-out infinite}
.ccu-skeleton-wide{width:100%}.ccu-skeleton-mid{width:72%}
@keyframes ccu-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
@media (max-width:480px){.ccu-menu{padding:8px}.ccu-meter-label{width:32px}.ccu-pct{width:30px}.ccu-reset{margin-left:39px}}
@media (max-height:560px){.ccu-menu{max-height:38vh}}
@media (prefers-reduced-motion:reduce){.ccu-fill,.ccu-chevron{transition:none}.ccu-skeleton{animation:none}}
`

    const ACCOUNT_LABELS = {
      settings: ['Settings', '设置'],
      feedback: ['Feedback', '意见反馈'],
      signOut: ['Sign out', '退出登录'],
      signIn: ['Sign in', '登录'],
    }

    function includesLabel(labels, values) {
      // Settings carries its shortcut in the same button's text ("Settings⌘,"),
      // so match a label prefix rather than the whole text content.
      return labels.some((label) =>
        values.some((value) => label === value || label.startsWith(value)),
      )
    }

    /**
     * The DSH account menu has no item slot. Identify it by the Settings and
     * Feedback actions it always contains; session and panel menus have neither.
     */
    function isAccountMenu(menu) {
      const labels = []
      for (const item of menu.querySelectorAll('button[role="menuitem"]')) {
        labels.push((item.textContent || '').trim())
      }
      return (
        includesLabel(labels, ACCOUNT_LABELS.settings) &&
        (includesLabel(labels, ACCOUNT_LABELS.feedback) ||
          includesLabel(labels, ACCOUNT_LABELS.signOut) ||
          includesLabel(labels, ACCOUNT_LABELS.signIn))
      )
    }

    function isVisible(element) {
      if (!element.isConnected) return false
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }

    function findAccountMenu() {
      const menus = []
      for (const menu of document.querySelectorAll('[role="menu"]')) {
        if (isVisible(menu)) menus.push(menu)
      }
      for (let index = menus.length - 1; index >= 0; index -= 1) {
        if (isAccountMenu(menus[index])) return menus[index]
      }

      // Fallback for a reworded menu: match the portalled menu anchored to the
      // "Account menu" trigger. Content matching above is preferred because it
      // cannot attach to an unrelated menu.
      const trigger = document.querySelector(
        'button[aria-label="Account menu"], button[aria-label="账号菜单"]',
      )
      if (!trigger || trigger.getAttribute('aria-expanded') !== 'true') return null
      const anchor = trigger.getBoundingClientRect()
      for (let index = menus.length - 1; index >= 0; index -= 1) {
        const rect = menus[index].getBoundingClientRect()
        if (rect.bottom <= anchor.top + 16 && Math.abs(rect.left - anchor.left) <= 80) {
          return menus[index]
        }
      }
      return null
    }

    function menuViewport(menu) {
      let fallback = null
      for (const child of menu.children) {
        if (child.getAttribute('role') !== 'presentation') continue
        if (child.querySelector('button[role="menuitem"]')) return child
        fallback ??= child
      }
      return fallback ?? menu
    }

    /**
     * Attach a host node to the open account menu's item viewport.
     *
     * @returns the current host, or null when the menu is closed.
     */
    function useAccountMenuHost() {
      const [host, setHost] = React.useState(null)

      React.useEffect(() => {
        if (!document.body) return undefined
        let currentMenu = null
        let currentHost = null
        let menuObserver = null
        let scheduled = false
        let frame = 0
        let disposed = false

        const detach = () => {
          if (menuObserver) {
            menuObserver.disconnect()
            menuObserver = null
          }
          if (currentHost) currentHost.remove()
          currentHost = null
          currentMenu = null
        }

        const sync = () => {
          if (disposed) return
          const menu = findAccountMenu()
          if (!menu) {
            if (currentMenu || currentHost) {
              detach()
              setHost(null)
            }
            return
          }
          if (menu === currentMenu && currentHost && currentHost.isConnected) return

          detach()
          for (const stale of menu.querySelectorAll('[data-ccu-host]')) stale.remove()
          const viewport = menuViewport(menu)
          const next = document.createElement('div')
          next.dataset.ccuHost = ''
          // Let the sections be direct flex children of the menu viewport.
          next.style.display = 'contents'
          viewport.insertBefore(next, viewport.firstChild)

          currentMenu = menu
          currentHost = next
          menuObserver = new MutationObserver(schedule)
          menuObserver.observe(menu, { childList: true, subtree: true })
          setHost(next)
        }

        const schedule = () => {
          if (scheduled || disposed) return
          scheduled = true
          // Wait for layout so a freshly portalled menu has a real box and its
          // own autoFocus pass has run before the usage section appears.
          frame = window.requestAnimationFrame(() => {
            frame = 0
            scheduled = false
            sync()
          })
        }

        const bodyObserver = new MutationObserver(schedule)
        // Menus are portalled to <body>, so direct children are enough. This
        // avoids reacting to every chat-streaming mutation in the page.
        bodyObserver.observe(document.body, { childList: true })
        sync()

        return () => {
          disposed = true
          if (frame) window.cancelAnimationFrame(frame)
          bodyObserver.disconnect()
          detach()
        }
      }, [])

      return host
    }

    function money(value) {
      return `$${Number(value || 0).toFixed(2)}`
    }

    function percentText(value) {
      return `${Math.round(Number(value || 0))}%`
    }

    function clampPercent(value) {
      return Math.min(100, Math.max(0, Number(value || 0)))
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

    function GoatMark({ size = 18 }) {
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
      const percent = windowLimit ? clampPercent(windowLimit.percent) : null
      const color = percent === null ? 'var(--dsw-alias-label-tertiary)' : colorFor(percent)
      const width = percent === null ? 0 : Math.max(percent > 0 ? 1.5 : 0, percent)
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
              style: { width: `${width}%`, background: color },
            }),
          ),
          h('span', { className: 'ccu-pct', style: { color } }, percent === null ? '—' : percentText(percent)),
        ),
        full
          ? h(
              'div',
              { className: 'ccu-reset' },
              windowLimit
                ? `${windowLimit.used.toFixed(2)} / ${windowLimit.cap.toFixed(2)}`
                : '—',
              windowLimit && resetText(windowLimit.resetAt, now, t)
                ? ` · ${resetText(windowLimit.resetAt, now, t)}`
                : '',
            )
          : null,
      )
    }

    function UsageMenu({ t, host, interactive }) {
      const [expanded, setExpanded] = React.useState(false)
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
      const requestId = React.useRef(0)
      const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
      const detailsId = `ccu-details-${uid || 'menu'}`

      const load = React.useCallback(async (force) => {
        const request = ++requestId.current
        setState((previous) => ({ ...previous, refreshing: true }))
        try {
          const response = await fetch(force ? `${ENDPOINT}?refresh=1` : ENDPOINT, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { accept: 'application/json' },
          })
          const body = await response.json().catch(() => null)
          if (!alive.current || request !== requestId.current) return
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
          if (!alive.current || request !== requestId.current) return
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
          requestId.current += 1
          window.clearInterval(refreshTimer)
          window.clearInterval(clockTimer)
          document.removeEventListener('visibilitychange', onVisibility)
        }
      }, [load]) // eslint-disable-line react-hooks/exhaustive-deps

      const data = state.data
      const planName = data?.plan?.name || t('widget.title')
      const planStatus = data?.plan?.status
      const fiveHour = data?.limits?.fiveHour ?? null
      const weekly = data?.limits?.weekly ?? null
      // `windowLimits.limited` means the plan has rolling windows at all; only
      // `exceeded` means one of them is actually spent.
      const limitReached = fiveHour?.exceeded === true || weekly?.exceeded === true
      const worstPercent = Math.max(fiveHour?.percent ?? 0, weekly?.percent ?? 0)
      const worstTone = limitReached
        ? 'error'
        : worstPercent >= 85
          ? 'error'
          : worstPercent >= 65
            ? 'warn'
            : 'active'
      const statusTone =
        state.phase === 'loading'
          ? undefined
          : state.phase === 'error'
            ? 'error'
            : state.error
              ? 'warn'
              : worstTone
      const remaining = data?.credits?.totalRemaining ?? data?.credits?.monthlyRemaining
      const monthlyTotal = data?.credits?.monthlyTotal
      const monthlyPercent = data?.credits?.monthlyPercent
      const extra = (data?.credits?.purchasedRemaining ?? 0) + (data?.credits?.freeRemaining ?? 0)
      const partial =
        Array.isArray(data?.warnings) && data.warnings.includes('subscription_unavailable')
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
          : planStatus === 'inactive'
            ? t('widget.inactive')
            : planStatus || (state.phase === 'loading' ? t('widget.loading') : '—')
      const planChip = planName === t('widget.title') ? null : planName

      const toggle = () => setExpanded((value) => !value)

      const metrics =
        state.phase === 'loading'
          ? h(
              'div',
              { className: 'ccu-loading' },
              h('span', { className: 'ccu-skeleton ccu-skeleton-wide' }),
              h('span', { className: 'ccu-skeleton ccu-skeleton-mid' }),
            )
          : state.phase === 'error'
            ? h(
                'p',
                { className: 'ccu-error', role: 'status' },
                t(errorKey || 'widget.errorUpstream'),
              )
            : null

      const summary =
        state.phase === 'ready'
          ? h(
              'div',
              { className: 'ccu-sub' },
              h(
                'span',
                null,
                money(remaining),
                ` ${t('widget.left')}`,
              ),
              h('span', null, limitReached ? t('widget.limited') : statusLabel),
            )
          : state.phase === 'loading'
            ? h('div', { className: 'ccu-sub' }, h('span', null, t('widget.loading')))
            : null

      const staleWarning =
        state.phase === 'ready' && state.error
          ? h(
              'p',
              { className: 'ccu-warn', role: 'status' },
              t(errorKey || 'widget.errorUpstream'),
            )
          : null

      const details =
        state.phase === 'ready'
          ? h(
              'div',
              { className: 'ccu-details' },
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
                  monthlyTotal === null || monthlyTotal === undefined
                    ? money(data.credits.monthlyRemaining)
                    : `${money(data.credits.monthlyRemaining)} ${t('widget.of')} ${money(monthlyTotal)}`,
                ),
              ),
              monthlyPercent !== null && monthlyPercent !== undefined
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
              h(
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
              ),
              extra > 0
                ? h(
                    'div',
                    { className: 'ccu-row', style: { marginTop: 8 } },
                    h('span', { className: 'ccu-row-label' }, t('widget.extraCredits')),
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
              partial ? h('p', { className: 'ccu-warn' }, t('widget.partial')) : null,
            )
          : null

      const refreshLabel = state.refreshing ? t('widget.refreshing') : t('widget.refresh')

      const panel = h(
        'section',
        {
          className: 'ccu-menu',
          role: 'group',
          'aria-label': t('widget.menuLabel'),
          'aria-busy': state.refreshing || state.phase === 'loading' ? 'true' : undefined,
          'data-expanded': expanded ? 'true' : 'false',
          'data-phase': state.phase,
        },
        h(
          'button',
          { className: 'ccu-head', type: 'button', role: 'menuitem', onClick: toggle,
            disabled: !interactive, 'aria-expanded': expanded, 'aria-controls': detailsId },
          h(GoatMark, { size: 18 }),
          h('span', { className: 'ccu-title' }, t('widget.remainingUsage')),
          planChip ? h('span', { className: 'ccu-plan' }, planChip) : null,
          h('span', {
            className: 'ccu-dot',
            'data-tone': statusTone,
            title: limitReached ? t('widget.limited') : statusLabel,
          }),
          h(
            'span',
            {
              className: 'ccu-toggle',
              'aria-hidden': true,
            },
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
        ),
        h('div', { className: 'ccu-content', id: detailsId, hidden: !expanded },
        metrics,
        summary,
        staleWarning,
        h(
          'div',
          { className: 'ccu-actions' },
          h('span', { className: 'ccu-updated' }, t('widget.updated', { time: clock(state.updatedAt) || '—' })),
          h(
            'button',
            {
              type: 'button',
              className: `ccu-action${state.phase === 'error' ? ' ccu-action-primary' : ''}`,
              onClick: () => load(true),
              disabled: !interactive || state.refreshing,
              title: state.phase === 'error' ? t('widget.retry') : refreshLabel,
            },
            state.phase === 'error' ? t('widget.retry') : refreshLabel,
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'ccu-action ccu-action-primary',
              disabled: !interactive,
              onClick: () =>
                window.open(
                  'https://commandcode.ai/usage',
                  '_blank',
                  'noopener,noreferrer',
                ),
              title: t('widget.openStudioTitle'),
              'aria-label': t('widget.openStudioTitle'),
            },
            t('widget.openStudio'),
          ),
        ),
        details,
        ),
      )

      return h(
        React.Fragment,
        null,
        host ? ReactDOM.createPortal(panel, host) : null,
      )
    }

    function UsageRoot({ t }) {
      const host = useAccountMenuHost()
      const [interactiveHost, setInteractiveHost] = React.useState(null)

      React.useEffect(() => {
        if (!host) {
          setInteractiveHost(null)
          return undefined
        }
        const timer = window.setTimeout(() => setInteractiveHost(host), 150)
        return () => window.clearTimeout(timer)
      }, [host])

      const interactive = host !== null && interactiveHost === host
      return h(
        React.Fragment,
        null,
        h('style', null, CSS),
        h(UsageMenu, { t, host, interactive }),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, LOCALES), 'command-code-usage: labels')
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'command-code-usage',
              order: 60,
              locale: NS,
            },
            UsageRoot,
          ),
        )
      },
    }
  },
})
