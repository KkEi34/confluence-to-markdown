/**
 * Logger object providing several logging methods which differ by used severity
 */
export class Logger {
  static DEBUG = 1;
  static INFO =  2;
  static WARNING = 3;
  static ERROR = 4;
  _verbosityLevel: number;


  /**
   * @param {int} verbosityLevel One of defined constants.
   */
  constructor(verbosityLevel: number) {
    this._setVerbosity(verbosityLevel);
  }


  debug(msg: string) {
    return this._log(msg, Logger.DEBUG);
  }


  info(msg: string) {
    return this._log(msg, Logger.INFO);
  }


  warning(msg: string) {
    return this._log(msg, Logger.WARNING);
  }


  error(msg: string) {
    return this._log(msg, Logger.ERROR);
  }


  _setVerbosity(verbosityLevel: number) {
    const allowedVerbosityLevels = [Logger.DEBUG, Logger.INFO, Logger.WARNING, Logger.ERROR];

    if (!allowedVerbosityLevels.includes(verbosityLevel)) {
      throw new Error(`Invalid verbosity level given '${verbosityLevel}'.`);
    }

    return this._verbosityLevel = verbosityLevel;
  }


  _log(msg: any, severity: number) {
    if (severity >= this._verbosityLevel) { return console.log(msg); }
  }
}
