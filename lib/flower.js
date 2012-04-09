var colors = require("colors")
var express = require("express")
var nib = require("nib")
var stylus = require("stylus")

var log = require("./flower/log.js")

if (Error.stackTraceLimit < 100) {
  Error.stackTraceLimit = 100
}

//--------------------------------------------------------------------
// Flower’s API entry point: the Express application
//--------------------------------------------------------------------

var app = module.exports = express()
var listen_called

app.listen = (function (listen) {
  return function () {
    listen_called = true

    if (arguments.length === 0) {
      determine_port()
      listen.call(this, Number(process.env.PORT))
    } else {
      listen.apply(this, arguments)
    }

    motd()
  }
})(app.listen)

process.on("exit", function () {
  if (!listen_called) {
    log("FYI: You never called `app.listen()`.")
  }
})

function motd() {
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
  log("Please keep fresh water in your repository at all times.")
  log("")
}

function determine_port() {
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

  log("Application listening to port %s.", process.env.PORT)
  log("")
}

//--------------------------------------------------------------------
// Flower’s Stylus rendering
//--------------------------------------------------------------------

function use_stylus() {
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

//--------------------------------------------------------------------
// Flower’s default template rendering
//--------------------------------------------------------------------

app.set("views", ".")
app.set("view options", { layout: null })
app.set("index", "index")

app.response.render = (function (next) {
  return function (name) {
    log("Rendering template: `%s`", name)
    next.apply(this, arguments)
  }
})(app.response.render)

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

app.set("view engine", "jade")

//--------------------------------------------------------------------
// Flower’s middleware stack
//--------------------------------------------------------------------

app.use(express.favicon())
app.use(express.logger("dev"))
app.use(express.static("public/"))
use_stylus()
app.use(express.static("tmp/public/"))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(app.router)

app.stylus.plugins.push(nib())
