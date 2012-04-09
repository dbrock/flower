#!/usr/bin/env node

var colors = require("colors")
var format = require("util").format

var advise = require("./advise.js")

module.exports = log

//————————————————————————————————————————————————————————————————————
// Configuration
//————————————————————————————————————————————————————————————————————

var flowers = "❀✽✾✿❃❋".split("")
var flower_colors = ["red", "blue", "yellow"]

define_colorization(/<([^>]+:.+?)>/g, function (match, url) {
  return colors.blue(colors.underline(url))
})

define_colorization(/!!(.+?)!!/g, function (match, warning) {
  return colors.bold(colors.red(warning))
})

define_colorization(/`([^`]+)`|``(.+?)``/g, function (match, code, block) {
  return code ? colors.bold(code) : colors.grey(block)
})

//————————————————————————————————————————————————————————————————————
// Implementation
//————————————————————————————————————————————————————————————————————

var line_index = Math.floor(Math.random() * 1000)

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
  if (/^(-e|--error)$/.test(process.argv[2])) {
    log.error.apply(null, process.argv.slice(3))
  } else if (/^(-w|--warn)$/.test(process.argv[2])) {
    log.warn.apply(null, process.argv.slice(3))
  } else {
    log.apply(null, process.argv.slice(2))
  }
}

//————————————————————————————————————————————————————————————————————

function colorize(string) {
  return string
}

function define_colorization(regexp, handler) {
  colorize = advise(colorize, function (next, string) {
    return next(string.replace(regexp, handler))
  })
}

function line_item(array) {
  return array[line_index % array.length]
}

function get_flower() {
  var color = line_item(flower_colors)
  var flower = line_item(flowers)

  return colors.green("—«—") + colors[color](flower)
}
