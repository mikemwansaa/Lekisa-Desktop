// Lekisa desktop shell. The app itself lives in ./desktop and talks to Supabase directly,
// exactly like the mobile app, so both share one backend.
const { app, BrowserWindow, Menu, shell, session } = require("electron");
const path = require("path");

if (!app.requestSingleInstanceLock()) app.quit();

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 980, minHeight: 640,
    title: "Lekisa", backgroundColor: "#EDEFEB", autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  win.loadFile(path.join(__dirname, "desktop", "index.html"));
  // Links (for example the ZRA website) open in the normal browser. Nothing else may open.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file://")) e.preventDefault(); });
  win.on("closed", () => { win = null; });
}

app.whenReady().then(() => {
  // No camera, microphone, location or notification access. Lekisa never needs them on desktop.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  const view = app.isPackaged
    ? { label: "View", submenu: [{ role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "togglefullscreen" }] }
    : { role: "viewMenu" };
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: "editMenu" }, view]));
  createWindow();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
