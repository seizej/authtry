var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var routes = require('./routes/index');
var users = require('./routes/users');
var  jwt = require('jwt-simple');
var config = require('./config/database');
mongoose.connect(config.database);
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

var User = require('./app/models/user');

require('./config/passport')(passport);
var apiRoutes = express.Router();

apiRoutes.post('/signup',function(req,res){
  if(!req.body.name || !req.body.password)
  {
    res.json({success:false ,msg:"plesase send paremeters"});
  }

  else
  {
    var newUser  = new User({
      name:req.body.name,
      password : req.body.password
    });

    newUser.save(function(err){
      if(err)
      {
        res.json({success:false,msg:'something gone wrong'});
      }

      else
      {
        res.json({success:true,msg:'user created'});

      }
    });
  }
});


apiRoutes.post('/authenticate',function(req,res){

  User.findOne({name:req.body.name},function(err,user){
    if(err) throw err;

    if(!user)
    {
      return res.status(403).send({success:false,msg:"Authentication failde"});
    }
    else
    {
      user.comparePassword(req.body.password,function(err,isMatch){
        if(isMatch && !err)
        {
          var token = jwt.encode(user,config.secret);
          res.json({success:true,token:'JWT   '+token});
        }

        else
        {
          return res.status(403).send({success:false,msg:"everthing ok"});
        }
      });
    }
  });
});


apiRoutes.get('/memberinfo',passport.authenticate('jwt',{session:false}),function(req,res){
  var token =getToken(req.headers);
  if(token)
  {
    var decoded = jwt.decode(token,config.secret);
    User.findOne({name:decoded.name},function(err,user){
      if(err) throw err;
      if(!user)
      {
    return res.status(403).send({success:false,msg:"Authentication failed"});

      }
      else
      {
return res.json(    {success:true,msg:"welcome to member area"});
      }
    })
  }
  else
  {
  return res.status(403).send({success:false,msg:"no token provided"});
  }
});

getToken =function(headers){
  if(headers && headers.authorization){
    var parted = headers.authorization.split(' ');
    if(parted.length==2)
    {
      return parted[1];
    }
    else
    {
      return null;
    }

  }
  else
  {
    return null;
  }
}
app.use('/api',apiRoutes);

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


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


app.listen(9000,function(){
  console.log("ap is running on 9000");
});
module.exports = app;
