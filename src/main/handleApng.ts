import parseApng from 'apng-js';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// eslint-disable-next-line import/no-cycle
import { isExists, remove } from './compress';

/**
 * blob to image
 * @param blob
 * @param outputFilePath
 */
async function blobToImage(blob: any, outputFilePath: string) {
  try {
    const buffer = await blob.arrayBuffer();
    fs.writeFileSync(outputFilePath, Buffer.from(buffer));
    console.log('图像保存成功！');
  } catch (error) {
    console.error(error);
  }
}

/**
 * detachApng to png
 * @param inputPath
 */
const detachApng = async (inputPath: string, placePath: string) => {
  const data = fs.readFileSync(inputPath);
  const anim: any = parseApng(data);
  const outputFilePaths: string[] = [];
  const uuid = uuidv4();
  const outputPath = path.resolve(placePath, uuid);

  if (!(await isExists(outputPath))) fs.ensureDirSync(outputPath);
  else await remove(outputPath);

  for (let i = 0; i < anim.frames.length; i++) {
    const outputFilePath = `${outputPath}/frame_${i}.png`;
    // eslint-disable-next-line no-await-in-loop
    await blobToImage(anim.frames[i].imageData, outputFilePath);

    outputFilePaths.push(outputFilePath);
    console.log(`Frame ${i} saved as ${outputFilePath}`);
  }

  return outputFilePaths;
};

export default detachApng;
