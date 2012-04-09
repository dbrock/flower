#!/usr/bin/env node

module.exports = get_real_name

function get_real_name() {
  require("child_process").exec("finger `whoami`", function (error, stdout) {
    if (error) {
      throw error
    } else {
      console.log(stdout.replace(/[\s\S]*\bName: (.*)[\s\S]*/, "$1"))
    }
  })
}

if (module === require.main) {
  get_real_name(function (name) {
    console.log("%s", name)
  })
}
