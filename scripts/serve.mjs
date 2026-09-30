import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const publicFiles = new Set(['index.html','styles.css','app.js','demo-data.js','vendor/qrcode.js','vendor/jsqr.js']);
http.createServer(async (req,res) => {
  try {
    let file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
    if (!publicFiles.has(file)) {
      if (path.extname(file)) {res.writeHead(404); res.end('No encontrado'); return;}
      file = 'index.html';
    }
    const data = await readFile(path.join(root, file));
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  } catch {res.writeHead(404);res.end('No encontrado');}
}).listen(port, '0.0.0.0', () => console.log(`Demo disponible en http://localhost:${port}`));
