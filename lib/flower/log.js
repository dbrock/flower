#!/usr/bin/env node

var colors = require("colors")
var format = require("util").format

module.exports = log

var line_index = 0

function log() {
  var string = format.apply(null, arguments)

  string.split("\n").forEach(function (line) {
    if (/\S/.test(line)) {
      ++line_index
      console.log("%s  %s", get_flower(), colorize(line))
    } else {
      console.log("")
    }
  })
}

function colorize(string) {
  return colorize_urls(colorize_code(colorize_warnings(string)))
}

function colorize_urls(string) {
  return string.replace(/<([^>]+:.+?)>/g, function (match, url) {
    return colors.blue(colors.underline(url))
  })
}

function colorize_warnings(string) {
  return string.replace(/!!(.+?)!!/g, function (match, warning) {
    return colors.bold(colors.red(warning))
  })
}

function colorize_code(string) {
  return string.replace(/`([^`]+)`|``(.+?)``/g, function (match, code, block) {
    return code ? colors.bold(code) : colors.grey(block)
  })
}

function get_flower() {
  return colors.green("—«—") + colors[
    ["red", "yellow", "blue", "magenta"][line_index % 4]
  ]("❀✽✾✿❁❃❋".charAt(line_index % 7))
}

log.error = function () {
  log.warn.apply(null, ["Error:"].concat(arguments))
}

log.warn = function (prefix) {
  log("!!%s!! %s", prefix, (
    format.apply(null, [].slice.call(arguments, 1))
  ))
}

log.inflect = function (n, singular, plural) {
  return n === 1 ? singular : format(plural, n)
}

if (module === require.main) {
  line_index = Math.floor(Math.random() * 1000)

  if (/^(-e|--error)$/.test(process.argv[2])) {
    log.error.apply(null, process.argv.slice(3))
  } else if (/^(-w|--warn)$/.test(process.argv[2])) {
    log.warn.apply(null, process.argv.slice(3))
  } else {
    log.apply(null, process.argv.slice(2))
  }
}
