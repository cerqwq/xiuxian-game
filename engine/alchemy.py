"""
丹道精通系统
"""
import random


# 丹道精通系统
ALCHEMY_MASTERY = {
    "levels": [
        {"level": 1, "name": "丹童", "required_exp": 0, "success_bonus": 0.0},
        {"level": 2, "name": "丹师", "required_exp": 100, "success_bonus": 0.05},
        {"level": 3, "name": "丹王", "required_exp": 300, "success_bonus": 0.10},
        {"level": 4, "name": "丹皇", "required_exp": 600, "success_bonus": 0.15},
        {"level": 5, "name": "丹仙", "required_exp": 1000, "success_bonus": 0.20},
        {"level": 6, "name": "丹圣", "required_exp": 1500, "success_bonus": 0.25},
        {"level": 7, "name": "丹神", "required_exp": 2000, "success_bonus": 0.30},
    ],
}


def get_alchemy_level(character: dict) -> dict:
    """获取炼丹等级"""
    mastery = character.get("alchemy_mastery", 0)

    current_level = ALCHEMY_MASTERY["levels"][0]
    for level_data in ALCHEMY_MASTERY["levels"]:
        if mastery >= level_data["required_exp"]:
            current_level = level_data
        else:
            break

    # 计算到下一级的经验
    next_level = None
    for level_data in ALCHEMY_MASTERY["levels"]:
        if level_data["required_exp"] > mastery:
            next_level = level_data
            break

    return {
        "level": current_level["level"],
        "name": current_level["name"],
        "exp": mastery,
        "next_level_exp": next_level["required_exp"] if next_level else None,
        "success_bonus": current_level["success_bonus"],
    }


def advanced_craft(character: dict, recipe_name: str) -> dict:
    """高级炼丹（受丹道精通加成）"""
    from .crafting import CRAFTING_DB

    recipe = CRAFTING_DB.get(recipe_name)
    if not recipe:
        return {"success": False, "message": f"未知配方: {recipe_name}"}

    # 检查材料
    for item, amount in recipe["materials"].items():
        if character["inventory"].get(item, 0) < amount:
            return {"success": False, "message": f"材料不足，需要 {amount} {item}"}

    # 消耗材料
    for item, amount in recipe["materials"].items():
        character["inventory"][item] -= amount
        if character["inventory"][item] <= 0:
            del character["inventory"][item]

    # 计算成功率
    base_rate = recipe.get("success_rate", 0.8)
    alchemy_bonus = get_alchemy_level(character)["success_bonus"]
    luck_bonus = character.get("stats", {}).get("悟性", 0) * 0.01
    final_rate = min(0.95, base_rate + alchemy_bonus + luck_bonus)

    # 尝试炼制
    if random.random() < final_rate:
        # 炼制成功
        result_item = recipe["result"]
        result_amount = recipe.get("result_amount", 1)
        character["inventory"][result_item] = character["inventory"].get(result_item, 0) + result_amount

        # 增加炼丹经验
        exp_gain = recipe.get("exp", 10)
        character["alchemy_mastery"] = character.get("alchemy_mastery", 0) + exp_gain

        # 检查升级
        old_level = get_alchemy_level(character)
        new_level = get_alchemy_level(character)

        message = f"炼制成功，获得 {result_amount} 个 {result_item}"
        if new_level["level"] > old_level["level"]:
            message += f"，炼丹等级提升到 {new_level['name']}！"

        return {
            "success": True,
            "message": message,
            "result": result_item,
            "amount": result_amount,
            "exp_gain": exp_gain,
        }
    else:
        # 炼制失败
        # 返还部分材料
        returned_materials = {}
        for item, amount in recipe["materials"].items():
            return_amount = max(1, amount // 2)
            character["inventory"][item] = character["inventory"].get(item, 0) + return_amount
            returned_materials[item] = return_amount

        # 仍然获得少量经验
        exp_gain = recipe.get("exp", 10) // 3
        character["alchemy_mastery"] = character.get("alchemy_mastery", 0) + exp_gain

        return {
            "success": False,
            "message": f"炼制失败，返还部分材料",
            "returned_materials": returned_materials,
            "exp_gain": exp_gain,
        }


def detoxify(character: dict) -> dict:
    """解毒"""
    # 检查是否有中毒状态
    if not character.get("poisoned"):
        return {"success": False, "message": "没有中毒"}

    # 检查解毒丹
    if character["inventory"].get("解毒丹", 0) <= 0:
        return {"success": False, "message": "没有解毒丹"}

    # 使用解毒丹
    character["inventory"]["解毒丹"] -= 1
    if character["inventory"]["解毒丹"] <= 0:
        del character["inventory"]["解毒丹"]

    # 解毒成功
    character["poisoned"] = False

    return {"success": True, "message": "解毒成功"}
