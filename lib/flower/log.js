#!/usr/bin/env node

var advise = require("./advise.js")
var apply = require("./util.js").apply
var colors = require("colors")
var define_main = require("./util.js").define_main
var format = require("util").format
var inspect = require("util").inspect

module.exports = log

//————————————————————————————————————————————————————————————————————
// Command-line interface
//————————————————————————————————————————————————————————————————————

define_main(module, function (args) {
  if (/^(-e|--error)$/.test(args[0])) {
    apply(log.error, args.slice(1))
  } else if (/^(-w|--warn)$/.test(args[0])) {
    apply(log.warn, args.slice(1))
  } else {
    apply(log, args)
  }
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
      console.log("%s  %s", get_random_flower(), colorize(line))
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

//————————————————————————————————————————————————————————————————————

var colorize = function (string) { return string }

function define_style(regexp, handler) {
  colorize = advise(colorize, function (next, string) {
    return next(string.replace(regexp, handler))
  })
}

function get_random_flower() {
  var color = pick(flower_colors)
  var flower = pick(flowers)

  return colors.green("—«—") + colors[color](flower)

  function pick(array) {
    return array[line_index % array.length]
  }
}

//————————————————————————————————————————————————————————————————————
// Configuration
//————————————————————————————————————————————————————————————————————

var flowers = "❀✽✾✿❃❋".split("")
var flower_colors = ["red", "blue", "yellow"]

// URLs:  "<http://example.com>"
define_style(/<([^>]+:.+?)>/g, function (match, url) {
  return colors.blue(colors.underline(url))
})

// Warnings:  "!!Note:!! foo bar"
define_style(/!!(.+?)!!/g, function (match, warning) {
  return colors.bold(colors.red(warning))
})

// Code & Code blocks:  "`foo.bar = baz`",  "``what`ever``"
define_style(/`([^`]+)`|``(.+?)``/g, function (match, code, block) {
  return code ? colors.bold(code) : colors.grey(block)
})
