"""
物品系统
"""


ITEM_DB = {
    # 消耗品
    "聚气丹": {"type": "consumable", "rarity": "凡品", "price": 20, "effect": {"cultivation": 10}, "description": "辅助修炼的基础丹药"},
    "筑基丹": {"type": "consumable", "rarity": "灵品", "price": 100, "effect": {"breakthrough_rate": 0.1}, "description": "突破筑基的必备丹药"},
    "金丹丹": {"type": "consumable", "rarity": "灵品", "price": 250, "effect": {"breakthrough_rate": 0.08}, "description": "凝聚金丹的辅助丹药"},
    "元婴丹": {"type": "consumable", "rarity": "仙品", "price": 800, "effect": {"breakthrough_rate": 0.06}, "description": "化婴必备灵丹"},
    "化神丹": {"type": "consumable", "rarity": "仙品", "price": 2000, "effect": {"breakthrough_rate": 0.05}, "description": "化神境界专用"},
    "回春丹": {"type": "consumable", "rarity": "凡品", "price": 30, "effect": {"heal": 50}, "description": "恢复生命值"},
    "回灵丹": {"type": "consumable", "rarity": "凡品", "price": 35, "effect": {"mp": 40}, "description": "恢复灵力"},
    "解毒丹": {"type": "consumable", "rarity": "凡品", "price": 45, "effect": {"cure_poison": True}, "description": "解除中毒状态"},

    # 材料
    "灵石": {"type": "material", "rarity": "凡品", "price": 1, "description": "修仙界通用货币"},
    "灵芝": {"type": "material", "rarity": "灵品", "price": 80, "description": "炼丹常用灵草"},
    "千年灵芝": {"type": "material", "rarity": "仙品", "price": 500, "description": "珍稀灵草"},
    "天雷珠": {"type": "material", "rarity": "仙品", "price": 300, "description": "蕴含天雷之力"},
    "天材地宝": {"type": "material", "rarity": "仙品", "price": 600, "description": "天地精华凝聚"},
    "仙器碎片": {"type": "material", "rarity": "神品", "price": 1500, "description": "上古仙器残片"},
    "天道碎片": {"type": "material", "rarity": "神品", "price": 5000, "description": "天道法则碎片"},
    "混沌精华": {"type": "material", "rarity": "神品", "price": 10000, "description": "混沌初开的精华"},
    "造化玉碟": {"type": "material", "rarity": "神品", "price": 50000, "description": "传说中的至宝"},

    # 武器
    "铁剑": {"type": "weapon", "rarity": "凡品", "price": 50, "atk": 5, "description": "普通铁剑"},
    "灵剑": {"type": "weapon", "rarity": "灵品", "price": 300, "atk": 15, "description": "蕴含灵气的飞剑"},
    "仙剑": {"type": "weapon", "rarity": "仙品", "price": 1500, "atk": 40, "description": "仙人炼制的飞剑"},
    "神剑": {"type": "weapon", "rarity": "神品", "price": 8000, "atk": 100, "description": "上古神兵"},

    # 防具
    "布衣": {"type": "armor", "rarity": "凡品", "price": 30, "def": 3, "description": "普通布衣"},
    "灵甲": {"type": "armor", "rarity": "灵品", "price": 250, "def": 12, "description": "灵气护甲"},
    "仙袍": {"type": "armor", "rarity": "仙品", "price": 1200, "def": 30, "description": "仙人法袍"},
    "神铠": {"type": "armor", "rarity": "神品", "price": 6000, "def": 80, "description": "上古神铠"},

    # 饰品
    "玉佩": {"type": "accessory", "rarity": "凡品", "price": 80, "hp": 20, "description": "温润玉佩"},
    "灵珠": {"type": "accessory", "rarity": "灵品", "price": 400, "mp": 30, "description": "聚灵珠"},
    "仙符": {"type": "accessory", "rarity": "仙品", "price": 2000, "atk": 10, "def": 10, "description": "仙人符箓"},
}


def get_item(item_name: str) -> dict:
    """获取物品信息"""
    return ITEM_DB.get(item_name)


def get_items_by_type(item_type: str) -> list:
    """按类型获取物品列表"""
    return [{"name": name, **data} for name, data in ITEM_DB.items() if data.get("type") == item_type]


def get_items_by_rarity(rarity: str) -> list:
    """按稀有度获取物品列表"""
    return [{"name": name, **data} for name, data in ITEM_DB.items() if data.get("rarity") == rarity]


def use_item(character: dict, item_name: str) -> dict:
    """使用物品"""
    if item_name not in character.get("inventory", {}) or character["inventory"][item_name] <= 0:
        return {"success": False, "message": f"你没有{item_name}"}

    item_data = ITEM_DB.get(item_name, {})
    if not item_data:
        return {"success": False, "message": "未知物品"}

    item_type = item_data.get("type")

    # 消耗品
    if item_type == "consumable":
        character["inventory"][item_name] -= 1
        if character["inventory"][item_name] <= 0:
            del character["inventory"][item_name]

        effect = item_data.get("effect", {})

        if "cultivation" in effect:
            character["exp"] = character.get("exp", 0) + effect["cultivation"]
            return {"success": True, "message": f"使用{item_name}，增加 {effect['cultivation']} 修为"}
        elif "heal" in effect:
            heal = effect["heal"]
            old_hp = character.get("hp", 0)
            character["hp"] = min(character.get("max_hp", 100), old_hp + heal)
            actual = character["hp"] - old_hp
            return {"success": True, "message": f"使用{item_name}，恢复 {actual} 点生命"}
        elif "mp" in effect:
            mp_restore = effect["mp"]
            old_mp = character.get("mp", 0)
            character["mp"] = min(character.get("max_mp", 50), old_mp + mp_restore)
            actual = character["mp"] - old_mp
            return {"success": True, "message": f"使用{item_name}，恢复 {actual} 点灵力"}
        elif "breakthrough_rate" in effect:
            character.setdefault("temp_buffs", {})["breakthrough_rate"] = \
                character.get("temp_buffs", {}).get("breakthrough_rate", 0) + effect["breakthrough_rate"]
            pct = int(effect["breakthrough_rate"] * 100)
            return {"success": True, "message": f"使用{item_name}，下次突破成功率 +{pct}%"}
        elif "cure_poison" in effect:
            character.pop("poisoned", None)
            return {"success": True, "message": f"使用{item_name}，解除中毒状态"}

    # 武器
    elif item_type == "weapon":
        old_item = character.get("equipped", {}).get("weapon")
        if old_item:
            old_atk = ITEM_DB.get(old_item, {}).get("atk", 0)
            character["attack"] = character.get("attack", 0) - old_atk
        new_atk = item_data.get("atk", 0)
        character["attack"] = character.get("attack", 0) + new_atk
        character.setdefault("equipped", {})["weapon"] = item_name
        return {"success": True, "message": f"装备了{item_name}，攻击+{new_atk}"}

    # 防具
    elif item_type == "armor":
        old_item = character.get("equipped", {}).get("armor")
        if old_item:
            old_def = ITEM_DB.get(old_item, {}).get("def", 0)
            character["defense"] = character.get("defense", 0) - old_def
        new_def = item_data.get("def", 0)
        character["defense"] = character.get("defense", 0) + new_def
        character.setdefault("equipped", {})["armor"] = item_name
        return {"success": True, "message": f"装备了{item_name}，防御+{new_def}"}

    # 饰品
    elif item_type == "accessory":
        character.setdefault("equipped", {})["accessory"] = item_name
        for stat in ("hp", "mp", "atk", "def"):
            if stat in item_data:
                character[stat] = character.get(stat, 0) + item_data[stat]
        return {"success": True, "message": f"装备了{item_name}"}

    return {"success": False, "message": "无法使用该物品"}
