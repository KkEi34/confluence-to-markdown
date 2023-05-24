import { Logger } from "./Logger";
import { Utils } from "./Utils";
import fs from "fs";
import path from "path";
// import ncp from  "ncp";
import ncp from "ncp";
import { Formatter } from "./Formatter";
import cheerio from "cheerio";
import exp from "constants";

describe('Formatter', function() {

  it('fixHeadline()', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 id="CodingStandards-Odsadzovanieašírkakódu"><span class="mw-headline">Odsadzovanie a šírka kódu</span></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixHeadline($content);
    expect(formatter.getText($content)).toBe('Odsadzovanie a šírka kódu');
  });

  it('fixIcon()', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<div class="confluence-information-macro confluence-information-macro-information"><span class="aui-icon aui-icon-small aui-iconfont-info confluence-information-macro-icon"></span><div class="confluence-information-macro-body"><p>čitatelnosť kódu</p></div></div>';
    let $content = formatter.load(text).root();
    expect($content.find('span.aui-icon').length).toBe(1);
    $content = formatter.fixIcon($content);
    expect(formatter.getText($content)).toBe('čitatelnosť kódu');
    expect($content.find('span.aui-icon').length).toBe(0);
  });

  it('fixEmptyLink() should remove empty link', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 class="firstHeading" id="CodingStandards-">foo<a name="HTML_v_templatech" rel="nofollow"></a></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixEmptyLink($content);
    expect($content.find('a').length).toBe(0);
  });

  it('fixEmptyLink() should keep non-empty link', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 class="firstHeading" id="CodingStandards-">foo<a name="HTML_v_templatech" rel="nofollow">bar</a></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixEmptyLink($content);
    expect($content.find('a').length).toBe(1);
  });

  it('fixEmptyLink() should remove empty heading', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 class="firstHeading" id="CodingStandards-"><a name="HTML_v_templatech" rel="nofollow"></a></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixEmptyLink($content);
    expect($content.find('a').length).toBe(0);
  });

  it('fixPreformattedText() should give php class the \<pre\> tag', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<pre class="syntaxhighlighter-pre" data-syntaxhighlighter-params="brush: php; gutter: false; theme: Confluence" data-theme="Confluence">echo "foo";</pre>';
    let $content = formatter.load(text).root();
    $content = formatter.fixPreformattedText($content);
    expect($content.find('pre').attr('class')).toBe('php');
  });

  it('fixPreformattedText() should give no class to the \<pre\> tag when no brush is set', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<pre class="syntaxhighlighter-pre" data-theme="Confluence">echo "foo";</pre>';
    let $content = formatter.load(text).root();
    $content = formatter.fixPreformattedText($content);
    expect($content.find('pre').attr('class')).toBeUndefined();
  });

  it('fixImageWithinSpan() should give ...', function() {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<pre class="syntaxhighlighter-pre" data-theme="Confluence">echo "foo";</pre>';
    let $content = formatter.load(text).root();
    $content = formatter.fixPreformattedText($content);
    expect($content.find('pre').attr('class')).toBeUndefined();
  });
});

