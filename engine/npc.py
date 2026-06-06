"""
NPC系统
"""


# NPC系统
NPC_DB = {
    "村长": {
        "location": "新手村",
        "dialogue": ["欢迎来到修仙界", "小心野狼", "祝你修炼顺利"],
        "shop": None,
        "quests": ["新手任务"],
    },
    "药商": {
        "location": "新手村",
        "dialogue": ["需要丹药吗？", "灵芝很珍贵"],
        "shop": {
            "聚气丹": 25,
            "回春丹": 35,
            "回灵丹": 40,
        },
        "quests": [],
    },
    "镇长": {
        "location": "青云镇",
        "dialogue": ["这里是青云镇", "小心妖兽"],
        "shop": None,
        "quests": ["清理妖狼"],
    },
    "铁匠": {
        "location": "青云镇",
        "dialogue": ["需要武器吗？", "我的铁剑很锋利"],
        "shop": {
            "铁剑": 60,
            "灵剑": 350,
            "布衣": 35,
        },
        "quests": [],
    },
    "丹师": {
        "location": "青云镇",
        "dialogue": ["炼丹是一门艺术", "需要丹药吗？"],
        "shop": {
            "筑基丹": 120,
            "金丹丹": 300,
            "灵芝": 90,
        },
        "quests": ["收集灵芝"],
    },
    "城主": {
        "location": "碧波城",
        "dialogue": ["碧波城欢迎你", "这里有丰富的水系灵气"],
        "shop": None,
        "quests": ["城主的委托"],
    },
    "水系修士": {
        "location": "碧波城",
        "dialogue": ["水系功法很强大", "需要学习吗？"],
        "shop": {
            "水系功法": 500,
        },
        "quests": [],
    },
    "火系长老": {
        "location": "火焰山",
        "dialogue": ["火焰山危险但机缘多", "小心火鸦"],
        "shop": {
            "火系功法": 800,
        },
        "quests": ["火焰山探险"],
    },
    "天机老人": {
        "location": "天机城",
        "dialogue": ["天机不可泄露", "你有慧根"],
        "shop": {
            "天机秘籍": 2000,
        },
        "quests": ["天机试炼"],
    },
    "拍卖师": {
        "location": "天机城",
        "dialogue": ["欢迎参加拍卖", "今日有好货"],
        "shop": None,
        "quests": [],
    },
    "岛主": {
        "location": "仙灵岛",
        "dialogue": ["仙灵岛是修仙圣地", "有缘人得之"],
        "shop": {
            "仙器碎片": 1800,
        },
        "quests": ["仙缘试炼"],
    },
}


def talk_to_npc(character: dict, npc_name: str) -> dict:
    """与NPC交谈"""
    npc = NPC_DB.get(npc_name)
    if not npc:
        return {"success": False, "message": f"未知的NPC: {npc_name}"}

    # 检查位置
    if npc["location"] != character.get("current_region"):
        return {"success": False, "message": f"{npc_name} 不在当前区域"}

    # 随机对话
    dialogue = npc["dialogue"]
    if dialogue:
        message = dialogue[0]  # 简单起见，取第一条
    else:
        message = f"{npc_name}默默看着你"

    return {
        "success": True,
        "npc": npc_name,
        "message": message,
        "has_shop": npc["shop"] is not None,
        "has_quests": len(npc["quests"]) > 0,
    }


def buy_from_npc(character: dict, npc_name: str, item_name: str) -> dict:
    """从NPC购买物品"""
    from .items import ITEM_DB

    npc = NPC_DB.get(npc_name)
    if not npc:
        return {"success": False, "message": f"未知的NPC: {npc_name}"}

    if not npc["shop"]:
        return {"success": False, "message": f"{npc_name} 不卖东西"}

    if item_name not in npc["shop"]:
        return {"success": False, "message": f"{npc_name} 不卖 {item_name}"}

    price = npc["shop"][item_name]

    # 检查灵石
    current_coins = character["inventory"].get("灵石", 0)
    if current_coins < price:
        return {"success": False, "message": f"灵石不足，需要 {price} 灵石"}

    # 购买
    character["inventory"]["灵石"] = current_coins - price
    character["inventory"][item_name] = character["inventory"].get(item_name, 0) + 1

    return {
        "success": True,
        "message": f"购买了 {item_name}，花费 {price} 灵石",
        "item": item_name,
        "price": price,
    }
