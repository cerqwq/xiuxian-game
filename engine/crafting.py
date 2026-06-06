"""
炼丹/合成系统
"""
import random


# 炼丹/合成系统
CRAFTING_DB = {
    "聚气丹": {
        "name": "聚气丹",
        "description": "辅助修炼的基础丹药",
        "materials": {"灵草": 2, "灵石": 10},
        "result": "聚气丹",
        "result_amount": 1,
        "success_rate": 0.9,
        "exp": 5,
        "required_alchemy_level": 1,
    },
    "回春丹": {
        "name": "回春丹",
        "description": "恢复生命值的丹药",
        "materials": {"灵草": 3, "灵石": 15},
        "result": "回春丹",
        "result_amount": 1,
        "success_rate": 0.85,
        "exp": 8,
        "required_alchemy_level": 1,
    },
    "回灵丹": {
        "name": "回灵丹",
        "description": "恢复灵力的丹药",
        "materials": {"灵草": 3, "灵石": 15},
        "result": "回灵丹",
        "result_amount": 1,
        "success_rate": 0.85,
        "exp": 8,
        "required_alchemy_level": 1,
    },
    "筑基丹": {
        "name": "筑基丹",
        "description": "突破筑基的必备丹药",
        "materials": {"灵芝": 3, "灵石": 50},
        "result": "筑基丹",
        "result_amount": 1,
        "success_rate": 0.7,
        "exp": 15,
        "required_alchemy_level": 2,
    },
    "金丹丹": {
        "name": "金丹丹",
        "description": "凝聚金丹的辅助丹药",
        "materials": {"千年灵芝": 2, "天雷珠": 1, "灵石": 100},
        "result": "金丹丹",
        "result_amount": 1,
        "success_rate": 0.6,
        "exp": 25,
        "required_alchemy_level": 3,
    },
    "元婴丹": {
        "name": "元婴丹",
        "description": "化婴必备灵丹",
        "materials": {"天材地宝": 2, "千年灵芝": 3, "灵石": 200},
        "result": "元婴丹",
        "result_amount": 1,
        "success_rate": 0.5,
        "exp": 40,
        "required_alchemy_level": 4,
    },
    "化神丹": {
        "name": "化神丹",
        "description": "化神境界专用",
        "materials": {"仙器碎片": 3, "天道碎片": 1, "灵石": 500},
        "result": "化神丹",
        "result_amount": 1,
        "success_rate": 0.4,
        "exp": 60,
        "required_alchemy_level": 5,
    },
    "解毒丹": {
        "name": "解毒丹",
        "description": "解除中毒状态",
        "materials": {"灵草": 5, "灵石": 20},
        "result": "解毒丹",
        "result_amount": 1,
        "success_rate": 0.8,
        "exp": 10,
        "required_alchemy_level": 1,
    },
}


def craft_item(character: dict, recipe_name: str) -> dict:
    """炼制物品"""
    recipe = CRAFTING_DB.get(recipe_name)
    if not recipe:
        return {"success": False, "message": f"未知配方: {recipe_name}"}

    # 检查炼丹等级
    from .alchemy import get_alchemy_level
    alchemy_level = get_alchemy_level(character)
    if alchemy_level["level"] < recipe.get("required_alchemy_level", 1):
        return {"success": False, "message": f"炼丹等级不足，需要 {recipe.get('required_alchemy_level', 1)} 级"}

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
    alchemy_bonus = alchemy_level["success_bonus"]
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

        return {
            "success": True,
            "message": f"炼制成功，获得 {result_amount} 个 {result_item}",
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
            "message": "炼制失败，返还部分材料",
            "returned_materials": returned_materials,
            "exp_gain": exp_gain,
        }


def get_crafting_recipes(character: dict) -> list:
    """获取可炼制的配方"""
    recipes = []

    for recipe_name, recipe in CRAFTING_DB.items():
        # 检查炼丹等级
        from .alchemy import get_alchemy_level
        alchemy_level = get_alchemy_level(character)
        if alchemy_level["level"] < recipe.get("required_alchemy_level", 1):
            continue

        # 检查材料
        can_craft = True
        for item, amount in recipe["materials"].items():
            if character["inventory"].get(item, 0) < amount:
                can_craft = False
                break

        recipes.append({
            "name": recipe_name,
            "description": recipe["description"],
            "materials": recipe["materials"],
            "result": recipe["result"],
            "result_amount": recipe.get("result_amount", 1),
            "success_rate": recipe.get("success_rate", 0.8),
            "can_craft": can_craft,
        })

    return recipes
