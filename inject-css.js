(function(window, $) {
  var ancestors, cssSelector, filterCss, filterImportant, filterPrefixSelectors, parseCssRules, parseProperties, parseSelectors, removeCssComments, trim, wipeInjectedData;
  removeCssComments = function(css) {
    return css.replace(/\/\*.*?\*\//g, "");
  };
  trim = function(s) {
    if (s) {
      return s.replace(/^\s*/, "").replace(/\s*$/, "");
    } else {
      return "";
    }
  };
  parseCssRules = function(css) {
    var cleanCss, index, result, rule, rules, selector, styleEnd, styleStart, styles;
    result = [];
    cleanCss = removeCssComments(css);
    rules = cleanCss.match(/([^\{]+[^\}]*\})/g);
    for (index in rules) {
      rule = rules[index];
      styleStart = rule.indexOf("{");
      styleEnd = rule.indexOf("}");
      selector = rule.substring(0, styleStart);
      styles = rule.substring(styleStart + 1, styleEnd);
      if (/[^\s]/.test(selector)) {
        result.push({
          selector: trim(selector),
          styles: trim(styles).replace(/\n/g, " ")
        });
      }
    }
    return result;
  };
  parseProperties = function(properties) {
    var index, name, property, result, value, _ref;
    result = [];
    properties = properties.split(";");
    for (index in properties) {
      property = properties[index];
      _ref = property.split(":"), name = _ref[0], value = _ref[1];
      if (name || value) {
        result.push({
          name: trim(name),
          value: trim(value)
        });
      }
    }
    return result;
  };
  parseSelectors = function(selector) {
    return selector.split(",");
  };
  filterCss = function(css, callback) {
    var index, result, rule, rules;
    result = "";
    rules = parseCssRules(css);
    for (index in rules) {
      rule = rules[index];
      result += callback(rule) + "\n";
    }
    return result;
  };
  filterImportant = function(css) {
    return filterCss(css, function(rule) {
      var index, newStyles, property, _ref;
      newStyles = "";
      _ref = parseProperties(rule.styles);
      for (index in _ref) {
        property = _ref[index];
        newStyles += "" + property.name + ":" + property.value + " !important;";
      }
      return "" + rule.selector + " {" + newStyles + "}";
    });
  };
  filterPrefixSelectors = function(css, prefix) {
    return filterCss(css, function(rule) {
      var index, newSelectors, selector, selectors;
      selectors = parseSelectors(rule.selector);
      newSelectors = [];
      for (index in selectors) {
        selector = selectors[index];
        if (/^self/.test(selector)) {
          if (!newSelectors.length) {
            newSelectors.push(prefix);
          }
          newSelectors[newSelectors.length - 1] += selector.replace(/^self/, "");
        } else {
          newSelectors.push("" + prefix + " " + selector);
        }
      }
      return "" + (newSelectors.join(",")) + "{" + rule.styles + "}";
    });
  };
  ancestors = function(elem) {
    var currentNode, result;
    result = [];
    currentNode = elem;
    while (currentNode.parentNode && currentNode.parentNode.nodeType === 1) {
      result.unshift(currentNode);
      currentNode = currentNode.parentNode;
    }
    return result;
  };
  cssSelector = function(elem) {
    var result;
    result = elem.tagName.toLowerCase();
    if (elem.id) {
      result += "#" + elem.id;
    }
    return result;
  };
  window.injectCss = function(elem, css, options) {
    var domTarget, index, outputCss, randId, specificSelector, styleElem, styles, _ref;
    if (!options) {
      options = {};
    }
    randId = ("injectedCss" + (Math.random() * 0x100000000)).replace(".", "");
    if (!elem.id) {
      elem.id = randId;
    }
    if (elem.getAttribute("class")) {
      elem.setAttribute("class", "" + (elem.getAttribute("class")) + " " + randId);
    } else {
      elem.setAttribute("class", randId);
    }
    if (!elem.injectedCss) {
      elem.injectedCss = [];
    }
    specificSelector = "";
    _ref = ancestors(elem);
    for (index in _ref) {
      elem = _ref[index];
      specificSelector += cssSelector(elem) + " ";
    }
    specificSelector = trim(specificSelector) + ("." + randId);
    outputCss = filterPrefixSelectors(css, specificSelector);
    if (options.important) {
      outputCss = filterImportant(outputCss);
    }
    styleElem = document.createElement("style");
    styleElem.id = "" + randId + "_style";
    styleElem.setAttribute("data-inject-css-handle", elem.id);
    styleElem.innerHTML = outputCss;
    styles = document.getElementsByTagName("style");
    domTarget = styles.length ? styles[styles.length - 1] : document.getElementsByTagName('script')[0];
    domTarget.parentNode.insertBefore(styleElem, domTarget.nextSibling);
    console.log(domTarget);
    elem.injectedCss.push(styleElem);
    return styleElem;
  };
  wipeInjectedData = function(elem) {
    var classAttr;
    elem.injectedCss = null;
    delete elem.injectedCss;
    if (/^injectedCss/.test(elem.id)) {
      elem.id = null;
    }
    classAttr = elem.getAttribute("class");
    if (classAttr != null) {
      return elem.setAttribute("class", classAttr.replace(/injectedCss[^\s]*/g, ""));
    }
  };
  window.removeInjectedCss = function(elem) {
    var index, styleElem, _ref;
    if (typeof elem === "string") {
      styleElem = document.getElementById(elem);
      styleElem.parentNode.removeChild(styleElem);
      return wipeInjectedData(document.getElementById(styleElem.getAttribute("data-injected-css-handle")));
    } else if (elem.injectedCss) {
      _ref = elem.injectedCss;
      for (index in _ref) {
        styleElem = _ref[index];
        styleElem.parentNode.removeChild(styleElem);
      }
      return wipeInjectedData(elem);
    }
  };
  if ($ != null) {
    $.fn.injectCss = function(css, options) {
      return $(this).each(function() {
        return injectCss(this, css, options);
      });
    };
    return $.fn.removeInjectedCss = function() {
      return $(this).each(function() {
        return removeInjectedCss(this);
      });
    };
  }
})(window, window.jQuery);