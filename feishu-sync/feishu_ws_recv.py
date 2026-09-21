# -*- coding: utf-8 -*-
"""飞书长连接常驻接收：im.message.receive_v1 事件 -> 打印 + 自动回复（诊断端到端）。"""
import json
import sys
import threading
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, r"C:\Users\Administrator\devkit-test\feishu-sync")

import lark_oapi as lark
from feishu_core import CredentialStore, FeishuClient

s = CredentialStore.load()
bot = FeishuClient(s.app_id, s.app_secret)  # 用 tenant token 回复（机器人身份）


def reply_text(message_id: str, text: str):
    """机器人回复消息（reply 接口，receive_id 用 message 所属会话）"""
    try:
        bot._request(
            "POST", f"/im/v1/messages/{message_id}/reply",
            json={"content": json.dumps({"text": text}, ensure_ascii=False),
                  "msg_type": "text"})
        print(f"    [reply] 已回复: {text}")
    except Exception as e:
        print(f"    [reply] 回复失败: {e}")


def on_message_receive(data):
    ev = data.event
    msg = ev.message
    sender = ev.sender
    open_id = ""
    try:
        open_id = sender.sender_id.open_id
    except Exception:
        pass
    chat_id = msg.chat_id
    chat_type = msg.chat_type
    mid = msg.message_id
    content = msg.content  # JSON 字符串
    print(f"[EVENT] 收到 im.message.receive_v1:")
    print(f"    sender_open_id = {open_id}")
    print(f"    chat_id = {chat_id}")
    print(f"    chat_type = {chat_type}")
    print(f"    message_id = {mid}")
    print(f"    message_type = {getattr(msg, 'message_type', '?')}")
    print(f"    content = {content}")
    # 尝试解析文本并回复
    try:
        c = json.loads(content)
        text = c.get("text", "") if isinstance(c, dict) else str(content)
    except Exception:
        text = str(content)
    reply_text(mid, f"收到：{text}")


event_handler = (
    lark.EventDispatcherHandler.builder("", "")
    .register_p2_im_message_receive_v1(on_message_receive)
    .build()
)

cli = lark.ws.Client(s.app_id, s.app_secret,
                     event_handler=event_handler,
                     log_level=lark.LogLevel.INFO)

print("长连接客户端已启动，等待消息事件（Ctrl+C 退出）...", flush=True)
try:
    cli.start()
except KeyboardInterrupt:
    print("已退出")
except Exception as e:
    print(f"[FATAL] 长连接异常退出: {type(e).__name__}: {e}")