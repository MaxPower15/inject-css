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
    var cleanCss, result, rule, rules, selector, styleEnd, styleStart, styles, _i, _len;
    result = [];
    cleanCss = removeCssComments(css);
    rules = cleanCss.match(/([^\{]+[^\}]*\})/g);
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      rule = rules[_i];
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
    var name, property, result, value, _i, _len, _ref;
    result = [];
    properties = properties.split(";");
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      property = properties[_i];
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
    var result, rule, rules, _i, _len;
    result = "";
    rules = parseCssRules(css);
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      rule = rules[_i];
      result += callback(rule) + "\n";
    }
    return result;
  };
  filterImportant = function(css) {
    return filterCss(css, function(rule) {
      var newStyles, property, _i, _len, _ref;
      newStyles = "";
      _ref = parseProperties(rule.styles);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        newStyles += "" + property.name + ":" + property.value + " !important;";
      }
      return "" + rule.selector + " {" + newStyles + "}";
    });
  };
  filterPrefixSelectors = function(css, prefix) {
    return filterCss(css, function(rule) {
      var newSelectors, selector, selectors, _i, _len;
      selectors = parseSelectors(rule.selector);
      newSelectors = [];
      for (_i = 0, _len = selectors.length; _i < _len; _i++) {
        selector = selectors[_i];
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
    var domTarget, outputCss, randId, specificSelector, styleElem, styles, _i, _len, _ref;
    if (!options) {
      options = {};
    }
    randId = ("injectedCss" + (Math.random() * 0x100000000)).replace(".", "");
    if (!elem.id) {
      elem.id = randId;
    }
    elem.setAttribute("class", (elem.getAttribute("class") || "") + " " + randId);
    if (!elem.injectedCss) {
      elem.injectedCss = [];
    }
    specificSelector = "";
    _ref = ancestors(elem);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      specificSelector += cssSelector(elem) + " ";
    }
    specificSelector = trim(specificSelector);
    outputCss = filterPrefixSelectors(css, specificSelector);
    if (options.important) {
      outputCss = filterImportant(outputCss);
    }
    styleElem = document.createElement("style");
    styleElem.id = "" + randId + "_style";
    styleElem.setAttribute("data-injected-css-handle", elem.id);
    styleElem.setAttribute("type", "text/css");
    styles = document.getElementsByTagName("style");
    domTarget = styles.length ? styles[styles.length - 1] : document.getElementsByTagName("script")[0];
    domTarget.parentNode.insertBefore(styleElem, domTarget.nextSibling);
    elem.injectedCss.push(styleElem);
    if (styleElem.styleSheet) {
      styleElem.styleSheet.cssText = outputCss;
    } else {
      styleElem.appendChild(document.createTextNode(outputCss));
    }
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
    var styleElem, _i, _len, _ref;
    if (typeof elem === "string") {
      styleElem = document.getElementById(elem);
      styleElem.parentNode.removeChild(styleElem);
      return wipeInjectedData(document.getElementById(styleElem.getAttribute("data-injected-css-handle")));
    } else if (elem.injectedCss) {
      _ref = elem.injectedCss;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        styleElem = _ref[_i];
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