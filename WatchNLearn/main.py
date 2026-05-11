import sys
import threading
import time
import urllib.request
import uvicorn
from PyQt6.QtWidgets import QApplication
from api.server import app as fastapi_app
from ui.mainwindow import MainWindow
from sqlalchemy import Column, String, Text, DateTime, Float, Integer
import os
os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--disable-web-security --allow-running-insecure-content"
os.environ["QTWEBENGINE_REMOTE_DEBUGGING"] = "9222"
def run_api():
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8000, log_level="warning")

def wait_for_server():
    while True:
        try:
            urllib.request.urlopen("http://127.0.0.1:8000/app")
            break
        except:
            time.sleep(0.1)

if __name__ == "__main__":
    thread = threading.Thread(target=run_api, daemon=True)
    thread.start()

    wait_for_server()

    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
