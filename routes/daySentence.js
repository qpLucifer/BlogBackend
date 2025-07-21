const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { BlogSentence } = require('../models/blogSentence');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

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
        fail(res, '获取每日一句列表失败', 500);
    }
});

// 添加每日一句
router.post('/add', checkMenuPermission('每日一句','can_create'), async (req, res) => {
    const { day_sentence, auth } = req.body;
    if (!auth) {
        return fail(res, 'auth is required', 400);
    }
    if (!day_sentence) {
        return fail(res, 'Sentence is required', 400);
    }
    try {
        const newSentence = await BlogSentence.create({
            day_sentence: day_sentence,
            auth: auth
        });
        success(res, { id: newSentence.id }, 'Day Sentence added successfully', 200);
    } catch (error) {
        fail(res, 'Internal Server Error', 500);
    }
});

// 更新每日一句
router.put('/update/:id', checkMenuPermission('每日一句','can_update'), async (req, res) => { 
    const { day_sentence, auth } = req.body;
    const { id } = req.params;
    if (!id) {
        return fail(res, 'id is required', 400);
    }
    if (!auth) {
        return fail(res, 'auth is required', 400);
    }
    if (!day_sentence) {
        return fail(res, 'Sentence is required', 400);
    }
    try {
        const sentence = await BlogSentence.findByPk(id);
        if (!sentence) {
            return fail(res, 'Sentence not found', 404);
        }
        sentence.day_sentence = day_sentence;
        sentence.auth = auth;
        await sentence.save();  
        success(res, null, 'Day Sentence updated successfully');
    } catch (error) {
        fail(res, 'Internal Server Error', 500);
    }
});

// 删除每日一句
router.delete('/delete/:id', checkMenuPermission('每日一句','can_delete'), async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return fail(res, 'id is required', 400);
    }
    try {
        const sentence = await BlogSentence.findByPk(id);
        if (!sentence) {
            return fail(res, 'Sentence not found', 404);
        }
        await sentence.destroy();
        success(res, null, 'Day Sentence deleted successfully');
    } catch (error) {
        fail(res, 'Internal Server Error', 500);
    }
});

module.exports = router;