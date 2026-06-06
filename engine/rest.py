"""
休息系统
"""


def rest(character: dict) -> dict:
    """休息恢复"""
    # 恢复生命
    heal_amount = int(character["max_hp"] * 0.3)
    character["hp"] = min(character["max_hp"], character["hp"] + heal_amount)

    # 恢复灵力
    mp_amount = int(character["max_mp"] * 0.3)
    character["mp"] = min(character["max_mp"], character["mp"] + mp_amount)

    # 增加年龄
    character["age"] = character.get("age", 16) + 1

    return {
        "success": True,
        "message": f"休息恢复，恢复 {heal_amount} 生命和 {mp_amount} 灵力",
        "heal": heal_amount,
        "mp_recover": mp_amount,
    }
