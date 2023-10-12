import { ipcMain, BrowserWindow, dialog, nativeImage } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import imageminPngquant from 'imagemin-pngquant';
import to from 'await-to-js';
import imagemin from 'imagemin';

// eslint-disable-next-line import/no-cycle
import detach, { synthesis } from './handleApng';

const tempDir = 'temp';
let rootPath = '';

export const isExists = async (filePath: string) => {
  return await fs.pathExists(filePath);
};

export const remove = async (filePath: string) => {
  const files = fs.readdirSync(filePath);
  for (let i = 0; i < files.length; i++) {
    const newPath = path.join(filePath, files[i]);
    const stat = fs.statSync(newPath);
    if (stat.isDirectory()) remove(newPath);
    else fs.unlinkSync(newPath);
  }
  fs.rmdirSync(filePath);
};

const imageCompress = (input: string, placePath: string, quality = 70) => {
  // quality = quality || 50;
  const image = nativeImage.createFromPath(input);
  const res = image.resize({
    quality: 'best',
  });
  const imageData = res.toPNG();
  const name = path.basename(input);
  fs.writeFileSync(path.resolve(placePath, name), imageData);
  return imageData;
};

/**
 * compress
 * @param imgPath
 * @param placePath
 * @returns
 */
const compress = async (imgPath: string, placePath: string) => {
  const files = await imagemin([imgPath], {
    destination: placePath,
    plugins: [
      imageminPngquant({
        quality: [0.6, 0.8],
      }),
    ],
  });

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
        await imageCompress(filePath, downloadPath);

        resolve(true);
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

  ipcMain.on('ipc-detach', async (event, filePath: string) => {
    dialog
      .showOpenDialog(browserWindow, {
        title: '选择要放置的文件夹',
        properties: ['openDirectory'],
      })
      .then(async (data) => {
        const downloadPath = data.filePaths[0];
        const [err, res] = await to(detach(filePath, downloadPath));
        if (!err) {
          event.reply('ipc-detach', {
            status: 'success',
            file: res,
          });
        } else {
          event.reply('ipc-detach', {
            status: 'error',
            message: '拆离失败',
            error: err.message,
          });
        }
      });
  });

  ipcMain.on('ipc-synthesis', async (event, filePath: string) => {
    dialog
      .showOpenDialog(browserWindow, {
        title: '选择要上传的文件夹',
        properties: ['openDirectory'],
      })
      .then(async (data) => {
        const placePath = data.filePaths[0];

        dialog
          .showOpenDialog(browserWindow, {
            title: '选择要放置的文件夹',
            properties: ['openDirectory'],
          })
          .then(async (downloadPathArr) => {
            const downloadPath = downloadPathArr.filePaths[0];
            const [err, res] = await to(synthesis(placePath, downloadPath));
            if (!err) {
              event.reply('ipc-synthesis', {
                status: 'success',
                file: res,
              });
            } else {
              event.reply('ipc-synthesis', {
                status: 'error',
                message: '合成失败',
                error: err.message,
              });
            }
          });
      });
  });
};

export default initCompressProcess;
