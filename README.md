# AI Browser Agent

Автономный AI-агент, управляющий веб-браузером для выполнения сложных многошаговых задач.

## Установка

1. Установите Python 3.8+.
2. Создайте виртуальное окружение: `python -m venv .venv`
3. Активируйте: `.venv\Scripts\activate` (Windows)
4. Установите зависимости: `pip install -r requirements.txt`
5. Установите браузеры: `python -m playwright install`

## Настройка

Получите API-ключ от Anthropic и установите переменную окружения `ANTHROPIC_API_KEY`.

## Запуск

Запустите `python AI_Agent.py` и введите задачу.

## Архитектура

- **AI SDK**: Anthropic Claude для reasoning и tool calling.
- **Браузер**: Playwright для автоматизации.
- **Паттерн**: ReAct (Reasoning + Acting) с tool calling для автономности.
- **Управление контекстом**: История сообщений для поддержания состояния.

## Продвинутые паттерны

- **Tool Calling**: Динамическое выполнение действий без предопределенных шагов.
- **Smart Locators**: Playwright's intelligent element finding на основе описаний.

## Примеры задач

- "Найди информацию о вакансиях Python разработчика на hh.ru"
- "Закажи пиццу на сайте доставки"
