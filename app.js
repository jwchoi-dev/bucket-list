// 버킷리스트 데이터는 브라우저의 localStorage에 저장됩니다.
const STORAGE_KEY = 'bucket-list-items';

// 카테고리 목록 (색깔은 style.css의 .cat-<id> 에서 지정)
const CATEGORIES = {
  travel: '✈️ 여행',
  challenge: '🔥 도전',
  learn: '📚 배우기',
  health: '💪 건강',
  people: '💛 관계',
  etc: '✨ 기타',
};
const categorySelect = document.getElementById('newCategory');

const form = document.getElementById('addForm');
const input = document.getElementById('newItem');
const list = document.getElementById('list');
const empty = document.getElementById('empty');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const filterButtons = document.querySelectorAll('.filter');

let items = load();
let currentFilter = 'all';
let currentCategory = 'all';

// 항목의 카테고리 (카테고리가 없는 예전 항목은 '기타')
const categoryOf = (item) => (CATEGORIES[item.category] ? item.category : 'etc');

// 카테고리 필터 버튼 만들기: '전체 카테고리' + 각 카테고리
const catFilters = document.getElementById('catFilters');
const catButtons = {};
for (const [id, label] of [['all', '🗂️ 모든 카테고리'], ...Object.entries(CATEGORIES)]) {
  const btn = document.createElement('button');
  btn.className = `cat-chip cat-${id}` + (id === 'all' ? ' active' : '');
  btn.innerHTML = '<span class="chip-label"></span><span class="chip-count"></span>';
  btn.querySelector('.chip-label').textContent = label;
  btn.addEventListener('click', () => {
    currentCategory = id;
    // 카테고리를 고르면 새 항목의 기본 카테고리도 같이 맞춰서, 추가한 항목이 바로 보이게
    if (id !== 'all') categorySelect.value = id;
    Object.values(catButtons).forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
  catButtons[id] = btn;
  catFilters.appendChild(btn);
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 저장 공간을 쓸 수 없는 환경(시크릿 모드 등)에서는 조용히 무시
  }
}

function addItem(text, category) {
  items.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    category,
    done: false,
    createdAt: new Date().toISOString(),
  });
  save();
  render();
}

function toggleItem(id) {
  const item = items.find((i) => i.id === id);
  if (item) item.done = !item.done;
  save();
  render();
}

function deleteItem(id) {
  items = items.filter((i) => i.id !== id);
  save();
  render();
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function render() {
  // 상태 필터(전체/진행 중/완료)와 카테고리 필터를 함께 적용
  const byStatus = items.filter((i) =>
    currentFilter === 'all' ? true : currentFilter === 'done' ? i.done : !i.done
  );
  const visible = byStatus.filter(
    (i) => currentCategory === 'all' || categoryOf(i) === currentCategory
  );

  // 각 카테고리 버튼에 (현재 상태 필터 기준) 항목 수 표시
  for (const [id, btn] of Object.entries(catButtons)) {
    const n = id === 'all' ? byStatus.length : byStatus.filter((i) => categoryOf(i) === id).length;
    btn.querySelector('.chip-count').textContent = n;
  }

  list.innerHTML = '';
  for (const item of visible) {
    // 카테고리가 없는 예전 항목은 '기타'로 표시
    const cat = categoryOf(item);
    const li = document.createElement('li');
    li.className = `item cat-${cat}` + (item.done ? ' done' : '');

    const check = document.createElement('button');
    check.className = 'check';
    check.setAttribute('aria-label', item.done ? '완료 취소' : '완료로 표시');
    check.textContent = item.done ? '✓' : '';
    check.addEventListener('click', () => toggleItem(item.id));

    const text = document.createElement('div');
    text.className = 'text';
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = item.text; // textContent로 넣어 HTML 삽입을 방지
    text.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'meta';
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = CATEGORIES[cat];
    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = formatDate(item.createdAt);
    meta.append(badge, date);
    text.appendChild(meta);

    const del = document.createElement('button');
    del.className = 'delete';
    del.setAttribute('aria-label', '삭제');
    del.textContent = '×';
    del.addEventListener('click', () => deleteItem(item.id));

    li.append(check, text, del);
    list.appendChild(li);
  }

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;
  progress.textContent = total
    ? `${total}개 중 ${doneCount}개 달성 (${Math.round((doneCount / total) * 100)}%)`
    : '아직 목표가 없어요';
  progressFill.style.width = total ? `${(doneCount / total) * 100}%` : '0';

  empty.textContent = total
    ? '이 분류에 해당하는 항목이 없어요.'
    : '목록이 비어 있어요. 첫 번째 꿈을 추가해보세요!';
  empty.classList.toggle('show', visible.length === 0);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addItem(text, categorySelect.value);
  input.value = '';
  input.focus();
});

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

render();
