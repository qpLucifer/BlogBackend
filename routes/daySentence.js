const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { BlogSentence } = require('../models/blogSentence');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取所有每日一句
router.get('/listAll', async (req, res) => {
    try {
        const sentences = await BlogSentence.findAll({
            attributes: ['id', 'auth', 'day_sentence'],
            order: [['id', 'DESC']]
        });
        success(res, sentences, '获取每日一句列表成功');
    } catch (error) {
        fail(res, '获取每日一句列表失败', 500);
    }
});

// 分页获取每日一句列表
router.get('/listPage', checkMenuPermission('每日一句','can_read'), async (req, res) => {
    try {
        const { auth, day_sentence, pageSize = 10, currentPage = 1 } = req.query;

        // 构建查询条件
        const whereConditions = {};
        if (auth) {
            whereConditions.auth = { [Op.like]: `%${auth}%` };
        }
        if (day_sentence) {
            whereConditions.day_sentence = { [Op.like]: `%${day_sentence}%` };
        }

        // 获取总数
        const total = await BlogSentence.count({ where: whereConditions });

        // 获取分页数据
        const sentences = await BlogSentence.findAll({
            where: whereConditions,
            attributes: ['id', 'auth', 'day_sentence'],
            limit: parseInt(pageSize),
            offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
            order: [['id', 'DESC']]
        });

        success(res, {
            list: sentences,
            total: total,
            pageSize: parseInt(pageSize),
            currentPage: parseInt(currentPage),
        }, '获取每日一句列表成功');
    } catch (error) {
        console.log(error);
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

// 导出每日一句
router.get('/export', checkMenuPermission('每日一句','can_read'), async (req, res) => {
    try {
        const { auth, day_sentence } = req.query;

        // 构建查询条件
        const whereConditions = {};
        if (auth) {
            whereConditions.auth = { [Op.like]: `%${auth}%` };
        }
        if (day_sentence) {
            whereConditions.day_sentence = { [Op.like]: `%${day_sentence}%` };
        }

        const sentences = await BlogSentence.findAll({
            where: whereConditions,
            attributes: ['id', 'auth', 'day_sentence'],
            order: [['id', 'DESC']]
        });

        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=day_sentences_${new Date().toISOString().split('T')[0]}.xlsx`);

        // 构建Excel数据
        const XLSX = require('xlsx');
        const workbook = XLSX.utils.book_new();

        const worksheetData = [
            ['ID', '作者', '每日一句'], // 表头
            ...sentences.map(sentence => [
                sentence.id,
                sentence.auth,
                sentence.day_sentence
            ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, '每日一句列表');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (error) {
        console.error('导出每日一句失败:', error);
        fail(res, '导出每日一句失败', 500);
    }
});

module.exports = router;