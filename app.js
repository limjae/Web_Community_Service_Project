const express = require("express");
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // get more info
const session = require('express-session');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter-local');
const ejs = require('ejs');
const dotenv = require('dotenv'); //process.env
const passport = require('passport');
const methodOverride = require('method-override');
const nodemailer= require('nodemailer');


const app = express();
const viewpath = __dirname + '/views/';

const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

dotenv.config();
passportConfig();

app.use(morgan('dev'));
app.use(methodOverride('_method')); //html put delete
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));



app.use(passport.initialize());
app.use(passport.session());


app.set('port', process.env.PORT || 3000);
app.set('view engine', 'html');
let envNunjucks = nunjucks.configure('views', {
    express: app,
    watch: true,
});

envNunjucks.addFilter('arrFilter',function(obj,key,value){
    return obj.filter(x=>{return x[key] == value})
});
envNunjucks.addFilter('date', dateFilter);
envNunjucks.addFilter('contentfilter',function(obj){
    let str = obj.content;
    let strArr = str.split(' ');
    let strObjArr = [];
    for (let i in strArr){
        if(strArr[i][0]=='#'){
          strObjArr.push({
            isHash : true,
            letter : strArr[i].slice(1,strArr[i].length)
          })
          //console.log("??? "+strArr[i]+" "+ strArr[i].slice(1,strArr[i].length));
        }
        else{
          strObjArr.push({
            isHash : false,
            letter : strArr[i]
          })
        }
    }
    return strObjArr;
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
app.use('/icons', express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons', 'icons')));

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user',userRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});



app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기중');
});