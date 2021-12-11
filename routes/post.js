const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const { Post, Image, Message, Verifycode, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.array('imgArray'), (req, res) => {
  console.log("helllllllo");
  //console.log(req.files.length);
  for (let i = 0; i < req.files.length; ++i) {
    req.files[i].filename = `/img/${req.files[i].filename}`;
    console.log(req.files[i].filename);
  }
  res.json({ urlArray: req.files });
});

router.post('/message', isLoggedIn, async (req, res, next) => {
  try {
    console.log("message post");
    //console.log(req.body);
    const post = await Message.create({
      msg: req.body.msg,
      senderId: req.body.sender,
      receiverId: req.body.receiver,
    });
    res.redirect(`/message?selId=${req.body.receiver}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

const upload2 = multer();

router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    //console.log(req.user);
    console.log("posting test");
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });
    if (req.body.url) {
      const imageArrayJSON = JSON.parse(req.body.url);
      for (let i in imageArrayJSON) {
        console.log(`hello ${i} ${imageArrayJSON[i].filename}`);
        const image = await Image.create({
          image_id: i,
          img: imageArrayJSON[i].filename,
          id: post.getDataValue('id'),
        });
      }
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.put('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    console.log("put");
    //console.log(req.body);
    const put = await Post.update({
      content: req.body.content
    },
      {
        where: { id: req.body.editid }
      });
    const del = await Image.destroy({
      where: { id: req.body.editid }
    });
    let imgId = 0;

    if(req.body.imgeditarray){
      for (let i in req.body.imgeditarray) {
        const image = await Image.create({
          image_id: imgId,
          img: req.body.imgeditarray[i],
          id: req.body.editid,
        });
        imgId++;
      }
    }

    if (req.body.url) {
      const imageArrayJSON = JSON.parse(req.body.url);
      for (let i in imageArrayJSON) {
        console.log(`edit ${i} ${imageArrayJSON[i].filename}`);
        const image = await Image.create({
          image_id: imgId,
          img: imageArrayJSON[i].filename,
          id: req.body.editid,
        });
        imgId++;
      }
    }

    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/', isLoggedIn, async (req, res, next) => {
  try {
    console.log("1111111111333333333333");
    console.log(req.body);
    const code = await Post.destroy({
      where: { id: req.body.editid }
    });
    res.send('success');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/verification', async (req, res, next) => {
  try {
    console.log("1111111111333333333333");
    //console.log(req.body);
    const find = await Verifycode.findOne({
      where: {
        forId: req.body.verifyid,
        code: req.body.code
      },
      order: [['createdAt', 'DESC']],
    });
    // console.log( Date.parse(timelimit) +" "+ Date.parse(timevalue));
    let timelimit;
    let timevalue;
    if(find){
      timelimit = new Date();
      timevalue = new Date(find.getDataValue('createdAt'));
    }
    
    if(!find){
      res.send(`<script>alert("Incorrect Code")?"":location.replace("/");</script>`);
    }
    else if (Date.parse(timelimit)-180000 > Date.parse(timevalue) ) {
      res.send(`<script>alert("Verification Code Time Out")?"":location.replace("/");</script>`);
      const del = await Verifycode.destroy({
        where: { code: find.getDataValue('code'),
        forId: req.body.verifyid,
       }
      });
    }
    else {
      const put = await User.update({
        verified: true
      },
        {
          where: {
            Id: req.body.verifyid,
          },
        });
        res.send(`<script>alert("Verification Success")?"":location.replace("/");</script>`);
        const del = await Verifycode.destroy({
          where: { code: find.getDataValue('code'),
          forId: req.body.verifyid,
         }
        });
    }

  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/verification/:uid', async (req, res, next) => {
  try {
    console.log("1111111111333333333333");

    const code = Math.random().toString(36).substring(3, 13).toUpperCase();

    const del = await Verifycode.destroy({
      where: { forid: req.params.uid }
    });

    const post = await Verifycode.create({
      code: code,
      forId: req.params.uid,
    });

    //reference1  https://velog.io/@josworks27/Back-end-Node.js에서-메일-전송하기-feat.-Nodemailer-Gmail
    //reference2  https://medium.com/coox-tech/send-mail-using-node-js-express-js-with-nodemailer-93f4d62c83ee
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    const mailData = {
      from: process.env.NODEMAILER_USER,  // sender address
      to: req.body.data.verifyEmail,   // list of receivers
      subject: 'Verification Code - SSU_SNS',
      text: code,
      html: `<b>${code}</b>`,
    };

    console.log(req.body.verifyEmail);


    transporter.sendMail(mailData, function (err, info) {
      if (err)
        console.log(err)
      else
        console.log(info);
    });

    res.redirect(`/verification?uid=${req.params.uid}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
