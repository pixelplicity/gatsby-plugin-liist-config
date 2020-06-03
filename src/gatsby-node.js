const fs = require('fs');
const path = require('path');
const makeDebug = require('debug');
const fetchSheet = require('gatsby-source-google-sheets/fetch-sheet').default;

const {
  createLocalImage,
} = require('gatsby-transformer-liist/processRemoteImage');

const debug = makeDebug('gatsby-plugin-liist-config');

const themeRE = /^THEME\[(.*)\]/;

exports.onPreInit = async (
  _,
  { spreadsheetId, worksheetTitle, credentials }
) => {
  const { store } = _;
  const state = store.getState();
  const theme = {};
  let rows = await fetchSheet(spreadsheetId, worksheetTitle, credentials);
  const promises = rows.map(async ({ key, value }) => {
    if (themeRE.test(key)) {
      const themeKey = key.match(themeRE)[1];
      theme[themeKey] = value;
      return Promise.resolve();
    }
    let setValue = value;
    if (key === 'GATSBY_SITE_LOGO') {
      await createLocalImage({
        imageDest: path.join(process.cwd(), `src/images`),
        imageName: 'logo',
        imageURL: value,
      });
      setValue = null;
    }
    if (key === 'GATSBY_SITE_IMAGE') {
      const imagePath = await createLocalImage({
        imageDest: path.join(process.cwd(), `static`),
        imageName: 'card',
        imageURL: value,
      });
      setValue = imagePath.replace(process.cwd(), '').replace('static/', '');
    }
    if (key === 'GATSBY_SITE_ICON') {
      const imagePath = await createLocalImage({
        imageDest: path.join(process.cwd(), `static/logos`),
        imageName: 'icon',
        imageURL: value,
      });
      setValue = imagePath.replace(process.cwd(), '');
    }
    if (setValue) {
      debug(`${key}=>${setValue}`);
      process.env[key] = setValue;
    }
  });
  const themeContents = Object.entries(theme)
    .map(([key, value]) => {
      if (key === '$font-family-base' || key === '$font-family-headers') {
        // Super hacky but we modify the plugin option directly
        const plugin = state.flattenedPlugins.find(
          (plugin) => plugin.name === 'gatsby-plugin-prefetch-google-fonts'
        );
        plugin.pluginOptions.fonts.push({
          family: value,
          variants: [`400`, `800`],
        });
        return `${key}: '${value}', sans-serif;`;
      }
      return `${key}: ${value};`;
    })
    .join(`\n`);
  debug('Writing theme scss file at src/scss/_liist-config.scss');
  fs.writeFileSync(
    path.join(process.cwd(), `src/scss/_liist-config.scss`),
    themeContents
  );

  //Need to grab styles and write a scss file or something
  return Promise.all(promises);
};
