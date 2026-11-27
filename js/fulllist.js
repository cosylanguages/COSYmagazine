/**
 * COSYmagazine: print / download for the Top 10 "full list" tables.
 * A list is a bar (.fulllist-bar[data-list]) plus one or more table pieces (.fulllist-table[data-list]).
 * The book may have split the table over several pages; every piece shares the same data-list id, so
 * printing and downloading always use the whole list.
 */
(function () {
  'use strict';

  function pieces(id) {
    return Array.from(document.querySelectorAll('.fulllist-table[data-list="' + id + '"]'))
      .filter(function (el) { return !el.closest('.page-leaf'); });
  }

  function collect(id) {
    const parts = pieces(id);
    const head = [];
    const rows = [];
    parts.forEach(function (part, i) {
      if (i === 0) {
        part.querySelectorAll('thead th').forEach(function (th) { head.push(th.textContent.trim()); });
      }
      part.querySelectorAll('tbody tr').forEach(function (tr) {
        rows.push(Array.from(tr.children).map(function (td) { return td.textContent.replace(/\s+/g, ' ').trim(); }));
      });
    });
    return { head: head, rows: rows };
  }

  function csvCell(v) {
    return '"' + String(v).replace(/"/g, '""') + '"';
  }

  function downloadCsv(bar) {
    const id = bar.getAttribute('data-list');
    const data = collect(id);
    const lines = [data.head].concat(data.rows).map(function (r) { return r.map(csvCell).join(','); });
    // BOM so Excel opens accents, Cyrillic and Greek correctly
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (bar.getAttribute('data-file') || 'cosymagazine-list') + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // Prints (or saves as PDF, from the same dialog) just the table, as one clean page
  function printList(bar) {
    const id = bar.getAttribute('data-list');
    const data = collect(id);
    const sheet = document.createElement('div');
    sheet.className = 'cosy-print-sheet';
    const title = (bar.querySelector('.fulllist-title') || {}).textContent || document.title;
    const esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
    sheet.innerHTML =
      '<h1>' + esc(title) + '</h1><table><thead><tr>' +
      data.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      data.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table><p class="print-foot">COSYmagazine · cosylanguages.github.io/COSYmagazine</p>';
    document.body.appendChild(sheet);
    document.body.classList.add('printing-fulllist');
    const cleanup = function () {
      document.body.classList.remove('printing-fulllist');
      sheet.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Safari/Firefox fire afterprint reliably; this is only a safety net
    setTimeout(function () { if (sheet.isConnected && !document.hidden) cleanup(); }, 60000);
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.fulllist-btn');
    if (!btn) return;
    const bar = btn.closest('.fulllist-bar');
    if (!bar) return;
    e.stopPropagation();
    const act = btn.getAttribute('data-act');
    if (act === 'csv') downloadCsv(bar);
    else printList(bar);
  });
})();
