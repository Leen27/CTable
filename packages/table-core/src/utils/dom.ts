// No imports needed for this DOM utility file

/**
 * This method adds a class to an element and remove that class from all siblings.
 * Useful for toggling state.
 * @param {HTMLElement} element The element to receive the class
 * @param {string} elementClass The class to be assigned to the element
 * @param {boolean} otherElementClass The class to be assigned to siblings of the element, but not the element itself
 */
export function radioCssClass(
  element: HTMLElement,
  elementClass: string | null,
  otherElementClass?: string | null,
) {
  const parent = element.parentElement
  let sibling = parent && (parent.firstChild as HTMLElement)

  while (sibling) {
    if (elementClass) {
      sibling.classList.toggle(elementClass, sibling === element)
    }
    if (otherElementClass) {
      sibling.classList.toggle(otherElementClass, sibling !== element)
    }
    sibling = sibling.nextSibling as HTMLElement
  }
}

export const FOCUSABLE_SELECTOR = '[tabindex], input, select, button, textarea, [href]'
export const FOCUSABLE_EXCLUDE = '[disabled], .ag-disabled:not(.ag-button), .ag-disabled *'

export function isFocusableFormField(element: Element | null): boolean {
  if (!element) {
    return false
  }
  const isFocusable = element.matches('input, select, button, textarea')
  if (!isFocusable) {
    return false
  }
  const isNotFocusable = element.matches(FOCUSABLE_EXCLUDE)
  if (!isNotFocusable) {
    return false
  }
  return isVisible(element)
}

export function setDisplayed(
  element: Element,
  displayed: boolean,
  options: { skipAriaHidden?: boolean } = {},
) {
  const { skipAriaHidden } = options
  element.classList.toggle('ag-hidden', !displayed)
  if (!skipAriaHidden) {
    setAriaHidden(element, !displayed)
  }
}

export function setVisible(
  element: HTMLElement,
  visible: boolean,
  options: { skipAriaHidden?: boolean } = {},
) {
  const { skipAriaHidden } = options
  element.classList.toggle('ag-invisible', !visible)
  if (!skipAriaHidden) {
    setAriaHidden(element, !visible)
  }
}

export function setDisabled(element: HTMLElement, disabled: boolean) {
  const attributeName = 'disabled'
  const addOrRemoveDisabledAttribute = disabled
    ? (e: HTMLElement) => e.setAttribute(attributeName, '')
    : (e: HTMLElement) => e.removeAttribute(attributeName)

  addOrRemoveDisabledAttribute(element)

  const inputs = element.querySelectorAll('input') ?? []
  for (const input of inputs) {
    addOrRemoveDisabledAttribute(input as HTMLElement)
  }
}

export function isElementChildOfClass(
  element: HTMLElement | null,
  cls: string,
  maxNest?: HTMLElement | number,
): boolean {
  let counter = 0

  while (element) {
    if (element.classList.contains(cls)) {
      return true
    }

    element = element.parentElement

    if (typeof maxNest == 'number') {
      if (++counter > maxNest) {
        break
      }
    } else if (element === maxNest) {
      break
    }
  }

  return false
}

// returns back sizes as doubles instead of strings. similar to
// getBoundingClientRect, however getBoundingClientRect does not:
// a) work with fractions (eg browser is zooming)
// b) has CSS transitions applied (eg CSS scale, browser zoom), which we don't want, we want the un-transitioned values
export function getElementSize(el: HTMLElement): {
  height: number
  width: number
  borderTopWidth: number
  borderRightWidth: number
  borderBottomWidth: number
  borderLeftWidth: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  boxSizing: string
} {
  const {
    height,
    width,
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    boxSizing,
  } = window.getComputedStyle(el)

  const pf = Number.parseFloat
  return {
    height: pf(height || '0'),
    width: pf(width || '0'),
    borderTopWidth: pf(borderTopWidth || '0'),
    borderRightWidth: pf(borderRightWidth || '0'),
    borderBottomWidth: pf(borderBottomWidth || '0'),
    borderLeftWidth: pf(borderLeftWidth || '0'),
    paddingTop: pf(paddingTop || '0'),
    paddingRight: pf(paddingRight || '0'),
    paddingBottom: pf(paddingBottom || '0'),
    paddingLeft: pf(paddingLeft || '0'),
    marginTop: pf(marginTop || '0'),
    marginRight: pf(marginRight || '0'),
    marginBottom: pf(marginBottom || '0'),
    marginLeft: pf(marginLeft || '0'),
    boxSizing,
  }
}

export function getInnerHeight(el: HTMLElement): number {
  const size = getElementSize(el)

  if (size.boxSizing === 'border-box') {
    return (
      size.height -
      size.paddingTop -
      size.paddingBottom -
      size.borderTopWidth -
      size.borderBottomWidth
    )
  }

  return size.height
}

export function getInnerWidth(el: HTMLElement): number {
  const size = getElementSize(el)

  if (size.boxSizing === 'border-box') {
    return (
      size.width -
      size.paddingLeft -
      size.paddingRight -
      size.borderLeftWidth -
      size.borderRightWidth
    )
  }

  return size.width
}

export function getAbsoluteHeight(el: HTMLElement): number {
  const { height, marginBottom, marginTop } = getElementSize(el)

  return Math.floor(height + marginBottom + marginTop)
}

export function getAbsoluteWidth(el: HTMLElement): number {
  const { width, marginLeft, marginRight } = getElementSize(el)

  return Math.floor(width + marginLeft + marginRight)
}

export function getElementRectWithOffset(el: HTMLElement): {
  top: number
  left: number
  right: number
  bottom: number
} {
  const offsetElementRect = el.getBoundingClientRect()
  const { borderTopWidth, borderLeftWidth, borderRightWidth, borderBottomWidth } =
    getElementSize(el)

  return {
    top: offsetElementRect.top + (borderTopWidth || 0),
    left: offsetElementRect.left + (borderLeftWidth || 0),
    right: offsetElementRect.right + (borderRightWidth || 0),
    bottom: offsetElementRect.bottom + (borderBottomWidth || 0),
  }
}

export function getScrollLeft(element: HTMLElement, rtl: boolean): number {
  let scrollLeft = element.scrollLeft

  if (rtl) {
    scrollLeft = Math.abs(scrollLeft)
  }

  return scrollLeft
}

export function setScrollLeft(element: HTMLElement, value: number, rtl: boolean): void {
  if (rtl) {
    value *= -1
  }
  element.scrollLeft = value
}

export function clearElement(el: HTMLElement | null | undefined): void {
  while (el?.firstChild) {
    el.firstChild.remove()
  }
}

export function removeFromParent(node: Element | null | undefined): void {
  if (node?.parentNode) {
    node.remove()
  }
}

export function isInDOM(element: Element): element is HTMLElement {
  return !!(element as HTMLElement).offsetParent
}

export function isVisible(element: Element) {
  if (element.checkVisibility) {
    return element.checkVisibility({ checkVisibilityCSS: true })
  }
  const isHidden = !isInDOM(element) || window.getComputedStyle(element).visibility !== 'visible'
  return !isHidden
}

/**
 * Loads the template and returns it as an element.
 * NOTE: Prefer createElement
 * @param {string} template
 * @returns {HTMLElement}
 */
export function loadTemplate(template: string | undefined | null): HTMLElement {
  const tempDiv = document.createElement('div')
  // eslint-disable-next-line no-restricted-properties -- no other way to parse custom HTML strings from the user
  tempDiv.innerHTML = (template || '').trim()

  return tempDiv.firstChild as HTMLElement
}

export function ensureDomOrder(
  eContainer: HTMLElement,
  eChild: HTMLElement,
  eChildBefore?: HTMLElement | null,
): void {
  // if already in right order, do nothing
  if (eChildBefore && eChildBefore.nextSibling === eChild) {
    return
  }

  if (!eContainer.firstChild) {
    eContainer.appendChild(eChild)
  } else if (eChildBefore) {
    if (eChildBefore.nextSibling) {
      // insert between the eRowBefore and the row after it
      eContainer.insertBefore(eChild, eChildBefore.nextSibling)
    } else {
      // if nextSibling is missing, means other row is at end, so just append new row at the end
      eContainer.appendChild(eChild)
    }
  } else if (eContainer.firstChild && eContainer.firstChild !== eChild) {
    // otherwise put at start
    // insert it at the first location
    eContainer.insertAdjacentElement('afterbegin', eChild)
  }
}

export function setDomChildOrder(
  eContainer: HTMLElement,
  orderedChildren: (HTMLElement | null)[],
): void {
  for (let i = 0; i < orderedChildren.length; i++) {
    const correctCellAtIndex = orderedChildren[i]
    const actualCellAtIndex = eContainer.children[i] || null

    if (actualCellAtIndex !== correctCellAtIndex && correctCellAtIndex) {
      eContainer.insertBefore(correctCellAtIndex, actualCellAtIndex)
    }
  }
}

/**
 * Converts a camelCase string into hyphenated string
 * @param {string} camelCase
 * @returns {string}
 */
function camelCaseToHyphenated(camelCase: string): string {
  return camelCase.replace(/[A-Z]/g, (s) => `-${s.toLocaleLowerCase()}`)
}

export function addStylesToElement(
  eElement: any,
  styles:
    | {
        [cssProperty: string]: string | number
      }
    | null
    | undefined,
) {
  if (!styles) {
    return
  }

  for (const key of Object.keys(styles)) {
    const value = styles[key]
    if (!key?.length || value == null) {
      continue
    }

    // changes the key from camelCase into a hyphenated-string
    const parsedKey = camelCaseToHyphenated(key)
    const valueAsString = value.toString()
    const parsedValue = valueAsString.replace(/\s*!important/g, '')
    const priority = parsedValue.length != valueAsString.length ? 'important' : undefined

    eElement.style.setProperty(parsedKey, parsedValue, priority)
  }
}

export function isElementOverflowingCallback(
  getElement: () => HTMLElement | undefined,
): () => boolean {
  return () => {
    const element = getElement()
    if (!element) {
      // defaults to true
      return true
    }
    return isHorizontalScrollShowing(element) || isVerticalScrollShowing(element)
  }
}

export function isHorizontalScrollShowing(element: HTMLElement): boolean {
  return element.clientWidth < element.scrollWidth
}

export function isVerticalScrollShowing(element: HTMLElement): boolean {
  return element.clientHeight < element.scrollHeight
}

export function setElementWidth(element: HTMLElement, width: string | number) {
  if (width === 'flex') {
    element.style.removeProperty('width')
    element.style.removeProperty('minWidth')
    element.style.removeProperty('maxWidth')
    element.style.flex = '1 1 auto'
  } else {
    setFixedWidth(element, width)
  }
}

export function setFixedWidth(element: HTMLElement, width: string | number) {
  width = formatSize(width)
  element.style.width = width
  element.style.maxWidth = width
  element.style.minWidth = width
}

export function setFixedHeight(element: HTMLElement, height: string | number) {
  height = formatSize(height)
  element.style.height = height
  element.style.maxHeight = height
  element.style.minHeight = height
}

export function formatSize(size: number | string) {
  return typeof size === 'number' ? `${size}px` : size
}

export function isNodeOrElement(o: any): o is Node | Element {
  return o instanceof Node || o instanceof HTMLElement
}

export function addOrRemoveAttribute(
  element: HTMLElement,
  name: string,
  value: string | number | null | undefined,
) {
  if (value == null || value === '') {
    element.removeAttribute(name)
  } else {
    element.setAttribute(name, value.toString())
  }
}

// Simple implementation of aria hidden
function setAriaHidden(element: Element, hidden: boolean) {
  if (hidden) {
    element.setAttribute('aria-hidden', 'true')
  } else {
    element.removeAttribute('aria-hidden')
  }
}

// Simple whitespace node cache
let whitespaceNode: Node | null

function getWhitespaceNode(): Node {
  // Cloning is slightly faster than creating a new node each time
  whitespaceNode ??= document.createTextNode(' ')
  return whitespaceNode.cloneNode()
}

// Simple createElement function for creating DOM elements
export function createElement<T extends HTMLElement = HTMLElement>(
  tag: keyof HTMLElementTagNameMap | string,
  options?: {
    className?: string
    innerHTML?: string
    textContent?: string
    attributes?: { [key: string]: string }
    children?: Node[] | string | any[]
    tag?: string
    cls?: string
    attrs?: { [key: string]: string }
  },
): T {
  const element = document.createElement(tag as keyof HTMLElementTagNameMap)

  if (options) {
    // Handle different property names (className/cls, attributes/attrs)
    const className = options.className || options.cls
    const attributes = options.attributes || options.attrs

    if (className) {
      element.className = className
    }

    if (options.innerHTML) {
      element.innerHTML = options.innerHTML
    }

    if (options.textContent) {
      element.textContent = options.textContent
    }

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value)
      })
    }

    const { children } = options
    if (children) {
      if (typeof children === 'string') {
        element.textContent = children
      } else {
        let addFirstWhitespace = true
        for (const child of children) {
          if (child) {
            if (typeof child === 'string') {
              element.appendChild(document.createTextNode(child))
              addFirstWhitespace = false
            } else if (typeof child === 'function') {
              element.appendChild((child as () => Element)())
            } else if (typeof child === 'object' && child.tag) {
              // NOTE: To match the previous behaviour of when component templates where defined on multi line strings we need
              // to add a whitespace node before and after each child element.
              // Ideally we would not do this but this reduces the chance of breaking changes.
              if (addFirstWhitespace) {
                element.appendChild(getWhitespaceNode())
                addFirstWhitespace = false
              }
              // Recursive call to createElement for child elements
              element.appendChild(createElement(child.tag, child))
              element.appendChild(getWhitespaceNode())
            } else if (child instanceof Node) {
              // Handle regular DOM nodes
              element.appendChild(child)
            }
          }
        }
      }
    }
  }

  return element as T
}

// Simple function to create a text node
export function createTextNode(text: string): Text {
  return document.createTextNode(text)
}
