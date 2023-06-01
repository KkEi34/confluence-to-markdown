import cheerio from "cheerio";
import path from 'path';
import os from 'os';
import { link, mkdtemp } from "fs";

import { Utils } from "./Utils";
import { Page } from "./Page";
import { Logger } from "./Logger";

export class Formatter {

  utils: Utils;
  logger: Logger;

  /**
   * @param {cheerio} _cheerio Required lib
   * @param {Utils} utils My lib
   * @param {Logger} logger My lib
   */
  constructor(utils: Utils, logger: Logger) {
    this.utils = utils;
    this.logger = logger;
  }

  /**
   * @param {string} text Content of a file
   * @return {cheerio obj} Root object of a text
   */
  load(text: string): cheerio.Root {
    return cheerio.load(text);
  }


  /**
   * @param {cheerio obj} $content Content of a file
   * @return {string} Textual representation of a content
   */
  getText($content: { text: () => any; }) {
    return $content.text();
  }


  /**
   * @param {cheerio obj} $content Content of a file
   * @return {string} HTML representation of a content
   */
  getHtml($content: cheerio.Cheerio): string {
    // const $ = this._cheerio;
    const $ = cheerio;
    let contentHtml = '';
    $content.each((i, el) => {
      return contentHtml += $(el).html();
    });
    return contentHtml;
  }


  /**
   * The right content is selected based on the filename given.
   * Actual content of a page is placed elsewhere for index.html and other pages.
   * @see load() You need to load the content first.
   * @param {string} fileName Name of a file
   */
  getRightContentByFileName($content: cheerio.Cheerio, fileName: string) {
    if (fileName === 'index.html') {
      return $content.find('#content')
        .find('#main-content>.confluenceTable').remove().end(); // Removes arbitrary table located on top of index page
    } else {
      const selector = [
        '#main-content',
        '.pageSection.group:has(.pageSectionHeader>#attachments)',
        '.pageSection.group:has(.pageSectionHeader>#comments)'
      ];
      return $content.find(selector.join(', '));
    }
  }


  /**
   * Removes span inside of a h1 tag.
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixHeadline($content: cheerio.Cheerio) {
    return this._removeElementLeaveText($content, 'span.aui-icon');
  }


  addPageHeading($content: cheerio.Cheerio, headingText: any) {
    // const $ = this._cheerio;
    const $ = cheerio;
    const h1 = $('<h1>').text(headingText);
    $content.first().prepend(h1);
    return $content;
  }


  /**
   * Removes redundant icon
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixIcon($content: cheerio.Cheerio) {
    return this._removeElementLeaveText($content, 'span.aui-icon');
  }

  fixNotePanel($content: cheerio.Cheerio): [cheerio.Cheerio, boolean] {
    // const $ = this._cheerio;
    const $ = cheerio;
    let fixed = false;
    return [$content
      .find('div.panel > div.panelContent').each((i, el) => {
        if($(el).hasClass('codeContent')){
          return;
        }
        const text = $(el).html();
        $(el).parent()
          .replaceWith(`<blockquote>==!note==<br>${text}</blockquote>`);
        fixed = true;
      }).end(), fixed];
  }

  fixWarningPanel($content: cheerio.Cheerio): [cheerio.Cheerio, boolean] {
    // const $ = this._cheerio;
    const $ = cheerio;
    let fixed = false;
    return [$content
      .find('div.confluence-information-macro-note').each((i, el) => {
        const span = $(el)
          .find('span.aui-iconfont-warning')
          .first()
        if (span) {
          const text = $(el).find('div.confluence-information-macro-body').first().html();
          $(el)
            .replaceWith(`<blockquote>==!warning==<br>${text}</blockquote><p>&nbsp;</p>`);
          fixed = true;
        }
      }).end(), fixed];
  }

  fixInfoPanel($content: cheerio.Cheerio): [cheerio.Cheerio, boolean] {
    // const $ = this._cheerio;
    const $ = cheerio;
    let fixed = false;
    return [$content
      .find('div.confluence-information-macro').each((i, el) => {
        const span = $(el)
          .find('span.aui-iconfont-inf')
          .first()
        if (span) {
          const text = $(el).find('div.confluence-information-macro-body').first().html();
          $(el)
            .replaceWith(`<blockquote>==!info==<br> ${text}</blockquote>`);
          fixed = true;
        }
      }).end(), fixed];
  }


  postProcessWarningBlock(text: string): string {
    return text.replace(/==!note==/g, '[!note]');
  }
  postProcessNoteBlock(text: string): string {
    return text.replace(/==!warning==/g, '[!warning]');
  }

  postProcessInfoBlock(text: string): string {
    return text.replace(/==!info==/g, '[!info]');
  }

  postProcessEmptyLines(text: string): string {
    return text.replace(/^\s*$(?:\r\n?|\n)/gm, '');
  }

  addEolAfterQuoteBlocks(text: string): string {
    return text.replace(/(^>.*$)(?:\r\n?|\n)([^>])/gm, '$1'.concat(os.EOL, os.EOL,'$2'));
  }

  /**
   * Removes empty link
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixEmptyLink($content: cheerio.Cheerio) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find('a').each((i: any, el: any) => {
        if (
          ($(el).text().trim().length === 0)
          && ($(el).find('img').length === 0)
        ) {
          return $(el).remove();
        }
      }).end();
  }


  removeOptionalAttributesFromLink($content: cheerio.Cheerio) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find('a').each((i, el) => {
        const href = <string>$(el).attr('href');
        if (href) {
          const text = $(el).text();
          return $(el).replaceWith(`<a href="${href}">${text}</a>`);
        } else {
          return $(el).remove();
        }
      }).end();
  }

  /**
   * Removes empty heading
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixEmptyHeading($content: cheerio.Cheerio) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find(':header').each((i: any, el: any) => {
        if ($(el).text().trim().length === 0) {
          return $(el).remove();
        }
      }).end();
  }


  /**
   * Gives the right class to syntaxhighlighter
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixPreformattedText($content: cheerio.Cheerio) {
    // const $ = this._cheerio;
    //TODO:
    const $ : any = cheerio;
    return $content
      .find('pre').each((i: any, el: any) => {
        const data = $(el).data('syntaxhighlighterParams');
        $(el).attr('style', data);
        const styles = $(el).css();
        const brush = styles != null ? styles.brush : undefined;
        $(el).removeAttr('class');
        if (brush) { return $(el).addClass(brush); }
      }).end();
  }

  mapPath(node: cheerio.Cheerio, dirByPath: Map<string, string>, currentPath: string): boolean {
    // const $ = this._cheerio;
    const $ = cheerio;
    let child = node.children().first();
    let localPath = currentPath;
    let linkPath: string;
    let linkText: string;
    let isChapter = false;
    while (child.length > 0) {
      const tagName = child.prop('tagName');
      switch (tagName) {
        case 'A': {
          // const href = child.attr('href');
          // const text = child.text().replace(/[\s\\\/()\:\;\<\?\.]/g, '_').trim();
          // dirByPath.set(href, currentPath);
          // localPath = path.join(currentPath, text);
          linkPath = child.attr('href');
          linkText = Page.normalizeFileName(child.text()).trim();
        }
          break;
        case 'UL':
        case 'LI':
          {
            isChapter = this.mapPath(child, dirByPath, !linkText ? currentPath : path.join(currentPath, linkText));
          }
          break;
      }
      child = child.next();
    }

    if (linkPath) {
      dirByPath.set(linkPath, isChapter ? path.join(currentPath, linkText) : currentPath);
    }

    return !!linkPath || isChapter;
  }


  mapFileToPath(indexPage: Page, pageByPath: Map<string, Page>): Map<string, string> {
    // const $ = this._cheerio;
    const $ = cheerio;
    const toc = indexPage.getContent()('div > ul > li').first();
    const dirByPath = new Map<string, string>();
    this.mapPath(toc, dirByPath, "");

    return dirByPath;
  }

  /**
   * Fixes 'p > a > span > img' for which no image was created.
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixImageWithinSpan($content: cheerio.Cheerio) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find('span:has(img)').each((i, el) => {
        if ($(el).text().trim().length === 0) {
          return $(el).replaceWith($(el).html());
        }
      }).end();
  }

  // pandoc can't convert <img> with confluence attributes
  // remove all attributes except for 'src'
  removeImgOptionalAttributes($content: cheerio.Cheerio) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find('img').each((i, el) => {
        if ($(el).text().trim().length === 0) {
          let src = <string>$(el).attr('src');
          const queryStart = src.indexOf('?');
          if (queryStart > 0) {
            src = src.substring(0, queryStart);
          }
          return $(el).replaceWith(`<img src="${src}"/>`);
        }
      }).end();
  }

  replaceArbitraryElementsWithText($content: cheerio.Cheerio) {
    return this._removeElementLeaveText($content, 'span, .user-mention');
  }

  removePageTitle($content: cheerio.Cheerio){
    return this.removeElement($content, 'h1.title-heading');
  }


  /**
   * Removes arbitrary confluence classes.
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixArbitraryClasses($content: cheerio.Cheerio) {
    return $content
      .find('*').removeClass((i: any, e: { match: (arg0: {}) => any; }) => (
        e.match(/(^|\s)(confluence\-\S+|external-link|uri|tablesorter-header-inner|odd|even|header)/g) || []
      ).join(' ')).end();
  }


  /**
   * Removes arbitrary confluence elements for attachments.
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixAttachmentWraper($content: cheerio.Cheerio) {
    return $content
      .find('.attachment-buttons').remove().end() // action buttons for attachments
      .find('.plugin_attachments_upload_container').remove().end() // dropbox for uploading new files
      .find('table.attachments.aui').remove().end(); // overview table with useless links
  }


  /**
   * Removes arbitrary confluence elements for page log.
   * @param {cheerio obj} $content Content of a file
   * @return {cheerio obj} Cheerio object
   */
  fixPageLog($content: cheerio.Cheerio) {
    return $content
      .find('[id$="Recentspaceactivity"], [id$=Spacecontributors]').parent().remove()
      .end().end();
  }


  /**
   * Changes links to local HTML files to generated MD files.
   * @param {cheerio obj} $content Content of a file
   * @param {string} cwd Current working directory (where HTML file reside)
   * @return {cheerio obj} Cheerio object
   */
  fixLocalLinks($content: cheerio.Cheerio, space: string, pages: Page[]) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find('a').each((i, el) => {
        let pageLink: any, text: any;
        const href = $(el).attr('href');
        if (href === undefined) {
          text = $(el).text();
          $(el).replaceWith(text);
          return this.logger.debug('No href for link with text "#{text}"');
        } else if ($(el).hasClass('createlink')) {
          return $(el).replaceWith($(el).text());
        } else if (pageLink = this.utils.getLinkToNewPageFile(href, pages, space)) {
          return $(el).attr('href', pageLink);
        }
      }).end();
  }

  /**
   * @param {array} indexHtmlFiles Relative paths of index.html files from all parsed Confluence spaces
   * @return {cheerio obj} Cheerio object
   */
  createListFromArray(itemArray: string[]) {
    // const $ = this._cheerio.load('<ul>');
    const $ = cheerio.load('<ul>');
    const $ul = $('ul');
    for (let item of Array.from(itemArray)) {
      const $a = $('<a>').attr('href', item).text(item.replace('/index', ''));
      const $li = $('<li>');
      $li.append($a);
      $ul.append($li);
    }
    return $ul.end();
  }


  /**
   * Removes element by selector and leaves only its text content
   * @param {cheerio obj} $content Content of a file
   * @param {string} selector Selector of an element
   * @return {cheerio obj} Cheerio object
   */
  _removeElementLeaveText($content: cheerio.Cheerio, selector: string) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find(selector).each((i: any, el: any) => {
        return $(el).replaceWith($(el).text());
      }).end();
  }

  removeElement($content: cheerio.Cheerio, selector: string) {
    // const $ = this._cheerio;
    const $ = cheerio;
    return $content
      .find(selector).each((i: any, el: any) => {
        return $(el).remove();
      }).end();
  }

  parseTable($content: cheerio.Cheerio): [cheerio.Cheerio, boolean] {
    // const $ = this._cheerio;
    const $ = cheerio;
    let fixed = false;
    const table = $content
      .find('table')
      .each((i, el) => {
        const rows =  $(el).find('tr');
        let rowIdx = 0;
        const mdHeaders: string[] = [];
        const mdCells = [];
        let colCount: number;
        for(let r = 0; r< rows.length; r++){
          const headers = $(rows[r]).find('th');
          if(headers.length){
            let currentHeader = headers.first();
            while(currentHeader.length > 0){
              mdHeaders.push(currentHeader.html().trim());
              currentHeader = currentHeader.next();
            }
            colCount = headers.length;
          } 
          const cells = $(rows[r]).find('td');
          if(cells.length){
            if(!colCount){
              colCount = cells.length;
            } else if(cells.length != colCount){
              return [$content, false];
            }
            colCount = cells.length;
            let rowCells: string[] = [];
            let currentCell = cells.first();
            while(currentCell.length > 0) {
                rowCells.push(currentCell.html().trim().replace(/&#xA0|<br>/, ''));
                currentCell = currentCell.next();
            }
            if(rowCells.length > 0){
              mdCells.push(rowCells);
            }
          }
          rowIdx++;
        }
        if(mdCells.length || mdHeaders.length){
          let mdTable = '';
          for(let i=0; i<colCount; i++){
            mdTable += `| ${mdHeaders[i] ? mdHeaders[i] : ''} `;
          }
          mdTable += `|\n`;
          const separator = new Array<string>(colCount)
            .fill('----')
            .join('|');
          mdTable += '| ' + separator + '|\n';
          for(let i=0; i<mdCells.length; i++){
              for(let j=0; j<colCount; j++){
                mdTable += `| ${mdCells[i][j]} `;
              }
              mdTable += `|\n`;
          }
          return [$(el).replaceWith(`<pre class="table">${mdTable}</pre>`), true];
        } 
      });
    
    return [$content, false];
  }

  postProcessConvertedMdTables(text: string): string {
    const tableBlockRegEx = /`{3}\s+table((.|\n|\r)*?)`{3}/gm;
    return text.replace(tableBlockRegEx, (match, mdTable) => {
      return mdTable;
    });
  }

}
