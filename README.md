# Poster Foundry · GPT-Image 海报工坊

单文件的海报出图工作台：定用途、写文案、选版式和视觉语言，直接调用 gpt-image 系模型出「能直接排版的底图」，再按发布或打印尺寸导出。

- 纯前端、无后端、无构建步骤：`index.html` 就是全部。
- 电脑和手机都可用。手机版分成「设置 / 出图」两屏，底部一条操作栏（设置 / 出图 / 生成）。
- 四种出图方式：海报模式、创意模式、灵感模式（自动抽配方）、原样出图。
- 支持参考图（图生图 / 编辑）、安全边距、按规格导出、本会话历史。

## 用法（线上版）

1. 打开 **API 设置**（电脑在左栏顶部，手机在左上角那个滑块图标）。
2. 填 **API Base URL** 和 **模型名**，把自己的 **Key** 粘到「临时 Key」里。
   - Key 只存在浏览器当前标签页（sessionStorage），关掉标签页即失效，不会写进文件或仓库。
   - Base URL、模型、预设会记住，下次打开直接出图。
3. 没有 Key 也能先试版式：打开「高级 → 演示模式」，本地画占位底图，用来检查比例、安全边距和导出尺寸。

## 部署到 GitHub Pages

免费账号的 Pages 只能对**公开仓库**开启，也就是这份 HTML 会公开可见。因此：
**文件里不要写任何 Key**（本目录的 `index.html` 已确认不含 Key），谁用谁填自己的 Key。

### 第一次部署

1. 在 GitHub 网页上新建仓库，例如 `poster-foundry`，选 **Public**，**不要**勾选自动生成 README。
2. 在本目录执行：

```bash
git init
git add index.html README.md
git commit -m "Poster Foundry: single-file poster studio"
git branch -M main
git remote add origin https://github.com/<你的用户名>/poster-foundry.git
git push -u origin main
```

3. 仓库页面 → **Settings → Pages** → Source 选 **Deploy from a branch** → Branch 选 **main**、目录选 **/(root)** → **Save**。
4. 等 1–2 分钟，打开 `https://<你的用户名>.github.io/poster-foundry/`。

### 以后更新

```bash
git add index.html
git commit -m "update"
git push
```

推送后 Pages 会自动重新发布；等一分钟刷新（强刷：Ctrl/Cmd + Shift + R）即可看到新版。

### 可选：绑自己的域名

仓库 **Settings → Pages → Custom domain** 填域名，按提示在域名服务商加一条 CNAME 指向 `<你的用户名>.github.io`，再勾选 Enforce HTTPS。

## 几点说明

- 页面直接请求你填的 Base URL（默认 `https://aixor.cc/v1`）。该网关的 CORS 预检返回 `access-control-allow-origin: *`，所以纯静态托管也能直连出图，不需要后端。
- 出图会消耗你自己网关的额度。
- 图标走 unpkg CDN（失败会自动切 jsdelivr、npmmirror），字体走 Google Fonts。断网时图标和字体退化，功能不受影响。
- 仓库是公开的：别人打开只能看到一个空壳页面，没有 Key 就出不了图；反过来，你自己的 Key 只在浏览器里，也不会因此泄露。
