import cheerio from "cheerio";

import { Formatter } from "./Formatter";
import { Utils } from "./Utils";

export class Page {
  formatter: Formatter;
  utils: Utils;
  path: string;
  fileName: string;
  fileBaseName: string;
  filePlainText: string;
  $: cheerio.Root;
  content: cheerio.Cheerio;
  heading: string;
  fileNameNew: string;
  space: string;
  spacePath: string;


  constructor(fullPath: any, formatter: Formatter, utils: Utils) {
    this.formatter = formatter;
    this.utils = utils;
    this.path = fullPath;
   
    this.fileName = this.utils.getBasename(this.path);
    this.fileBaseName = this.utils.getBasename(this.path, '.html');
    this.filePlainText = this.utils.readFile(this.path);
    this.$ = this.formatter.load(this.filePlainText);
    this.content = this.$.root();
    this.heading = this.getHeading();
    this.fileNameNew = this.getFileNameNew();
    this.space = this.utils.getBasename(this.utils.getDirname(this.path));
    this.spacePath = this.getSpacePath();
  }

  getContent(): cheerio.Root {
    return this.$;
  }

  getSpacePath() {
    return '../' + this.space + '/' + this.fileNameNew;
  }


  getFileNameNew() : string{
    if (this.fileName === 'index.html') { return 'index.md'; }
    // return this.heading.replace(/[\s\\/()]/g, '_') + '.md';
    return Page.normalizeFileName(this.heading) + '.md';
  }

  static normalizeFileName(name: string): string{
    const nn = name.replace(/[\\\/()\:\;\<\?\.&]/g, '_');
    const prefixSeparator = ' - ';
    const idx = nn.indexOf(prefixSeparator);
    
    return (idx > 0 && idx < 10) ? nn.substring(idx + prefixSeparator.length)
      : nn;
  }

  getHeading() {
    const title = this.content.find('title').text();
    if (this.fileName === 'index.html') {
      return title;
    } else {
      const indexName = this.content.find('#breadcrumbs .first').text().trim();
      return title.replace(indexName + ' : ', '');
    }
  }


  /**
   * Converts HTML file at given path to MD formatted text.
   * @return {string} Content of a file parsed to MD
   */
  getTextToConvert(pages: Page[]) : [string, boolean] {
    let noteFixed = false;
    let warningFixed = false;
    let infoFixed = false;
    const fixEmptyLines = true;
    let tableParsed = false;

    let content = this.formatter.getRightContentByFileName(this.content, this.fileName);
    content = this.formatter.fixHeadline(content);
    content = this.formatter.fixIcon(content);
    content = this.formatter.fixEmptyLink(content);
    [content, noteFixed] = this.formatter.fixNotePanel(content);
    [content, warningFixed] = this.formatter.fixWarningPanel(content);
    [content, infoFixed] = this.formatter.fixInfoPanel(content);
    content = this.formatter.removeOptionalAttributesFromLink(content);
    content = this.formatter.fixEmptyHeading(content);
    content = this.formatter.fixPreformattedText(content);
    [content, tableParsed] = this.formatter.parseTable(content);
    content = this.formatter.fixImageWithinSpan(content);
    content = this.formatter.removeImgOptionalAttributes(content);
    content = this.formatter.replaceArbitraryElementsWithText(content);
    content = this.formatter.fixArbitraryClasses(content);
    content = this.formatter.fixAttachmentWraper(content);
    content = this.formatter.fixPageLog(content);
    content = this.formatter.fixLocalLinks(content, this.space, pages);
    //content = this.formatter.addPageHeading(content, this.heading);
    content = this.formatter.removePageTitle(content);

    return [this.formatter.getHtml(content), noteFixed || warningFixed || infoFixed || fixEmptyLines || tableParsed];
  }
}

