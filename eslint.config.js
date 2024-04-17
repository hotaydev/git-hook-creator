const parser = require("@typescript-eslint/parser");
const eslintPluginTypescript = require("@typescript-eslint/eslint-plugin");

module.exports = [
    {
        languageOptions: {
            parser: parser,
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                node: true,
                browser: false
            }
        },
        plugins: {
            typescript: eslintPluginTypescript
        },
        rules: {
            indent: ["error", 2],
            "linebreak-style": ["error", "unix"],
            semi: ["error", "always"],
            quotes: ["error", "single"]
        },
        files: ["src/**/*.ts"]
    }
]