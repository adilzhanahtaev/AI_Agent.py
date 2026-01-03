# AI Browser Agent (Chrome Extension)

Автономный AI-агент как расширение для Google Chrome.

## Установка

1. Откройте Chrome, перейдите в chrome://extensions/
2. Включите "Developer mode"
3. Нажмите "Load unpacked" и выберите папку `chrome_extension`
4. Расширение установлено.

## Использование

1. Кликните на иконку расширения.
2. Введите задачу в textarea.
3. Нажмите "Запустить".
4. Агент автономно выполнит задачу в активной вкладке.

## Архитектура

- **Background Service Worker**: AI reasoning и tool calling.
- **Content Scripts**: Выполнение действий на странице.
- **Popup**: UI для ввода задач.

## Продвинутые паттерны

- **Tool Calling**: Динамическое выполнение через Anthropic API.
- **Autonomous Execution**: Агент сам определяет шаги без скриптов.
