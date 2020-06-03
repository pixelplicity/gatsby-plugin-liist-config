# gatsby-plugin-liist-config

[![npm package](https://flat.badgen.net/npm/v/gatsby-plugin-liist-config)](https://badgen.net/npm/v/gatsby-plugin-liist-config)
[![Maintainability](https://flat.badgen.net/codeclimate/maintainability/Aquilio/gatsby-plugin-liist-config)](https://codeclimate.com/github/Aquilio/gatsby-plugin-liist-config/maintainability)
![Dependabot](https://flat.badgen.net/dependabot/thepracticaldev/dev.to?icon=dependabot)

A Gatsby plugin for pulling [Liist](https://liist.io) config from a spreadsheet.

The plugin uses the `gatsby-source-google-sheets` plugin to retrieve rows of key-value pairs that configure a Liist site.

---

- [Install](#install)
  - [Manual](#manual)
- [How to use](#how-to-use)
  - [Options](#options)
  - [Site Images](#site-images)
  - [Theme](#theme)
  - [Fonts](#fonts)
  - [Environment Variables](#environment-variables)
- [Changelog](#changelog)
- [License](#license)

## Install

### Manual

1. Install `gatsby-plugin-liist-config`

   `npm install --save gatsby-plugin-liist-config`

2. Add plugin to `gatsby-config.js`

   ```javascript
   // In your gatsby-config.js
    module.exports = {
      plugins: [
        {
        resolve: `gatsby-plugin-liist-config`,
        options: {
          spreadsheetId: '1234',
          worksheetTitle: 'Settings',
          credentials: {/* service account credentials */},
        }
      ],
    };
   ```

## How to use

### Options

| Option                     | Explanation                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `spreadsheetId`            | The id of the spreadsheet (required)                                        |
| `worksheetTitle`           | The title of the shett containing the configuration (required)              |
| `credentials`              | The service account credentials generated from the Google Developer Console |
| `imageSettings`            | Array of image configs                                                      |
| `imageSettings.key`        | The key of the row the value comes from                                     |
| `imageSettings.dest`       | The destination folder (relative to the root of the site)                   |
| `imageSettings.outputName` | The name of the output (minues the extension)                               |
| `themeSettings`            | Theme settings                                                              |
| `themeSettings.output`     | Name of the generated scss file                                             |
| `themeSettings.formatters` | Array of variable (inner part of the [...]) key (function) pairs            |
| `fontKeys`                 | Array of theme variables that are fonts that should be prefetched           |

### Images

Any images configured with the `imageSettings` option will be downloaded, placed in the destination folder and have the public path exposed as an environment variable.

This configuration:

```js
{
  key: 'GATSBY_LOGO',
  dest: 'src/images',
  outputName: 'logo'
}
```

Would result in the image being downloaded and stored in `src/images/logo.{ext}`. The environment variable `GATSBY_LOGO` would equal `images/logo.{ext}`

### Theme

Any settings with a key of the format `THEME[$secondary]` will be put into a custom scss file located at `src/scss/` with the filename specified by `themeSettings.output`. The value inside the `[...]` is the variable name and the values will be printed as is.

If a variable's value requires a custom format, provide that in `themeSettings.formatters`. The key should be the theme variable and the function takes the value from the spreadsheet and must return a string to be written to the SCSS file.

For example:

`THEME[$default] => #00ff00`
becomes
`$default: #00ff00;`

With this configuration

```js
{
  formatters: {
    '$somethingSpecial': value => `'Something'`;
  }
}
```

Will results in:

`$somethingSpecial: 'Something';`

### Fonts

Theme variables that are provided in the `fontKeys` optionseme settings but their output is a bit different. The two keys available are `THEME[$font-family-base]` and `THEME[$font-family-headers]`. These should be valid Google font.

In addition to being output in `src/scss/_liist-config.scss`, they are also prefetched using the `gatsby-plugin-prefetch-google-fonts` plugin.

### Environment Variables

All other settings will be put on `process.env` using their key as the variable name.

For example

`GATSBY_SITE_TITLE => Site Title`

```js
console.log(process.env.GATSBY_SITE_TITLE); //-> 'Site Title'
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](https://github.com/Aquilio/gatsby-plugin-liist-config/blob/master/LICENSE) © [Aquil.io](https://aquil.io)
