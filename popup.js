document.addEventListener('DOMContentLoaded', async () => {
  const tab = await getCurrentTab();
  const allWindows = await chrome.windows.getAll();

  // ウィンドウの数に応じてメニュー項目を制御
  if (allWindows.length > 1) {
    document.getElementById('moveToNewWindow').classList.add('hidden');
    document.getElementById('moveToAnotherWindowContainer').classList.remove('hidden');
    populateWindowList(tab); // tab変数を渡す
  } else {
    document.getElementById('moveToNewWindow').classList.remove('hidden');
    document.getElementById('moveToAnotherWindowContainer').classList.add('hidden');
  }

  // ===== メインメニューのイベントリスナー =====

  document.getElementById('newTabRight').addEventListener('click', () => {
    chrome.tabs.create({ index: tab.index + 1, windowId: tab.windowId });
    window.close();
  });

  document.getElementById('duplicateTab').addEventListener('click', () => {
    chrome.tabs.duplicate(tab.id);
    window.close();
  });

  document.getElementById('closeTabsRight').addEventListener('click', async () => {
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToClose = allTabs.filter(t => t.index > tab.index).map(t => t.id);
    if (tabsToClose.length > 0) chrome.tabs.remove(tabsToClose);
    window.close();
  });

  document.getElementById('moveToNewWindow').addEventListener('click', () => {
    chrome.windows.create({ tabId: tab.id });
    window.close();
  });

  // ===== 補助関数 =====

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function populateWindowList(currentActiveTab) {
    const windowListContainer = document.getElementById('window-list-container');
    windowListContainer.innerHTML = ''; // リストを初期化

    // 「新規ウィンドウ」オプションを追加
    const newWindowLi = document.createElement('li');
    const newWindowLink = document.createElement('a');
    newWindowLink.className = 'rounded-t py-2 px-4 block whitespace-nowrap';
    newWindowLink.href = '#';
    newWindowLink.textContent = '新規ウィンドウ';
    newWindowLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.windows.create({ tabId: currentActiveTab.id });
      window.close();
    });
    newWindowLi.appendChild(newWindowLink);
    windowListContainer.appendChild(newWindowLi);
    
    const currentWindow = await chrome.windows.getCurrent();
    const windows = await chrome.windows.getAll();

    for (const win of windows) {
      if (win.id === currentWindow.id) continue;

      const tabsInWindow = await chrome.tabs.query({ windowId: win.id });
      if (tabsInWindow.length === 0) continue;

      const activeTab = tabsInWindow.find(t => t.active) || tabsInWindow[0];
      
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'py-2 px-4 block whitespace-nowrap flex items-center';
      a.href = '#';

      // Favicon
      const favicon = document.createElement('img');
      favicon.className = 'w-4 h-4 mr-2';
      favicon.src = activeTab.favIconUrl || 'default_favicon.png';
      a.appendChild(favicon);
      
      // Text
      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'title-wrapper';
      const text = document.createElement('span');
      const tabCount = tabsInWindow.length;
      const title = activeTab.title || '名称未設定のタブ';
      if (tabCount > 1) {
        const otherTabsCount = tabCount - 1;
        text.textContent = `${title} | 他${otherTabsCount}個のタブ`;
      } else {
        text.textContent = title;
      }
      titleWrapper.appendChild(text);
      a.appendChild(titleWrapper);
      
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        await chrome.tabs.move(currentActiveTab.id, { windowId: win.id, index: -1 });
        await chrome.tabs.update(currentActiveTab.id, { active: true });
        window.close();
      });

      li.appendChild(a);
      windowListContainer.appendChild(li);

      // タイトルがはみ出る場合はアニメーションを適用
      // 少し待ってからでないと正しい幅が取得できないため setTimeout を使用
      setTimeout(() => {
        if (text.offsetWidth > titleWrapper.offsetWidth) {
          text.classList.add('marquee');
        }
      }, 100);
    }
    
    // ドロップダウンメニューが開いたときにアニメーションを再評価
    const dropdown = document.getElementById('moveToAnotherWindowContainer');
    dropdown.addEventListener('mouseenter', () => {
      const allTitles = windowListContainer.querySelectorAll('.title-wrapper span');
      allTitles.forEach(titleSpan => {
        const wrapper = titleSpan.parentElement;
        if (titleSpan.offsetWidth > wrapper.offsetWidth) {
          titleSpan.classList.add('marquee');
        } else {
          titleSpan.classList.remove('marquee');
        }
      });
    });
  }
});
