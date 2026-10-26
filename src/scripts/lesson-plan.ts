export function currentQuarter(date: Date) {
  const month = date.getMonth();
  return month >= 8 && month <= 9 ? 1 : month >= 10 ? 2 : month <= 2 ? 3 : month <= 4 ? 4 : 1;
}

export function initLessonPlan(root: HTMLElement, today = new Date()) {
  const win = root.ownerDocument.defaultView!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-quarter-button]')];
  const ready = root.querySelector<HTMLInputElement>('[data-ready-only]')!;
  const panes = [...root.querySelectorAll<HTMLElement>('[data-plan-pane]')];
  const status = root.querySelector<HTMLElement>('[data-plan-status]')!;
  let quarter = String(currentQuarter(today));

  function render(writeURL = false) {
    let visibleCount = 0;
    for (const button of buttons) {
      const pane = panes.find(p => p.dataset.quarter === button.dataset.quarterButton)!;
      const count = pane.querySelectorAll('[data-lesson][data-ready="true"]').length;
      const extraCount = Number(pane.querySelector<HTMLElement>('[data-quarter-additional]')?.dataset.additionalCount ?? 0);
      button.setAttribute('aria-pressed', String(button.dataset.quarterButton === quarter));
      button.setAttribute('aria-label', `${button.dataset.quarterButton} четверть, тем с материалами: ${count}, дополнительных материалов: ${extraCount}`);
      button.querySelector<HTMLElement>('[data-count]')!.textContent = ` · ${count + extraCount}`;
    }
    for (const pane of panes) {
      pane.hidden = pane.dataset.quarter !== quarter;
      let count = 0;
      pane.querySelectorAll<HTMLElement>('[data-lesson]').forEach(row => {
        row.hidden = ready.checked && row.dataset.ready !== 'true';
        if (!row.hidden) count++;
      });
      pane.querySelector<HTMLElement>('[data-empty]')!.hidden = count > 0;
      if (!pane.hidden) visibleCount = count;
    }
    status.textContent = `${quarter} четверть. Показано тем: ${visibleCount}. Дополнительных материалов: ${panes.find(p => !p.hidden)?.querySelector<HTMLElement>('[data-quarter-additional]')?.dataset.additionalCount ?? 0}.`;
    if (writeURL) {
      const url = new URL(win.location.href);
      url.searchParams.set('quarter', quarter);
      if (ready.checked) url.searchParams.set('ready', '1'); else url.searchParams.delete('ready');
      win.history.replaceState(null, '', url);
    }
    // При переходе в другой класс сохраняем выбранную четверть и фильтр.
    root.querySelectorAll<HTMLAnchorElement>('[data-grade-link]').forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('quarter', quarter);
      if (ready.checked) url.searchParams.set('ready', '1'); else url.searchParams.delete('ready');
      link.href = url.href;
    });
  }
  function readURL() {
    const params = new URL(win.location.href).searchParams;
    quarter = ['1', '2', '3', '4'].includes(params.get('quarter') ?? '') ? params.get('quarter')! : String(currentQuarter(today));
    ready.checked = params.get('ready') === '1';
    render();
  }
  root.querySelectorAll<HTMLElement>('[data-plan-controls]').forEach(el => el.hidden = false);
  buttons.forEach(button => button.addEventListener('click', () => { quarter = button.dataset.quarterButton!; render(true); }));
  ready.addEventListener('change', () => render(true));
  win.addEventListener('popstate', readURL);
  readURL();
}
