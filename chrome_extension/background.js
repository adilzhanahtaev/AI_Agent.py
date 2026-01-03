// background.js
const API_KEY = 'a61dd813518e47338d62910469c38d03.pN7GuGKV5khelLRJ'; // Замените на ваш ключ
const API_URL = 'https://api.anthropic.com/v1/messages';

let messages = [];
let currentTabId = null;

async function callAnthropic(messages, tools) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: messages,
      tools: tools
    })
  });
  return await response.json();
}

const tools = [
  {
    name: 'navigate_to',
    description: 'Перейти на указанный URL',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url']
    }
  },
  {
    name: 'click_element',
    description: 'Кликнуть на элемент по описанию',
    input_schema: {
      type: 'object',
      properties: { description: { type: 'string' } },
      required: ['description']
    }
  },
  {
    name: 'type_text',
    description: 'Ввести текст в поле',
    input_schema: {
      type: 'object',
      properties: { description: { type: 'string' }, text: { type: 'string' } },
      required: ['description', 'text']
    }
  },
  {
    name: 'extract_text',
    description: 'Извлечь текст из элемента',
    input_schema: {
      type: 'object',
      properties: { description: { type: 'string' } },
      required: ['description']
    }
  },
  {
    name: 'get_page_content',
    description: 'Получить HTML страницы',
    input_schema: { type: 'object', properties: {} }
  }
];

async function executeTool(name, input) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;

  switch (name) {
    case 'navigate_to':
      await chrome.tabs.update(currentTabId, { url: input.url });
      return `Navigated to ${input.url}`;
    case 'click_element':
      const clickResult = await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: (desc) => {
          const elements = Array.from(document.querySelectorAll('*')).filter(el =>
            el.textContent.toLowerCase().includes(desc.toLowerCase()) ||
            el.getAttribute('title')?.toLowerCase().includes(desc.toLowerCase())
          );
          if (elements.length > 0) {
            elements[0].click();
            return `Clicked on ${desc}`;
          }
          return `Element not found: ${desc}`;
        },
        args: [input.description]
      });
      return clickResult[0].result;
    case 'type_text':
      const typeResult = await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: (desc, txt) => {
          const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
          for (let input of inputs) {
            if (input.placeholder.toLowerCase().includes(desc.toLowerCase())) {
              input.value = txt;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              return `Typed '${txt}' into ${desc}`;
            }
          }
          return `Input not found: ${desc}`;
        },
        args: [input.description, input.text]
      });
      return typeResult[0].result;
    case 'extract_text':
      const extractResult = await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: (desc) => {
          const elements = Array.from(document.querySelectorAll('*')).filter(el =>
            el.textContent.toLowerCase().includes(desc.toLowerCase())
          );
          return elements.length > 0 ? elements[0].textContent : `Not found: ${desc}`;
        },
        args: [input.description]
      });
      return extractResult[0].result;
    case 'get_page_content':
      const contentResult = await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: () => document.documentElement.outerHTML
      });
      return contentResult[0].result;
    default:
      return 'Unknown tool';
  }
}

async function runTask(task) {
  messages = [
    { role: 'user', content: `Ты - автономный AI-агент. Задача: ${task}. Используй инструменты. Когда выполнено, скажи 'Задача выполнена'.` }
  ];

  while (true) {
    const response = await callAnthropic(messages, tools);
    const content = response.content;

    for (let block of content) {
      if (block.type === 'text') {
        console.log('AI:', block.text);
        if (block.text.includes('Задача выполнена')) {
          return;
        }
      } else if (block.type === 'tool_use') {
        const toolName = block.name;
        const toolInput = block.input;
        console.log('Calling tool:', toolName, toolInput);
        const result = await executeTool(toolName, toolInput);
        messages.push({ role: 'assistant', content: content });
        messages.push({ role: 'user', content: `Результат: ${result}` });
        break;
      }
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'run_task') {
    runTask(request.task).then(() => sendResponse({ status: 'done' }));
    return true; // Keep message channel open
  }
});