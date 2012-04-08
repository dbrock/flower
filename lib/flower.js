var colors = require("colors")
var express = require("express")
var format = require("util").format
var nib = require("nib")
var stylus = require("stylus")

if (Error.stackTraceLimit < 100) {
  Error.stackTraceLimit = 100
}

var listen_called

process.on("exit", function () {
  if (!listen_called) {
    log("You never called `app.listen()`.")
  }
})

var log_i = 0

function log() {
  if (arguments.length === 0) {
    console.log("")
  } else {
    var string = format.apply(null, arguments)

    string.split("\n").forEach(function (line) {
      if (/\S/.test(line)) {
        console.log("%s  %s", (
          colors.green("——;—{") + colors[
            ["red", "yellow", "blue", "magenta"][log_i++ % 4]
          ]("@")
        ), line)
      } else {
        console.log("")
      }
    })
  }
}

function log_error() {
  log("%s %s", colors.bold(colors.red("Error:")), (
    format.apply(null, arguments)
  ))
}

//--------------------------------------------------------------------
// Flower’s API entry point: the Express application
//--------------------------------------------------------------------

var app = module.exports = express()

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

function motd() {
  log("Your HTML authoring language is Jade:")
  log("  %s", colors.blue(colors.underline(
    "https://github.com/visionmedia/jade"
  )))
  log("Your CSS authoring language is Stylus:")
  log("  %s", colors.blue(colors.underline(
    "http://learnboost.github.com/stylus/"
  )))
  log("CSS3 vendor prefixes are inserted transparently by Nib:")
  log("  %s", colors.blue(colors.underline(
    "http://visionmedia.github.com/nib/"
  )))

  if (!app.stylus.use.called) {
    log()
    log("To add another Stylus plugin, do this:")
    log("  %s", colors.grey('app.stylus.use(plugin)'))
  }

  log()
  log("Please keep your repository filled with fresh water at all times.")
  log()
}

function inflect_number(n, singular, plural) {
  return n === 1 ? singular : format(plural, n)
}

function determine_port() {
  if (!process.env.PORT) {
    try {
      process.env.PORT = require("fs").readFileSync(".port")
    } catch (error) {
      log_error("$PORT or `.port` (or argument) needed for `app.listen()`")
      log("\
\n\
We need to decide which port this app should listen on.\n\
In production, the platform (e.g. Heroku) will set $PORT for us.\n\
In development, it is convenient to use the `.port` file.\n\
\n\
Use `flower pick-port` to have Flower generate `.port` for you.\n\
Use `flower pow` to link to Sam Stephenson’s Pow (<http://pow.cx>).")
      process.exit(-1)
    }
  }

  process.env.PORT = String(Number(process.env.PORT))

  log("Flower app listening to port %s.", process.env.PORT)
  log()
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
    log("Rendering template ‘%s’.", colors.bold(name))
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
    render(request, response, name)
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
