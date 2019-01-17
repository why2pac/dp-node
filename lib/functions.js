const nonArrowFnRegex = /^\s*(?:class\s|(?:async)?(?:\s+function[\s*(]|(?:^|[*\s])\s*(?:['"0-9]|(?!\s|async[\s*()])[^=>()]+\s*\()))/; // needs to account for async * \u01FA() {} or get prop(){}

/* NOTE: detecting for arrow functions is difficult to do with regular expressions
 * since ECMAScript 2015 ArrowFunction nonterminal allows productions like
 * < ({"\u0025fake-->}) real--->": [a]}) => a > due to pattern matching bindings.
 */

const hasOwn = Object.prototype.hasOwnProperty;
const isArrowFunction = fn => (typeof fn === 'function' && !hasOwn.call(fn, 'prototype') && !nonArrowFnRegex.test(String(fn)));
const getRequireExt = name => Object.keys(require.extensions).find(x => name.endsWith(x));

module.exports = { isArrowFunction, getRequireExt };
