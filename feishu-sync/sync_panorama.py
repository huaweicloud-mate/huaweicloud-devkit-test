# -*- coding: utf-8 -*-
"""
sync_panorama.py - 测试全景图 xlsx → 飞书多维表格 同步工具

本地 xlsx 为权威源，飞书多维表格为协作视图。按主键(ID)做 upsert：
已存在 → 更新字段；不存在 → 新增；可选删除飞书端多余记录。

用法:
    # 1) 首次：录入飞书应用凭证（DPAPI 加密保存）
    python sync_panorama.py --setup

    # 2) 一键创建多维表格（自动建表+全量写入），输出 app_token 存 config.json
    python sync_panorama.py --create "HuaweiCloud DevKit 测试全景图"

    # 3) 已有表格：把 app_token 填入 config.json 后增量同步
    python sync_panorama.py --sync <xlsx路径>

    # 4) 强制全量重建某张数据表（清空重写）
    python sync_panorama.py --sync <xlsx路径> --rebuild
"""
import argparse
import json
import os
import sys

import openpyxl

from feishu_core import CredentialStore, FeishuClient

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(HERE, "config.json")

# sheet -> (表头行号(0基), 主键列名) ；表头在 R1（第2行）
SHEETS = [
    {"sheet": "测试矩阵-设计级", "table": "测试矩阵-设计级", "header_row": 1, "pk": "ID"},
    {"sheet": "测试矩阵-展开级", "table": "测试矩阵-展开级", "header_row": 1, "pk": "ID"},
    {"sheet": "缺陷清单", "table": "缺陷清单", "header_row": 1, "pk": "ID"},
    {"sheet": "验收标准", "table": "验收标准", "header_row": 1, "pk": "门禁项"},
    {"sheet": "执行计划", "table": "执行计划", "header_row": 1, "pk": "阶段"},
]


def load_config() -> dict:
    if not os.path.exists(CONFIG_FILE):
        return {"app_token": "", "tables": {}}
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_config(cfg: dict):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    print(f"[cfg] 已保存 {CONFIG_FILE}")


def read_sheet_into_records(xlsx_path: str, spec: dict) -> tuple:
    """读 xlsx 指定 sheet，返回 (表头列表, 记录列表)。记录: {"fields": {列名: 值}}"""
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb[spec["sheet"]]
    rows = list(ws.iter_rows(values_only=True))
    header = [str(c).strip() if c is not None else "" for c in rows[spec["header_row"]]]
    # 去掉空列名，定位有效列
    valid = [(i, h) for i, h in enumerate(header) if h]
    records = []
    for row in rows[spec["header_row"] + 1:]:
        if all(c is None or str(c).strip() == "" for c in row):
            continue
        fields = {}
        for i, h in valid:
            v = row[i]
            if v is None:
                continue
            s = str(v).strip()
            if s:
                fields[h] = s
        if fields.get(spec["pk"]):
            records.append({"fields": fields})
    wb.close()
    return [h for _, h in valid], records


def ensure_tables(client: FeishuClient, app_token: str, xlsx_path: str, cfg: dict) -> dict:
    """确保每个 sheet 对应的数据表存在（无则创建），返回 sheet->table_id 映射"""
    existing = {t["name"]: t["table_id"] for t in client.bitable_tables(app_token)}
    result = {}
    for spec in SHEETS:
        header, _ = read_sheet_into_records(xlsx_path, spec)
        if spec["table"] not in existing:
            fields = [{"field_name": h, "type": 1} for h in header]
            tid = client.table_create(app_token, spec["table"], fields)
            print(f"  [bitable] 新建数据表「{spec['table']}」 fields={len(fields)}")
            result[spec["sheet"]] = tid
        else:
            result[spec["sheet"]] = existing[spec["table"]]
            print(f"  [bitable] 复用数据表「{spec['table']}」")
    cfg.setdefault("tables", {}).update(
        {spec["table"]: tid for spec, tid in zip(SHEETS, [result[s["sheet"]] for s in SHEETS])})
    return result


def sync_table(client: FeishuClient, app_token: str, table_id: str, spec: dict,
               pk_field_index: int, xlsx_path: str, rebuild: bool = False):
    header, records = read_sheet_into_records(xlsx_path, spec)
    pk = spec["pk"]
    print(f"== 同步「{spec['sheet']}」: 本地 {len(records)} 条 (主键={pk}) ==")

    existing = client.table_records(app_token, table_id)
    print(f"   飞书端现有 {len(existing)} 条")

    # 建索引: pk值 -> record_id
    idx = {}
    for rec in existing:
        f = rec.get("fields", {})
        v = f.get(pk)
        if v:
            # 多维表格返回的值可能是 list (多行文本) 或 str
            if isinstance(v, list):
                v = "".join(str(x) for x in v)
            idx[str(v).strip()] = rec["record_id"]

    # pk 在 header 中的列名就是 spec["pk"]，因为是按 header 建的字段
    to_create, to_update, seen = [], [], set()
    for rec in records:
        key = str(rec["fields"][pk]).strip()
        seen.add(key)
        if key in idx:
            to_update.append({"record_id": idx[key], "fields": rec["fields"]})
        else:
            to_create.append(rec)

    print(f"   新增 {len(to_create)} / 更新 {len(to_update)} / 飞书多余 {len(idx) - len(seen) if not rebuild else len(idx)}")

    if rebuild:
        # 清空重写
        all_ids = [r["record_id"] for r in existing]
        if all_ids:
            client.records_delete(app_token, table_id, all_ids)
        to_create, to_update = records, []
        print(f"   [rebuild] 清空后写入 {len(to_create)} 条")

    if to_create:
        client.records_create(app_token, table_id, to_create)
    if to_update:
        client.records_update(app_token, table_id, to_update)


def cmd_setup():
    CredentialStore.setup()


def cmd_create(args):
    store = CredentialStore.load()
    client = FeishuClient(store.app_id, store.app_secret)
    name, xlsx = args.create, args.sync
    if not xlsx or not os.path.exists(xlsx):
        raise SystemExit("请通过 --sync 指定全景图 xlsx 路径，如: --create '表名' --sync <xlsx>")
    print(f"[bitable] 创建多维表格: {name}")
    app_token = client.bitable_create(name)
    print(f"[bitable] 成功! app_token = {app_token}")
    cfg = load_config()
    cfg["app_token"] = app_token
    cfg["table_sheet_map"] = {spec["table"]: spec["sheet"] for spec in SHEETS}
    save_config(cfg)
    # 建表 + 全量写入
    tables = ensure_tables(client, app_token, xlsx, cfg)
    for spec in SHEETS:
        sync_table(client, app_token, tables[spec["sheet"]], spec, 0, xlsx)
    save_config(cfg)
    print(f"\n✅ 完成！飞书多维表格地址: https://feishu.cn/base/{app_token}")


def cmd_sync(args):
    cfg = load_config()
    if not cfg.get("app_token"):
        raise SystemExit("config.json 缺少 app_token，先运行 --create 或手动填入")
    store = CredentialStore.load()
    client = FeishuClient(store.app_id, store.app_secret)
    app_token = cfg["app_token"]
    tables = ensure_tables(client, app_token, args.xlsx, cfg)
    save_config(cfg)
    for spec in SHEETS:
        sync_table(client, app_token, tables[spec["sheet"]], spec, 0, args.xlsx, rebuild=args.rebuild)
    print("\n✅ 同步完成")


def main():
    ap = argparse.ArgumentParser(description="测试全景图 → 飞书多维表格同步工具")
    ap.add_argument("--setup", action="store_true", help="录入并验证飞书应用凭证 (DPAPI 加密, 交互式)")
    ap.add_argument("--set-cred", nargs=2, metavar=("APP_ID", "APP_SECRET"),
                    help="直接指定凭证保存 (DPAPI 加密, 非交互)")
    ap.add_argument("--create", metavar="NAME", help="创建新多维表格并全量写入 (配合 --sync 指定 xlsx)")
    ap.add_argument("--sync", metavar="XLSX", help="增量同步到已有表格 (或配合 --create)")
    ap.add_argument("--rebuild", action="store_true", help="配合 --sync: 清空重写数据表")
    args = ap.parse_args()

    if args.setup:
        cmd_setup()
    elif args.set_cred:
        CredentialStore(*args.set_cred).save()
        print("[setup] 凭证已保存，运行 --create 或 --sync 验证")
    elif args.create:
        cmd_create(args)
    elif args.sync:
        args.xlsx = args.sync
        cmd_sync(args)
    else:
        ap.print_help()


if __name__ == "__main__":
    main()