/* docx 正文抽取：node server/docx2txt.mjs <in.docx> [out.txt]
   只取正文文字，保留段落与表格行的结构，不依赖任何第三方库 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , input, output] = process.argv;
if (!input) {
  console.error('用法：node server/docx2txt.mjs <in.docx> [out.txt]');
  process.exit(1);
}

const xml = execFileSync('unzip', ['-p', input, 'word/document.xml'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');

const decode = (s) => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&');

const text = xml
  .replace(/<w:tab\/>/g, '\t')
  .replace(/<w:br\/>/g, '\n')
  .replace(/<\/w:tc>/g, ' | ')
  .replace(/<\/w:tr>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (_, t) => decode(t))
  .replace(/<[^>]+>/g, '')
  .split('\n')
  .map((l) => l.replace(/[ \t]+$/g, '').replace(/\s*\|\s*$/, '').trimEnd())
  .filter((l, i, arr) => l.trim() || (i > 0 && arr[i - 1].trim()))
  .join('\n')
  .trim();

if (output) {
  fs.writeFileSync(output, text, 'utf8');
  console.log('OK', output, text.length, '字');
} else {
  process.stdout.write(text);
}
