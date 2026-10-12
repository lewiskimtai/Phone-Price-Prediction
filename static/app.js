// Phone price check. Each phone form narrows its dropdowns to the phones on sale that match the choices so far
// (brand -> product line -> tier -> release year -> condition and specs) and asks /predict for a live estimate.
// A second form (phone B) can be added to compare two phones.

const TIERS = {
  'Lite': 'Cheaper edition: FE, Lite, mini or "a" models',
  'Base': 'The standard model, with no suffix',
  'Plus': 'Bigger standard model: Plus, Max, Air or Edge',
  'Pro': 'Pro models',
  'Pro Max': 'Top Pro model: Pro Max, Pro XL or Pro Plus',
  'Ultra': 'Ultra models',
  'Foldable': 'Fold, Flip and other folding phones',
};
const LINE_HINTS = {
  'Galaxy A': 'For Galaxy A, the first digit sets the tier: A0x and A1x are Lite, A2x and A3x are Base, A5x is Pro.',
};
const CONDITIONS = { 'Brand New': 'Brand new', 'Premium Repack': 'Premium repack', 'UK Used': 'UK used' };

// Spec dropdowns and how each value is shown
const SPECS = {
  ram: (v) => memory(v),
  rom: (v) => memory(v),
  screen_size: (v) => `${v} inches`,
  mp: (v) => `${v} MP`,
  battery: (v) => `${v.toLocaleString('en-UG')} mAh`,
};

// Ruler scale (log), in UGX
const RULER_MIN = 150_000;
const RULER_MAX = 20_000_000;
const RULER_STOPS = [250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];

const $ = (id) => document.getElementById(id);

let phones = [];              // every phone on sale, from /options
const forms = {};             // slot ('a' or 'b') -> PhoneForm
const estimates = {};         // slot -> { prediction, low, high, label }
let resultInView = true;

// Formatting --------------------------------------------------------------
const fullUGX = (n) => (Math.round(n / 1000) * 1000).toLocaleString('en-UG');

function shortUGX(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  return `${Math.round(n / 1000)}K`;
}

function memory(gb) {
  if (gb >= 1024) return `${gb / 1024} TB`;
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  return `${gb} GB`;
}

const rulerPosition = (price) => {
  const clamped = Math.min(Math.max(price, RULER_MIN), RULER_MAX);
  return (Math.log(clamped) - Math.log(RULER_MIN)) / (Math.log(RULER_MAX) - Math.log(RULER_MIN)) * 100;
};

const uniqueValues = (rows, key) => [...new Set(rows.map((r) => r[key]))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

const isComparing = () => 'b' in forms;

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// One phone's form --------------------------------------------------------
class PhoneForm {
  constructor(slot) {
    this.slot = slot;
    this.requestId = 0;
    this.debounceTimer = null;
    this.form = $('phone-template').content.firstElementChild.cloneNode(true);
    this.form.dataset.slot = slot;

    // Give every control an id unique to this phone, so labels and ARIA references still work
    const id = (name) => `${slot}-${name}`;
    for (const select of this.form.querySelectorAll('select')) select.id = id(select.name);
    for (const label of this.form.querySelectorAll('[data-for]')) label.htmlFor = id(label.dataset.for);
    for (const el of this.form.querySelectorAll('[data-id]')) el.id = id(el.dataset.id);
    for (const el of this.form.querySelectorAll('[data-labelledby]')) el.setAttribute('aria-labelledby', id(el.dataset.labelledby));
    for (const el of this.form.querySelectorAll('[data-describedby]')) el.setAttribute('aria-describedby', id(el.dataset.describedby));

    const name = slot.toUpperCase();
    this.form.querySelector('.phone-tag').textContent = name;
    this.form.querySelector('.phone-title-text').textContent = `Phone ${name}`;
    this.form.setAttribute('aria-label', `Phone ${name}`);
    this.form.querySelector('.remove-button').addEventListener('click', () => removePhoneB());

    const steps = {
      brand: () => this.onBrandChange(),
      series: () => this.onSeriesChange(),
      tier: () => this.onTierChange(),
      release_year: () => this.onYearChange(),
    };
    this.form.addEventListener('change', (event) => (steps[event.target.name] ?? (() => this.requestPrice()))());
    this.form.addEventListener('submit', (event) => event.preventDefault());
  }

  // Reading and filling controls
  value(name) {
    const control = this.form.elements[name];
    if (!control) return '';  // radio choices not built yet
    return control instanceof RadioNodeList || control.type === 'radio'
      ? (this.form.querySelector(`input[name="${name}"]:checked`)?.value ?? '')
      : control.value;
  }

  matching(...names) {
    return phones.filter((p) => names.every((name) => String(p[name]) === this.value(name)));
  }

  fillSelect(name, values, label = (v) => v, preferred) {
    const select = this.form.elements[name];
    const previous = select.value;
    select.replaceChildren(...values.map((v) => new Option(label(v), v)));
    const strings = values.map(String);
    select.value = [previous, preferred].map(String).find((v) => strings.includes(v)) ?? strings[0];
  }

  fillChoices(name, values, label = (v) => v, preferred) {
    const previous = this.value(name);
    const container = this.form.querySelector(`[data-choices="${name}"]`);
    container.replaceChildren(...values.map((value) => {
      const wrapper = element('label', 'choice');
      wrapper.append(Object.assign(document.createElement('input'), { type: 'radio', name, value }), element('span', '', label(value)));
      return wrapper;
    }));
    this.check(name, [previous, preferred].find((v) => values.includes(v)) ?? values[0]);
  }

  check(name, value) {
    const input = this.form.querySelector(`input[name="${name}"][value="${CSS.escape(String(value))}"]`);
    if (input) input.checked = true;
    return Boolean(input);
  }

  // The chain: each step narrows the next
  onBrandChange(preferredLine) {
    this.fillSelect('series', uniqueValues(this.matching('brand'), 'series'), (s) => s, preferredLine);
    this.onSeriesChange();
  }

  onSeriesChange() {
    const available = uniqueValues(this.matching('brand', 'series'), 'tier');
    this.fillChoices('tier', Object.keys(TIERS).filter((t) => available.includes(t)), (t) => t, 'Base');
    this.onTierChange({ keepYear: false });
  }

  // Within a line, switching tier keeps the year (e.g. iPhone 15 Pro -> 15 Pro Max); a new brand or line starts at its newest year
  onTierChange({ keepYear = true } = {}) {
    this.form.querySelector('[data-id="tier-hint"]').textContent = LINE_HINTS[this.value('series')] || TIERS[this.value('tier')];
    const years = uniqueValues(this.matching('brand', 'series', 'tier'), 'release_year').reverse();
    if (!keepYear) this.form.elements.release_year.value = '';
    this.fillSelect('release_year', years, (y) => y, years[0]);
    this.onYearChange();
  }

  onYearChange() {
    const rows = this.matching('brand', 'series', 'tier', 'release_year');
    const available = uniqueValues(rows, 'condition');
    this.fillChoices('condition', Object.keys(CONDITIONS).filter((c) => available.includes(c)), (c) => CONDITIONS[c], 'Brand New');

    // Specs start from a real phone: the middle-priced listing for this year and condition
    const sameCondition = rows.filter((p) => p.condition === this.value('condition'));
    const pool = (sameCondition.length ? sameCondition : rows).toSorted((a, b) => a.price - b.price);
    const typical = pool[Math.floor(pool.length / 2)];
    for (const [name, label] of Object.entries(SPECS)) {
      this.form.elements[name].value = '';  // a new year means a different model, so reset to its typical specs
      this.fillSelect(name, uniqueValues(rows, name), label, typical[name]);
    }
    this.requestPrice();
    if (this.slot === 'a') highlightLine();
  }

  start(brand, line) {
    this.fillSelect('brand', uniqueValues(phones, 'brand'), (b) => b, brand);
    this.onBrandChange(line);
  }

  // Phone B starts as a copy of phone A, so one change shows what it is worth
  copyFrom(other) {
    this.start(other.value('brand'), other.value('series'));
    if (this.check('tier', other.value('tier'))) this.onTierChange({ keepYear: false });
    this.form.elements.release_year.value = other.value('release_year');
    this.onYearChange();
    this.check('condition', other.value('condition'));
    for (const name of Object.keys(SPECS)) this.form.elements[name].value = other.value(name);
    this.requestPrice();
  }

  describe() {
    return [`${this.value('series')} ${this.value('tier')}`, this.value('release_year'),
      memory(Number(this.value('rom'))), CONDITIONS[this.value('condition')]].join(' · ');
  }

  // Asking the model
  requestPrice() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.fetchPrice(), 180);
  }

  async fetchPrice() {
    const names = ['brand', 'series', 'tier', 'release_year', 'condition', ...Object.keys(SPECS)];
    const params = new URLSearchParams(names.map((name) => [name, this.value(name)]));
    const requestId = ++this.requestId;
    $('result').classList.add('is-loading');
    try {
      const response = await fetch(`/predict?${params}`, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const estimate = await response.json();
      if (requestId !== this.requestId || forms[this.slot] !== this) return; // outdated, or this phone was removed
      estimates[this.slot] = { ...estimate, label: this.describe() };
      showStatus('');
      renderResult();
    } catch {
      if (requestId !== this.requestId) return;
      showStatus("Couldn't get a price from the server. Check that python main.py is still running, then change any field to try again.");
    } finally {
      if (requestId === this.requestId) $('result').classList.remove('is-loading');
    }
  }
}

// Adding and removing phone B ---------------------------------------------
function addPhoneB() {
  forms.b = new PhoneForm('b');
  $('phones').append(forms.b.form);
  $('layout').classList.add('is-comparing');
  $('compare-button').hidden = true;
  forms.b.copyFrom(forms.a);
  highlightLine();
  forms.b.form.elements.brand.focus();
}

function removePhoneB() {
  forms.b.form.remove();
  delete forms.b;
  delete estimates.b;
  $('layout').classList.remove('is-comparing');
  $('compare-button').hidden = false;
  highlightLine();
  renderResult();
  $('compare-button').focus();
}

// Result panel ------------------------------------------------------------
function renderResult() {
  const slots = Object.keys(estimates).sort();
  const box = $('estimates');

  if (!isComparing()) {
    const { prediction, low, high } = estimates.a;
    const price = element('p', 'price');
    price.append(element('span', 'currency', 'UGX'), element('span', 'price-value', fullUGX(prediction)));
    box.replaceChildren(price, element('p', 'range', `Likely between UGX ${shortUGX(low)} and ${shortUGX(high)}`));
  } else {
    box.replaceChildren(...slots.map((slot) => {
      const { prediction, low, high, label } = estimates[slot];
      const row = element('div', 'estimate-row');
      row.dataset.slot = slot;
      const body = element('div');
      const price = element('p', 'price price-compact');
      price.append(element('span', 'currency', 'UGX'), element('span', 'price-value', fullUGX(prediction)));
      body.append(element('p', 'estimate-name', label), price,
        element('p', 'range', `Likely between UGX ${shortUGX(low)} and ${shortUGX(high)}`));
      row.append(element('span', 'phone-tag', slot.toUpperCase()), body);
      return row;
    }));
  }

  renderComparison();
  renderRuler(slots);
  renderPriceBar(slots);
}

function renderComparison() {
  const text = $('comparison');
  text.hidden = !(isComparing() && estimates.a && estimates.b);
  if (text.hidden) return;
  const { a, b } = estimates;
  const [high, low, highName, lowName] = a.prediction >= b.prediction ? [a, b, 'A', 'B'] : [b, a, 'B', 'A'];
  const gap = high.prediction - low.prediction;
  const percent = Math.round(gap / low.prediction * 100);
  let sentence = percent < 2
    ? 'Both phones are likely to cost about the same.'
    : `Phone ${highName} likely costs UGX ${shortUGX(gap)} more than phone ${lowName} (${percent}% more).`;
  if (percent >= 2 && low.high >= high.low) sentence += ' Their likely ranges overlap, so the real gap could be smaller.';
  text.textContent = sentence;
}

// Price ruler -------------------------------------------------------------
function buildRuler() {
  $('ruler-ticks').replaceChildren(...phones.map((phone) => {
    const tick = element('div', 'tick');
    tick.style.left = `${rulerPosition(phone.price)}%`;
    tick.dataset.line = `${phone.brand}|${phone.series}`;
    return tick;
  }));
  $('ruler-labels').replaceChildren(...RULER_STOPS.map((stop) => {
    const label = element('span', '', shortUGX(stop));
    label.style.left = `${rulerPosition(stop)}%`;
    return label;
  }));
}

// One phone: its product line's listings are highlighted. Two phones: each gets its own band instead.
function highlightLine() {
  const a = forms.a;
  const key = isComparing() ? null : `${a.value('brand')}|${a.value('series')}`;
  let count = 0;
  for (const tick of $('ruler-ticks').children) {
    const match = tick.dataset.line === key;
    tick.classList.toggle('is-line', match);
    count += match;
  }
  $('legend').replaceChildren(...(isComparing()
    ? [legendItem('var(--sticker)', 'Phone A likely range'), legendItem('var(--mint)', 'Phone B likely range'),
       legendItem('var(--muted)', 'Phones on sale')]
    : [legendItem('var(--cobalt)', `${a.value('series')} listings (${count})`), legendItem('var(--muted)', 'Other listings'),
       legendItem('var(--sticker)', 'Likely price range')]));
}

function legendItem(color, text) {
  const item = element('span');
  const swatch = element('i');
  swatch.style.background = color;
  item.append(swatch, text);
  return item;
}

function renderRuler(slots) {
  const ruler = $('ruler');
  for (const old of ruler.querySelectorAll('.ruler-band, .marker')) {
    if (!slots.includes(old.dataset.slot)) old.remove();
  }
  for (const slot of slots) {
    const { prediction, low, high } = estimates[slot];
    let band = ruler.querySelector(`.ruler-band[data-slot="${slot}"]`);
    let marker = ruler.querySelector(`.marker[data-slot="${slot}"]`);
    if (!band) {
      band = element('div', 'ruler-band');
      marker = element('div', 'marker');
      band.dataset.slot = marker.dataset.slot = slot;
      marker.append(element('span', 'marker-label'));
      ruler.prepend(band);
      ruler.append(marker);
    }
    const left = rulerPosition(low);
    band.style.left = `${left}%`;
    band.style.width = `${rulerPosition(high) - left}%`;
    const position = rulerPosition(prediction);
    marker.style.left = `${position}%`;
    // Keep the label inside the ruler near its ends
    marker.style.setProperty('--label-shift', position < 12 ? '-8%' : position > 88 ? '-92%' : '-50%');
    marker.firstChild.textContent = isComparing() ? `Phone ${slot.toUpperCase()}` : 'This phone';
  }
  ruler.setAttribute('aria-label', slots.map((slot) => {
    const { prediction, low, high } = estimates[slot];
    return `${isComparing() ? `Phone ${slot.toUpperCase()}` : 'Estimate'} UGX ${shortUGX(prediction)}, likely between ${shortUGX(low)} and ${shortUGX(high)}`;
  }).join('; ') + `; shown against ${phones.length} phones on sale.`);
}

// Phone price bar ---------------------------------------------------------
function renderPriceBar(slots) {
  const values = $('price-bar-values');
  values.replaceChildren(...slots.map((slot) => {
    const item = element('span', 'price-bar-item');
    item.dataset.slot = slot;
    if (isComparing()) item.append(element('span', 'phone-tag', slot.toUpperCase()));
    // Two prices share the bar, so they use the short form (e.g. 3.43M)
    const price = isComparing() ? shortUGX(estimates[slot].prediction) : fullUGX(estimates[slot].prediction);
    item.append('UGX ', element('strong', '', price));
    return item;
  }));
  updatePriceBar();
}

// Show the phone price bar only while the full result is off screen and there is a price
function updatePriceBar() {
  $('price-bar').hidden = resultInView || !$('price-bar-values').childElementCount;
}

function showStatus(message) {
  $('status').textContent = message;
  $('status').hidden = !message;
}

// Start -------------------------------------------------------------------
async function init() {
  try {
    const response = await fetch('/options');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    ({ phones } = await response.json());
  } catch {
    showStatus("Couldn't load phone data from the server. Start it with python main.py, then reload this page.");
    return;
  }

  $('data-note').textContent = `Prices learned from ${phones.length} phones on sale at MobileShop Uganda and Dondolo`;
  buildRuler();

  forms.a = new PhoneForm('a');
  $('phones').append(forms.a.form);
  forms.a.start('Samsung', 'Galaxy S');

  $('compare-button').addEventListener('click', addPhoneB);

  new IntersectionObserver(([entry]) => {
    resultInView = entry.isIntersecting;
    updatePriceBar();
  }).observe($('result'));
}

init();
