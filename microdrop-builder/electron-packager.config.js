const packager = require('electron-packager');
const options = {
  dir: __dirname,
  derefSymlinks: true,
  overwrite: true,
  packageManager: false,
  name: 'Microdrop',
  asar: true,
  out: `${__dirname}/packager`
};

packager(options).then((d) => {
  console.log("packager done!");
});
