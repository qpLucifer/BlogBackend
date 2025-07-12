const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { BlogSentence } = require('../models/blogSentence');

// 需要认证
router.use(authenticate);

// 获取每日一句列表
router.get('/list', checkMenuPermission('每日一句','can_read'), async (req, res) => {
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
router.post('/add', checkMenuPermission('每日一句','can_create'), async (req, res) => {
    const { day_sentence, auth } = req.body;
    if (!auth) {
        return res.status(400).json({ error: 'auth is required' });
    }
    if (!day_sentence) {
        return res.status(400).json({ error: 'Sentence is required' });
    }
    try {
        const newSentence = await BlogSentence.create({
            day_sentence: day_sentence,
            auth: auth
        });
        res.status(201).json({ message: 'Day Sentence added successfully', id: newSentence.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 更新每日一句
router.put('/update/:id', checkMenuPermission('每日一句','can_update'), async (req, res) => { 
    const { day_sentence, auth } = req.body;
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'id is required' });
    }
    if (!auth) {
        return res.status(400).json({ error: 'auth is required' });
    }
    if (!day_sentence) {
        return res.status(400).json({ error: 'Sentence is required' });
    }
    try {
        const sentence = await BlogSentence.findByPk(id);
        if (!sentence) {
            return res.status(404).json({ error: 'Sentence not found' });
        }
        sentence.day_sentence = day_sentence;
        sentence.auth = auth;
        await sentence.save();  
        res.status(200).json({ message: 'Day Sentence updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 删除每日一句
router.delete('/delete/:id', checkMenuPermission('每日一句','can_delete'), async (req, res) => {
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