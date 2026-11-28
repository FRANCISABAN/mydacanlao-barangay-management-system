let items = []
let seq = 0
const subs = new Set()
const emit = () => subs.forEach((f) => f())

export const subscribe = (f) => {
  subs.add(f)
  return () => subs.delete(f)
}
export const getToasts = () => items
export const dismiss = (id) => {
  items = items.filter((t) => t.id !== id)
  emit()
}
export function toast(message, type = 'success') {
  const t = { id: ++seq, message, type }
  items = [...items, t]
  emit()
  setTimeout(() => dismiss(t.id), 5000)
}
