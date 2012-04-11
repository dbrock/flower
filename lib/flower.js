var assert = require("assert")               //┃
var colors = require("colors")               //┃  Flower.js         __
var express = require("express")             //┃  ━━━━━━━━━    .-.'  '.-.
var format = require("util").format          //┃             .-(   \  /   )-.
var nib = require("nib")                     //┃            /   '..oOOo..'   \
var path = require("path")                   //┃    ,       \.--.oOO00OOo.--./
var stylus = require("stylus")               //┃    |\  ,   (   :oO0000Oo:   )
                                             //┃   _\.\/|   /'--'oOO00OOo'--'\
var advise = require("./flower/advise.js")   //┃   '-.. ;/| \   .''oOOo''.   /
var log = require("./flower/log.js")         //┃   .--`'. :/|'-(   /  \   )-'
                                             //┃    '--. `. / //'-'.__.'-;
module.exports = flower                      //┃      `'-,_';//      ,  /|
                                             //┃           '((       |\/./_
// Entry point for web apps.                 //┃             \\  . |\; ..-'
function flower() {                          //┃              \\ |\: .'`--.
  return get_app()                           //┃               \\, .' .--'
}                                            //┃                ))'_,-'`
                                             //┃          jgs  //-'
// Entry point for the `flower` CLI tool.    //┃              //
flower.__invoke__ = function () {            //┃             //
  var node = process.argv.shift()            //┃             |/
  var command = process.argv.shift()         //┃
                                             //┃                              .
  require(format(
    "./flower/%s.js", command
  )).__main__(process.argv)
}

//————————————————————————————————————————————————————————————————————
// Flower’s middleware stack and default app configuration
//————————————————————————————————————————————————————————————————————

function get_app() {
  var app = express()

  app.use(express.favicon())
  app.use(express.logger("dev"))
  app.use(express.static("public/"))
  add_script_server(app)
  add_stylus_server(app)
  app.stylus.plugins.push(nib())
  app.use(express.static("tmp/public/"))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  add_router(app)
  add_listen_advice(app)

  return app
}

//————————————————————————————————————————————————————————————————————
// Scripts
//————————————————————————————————————————————————————————————————————
function add_script_server(app) {
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
// Stylus
//————————————————————————————————————————————————————————————————————
function add_stylus_server(app) {
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

//————————————————————————————————————————————————————————————————————
// Router
//————————————————————————————————————————————————————————————————————
function add_router(app) {
  app.use(app.router)

  app.set("index", "index")
  app.set("views", ".")
  app.set("view engine", "jade")
  app.set("view options", { layout: null })

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

  advise.method(app.response, "render", function (next, name) {
    log("Rendering template: `%s`", name)
    next.same()
  })
}

//————————————————————————————————————————————————————————————————————
// `app.listen`
//————————————————————————————————————————————————————————————————————
function add_listen_advice(app) {
  var listen_called

  advise.method(app, "listen", function (next, port) {
    listen_called = true

    if (port === undefined) {
      ensure_env_port()
      next.call(this, Number(process.env.PORT), function () {
        log_startup_message(app)
      })
    } else {
      process.env.PORT = String(port)

      var args = [].slice.call(arguments)

      if (typeof args[args.length] === "function") {
        advise.method(args, args.length, function (next) {
          log_startup_message(app)
          next.same()
        })
      }

      next.apply(this, args)
    }
  })

  process.on("exit", function () {
    if (!listen_called) {
      log("!!Note:!! You never called `app.listen()`.")
    }
  })
}

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

function log_startup_message(app) {
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
