var colors = require("colors")
var express = require("express")
var format = require("util").format
var nib = require("nib")
var path = require("path")
var stylus = require("stylus")

var advise = require("./flower/advise.js")
var log = require("./flower/log.js")

if (Error.stackTraceLimit < 100) {
  Error.stackTraceLimit = 100
}

//————————————————————————————————————————————————————————————————————
// Flower’s middleware stack
//————————————————————————————————————————————————————————————————————

var app = module.exports = express()

app.use(express.favicon())
app.use(express.logger("dev"))
app.use(express.static("public/"))
use_script_server()
use_stylus_server()
app.stylus.plugins.push(nib())
app.use(express.static("tmp/public/"))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(app.router)


//————————————————————————————————————————————————————————————————————
// Flower wraps `app.listen` to add a couple of features.
//————————————————————————————————————————————————————————————————————

var listen_called

advise.method(app, "listen", function (next, port) {
  listen_called = true

  if (port === undefined) {
    ensure_env_port()
    next.call(this, Number(process.env.PORT), log_startup_message)
  } else {
    process.env.PORT = String(port)

    var args = [].slice.call(arguments)

    if (typeof args[args.length] === "function") {
      advise.method(args, args.length, function (next) {
        log_startup_message()
        next.same()
      })
    }

    next.apply(this, args)
  }
})

function log_startup_message() {
  log("Your HTML authoring language is Jade:")
  log("  <https://github.com/visionmedia/jade>")
  log("Your CSS authoring language is Stylus:")
  log("  <http://learnboost.github.com/stylus/>")
  log("Nib teaches Stylus some extra CSS3 tricks:")
  log("  <http://visionmedia.github.com/nib/>")

  if (!app.stylus.use.called) {
    log("")
    log("To add another Stylus plugin, do this:")
    log("  %s", colors.grey('app.stylus.use(plugin)'))
  }

  log("")
  log("Your Flower application is now listening to port %s.", process.env.PORT)
  log("Please keep fresh water in your repository at all times.")
  log("")
}

process.on("exit", function () {
  if (!listen_called) {
    log("!!Note:!! You never called `app.listen()`.")
  }
})

function ensure_env_port() {
  if (!process.env.PORT) {
    try {
      process.env.PORT = require("fs").readFileSync(".port")
    } catch (error) {
      log("")
      log.error("`$PORT` or `./.port` (or argument) needed for `app.listen()`")
      log("")
      log("We need to decide which port this app should listen on.")
      log("In production, the platform (e.g. Heroku) will set `$PORT` for us.")
      log("In development, it is convenient to use the `./.port` file,")
      log("especially on OS X in conjunction with Pow 0.4 (<http://pow.cx>).")
      log("")
      log("↪ Use `flower pow` to generate `./port` and link to Pow 0.4.")
      log("↪ Use `flower pick-port` to just generate `./.port`.")
      log("")
      process.exit(-1)
    }
  }

  process.env.PORT = String(Number(process.env.PORT))
}


//————————————————————————————————————————————————————————————————————
// Flower’s Stylus rendering
//————————————————————————————————————————————————————————————————————

function use_stylus_server() {
  app.stylus = {
    plugins: [],
    use: function (plugin) {
      this.use.called = true
      this.plugins.push(plugin)
    }
  }

  app.use(stylus.middleware({
    src: ".",
    dest: "tmp/public",
    compile: function (code, path) {
      var renderer = stylus(code).set("filename", path)

      //// XXX: This prevents usage of absolute URLs.
      // renderer.define("url", stylus.url({ paths: ["public/"] }))

      // Make `flower.styl` available for import.
      renderer.include(__dirname)

      app.stylus.plugins.forEach(function (plugin) {
        renderer.use(plugin)
      })

      return renderer
    }
  }))
}

function if_require(name, then, otherwise) {
  var value, ok

  try {
    value = require(name)
    ok = true
  } catch (error) {
  }

  if (ok) {
    then(value)
  } else {
    otherwise()
  }
}


//————————————————————————————————————————————————————————————————————
// Flower’s `/foo.js` => `./foo.script.js` mapping
//————————————————————————————————————————————————————————————————————

function use_script_server() {
  app.use(function (request, response, next) {
    if (/(.*)\.js$/.test(request.path)) {
      var filename = request.path.substring(1).replace(/\.js$/, ".script.js")

      path.exists(filename, function (exists) {
        if (exists) {
          response.sendfile(filename)
        } else {
          next()
        }
      })
    } else {
      next()
    }
  })
}

//————————————————————————————————————————————————————————————————————
// Flower’s default template rendering
//————————————————————————————————————————————————————————————————————

app.set("view engine", "jade")

app.set("views", ".")
app.set("view options", { layout: null })
app.set("index", "index")

advise.method(app.response, "render", function (next, name) {
  log("Rendering template: `%s`", name)
  next.same()
})

app.get("/", function (request, response) {
  response.render(app.get("index"))
})

app.get("/:name", function (request, response, next) {
  var name = request.params.name

  if (~name.indexOf(".")) {
    next()
  } else {
    response.render(name)
  }
})
