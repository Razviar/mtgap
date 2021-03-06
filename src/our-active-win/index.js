'use strict';

module.exports.sync = () => {
  if (process.platform === 'darwin') {
    return require('./lib/macos').sync();
  }

  if (process.platform === 'win32') {
    return require('./lib/windows').sync();
  }

  throw new Error('macOS and Windows only');
};
