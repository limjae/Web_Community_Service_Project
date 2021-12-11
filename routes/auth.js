const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.post('/account', isNotLoggedIn, async (req, res, next) => {
  const { email, name, nick, password } = req.body;
  try {
    const exEmail = await User.findOne({ where: { email } });
    const exNick = await User.findOne({ where: { nick } });
    if (exEmail) {
      return res.redirect('/account?error=emailExist');
    }
    else if (exNick) {
      return res.redirect('/account?error=nickExist');
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      name,
      nick,
      password: hash,
    });
    return res.redirect(`/verification?uid=${user.getDataValue('id')}`);
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  console.log("login start!");
  passport.authenticate('local', (authError, user, info) => {
    console.log("pass auth start!");
    if (authError) {
      console.error(authError);
      return next(authError);
    }

    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }

    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }

      if (user.verified == false) {
        console.log("pass auth end!");
        return res.redirect(`/verification?uid=${user.id}`);
      }else{
        console.log("pass auth end!");
        return res.redirect('/');
      }
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});


router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;
