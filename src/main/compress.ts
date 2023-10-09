import { ipcMain } from 'electron';

ipcMain.on('ipc-upload', async (event, arg) => {
  console.log('ipc-upload', arg);
  console.log(process.cwd());
  // event.reply('ipc-upload', 'pong');
});
