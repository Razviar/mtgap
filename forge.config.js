module.exports = {
  packagerConfig: {
    icon: require('path').resolve(__dirname, 'src/statics/icon'),
    appBundleId: 'com.mtgarenapro.mtgaprotracker',
    appCategoryType: 'public.app-category.entertainment',
    osxSign: {
      hardenedRuntime: true,
      'gatekeeper-assess': false,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library',
    },
    // osxNotarize: {
    //   appBundleId: 'com.mtgarenapro.mtgaprotracker',
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_ID_PASSWORD,
    // },
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      platforms: ['darwin', 'win32'],
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
      platforms: ['win32'],
      config: {
        name: 'mtgaprotracker',
        certificateFile: './cert/mtgapro.p12',
        certificatePassword: 'Devastator9000',
        iconUrl: 'https://mtgarena.pro/mtg/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'mtgaprotracker',
        overwrite: true,
      },
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
              preload: {
                js: './src/windows/preload.js',
              },
              name: 'home_window',
            },
            {
              html: './src/windows/overlay/overlay.html',
              js: './src/windows/overlay/overlay.ts',
              preload: {
                js: './src/windows/preload.js',
              },
              name: 'overlay_window',
            },
          ],
        },
      },
    ],
  ],
};
