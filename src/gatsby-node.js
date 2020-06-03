const fs = require('fs');
const path = require('path');
const makeDebug = require('debug');
const fetchSheet = require('gatsby-source-google-sheets/fetch-sheet').default;

const {
  createLocalImage,
} = require('gatsby-transformer-liist/processRemoteImage');

const debug = makeDebug('gatsby-plugin-liist-config');

const themeRE = /^THEME\[(.*)\]/;
const themeDefaults = {
  output: '_liist-config.scss',
  formatters: {
    '$font-family-base': (value) => `${value}', sans-serif`,
    '$font-family-headers': (value) => `${value}', sans-serif`,
  },
};

exports.onPreInit = async (
  _,
  {
    spreadsheetId,
    worksheetTitle,
    credentials,
    imageSettings,
    themeSettings,
    fontKeys,
  }
) => {
  const { store } = _;
  themeSettings = { ...themeDefaults, ...themeSettings };
  const state = store.getState();
  const themeValues = {};
  const imageKeys = imageSettings.map((i) => i.key);
  let rows = await fetchSheet(spreadsheetId, worksheetTitle, credentials);
  const promises = rows.map(async ({ key, value }) => {
    if (themeRE.test(key)) {
      const themeKey = key.match(themeRE)[1];
      themeValues[themeKey] = value;
      return Promise.resolve();
    }
    let setValue = value;
    if (imageKeys.includes(key)) {
      const { dest, outputName } = imageSettings.find((i) => i.key === key);
      debug(`Processing image "${key}" => ${dest}/${outputName}`);
      const imagePath = await createLocalImage({
        imageDest: path.join(process.cwd(), dest),
        imageName: outputName,
        imageURL: value,
      });
      setValue = imagePath
        .replace(process.cwd(), '')
        .replace('static/', '')
        .replace('src/', '');
    }
    if (setValue) {
      debug(`${key}=>${setValue}`);
      process.env[key] = setValue;
    }
  });
  const themeFormatterKeys = Object.keys(themeSettings.formatters);
  const themeContents = Object.entries(themeValues)
    .map(([key, value]) => {
      let writeValue = value;
      if (fontKeys.includes(key)) {
        debug(`Processing font "${key}" => ${value}`);
        const plugin = state.flattenedPlugins.find(
          (plugin) => plugin.name === 'gatsby-plugin-prefetch-google-fonts'
        );
        plugin.pluginOptions.fonts.push({
          family: value,
          variants: [`400`, `800`],
        });
      }
      if (themeFormatterKeys.includes(key)) {
        writeValue = themeSettings.formatters[key](value);
        debug(
          `Processing custom theme formatter for "${key}": ${value} => ${writeValue}`
        );
      }
      return `${key}: ${value};`;
    })
    .join(`\n`);
  debug(`Writing theme scss file at src/scss/${themeSettings.output}`);
  fs.writeFileSync(
    path.join(process.cwd(), `src/scss/${themeSettings.output}`),
    themeContents
  );

  //Need to grab styles and write a scss file or something
  return Promise.all(promises);
};
