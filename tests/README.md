# 游戏验证

单元测试和静态检查：

```sh
npm ci
npm test
npm run lint
```

浏览器验证复用 Playwright。先从项目根目录启动静态服务器：

```sh
python3 -m http.server 8104 --bind 127.0.0.1
```

另开终端运行。`PLAYWRIGHT_MODULE` 可以指定现有 Playwright 安装路径；安装在当前项目时可省略。使用 Playwright 自带 Chromium 时可省略 `BROWSER_CHANNEL`。

```sh
PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_CHANNEL=chrome node tests/mobile-layout.e2e.cjs
PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_CHANNEL=chrome COLORING_BASE_URL=http://127.0.0.1:8104 node tests/coloring-game.e2e.cjs
```

`MOBILE_BASE_URL` 可覆盖适配测试地址。`MOBILE_VIEWPORTS='[[390,844]]'` 可只重跑指定尺寸。

适配测试默认覆盖 320×568、390×844、844×390 和 1365×1000：

- 首页全部五个游戏入口和页面横向溢出。
- 小蜜蜂开始、触控方向键、手指拖动、暂停及旋转后的按钮位置。
- 涂画的颜色按钮尺寸、点按涂色、刷新恢复和切换画纸。
- 小熊超市接待顾客、调整报价、成交和打烊；捕获安全策略拦截。
- 小厨师打开食谱、买菜、骑车回家、翻炒、完成一道菜及重新购物。
- 小公主选择服装、完成展示和继续换装。

涂画专项另覆盖画笔、橡皮、撤销重做、清空确认、PNG 下载、离线打开和触屏绘制。截图保存到运行输出中的临时目录。浏览器模拟不替代 Android / iOS 真机验收。
