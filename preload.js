console.log('Preload script loaded!'); 
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    readSchedules: () => ipcRenderer.invoke('read-schedules'),
    writeSchedules: (data) => ipcRenderer.invoke('write-schedules', data),
    readCategories: () => ipcRenderer.invoke('read-categories'),
    writeCategories: (categories) => ipcRenderer.invoke('write-categories', categories),
    readHolidays: (year,forceUpdate = false) => ipcRenderer.invoke('read-holidays', year, forceUpdate),
    showAlert: (options) => ipcRenderer.invoke('show-alert', options),
    showConfirm: (options) => ipcRenderer.invoke('show-confirm', options),
});

// main.js에서 navigate-to 이벤트를 수신하면 window에 custom event를 전달합니다.
ipcRenderer.on('navigate-to', (event, path) => {
    window.dispatchEvent(new CustomEvent('electron-navigate', { detail: path }));
});