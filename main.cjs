const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 950, // Ancho inicial
    height: 600, // Alto inicial
    minWidth: 900,
    minHeight: 600,
    frame: true, // 🔥 AQUÍ QUITAMOS EL MARCO DE WINDOWS
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Como estamos en desarrollo, le decimos a Electron que muestre tu localhost
  
mainWindow.loadURL('http://localhost:5173/acceso-admin');

  // (Nota para el futuro: Cuando vayas a exportar el .exe para la tesis, 
  // esto se cambia para que lea el index.html de la carpeta dist)
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});