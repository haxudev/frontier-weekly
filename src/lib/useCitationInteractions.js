'use client'

import { useEffect } from 'react'

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ensureCitePopover() {
  let popoverEl = document.getElementById('cite-popover')
  if (!popoverEl) {
    popoverEl = document.createElement('div')
    popoverEl.id = 'cite-popover'
    popoverEl.className = 'cite-popover'
    popoverEl.setAttribute('role', 'dialog')
    popoverEl.setAttribute('aria-label', '引用来源')
    popoverEl.setAttribute('hidden', '')

    document.body.appendChild(popoverEl)
  }

  let linkEl = popoverEl.querySelector('a.cite-popover-link')
  if (!linkEl) {
    linkEl = document.createElement('a')
    linkEl.className = 'cite-popover-link'
    popoverEl.appendChild(linkEl)
  }

  return { popoverEl, linkEl }
}

function ensureCiteHoverCard() {
  let hoverCardEl = document.getElementById('cite-hovercard')
  if (!hoverCardEl) {
    hoverCardEl = document.createElement('div')
    hoverCardEl.id = 'cite-hovercard'
    hoverCardEl.className = 'cite-hovercard'
    hoverCardEl.setAttribute('role', 'dialog')
    hoverCardEl.setAttribute('aria-label', '引用来源')
    hoverCardEl.setAttribute('hidden', '')
    document.body.appendChild(hoverCardEl)
  }

  let hoverLinkEl = hoverCardEl.querySelector('a.cite-hovercard-link')
  if (!hoverLinkEl) {
    hoverLinkEl = document.createElement('a')
    hoverLinkEl.className = 'cite-hovercard-link'
    hoverCardEl.appendChild(hoverLinkEl)
  }

  return { hoverCardEl, hoverLinkEl }
}

export function useCitationInteractions(rootRef, deps = []) {
  useEffect(() => {
    const rootEl = rootRef?.current
    if (!rootEl) return

    const { popoverEl, linkEl } = ensureCitePopover()
    const { hoverCardEl, hoverLinkEl } = ensureCiteHoverCard()
    let activeCiteEl = null
    let activeHoverCiteEl = null
    let lastTouchTs = 0
    let hoverCloseTimer = null

    const closePopover = () => {
      if (activeCiteEl) {
        activeCiteEl.setAttribute('data-cite-open', 'false')
        activeCiteEl.setAttribute('aria-expanded', 'false')
      }
      activeCiteEl = null
      popoverEl.setAttribute('hidden', '')
    }

    const closeHoverCard = () => {
      activeHoverCiteEl = null
      hoverCardEl.setAttribute('hidden', '')
      hoverCardEl.style.left = ''
      hoverCardEl.style.top = ''
      hoverCardEl.style.visibility = ''
    }

    const openPopover = (citeEl) => {
      closePopover()

      const title = citeEl.getAttribute('data-cite-title') || ''
      const citeNumber = citeEl.getAttribute('data-cite') || ''
      const href = citeEl.getAttribute('href') || ''

      activeCiteEl = citeEl
      activeCiteEl.setAttribute('data-cite-open', 'true')
      activeCiteEl.setAttribute('aria-expanded', 'true')

      const displayText = title ? `[${citeNumber}] ${title}` : href
      linkEl.textContent = displayText
      linkEl.href = citeEl.href
      popoverEl.removeAttribute('hidden')
    }

    const shouldHandleHoverCards = () => {
      if (typeof window === 'undefined') return false
      const canHover = window.matchMedia?.('(hover: hover)')?.matches
      const finePointer = window.matchMedia?.('(pointer: fine)')?.matches
      return Boolean(canHover && finePointer)
    }

    const openHoverCard = (citeEl) => {
      if (!shouldHandleHoverCards()) return

      if (hoverCloseTimer) {
        clearTimeout(hoverCloseTimer)
        hoverCloseTimer = null
      }

      const title = citeEl.getAttribute('data-cite-title') || ''
      const citeNumber = citeEl.getAttribute('data-cite') || ''
      const href = citeEl.getAttribute('href') || ''

      if (!title) {
        closeHoverCard()
        return
      }

      activeHoverCiteEl = citeEl
      hoverLinkEl.textContent = title
      hoverLinkEl.href = citeEl.href
      hoverLinkEl.setAttribute('aria-label', `[${citeNumber}] ${title}`.trim() || href)

      hoverCardEl.style.visibility = 'hidden'
      hoverCardEl.removeAttribute('hidden')

      const anchorRect = citeEl.getBoundingClientRect()

      requestAnimationFrame(() => {
        const cardRect = hoverCardEl.getBoundingClientRect()
        const margin = 10
        const viewportW = window.innerWidth
        const viewportH = window.innerHeight

        let left = anchorRect.left + anchorRect.width / 2 - cardRect.width / 2
        left = Math.max(margin, Math.min(left, viewportW - cardRect.width - margin))

        let top = anchorRect.top - cardRect.height - margin
        if (top < margin) {
          top = Math.min(anchorRect.bottom + margin, viewportH - cardRect.height - margin)
        }

        hoverCardEl.style.left = `${left}px`
        hoverCardEl.style.top = `${top}px`
        hoverCardEl.style.visibility = 'visible'
      })
    }

    const scheduleCloseHoverCard = () => {
      if (hoverCloseTimer) clearTimeout(hoverCloseTimer)
      hoverCloseTimer = setTimeout(() => closeHoverCard(), 120)
    }

    const citeLinks = rootEl.querySelectorAll('a[data-cite]')
    citeLinks.forEach((el) => {
      if (!el.hasAttribute('data-cite-open')) el.setAttribute('data-cite-open', 'false')
      if (!el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false')
      // Ensure aria-label stays readable even if some HTML escapes were missing upstream.
      const citeNumber = el.getAttribute('data-cite') || ''
      const title = el.getAttribute('data-cite-title') || ''
      if (!el.getAttribute('aria-label') && (citeNumber || title)) {
        el.setAttribute('aria-label', escapeHtmlAttribute(`[${citeNumber}] ${title}`.trim()))
      }
    })

    const getTargetElement = (eventTarget) => {
      if (eventTarget instanceof Element) return eventTarget
      if (eventTarget && eventTarget.nodeType === 3) return eventTarget.parentElement
      return null
    }

    const shouldHandleTouchCitations = () => {
      if (typeof window === 'undefined') return false
      const hasTouch =
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
        'ontouchstart' in window
      const noHover = window.matchMedia?.('(hover: none)')?.matches
      const coarse = window.matchMedia?.('(pointer: coarse)')?.matches
      return Boolean(hasTouch && (noHover || coarse))
    }

    const interceptCitation = (e) => {
      if (!shouldHandleTouchCitations()) return false

      const targetEl = getTargetElement(e.target)
      if (!targetEl) return false

      if (popoverEl.contains(targetEl)) return false

      const citeEl = targetEl.closest('a[data-cite]')
      if (!citeEl || !rootEl.contains(citeEl)) return false

      e.preventDefault()
      e.stopPropagation()
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation()

      if (activeCiteEl === citeEl) {
        closePopover()
      } else {
        openPopover(citeEl)
      }

      return true
    }

    const onMouseOver = (e) => {
      if (!shouldHandleHoverCards()) return

      const targetEl = getTargetElement(e.target)
      if (!targetEl) return
      if (hoverCardEl.contains(targetEl)) return

      const citeEl = targetEl.closest('a[data-cite]')
      if (!citeEl || !rootEl.contains(citeEl)) return
      openHoverCard(citeEl)
    }

    const onMouseOut = (e) => {
      if (!shouldHandleHoverCards()) return

      const relatedEl = getTargetElement(e.relatedTarget)
      if (relatedEl && hoverCardEl.contains(relatedEl)) return

      const targetEl = getTargetElement(e.target)
      const fromCite = targetEl?.closest?.('a[data-cite]')
      if (fromCite && rootEl.contains(fromCite)) {
        scheduleCloseHoverCard()
      }
    }

    const onFocusIn = (e) => {
      if (!shouldHandleHoverCards()) return
      const targetEl = getTargetElement(e.target)
      if (!targetEl) return
      const citeEl = targetEl.closest('a[data-cite]')
      if (!citeEl || !rootEl.contains(citeEl)) return
      openHoverCard(citeEl)
    }

    const onFocusOut = (e) => {
      if (!shouldHandleHoverCards()) return
      const relatedEl = getTargetElement(e.relatedTarget)
      if (relatedEl && hoverCardEl.contains(relatedEl)) return
      scheduleCloseHoverCard()
    }

    const onTouchStartCapture = (e) => {
      lastTouchTs = Date.now()
      interceptCitation(e)
    }

    const onClickCapture = (e) => {
      if (Date.now() - lastTouchTs < 800) {
        if (interceptCitation(e)) return
        return
      }
      interceptCitation(e)
    }

    const onDocumentClickBubble = (e) => {
      const targetEl = getTargetElement(e.target)
      if (!targetEl) return
      if (hoverCardEl.contains(targetEl)) return
      if (popoverEl.contains(targetEl)) return
      if (rootEl.contains(targetEl) && targetEl.closest('a[data-cite]')) return
      closePopover()
      closeHoverCard()
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePopover()
        closeHoverCard()
      }
    }

    const onScroll = () => {
      closePopover()
      closeHoverCard()
    }

    document.addEventListener('touchstart', onTouchStartCapture, { capture: true, passive: false })
    document.addEventListener('click', onClickCapture, true)
    document.addEventListener('click', onDocumentClickBubble)
    rootEl.addEventListener('mouseover', onMouseOver)
    rootEl.addEventListener('mouseout', onMouseOut)
    rootEl.addEventListener('focusin', onFocusIn)
    rootEl.addEventListener('focusout', onFocusOut)
    hoverCardEl.addEventListener('mouseenter', () => {
      if (hoverCloseTimer) {
        clearTimeout(hoverCloseTimer)
        hoverCloseTimer = null
      }
    })
    hoverCardEl.addEventListener('mouseleave', scheduleCloseHoverCard)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStartCapture, true)
      document.removeEventListener('click', onClickCapture, true)
      document.removeEventListener('click', onDocumentClickBubble)
      rootEl.removeEventListener('mouseover', onMouseOver)
      rootEl.removeEventListener('mouseout', onMouseOut)
      rootEl.removeEventListener('focusin', onFocusIn)
      rootEl.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll)
      closePopover()
      closeHoverCard()
    }
  }, deps)
}
