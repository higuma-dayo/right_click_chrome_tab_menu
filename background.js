// コマンドが実行されたことを検知するリスナー
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "duplicate-tab") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.duplicate(tab.id);
    }
  }
});
