Error.stackTraceLimit = Infinity

function log() {
  console.log("%s", format.apply(null, arguments))
}

var format = require("util").format
var fs = require("fs")
var http = require("http")

var PORT = Number(process.env.PORT || fs.readFileSync(".port"))

var express = require("express")
var stylus = require("stylus")
var nib = require("nib")
var normalize = require("normalize")

var app = express()
var public_path = ["tmp/public", "public/", "vendor/public/"]

app.use(express.favicon())
app.use(express.logger("dev"))
app.use(get_stylus_middleware())

public_path.forEach(function (path) {
  app.use(express.static(path))
})

app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(app.router)

app.set("view engine", "jade")
app.set("views", ".")
app.set("view options", { layout: null })

function get_stylus_middleware() {
  return stylus.middleware({
    src: ".", dest: "tmp/public",
    compile: function (code, path) {
      return stylus(code)
        .set("filename", path)
        .define("url", stylus.url({ paths: public_path }))
        .use(nib())
        .use(normalize())
        .include(__dirname)
      ;
    }
  })
}

app.get("/", function (request, response) {
  response.render("index")
})

app.get("/:name", function (request, response) {
  log("what " + request.params.name)
  response.render(request.params.name)
})

log_route("/", "index.jade")
log_route("/foo.css", "foo.styl")
log_route("/foo.js", "foo.script")
public_path.forEach(function (path) {
  log_route("/*", path + "*") })
log_route("/foo", "foo.jade")
log_route("/foo", "foo/index.jade")
log_route("/foo/bar", "foo/bar.jade")
log_route("/*", "server.express.js")

function log_route(path, target) {
  log("http://localhost:%d%s => %s", PORT, path, target)
}

http.createServer(app).listen(PORT)

module.exports = function (callback) {
  if (callback) {
    callback(app)
  }
}
