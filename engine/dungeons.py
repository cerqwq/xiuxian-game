"""
秘境副本系统
"""
import random


# 秘境副本系统
DUNGEON_DB = {
    "野狼谷": {
        "name": "野狼谷",
        "description": "野狼聚集的山谷",
        "required_realm": "练气",
        "floors": 3,
        "monsters": ["野狼", "妖狼"],
        "rewards": {"灵石": 100, "灵芝": 3},
        "boss": {"name": "狼王", "hp": 200, "atk": 20, "def": 10},
    },
    "灵药园": {
        "name": "灵药园",
        "description": "灵草丛生的神秘园地",
        "required_realm": "筑基",
        "floors": 5,
        "monsters": ["树妖", "花妖"],
        "rewards": {"灵石": 300, "千年灵芝": 2, "灵芝": 5},
        "boss": {"name": "树妖王", "hp": 500, "atk": 35, "def": 20},
    },
    "水下洞府": {
        "name": "水下洞府",
        "description": "水系修士的遗迹",
        "required_realm": "结丹",
        "floors": 7,
        "monsters": ["水鬼", "蛟龙"],
        "rewards": {"灵石": 800, "天雷珠": 3, "仙器碎片": 1},
        "boss": {"name": "蛟龙王", "hp": 1200, "atk": 60, "def": 35},
    },
    "火焰秘境": {
        "name": "火焰秘境",
        "description": "火焰灵气浓郁的秘境",
        "required_realm": "元婴",
        "floors": 10,
        "monsters": ["火鸦", "凤凰"],
        "rewards": {"灵石": 2000, "天道碎片": 2, "混沌精华": 1},
        "boss": {"name": "火凤王", "hp": 3000, "atk": 100, "def": 60},
    },
    "天机秘境": {
        "name": "天机秘境",
        "description": "天机老人留下的秘境",
        "required_realm": "化神",
        "floors": 15,
        "monsters": ["魔将", "妖虎"],
        "rewards": {"灵石": 5000, "天道碎片": 5, "混沌精华": 3, "造化玉碟": 1},
        "boss": {"name": "天机魔君", "hp": 8000, "atk": 200, "def": 120},
    },
}


def enter_dungeon(character: dict, dungeon_name: str) -> dict:
    """进入秘境副本"""
    dungeon = DUNGEON_DB.get(dungeon_name)
    if not dungeon:
        return {"success": False, "message": f"未知秘境: {dungeon_name}"}

    # 检查境界要求
    from .realms import Realm
    current_realm = Realm(character["realm"])
    required_realm = Realm(dungeon["required_realm"])
    realm_names = ["练气", "筑基", "结丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "飞升"]

    if realm_names.index(current_realm.value) < realm_names.index(required_realm.value):
        return {"success": False, "message": f"需要达到 {dungeon['required_realm']} 境界"}

    # 初始化副本进度
    character.setdefault("dungeon_progress", {})[dungeon_name] = {
        "current_floor": 1,
        "total_floors": dungeon["floors"],
        "monsters_defeated": 0,
    }

    return {
        "success": True,
        "message": f"进入 {dungeon_name}",
        "dungeon": {
            "name": dungeon_name,
            "description": dungeon["description"],
            "current_floor": 1,
            "total_floors": dungeon["floors"],
        },
    }


def dungeon_battle(character: dict) -> dict:
    """副本战斗"""
    # 获取当前副本进度
    dungeon_progress = character.get("dungeon_progress", {})
    if not dungeon_progress:
        return {"success": False, "message": "不在任何副本中"}

    # 找到当前副本
    current_dungeon = None
    dungeon_name = None
    for name, progress in dungeon_progress.items():
        if progress["current_floor"] <= progress["total_floors"]:
            current_dungeon = name
            break

    if not current_dungeon:
        return {"success": False, "message": "副本已完成"}

    dungeon = DUNGEON_DB.get(current_dungeon)
    progress = dungeon_progress[current_dungeon]

    # 生成怪物
    if progress["current_floor"] < progress["total_floors"]:
        # 普通层
        monster_name = random.choice(dungeon["monsters"])
        from .combat import MONSTER_DB
        monster_data = MONSTER_DB.get(monster_name, {"hp": 50, "atk": 10, "def": 5})
    else:
        # Boss层
        boss_data = dungeon["boss"]
        monster_name = boss_data["name"]
        monster_data = boss_data

    # 创建战斗
    from .realms import Realm
    realm = Realm(character["realm"])
    realm_multiplier = 1 + list(DUNGEON_DB.keys()).index(current_dungeon) * 0.3

    monster = {
        "name": monster_name,
        "hp": int(monster_data["hp"] * realm_multiplier),
        "max_hp": int(monster_data["hp"] * realm_multiplier),
        "atk": int(monster_data["atk"] * realm_multiplier),
        "def": int(monster_data["def"] * realm_multiplier),
        "element": "无",
    }

    return {
        "success": True,
        "monster": monster,
        "floor": progress["current_floor"],
        "is_boss": progress["current_floor"] == progress["total_floors"],
    }


def dungeon_next_floor(character: dict) -> dict:
    """进入下一层"""
    dungeon_progress = character.get("dungeon_progress", {})
    if not dungeon_progress:
        return {"success": False, "message": "不在任何副本中"}

    # 找到当前副本
    current_dungeon = None
    for name, progress in dungeon_progress.items():
        if progress["current_floor"] <= progress["total_floors"]:
            current_dungeon = name
            break

    if not current_dungeon:
        return {"success": False, "message": "副本已完成"}

    progress = dungeon_progress[current_dungeon]

    # 检查是否已击败当前层怪物
    if progress["monsters_defeated"] <= 0:
        return {"success": False, "message": "需要先击败当前层的怪物"}

    # 进入下一层
    progress["current_floor"] += 1
    progress["monsters_defeated"] = 0

    dungeon = DUNGEON_DB.get(current_dungeon)

    if progress["current_floor"] > progress["total_floors"]:
        # 副本完成
        return {
            "success": True,
            "message": f"恭喜通关 {current_dungeon}！",
            "completed": True,
            "rewards": dungeon["rewards"],
        }
    else:
        return {
            "success": True,
            "message": f"进入第 {progress['current_floor']} 层",
            "floor": progress["current_floor"],
        }


def dungeon_reward(character: dict) -> dict:
    """领取副本奖励"""
    dungeon_progress = character.get("dungeon_progress", {})
    if not dungeon_progress:
        return {"success": False, "message": "不在任何副本中"}

    # 找到已完成的副本
    completed_dungeon = None
    for name, progress in dungeon_progress.items():
        if progress["current_floor"] > progress["total_floors"]:
            completed_dungeon = name
            break

    if not completed_dungeon:
        return {"success": False, "message": "没有已完成的副本"}

    dungeon = DUNGEON_DB.get(completed_dungeon)
    if not dungeon:
        return {"success": False, "message": "未知副本"}

    # 发放奖励
    for item, amount in dungeon["rewards"].items():
        character["inventory"][item] = character["inventory"].get(item, 0) + amount

    # 删除副本进度
    del dungeon_progress[completed_dungeon]

    return {
        "success": True,
        "message": f"领取 {completed_dungeon} 奖励",
        "rewards": dungeon["rewards"],
    }
