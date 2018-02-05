const url = require('url');
const path = require('path');
const {spawn} = require('child_process');

const {app, dialog, BrowserWindow} = require('electron');
const _ = require('lodash');

const options = {shell: true, detached: true};
const MicrodropModels = require('@microdrop/models');

// Create main window (hosts webserver)
let mainWindow;
const createWindow = () => {
  const windowOptions = {};
  _.set(windowOptions, 'show', true);
  _.set(windowOptions, 'webPreferences.webSecurity', false);

  // dialog.showMessageBox({message: path.resolve(__dirname)});

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.loadURL(url.format({
    pathname: path.resolve(__dirname, 'public/index.html'),
    protocol: 'file',
    slahes: true
  }));
  mainWindow.on('closed', () => { mainWindow = null;});
  mainWindow.webContents.openDevTools()

  MicrodropModels.initAsElectronProcesses();

  return mainWindow;
};

// Listen for app to be ready
app.on('ready', () => createWindow() );
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});
app.on('activate', () => {
  if (mainWindow === null) { createWindow() }
});
