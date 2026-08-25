# Boss 刷新倒计时

记录游戏 Boss 击杀时间的小工具：每条线点击一下即记录击杀时间并进入刷新倒计时，倒计时越接近刷新，卡片颜色从绿渐变到红，刷新后红色闪烁并可播放提示音。

## Boss 配置

| Boss | 刷新周期 |
| --- | --- |
| 蘑菇王 / 僵尸蘑菇王 / 浮士德 / 多尔 | 30 分钟 |
| 巨居蟹 | 20 分钟 |
| 蝙蝠怪 | 3 小时 |

每个 Boss 60 条线。数据保存在浏览器本地（localStorage）。

## 在线使用

打开 GitHub Pages 地址后，可在浏览器菜单中选择「安装应用 / 添加到主屏幕」，桌面或手机会生成图标，点开即用（支持离线）。

## 本地开发

```bash
npm install
npm run dev      # 开发预览
npm run build    # 构建到 dist/
```

技术栈：React + TypeScript + Vite + Tailwind CSS + shadcn/ui
