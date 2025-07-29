// utils/validation.js - 输入验证模式
const Joi = require('joi');

// 用户相关验证
const userValidation = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(16)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名长度不能少于3个字符',
        'string.max': '用户名长度不能超过16个字符',
        'any.required': '用户名是必填项'
      }),
    
    password: Joi.string()
      .min(6)
      .max(20)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': '密码长度不能少于6个字符',
        'string.max': '密码长度不能超过20个字符',
        'string.pattern.base': '密码必须包含大小写字母和数字',
        'any.required': '密码是必填项'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '邮箱格式不正确',
        'any.required': '邮箱是必填项'
      }),
    
    is_active: Joi.boolean().default(true),
    roles: Joi.array().items(Joi.number().integer().positive()).min(1).required()
  }),

  login: Joi.object({
    username: Joi.string().required().messages({
      'any.required': '用户名是必填项'
    }),
    password: Joi.string().required().messages({
      'any.required': '密码是必填项'
    })
  }),

  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(16),
    email: Joi.string().email(),
    is_active: Joi.boolean(),
    roles: Joi.array().items(Joi.number().integer().positive())
  })
};

// 博客相关验证
const blogValidation = {
  create: Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.min': '标题不能为空',
        'string.max': '标题长度不能超过200个字符',
        'any.required': '标题是必填项'
      }),
    
    content: Joi.string()
      .min(1)
      .required()
      .messages({
        'string.min': '内容不能为空',
        'any.required': '内容是必填项'
      }),
    
    summary: Joi.string().max(500).allow('').messages({
      'string.max': '摘要长度不能超过500个字符'
    }),
    
    cover_image: Joi.string().uri().allow('').messages({
      'string.uri': '封面图片必须是有效的URL'
    }),
    
    author_id: Joi.number().integer().positive().required().messages({
      'number.positive': '作者ID必须是正整数',
      'any.required': '作者ID是必填项'
    }),
    
    tags: Joi.array().items(Joi.number().integer().positive()),
    is_published: Joi.boolean().default(false),
    is_choice: Joi.boolean().default(false),
    need_time: Joi.number().integer().min(0).default(0)
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200),
    content: Joi.string().min(1),
    summary: Joi.string().max(500).allow(''),
    cover_image: Joi.string().uri().allow(''),
    tags: Joi.array().items(Joi.number().integer().positive()),
    is_published: Joi.boolean(),
    is_choice: Joi.boolean(),
    need_time: Joi.number().integer().min(0)
  })
};

// 角色相关验证
const roleValidation = {
  create: Joi.object({
    name: Joi.string()
      .alphanum()
      .min(2)
      .max(20)
      .required()
      .messages({
        'string.alphanum': '角色名只能包含字母和数字',
        'string.min': '角色名长度不能少于2个字符',
        'string.max': '角色名长度不能超过20个字符',
        'any.required': '角色名是必填项'
      }),
    
    description: Joi.string().max(255).allow('').messages({
      'string.max': '描述长度不能超过255个字符'
    }),
    
    menus: Joi.array().items(
      Joi.object({
        menu_id: Joi.number().integer().positive().required(),
        can_create: Joi.boolean().default(false),
        can_read: Joi.boolean().default(false),
        can_update: Joi.boolean().default(false),
        can_delete: Joi.boolean().default(false)
      })
    )
  }),

  update: Joi.object({
    name: Joi.string().alphanum().min(2).max(20),
    description: Joi.string().max(255).allow(''),
    menus: Joi.array().items(
      Joi.object({
        menu_id: Joi.number().integer().positive().required(),
        can_create: Joi.boolean(),
        can_read: Joi.boolean(),
        can_update: Joi.boolean(),
        can_delete: Joi.boolean()
      })
    )
  })
};

// 菜单相关验证
const menuValidation = {
  create: Joi.object({
    name: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': '菜单名不能为空',
        'string.max': '菜单名长度不能超过50个字符',
        'any.required': '菜单名是必填项'
      }),
    
    path: Joi.string()
      .pattern(/^\/[a-zA-Z0-9/_-]*$/)
      .required()
      .messages({
        'string.pattern.base': '路径格式不正确，必须以/开头',
        'any.required': '路径是必填项'
      }),
    
    icon: Joi.string().max(100).allow(''),
    parent_id: Joi.number().integer().positive().allow(null),
    order: Joi.number().integer().min(0).default(0),
    hidden: Joi.boolean().default(false)
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(50),
    path: Joi.string().pattern(/^\/[a-zA-Z0-9/_-]*$/),
    icon: Joi.string().max(100).allow(''),
    parent_id: Joi.number().integer().positive().allow(null),
    order: Joi.number().integer().min(0),
    hidden: Joi.boolean()
  })
};

// 标签相关验证
const tagValidation = {
  create: Joi.object({
    name: Joi.string()
      .min(1)
      .max(20)
      .required()
      .messages({
        'string.min': '标签名不能为空',
        'string.max': '标签名长度不能超过20个字符',
        'any.required': '标签名是必填项'
      }),
    
    color: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .allow('')
      .messages({
        'string.pattern.base': '颜色格式不正确，请使用十六进制格式如#FF0000'
      })
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(20),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('')
  })
};

// 评论相关验证
const commentValidation = {
  create: Joi.object({
    blog_id: Joi.number().integer().positive().required().messages({
      'number.positive': '博客ID必须是正整数',
      'any.required': '博客ID是必填项'
    }),
    
    user_id: Joi.number().integer().positive().required().messages({
      'number.positive': '用户ID必须是正整数',
      'any.required': '用户ID是必填项'
    }),
    
    content: Joi.string()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.min': '评论内容不能为空',
        'string.max': '评论内容不能超过1000个字符',
        'any.required': '评论内容是必填项'
      }),
    
    parent_id: Joi.number().integer().positive().allow(null)
  }),

  update: Joi.object({
    content: Joi.string().min(1).max(1000)
  })
};

// 每日一句验证
const daySentenceValidation = {
  create: Joi.object({
    day_sentence: Joi.string()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.min': '句子内容不能为空',
        'string.max': '句子内容不能超过500个字符',
        'any.required': '句子内容是必填项'
      }),
    
    auth: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': '作者不能为空',
        'string.max': '作者名称不能超过100个字符',
        'any.required': '作者是必填项'
      })
  }),

  update: Joi.object({
    day_sentence: Joi.string().min(1).max(500),
    auth: Joi.string().min(1).max(100)
  })
};

// 分页验证
const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().allow(''),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

module.exports = {
  userValidation,
  blogValidation,
  roleValidation,
  menuValidation,
  tagValidation,
  commentValidation,
  daySentenceValidation,
  paginationValidation
};
