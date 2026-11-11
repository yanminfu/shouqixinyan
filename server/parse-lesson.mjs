// 把 docx2txt.mjs 抽出的教案纯文本解析成结构化 JSON
// 用法: node server/parse-lesson.mjs <目录> [输出.json]
// 目录内需为 *.txt（同模板：具身认知手工创意课程教案收集表）
import fs from 'node:fs';
import path from 'node:path';

const FIELDS = [
  ['课程名称', 'title'],
  ['课型', 'typeRaw'],
  ['授课对象', 'grades'],
  ['课时安排', 'duration'],
  ['授课时间', 'date'],
  ['授课地点', 'place'],
  ['项目团队', 'team'],
  ['对应研究问题', 'researchQ'],
  ['收集日期', 'collectDate'],
  ['具身认知目标（身体参与）', 'objBody'],
  ['具身认知目标（环境参与）', 'objEnv'],
  ['具身认知目标（生成性）', 'objGen'],
  ['自我表达与美育／劳动目标', 'objExp'],
  ['开放性材料清单', 'materials'],
  ['场地与设备准备', 'space'],
  ['前置知识／经验准备', 'prior'],
  ['中介工具准备', 'tools'],
  ['教学效果评估', 'effect'],
  ['问题与改进', 'improve'],
  ['具身化教学感受', 'embodied'],
];

// 表格行以 "| " 开头，但同一单元格的续行可能没有竖线；统一去掉行首竖线
const strip = (s) => s.replace(/^\s*\|\s?/, '').trim();

const STOP = /^(?:[一二三四五六七八九十]+、|（[一二三四]）|环节要素|目标维度|准备项目|记录项目|观察维度|反思项目|数据关联项|填写说明|本表适用于)/;
const STAGE_LABELS = ['教师活动', '学生活动', '设计意图', '时间分配'];

function tokenize(text) {
  return text
    .split(/\r?\n/)
    .map(strip)
    .filter(Boolean);
}

function takeValue(tokens, label) {
  const idx = tokens.indexOf(label);
  if (idx < 0) return '';
  const out = [];
  for (let i = idx + 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (FIELDS.some(([lb]) => t === lb)) break;
    if (STAGE_LABELS.includes(t)) break;
    if (STOP.test(t)) break;
    out.push(t);
  }
  return out.join('\n');
}

function parseType(raw) {
  // 课型：□纸艺 □泥塑 … ☑其他：面具彩绘
  const other = raw.match(/☑\s*其他\s*[：:]\s*([^\s□☑]+)/);
  if (other) return other[1].trim();
  const picked = raw.match(/☑\s*([^\s□☑]+)/);
  if (picked) return picked[1].trim();
  return '';
}

const STAGE_NAMES = ['触材启思', '手运心生', '物成言立', '评鉴生新'];

function parseStages(text) {
  const start = text.indexOf('四、教学过程');
  const end = text.indexOf('五、学生作品记录');
  const body = text.slice(start, end > start ? end : undefined);
  const parts = body.split(/\n(?=（[一二三四]）)/).filter((p) => /^（[一二三四]）/.test(p.trim()));
  return parts.map((p, i) => {
    const tokens = tokenize(p);
    const head = tokens[0];
    const name = STAGE_NAMES[i] || head.replace(/^（[一二三四]）/, '').split('——')[0];
    const desc = (p.match(/【环节说明】([\s\S]*?)\n/) || [, ''])[1].trim();
    return {
      name,
      desc,
      teacher: takeValue(tokens, '教师活动'),
      student: takeValue(tokens, '学生活动'),
      intent: takeValue(tokens, '设计意图'),
      minutes: takeValue(tokens, '时间分配').replace(/分钟$/, ''),
    };
  });
}

function parseMaterials(raw) {
  return raw
    .split(/\n(?=\d+[.、])/)
    .map((s) => s.replace(/^\d+[.、]\s*/, '').trim())
    .filter(Boolean);
}

function parseOne(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const tokens = tokenize(text);
  const rec = { source: path.basename(file).replace(/\.txt$/, '') };
  for (const [label, key] of FIELDS) rec[key] = takeValue(tokens, label);
  rec.type = parseType(rec.typeRaw);
  delete rec.typeRaw;
  rec.grades = rec.grades.replace(/^年级\s*\/\s*年龄段\s*[：:]\s*/, '');
  rec.researchQ = (rec.researchQ.match(/☑\s*(Q\d\s*[^\s□☑]+)/) || [, rec.researchQ.replace(/\s+/g, ' ').trim()])[1];
  rec.place = rec.place.split('\n')[0];
  rec.materials = parseMaterials(rec.materials);
  rec.stages = parseStages(text);
  rec.minutesTotal = rec.stages.reduce((a, s) => a + (parseInt(s.minutes, 10) || 0), 0);
  return rec;
}

const dir = process.argv[2];
if (!dir) {
  console.error('用法: node server/parse-lesson.mjs <目录> [输出.json]');
  process.exit(1);
}
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt')).sort();
const all = files.map((f) => parseOne(path.join(dir, f)));
const out = process.argv[3];
if (out) {
  fs.writeFileSync(out, JSON.stringify(all, null, 2), 'utf8');
  console.log(`已写入 ${out}（${all.length} 份）`);
} else {
  console.log(JSON.stringify(all, null, 2));
}
