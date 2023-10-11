import { ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import imageminPngquant from 'imagemin-pngquant';
import to from 'await-to-js';
import imagemin from 'imagemin';

const tempDir = 'temp';
let rootPath = '';

const isExists = async (filePath: string) => {
  return await fs.pathExists(filePath);
};

const remove = async (filePath: string) => {
  const files = fs.readdirSync(filePath);
  for (let i = 0; i < files.length; i++) {
    const newPath = path.join(filePath, files[i]);
    const stat = fs.statSync(newPath);
    if (stat.isDirectory()) remove(newPath);
    else fs.unlinkSync(newPath);
  }
  fs.rmdirSync(filePath);
};

/**
 * compress
 * @param imgPath
 * @param placePath
 * @returns
 */
const compress = async (imgPath: string, placePath: string) => {
  //   const files = await imagemin([imgPath], {
  //     destination: placePath,
  //     plugins: [
  //       //   imageminPngquant({
  //       //     quality: [0.6, 0.8],
  //       //   }),
  //     ],
  //   });

  return imagemin;
};

/**
 * createTempDir
 * @returns
 */
const createTempDir = async () => {
  const tempPath = path.resolve(rootPath, tempDir);

  if (await isExists(tempPath)) {
    await remove(tempPath);
  }

  fs.ensureDirSync(tempPath);

  return tempPath;
};

/**
 * handlePlacingResources
 * @param filePath
 */
const handlePlacingResources = async (
  filePath: string,
  browserWindow: BrowserWindow,
) => {
  return new Promise((resolve, reject) => {
    dialog
      .showOpenDialog(browserWindow, {
        title: '选择下载路径',
        properties: ['openDirectory'],
      })
      .then(async (data) => {
        const downloadPath = data.filePaths[0];
        const compressedPath = await compress(filePath, downloadPath);

        resolve(compressedPath);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const initCompressProcess = (browserWindow: BrowserWindow) => {
  const compressedPath = '';
  ipcMain.on('ipc-upload', async (event, filePath: string) => {
    rootPath = path.dirname(filePath);
    const [err, res] = await to(
      handlePlacingResources(filePath, browserWindow),
    );

    if (!err) {
      event.reply('ipc-upload', {
        status: 'success',
        message: res,
        file: compressedPath,
      });
    } else {
      event.reply('ipc-upload', {
        status: 'error',
        message: '压缩失败',
        error: err.message,
      });
    }
  });

  ipcMain.on('ipc-download', async (event) => {
    // eslint-disable-next-line promise/catch-or-return
    dialog
      .showOpenDialog(browserWindow, {
        title: '选择下载路径',
        properties: ['openDirectory'],
      })
      // eslint-disable-next-line promise/always-return
      .then((data) => {
        const downloadPath = data.filePaths[0];
        fs.copy(
          compressedPath,
          path.resolve(downloadPath, path.basename(compressedPath)),
        ).then(() => {
          event.reply('ipc-download', {
            status: 'success',
            message: '下载完毕完毕',
          });
        });
      });
  });
};

export default initCompressProcess;
