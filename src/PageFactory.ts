import { Page } from "./Page";
import { Formatter } from "./Formatter";
import { Utils } from "./Utils";

export class PageFactory {
  formatter: any;
  utils: any;

  constructor(formatter: Formatter, utils: Utils) {
    this.formatter = formatter;
    this.utils = utils;
  }


  create(fullPath: any) {
    return new Page(fullPath, this.formatter, this.utils);
  }
}
