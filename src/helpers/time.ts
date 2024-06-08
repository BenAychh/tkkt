export const agoOrUntil = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 0) {
    return 'in the future'
  }
  let interval = Math.floor(seconds / 31536000)
  if (interval > 1) {
    return interval + ' years ago'
  }
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) {
    return interval + ' months ago'
  }
  interval = Math.floor(seconds / 86400)
  if (interval > 1) {
    return interval + ' days ago'
  }
  interval = Math.floor(seconds / 3600)
  if (interval > 1) {
    return interval + ' hours ago'
  }
  interval = Math.floor(seconds / 60)
  if (interval > 1) {
    return interval + ' minutes ago'
  }
  if (seconds < 30) {
    return 'just now'
  }
  return Math.floor(seconds) + ' seconds ago'
}

const fromNow = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = Math.floor(seconds / 31536000)
  if (interval > 1) {
    return interval + ' years from now'
  }
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) {
    return interval + ' months from now'
  }
  interval = Math.floor(seconds / 86400)
  if (interval > 1) {
    return interval + ' days from now'
  }
  interval = Math.floor(seconds / 3600)
  if (interval > 1) {
    return interval + ' hours from now'
  }
  interval = Math.floor(seconds / 60)
  if (interval > 1) {
    return interval + ' minutes from now'
  }
  if (seconds < 30) {
    return 'a few seconds from now'
  }
  return Math.floor(seconds) + ' seconds from now'
}
