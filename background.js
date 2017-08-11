'use strict'

const COOKIE = 'XDEBUG_SESSION'

// TODO: make configurable
const IDE_KEY = 'PHPSTORM'

const isDebugEnabled = (tab) => {
  return browser.cookies.get({ url: tab.url, name: COOKIE })
                        .then((cookie) => cookie != null)
}

const disableDebug = (tab) => {
  return browser.cookies.remove({ url: tab.url, name: COOKIE })
}

const enableDebug = (tab) => {
  return browser.cookies.set({ url: tab.url, name: COOKIE, value: IDE_KEY, path: '/' })
}

const setPageActionState = (tabId, isEnabled) => {
  if (isEnabled) {
    browser.pageAction.setTitle({ title: 'Disable Xdebug', tabId })
    browser.pageAction.setIcon({ path: 'icon-active.svg', tabId })
  } else {
    browser.pageAction.setTitle({ title: 'Enable Xdebug', tabId })
    browser.pageAction.setIcon({ path: 'icon.svg', tabId })
  }
}

browser.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  const isEnabled = await isDebugEnabled(tab)

  browser.pageAction.show(tabId)

  setPageActionState(tabId, isEnabled)
})

browser.pageAction.onClicked.addListener(async (tab) => {
  const isEnabled = await isDebugEnabled(tab)

  if (isEnabled) {
    await disableDebug(tab)
  } else {
    await enableDebug(tab)
  }

  setPageActionState(tab.id, !isEnabled)
})
