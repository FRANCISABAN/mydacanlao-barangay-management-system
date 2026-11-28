const REVEAL_SELECTOR = '.page-head, .panel, .cert-card, .door, .status-card, .landing-hero, .landing-section, .process-step, .landing-cta'
const TILT_SELECTOR = '.cert-card, .door, .status-card'
const RIPPLE_SELECTOR = '.btn, .nav-link, .cert-card, .status-card'

export function attachDesignEffects(root) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const enhanced = new WeakSet()
  const revealObserver = typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('design-visible')
        revealObserver.unobserve(entry.target)
      })
    }, { threshold: 0.08 })

  function prepare(node) {
    if (!(node instanceof Element)) return
    const matches = node.matches(REVEAL_SELECTOR) ? [node] : []
    matches.push(...node.querySelectorAll(REVEAL_SELECTOR))
    matches.forEach((element) => {
      if (enhanced.has(element)) return
      enhanced.add(element)
      element.classList.add('design-reveal')
      if (revealObserver) revealObserver.observe(element)
      else element.classList.add('design-visible')
    })

    const tiltTargets = node.matches(TILT_SELECTOR) ? [node] : []
    tiltTargets.push(...node.querySelectorAll(TILT_SELECTOR))
    tiltTargets.forEach((element) => element.classList.add('design-tilt'))
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || !(event.target instanceof Element)) return
    const target = event.target.closest('.design-tilt')
    if (!target) return
    const rect = target.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    target.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`)
    target.style.setProperty('--tilt-y', `${(x - 0.5) * 5}deg`)
  }

  function onPointerOut(event) {
    if (!(event.target instanceof Element)) return
    const target = event.target.closest('.design-tilt')
    if (target && !target.contains(event.relatedTarget)) {
      target.style.removeProperty('--tilt-x')
      target.style.removeProperty('--tilt-y')
    }
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !(event.target instanceof Element)) return
    const target = event.target.closest(RIPPLE_SELECTOR)
    if (!target || target.matches(':disabled')) return
    const rect = target.getBoundingClientRect()
    const diameter = Math.max(rect.width, rect.height) * 2
    const ripple = document.createElement('span')
    ripple.className = 'design-ripple'
    ripple.style.width = `${diameter}px`
    ripple.style.height = `${diameter}px`
    ripple.style.left = `${event.clientX - rect.left - diameter / 2}px`
    ripple.style.top = `${event.clientY - rect.top - diameter / 2}px`
    target.append(ripple)
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
  }

  prepare(root)
  const mutations = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(prepare))
  })
  mutations.observe(root, { childList: true, subtree: true })
  root.addEventListener('pointermove', onPointerMove)
  root.addEventListener('pointerout', onPointerOut)
  root.addEventListener('pointerdown', onPointerDown)

  return () => {
    mutations.disconnect()
    revealObserver?.disconnect()
    root.removeEventListener('pointermove', onPointerMove)
    root.removeEventListener('pointerout', onPointerOut)
    root.removeEventListener('pointerdown', onPointerDown)
  }
}
