import { mkdir, cp } from 'node:fs/promises';
await mkdir('dist', {recursive:true});
for (const file of ['index.html','styles.css','app.js','demo-data.js','vendor']) {
  await cp(file, `dist/${file}`, {recursive:true});
}
console.log('Demo estática lista en dist/. No requiere variables de entorno.');
