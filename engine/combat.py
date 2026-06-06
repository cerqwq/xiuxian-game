"""
战斗系统
"""
import random
from .elements import Element, get_element_multiplier, _best_element_multiplier
from .realms import Realm, REALM_DATA


# 技能系统
SWORD_PROGRESSION = [
    {"name": "铁剑", "atk_bonus": 0},
    {"name": "灵剑", "atk_bonus": 5},
    {"name": "仙剑", "atk_bonus": 15},
    {"name": "神剑", "atk_bonus": 30},
    {"name": "道剑", "atk_bonus": 50},
]


# 怪物系统
MONSTER_DB = {
    # 练气期怪物
    "野狼": {"hp": 30, "atk": 5, "def": 2, "element": "金", "realm": "练气", "exp": 10, "drops": {"灵石": 5}},
    "灵兔": {"hp": 20, "atk": 3, "def": 1, "element": "木", "realm": "练气", "exp": 8, "drops": {"灵石": 3, "灵芝": 0.3}},
    "山贼": {"hp": 50, "atk": 8, "def": 3, "element": "土", "realm": "练气", "exp": 15, "drops": {"灵石": 10}},

    # 筑基期怪物
    "妖狼": {"hp": 100, "atk": 15, "def": 8, "element": "金", "realm": "筑基", "exp": 30, "drops": {"灵石": 20, "灵芝": 0.5}},
    "树妖": {"hp": 120, "atk": 12, "def": 10, "element": "木", "realm": "筑基", "exp": 35, "drops": {"灵石": 25, "千年灵芝": 0.2}},
    "水鬼": {"hp": 80, "atk": 18, "def": 6, "element": "水", "realm": "筑基", "exp": 25, "drops": {"灵石": 15}},

    # 结丹期怪物
    "妖虎": {"hp": 200, "atk": 25, "def": 15, "element": "金", "realm": "结丹", "exp": 60, "drops": {"灵石": 50, "天雷珠": 0.3}},
    "火鸦": {"hp": 150, "atk": 30, "def": 10, "element": "火", "realm": "结丹", "exp": 50, "drops": {"灵石": 40}},
    "石魔": {"hp": 300, "atk": 20, "def": 25, "element": "土", "realm": "结丹", "exp": 70, "drops": {"灵石": 60, "天材地宝": 0.2}},

    # 元婴期怪物
    "蛟龙": {"hp": 500, "atk": 50, "def": 30, "element": "水", "realm": "元婴", "exp": 150, "drops": {"灵石": 150, "仙器碎片": 0.1}},
    "凤凰": {"hp": 400, "atk": 60, "def": 25, "element": "火", "realm": "元婴", "exp": 130, "drops": {"灵石": 120}},
    "魔将": {"hp": 600, "atk": 45, "def": 35, "element": "金", "realm": "元婴", "exp": 180, "drops": {"灵石": 200, "天道碎片": 0.1}},
}


def create_combat(character: dict, enemy_name: str) -> dict:
    """创建战斗"""
    from .items import ITEM_DB

    enemy_data = MONSTER_DB.get(enemy_name)
    if not enemy_data:
        return {"error": f"未知的敌人: {enemy_name}"}

    # 根据角色境界调整怪物属性
    realm = Realm(character["realm"])
    realm_multiplier = 1 + REALM_ORDER.index(realm) * 0.2

    enemy = {
        "name": enemy_name,
        "hp": int(enemy_data["hp"] * realm_multiplier),
        "max_hp": int(enemy_data["hp"] * realm_multiplier),
        "atk": int(enemy_data["atk"] * realm_multiplier),
        "def": int(enemy_data["def"] * realm_multiplier),
        "element": enemy_data["element"],
        "exp": int(enemy_data["exp"] * realm_multiplier),
        "drops": enemy_data["drops"],
    }

    combat = {
        "character": character,
        "enemy": enemy,
        "turn": 0,
        "log": [],
        "status_effects": {"player": [], "enemy": []},
        "finished": False,
        "result": None,
    }

    return combat


def _apply_status_effects(combat: dict, target: str) -> list:
    """应用状态效果"""
    messages = []
    effects = combat["status_effects"][target]

    for effect in effects[:]:
        if effect["type"] == "poison":
            damage = effect["damage"]
            if target == "player":
                combat["character"]["hp"] = max(0, combat["character"]["hp"] - damage)
            else:
                combat["enemy"]["hp"] = max(0, combat["enemy"]["hp"] - damage)
            messages.append(f"{effect['name']}造成 {damage} 点伤害")

        elif effect["type"] == "bleed":
            damage = effect["damage"]
            if target == "player":
                combat["character"]["hp"] = max(0, combat["character"]["hp"] - damage)
            else:
                combat["enemy"]["hp"] = max(0, combat["enemy"]["hp"] - damage)
            messages.append(f"流血造成 {damage} 点伤害")

        # 减少持续时间
        effect["duration"] -= 1
        if effect["duration"] <= 0:
            effects.remove(effect)

    return messages


def _try_inflict_status(combat: dict, target: str, skill_element) -> list:
    """尝试施加状态效果"""
    messages = []

    if random.random() < 0.2:  # 20%概率施加状态
        if skill_element == Element.WOOD:
            effect = {"type": "poison", "name": "中毒", "damage": 5, "duration": 3}
            combat["status_effects"][target].append(effect)
            messages.append("施加了中毒效果")
        elif skill_element == Element.METAL:
            effect = {"type": "bleed", "name": "流血", "damage": 3, "duration": 2}
            combat["status_effects"][target].append(effect)
            messages.append("施加了流血效果")

    return messages


def combat_action(combat: dict, action: str, skill_name: str = None) -> dict:
    """执行战斗动作"""
    if combat["finished"]:
        return combat

    character = combat["character"]
    enemy = combat["enemy"]
    combat["turn"] += 1

    # 玩家回合
    player_messages = []

    if action == "attack":
        # 普通攻击
        damage = max(1, character["atk"] - enemy["def"])
        damage = int(damage * random.uniform(0.8, 1.2))

        # 五行相克
        if character.get("elements"):
            multiplier = _best_element_multiplier(character["elements"], enemy["element"])
            damage = int(damage * multiplier)
            if multiplier > 1:
                player_messages.append("五行相克！伤害增加")
            elif multiplier < 1:
                player_messages.append("五行相抗，伤害减少")

        enemy["hp"] = max(0, enemy["hp"] - damage)
        player_messages.append(f"攻击造成 {damage} 点伤害")

    elif action == "skill" and skill_name:
        # 使用技能
        from .abilities import ABILITY_DB
        skill = ABILITY_DB.get(skill_name)
        if skill:
            # 检查灵力消耗
            mp_cost = skill.get("mp_cost", 0)
            if character["mp"] < mp_cost:
                player_messages.append("灵力不足，无法使用技能")
            else:
                character["mp"] -= mp_cost
                damage = skill["damage"] + character["atk"]
                damage = int(damage * random.uniform(0.9, 1.1))

                # 五行相克
                skill_element = Element(skill.get("element", "金"))
                multiplier = get_element_multiplier(skill_element, Element(enemy["element"]))
                damage = int(damage * multiplier)

                enemy["hp"] = max(0, enemy["hp"] - damage)
                player_messages.append(f"使用 {skill_name}，造成 {damage} 点伤害")

                # 尝试施加状态
                status_messages = _try_inflict_status(combat, "enemy", skill_element)
                player_messages.extend(status_messages)
        else:
            player_messages.append(f"未知技能: {skill_name}")

    elif action == "defend":
        # 防御
        character["def"] = int(character["def"] * 1.5)
        player_messages.append("进入防御姿态，防御力提升")

    elif action == "flee":
        # 逃跑
        if random.random() < 0.5:
            combat["finished"] = True
            combat["result"] = "flee"
            player_messages.append("成功逃跑")
            combat["log"].append(player_messages)
            return combat
        else:
            player_messages.append("逃跑失败")

    # 应用玩家状态效果
    player_status = _apply_status_effects(combat, "player")
    player_messages.extend(player_status)

    combat["log"].append(player_messages)

    # 检查敌人是否死亡
    if enemy["hp"] <= 0:
        combat["finished"] = True
        combat["result"] = "win"
        return combat

    # 检查玩家是否死亡
    if character["hp"] <= 0:
        combat["finished"] = True
        combat["result"] = "lose"
        return combat

    # 敌人回合
    enemy_messages = []

    # 敌人攻击
    damage = max(1, enemy["atk"] - character["def"])
    damage = int(damage * random.uniform(0.8, 1.2))
    character["hp"] = max(0, character["hp"] - damage)
    enemy_messages.append(f"敌人攻击造成 {damage} 点伤害")

    # 应用敌人状态效果
    enemy_status = _apply_status_effects(combat, "enemy")
    enemy_messages.extend(enemy_status)

    combat["log"].append(enemy_messages)

    # 检查玩家是否死亡
    if character["hp"] <= 0:
        combat["finished"] = True
        combat["result"] = "lose"

    return combat


def _check_sword_progression(character: dict) -> str:
    """检查剑器进阶"""
    kills = character.get("kills", 0)

    for i, sword in enumerate(SWORD_PROGRESSION):
        if kills >= (i + 1) * 100:
            return sword["name"]

    return SWORD_PROGRESSION[0]["name"]


def apply_combat_result(character: dict, combat: dict) -> dict:
    """应用战斗结果"""
    if combat["result"] == "win":
        enemy = combat["enemy"]

        # 获得经验（简化：直接增加修为）
        character["cultivation"] += enemy["exp"]

        # 获得掉落
        for item, amount in enemy["drops"].items():
            if isinstance(amount, float):
                # 概率掉落
                if random.random() < amount:
                    character["inventory"][item] = character["inventory"].get(item, 0) + 1
            else:
                character["inventory"][item] = character["inventory"].get(item, 0) + amount

        # 增加击杀数
        character["kills"] = character.get("kills", 0) + 1

        # 恢复一些生命和灵力
        character["hp"] = min(character["max_hp"], character["hp"] + int(character["max_hp"] * 0.1))
        character["mp"] = min(character["max_mp"], character["mp"] + int(character["max_mp"] * 0.1))

        combat["reward_message"] = f"获得 {enemy['exp']} 修为，击杀数 +1"

    elif combat["result"] == "lose":
        # 损失一些灵石
        loss = min(character["inventory"].get("灵石", 0), 50)
        character["inventory"]["灵石"] = character["inventory"].get("灵石", 0) - loss

        # 恢复一半生命
        character["hp"] = int(character["max_hp"] * 0.5)
        character["mp"] = int(character["max_mp"] * 0.5)

        combat["reward_message"] = f"战斗失败，损失 {loss} 灵石"

    return character
