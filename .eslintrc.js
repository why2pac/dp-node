module.exports = {
  "extends": "airbnb-base",
  "parserOptions": {
    "sourceType": "script"
  },
  "env": {
    "jest": true
  },
  "rules": {
    "global-require": "off",
    "import/no-dynamic-require": "off",
    "comma-dangle": ["error", {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "always-multiline",
      "exports": "always-multiline",
      "functions": "never"
    }],
    "no-console": "off",
    "new-cap": ["error", {
      "newIsCap": true,
      "newIsCapExceptions": [
        "dpError",
        "dpJobError"
      ],
      "capIsNew": false,
      "capIsNewExceptions": [
        "Immutable.Map",
        "Immutable.Set",
        "Immutable.List"
      ]
    }],
    "no-underscore-dangle": "off",
    "no-unused-vars": ["error", {
      "vars": "all",
      "args": "after-used",
      "ignoreRestSiblings": true,
      "argsIgnorePattern": "^_"
    }]
  }
};
