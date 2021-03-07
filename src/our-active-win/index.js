'use strict';

module.exports.sync = () => {
  if (process.platform === 'darwin') {
    return require('./lib/macos').sync();
  }

  if (process.platform === 'win32') {
    return require('./lib/windows').launch();
  }

  throw new Error('macOS and Windows only');
};

module.exports.launch = () => {
  if (process.platform === 'win32') {
    return require('./lib/windows-emit').launch();
  }

  throw new Error('macOS and Windows only');
};
