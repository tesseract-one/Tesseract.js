export const isNodeJs = (typeof process === 'object') && (typeof process.versions.node !== 'undefined')

export const isIOS = !isNodeJs && /iPad|iPhone|iPod/.test(window.navigator.platform)

export const isAndroid = !isNodeJs && /android/i.test(window.navigator.platform)