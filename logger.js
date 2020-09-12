const chalk = require('chalk');

const SEVERITY = Object.freeze({ ERROR: 0, WARNING: 1, INFO: 2, DEBUG: 3 });

/**
 * Log a message in a prettier way.
 *
 * @param {String} message Message to log to console
 * @param {SEVERITY} severity Severity of the log
 */
function Log(message, severity = SEVERITY.INFO) {
  /** @type {String} */
  let msg = message;
  /** @type {SEVERITY} */
  let sev = severity;
  /** @type {Function} */
  let sevColor;
  /** @type {String} */
  let type;

  if (!Object.values(SEVERITY).includes(severity)) {
    sev = SEVERITY.INFO;
  }

  switch (sev) {
    case SEVERITY.ERROR:
      sevColor = chalk.bgRedBright.black;
      type = ' ERROR ';
      break;

    case SEVERITY.WARNING:
      sevColor = chalk.bgYellow.black;
      type = 'WARNING';
      break;

    default:
    case SEVERITY.INFO:
      sevColor = chalk.bgBlue.white;
      type = '  INFO ';
      break;

    case SEVERITY.DEBUG:
      sevColor = chalk.bgWhite.black;
      type = ' DEBUG ';
      break;
  }

  console.log(`${TimestampString()} |${sevColor(` ${type} `)}| ${msg}`);
}

function TimestampString() {
  const d = new Date();

  return chalk.gray(
    `${Pad(d.getUTCFullYear())}-${Pad(d.getUTCMonth())}-${Pad(d.getUTCDate())} ${Pad(d.getUTCHours())}:${Pad(d.getUTCMinutes())}:${Pad(
      d.getUTCSeconds()
    )}.${Pad(d.getUTCMilliseconds(), 4)}`
  );
}

/**
 * Pad the start of a string/number with a 0
 *
 * @param {String|Number} s string
 * @param {Number=2} l number of chars
 * @returns {String}
 */
function Pad(s, l = 2) {
  return s.toString().padStart(l, '0');
}

module.exports = Log;
module.exports.SEVERITY = SEVERITY;
