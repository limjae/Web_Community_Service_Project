const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Image, Message } = require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followers.map(f => f.id) : [];
  res.locals.followingIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  res.locals.f4fIdList = req.user ? req.user.Followers.map(f => f.id).filter(it => req.user.Followings.map(f => f.id).includes(it)) : [];
  next();
});

// GET / 라우터
router.get('/', async (req, res, next) => {
  try {
    console.log("/ page load start!");
    const pgnum = req.query.pagenum > 0 ? req.query.pagenum : 1;
    const pgsearch = req.query.search ? req.query.search : "";
    let href = '/?';
    if (pgsearch) {
      href = href + `searchMode=${req.query.searchMode}&search=${pgsearch}&`
    }

    let posts;
    if (pgsearch) {
      if (req.query.searchMode == "id") {
        posts = await Post.findAll({
          include: {
            model: User,
            attributes: ['id', 'nick'],
            where: { nick: { [Op.like]: "%" + pgsearch + "%" } },
          },
          order: [['createdAt', 'DESC']],
        });
      }
      else if (req.query.searchMode == "idstrict") {
        posts = await Post.findAll({
          include: {
            model: User,
            attributes: ['id', 'nick'],
            where: { nick: pgsearch },
          },
          order: [['createdAt', 'DESC']],
        });
      }
      else if (req.query.searchMode == "text") {
        posts = await Post.findAll({
          include: {
            model: User,
            attributes: ['id', 'nick'],
          },
          order: [['createdAt', 'DESC']],
          where: { content: { [Op.like]: "%" + pgsearch + "%" } },
        });

        for (let p = posts.length - 1; p >= 0; p--) {
          let str = posts[p].dataValues.content;
          let strArr = str.split(' ');
          let reg1 = new RegExp(`[^#].*${pgsearch}.*`);
          let reg2 = new RegExp(`^${pgsearch}.*`);
          if (reg1.test(str) || reg2.test(str)) {
            console.log(str);
          }
          else {
            posts.splice(p, 1);
          }
        }
      }
      else if (req.query.searchMode == "hash") {
        posts = await Post.findAll({
          include: {
            model: User,
            attributes: ['id', 'nick'],
          },
          order: [['createdAt', 'DESC']],
          where: { content: { [Op.like]: "#%" + pgsearch + "%" } },
        });
      }
      else if (req.query.searchMode == "hashstrict") {
        posts = await Post.findAll({
          include: {
            model: User,
            attributes: ['id', 'nick'],
          },
          order: [['createdAt', 'DESC']],
        });

        for (let p = posts.length - 1; p >= 0; p--) {
          let str = posts[p].dataValues.content;
          let strArr = str.split(' ');
          if (strArr.includes("#" + pgsearch)) {
            console.log(strArr);
          }
          else {
            posts.splice(p, 1);
          }
        }

      }
    }
    else {
      posts = await Post.findAll({
        include: {
          model: User,
          attributes: ['id', 'nick'],
        },
        order: [['createdAt', 'DESC']],
      });
    }


    const images = await Image.findAll({
      attributes: ['image_id', 'img', 'id']
    });

    console.log("/ page load ?");
    //console.log(posts.slice(9 * (pgnum - 1), 9 * (pgnum)));
    //console.log(pgsearch);

    if (req.user && req.user.verified == false) {
      console.log("/ page load end!");
      res.redirect(`/verification?uid=${req.user.id}`);
    }
    else {
      console.log("/ page load end!");
      res.render('static', {
        title: 'SSU_SNS',
        twits: posts.slice(9 * (pgnum - 1), 9 * (pgnum)),
        imgs: images,
        pagenum: pgnum,
        pagelimit: parseInt((posts.length - 1) / 9) + 1,
        curhref: href,
      });
    }


  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/account', isNotLoggedIn, (req, res) => {
  res.render('account', { title: '회원가입 - SSU_SNS' });
});

router.get('/profile', isLoggedIn, (req, res) => {

  if (req.user.verified == false) {
    res.redirect(`/verification?uid=${req.user.id}`);
  }
  else {
    res.render('profile', { title: `${req.user.nick} : Profile - SSU_SNS` });
  }
});

router.get('/message', isLoggedIn, async (req, res, next) => {
  try {
    let f4fIdList = req.user ? req.user.Followers.map(f => f.id).filter(it => req.user.Followings.map(f => f.id).includes(it)) : [];
    let users = await User.findAll({
      where: { id: { [Op.in]: f4fIdList } },
      order: [['createdAt', 'ASC']],
    });
    let messages = await Message.findAll({
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'nick','name'],
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'nick','name'],
      },
      ],
      attributes: ['msg', 'createdAt', 'senderId', 'receiverId'],
      where: { [Op.or]: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
      order: [['createdAt', 'ASC']],
    });
    //console.log(messages);

    let userorder = [];
    for (let m = messages.length - 1; m >= 0; --m) { //descending createdAt order
      if (messages[m].dataValues.senderId == req.user.id) {
        if (userorder.length == 0) {
          userorder.push({
            usr: messages[m].dataValues.receiver, //user
            time: messages[m].dataValues.createdAt
          });
        }
        else if (!userorder.filter(x => { return x.usr.dataValues.id == messages[m].dataValues.receiverId }).length) {
          userorder.push({
            usr: messages[m].dataValues.receiver, //user
            time: messages[m].dataValues.createdAt
          });
        }
      }
      else {
        if (userorder.length == 0) {
          userorder.push({
            usr: messages[m].dataValues.receiver, //user
            time: messages[m].dataValues.createdAt
          });
        }
        else if (!userorder.filter(x => { return x.usr.dataValues.id == messages[m].dataValues.senderId }).length) {
          userorder.push({
            usr: messages[m].dataValues.sender,
            time: messages[m].dataValues.createdAt,
          });
        }
      }
    }

    for (let i = userorder.length - 1; i >= 0; --i) {
      if (!f4fIdList.includes(userorder[i].usr.dataValues.id)) {
        userorder.splice(i, 1);
      }
    }
    console.log(userorder);

    let selectedId = req.query.selId ? req.query.selId : (f4fIdList.length == 0 ? -1 : f4fIdList[0]);

    // console.log("??? ");
    // console.log(posts.slice(9 * (pgnum - 1), 9 * (pgnum)));
    // console.log(pgsearch);
    // console.log(f4fIdList);
    // console.log(users);
    // console.log(selectedId);
    if (req.user.verified == false) {
      res.redirect(`/verification?uid=${req.user.id}`);
    }
    else {
      res.render('message', {
        title: `${req.user.nick} : Direct Message - SSU_SNS`,
        f4flists: f4fIdList,
        msgs: messages,
        userlist: userorder,
        selectId: selectedId,
      });
    }

  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/follow', isLoggedIn, async (req, res, next) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'ASC']],
    });

    if (req.user.verified == false) {
      res.redirect(`/verification?uid=${req.user.id}`);
    }
    else {
      res.render('follow', {
        title: 'Follow -SSU_SNS',
        userlist: users,
      });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/verification', async (req, res, next) => {
  try {
    if (req.query.uid < 0) {
      res.redirect(`/`);
    }
    else {
      const user = await User.findOne({
        where: { id: req.query.uid }
      });
      if (user.getDataValue('verified')) {
        res.redirect(`/`);
      }
      else {
        res.render('verification', {
          title: `${user.getDataValue('nick')} Verification - SSU_SNS`,
          verifyuser: user,
        });
      }
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
