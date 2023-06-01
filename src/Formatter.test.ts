import { Logger } from "./Logger";
import { Utils } from "./Utils";
import fs from "fs";
import path from "path";
// import ncp from  "ncp";
import ncp from "ncp";
import { Formatter } from "./Formatter";
import cheerio from "cheerio";
import exp from "constants";

describe('Formatter', function () {

  it('fixHeadline()', function () {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 id="CodingStandards-Odsadzovanieašírkakódu"><span class="mw-headline">Odsadzovanie a šírka kódu</span></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixHeadline($content);
    expect(formatter.getText($content)).toBe('Odsadzovanie a šírka kódu');
  });

  it('fixIcon()', function () {
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

  it('fixEmptyLink() should remove empty link', function () {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 class="firstHeading" id="CodingStandards-">foo<a name="HTML_v_templatech" rel="nofollow"></a></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixEmptyLink($content);
    expect($content.find('a').length).toBe(0);
  });

  it('fixEmptyLink() should keep non-empty link', function () {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 class="firstHeading" id="CodingStandards-">foo<a name="HTML_v_templatech" rel="nofollow">bar</a></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixEmptyLink($content);
    expect($content.find('a').length).toBe(1);
  });

  it('fixEmptyLink() should remove empty heading', function () {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<h1 class="firstHeading" id="CodingStandards-"><a name="HTML_v_templatech" rel="nofollow"></a></h1>';
    let $content = formatter.load(text).root();
    $content = formatter.fixEmptyLink($content);
    expect($content.find('a').length).toBe(0);
  });

  it('fixPreformattedText() should give php class the \<pre\> tag', function () {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<pre class="syntaxhighlighter-pre" data-syntaxhighlighter-params="brush: php; gutter: false; theme: Confluence" data-theme="Confluence">echo "foo";</pre>';
    let $content = formatter.load(text).root();
    $content = formatter.fixPreformattedText($content);
    expect($content.find('pre').attr('class')).toBe('php');
  });

  it('fixPreformattedText() should give no class to the \<pre\> tag when no brush is set', function () {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<pre class="syntaxhighlighter-pre" data-theme="Confluence">echo "foo";</pre>';
    let $content = formatter.load(text).root();
    $content = formatter.fixPreformattedText($content);
    expect($content.find('pre').attr('class')).toBeUndefined();
  });

  it('fixImageWithinSpan() should give ...', function () {
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const text = '<pre class="syntaxhighlighter-pre" data-theme="Confluence">echo "foo";</pre>';
    let $content = formatter.load(text).root();
    $content = formatter.fixPreformattedText($content);
    expect($content.find('pre').attr('class')).toBeUndefined();
  });

  it('parse table', () => {
    const input = `
<div class="table-wrap">
  <table class="confluenceTable">
    <colgroup>
      <col/>
      <col/>
      <col/>
    </colgroup>
    <tbody>
      <tr>
        <th class="confluenceTh">heading 1</th>
        <th class="confluenceTh">heading 2</th>
        <th class="confluenceTh">heading 3</th>
      </tr>
      <tr>
        <td class="confluenceTd">cell 1.1</td>
        <td class="confluenceTd">
          <code>cell 1.2 code</code></td>
        <td class="confluenceTd">
          <br/>
        </td>
      </tr>
      <tr>
        <td class="confluenceTd">cell 2.1</td>
        <td class="confluenceTd">
          <code>cell 2.2 code</code></td>
        <td class="confluenceTd">
          <br/>
        </td>
      </tr>
      <tr>
        <td colspan="1" class="confluenceTd">cell 3.1</td>
        <td colspan="1" class="confluenceTd">
          <code>cell 3.2 code</code></td>
        <td colspan="1" class="confluenceTd">
          <br/>
        </td>
      </tr>
      <tr>
        <td colspan="1" class="confluenceTd">cell 4.1</td>
        <td colspan="1" class="confluenceTd">
          <code>cell 4.2</code></td>
        <td colspan="1" class="confluenceTd">
          <br/>
        </td>
      </tr>
      <tr>
        <td colspan="1" class="confluenceTd">cell 5.1</td>
        <td colspan="1" class="confluenceTd">
          <code>cell 5.2 code</code></td>
        <td colspan="1" class="confluenceTd">
          <code>cell 5.3 code</code></td>
      </tr>
    </tbody>
  </table>
</div>`;
    const output = `
<div class="table-wrap">
  <pre class="table">| heading 1 | heading 2 | heading 3 |
| ----|----|----|
| cell 1.1 | <code>cell 1.2 code</code> |  |
| cell 2.1 | <code>cell 2.2 code</code> |  |
| cell 3.1 | <code>cell 3.2 code</code> |  |
| cell 4.1 | <code>cell 4.2</code> |  |
| cell 5.1 | <code>cell 5.2 code</code> | <code>cell 5.3 code</code> |
</pre>
</div>`;
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    let $content = formatter.load(input).root();
    let postProcess: boolean;
    [$content, postProcess] = formatter.parseTable($content);
    expect($content.html()).toBe(output);
  });


  it('postprocess table block', () => {
    const input = `
    \`\`\` table
    | ----|----|----|
    | cell 1.1 | <code>cell 1.2 code</code> | <br> |
    | cell 2.1 | <code>cell 2.2 code</code> | <br> |
    | cell 3.1 | <code>cell 3.2 code</code> | <br> |
\`\`\``;
    const output =`
    
    | ----|----|----|
    | cell 1.1 | <code>cell 1.2 code</code> | <br> |
    | cell 2.1 | <code>cell 2.2 code</code> | <br> |
    | cell 3.1 | <code>cell 3.2 code</code> | <br> |
`;
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const result = formatter.postProcessConvertedMdTables(input);
    expect(result).toBe(output);
  });

});