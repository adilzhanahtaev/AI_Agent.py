import os
import base64
from anthropic import Anthropic
from playwright.sync_api import sync_playwright

class BrowserAgent:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")
        self.client = Anthropic(api_key=self.api_key)
        self.playwright = None
        self.browser = None
        self.page = None
        self.messages = []

    def start_browser(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=False)  # Visible for demo
        self.page = self.browser.new_page()

    def stop_browser(self):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def navigate_to(self, url):
        self.page.goto(url)
        return f"Navigated to {url}"

    def click_element(self, description):
        # Use Playwright's smart locators
        try:
            locator = self.page.get_by_text(description, exact=False).first
            locator.click()
            return f"Clicked on element with text: {description}"
        except:
            try:
                locator = self.page.locator(f'[title*="{description}"]').first
                locator.click()
                return f"Clicked on element with title: {description}"
            except:
                return f"Could not find element: {description}"

    def type_text(self, description, text):
        try:
            locator = self.page.get_by_placeholder(description).first
            locator.fill(text)
            return f"Typed '{text}' into field: {description}"
        except:
            try:
                locator = self.page.locator(f'input[type="text"]').first
                locator.fill(text)
                return f"Typed '{text}' into text input"
            except:
                return f"Could not find input field: {description}"

    def extract_text(self, description):
        try:
            locator = self.page.get_by_text(description, exact=False).first
            text = locator.text_content()
            return f"Extracted text: {text}"
        except:
            return f"Could not extract text for: {description}"

    def get_page_content(self):
        return self.page.content()

    def take_screenshot(self):
        screenshot = self.page.screenshot()
        encoded = base64.b64encode(screenshot).decode('utf-8')
        return f"data:image/png;base64,{encoded}"

    def run_task(self, task):
        self.messages = [
            {"role": "user", "content": f"Ты - автономный AI-агент, управляющий браузером. Твоя задача: {task}. Используй инструменты для навигации, кликов, ввода текста и извлечения информации. Работай шаг за шагом, объясняя свои действия. Когда задача выполнена, скажи 'Задача выполнена'."}
        ]

        tools = [
            {
                "name": "navigate_to",
                "description": "Перейти на указанный URL",
                "input_schema": {
                    "type": "object",
                    "properties": {"url": {"type": "string"}},
                    "required": ["url"]
                }
            },
            {
                "name": "click_element",
                "description": "Кликнуть на элемент, описанный текстом или атрибутом",
                "input_schema": {
                    "type": "object",
                    "properties": {"description": {"type": "string"}},
                    "required": ["description"]
                }
            },
            {
                "name": "type_text",
                "description": "Ввести текст в поле, описанное placeholder или типом",
                "input_schema": {
                    "type": "object",
                    "properties": {"description": {"type": "string"}, "text": {"type": "string"}},
                    "required": ["description", "text"]
                }
            },
            {
                "name": "extract_text",
                "description": "Извлечь текст из элемента, описанного текстом",
                "input_schema": {
                    "type": "object",
                    "properties": {"description": {"type": "string"}},
                    "required": ["description"]
                }
            },
            {
                "name": "get_page_content",
                "description": "Получить полный HTML-контент страницы",
                "input_schema": {"type": "object", "properties": {}}
            },
            {
                "name": "take_screenshot",
                "description": "Сделать скриншот страницы и вернуть base64",
                "input_schema": {"type": "object", "properties": {}}
            }
        ]

        while True:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=self.messages,
                tools=tools
            )

            content = response.content
            if content:
                for block in content:
                    if block.type == "text":
                        print(f"AI: {block.text}")
                        if "Задача выполнена" in block.text:
                            return
                    elif block.type == "tool_use":
                        tool_name = block.name
                        tool_input = block.input
                        print(f"Calling tool: {tool_name} with {tool_input}")
                        result = self.call_tool(tool_name, tool_input)
                        self.messages.append({"role": "assistant", "content": content})
                        self.messages.append({"role": "user", "content": f"Результат инструмента {tool_name}: {result}"})
                        break
            else:
                break

    def call_tool(self, name, input_data):
        if name == "navigate_to":
            return self.navigate_to(input_data["url"])
        elif name == "click_element":
            return self.click_element(input_data["description"])
        elif name == "type_text":
            return self.type_text(input_data["description"], input_data["text"])
        elif name == "extract_text":
            return self.extract_text(input_data["description"])
        elif name == "get_page_content":
            return self.get_page_content()
        elif name == "take_screenshot":
            return self.take_screenshot()
        else:
            return "Unknown tool"

if __name__ == "__main__":
    agent = BrowserAgent()
    agent.start_browser()
    try:
        task = input("Введите задачу для агента: ")
        agent.run_task(task)
    finally:
        agent.stop_browser()
