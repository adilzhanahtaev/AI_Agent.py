// popup.js
document.getElementById('run').addEventListener('click', () => {
  const task = document.getElementById('task').value;
  if (task) {
    chrome.runtime.sendMessage({ action: 'run_task', task: task }, (response) => {
      console.log('Task completed');
    });
  }
});