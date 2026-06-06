"""
转世重生系统
"""
import random


def rebirth(character: dict) -> dict:
    """转世重生"""
    # 检查是否达到转世条件
    realm = character.get("realm", "练气")
    realm_names = ["练气", "筑基", "结丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "飞升"]

    if realm not in realm_names:
        return {"success": False, "message": "无法转世"}

    current_index = realm_names.index(realm)
    if current_index < 3:  # 需要至少元婴境界
        return {"success": False, "message": "需要达到元婴境界才能转世"}

    # 计算转世加成
    rebirth_count = character.get("rebirth_count", 0) + 1
    bonus_multiplier = 1 + rebirth_count * 0.1

    # 保留部分属性
    preserved = {
        "max_hp": int(character.get("max_hp", 100) * 0.1),
        "max_mp": int(character.get("max_mp", 50) * 0.1),
        "atk": int(character.get("atk", 10) * 0.05),
        "def": int(character.get("def", 5) * 0.05),
        "inventory": {},
    }

    # 保留部分物品
    for item, amount in character.get("inventory", {}).items():
        if item in ["灵石", "仙器碎片", "天道碎片", "混沌精华", "造化玉碟"]:
            preserved["inventory"][item] = max(1, amount // 10)

    # 保留成就
    preserved["achievements"] = character.get("achievements", [])
    preserved["rebirth_count"] = rebirth_count

    # 计算转世加成
    rebirth_bonuses = {
        "hp_pct": rebirth_count * 5,
        "mp_pct": rebirth_count * 5,
        "atk_pct": rebirth_count * 3,
        "def_pct": rebirth_count * 3,
        "cultivation_speed": rebirth_count * 0.1,
    }

    # 创建新角色
    from .character import create_character
    new_character = create_character(
        name=character["name"],
        elements=character.get("elements", ["金"]),
        stats=character.get("stats", {"根骨": 5, "悟性": 5, "气运": 5, "魅力": 5}),
    )

    # 应用转世加成
    new_character["max_hp"] += preserved["max_hp"]
    new_character["hp"] = new_character["max_hp"]
    new_character["max_mp"] += preserved["max_mp"]
    new_character["mp"] = new_character["max_mp"]
    new_character["atk"] += preserved["atk"]
    new_character["def"] += preserved["def"]
    new_character["inventory"].update(preserved["inventory"])
    new_character["achievements"] = preserved["achievements"]
    new_character["rebirth_count"] = preserved["rebirth_count"]
    new_character["rebirth_bonuses"] = rebirth_bonuses

    # 应用百分比加成
    for stat, pct in rebirth_bonuses.items():
        if stat.endswith("_pct"):
            base_stat = stat.replace("_pct", "")
            new_character[base_stat] = int(new_character.get(base_stat, 0) * (1 + pct / 100))

    return {
        "success": True,
        "message": f"转世成功！第 {rebirth_count} 次转世",
        "new_character": new_character,
        "rebirth_count": rebirth_count,
        "bonuses": rebirth_bonuses,
    }
