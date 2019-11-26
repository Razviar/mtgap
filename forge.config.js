const path = require('path');

module.exports = {
  packagerConfig: {
    icon: path.resolve(__dirname, 'statics/icon.ico'),
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Razviar',
          name: 'mtgap',
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'mtgaprotracker',
        certificateFile: './cert/mtgapro.p12',
        certificatePassword: 'Devastator9000',
        iconUrl: 'https://mtgarena.pro/mtg/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    [
      '@electron-forge/plugin-webpack',
      {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/windows/home/home.html',
              js: './src/windows/home/home.ts',
              name: 'home_window',
            },
            {
              html: './src/windows/overlay/overlay.html',
              js: './src/windows/overlay/overlay.ts',
              name: 'overlay_window',
            },
          ],
        },
      },
    ],
  ],
};
