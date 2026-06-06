"""
灵宠系统
"""
import random


# 灵宠系统
PET_DB = {
    "灵兔": {
        "name": "灵兔",
        "description": "温顺的灵兔，适合新手",
        "base_hp": 30,
        "base_atk": 5,
        "base_def": 3,
        "element": "木",
        "catch_rate": 0.8,
        "food": ["灵草", "灵芝"],
        "evolution": "仙兔",
    },
    "灵犬": {
        "name": "灵犬",
        "description": "忠诚的灵犬",
        "base_hp": 50,
        "base_atk": 8,
        "base_def": 5,
        "element": "土",
        "catch_rate": 0.7,
        "food": ["灵肉", "灵骨"],
        "evolution": "天狗",
    },
    "灵鹰": {
        "name": "灵鹰",
        "description": "敏锐的灵鹰",
        "base_hp": 40,
        "base_atk": 12,
        "base_def": 4,
        "element": "金",
        "catch_rate": 0.6,
        "food": ["灵肉", "灵鱼"],
        "evolution": "金翅大鹏",
    },
    "灵蛇": {
        "name": "灵蛇",
        "description": "神秘的灵蛇",
        "base_hp": 35,
        "base_atk": 10,
        "base_def": 6,
        "element": "水",
        "catch_rate": 0.65,
        "food": ["灵草", "灵果"],
        "evolution": "蛟龙",
    },
    "灵虎": {
        "name": "灵虎",
        "description": "威猛的灵虎",
        "base_hp": 60,
        "base_atk": 15,
        "base_def": 8,
        "element": "火",
        "catch_rate": 0.5,
        "food": ["灵肉", "灵丹"],
        "evolution": "白虎",
    },
    "仙兔": {
        "name": "仙兔",
        "description": "灵兔的进化形态",
        "base_hp": 80,
        "base_atk": 15,
        "base_def": 10,
        "element": "木",
        "catch_rate": 0.3,
        "food": ["仙草", "仙果"],
        "evolution": None,
    },
    "天狗": {
        "name": "天狗",
        "description": "灵犬的进化形态",
        "base_hp": 120,
        "base_atk": 25,
        "base_def": 15,
        "element": "土",
        "catch_rate": 0.25,
        "food": ["仙肉", "仙骨"],
        "evolution": None,
    },
}


def catch_pet(character: dict, pet_name: str) -> dict:
    """捕捉灵宠"""
    pet_data = PET_DB.get(pet_name)
    if not pet_data:
        return {"success": False, "message": f"未知灵宠: {pet_name}"}

    # 检查灵宠数量上限
    if len(character.get("pets", [])) >= 5:
        return {"success": False, "message": "灵宠数量已达上限(5只)"}

    # 检查捕捉成功率
    catch_rate = pet_data["catch_rate"]
    luck_bonus = character.get("stats", {}).get("气运", 0) * 0.02
    final_rate = min(0.95, catch_rate + luck_bonus)

    if random.random() > final_rate:
        return {"success": False, "message": f"捕捉 {pet_name} 失败"}

    # 创建灵宠
    pet = {
        "name": pet_name,
        "level": 1,
        "exp": 0,
        "hp": pet_data["base_hp"],
        "max_hp": pet_data["base_hp"],
        "atk": pet_data["base_atk"],
        "def": pet_data["base_def"],
        "element": pet_data["element"],
        "loyalty": 50,
        "hunger": 100,
    }

    character.setdefault("pets", []).append(pet)

    return {"success": True, "message": f"成功捕捉 {pet_name}！", "pet": pet}


def feed_pet(character: dict, pet_index: int, item_name: str) -> dict:
    """喂养灵宠"""
    if pet_index < 0 or pet_index >= len(character.get("pets", [])):
        return {"success": False, "message": "无效的灵宠索引"}

    pet = character["pets"][pet_index]
    pet_data = PET_DB.get(pet["name"])

    if not pet_data:
        return {"success": False, "message": "未知灵宠"}

    # 检查食物
    if item_name not in pet_data.get("food", []):
        return {"success": False, "message": f"{pet['name']} 不喜欢吃 {item_name}"}

    # 检查物品
    if character["inventory"].get(item_name, 0) <= 0:
        return {"success": False, "message": f"没有 {item_name}"}

    # 喂养
    character["inventory"][item_name] -= 1
    if character["inventory"][item_name] <= 0:
        del character["inventory"][item_name]

    # 增加忠诚度和饱食度
    pet["loyalty"] = min(100, pet["loyalty"] + 10)
    pet["hunger"] = min(100, pet["hunger"] + 30)

    # 增加经验
    exp_gain = 20
    pet["exp"] += exp_gain

    # 检查升级
    level_up = False
    while pet["exp"] >= pet["level"] * 100:
        pet["exp"] -= pet["level"] * 100
        pet["level"] += 1
        pet["max_hp"] += 10
        pet["hp"] = pet["max_hp"]
        pet["atk"] += 2
        pet["def"] += 1
        level_up = True

    message = f"喂养 {pet['name']} 成功"
    if level_up:
        message += f"，升级到 {pet['level']} 级！"

    return {"success": True, "message": message}


def evolve_pet(character: dict, pet_index: int) -> dict:
    """进化灵宠"""
    if pet_index < 0 or pet_index >= len(character.get("pets", [])):
        return {"success": False, "message": "无效的灵宠索引"}

    pet = character["pets"][pet_index]
    pet_data = PET_DB.get(pet["name"])

    if not pet_data:
        return {"success": False, "message": "未知灵宠"}

    # 检查是否可进化
    if not pet_data.get("evolution"):
        return {"success": False, "message": f"{pet['name']} 无法进化"}

    # 检查等级要求
    if pet["level"] < 30:
        return {"success": False, "message": "灵宠等级不足，需要30级"}

    # 检查忠诚度
    if pet["loyalty"] < 80:
        return {"success": False, "message": "忠诚度不足，需要80以上"}

    # 进化
    evolution_name = pet_data["evolution"]
    evolution_data = PET_DB.get(evolution_name)

    if not evolution_data:
        return {"success": False, "message": f"进化形态 {evolution_name} 不存在"}

    # 更新灵宠
    pet["name"] = evolution_name
    pet["max_hp"] = evolution_data["base_hp"] + (pet["level"] - 1) * 10
    pet["hp"] = pet["max_hp"]
    pet["atk"] = evolution_data["base_atk"] + (pet["level"] - 1) * 2
    pet["def"] = evolution_data["base_def"] + (pet["level"] - 1) * 1
    pet["element"] = evolution_data["element"]

    return {"success": True, "message": f"{pet['name']} 进化为 {evolution_name}！"}
