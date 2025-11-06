const chalk = require('chalk');

class Logger {
  static info(message, ...args) {
    console.log(chalk.blue('[INFO]'), message, ...args);
  }

  static success(message, ...args) {
    console.log(chalk.green('[SUCCESS]'), message, ...args);
  }

  static warning(message, ...args) {
    console.log(chalk.yellow('[WARNING]'), message, ...args);
  }

  static error(message, ...args) {
    console.error(chalk.red('[ERROR]'), message, ...args);
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), message, ...args);
    }
  }

  static query(sql, duration) {
    console.log(
      chalk.magenta('[QUERY]'),
      chalk.gray(`(${duration}ms)`),
      sql.substring(0, 100) + (sql.length > 100 ? '...' : '')
    );
  }
}

module.exports = Logger;

