import path from 'path';

import {Formatter} from './Formatter';
import { Logger } from './Logger';
import { Utils } from './Utils';
import { PageFactory } from './PageFactory';
import { App } from './App';
import { Options } from './options';


export class Bootstrap {
    /**
     * @param {string} pathResource Directory with HTML files or one file. Can be nested.
     * @param {string|void} pathResult Directory where MD files will be generated to. Current dir will be used if none given.
     */
    run(pathResource: string, pathResult: string, options: Options | undefined = undefined) {
      if (pathResult == null) { pathResult = ''; }
      pathResource = path.resolve(pathResource);
      pathResult = path.resolve(pathResult);

      const logger = new Logger(Logger.INFO);
      const utils = new Utils();
      const formatter = new Formatter(utils, logger);
      const pageFactory = new PageFactory(formatter, utils);

      const app = new App(utils, formatter, pageFactory, logger, options ?? new Options());

      logger.info('Using source: ' + pathResource);
      logger.info('Using destination: ' + pathResult);

      return app.convert(pathResource, pathResult);
    }
}
