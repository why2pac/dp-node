declare namespace functions {
  function isArrowFunction(fn: Function): boolean
  function getRequireExt(name: string): string | undefined
  function applyPath(baseParts: string[], relParts: string[]): string[]
}

declare const functions: {
  isArrowFunction: functions.isArrowFunction
  getRequireExt: functions.getRequireExt
  applyPath: functions.applyPath
}

export = functions
