import { ipcMain } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import imageminPngquant from 'imagemin-pngquant';

const tempDir = 'temp';
const rootPath = process.cwd();

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
  // eslint-disable-next-line no-eval
  const imagemin = (await eval('import("imagemin")')).default;
  const files = await imagemin([imgPath], {
    destination: placePath,
    plugins: [
      imageminPngquant({
        quality: [0.6, 0.8],
      }),
    ],
  });

  return files;
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
const handlePlacingResources = async (filePath: string) => {
  const tempPath = await createTempDir();

  const currentPath = path.resolve(tempPath, path.basename(filePath));
  fs.copySync(filePath, currentPath);

  compress(currentPath, path.resolve(tempPath, 'compressed'));
};

ipcMain.on('ipc-upload', async (event, filePath: string) => {
  handlePlacingResources(filePath);

  event.reply('ipc-upload', {
    status: 'success',
    message: '压缩完毕',
    file: '',
  });
});
