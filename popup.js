const toggleBtn = document.getElementById('toggle');
const countEl = document.getElementById('count');

function render(enabled, count) {
  toggleBtn.textContent = enabled ? '已启用' : '已禁用';
  toggleBtn.style.color = enabled ? 'green' : '#c0392b';
  countEl.textContent = count;
}

chrome.runtime.sendMessage('getState', (s) => render(s.enabled, s.blockedCount));

toggleBtn.onclick = () => {
  chrome.runtime.sendMessage('toggle', (s) => chrome.runtime.sendMessage('getState', (s2) => render(s2.enabled, s2.blockedCount)));
};

document.getElementById('reset').onclick = () => {
  chrome.runtime.sendMessage('resetCount', () => { countEl.textContent = 0; });
};
