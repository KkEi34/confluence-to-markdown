import { Logger } from "./Logger";
import { Utils } from "./Utils";
import fs from "fs";
import path from "path";
// import ncp from  "ncp";
import ncp from "ncp";
import { Formatter } from "./Formatter";
import cheerio from "cheerio";
import { App } from "./App";
import { PageFactory } from "./PageFactory";
import { Options } from "./options";

describe('App', function() {

  it.skip('testing run few', function() {
    const pathResource = path.join(__dirname, 'assets/few');
    const pathResult = path.join(__dirname, 'few/Markdown');
    try{
      fs.statSync(pathResult);
      fs.rmdirSync(pathResult);
    }
    catch(err){}

    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const pageFactory = new PageFactory(formatter, utils);
    const options = new Options();
    const app = new App(utils, formatter, pageFactory, logger, options)
    return app.convert(pathResource, pathResult);
  });


  it.skip('testing run all', function() {
    const pathResource = path.join(__dirname, 'assets/all');
    const pathResult = path.join(__dirname, 'all/Markdown');
    try{
      fs.statSync(pathResult);
      fs.rmdirSync(pathResult);
    }
    catch(err){}
    const logger = new Logger(Logger.WARNING);
    const utils = new Utils();
    const formatter = new Formatter(utils, logger);
    const pageFactory = new PageFactory(formatter, utils);
    const options = new Options();
    const app = new App(utils, formatter, pageFactory, logger, options)
    return app.convert(pathResource, pathResult);
  });
});
