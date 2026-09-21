# -*- coding: utf-8 -*-
"""
sync_sheet.py - 飞书电子表格(线上wiki) <-> 本地 xlsx 双向同步工具

维护约定：
- 本地 devkit-test 为维护入口，线上 wiki 表格为呈现，两侧保持一致
- 矩阵型表（测试矩阵-设计级/展开级、缺陷清单、验收标准、执行计划）：
    按主键 ID upsert —— 本地缺失的追加到表尾，已有但内容不同的更新；
    线上多出来的 ID（用户手工添加）保留不删
- 快照型表（总览、被测形态、MCP工具清单、Skill清单、安全规则、测试资产）：
    以本地为准整表覆盖（值层面）
- 手工表（测试机资源、版本计划管理）：push 跳过不动，pull 原样保留

用法:
    python sync_sheet.py --pull [out.xlsx]     线上 -> 本地镜像
    python sync_sheet.py --push <in.xlsx>      本地 -> 线上（含补齐）
    python sync_sheet.py --diff <in.xlsx>      预览差异（不写线上）
    python sync_sheet.py --notify "群名"           发送测试通知到群
    python sync_sheet.py --join-group "群名"       把机器人拉进指定群
"""
import argparse
import json
import os
import sys

# 强制 stdout UTF-8，避免 PowerShell 重定向到文件时按 GBK 编码
# 导致 print 含 «»/✅/📊 等字符抛 UnicodeEncodeError（每晚 daily sync 断更根因）
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import requests

import openpyxl
from openpyxl import Workbook

from feishu_core import CredentialStore, FeishuClient, load_user_identity, save_user_identity

HERE = os.path.dirname(os.path.abspath(__file__))
MIRROR_DIR = os.path.join(HERE, "mirror")
DEFAULT_MIRROR = os.path.join(MIRROR_DIR, "huaweicloud-devkit-测试全景图.xlsx")
SS_TOKEN = os.environ.get("FEISHU_SS_TOKEN", "")          # 线上电子表格 token（本机经环境变量注入，勿硬编码入公开仓库）
OWNER_OPEN_ID = os.environ.get("FEISHU_OWNER_OPEN_ID", "")  # 表格 owner open_id（同上，从 wiki 探测）
HANDMADE = {"测试机资源", "版本计划管理", "测试分工"}          # 手工表：push 不动
# 矩阵型: sheet名 -> 主键列名
MATRIX = {"测试矩阵-设计级": "ID", "测试矩阵-展开级": "ID",
          "缺陷清单": "ID", "验收标准": "门禁项", "执行计划": "阶段"}
SNAPSHOT = {"总览", "被测形态", "MCP工具清单", "Skill清单", "安全规则", "测试资产"}


def flatten(v):
    if v is None:
        return ""
    if isinstance(v, dict):          # 富文本对象等
        if "text" in v:
            return str(v["text"])
        return json.dumps(v, ensure_ascii=False)
    s = str(v).strip()
    return s


def sheet_map(client):
    """动态获取 sheet_id 映射 {标题: sheet_id}"""
    d = client._request("GET", f"/sheets/v3/spreadsheets/{SS_TOKEN}/sheets/query")
    return {s["title"]: s["sheet_id"] for s in d.get("sheets", [])}


def read_online(client, sid, rows=300):
    """读线上 sheet 全部内容 -> list[list[str]]（已扁平化）"""
    dd = client._request("GET", f"/sheets/v2/spreadsheets/{SS_TOKEN}/values/{sid}!A1:N{rows}")
    vals = [[flatten(x) for x in row] for row in dd.get("valueRange", {}).get("values", [])]
    while vals and not any(vals[-1]):
        vals.pop()
    return vals


def write_online(client, sid, range_, values):
    """写单个 range（覆盖写入）；range_ 需完整范围如 8MYVpZ!A1:A1
    官方接口: POST /sheets/v2/spreadsheets/{token}/values_batch_update, body valueRanges"""
    if not range_.count("!"):
        raise ValueError(f"range 必须含 sheet 前缀: {range_}")
    client._request(
        "POST", f"/sheets/v2/spreadsheets/{SS_TOKEN}/values_batch_update",
        json={"valueRanges": [{"range": range_, "values": values}],
              "valueInputOption": "USER_ENTERED"})


def append_online(client, sid, rows):
    """在表尾追加行"""
    if not rows:
        return
    ncol = max(len(r) for r in rows)
    rng = f"{sid}!A1:{chr(ord('A') + min(ncol, 26) - 1)}1"
    client._request("POST", f"/sheets/v2/spreadsheets/{SS_TOKEN}/values_append",
                    params={"valueInputOption": "USER_ENTERED"},
                    json={"valueRange": {"range": rng, "values": rows}})


def batch_update_online(client, updates):
    """批量更新 [{range, values}]；range 需完整范围"""
    if not updates:
        return
    client._request(
        "POST", f"/sheets/v2/spreadsheets/{SS_TOKEN}/values_batch_update",
        json={"valueRanges": [{"range": u["range"], "values": u["values"]} for u in updates],
              "valueInputOption": "USER_ENTERED"})


def find_header_row(rows, pk):
    """在前 5 行里找含主键的表头行，返回 (行号0基, 列索引)"""
    for i, row in enumerate(rows[:5]):
        for j, v in enumerate(row):
            if v.strip() == pk:
                return i, j
    raise RuntimeError(f"未找到表头行（主键 {pk}）")


def local_sheet_rows(xlsx_path, sheet_name):
    """读本地 xlsx 的 sheet -> list[list[str]]，去掉尾部空行"""
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    if sheet_name not in wb.sheetnames:
        wb.close()
        return None
    ws = wb[sheet_name]
    rows = [[flatten(x) for x in row] for row in ws.iter_rows(values_only=True)]
    wb.close()
    while rows and not any(rows[-1]):
        rows.pop()
    return rows


def save_xlsx_for_sheetmap(wb, title, rows, sid):
    ws = wb.create_sheet(title)
    for i, row in enumerate(rows, start=1):
        for j, v in enumerate(row, start=1):
            ws.cell(row=i, column=j, value=v)
    ws.sheet_properties.tag = sid  # 保留线上 sheet_id 便于回写定位


# ---------------------------------------------------------------- pull
def cmd_pull(client, out):
    sm = sheet_map(client)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    wb = Workbook()
    wb.remove(wb.active)
    seen = set()
    for title, sid in sm.items():
        rows = read_online(client, sid)
        save_xlsx_for_sheetmap(wb, title, rows, sid)
        seen.add(title)
        print(f"  [pull] «{title}» {len(rows)} 行")
    wb.save(out)
    print(f"✅ pull 完成: {out} ({len(seen)} 个 sheet)")


# ---------------------------------------------------------------- push
def cmd_push(client, xlsx_path, diff_only=False):
    sm = sheet_map(client)
    report = []
    for title, sid in sm.items():
        if title in HANDMADE:
            print(f"  [skip] «{title}» 手工表，不动")
            continue
        lrows = local_sheet_rows(xlsx_path, title)
        if lrows is None:
            print(f"  [warn] 本地 xlsx 无 «{title}»，跳过")
            continue
        if title in MATRIX:
            frows = read_online(client, sid)
            r = sync_matrix(client, sid, title, MATRIX[title], lrows, frows, diff_only)
            report.append(r)
        else:
            frows = read_online(client, sid)
            r = sync_snapshot(client, sid, title, lrows, frows, diff_only)
            report.append(r)
    print("\n=== 汇总 ===")
    for r in report:
        print(r)
    if diff_only:
        print("\n(仅预览 diff 模式，未写线上)")
    return report


def sync_matrix(client, sid, title, pk, lrows, frows, diff_only):
    hrow_l, pkcol_l = find_header_row(lrows, pk)
    lhead = lrows[hrow_l]
    ldata = [r for r in lrows[hrow_l + 1:] if r and r[pkcol_l].strip()]

    hrow_f, pkcol_f = find_header_row(frows, pk)
    fhead = frows[hrow_f]
    fdata = [r for r in frows[hrow_f + 1:] if r and r[pkcol_f].strip()]

    ncol = len(lhead)
    fmap = {r[pkcol_f].strip(): r for r in fdata}
    lmap = {r[pkcol_l].strip(): r for r in ldata}

    missing = sorted(set(lmap) - set(fmap))
    changed = []
    for k in sorted(set(lmap) & set(fmap)):
        if lmap[k][:ncol] != [fmap[k][j] if j < len(fmap[k]) else "" for j in range(ncol)]:
            changed.append(k)

    msg = f"  «{title}» 本地{len(ldata)} / 线上{len(fdata)} | 需新增 {len(missing)} / 需更新 {len(changed)}"
    print(msg)
    if diff_only:
        return msg

    # 新增 → 直写到表尾（定位线上数据区末尾行；append API 的 range 行数限制坑已避开）
    if missing:
        append_rows = [lmap[k][:ncol] for k in missing]
        # 表头行 hrow_f(0基) → 数据首行 1基 = hrow_f+2；末尾后第一空行 = hrow_f+2+len(fdata)
        start = hrow_f + 2 + len(fdata)
        end = start + len(append_rows) - 1
        last_col = chr(ord("A") + ncol - 1) if ncol <= 26 else "Z"
        rng = f"{sid}!A{start}:{last_col}{end}"
        write_online(client, sid, rng, append_rows)
        print(f"    [append] {len(append_rows)} 行 -> {sid} ({rng})")
    # 更新 → batch_update 定位线上行号（表头行+数据偏移）
    updates = []
    last_col = chr(ord("A") + ncol - 1) if ncol <= 26 else "Z"
    for k in changed:
        ridx = hrow_f + 1 + fdata.index(fmap[k])
        updates.append({"range": f"{sid}!A{ridx + 1}:{last_col}{ridx + 1}",
                        "values": [lmap[k][:ncol]]})
    if updates:
        batch_update_online(client, updates)
        print(f"    [update] {len(updates)} 行")
    return msg + f" -> 新增{len(missing)}/更新{len(changed)}"


def sync_snapshot(client, sid, title, lrows, frows, diff_only):
    nrow = len(lrows)
    ncol = max((len(r) for r in lrows), default=0)
    # 线上前 nrow 行是否有差异
    diffs = 0
    for i in range(nrow):
        lr = lrows[i]
        fr = frows[i] if i < len(frows) else []
        if lr[:ncol] != [fr[j] if j < len(fr) else "" for j in range(ncol)]:
            diffs += 1
    msg = f"  «{title}» 快照覆盖: 本地{nrow}行 / 线上{len(frows)}行 | 差异行 {diffs}"
    print(msg)
    if diff_only:
        return msg
    if diffs:
        last_col = chr(ord("A") + ncol - 1) if ncol <= 26 else "Z"
        write_online(client, sid, f"{sid}!A1:{last_col}{nrow}", lrows[:nrow])
        print(f"    [overwrite] {nrow} 行 -> {sid}")
    return msg + " -> 覆盖完成"


# ---------------------------------------------------------------- 群通知
def find_chat(client, name: str) -> dict:
    """按群名精确匹配搜索机器人可见的群，返回 {chat_id, name}"""
    try:
        d = client._request("GET", "/im/v1/chats", params={"page_size": 100})
        items = d.get("items", [])
    except Exception as e:
        raise RuntimeError(f"获取群列表失败: {str(e)[:200]}")
    for it in items:
        if it.get("name") == name:
            return {"chat_id": it["chat_id"], "name": it["name"]}
    raise RuntimeError(
        f"未找到群「{name}」；机器人所在群: {[i.get('name') for i in items] or '无'}。\n"
        f"请先把机器人拉进目标群（群设置添加机器人），或提供群链接/chat_id")


def send_text(client, chat_id: str, text: str):
    """机器人发文本消息到群（需 im:message:send_as_bot / im:message）"""
    body = {"receive_id": chat_id, "msg_type": "text",
            "content": json.dumps({"text": text}, ensure_ascii=False)}
    client._request("POST", "/im/v1/messages", params={"receive_id_type": "chat_id"},
                    json=body)


def send_dm(client, open_id: str, text: str):
    """机器人发单聊消息给用户（receive_id_type=open_id）"""
    body = {"receive_id": open_id, "msg_type": "text",
            "content": json.dumps({"text": text}, ensure_ascii=False)}
    client._request("POST", "/im/v1/messages", params={"receive_id_type": "open_id"},
                    json=body)
    print(f"✅ 已发送单聊消息给用户 {open_id}")


def push_summary_text(report: list) -> str:
    lines = ["📊 测试全景图同步完成", ""]
    for r in report:
        lines.append(f"· {r}")
    lines.append("")
    lines.append("（本地 devkit-test 为维护入口，线上 wiki 表格已同步）")
    return "\n".join(lines)


def cmd_join_group(client, name: str):
    """把机器人拉进指定群（需要 im:chat 权限 + 群名可搜索）"""
    d = client._request("GET", "/im/v1/chats", params={"page_size": 100})
    items = d.get("items", [])
    target = None
    for it in items:
        if it.get("name") == name:
            target = it
            break
    if not target:
        # 搜索群 API：GET /im/v1/chats/search?query=
        try:
            d2 = client._request("GET", "/im/v1/chats/search", params={"query": name, "page_size": 20})
            for it in d2.get("items", []):
                if it.get("name") == name:
                    target = it
                    break
        except Exception as e:
            print(f"[join] 搜索群失败(可手动拉机器人进群): {str(e)[:150]}")
    if not target:
        raise SystemExit(f"未找到群「{name}」，请确认群名，或手动在群里添加机器人")
    cid = target["chat_id"]
    s = CredentialStore.load()
    r = requests.post(
        f"https://open.feishu.cn/open-apis/im/v1/chats/{cid}/members",
        params={"member_id_type": "app_id"},
        headers={"Authorization": f"Bearer {client.tenant_token()}",
                 "Content-Type": "application/json"},
        json={"id_list": [s.app_id]}, timeout=20)
    data = r.json()
    if data.get("code") == 0:
        print(f"✅ 机器人已拉入群「{name}」({cid})")
    else:
        print(f"❌ 拉机器人进群失败: {data.get('code')} {data.get('msg')}")
        print("   可改为手动操作: 飞书群里 → 设置 → 群机器人 → 添加机器人 → 搜索应用名")


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="飞书电子表格 <-> 本地 xlsx 同步")
    ap.add_argument("--pull", nargs="?", const=DEFAULT_MIRROR, metavar="OUT_XLSX",
                    help="线上 -> 本地镜像（默认 mirror\\huaweicloud-devkit-测试全景图.xlsx）")
    ap.add_argument("--push", metavar="IN_XLSX", help="本地 xlsx -> 线上（UPSERT/覆盖）")
    ap.add_argument("--diff", metavar="IN_XLSX", help="预览差异，不写线上")
    ap.add_argument("--notify", metavar="群名", help="按群名发送测试通知到群")
    ap.add_argument("--join-group", metavar="群名", help="把机器人拉进指定群")
    ap.add_argument("--send-after-push", metavar="群名", help="push 完成后自动发送同步摘要到群")
    ap.add_argument("--dm", metavar="文本", help="给表格 owner 发单聊消息（每日报告用）")
    ap.add_argument("--dm-after-push", action="store_true",
                    help="push 完成后给 owner 发单聊摘要（默认）")
    args = ap.parse_args()

    store = CredentialStore.load()
    ident = load_user_identity()
    # 表格读写用用户身份(OAuth)；群操作/发消息用机器人身份(tenant)
    user_client = FeishuClient(store.app_id, store.app_secret, **ident) if ident \
        else FeishuClient(store.app_id, store.app_secret)
    bot_client = FeishuClient(store.app_id, store.app_secret)

    if args.join_group:
        cmd_join_group(bot_client, args.join_group)
    elif args.notify:
        chat = find_chat(bot_client, args.notify)
        send_text(bot_client, chat["chat_id"], "🤖 测试机器人通知功能验证：权限与通道正常。")
        print(f"✅ 已发送测试通知到群「{args.notify}」")
    elif args.dm:
        send_dm(bot_client, OWNER_OPEN_ID, args.dm)
    elif args.pull:
        cmd_pull(user_client, args.pull)
    elif args.push:
        report = cmd_push(user_client, args.push, diff_only=False)
        if args.send_after_push:
            chat = find_chat(bot_client, args.send_after_push)
            send_text(bot_client, chat["chat_id"], push_summary_text(report))
            print(f"✅ 同步摘要已发送到群「{args.send_after_push}」")
        elif args.dm_after_push:
            send_dm(bot_client, OWNER_OPEN_ID, push_summary_text(report))
    elif args.diff:
        cmd_push(user_client, args.diff, diff_only=True)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()