export const STORAGE_KEY = 'english-rainbow-island-v1';
export const GUIDE_URL =
  'https://midienglishpub.oss-cn-beijing.aliyuncs.com/NewMidiEnglish/resources/lessonPlan/Level3-LessonPlan.pdf';

export const BOOKS = {
  theme: { name: '主题乐园', english: 'Thematic Workbook 3', activity: '听音找图', icon: '🌻' },
  phonics: { name: '拼读工坊', english: 'Phonics Workbook 3', activity: '单词积木', icon: '🧩' },
};

export const LANDMARKS = [
  { icon: '🏡', name: '晨光小屋', sticker: '🌞' },
  { icon: '🌳', name: '秘密树屋', sticker: '🍀' },
  { icon: '🥕', name: '野餐花园', sticker: '🍓' },
  { icon: '🚀', name: '梦想山丘', sticker: '🚀' },
  { icon: '🌦️', name: '彩虹气象站', sticker: '🌈' },
];

const themeWord = (word, label, picture) => ({ word, label, picture });
const phonicsWord = (word, onset, rime, label, picture, letters) => ({
  word,
  onset,
  rime,
  label,
  picture,
  letters,
});

export const UNITS = {
  theme: [
    {
      title: '早安与晚安',
      english: 'Good Morning, Good Night',
      words: [
        themeWord('hen', '母鸡', '🐔'),
        themeWord('squirrel', '松鼠', '🐿️'),
        themeWord('rabbit', '兔子', '🐇'),
        themeWord('bat', '蝙蝠', '🦇'),
        themeWord('owl', '猫头鹰', '🦉'),
        themeWord('firefly', '萤火虫', '🪲✨'),
      ],
    },
    {
      title: '家里捉迷藏',
      english: 'Hide and Seek',
      words: [
        themeWord('living room', '客厅', '🛋️💡'),
        themeWord('dining room', '餐厅', '🪑🍽️'),
        themeWord('kitchen', '厨房', '🍳🫕'),
        themeWord('bedroom', '卧室', '🛏️🧸'),
        themeWord('bathroom', '浴室', '🛁🫧'),
        themeWord('garage', '车库', '🚗🔧'),
        themeWord('storeroom', '储藏室', '📦🧹'),
      ],
    },
    {
      title: '美味野餐',
      english: 'Food We Like',
      words: [
        themeWord('carrot', '胡萝卜', '🥕'),
        themeWord('cabbage', '卷心菜', '🥬'),
        themeWord('bread', '面包', '🍞'),
        themeWord('rice', '米饭', '🍚'),
        themeWord('noodles', '面条', '🍜'),
        themeWord('ice cream', '冰淇淋', '🍦'),
        themeWord('peas', '豌豆', '🫛'),
        themeWord('fish', '鱼', '🐟'),
        themeWord('chicken', '鸡肉', '🍗'),
        themeWord('beef', '牛肉', '🥩'),
        themeWord('jello', '果冻', '🍮'),
      ],
    },
    {
      title: '长大做什么',
      english: 'Guess Who?',
      words: [
        themeWord('chef', '厨师', '👩‍🍳'),
        themeWord('pilot', '飞行员', '👨‍✈️✈️'),
        themeWord('astronaut', '宇航员', '👩‍🚀'),
        themeWord('fireman', '消防员', '👨‍🚒'),
        themeWord('hairdresser', '理发师', '💇✂️'),
        themeWord('policeman', '警察', '👮'),
        themeWord('postman', '邮递员', '🧑‍✉️📮'),
        themeWord('waiter', '服务员', '🤵🍽️'),
      ],
    },
    {
      title: '天气观察员',
      english: 'What Is the Weather Like?',
      words: [
        themeWord('sunny', '晴天', '☀️'),
        themeWord('cloudy', '多云', '☁️'),
        themeWord('windy', '刮风', '🌬️🍃'),
        themeWord('rainy', '下雨', '🌧️'),
      ],
    },
  ],
  phonics: [
    {
      title: 'a 的小积木',
      english: '-ad · -ag · -ap · -ab · -at',
      words: [
        phonicsWord('dad', 'd', 'ad', '爸爸', '👨', ['d', 'p', 's']),
        phonicsWord('bag', 'b', 'ag', '包', '🎒', ['b', 't', 'w']),
        phonicsWord('map', 'm', 'ap', '地图', '🗺️', ['m', 'c', 't']),
        phonicsWord('cab', 'c', 'ab', '出租车', '🚕', ['c', 'd', 't']),
        phonicsWord('cat', 'c', 'at', '猫', '🐈', ['c', 'h', 'b']),
        phonicsWord('hat', 'h', 'at', '帽子', '🎩', ['h', 'c', 'm']),
      ],
    },
    {
      title: 'a 和 e 做朋友',
      english: '-am · -an · -ack · -ed · -eg',
      words: [
        phonicsWord('jam', 'j', 'am', '果酱', '🍓🫙', ['j', 'h', 'r']),
        phonicsWord('ham', 'h', 'am', '火腿', '🍖', ['h', 'j', 'r']),
        phonicsWord('van', 'v', 'an', '小货车', '🚐', ['v', 'f', 'p']),
        phonicsWord('fan', 'f', 'an', '风扇', '🪭', ['f', 'v', 'm']),
        phonicsWord('sack', 's', 'ack', '大口袋', '🛍️', ['s', 'b', 'r']),
        phonicsWord('bed', 'b', 'ed', '床', '🛏️', ['b', 'r', 'w']),
        phonicsWord('leg', 'l', 'eg', '腿', '🦵', ['l', 'p', 'b']),
      ],
    },
    {
      title: 'e 和 i 的发现',
      english: '-en · -et · -ell · -it · -ix · -ick',
      words: [
        phonicsWord('hen', 'h', 'en', '母鸡', '🐔', ['h', 't', 'p']),
        phonicsWord('ten', 't', 'en', '十', '🔟', ['t', 'h', 'p']),
        phonicsWord('net', 'n', 'et', '网', '🥅', ['n', 'p', 'j']),
        phonicsWord('wet', 'w', 'et', '湿的', '💧👕', ['w', 'p', 'j']),
        phonicsWord('bell', 'b', 'ell', '铃铛', '🔔', ['b', 'w', 's']),
        phonicsWord('sit', 's', 'it', '坐下', '🧒🪑', ['s', 'f', 'h']),
        phonicsWord('six', 's', 'ix', '六', '6️⃣', ['s', 'f', 'm']),
        phonicsWord('lick', 'l', 'ick', '舔', '👅🍦', ['l', 'k', 'p']),
      ],
    },
    {
      title: 'i 和 o 去探险',
      english: '-ig · -in · -ill · -og',
      words: [
        phonicsWord('pig', 'p', 'ig', '猪', '🐷', ['p', 'w', 'd']),
        phonicsWord('wig', 'w', 'ig', '假发', '💇🪮', ['w', 'p', 'd']),
        phonicsWord('pin', 'p', 'in', '别针', '🧷', ['p', 'f', 't']),
        phonicsWord('fin', 'f', 'in', '鱼鳍', '🦈', ['f', 'p', 't']),
        phonicsWord('hill', 'h', 'ill', '小山', '⛰️', ['h', 'm', 'p']),
        phonicsWord('dog', 'd', 'og', '狗', '🐕', ['d', 'l', 'f']),
        phonicsWord('log', 'l', 'og', '圆木', '🪵', ['l', 'd', 'f']),
      ],
    },
    {
      title: 'o 的宝藏箱',
      english: '-ob · -od · -op · -ot · -ox · -ock',
      words: [
        phonicsWord('cob', 'c', 'ob', '玉米棒', '🌽', ['c', 'j', 's']),
        phonicsWord('rod', 'r', 'od', '钓鱼竿', '🎣', ['r', 'n', 'p']),
        phonicsWord('mop', 'm', 'op', '拖把', '🪣🧹', ['m', 'h', 't']),
        phonicsWord('hop', 'h', 'op', '跳一跳', '🐇💨', ['h', 'm', 't']),
        phonicsWord('pot', 'p', 'ot', '锅', '🍲', ['p', 'h', 'd']),
        phonicsWord('fox', 'f', 'ox', '狐狸', '🦊', ['f', 'b', 'p']),
        phonicsWord('box', 'b', 'ox', '盒子', '📦', ['b', 'f', 'p']),
        phonicsWord('sock', 's', 'ock', '袜子', '🧦', ['s', 'r', 'l']),
      ],
    },
  ],
};

export const WORDS = Object.fromEntries(
  Object.entries(UNITS).map(([book, units]) => [
    book,
    units.flatMap((unit, index) =>
      unit.words.map((word) => ({
        ...word,
        book,
        unit: index + 1,
        id: `${book}-${index + 1}-${word.word.replaceAll(' ', '-')}`,
      })),
    ),
  ]),
);

export const WORD_BY_ID = new Map(
  Object.values(WORDS)
    .flat()
    .map((word) => [word.id, word]),
);
