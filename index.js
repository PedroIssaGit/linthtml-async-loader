"use strict";

const { isString } = require("lodash");
const { defaultTo } = require("lodash");
const { escapeRegExp } = require("lodash");

const path = require("path");
const chalk = require("chalk");
const Table = require("text-table");
const linthtml = require("@linthtml/linthtml");
const stripAnsi = require("strip-ansi");

const { getOptions } = require("loader-utils");
const { cosmiconfig } = require("cosmiconfig");

const explorer = cosmiconfig("linthtml");

module.exports = linthtmlLoader;

function linthtmlError(message) {
  Error.call(this);
  this.name = "linthtmlError";
  this.message = message;
  Error.captureStackTrace(this, linthtmlError);
}

linthtmlError.prototype = Object.create(Error.prototype);
linthtmlError.prototype.constructor = linthtmlError;

function pluralize(word, count) {
  return count === 1 ? word : `${word}s`;
}

function stringLength(str) {
  return stripAnsi(str).length;
}

function renderIssue(issue) {
  if (issue.code === "E011" && issue.data.value && issue.data.format) {
    return `'${issue.data.value}' must match ${issue.data.format}`;
  } else {
    return linthtml.messages.renderIssue(issue);
  }
}

function stylish(resourcePath, issues) {
  const align = ["", "r", "c", "l"];
  const problem = "problem";
  const separator = ":line-col-separator:";
  const separatorRE = RegExp(`\\s*${escapeRegExp(separator)}\\s*`, "g");
  const separatorReplacer = chalk.white.dim(":");

  const rows = issues.map((issue) => [
    "",
    chalk.white.dim(`${issue.line}`),
    separator,
    chalk.white.dim(`${issue.line}`),
    chalk.yellow(problem),
    chalk.white(renderIssue(issue)),
    chalk.white.dim(issue.rule),
  ]);

  const header = chalk.white.underline(resourcePath);
  const table = Table(rows, { align, stringLength }).replace(
    separatorRE,
    separatorReplacer
  );
  const footer = chalk.yellow.bold(
    `\u2716 linthtml found ${issues.length} ${pluralize("problem")}`
  );
  const output = `\n${header}\n${table}\n\n${footer}\n`;

  return output;
}

function findConfig(configPath, resourcePath) {
  return isString(configPath)
    ? explorer.load(configPath)
    : explorer.search(path.dirname(resourcePath));
}

function linthtmlLoader(source) {
  const webpack = this;
  const options = defaultTo(getOptions(webpack), {});
  const callback = webpack.async();
  webpack.cacheable();

  const cwd = process.cwd();
  const shortResourcePath =
    webpack.resourcePath.indexOf(cwd) === 0
      ? webpack.resourcePath.substr(cwd.length + 1)
      : webpack.resourcePath;

  findConfig(options.config, webpack.resourcePath)
    .then((result) => {
      if (!result || !result.config) {
        throw new linthtmlError(
          `cannot find config for ${webpack.resourcePath}!`
        );
      }

      webpack.addDependency(result.filepath);
      linthtml.use(result.config.plugins || []);
      delete result.config.plugins;
      return linthtml(source, result.config.plugins || []);
    })
    .then((issues) => {
      if (issues.length !== 0) {
        const output = stylish(shortResourcePath, issues);
        const report = new linthtmlError(output);
        options.failOnProblem
          ? webpack.emitError(report)
          : webpack.emitWarning(report);
      }
    })
    .then(
      () => {
        callback(null, source);
      },
      (err) => {
        callback(err);
      }
    );
}
