var express = require('express');
var router = express.Router();
const { getList, addSentence } = require('../dataBase/api')

router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});
// 获取每日一句
router.get('/list', function (req, res, next) {
    getList().then(data => {
        // 如果没有数据，返回空数组
        if (!data || data.length === 0) {
            return res.status(200).json([]);
        }
        // 返回查询结果
        res.status(200).json(data);
    }).catch(err => {
        // 处理错误
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

// 添加每日一句
router.post('/add', function (req, res, next) {
    // 从请求体中获取 daySentence 和 auth 字段
    console.log(req.body);
    const { daySentence, auth } = req.body;
    // 检查请求体中是否包含 sentence 字段
    if (!auth) {
        return res.status(400).json({ error: 'auth is required' });
    }
    if (!daySentence) {
        return res.status(400).json({ error: 'Sentence is required' });
    }

    // 假设有一个函数 addSentence 来添加每日一句
    addSentence(daySentence, auth).then(() => {
        res.status(200).json({ message: 'Day Sentence added successfully' });
    }).catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});
module.exports = router;