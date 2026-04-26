// ==================== GAME DATA ====================
const TOYS = [
    { id: 1,  emoji: '🧸', name: '泰迪熊',       price: 15, stock: 3,  maxStock: 3  },
    { id: 2,  emoji: '🚗', name: '小汽车',       price: 8,  stock: 5,  maxStock: 5  },
    { id: 3,  emoji: '🎨', name: '蜡笔套装',     price: 6,  stock: 4,  maxStock: 4  },
    { id: 4,  emoji: '🪁', name: '风筝',         price: 10, stock: 3,  maxStock: 3  },
    { id: 5,  emoji: '🧱', name: '积木套装',     price: 12, stock: 4,  maxStock: 4  },
    { id: 6,  emoji: '🎸', name: '小吉他',       price: 20, stock: 2,  maxStock: 2  },
    { id: 7,  emoji: '🦕', name: '恐龙玩具',     price: 18, stock: 3,  maxStock: 3  },
    { id: 8,  emoji: '🎈', name: '气球套装',     price: 5,  stock: 6,  maxStock: 6  },
    { id: 9,  emoji: '🧩', name: '拼图游戏',     price: 9,  stock: 4,  maxStock: 4  },
    { id: 10, emoji: '🎭', name: '动物面具',     price: 7,  stock: 5,  maxStock: 5  },
    { id: 11, emoji: '🪀', name: '溜溜球',       price: 4,  stock: 8,  maxStock: 8  },
    { id: 12, emoji: '🎯', name: '飞镖玩具',     price: 16, stock: 2,  maxStock: 2  },
    { id: 13, emoji: '🪆', name: '俄罗斯套娃',   price: 14, stock: 3,  maxStock: 3  },
    { id: 14, emoji: '🎵', name: '音乐盒',       price: 25, stock: 2,  maxStock: 2  },
    { id: 15, emoji: '🧲', name: '磁力片',       price: 22, stock: 3,  maxStock: 3  },
    { id: 16, emoji: '🎺', name: '小喇叭',       price: 8,  stock: 5,  maxStock: 5  },
    { id: 17, emoji: '🐼', name: '熊猫玩偶',     price: 13, stock: 3,  maxStock: 3  },
    { id: 18, emoji: '🦁', name: '狮子玩偶',     price: 13, stock: 3,  maxStock: 3  },
    { id: 19, emoji: '🌈', name: '彩虹弹簧',     price: 6,  stock: 6,  maxStock: 6  },
    { id: 20, emoji: '🎪', name: '魔术道具',     price: 15, stock: 3,  maxStock: 3  },
    { id: 21, emoji: '🔭', name: '望远镜',       price: 19, stock: 2,  maxStock: 2  },
    { id: 22, emoji: '🖍️', name: '水彩颜料',     price: 11, stock: 4,  maxStock: 4  },
    { id: 23, emoji: '📚', name: '故事绘本',     price: 7,  stock: 6,  maxStock: 6  },
    { id: 24, emoji: '🪅', name: '沙锤乐器',     price: 5,  stock: 7,  maxStock: 7  },
    { id: 25, emoji: '🎀', name: '发饰套装',     price: 3,  stock: 10, maxStock: 10 },
    { id: 26, emoji: '🏀', name: '小篮球',       price: 10, stock: 4,  maxStock: 4  },
    { id: 27, emoji: '🎲', name: '桌游棋盘',     price: 16, stock: 3,  maxStock: 3  },
    { id: 28, emoji: '🦋', name: '蝴蝶标本',     price: 12, stock: 3,  maxStock: 3  },
    { id: 29, emoji: '🌻', name: '向日葵种子',   price: 2,  stock: 12, maxStock: 12 },
    { id: 30, emoji: '🐰', name: '兔子玩偶',     price: 11, stock: 4,  maxStock: 4  },
];

const CUSTOMERS = [
    { emoji: '🐰', name: '小兔贝贝',   personality: 'gentle'  },
    { emoji: '🐱', name: '小猫喵喵',   personality: 'clever'  },
    { emoji: '🐶', name: '小狗旺旺',   personality: 'generous' },
    { emoji: '🐸', name: '青蛙呱呱',   personality: 'hesitant' },
    { emoji: '🦊', name: '狐狸聪聪',   personality: 'shrewd'  },
    { emoji: '🐧', name: '企鹅冰冰',   personality: 'shy'     },
    { emoji: '🐨', name: '考拉慢慢',   personality: 'gentle'  },
    { emoji: '🐭', name: '老鼠吱吱',   personality: 'thrifty' },
    { emoji: '🐹', name: '仓鼠圆圆',   personality: 'generous' },
    { emoji: '🦄', name: '独角兽亮亮', personality: 'rich'    },
    { emoji: '🐯', name: '老虎威威',   personality: 'generous' },
    { emoji: '🐮', name: '小牛哞哞',   personality: 'gentle'  },
    { emoji: '🐷', name: '小猪噜噜',   personality: 'hesitant' },
    { emoji: '🐑', name: '小羊咩咩',   personality: 'shy'     },
    { emoji: '🦉', name: '猫头鹰圆圆', personality: 'clever'  },
];

const BUDGET_RANGES = {
    rich:     { min: 1.0,  max: 1.4  },
    generous: { min: 0.85, max: 1.15 },
    gentle:   { min: 0.7,  max: 1.0  },
    clever:   { min: 0.6,  max: 0.95 },
    hesitant: { min: 0.55, max: 0.85 },
    shy:      { min: 0.6,  max: 0.9  },
    shrewd:   { min: 0.45, max: 0.75 },
    thrifty:  { min: 0.4,  max: 0.7  },
};

const GREETINGS = [
    '你好呀！',
    '嗨！小熊售货员！',
    '你好你好！',
    '小熊你好！',
    '哈喽！',
];

const WANT_PHRASES = [
    (name) => `我想买一个${name}！`,
    (name) => `我好想要那个${name}！`,
    (name) => `请问${name}多少钱呀？`,
    (name) => `我可以看看那个${name}吗？`,
    (name) => `哇，${name}好棒！我想买！`,
];

const AFFORDABLE_PHRASES = [
    '好的！给你钱！',
    '太好了！我买了！',
    '谢谢你！',
    '好的好的！',
    '耶！我要这个！',
];

const CANT_AFFORD_PHRASES = [
    (n) => `可是...我只有${n}元，可以便宜一点吗？`,
    (n) => `啊...我的零花钱只有${n}元呢...`,
    (n) => `${n}元够不够呀？我只有这么多...`,
    (n) => `我数数...我只有${n}元，能卖给我吗？`,
];

const ACCEPT_PHRASES = [
    '太好了！谢谢你！',
    '耶！我好开心！',
    '谢谢小熊售货员！',
    '你真好！',
    '好棒！拿到啦！',
];

const LEAVE_PHRASES = [
    '好吧...那我下次再来...',
    '呜呜...那我攒够钱再来...',
    '好的...我再想想...',
    '那我去别的地方看看吧...',
];

const COUNTER_RESPONSE = [
    (n) => `嗯...那我最多能给${n}元了！`,
    (n) => `我再翻翻口袋...最多${n}元！`,
    (n) => `${n}元行不行？这是我全部的钱了！`,
];
