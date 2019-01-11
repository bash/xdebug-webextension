'use strict'

const COOKIE = 'XDEBUG_SESSION'
const DEFAULT_IDE_KEY = 'PHPSTORM'

const { getMessage } = browser.i18n

const wrapAsyncFn = (fn) => {
  return (...args) => {
    return fn(...args).catch((err) => {
      console.error(err)
    })
  }
}

const isSubdomain = (otherDomain, baseDomain) => {
  return otherDomain === baseDomain || otherDomain.endsWith(`.${baseDomain}`)
}

const getIdeKey = () => {
  return browser.storage.local
    .get({ ideKey: '' })
    .then(({ ideKey }) => ideKey)
}

const isDebugEnabled = async (tab) => {
  const cookies = await getCookie(tab)
  return cookies != null
}

const getCookie = async (tab) => {
  const { url } = tab
  const parsedUrl = new window.URL(url)

  const cookies = await browser.cookies.getAll({
    url,
    name: COOKIE,
    firstPartyDomain: null,
  })

  const cookieWithMatchingFirstPartyDomain = cookies.find((cookie) => {
    return cookie.firstPartyDomain === '' || isSubdomain(parsedUrl.hostname, cookie.firstPartyDomain)
  })

  return cookieWithMatchingFirstPartyDomain
}

const disableDebug = async (tab) => {
  const cookie = await getCookie(tab)

  if (cookie != null) {
    await browser.cookies.remove({
      url: tab.url,
      name: COOKIE,
      firstPartyDomain: cookie.firstPartyDomain,
    })
  }
}

const enableDebug = async (tab) => {
  const ideKey = await getIdeKey()

  await browser.tabs.sendMessage(tab.id, {
    action: 'setCookie',
    name: COOKIE,
    value: ideKey,
    path: '/',
  })
}

const updatePageActionState = (tabId, isEnabled) => {
  if (isEnabled) {
    setPageActionInfo(tabId, { title: getMessage('disableTooltip'), icon: 'icons/icon-active.svg' })
  } else {
    setPageActionInfo(tabId, { title: getMessage('enableTooltip'), icon: 'icons/icon.svg' })
  }
}

const setPageActionInfo = (tabId, { title, icon }) => {
  browser.pageAction.setTitle({ tabId, title })
  browser.pageAction.setIcon({ tabId, path: icon })
}

browser.tabs.onUpdated.addListener(wrapAsyncFn(async (tabId, _, tab) => {
  const { protocol } = new window.URL(tab.url)

  // do not show page action on special browser pages
  if (protocol !== 'http:' && protocol !== 'https:') return

  const isEnabled = await isDebugEnabled(tab)

  browser.pageAction.show(tabId)

  updatePageActionState(tabId, isEnabled)
}))

browser.pageAction.onClicked.addListener(wrapAsyncFn(async (tab) => {
  const isEnabled = await isDebugEnabled(tab)

  if (isEnabled) {
    await disableDebug(tab)
  } else {
    await enableDebug(tab)
  }

  updatePageActionState(tab.id, !isEnabled)
}))

browser.runtime.onInstalled.addListener(wrapAsyncFn(async () => {
  const ideKey = await getIdeKey()

  if (ideKey === '') {
    await browser.storage.local.set({ ideKey: DEFAULT_IDE_KEY })
  }
}))
