export function initEge(root: HTMLElement) {
  const win = root.ownerDocument.defaultView!;
  const filter = root.querySelector<HTMLInputElement>('[data-ege-ready]')!;
  const rows = [...root.querySelectorAll<HTMLElement>('[data-ege-task]')];
  const status = root.querySelector<HTMLElement>('[data-ege-status]')!;
  const empty = root.querySelector<HTMLElement>('[data-ege-empty]')!;
  function render(writeURL = false) {
    let visible = 0;
    rows.forEach(row => {
      row.hidden = filter.checked && row.dataset.ready !== 'true';
      if (!row.hidden) visible++;
    });
    empty.hidden = visible > 0;
    status.textContent = `Показано заданий: ${visible} из ${rows.length}.`;
    if (writeURL) {
      const url = new URL(win.location.href);
      url.searchParams.delete('quarter');
      if (filter.checked) url.searchParams.set('ready', '1'); else url.searchParams.delete('ready');
      win.history.replaceState(null, '', url);
    }
    const page = root.closest('section.plan-page');
    page?.querySelectorAll<HTMLAnchorElement>('[data-ege-grade-link]').forEach(link => {
      const url = new URL(link.href);
      if (filter.checked) url.searchParams.set('ready', '1'); else url.searchParams.delete('ready');
      link.href = url.href;
    });
  }
  function readURL() {
    filter.checked = new URL(win.location.href).searchParams.get('ready') === '1';
    render();
  }
  root.querySelector<HTMLElement>('[data-ege-controls]')!.hidden = false;
  filter.addEventListener('change', () => render(true));
  win.addEventListener('popstate', readURL);
  readURL();
}
