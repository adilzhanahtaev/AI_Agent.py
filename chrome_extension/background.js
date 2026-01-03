// background.js
async function runTask(task) {
  try {
    const response = await fetch('http://localhost:5000/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: task })
    });
    const data = await response.json();
    console.log('Actions:', data.actions);

    for (let action of data.actions) {
      await executeAction(action);
    }
    console.log('Task completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

async function executeAction(action) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab.id;

  switch (action.action) {
    case 'navigate_to':
      await chrome.tabs.update(tabId, { url: action.params.url });
      break;
    case 'click_element':
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (desc) => {
          const elements = Array.from(document.querySelectorAll('*')).filter(el =>
            el.textContent.toLowerCase().includes(desc.toLowerCase()) ||
            el.getAttribute('title')?.toLowerCase().includes(desc.toLowerCase())
          );
          if (elements.length > 0) elements[0].click();
        },
        args: [action.params.description]
      });
      break;
    case 'type_text':
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (desc, txt) => {
          const inputs = document.querySelectorAll('input[type="text"], textarea');
          for (let input of inputs) {
            if (input.placeholder.toLowerCase().includes(desc.toLowerCase())) {
              input.value = txt;
              input.dispatchEvent(new Event('input'));
            }
          }
        },
        args: [action.params.description, action.params.text]
      });
      break;
    case 'extract_text':
      const result = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (desc) => {
          const elements = Array.from(document.querySelectorAll('*')).filter(el =>
            el.textContent.toLowerCase().includes(desc.toLowerCase())
          );
          return elements.length > 0 ? elements[0].textContent : '';
        },
        args: [action.params.description]
      });
      console.log('Extracted:', result[0].result);
      break;
    case 'get_page_content':
      const content = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => document.documentElement.outerHTML
      });
      console.log('Page content:', content[0].result.substring(0, 500));
      break;
  }
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'run_task') {
    runTask(request.task);
    sendResponse({ status: 'started' });
  }
});