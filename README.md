# AI Browser Agent (Chrome Extension + Python Backend)

Фронт: JavaScript (Chrome extension)  
Бекенд: Python (Flask server с AI reasoning)

## Запуск

1. **Backend**: `python backend.py` (запускает сервер на localhost:5000)
2. **Extension**: Загрузите `chrome_extension` в Chrome, используйте popup.

## Архитектура

- Extension отправляет задачу на Python сервер.
- Сервер reasoning, возвращает actions.
- Extension executes actions в браузере.