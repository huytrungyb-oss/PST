#!/usr/bin/env node
// Gộp index.html + css + js thành một file HTML duy nhất (chế độ giả lập) để chia sẻ / xem thử.
const fs = require('fs');
const path = require('path');
const pub = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
let body = html.split('<!--BUNDLE:START-->')[1].split('<!--BUNDLE:END-->')[0];
body = body.replace(/<\/head>\s*<body>/, '');
body = body.replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${fs.readFileSync(path.join(pub, 'style.css'), 'utf8')}</style>`);
body = body.replace(/<script src="([\w.-]+)"><\/script>/g, (_, f) => `<script>\n${fs.readFileSync(path.join(pub, f), 'utf8')}</script>`);
const out = path.join(__dirname, '..', 'dist', 'my-office.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body.trim() + '\n');
console.log('Đã tạo', out, Math.round(body.length / 1024) + ' KB');
