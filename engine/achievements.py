"""
成就系统
"""


# 成就系统
ACHIEVEMENT_DB = {
    "初入修仙": {
        "name": "初入修仙",
        "description": "创建角色",
        "condition": lambda c: True,
        "reward": {"灵石": 100},
    },
    "练气圆满": {
        "name": "练气圆满",
        "description": "达到练气圆满",
        "condition": lambda c: c.get("realm") == "练气" and c.get("stage") == 3,
        "reward": {"灵石": 200, "聚气丹": 5},
    },
    "筑基成功": {
        "name": "筑基成功",
        "description": "突破到筑基境界",
        "condition": lambda c: c.get("realm") == "筑基",
        "reward": {"灵石": 500, "筑基丹": 2},
    },
    "结丹修士": {
        "name": "结丹修士",
        "description": "突破到结丹境界",
        "condition": lambda c: c.get("realm") == "结丹",
        "reward": {"灵石": 1000, "金丹丹": 3},
    },
    "元婴大能": {
        "name": "元婴大能",
        "description": "突破到元婴境界",
        "condition": lambda c: c.get("realm") == "元婴",
        "reward": {"灵石": 2000, "元婴丹": 5},
    },
    "百人斩": {
        "name": "百人斩",
        "description": "击杀100个敌人",
        "condition": lambda c: c.get("kills", 0) >= 100,
        "reward": {"灵石": 1000, "仙剑": 1},
    },
    "千人斩": {
        "name": "千人斩",
        "description": "击杀1000个敌人",
        "condition": lambda c: c.get("kills", 0) >= 1000,
        "reward": {"灵石": 5000, "神剑": 1},
    },
    "探索者": {
        "name": "探索者",
        "description": "探索5个区域",
        "condition": lambda c: len(c.get("explored_regions", [])) >= 5,
        "reward": {"灵石": 500},
    },
    "收藏家": {
        "name": "收藏家",
        "description": "拥有20种不同物品",
        "condition": lambda c: len(c.get("inventory", {})) >= 20,
        "reward": {"灵石": 800},
    },
    "宗门弟子": {
        "name": "宗门弟子",
        "description": "加入一个宗门",
        "condition": lambda c: c.get("sect") is not None,
        "reward": {"灵石": 300},
    },
    "驯兽师": {
        "name": "驯兽师",
        "description": "拥有3只灵宠",
        "condition": lambda c: len(c.get("pets", [])) >= 3,
        "reward": {"灵石": 600},
    },
    "炼丹大师": {
        "name": "炼丹大师",
        "description": "炼丹熟练度达到100",
        "condition": lambda c: c.get("alchemy_mastery", 0) >= 100,
        "reward": {"灵石": 1000, "化神丹": 2},
    },
}


def check_achievements(character: dict) -> list:
    """检查并解锁成就"""
    new_achievements = []
    existing = character.get("achievements", [])

    for ach_id, ach_data in ACHIEVEMENT_DB.items():
        if ach_id not in existing:
            try:
                if ach_data["condition"](character):
                    character.setdefault("achievements", []).append(ach_id)
                    new_achievements.append({
                        "id": ach_id,
                        "name": ach_data["name"],
                        "description": ach_data["description"],
                        "reward": ach_data["reward"],
                    })

                    # 发放奖励
                    for item, amount in ach_data["reward"].items():
                        character["inventory"][item] = character["inventory"].get(item, 0) + amount
            except Exception:
                continue

    return new_achievements


def get_achievements(character: dict) -> list:
    """获取角色的所有成就"""
    achievements = []
    for ach_id in character.get("achievements", []):
        ach_data = ACHIEVEMENT_DB.get(ach_id)
        if ach_data:
            achievements.append({
                "id": ach_id,
                "name": ach_data["name"],
                "description": ach_data["description"],
            })
    return achievements
