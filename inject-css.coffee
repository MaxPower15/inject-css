((window, $) ->

  # given raw CSS, remove all code comments
  removeCssComments = (css) -> css.replace /\/\*.*?\*\//g, ""

  # given a string, chop off whitespace at the beginning and end
  trim = (s) -> if s then s.replace(/^\s*/, "").replace(/\s*$/, "") else ""

  # given raw css, return an array of selector/style pairs for each rule
  parseCssRules = (css) ->
    result = []
    cleanCss = removeCssComments(css)
    rules = cleanCss.match /([^\{]+[^\}]*\})/g
    for rule in rules
      styleStart = rule.indexOf "{"
      styleEnd = rule.indexOf "}"
      selector = rule.substring 0, styleStart
      styles = rule.substring styleStart + 1, styleEnd
      if /[^\s]/.test(selector)
        result.push
          selector: trim(selector)
          styles: trim(styles).replace /\n/g, " "
    result

  # given a rule's properties, return an array of name/value pairs for each property
  #
  # KNOWN ISSUE:
  # If a property includes a quote with a semicolon or colon, these will not split 
  # properly. That situation is so rare that I am choosing not to account for it.
  parseProperties = (properties) ->
    result = []
    properties = properties.split ";"
    for property in properties
      [name, value] = property.split(":")
      if name or value
        result.push
          name: trim(name)
          value: trim(value)
    result

  # given a rule's selector, split it into multiple rules if necessary
  parseSelectors = (selector) -> selector.split(",")

  # parse the raw css, then perform a callback on each rule
  # the filtered css is built from the return value of the callback function
  filterCss = (css, callback) ->
    result = ""
    rules = parseCssRules(css)
    result += callback(rule) + "\n" for rule in rules
    result

  # given raw css, add !important onto every property
  filterImportant = (css) ->
    filterCss css, (rule) ->
      newStyles = ""
      for property in parseProperties(rule.styles)
        newStyles += "#{property.name}:#{property.value} !important;"
      "#{rule.selector} {#{newStyles}}"

  # given raw css, add some arbitrary text before every selector
  # special case if the selector starts with "self":
  #   remove "self" and append the rest of the selector directly to the prefix (no space)
  filterPrefixSelectors = (css, prefix) ->
    filterCss css, (rule) ->
      selectors = parseSelectors(rule.selector)
      newSelectors = []
      for selector in selectors
        if /^self/.test(selector)
          newSelectors.push prefix unless newSelectors.length
          newSelectors[newSelectors.length-1] += selector.replace /^self/, ""
        else
          newSelectors.push "#{prefix} #{selector}"
      "#{newSelectors.join(",")}{#{rule.styles}}"

  # given a DOM element, return an array of its 
  # ancestors (including itself) from least to greatest depth
  ancestors = (elem) ->
    result = []
    currentNode = elem
    while currentNode.parentNode && currentNode.parentNode.nodeType == 1
      result.unshift currentNode
      currentNode = currentNode.parentNode
    result

  # given a DOM element, generate a very specific css selector for it
  cssSelector = (elem) ->
    result = elem.tagName.toLowerCase()
    result += "#" + elem.id if elem.id
    result

  # given a DOM element "elem" and raw CSS, modify the CSS to only affect 
  # elements within "elem".
  window.injectCss = (elem, css, options) ->
    options = {} unless options
    randId = "injectedCss#{Math.random() * 0x100000000}".replace ".", ""

    # set some data on elem so we can pick it out of a crowd
    elem.id = randId if !elem.id
    elem.setAttribute "class", (elem.getAttribute("class") || "") + " " + randId
    elem.injectedCss = [] if !elem.injectedCss

    # generate the most specific css selector of elem
    specificSelector = ""
    specificSelector += cssSelector(elem) + " " for elem in ancestors(elem)
    specificSelector = trim(specificSelector)

    # generate a new specific selector for each rule
    # add !important onto each property if that option is set
    outputCss = filterPrefixSelectors css, specificSelector
    outputCss = filterImportant outputCss if options.important

    # create the <style> element
    styleElem = document.createElement("style")
    styleElem.id = "#{randId}_style"
    styleElem.setAttribute "data-injected-css-handle", elem.id
    styleElem.setAttribute "type", "text/css"

    # insert after either the last <style> or the first <script>
    styles = document.getElementsByTagName "style"
    domTarget = if styles.length then styles[styles.length-1] else document.getElementsByTagName("script")[0]
    domTarget.parentNode.insertBefore(styleElem, domTarget.nextSibling)
    elem.injectedCss.push styleElem

    # update the content on the <style> elem
    # this must be done after it's in the DOM to prevent IE7 from crashing
    if styleElem.styleSheet
      styleElem.styleSheet.cssText = outputCss
    else
      styleElem.appendChild document.createTextNode(outputCss)

    # return the injected <style> element
    styleElem

  # given an element, delete/remove all associated injectedCss data
  wipeInjectedData = (elem) ->
    elem.injectedCss = null
    delete elem.injectedCss
    elem.id = null if /^injectedCss/.test elem.id
    classAttr = elem.getAttribute("class")
    elem.setAttribute "class", classAttr.replace(/injectedCss[^\s]*/g, "") if classAttr?

  # given an element, remove all injected CSS for it
  # and clean up the element's class/id
  window.removeInjectedCss = (elem) ->
    if typeof elem is "string"
      styleElem = document.getElementById elem
      styleElem.parentNode.removeChild styleElem
      wipeInjectedData document.getElementById(styleElem.getAttribute("data-injected-css-handle"))
    else if elem.injectedCss
      for styleElem in elem.injectedCss
        styleElem.parentNode.removeChild styleElem
      wipeInjectedData elem

  # create a jQuery plugin if jQuery's on the page
  if $?
    # save the return value of injectCss in the injectedCss 
    # data array. that way we can chain and provide a removeCss function
    $.fn.injectCss = (css, options) ->
      $(this).each -> injectCss this, css, options

    # remove all injected CSS for matching elements
    $.fn.removeInjectedCss = ->
      $(this).each -> removeInjectedCss this

) window, window.jQuery
