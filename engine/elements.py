"""
五行系统
"""
from enum import Enum


class Element(Enum):
    METAL = "金"
    WOOD = "木"
    WATER = "水"
    FIRE = "火"
    EARTH = "土"


ELEMENT_ADVANTAGE = {
    Element.METAL: Element.WOOD,
    Element.WOOD: Element.EARTH,
    Element.EARTH: Element.WATER,
    Element.WATER: Element.FIRE,
    Element.FIRE: Element.METAL,
}


def get_element_multiplier(attacker: Element, defender: Element) -> float:
    if ELEMENT_ADVANTAGE.get(attacker) == defender:
        return 1.5
    if ELEMENT_ADVANTAGE.get(defender) == attacker:
        return 0.7
    return 1.0


# 相生关系 (Generating cycle): 金生水, 水生木, 木生火, 火生土, 土生金
ELEMENT_GENERATING = {
    Element.METAL: Element.WATER,
    Element.WATER: Element.WOOD,
    Element.WOOD: Element.FIRE,
    Element.FIRE: Element.EARTH,
    Element.EARTH: Element.METAL,
}


# 相克关系 (Overcoming cycle): 金克木, 木克土, 土克水, 水克火, 火克金
ELEMENT_OVERCOMING = {
    Element.METAL: Element.WOOD,
    Element.WOOD: Element.EARTH,
    Element.EARTH: Element.WATER,
    Element.WATER: Element.FIRE,
    Element.FIRE: Element.METAL,
}


# 灵根被动加成 (%)
ELEMENT_PASSIVE = {
    Element.METAL: {"atk_pct": 5},
    Element.WOOD:  {"hp_pct": 5},
    Element.WATER: {"mp_pct": 5},
    Element.FIRE:  {"hp_pct": 2.5, "atk_pct": 2.5},
    Element.EARTH: {"def_pct": 5},
}


def compute_element_bonuses(elements: list) -> dict:
    """计算灵根被动加成，相生翻倍，相克减半；五灵根全属性+15%"""
    total = {"hp_pct": 0, "mp_pct": 0, "atk_pct": 0, "def_pct": 0}
    # 五灵根：五行齐聚，跳过相克惩罚，全属性+15%
    if len(elements) >= 5:
        return {"hp_pct": 15, "mp_pct": 15, "atk_pct": 15, "def_pct": 15}
    elem_enums = [Element(e) for e in elements]
    for elem in elem_enums:
        base = {"hp_pct": 0, "mp_pct": 0, "atk_pct": 0, "def_pct": 0}
        base.update(ELEMENT_PASSIVE[elem])
        for other in elem_enums:
            if other == elem:
                continue
            if ELEMENT_GENERATING.get(elem) == other:
                for k in base:
                    base[k] *= 2
                break
            if ELEMENT_OVERCOMING.get(elem) == other:
                for k in base:
                    base[k] *= 0.5
                break
        for k in total:
            total[k] += base[k]
    return total


def character_elements(character: dict) -> list:
    """获取角色的灵根列表"""
    return character.get("elements", [])


def has_element(character: dict, element_str: str) -> bool:
    """检查角色是否拥有指定灵根"""
    return element_str in character_elements(character)


def _best_element_multiplier(attacker_elements, defender_element: str) -> float:
    """计算攻击者灵根对防御者灵根的最佳倍率"""
    from .elements import Element, get_element_multiplier
    best = 1.0
    for elem_str in attacker_elements:
        try:
            elem = Element(elem_str)
            mult = get_element_multiplier(elem, Element(defender_element))
            best = max(best, mult)
        except ValueError:
            continue
    return best
