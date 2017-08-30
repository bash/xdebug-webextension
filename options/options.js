(async () => {
  'use strict'

  const getIdeKey = () => {
    return browser.storage.local
      .get({ ideKey: '' })
      .then(({ ideKey }) => ideKey)
  }

  const getIsCustom = (value, $select) => {
    if (value === '') return true

    return !Array.from($select.options)
      .find(($option) => $option.value === value)
  }

  const render = (ideKey, $select, $input) => {
    const isCustom = getIsCustom(ideKey, $select)

    $select.value = isCustom ? '' : ideKey

    $input.disabled = !isCustom
    $input.placeholder = ideKey
    $input.value = isCustom ? ideKey : ''
  }

  const save = async ($select, $input) => {
    const isCustom = $select.value === ''
    const ideKey = isCustom ? $input.value : $select.value

    await browser.storage.local.set({ ideKey })

    return ideKey
  }

  const $select = document.getElementById('ide-key')
  const $input = document.getElementById('custom-ide-key')

  const boundRender = (ideKey) => render(ideKey, $select, $input)
  const boundSave = () => save($select, $input)
  const update = async () => boundRender(await boundSave())

  boundRender(await getIdeKey())

  $input.addEventListener('input', update)
  $select.addEventListener('change', update)
})()
