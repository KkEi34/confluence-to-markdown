import { Page } from "./Page";
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';

export class Utils {
  logger: any;

  mkdirSync(path: string) {
    this.logger.debug("Making dir: " + path);
    try {
      return fs.mkdirSync(path);
    } catch (e) {
      if (e.code !== 'EEXIST') { throw e; }
    }
  }

  /**
   * Checks if given file exists and is a file.
   * @param {string} filePath Absolute/relative path to a file
   * @param {string|void} cwd Current working directory against which the path is built.
   * @return {bool}
   */
  isFile(filePath: string, cwd: string = null) {
    let stat: { isFile: () => any; };
    if (cwd == null) { cwd = ''; }
    const pathFull = path.resolve(cwd, filePath);
    return fs.existsSync(pathFull) 
      && ((stat = fs.statSync(pathFull)) && stat.isFile());
  }


  /**
   * Checks if given directory exists and is a directory.
   * @param {string} dirPath Absolute/relative path to a directory
   * @param {string|void} cwd Current working directory against which the path is built.
   * @return {bool}
   */
  isDir(dirPath: any, cwd: string = null) {
    let stat: { isDirectory: () => any; };
    if (cwd == null) { cwd = ''; }
    const pathFull = path.resolve(cwd, dirPath);
    return fs.existsSync(pathFull) 
      && ((stat = fs.statSync(pathFull)) && stat.isDirectory());
  }


  /**
   * Return list of files (and directories) in a given directory.
   * @param {string} dirPath Absolute path to a directory.
   * @param {bool|void} filesOnly Whether to return only files.
   * @return {array}
   */
  readDirRecursive(dirPath: string, filesOnly: boolean = true) : string[] {
    if (filesOnly == null) { filesOnly = true; }
    const fullPaths = [];
    if (this.isFile(dirPath)) { return [dirPath]; }
    for (let fileName of Array.from(fs.readdirSync(dirPath))) {
      const fullPath = path.join(dirPath, fileName);
      if (this.isFile(fullPath)) {
        fullPaths.push(fullPath);
      } else {
        if (!filesOnly) { fullPaths.push(fullPath); }
        fullPaths.push(...Array.from(this.readDirRecursive(fullPath, filesOnly) || []));
      }
    }
    return fullPaths;
  }


  getBasename(filePath: string, extension: string = undefined) : string {
    return path.basename(filePath, extension);
  }


  getDirname(dirPath: string) {
    return path.dirname(dirPath);
  }


  readFile(path: string) {
    return fs.readFileSync(path, 'utf8');
  }


  getLinkToNewPageFile(href: string, pages: Page[], space: string) {
    let matches: {};
    let page: Page;
    const fileName = this.getBasename(href);

    // relative link to file
    if (fileName.endsWith('.html')) {
      const baseName = fileName.replace('.html', ''); // gitit requires link to pages without .md extension
      for (page of [...pages]) {
        if (baseName === page.fileBaseName) {
          if (space === page.space) {
            return page.fileNameNew.replace('.md', ''); // gitit requires link to pages without .md extension
          } else {
            return page.spacePath.replace('.md', ''); // gitit requires link to pages without .md extension
          }
        }
      }

    // link to confluence pageId
    } else if (matches = href.match(/.*pageId=(\d+).*/)) {
      const pageId = matches[1];
      for (page of [...pages]) {
        if (pageId === page.fileBaseName) {
          return page.spacePath.replace('.md', ''); // gitit requires link to pages without .md extension
        }
      }

    // link outside
    } else {
      return undefined;
    }
  }


  /**
   * Copies assets directories to path with MD files
   * @param {string} fullInPath Absolute path to file to convert
   * @param {string} dirOut Directory where to place converted MD files
   */
  copyAssets(pathWithHtmlFiles: string, dirOut: string) {
    return (() => {
      const result = [];
      for (let asset of ['images', 'attachments']) {
        const assetsDirIn = path.join(pathWithHtmlFiles, asset);
        const assetsDirOut = path.join(dirOut, asset);
        if (this.isDir(assetsDirIn)) { result.push(ncp(assetsDirIn, assetsDirOut)); } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}