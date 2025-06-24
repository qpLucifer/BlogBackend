const connection = require('./db')
const getList = () => {
    return new Promise((resolve, reject) => {
        //第一个参数：sql语句
        //第二个参数：回调函数（err：查询错误，data：查询结果）
        connection.query("select * from blog_sentence", (err, data) => {
            // 如果查询出错，打印错误信息并拒绝 Promise
            if (err) {
                reject(err);
                return;
            }
            resolve(data)
        })
    })
}

const addSentence = (sentence,auth) => {
    return new Promise((resolve, reject) => {
        // 插入每日一句的SQL语句
        const sql = 'INSERT INTO blog_sentence (day_sentence, auth) VALUES (?,?) ';
        connection.query(sql, [sentence,auth], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

const updateSentence = (id,sentence,auth) => {
    return new Promise((resolve, reject) => {
        // 插入每日一句的SQL语句
        const sql = 'update blog_sentence set day_sentence = ?,auth = ? where id = ?';
        connection.query(sql, [sentence,auth,id], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

const deleteSentence = (id) => {
    return new Promise((resolve, reject) => {
        // 插入每日一句的SQL语句
        const sql = 'delete from blog_sentence where id = ?';
        connection.query(sql, [id], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

module.exports = {
    getList,
    addSentence,
    updateSentence,
    deleteSentence,
}