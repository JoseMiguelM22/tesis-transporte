const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Configuración de la ventana de escritorio
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "UniRoute - Panel Administrativo",
    autoHideMenuBar: true, // Oculta el menú superior (Archivo, Editar, etc.) para que se vea más como app
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Aquí detectamos si estamos en desarrollo o producción
  const isDev = !app.isPackaged;

  if (isDev) {
    // En modo desarrollo, Electron lee tu servidor de Vite en tiempo real
    mainWindow.loadURL('http://localhost:5173/acceso-admin');
  } else {
    // En producción, lee los archivos estáticos ya compilados
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});