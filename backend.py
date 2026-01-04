from flask import Flask, request, jsonify
from anthropic import Anthropic
import os

app = Flask(__name__)

API_KEY = 'a61dd813518e47338d62910469c38d03.pN7GuGKV5khelLRJ'  # Ваш ключ
client = Anthropic(api_key=API_KEY)

tools = [
    {
        "name": "navigate_to",
        "description": "Перейти на URL",
        "input_schema": {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]}
    },
    {
        "name": "click_element",
        "description": "Кликнуть на элемент",
        "input_schema": {"type": "object", "properties": {"description": {"type": "string"}}, "required": ["description"]}
    },
    {
        "name": "type_text",
        "description": "Ввести текст",
        "input_schema": {"type": "object", "properties": {"description": {"type": "string"}, "text": {"type": "string"}}, "required": ["description", "text"]}
    },
    {
        "name": "extract_text",
        "description": "Извлечь текст",
        "input_schema": {"type": "object", "properties": {"description": {"type": "string"}}, "required": ["description"]}
    },
    {
        "name": "get_page_content",
        "description": "Получить HTML",
        "input_schema": {"type": "object", "properties": {}}
    }
]

@app.route('/task', methods=['POST'])
def handle_task():
    data = request.json
    task = data['task']
    messages = [{"role": "user", "content": f"Ты - AI-агент. Задача: {task}. Верни последовательность действий в формате JSON: [{{'action': 'navigate_to', 'params': {{'url': '...'}}}}]. Когда выполнено, включи 'done': true."}]

    actions = []
    while True:
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=1000,
            messages=messages,
            tools=tools
        )
        content = response.content
        for block in content:
            if block.type == "text":
                if "done" in block.text.lower():
                    return jsonify({"actions": actions, "done": True})
            elif block.type == "tool_use":
                action = {"action": block.name, "params": block.input}
                actions.append(action)
                messages.append({"role": "assistant", "content": content})
                messages.append({"role": "user", "content": f"Действие выполнено: {action}"})
                break
        if len(actions) > 10:  # Limit
            break
    return jsonify({"actions": actions, "done": False})

if __name__ == '__main__':
    app.run(debug=True)