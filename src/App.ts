
import fs, { mkdir } from "fs";
import exec from 'sync-exec';
import path from 'path';
import mkdirp from 'mkdirp';

import { Formatter } from "./Formatter";
import { Logger } from "./Logger";
import { Page } from "./Page";
import { PageFactory } from "./PageFactory";
import { Utils } from "./Utils";

export class App {
  static outputTypesAdd = [
    // problems with gfm:
    //  - code blocks are not rendered
     //"gfm"

    'markdown_github', // use GitHub markdown variant
    //'blank_before_header', // insert blank line before header
    //    'mmd_link_attributes' # use MD syntax for images and links instead of HTML
    // 'link_attributes' // use MD syntax for images and links instead of HTML
  ];
  static outputTypesRemove = [];
  static extraOptions = [
    //'--markdown-headings=atx', // Setext-style headers (underlined) | ATX-style headers (prefixed with hashes)
    '--wrap=none'
  ];
  
  utils: Utils;
  formatter: Formatter;
  pageFactory: PageFactory;
  logger: Logger;
  
  pandocOptions: string;

  /**
   * @param {fs} _fs Required lib
   * @param {sync-exec} _exec Required lib
   * @param {path} _path Required lib
   * @param {mkdirp} _mkdirp Required lib
   * @param {Utils} utils My lib
   * @param {Formatter} formatter My lib
   * @param {PageFactory} pageFactory My lib
   * @param {Logger} logger My lib
   */
  constructor(utils: Utils, formatter: any, pageFactory: PageFactory, logger: any) {


    // // @link http://hackage.haskell.org/package/pandoc For options description
    // App.outputTypesAdd = [
    //   'markdown_github', // use GitHub markdown variant
    //   'blank_before_header', // insert blank line before header
    //   //    'mmd_link_attributes' # use MD syntax for images and links instead of HTML
    //   'link_attributes' // use MD syntax for images and links instead of HTML
    // ];

    // App.outputTypesRemove = [
    // ];

    // App.extraOptions = [
    //   '--atx-headers' // Setext-style headers (underlined) | ATX-style headers (prefixed with hashes)
    // ];

    this.utils = utils;
    this.formatter = formatter;
    this.pageFactory = pageFactory;
    this.logger = logger;
    const typesAdd = App.outputTypesAdd.join('+');
    let typesRemove = App.outputTypesRemove.join('-');
    typesRemove = typesRemove ? '-' + typesRemove : '';
    const types = typesAdd + typesRemove;
    this.pandocOptions = [
      types ? '-t ' + types : '',
      App.extraOptions.join(' ')
    ].join(' ');
  }


  /**
   * Converts HTML files to MD files.
   * @param {string} dirIn Directory to go through
   * @param {string} dirOut Directory where to place converted MD files
   */
  convert(dirIn: string, dirOut: string) {
    this.logger.info('Parsing files ...');
    const filePaths = this.utils.readDirRecursive(dirIn);
    this.logger.info(`Found ${filePaths.length} files`);
    let indexPage : Page;
    const pageByPath = new Map<string, Page>();
    const pages = ((() => {
      const result : Page[] = [];
      for (let filePath of Array.from(filePaths)) {
        if (filePath.endsWith('.html')) {
          const page = this.pageFactory.create(filePath)
          // result.push(this.pageFactory.create(filePath));
          result.push(page);
          pageByPath.set(page.fileName, page);
          if(page.fileName === "index.html"){
            indexPage = page;
          }
        }
      }
      return result;
    })());
 
    const dirByPath = this.formatter.mapFileToPath(indexPage, pageByPath);
    dirByPath.set("index.html", "");
 
    const indexHtmlFiles = [];
    // for (let page of Array.from(pages)) {
    for (let page of pages) {
      (page => {
        if (page.fileName === 'index.html') {
          //TODO:
          // right now just skip index
          return;
          //indexHtmlFiles.push(path.join(page.space, 'index')); // gitit requires link to pages without .md extension
        }
        
        // return this.convertPage(page, dirIn, dirOut, pages);
        return this.convertPage(page, dirIn, dirOut, pages, dirByPath);
      })(page);
    }

    
    //TODO:
    //if (!this.utils.isFile(dirIn)) { this.writeGlobalIndexFile(indexHtmlFiles, dirOut); }
    return this.logger.info('Conversion done');
  }

  /**
   * Converts HTML file at given path to MD.
   * @param {Page} page Page entity of HTML file
   * @param {string} dirOut Directory where to place converted MD files
   */
  convertPage(page: Page, dirIn: string, dirOut: string, pages: Page[], dirByPath: Map<string, string>) {
    this.logger.info('Parsing ... ' + page.path);
    const [text, requiredPostProcessing] = page.getTextToConvert(pages);
    const fullOutFileName = path.join(dirOut, page.space, dirByPath.get(page.fileName), page.fileNameNew);

    this.logger.info('Making Markdown ... ' + fullOutFileName);
    this.writeMarkdownFile(text, fullOutFileName, requiredPostProcessing);
    // this.utils.copyAssets(this.utils.getDirname(page.path), this.utils.getDirname(fullOutFileName));
    this.utils.copyAssets(this.utils.getDirname(page.path), dirOut);
    return this.logger.info('Done\n');
  }


  /**
   * @param {string} text Makdown content of file
   * @param {string} fullOutFileName Absolute path to resulting file
   * @return {string} Absolute path to created MD file
   */
  writeMarkdownFile(text: string, fullOutFileName: string, requiredPostProcessing = false) {
    const fullOutDirName = this.utils.getDirname(fullOutFileName);
    mkdirp.sync(fullOutDirName, function (error: any) {
      if (error) {
        return this.logger.error('Unable to create directory #{fullOutDirName}');
      }
    });

    const tempInputFile = fullOutFileName + '~';
    fs.writeFileSync(tempInputFile, text, { flag: 'w' });
    const command = `pandoc -f html ${this.pandocOptions} -o "${fullOutFileName}" "${tempInputFile}"`;
    const out = exec(command, { cwd: fullOutDirName });
    if (out.status > 0) { this.logger.error(out.stderr); }

  
    if(requiredPostProcessing){
      let text = fs.readFileSync(fullOutFileName, 'utf8');
      text = this.formatter.postProcessNoteBlock(text);
      text = this.formatter.postProcessWarningBlock(text);
      text = this.formatter.postProcessInfoBlock(text);
      text = this.formatter.postProcessEmptyLines(text);
      text = this.formatter.addEolAfterQuoteBlocks(text);
      text = this.formatter.postProcessConvertedMdTables(text);
      
      fs.writeFileSync(fullOutFileName, text, {flag: 'w'});
    }
    
    // return this._fs.unlink(tempInputFile);
    fs.unlinkSync(tempInputFile);
  }


  /**
   * @param {array} indexHtmlFiles Relative paths of index.html files from all parsed Confluence spaces
   * @param {string} dirOut Absolute path to a directory where to place converted MD files
   */
  writeGlobalIndexFile(indexHtmlFiles: string[], dirOut: string) {
    const globalIndex = path.join(dirOut, 'index.md');
    const $content = this.formatter.createListFromArray(indexHtmlFiles);
    const text = this.formatter.getHtml($content);
    return this.writeMarkdownFile(text, globalIndex);
  }
}
