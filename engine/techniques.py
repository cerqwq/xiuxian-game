"""
功法系统（被动增益）
"""


# 功法系统（被动增益）
TECHNIQUE_DB = {
    "基础吐纳": {
        "name": "基础吐纳",
        "description": "基础修炼功法",
        "price": 0,
        "effects": {"cultivation_speed": 0.1},
        "required_realm": "练气",
    },
    "聚气诀": {
        "name": "聚气诀",
        "description": "聚气凝神的功法",
        "price": 100,
        "effects": {"cultivation_speed": 0.2, "mp_regen": 1},
        "required_realm": "练气",
    },
    "金刚功": {
        "name": "金刚功",
        "description": "增强肉身的功法",
        "price": 200,
        "effects": {"hp_pct": 0.1, "def_pct": 0.05},
        "required_realm": "筑基",
    },
    "御风术": {
        "name": "御风术",
        "description": "提升移动速度",
        "price": 300,
        "effects": {"speed": 0.2, "dodge": 0.05},
        "required_realm": "筑基",
    },
    "五行诀": {
        "name": "五行诀",
        "description": "五行之力的功法",
        "price": 500,
        "effects": {"atk_pct": 0.1, "def_pct": 0.1},
        "required_realm": "结丹",
    },
    "天罡诀": {
        "name": "天罡诀",
        "description": "天罡之力",
        "price": 800,
        "effects": {"atk_pct": 0.15, "crit_rate": 0.1},
        "required_realm": "结丹",
    },
    "地煞功": {
        "name": "地煞功",
        "description": "地煞之力",
        "price": 1000,
        "effects": {"hp_pct": 0.2, "def_pct": 0.15},
        "required_realm": "元婴",
    },
    "混元功": {
        "name": "混元功",
        "description": "混元之力",
        "price": 1500,
        "effects": {"cultivation_speed": 0.3, "hp_pct": 0.15, "mp_pct": 0.15},
        "required_realm": "元婴",
    },
    "天道诀": {
        "name": "天道诀",
        "description": "天道之力",
        "price": 3000,
        "effects": {"atk_pct": 0.2, "def_pct": 0.2, "crit_rate": 0.15},
        "required_realm": "化神",
    },
    "混沌功": {
        "name": "混沌功",
        "description": "混沌之力",
        "price": 5000,
        "effects": {"cultivation_speed": 0.5, "hp_pct": 0.3, "mp_pct": 0.3, "atk_pct": 0.2},
        "required_realm": "炼虚",
    },
}


def learn_technique(character: dict, tech_name: str) -> dict:
    """学习功法"""
    technique = TECHNIQUE_DB.get(tech_name)
    if not technique:
        return {"success": False, "message": f"未知功法: {tech_name}"}

    # 检查是否已学习
    if tech_name in character.get("techniques", []):
        return {"success": False, "message": f"已经学会了 {tech_name}"}

    # 检查境界要求
    from .realms import Realm
    current_realm = Realm(character["realm"])
    required_realm = Realm(technique["required_realm"])
    realm_names = ["练气", "筑基", "结丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "飞升"]

    if realm_names.index(current_realm.value) < realm_names.index(required_realm.value):
        return {"success": False, "message": f"需要达到 {technique['required_realm']} 境界"}

    # 学习功法
    character.setdefault("techniques", []).append(tech_name)

    return {"success": True, "message": f"学会了 {tech_name}"}


def buy_technique(character: dict, npc_name: str, tech_name: str) -> dict:
    """购买功法"""
    from .npc import NPC_DB

    npc = NPC_DB.get(npc_name)
    if not npc:
        return {"success": False, "message": f"未知NPC: {npc_name}"}

    if not npc.get("shop") or tech_name not in npc["shop"]:
        return {"success": False, "message": f"{npc_name} 不卖 {tech_name}"}

    technique = TECHNIQUE_DB.get(tech_name)
    if not technique:
        return {"success": False, "message": f"未知功法: {tech_name}"}

    price = npc["shop"][tech_name]

    # 检查灵石
    current_coins = character["inventory"].get("灵石", 0)
    if current_coins < price:
        return {"success": False, "message": f"灵石不足，需要 {price} 灵石"}

    # 检查是否已学习
    if tech_name in character.get("techniques", []):
        return {"success": False, "message": f"已经学会了 {tech_name}"}

    # 购买并学习
    character["inventory"]["灵石"] = current_coins - price
    character.setdefault("techniques", []).append(tech_name)

    return {
        "success": True,
        "message": f"购买并学会了 {tech_name}，花费 {price} 灵石",
        "technique": tech_name,
        "price": price,
    }


def get_technique_effects(character: dict) -> dict:
    """获取角色所有功法的效果总和"""
    effects = {}

    for tech_name in character.get("techniques", []):
        technique = TECHNIQUE_DB.get(tech_name)
        if technique:
            for effect, value in technique["effects"].items():
                effects[effect] = effects.get(effect, 0) + value

    return effects
