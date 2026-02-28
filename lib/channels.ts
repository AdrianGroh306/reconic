export type FavoritedChannel = {
  id: string
  title: string
  thumbnail: string
  subscriberCount?: string
  savedAt: string
}

let _userId = ""

export function setChannelsUser(id: string): void {
  _userId = id
}

function favoritedChannelsKey() {
  return _userId ? `reconic:${_userId}:favorited-channels` : "reconic:favorited-channels"
}

export function loadFavoritedChannels(): FavoritedChannel[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(favoritedChannelsKey()) ?? "[]")
  } catch {
    return []
  }
}

export function saveFavoritedChannel(channel: Omit<FavoritedChannel, "savedAt">): void {
  const all = loadFavoritedChannels()
  const exists = all.findIndex((c) => c.id === channel.id)
  if (exists >= 0) return
  all.unshift({ ...channel, savedAt: new Date().toISOString() })
  localStorage.setItem(favoritedChannelsKey(), JSON.stringify(all))
}

export function removeFavoritedChannel(id: string): void {
  const all = loadFavoritedChannels().filter((c) => c.id !== id)
  localStorage.setItem(favoritedChannelsKey(), JSON.stringify(all))
}

export function isFavoritedChannel(id: string): boolean {
  return loadFavoritedChannels().some((c) => c.id === id)
}
