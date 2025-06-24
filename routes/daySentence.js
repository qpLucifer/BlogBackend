const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole } = require('../middleware/permissions');
const { BlogSentence } = require('../models/blogSentence');

// 需要认证
router.use(authenticate);

// 需要管理员角色或特定权限
router.use(checkRole('admin')); // 或者使用 checkPermission('user:write')

// 获取每日一句列表
router.get('/list', async (req, res) => {
    try {
        const sentences = await BlogSentence.findAll({
            attributes: ['id', 'auth', 'day_sentence'],
            order: [['id', 'DESC']] // 按照 ID 降序排列
        });
        res.status(200).json(sentences);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '获取每日一句列表失败' });
    }
});

// 添加每日一句
router.post('/add', async (req, res) => {
    const { daySentence, auth } = req.body;
    if (!auth) {
        return res.status(400).json({ error: 'auth is required' });
    }
    if (!daySentence) {
        return res.status(400).json({ error: 'Sentence is required' });
    }
    try {
        const newSentence = await BlogSentence.create({
            day_sentence: daySentence,
            auth: auth
        });
        res.status(201).json({ message: 'Day Sentence added successfully', id: newSentence.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 更新每日一句
router.put('/update', async (req, res) => { 
    const { id, daySentence, auth } = req.body;
    if (!id) {  
        return res.status(400).json({ error: 'id is required' });
    }
    if (!auth) {
        return res.status(400).json({ error: 'auth is required' });
    }
    if (!daySentence) {
        return res.status(400).json({ error: 'Sentence is required' });
    }
    try {
        const sentence = await BlogSentence.findByPk(id);
        if (!sentence) {
            return res.status(404).json({ error: 'Sentence not found' });
        }
        sentence.day_sentence = daySentence;
        sentence.auth = auth;
        await sentence.save();  
        res.status(200).json({ message: 'Day Sentence updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 删除每日一句
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'id is required' });
    }
    try {
        const sentence = await BlogSentence.findByPk(id);
        if (!sentence) {
            return res.status(404).json({ error: 'Sentence not found' });
        }
        await sentence.destroy();
        res.status(200).json({ message: 'Day Sentence deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;