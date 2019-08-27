const nonArrowFnRegex = /^\s*(?:class\s|(?:async)?(?:\s+function[\s*(]|(?:^|[*\s])\s*(?:['"0-9]|(?!\s|async[\s*()])[^=>()]+\s*\()))/; // needs to account for async * \u01FA() {} or get prop(){}

/* NOTE: detecting for arrow functions is difficult to do with regular expressions
 * since ECMAScript 2015 ArrowFunction nonterminal allows productions like
 * < ({"\u0025fake-->}) real--->": [a]}) => a > due to pattern matching bindings.
 */

const hasOwn = Object.prototype.hasOwnProperty;
const isArrowFunction = (fn) => (typeof fn === 'function' && !hasOwn.call(fn, 'prototype') && !nonArrowFnRegex.test(`${fn}`));
const applyPath = (baseParts, relParts) => {
  const bp = baseParts;
  let i = 0;
  if (relParts.length > 1 && relParts[0] === '') {
    bp.length = 2;
    bp[0] = '';
    bp[1] = '';
    i = 1;
  }
  for (; i !== relParts.length; i += 1) {
    const part = relParts[i];
    const len = bp.length;
    switch (part) {
      case '': case '.': break;
      case '..':
        /* eslint-disable no-continue */
        switch (len) {
          case 0: break;
          case 1:
            if (bp[0] !== '' && bp[0] !== '..') {
              bp[0] = '';
              continue;
            }
            break;
          case 2:
            if (bp[0] === '') {
              bp[1] = '';
              continue;
            }
          /* fallthrough */
          default:
            if (bp[len - 1] !== '..') {
              if (len === 1) bp[0] = '';
              else bp.length = len - 1;
              continue;
            }
            break;
        }
        /* eslint-enable no-continue */
      /* fallthrough */
      default:
        if (bp[len - 1] !== '') {
          bp.length = len + 1;
          bp[len] = part;
        } else {
          bp[len - 1] = part;
        }
        break;
    }
  }
  if (relParts.length > 0 && relParts[relParts.length - 1] === '') {
    const len = bp.length;
    if (len === 0 || (len === 1 && bp[0] === '')) {
      bp.length = 2;
      bp[0] = '.';
      bp[1] = '';
    } else if (bp[len - 1] !== '') {
      bp.length = len + 1;
      bp[len] = '';
    } else {
      bp[len - 1] = '';
    }
  }
  return bp;
};
const joinPathNaive = (a, b) => {
  switch ((a.slice(-1) === '/') + (b.charAt(0) === '/')) {
    default: return `${a}/${b}`;
    case 1: return `${a}${b}`;
    case 2: return `${a}${b.substring(1)}`;
  }
};
// Kleene Plus allows for ~4x speedup for V8
const NON_SLASH_RE = /[^/]+/g;
const countSlashes = (a) => `${a}`.replace(NON_SLASH_RE, '').length;

module.exports = {
  isArrowFunction, applyPath, joinPathNaive, countSlashes,
};
