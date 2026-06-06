"""
角色创建和管理
"""
import random
from .realms import Realm, REALM_DATA
from .elements import Element, compute_element_bonuses


def _roll_stats() -> dict:
    """随机生成角色属性"""
    stats = {
        "根骨": random.randint(1, 10),
        "悟性": random.randint(1, 10),
        "气运": random.randint(1, 10),
        "魅力": random.randint(1, 10),
    }
    return stats


def _roll_elements() -> list:
    """随机生成灵根（1-5种五行）"""
    elements = list(Element)
    count = random.choices([1, 2, 3, 4, 5], weights=[40, 30, 20, 8, 2])[0]
    return [e.value for e in random.sample(elements, count)]


def roll_dice() -> dict:
    """掷骰子生成角色初始属性"""
    return {
        "stats": _roll_stats(),
        "elements": _roll_elements(),
    }


def create_character(name: str, elements: list, stats: dict = None) -> dict:
    """创建新角色"""
    if stats is None:
        stats = _roll_stats()

    # 计算五行加成
    element_bonuses = compute_element_bonuses(elements)

    # 基础属性
    base_hp = 100 + stats["根骨"] * 10
    base_mp = 50 + stats["悟性"] * 5
    base_atk = 10 + stats["根骨"] * 2
    base_def = 5 + stats["根骨"] * 1

    # 应用五行加成
    max_hp = int(base_hp * (1 + element_bonuses["hp_pct"] / 100))
    max_mp = int(base_mp * (1 + element_bonuses["mp_pct"] / 100))
    atk = int(base_atk * (1 + element_bonuses["atk_pct"] / 100))
    defense = int(base_def * (1 + element_bonuses["def_pct"] / 100))

    character = {
        "name": name,
        "realm": Realm.LIANQI.value,
        "stage": 0,
        "cultivation": 0,
        "elements": elements,
        "stats": stats,
        "element_bonuses": element_bonuses,
        "max_hp": max_hp,
        "hp": max_hp,
        "max_mp": max_mp,
        "mp": max_mp,
        "atk": atk,
        "def": defense,
        "inventory": {"灵石": 100, "聚气丹": 3, "回春丹": 2},
        "equipment": {"weapon": None, "armor": None, "accessory": None},
        "skills": ["基础剑法"],
        "techniques": [],
        "abilities": [],
        "quests": [],
        "achievements": [],
        "sect": None,
        "pets": [],
        "reputation": 0,
        "age": 16,
        "alive": True,
        "rebirth_count": 0,
        "rebirth_bonuses": {},
        "kills": 0,
        "explored_regions": ["新手村"],
        "current_region": "新手村",
        "dungeon_progress": {},
        "world_boss_damage": 0,
        "alchemy_mastery": 0,
        "crafting_mastery": 0,
    }

    return character


def migrate_character(character: dict) -> dict:
    """迁移旧存档，添加新字段"""
    # 确保所有必要的字段都存在
    defaults = {
        "reputation": 0,
        "age": 16,
        "alive": True,
        "rebirth_count": 0,
        "rebirth_bonuses": {},
        "kills": 0,
        "explored_regions": ["新手村"],
        "current_region": "新手村",
        "dungeon_progress": {},
        "world_boss_damage": 0,
        "alchemy_mastery": 0,
        "crafting_mastery": 0,
        "pets": [],
        "sect": None,
        "achievements": [],
        "quests": [],
        "techniques": [],
        "abilities": [],
        "skills": ["基础剑法"],
        "equipment": {"weapon": None, "armor": None, "accessory": None},
        "element_bonuses": compute_element_bonuses(character.get("elements", [])),
    }

    for key, default_value in defaults.items():
        if key not in character:
            character[key] = default_value

    # 确保境界是字符串格式
    realm = character.get("realm")
    if isinstance(realm, Realm):
        character["realm"] = realm.value

    return character


def get_character_summary(character: dict) -> dict:
    """获取角色摘要"""
    from .realms import Realm, REALM_DATA, get_realm_full_name

    realm = Realm(character["realm"])
    realm_data = REALM_DATA[realm]
    stage_name = realm_data["stages"][character["stage"]]

    return {
        "name": character["name"],
        "realm": get_realm_full_name(realm, character["stage"]),
        "hp": f"{character['hp']}/{character['max_hp']}",
        "mp": f"{character['mp']}/{character['max_mp']}",
        "atk": character["atk"],
        "def": character["def"],
        "elements": character["elements"],
        "stats": character["stats"],
        "sect": character.get("sect", "无"),
        "age": character.get("age", 0),
        "kills": character.get("kills", 0),
        "reputation": character.get("reputation", 0),
    }
