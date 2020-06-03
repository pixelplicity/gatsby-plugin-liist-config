# gatsby-plugin-liist-config

[![npm package](https://flat.badgen.net/npm/v/gatsby-plugin-liist-config)](https://badgen.net/npm/v/gatsby-plugin-liist-config)
[![Maintainability](https://flat.badgen.net/codeclimate/maintainability/Aquilio/gatsby-plugin-liist-config)](https://codeclimate.com/github/Aquilio/gatsby-plugin-liist-config/maintainability)
![Dependabot](https://flat.badgen.net/dependabot/thepracticaldev/dev.to?icon=dependabot)

A Gatsby plugin for pulling [https://liist.io] Liist config from a spreadsheet.

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

_NOTE: By default, this plugin only generates output when run in production mode. To test your tracking code, run `gatsby build && gatsby serve`_.

### Options

| Option           | Explanation                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `spreadsheetId`  | The id of the spreadsheet (required)                                        |
| `worksheetTitle` | The title of the shett containing the configuration (required)              |
| `credentials`    | The service account credentials generated from the Google Developer Console |

### Site Images

The logo, icon and card image will be downloaded from the settings sheet and stored locally:

#### Logo

Placed in src/images/logo.{ext}
No environment variable is set

#### Icon

Placed in static/logos/icon.{ext}
Available as `GATSBY_SITE_ICON`

#### Card

Placed in static/card.{ext}
Available as `GATSBY_SITE_IMAGE`

### Theme

Any settings with a key of the format `THEME[$secondary]` will be put into a custom scss file located at `src/scss/_liist-config.scss`. The value inside the `[...]` is the variable name and the values will be printed as is.

For example:

`THEME[$default] => #00ff00`
becomes
`$default: #00ff00;`

The only exception is fonts. 👇

### Fonts

Fonts are provided as theme settings but their output is a bit different. The two keys available are `THEME[$font-family-base]` and `THEME[$font-family-headers]`. These should be valid Google font.

In addition to being output in `src/scss/_liist-config.scss`, they are also prefetched using the `gatsby-plugin-prefetch-google-fonts` plugin.

### Environment Variables

All other settings will be put on `process.env` using their key as the variable name.

For example

`GATSBY_SITE_TITLE => Site Title`

```js
process.env.GATSBY_SITE_TITLE; //-> 'Site Title'
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](https://github.com/Aquilio/gatsby-plugin-plausible/blob/master/LICENSE) © [Aquil.io](https://aquil.io)
