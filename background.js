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

const getIdeKey = () => {
  return browser.storage.local
    .get({ ideKey: '' })
    .then(({ ideKey }) => ideKey)
}

const isDebugEnabled = async (tab) => {
  const url = new window.URL(tab.url)

  const cookie = await browser.cookies.get({
    url: tab.url,
    name: COOKIE,
    firstPartyDomain: url.hostname,
  })

  return cookie != null
}

const disableDebug = (tab) => {
  const url = new window.URL(tab.url)

  return browser.cookies.remove({ url: tab.url, firstPartyDomain: url.hostname, name: COOKIE })
}

const enableDebug = async (tab) => {
  const ideKey = await getIdeKey()
  const url = new window.URL(tab.url)

  return browser.cookies.set({
    url: tab.url,
    firstPartyDomain: url.hostname,
    name: COOKIE,
    value: ideKey,
    path: '/',
  })
}

// TODO: rewrite
const updatePageActionState = (tabId, isEnabled) => {
  if (isEnabled) {
    browser.pageAction.setTitle({ title: getMessage('disableTooltip'), tabId })
    browser.pageAction.setIcon({ path: 'icons/icon-active.svg', tabId })
  } else {
    browser.pageAction.setTitle({ title: getMessage('enableTooltip'), tabId })
    browser.pageAction.setIcon({ path: 'icons/icon.svg', tabId })
  }
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
