'use strict'

const setCookie = (name, value, path) => {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};path=${encodeURIComponent(path)}`
}

browser.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case 'setCookie':
      return setCookie(message.name, message.value, message.path)
  }
})
