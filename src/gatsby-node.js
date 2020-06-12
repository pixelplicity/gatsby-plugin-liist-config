const fs = require('fs');
const path = require('path');
const makeDebug = require('debug');
const fetchSheet = require('gatsby-source-google-sheets/fetch-sheet').default;
const merge = require('deepmerge');
const {
  createLocalImage,
} = require('gatsby-transformer-liist/processRemoteImage');

const debug = makeDebug('gatsby-plugin-liist-config');
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;

const themeRE = /^THEME\[(.*)\]/;
const themeDefaults = {
  output: '_liist-config.scss',
  formatters: {
    '$font-family-base': (value) => `${value}', sans-serif`,
    '$font-family-headers': (value) => `${value}', sans-serif`,
  },
};

const setEnvVar = (key, value) => {
  debug(`Setting environment variable "${key}" => ${value}`);
  process.env[key] = value;
};

const processImages = async (_, rows, imageSettings) => {
  return Promise.all(
    rows.map(async ({ key: rowKey, value: rowValue }) => {
      const imageSetting = imageSettings.find((i) => i.key === rowKey);
      if (imageSetting) {
        const { dest, outputName, env } = imageSetting;
        debug(`Images: Processing "${rowKey}" => ${dest}/${outputName}`);
        const imagePath = await createLocalImage({
          imageDest: path.join(process.cwd(), dest),
          imageName: outputName,
          imageURL: rowValue,
        });
        if (env) {
          setEnvVar(
            env,
            imagePath
              .replace(process.cwd(), '')
              .replace('static/', '')
              .replace('src/', '')
          );
        }
      } else {
        return Promise.resolve();
      }
    })
  );
};

const processEnv = (_, rows, envSettings) => {
  rows.forEach(({ key: rowKey, value: rowValue }) => {
    const envSetting = envSettings.find((e) => e.key === rowKey);
    if (envSetting) {
      const { env: destKey } = envSetting;
      debug(`Env: Processing "${rowKey}" => ${destKey}`);
      setEnvVar(destKey, rowValue);
    }
  });
};

const processTheme = async (_, rows, themeSettings) => {
  debug(`Theme: Processing`);
  const themeValues = {};
  const themeFormatterKeys = Object.keys(themeSettings.formatters);
  rows
    .filter((r) => themeRE.test(r.key))
    .forEach(({ key: rowKey, value: rowValue }) => {
      const themeKey = rowKey.match(themeRE)[1];
      themeValues[themeKey] = rowValue;
      debug(`Theme: Found ${themeKey} => ${rowValue}`);
    });
  const themeContents = Object.entries(themeValues)
    .map(([key, value]) => {
      let writeValue = value;
      if (themeFormatterKeys.includes(key)) {
        writeValue = themeSettings.formatters[key](value);
        debug(
          `Theme: Processing custom theme formatter for "${key}": ${value} => ${writeValue}`
        );
      }
      return `${key}: ${value};`;
    })
    .join(`\n`);
  debug(`Theme: Writing theme scss file at src/scss/${themeSettings.output}`);
  fs.writeFileSync(
    path.join(process.cwd(), `src/scss/${themeSettings.output}`),
    themeContents
  );
};

const replaceWithValues = (rows, obj) => {
  if (typeof obj === 'string') {
    return obj;
  }
  if (obj['_type'] && obj['_value']) {
    if (obj['_type'] === 'env') {
      obj = process.env[obj['_value']];
      return obj;
    }
    if (obj['_type'] === 'key') {
      obj = rows.find((r) => r.key === obj['_value'])?.value;
      return obj;
    }
    if (obj['_type'] === 'concat') {
      console.log(
        'Resolve obj by concatenating',
        obj['_value'][0],
        obj['_value'][1]
      );
      obj = `${replaceWithValues(rows, obj['_value'][0])}${replaceWithValues(
        rows,
        obj['_value'][1]
      )}`;
      console.log('Concatenating result', obj);
      return obj;
    }
  }
  if (Array.isArray(obj)) {
    obj = obj.map((o) => replaceWithValues(rows, o));
    return obj;
  }
  Object.entries(obj).forEach(([key, value]) => {
    obj[key] = replaceWithValues(rows, value);
  });
  return obj;
};

const processPlugins = (_, rows, pluginSettings) => {
  const { store } = _;
  const state = store.getState();
  Object.entries(pluginSettings).forEach(([pluginName, optionsTemplate]) => {
    debug(`Plugins: Processing "${pluginName}"`);
    const plugin = state.flattenedPlugins.find(
      (plugin) => plugin.name === pluginName
    );
    if (!plugin) {
      debug(`Plugins: Could not find plugin "${pluginName}"`);
      return;
    }
    const newOptions = replaceWithValues(rows, optionsTemplate);
    plugin.pluginOptions = merge(plugin.pluginOptions, newOptions, {
      arrayMerge: overwriteMerge,
    });
  });
};

exports.onPreInit = async (
  _,
  {
    spreadsheetId,
    worksheetTitle,
    credentials,
    imageSettings,
    themeSettings,
    envSettings,
    pluginSettings,
  }
) => {
  const rows = await fetchSheet(spreadsheetId, worksheetTitle, credentials);
  await processImages(_, rows, imageSettings);
  processEnv(_, rows, envSettings);
  await processTheme(
    _,
    rows,
    (themeSettings: { ...themeDefaults, ...themeSettings })
  );
  await processPlugins(_, rows, pluginSettings);
};
