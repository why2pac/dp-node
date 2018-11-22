const nonArrFnRegex = /^\s*function/;
const arrowFnRegex = /^((\([^)]*\) *=>)|([^=]*=>))/;

const isArrowFunction = (fn) => {
  if (!fn) return false;

  let fnStr = String(fn);
  fnStr = fnStr.indexOf('{') !== -1 ? fnStr.slice(0, fnStr.indexOf('{')) : fnStr;

  return !nonArrFnRegex.test(fnStr) && arrowFnRegex.test(fnStr);
};

module.exports.isArrowFunction = isArrowFunction;
