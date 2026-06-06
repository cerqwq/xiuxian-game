"""
探索系统
"""
import random
from .realms import Realm


# 区域系统
REGIONS = {
    "新手村": {
        "description": "修仙者的起点，灵气稀薄但安全",
        "required_realm": "练气",
        "monsters": ["野狼", "灵兔"],
        "npcs": ["村长", "药商"],
        "events": ["采药", "打坐"],
    },
    "青云镇": {
        "description": "小型修仙聚集地，有简单的坊市",
        "required_realm": "筑基",
        "monsters": ["妖狼", "树妖"],
        "npcs": ["镇长", "铁匠", "丹师"],
        "events": ["寻宝", "比武"],
    },
    "碧波城": {
        "description": "水系灵气浓郁的城市",
        "required_realm": "结丹",
        "monsters": ["水鬼", "蛟龙"],
        "npcs": ["城主", "水系修士"],
        "events": ["水下探险", "灵脉修炼"],
    },
    "火焰山": {
        "description": "火系灵气狂暴之地",
        "required_realm": "元婴",
        "monsters": ["火鸦", "凤凰"],
        "npcs": ["火系长老"],
        "events": ["火山探险", "火灵修炼"],
    },
    "天机城": {
        "description": "修仙大城，汇聚各路高手",
        "required_realm": "化神",
        "monsters": ["魔将", "妖虎"],
        "npcs": ["城主", "天机老人", "拍卖师"],
        "events": ["天机秘境", "群仙会"],
    },
    "仙灵岛": {
        "description": "传说中的仙岛，灵气充沛",
        "required_realm": "炼虚",
        "monsters": ["仙兽"],
        "npcs": ["岛主"],
        "events": ["仙缘", "悟道"],
    },
}


def explore_region(character: dict) -> dict:
    """探索当前区域"""
    region_name = character.get("current_region", "新手村")
    region = REGIONS.get(region_name)

    if not region:
        return {"error": f"未知区域: {region_name}"}

    # 随机事件
    event_type = random.choice(["monster", "npc", "event", "treasure", "nothing"])

    result = {
        "region": region_name,
        "event_type": event_type,
        "messages": [],
    }

    if event_type == "monster":
        # 遭遇怪物
        monster_name = random.choice(region["monsters"])
        result["monster"] = monster_name
        result["messages"].append(f"你遭遇了 {monster_name}！")

    elif event_type == "npc":
        # 遇到NPC
        npc_name = random.choice(region["npcs"])
        result["npc"] = npc_name
        result["messages"].append(f"你遇到了 {npc_name}")

    elif event_type == "event":
        # 特殊事件
        event_name = random.choice(region["events"])
        result["event"] = event_name
        result["messages"].append(f"你发现了 {event_name} 的机会")

    elif event_type == "treasure":
        # 发现宝藏
        from .items import ITEM_DB
        treasure_items = ["灵石", "灵芝", "聚气丹", "回春丹"]
        item = random.choice(treasure_items)
        amount = random.randint(1, 10)
        result["treasure"] = {"item": item, "amount": amount}
        result["messages"].append(f"你发现了 {amount} 个 {item}！")

    else:
        result["messages"].append("你探索了一番，但没有发现什么特别的")

    return result


def handle_exploration_choice(character: dict, choice: str) -> dict:
    """处理探索选择"""
    result = {
        "messages": [],
        "character": character,
    }

    if choice == "fight":
        # 战斗
        result["action"] = "combat"
        result["messages"].append("进入战斗")

    elif choice == "talk":
        # 交谈
        result["action"] = "talk"
        result["messages"].append("开始交谈")

    elif choice == "collect":
        # 收集
        result["action"] = "collect"
        result["messages"].append("开始收集")

    elif choice == "rest":
        # 休息
        from .rest import rest
        character = rest(character)
        result["messages"].append("休息恢复")

    elif choice == "leave":
        # 离开
        result["action"] = "leave"
        result["messages"].append("你选择离开")

    result["character"] = character
    return result


def move_to_region(character: dict, region_name: str) -> dict:
    """移动到新区域"""
    region = REGIONS.get(region_name)

    if not region:
        return {"success": False, "message": f"未知区域: {region_name}"}

    # 检查境界要求
    required_realm = region["required_realm"]
    current_realm = Realm(character["realm"])
    required_index = list(REGIONS.keys()).index(region_name)

    # 简单检查：需要达到指定境界
    realm_names = ["练气", "筑基", "结丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "飞升"]
    current_index = realm_names.index(current_realm.value)
    required_index = realm_names.index(required_realm)

    if current_index < required_index:
        return {"success": False, "message": f"需要达到 {required_realm} 境界才能前往 {region_name}"}

    # 移动成功
    character["current_region"] = region_name

    # 添加到已探索区域
    if region_name not in character.get("explored_regions", []):
        character.setdefault("explored_regions", []).append(region_name)

    return {"success": True, "message": f"你来到了 {region_name}"}
