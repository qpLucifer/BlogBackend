exports.success = (res, data = null, message = '操作成功', code = 200) => {
  res.status(code).json({ code, data, message });
};
 
exports.fail = (res, message = '操作失败', code = 500, data = null) => {
  res.status(code).json({ code, data, message });
}; 