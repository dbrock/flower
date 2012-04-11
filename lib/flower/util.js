var format = require("util").format

exports.apply = function (fn) {
  var args = [].slice.call(arguments, 1)

  fn.apply(null, args.concat(args.pop()))
}

exports.define_main = function (module, fn) {
  module.exports.__main__ = fn

  if (module === require.main) {
    fn(process.argv.slice(2))
  }
}

exports.inflect = function (n, singular, plural) {
  return n === 1 ? singular : format(plural, n)
}
