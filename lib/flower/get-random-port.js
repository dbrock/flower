#!/usr/bin/env node

var define_main = require("./util.js").define_main

module.exports = get_random_port

define_main(module, function () {
  get_random_port(function (port) {
    console.log("%d", port)
  })
})

function get_random_port(callback) {
  var server = require("net").createServer()

  server.addListener("error", error_handler)
  try_random_port()

  function try_random_port() {
    var port = get_random_iana_dynamic_port()

    server.listen(port, function () {
      callback(port)
      server.removeListener("error", error_handler)
      server.close()
    })
  }

  function error_handler(error) {
    if (error.code == "EADDRINUSE") {
      try_random_port()
    } else {
      throw error
    }
  }
}

function get_random_iana_dynamic_port() {
  return get_random_integer(0xc000, 0x10000)
}

function get_random_integer(min, max) {
  return min + Math.floor(Math.random() * (max - min))
}
