const connection = require('./db')
const getList = () => {
    return new Promise((resolve, reject) => {
        //第一个参数：sql语句
        //第二个参数：回调函数（err：查询错误，data：查询结果）
        connection.query("select * from one_sentence_per_day", (err, data) => {
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
        const sql = 'INSERT INTO one_sentence_per_day (day_sentence, auth, status) VALUES (?,?,"A") ';
        connection.query(sql, [sentence,auth], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
// 处理数据库连接错误
// 监听数据库连接错误事件
connection.on('error', (err) => {
    console.error('Database error:', err);
    // 可以在这里进行错误处理，比如重连数据库等
    // 例如：重新连接数据库
    connection.connect((error) => {
        if (error) {
            console.error('Reconnection failed:', error);
        } else {
            console.log('Reconnected to the database successfully.');
        }
    });
});
module.exports = {
    getList,
    addSentence
}