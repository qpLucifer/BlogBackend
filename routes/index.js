var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/', function(req, res, next) {
  req.name = 'some name';
  next();
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).send(res.name);
});

router.get("/getFile", function(req, res, next) {
  fs.readFile('test.txt', function(err, data) {
    if (err) {
      next(err);
    } else {
      res.send(data);
    }
  })
})

// router.use(function(err, req, res, next) {
//   res.status(500).send(err.message || 'Something went wrong!');
// });
module.exports = router;
