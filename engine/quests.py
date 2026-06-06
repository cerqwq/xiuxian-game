"""
任务系统
"""
import random


# 任务系统
QUEST_DB = {
    "新手任务": {
        "name": "新手任务",
        "description": "完成基础修炼",
        "objectives": [{"type": "cultivate", "target": 100, "current": 0}],
        "rewards": {"灵石": 50, "聚气丹": 2},
        "giver": "村长",
    },
    "清理妖狼": {
        "name": "清理妖狼",
        "description": "消灭威胁村庄的妖狼",
        "objectives": [{"type": "kill", "target": "妖狼", "count": 3, "current": 0}],
        "rewards": {"灵石": 100, "灵剑": 1},
        "giver": "镇长",
    },
    "收集灵芝": {
        "name": "收集灵芝",
        "description": "为丹师收集灵芝",
        "objectives": [{"type": "collect", "target": "灵芝", "count": 5, "current": 0}],
        "rewards": {"灵石": 150, "筑基丹": 1},
        "giver": "丹师",
    },
    "城主的委托": {
        "name": "城主的委托",
        "description": "完成城主的任务",
        "objectives": [
            {"type": "kill", "target": "水鬼", "count": 5, "current": 0},
            {"type": "collect", "target": "天雷珠", "count": 2, "current": 0},
        ],
        "rewards": {"灵石": 300, "仙剑": 1},
        "giver": "城主",
    },
    "火焰山探险": {
        "name": "火焰山探险",
        "description": "探索火焰山的秘密",
        "objectives": [{"type": "explore", "target": "火焰山", "current": 0}],
        "rewards": {"灵石": 500, "火系功法": 1},
        "giver": "火系长老",
    },
    "天机试炼": {
        "name": "天机试炼",
        "description": "通过天机老人的试炼",
        "objectives": [{"type": "kill", "target": "魔将", "count": 10, "current": 0}],
        "rewards": {"灵石": 1000, "天机秘籍": 1},
        "giver": "天机老人",
    },
    "仙缘试炼": {
        "name": "仙缘试炼",
        "description": "证明你的仙缘",
        "objectives": [
            {"type": "kill", "target": "仙兽", "count": 5, "current": 0},
            {"type": "collect", "target": "仙器碎片", "count": 3, "current": 0},
        ],
        "rewards": {"灵石": 2000, "仙器碎片": 5},
        "giver": "岛主",
    },
}


def get_npc_quests(character: dict, npc_name: str) -> list:
    """获取NPC的任务"""
    from .npc import NPC_DB

    npc = NPC_DB.get(npc_name)
    if not npc:
        return []

    quests = []
    for quest_id in npc["quests"]:
        quest = QUEST_DB.get(quest_id)
        if quest:
            # 检查是否已完成
            if quest_id not in character.get("completed_quests", []):
                quests.append({
                    "id": quest_id,
                    "name": quest["name"],
                    "description": quest["description"],
                    "objectives": quest["objectives"],
                    "rewards": quest["rewards"],
                })

    return quests


def accept_quest(character: dict, quest_id: str) -> dict:
    """接受任务"""
    quest = QUEST_DB.get(quest_id)
    if not quest:
        return {"success": False, "message": f"未知任务: {quest_id}"}

    # 检查是否已接受
    if quest_id in character.get("active_quests", []):
        return {"success": False, "message": "已经接受了这个任务"}

    # 检查是否已完成
    if quest_id in character.get("completed_quests", []):
        return {"success": False, "message": "已经完成了这个任务"}

    # 接受任务
    character.setdefault("active_quests", []).append(quest_id)

    # 初始化任务进度
    character.setdefault("quest_progress", {})[quest_id] = {
        "objectives": [{"type": obj["type"], "target": obj.get("target", ""), "current": 0, "count": obj.get("count", 1)} for obj in quest["objectives"]]
    }

    return {"success": True, "message": f"接受了任务: {quest['name']}"}


def check_quest_progress(character: dict, event_type: str, target: str = None) -> list:
    """检查任务进度"""
    completed_quests = []

    for quest_id in character.get("active_quests", []):
        progress = character.get("quest_progress", {}).get(quest_id)
        if not progress:
            continue

        quest = QUEST_DB.get(quest_id)
        if not quest:
            continue

        all_complete = True
        for i, obj in enumerate(progress["objectives"]):
            if obj["type"] == event_type:
                if obj["type"] == "kill" and obj["target"] == target:
                    obj["current"] = min(obj["current"] + 1, obj["count"])
                elif obj["type"] == "collect" and obj["target"] == target:
                    # 需要从外部检查物品数量
                    pass
                elif obj["type"] == "cultivate":
                    # 需要从外部检查修为
                    pass
                elif obj["type"] == "explore" and obj["target"] == target:
                    obj["current"] = 1

            if obj["current"] < obj["count"]:
                all_complete = False

        if all_complete:
            completed_quests.append(quest_id)

    return completed_quests


def complete_quest(character: dict, quest_id: str) -> dict:
    """完成任务"""
    quest = QUEST_DB.get(quest_id)
    if not quest:
        return {"success": False, "message": f"未知任务: {quest_id}"}

    # 检查是否已接受
    if quest_id not in character.get("active_quests", []):
        return {"success": False, "message": "还没有接受这个任务"}

    # 检查进度
    progress = character.get("quest_progress", {}).get(quest_id)
    if not progress:
        return {"success": False, "message": "任务进度异常"}

    # 检查是否所有目标都完成
    for obj in progress["objectives"]:
        if obj["current"] < obj["count"]:
            return {"success": False, "message": "任务目标尚未完成"}

    # 发放奖励
    for item, amount in quest["rewards"].items():
        character["inventory"][item] = character["inventory"].get(item, 0) + amount

    # 更新任务状态
    character["active_quests"].remove(quest_id)
    character.setdefault("completed_quests", []).append(quest_id)
    del character["quest_progress"][quest_id]

    # 增加声望
    character["reputation"] = character.get("reputation", 0) + 10

    return {
        "success": True,
        "message": f"完成任务: {quest['name']}",
        "rewards": quest["rewards"],
    }
