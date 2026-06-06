"""
装备强化系统
"""
import random


# 装备强化系统
ENHANCE_DB = {
    "levels": [
        {"level": 1, "success_rate": 0.9, "atk_bonus": 2, "def_bonus": 1, "cost": {"灵石": 50}},
        {"level": 2, "success_rate": 0.8, "atk_bonus": 3, "def_bonus": 2, "cost": {"灵石": 100}},
        {"level": 3, "success_rate": 0.7, "atk_bonus": 4, "def_bonus": 2, "cost": {"灵石": 200}},
        {"level": 4, "success_rate": 0.6, "atk_bonus": 5, "def_bonus": 3, "cost": {"灵石": 400}},
        {"level": 5, "success_rate": 0.5, "atk_bonus": 6, "def_bonus": 3, "cost": {"灵石": 800}},
        {"level": 6, "success_rate": 0.4, "atk_bonus": 8, "def_bonus": 4, "cost": {"灵石": 1500}},
        {"level": 7, "success_rate": 0.3, "atk_bonus": 10, "def_bonus": 5, "cost": {"灵石": 3000}},
        {"level": 8, "success_rate": 0.2, "atk_bonus": 12, "def_bonus": 6, "cost": {"灵石": 6000}},
        {"level": 9, "success_rate": 0.1, "atk_bonus": 15, "def_bonus": 8, "cost": {"灵石": 12000}},
        {"level": 10, "success_rate": 0.05, "atk_bonus": 20, "def_bonus": 10, "cost": {"灵石": 25000}},
    ],
    "gems": {
        "攻击宝石": {"atk": 5, "price": 500},
        "防御宝石": {"def": 5, "price": 500},
        "生命宝石": {"hp": 50, "price": 600},
        "灵力宝石": {"mp": 30, "price": 550},
        "暴击宝石": {"crit_rate": 0.05, "price": 800},
    },
}

# 宝石系统
GEM_DB = {
    "攻击宝石": {"effect": "attack", "value": 10, "desc": "攻击+10"},
    "防御宝石": {"effect": "defense", "value": 10, "desc": "防御+10"},
    "生命宝石": {"effect": "hp", "value": 50, "desc": "生命+50"},
    "灵力宝石": {"effect": "mp", "value": 30, "desc": "灵力+30"},
    "暴击宝石": {"effect": "crit", "value": 5, "desc": "暴击率+5%"},
}


def enhance_equipment(character: dict, item_name: str) -> dict:
    """强化装备"""
    # 检查装备是否存在
    equipment = character.get("equipment", {})
    if item_name not in [equipment.get("weapon"), equipment.get("armor"), equipment.get("accessory")]:
        return {"success": False, "message": f"没有装备 {item_name}"}

    # 获取当前强化等级
    enhance_key = f"{item_name}_enhance"
    current_level = character.get(enhance_key, 0)

    if current_level >= 10:
        return {"success": False, "message": "已达到最高强化等级"}

    # 获取强化数据
    enhance_data = ENHANCE_DB["levels"][current_level]

    # 检查材料
    for item, amount in enhance_data["cost"].items():
        if character["inventory"].get(item, 0) < amount:
            return {"success": False, "message": f"材料不足，需要 {amount} {item}"}

    # 消耗材料
    for item, amount in enhance_data["cost"].items():
        character["inventory"][item] -= amount
        if character["inventory"][item] <= 0:
            del character["inventory"][item]

    # 尝试强化
    success_rate = enhance_data["success_rate"]
    luck_bonus = character.get("stats", {}).get("气运", 0) * 0.01
    final_rate = min(0.95, success_rate + luck_bonus)

    if random.random() < final_rate:
        # 强化成功
        character[enhance_key] = current_level + 1

        # 应用属性加成
        from .items import ITEM_DB
        item_data = ITEM_DB.get(item_name, {})
        if item_data.get("type") == "weapon":
            character["atk"] += enhance_data["atk_bonus"]
        elif item_data.get("type") == "armor":
            character["def"] += enhance_data["def_bonus"]

        return {
            "success": True,
            "message": f"强化成功！{item_name} +{current_level + 1}",
            "new_level": current_level + 1,
            "atk_bonus": enhance_data["atk_bonus"],
            "def_bonus": enhance_data["def_bonus"],
        }
    else:
        # 强化失败
        # 有一定概率降级
        if current_level > 0 and random.random() < 0.3:
            character[enhance_key] = current_level - 1
            return {
                "success": False,
                "message": f"强化失败，{item_name} 降级到 +{current_level - 1}",
                "new_level": current_level - 1,
            }
        else:
            return {
                "success": False,
                "message": "强化失败",
                "new_level": current_level,
            }


def embed_gem(character: dict, item_name: str, gem_name: str) -> dict:
    """镶嵌宝石"""
    # 检查装备是否存在
    equipment = character.get("equipment", {})
    if item_name not in [equipment.get("weapon"), equipment.get("armor"), equipment.get("accessory")]:
        return {"success": False, "message": f"没有装备 {item_name}"}

    # 检查宝石
    gem_data = ENHANCE_DB["gems"].get(gem_name)
    if not gem_data:
        return {"success": False, "message": f"未知宝石: {gem_name}"}

    if character["inventory"].get(gem_name, 0) <= 0:
        return {"success": False, "message": f"没有 {gem_name}"}

    # 检查宝石孔位
    gem_slots_key = f"{item_name}_gems"
    current_gems = character.get(gem_slots_key, [])

    if len(current_gems) >= 3:
        return {"success": False, "message": "宝石孔位已满"}

    # 消耗宝石
    character["inventory"][gem_name] -= 1
    if character["inventory"][gem_name] <= 0:
        del character["inventory"][gem_name]

    # 镶嵌宝石
    current_gems.append(gem_name)
    character[gem_slots_key] = current_gems

    # 应用属性加成
    for stat, value in gem_data.items():
        if stat == "price":
            continue
        if stat.endswith("_rate"):
            character[stat] = character.get(stat, 0) + value
        else:
            character[stat] = character.get(stat, 0) + value

    return {
        "success": True,
        "message": f"镶嵌 {gem_name} 成功",
        "gems": current_gems,
    }
