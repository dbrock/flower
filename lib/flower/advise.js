module.exports = advise

function advise(fn, wrapper) {
  return function () {
    var context = this
    var args = [].slice.call(arguments)

    function next() {
      return fn.apply(this, arguments)
    }

    next.same = function () {
      return fn.apply(context, args)
    }

    return wrapper.apply(this, [next].concat(args))
  }
}

advise.method = function (object, name, wrapper) {
  object[name] = advise(object[name], wrapper)
}
