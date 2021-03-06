var fs = require('fs');
var http = require('http');
var path = require('path');
var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Load application settings
var settings = require("./settings.js");

var app = express();
var router = express.Router();

var port = process.env.PORT || settings.serverPort || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', port);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(settings.baseUrl || '/', express.static(path.join(__dirname, 'public')));

// Auth ==================================================================================
// uncomment this code when using webproxy or app-proxy for authentication

/*
process.stdout.write((new Date()).toString() + 'Spyglass started...\n');
var auth = null;
app.use(function(req, res, next) {
  // Used to implement authentication handled by a proxy upstream, by default assume "webuser" is always logged in.
  if (req.headers["x-authenticated-user"]) {
    auth = {user: req.headers["x-authenticated-user"]};
  }
  next();
});
// Force user to be logged-in for access
app.use(function(req, res, next) {
  // Redirect user to proxy login page if not logged in
  if (!auth) {
    res.writeHead(301, {'Location': '/login?login-required&referrer=' + settings.baseUrl + req.url}); // redirect
    res.end();
    return;
  }
  next();
})
*/
// =======================================================================================

app.get(settings.baseUrl || '/', function(req, res, next) {
  res.render('index', {settings: settings});
});

fs.readdirSync(path.join(__dirname, 'routes')).forEach(function(file) {
  if (file.match(/^\./)) return; // ignore hidden files
  var mod = require(path.join(__dirname, 'routes', file));
  app.use(settings.baseUrl || '/', mod);
});

// catch 404 and forward to error handlers
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}
