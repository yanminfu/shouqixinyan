/* 轻量 Markdown 渲染器（智能体输出用）：标题/列表/表格/引用/加粗/行内代码，转义防注入 */
(function () {
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function render(src) {
    const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    let html = '', i = 0;
    const inList = { ul: false, ol: false };
    const closeLists = () => {
      if (inList.ul) { html += '</ul>'; inList.ul = false; }
      if (inList.ol) { html += '</ol>'; inList.ol = false; }
    };
    while (i < lines.length) {
      const line = lines[i];
      // 表格
      if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s\-:|]+\|\s*$/.test(lines[i + 1])) {
        closeLists();
        const header = line.split('|').slice(1, -1).map((c) => c.trim());
        i += 2;
        const rows = [];
        while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
          rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
          i++;
        }
        html += '<table><thead><tr>' + header.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>';
        html += rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('');
        html += '</tbody></table>';
        continue;
      }
      const h = line.match(/^(#{1,4})\s+(.*)/);
      if (h) { closeLists(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }
      if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeLists(); html += '<hr>'; i++; continue; }
      if (/^&gt;\s?/.test(esc(line)) || /^>\s?/.test(line)) { closeLists(); html += `<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`; i++; continue; }
      const ul = line.match(/^\s*[-*]\s+(.*)/);
      if (ul) {
        if (!inList.ul) { closeLists(); html += '<ul>'; inList.ul = true; }
        html += `<li>${inline(ul[1])}</li>`; i++; continue;
      }
      const ol = line.match(/^\s*\d+[.、]\s*(.*)/);
      if (ol) {
        if (!inList.ol) { closeLists(); html += '<ol>'; inList.ol = true; }
        html += `<li>${inline(ol[1])}</li>`; i++; continue;
      }
      if (line.trim() === '') { closeLists(); i++; continue; }
      closeLists();
      html += `<p>${inline(line)}</p>`;
      i++;
    }
    closeLists();
    return html;
  }
  window.MD = { render, esc };
})();
