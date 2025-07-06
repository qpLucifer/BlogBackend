// utils/initRoles.js - 初始化角色和权限
module.exports = async function() {
  const { Role, User, Menu } = require('../models/admin');
  const { registerUser } = require('./auth');
  const { BlogSentence } = require('../models/blogSentence');
  
  try {
    // 检查是否已初始化
    const adminInit = await Role.findOne({ where: { name: 'admin' } });
    if (adminInit) return;
    
    // 创建角色
    const adminRole = await Role.create({
      name: 'admin',
      description: '系统管理员'
    });
    
    const editorRole = await Role.create({
      name: 'editor',
      description: '内容编辑'
    });
    
    const userRole = await Role.create({
      name: 'user',
      description: '普通用户'
    });

    // 创建用户
    await registerUser('admin', '123456', 'admin@example.com', true, [adminRole.id]); // 管理员用户
    await registerUser('editor', '123456', 'editor@example.com', true, [editorRole.id]); // 编辑用户
    await registerUser('user', '123456', 'user@example.com', true, [userRole.id]); // 普通用户  

    // 分配角色给用户
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    const editorUser = await User.findOne({ where: { username: 'editor' } });
    const normalUser = await User.findOne({ where: { username: 'user' } });
    if (adminUser) {
      await adminUser.addRole(adminRole);
    }
    if (editorUser) {
      await editorUser.addRole(editorRole);
    }
    if (normalUser) {
      await normalUser.addRole(userRole);
    }
    
    // 创建菜单
    const menus = await Menu.bulkCreate([
      { name: '首页', path: '/dashboard', icon: 'dashboard', order: 1 },
      { name: '用户管理', path: '/users', icon: 'user', order: 2 },
      { name: '角色管理', path: '/roles', icon: 'team', order: 3 },
      { name: '菜单管理', path: '/menu', icon: 'menu', order: 4 }
    ]);
    
    // 分配菜单给admin角色,并分配权限
    await adminRole.setMenus(menus, {
      through: {
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: true
      }
    });
    
    //生成一些高质量的每日一句
    const sentences = [
      { auth: 'admin', day_sentence: '希望我们都成为那种，即使再孤单，生活再坎坷，不管天晴天阴，不管有无人爱，都会眷恋着夕阳和晨光，捕捉生活美好瞬间的人' },
      { auth: 'admin', day_sentence: '每个人的生活里都有阴影，但是若没这些阴影，又如何能知道我们正站在光里' },
      { auth: 'admin', day_sentence: '关于生活，你可以精致着过,也可以粗糙着过但，别将就！因为，你值得拥有更好的一切' },
      { auth: 'admin', day_sentence: '当你准备做一件事时，请坚定地开始，不要把时间浪费在犹豫上，越晚去行动，成功也会越晚。也许我们从未准备好，但是不去开始就不会有结果' },
      { auth: 'admin', day_sentence: '也许生活中偶有黯淡无光的时刻，但别忘了还有未实现的梦想，努力朝着自己的目标一点点前进。幸福就是每一个微小目标的达成。这些温暖明亮的小目标，一定也有你的。认真做好眼下的每一件事，去遇见因为努力而变得更美好的自己' },
      { auth: 'admin', day_sentence: '所有光鲜亮丽的背后、都有无人知晓的努力和坚持，成功并不是偶然 ，需要有强大的忍耐力和超于常人的毅力' },
      { auth: 'admin', day_sentence: '生活不在别处。你用心在哪里，收获就在哪里；你付出了多少，就会收获多少' },
      { auth: 'admin', day_sentence: '没有谁的生活会一直完美，但无论什么时候都要眼看前方，满怀希望就会所向披靡' },
      { auth: 'admin', day_sentence: '走自己的路，按自己的原则好好生活。即使有人亏待了你，时间也不会亏待你，人生更加不会亏待你' },
      { auth: 'admin', day_sentence: '有压力，但不要被压垮；有迷茫，但永不要绝望。勇敢地去追求梦想，大胆地去创造奇迹。快乐与幸福只属于拼搏的你。愿成功与你如影相随！' },
      { auth: 'admin', day_sentence: '努力也许不等于成功，可是那段追逐梦想的努力，会让你找到一个更好的自己，一个沉默努力充实安静的自己' },
      { auth: 'admin', day_sentence: '成功不是终点，失败也不是起点，只有不断努力奔跑，才能在终点看到自己的光芒' },
      { auth: 'admin', day_sentence: '成功的路上，充满了荆棘和坎坷，但只要你肯努力，就能克服它们，实现自己的梦想' },
    ]
    BlogSentence.bulkCreate(sentences);
    
    
    console.log('角色和权限初始化完成');
  } catch (error) {
    console.error('初始化角色和权限失败:', error);
  }
};