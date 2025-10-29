module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    "airbnb",                     
    "plugin:react-hooks/recommended"
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: "latest",
    sourceType: "module"
  },
  rules: {
    "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    "react/react-in-jsx-scope": "off",
    "import/extensions": "off",
  },
  overrides: [
    {
      files: ['vite.config.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
      },
    },
  ],
};
