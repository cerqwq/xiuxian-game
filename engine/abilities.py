"""
神通/技能系统（主动攻击技能）
"""
from .elements import Element


# 神通系统（主动攻击技能）
ABILITY_DB = {
    "基础剑法": {
        "name": "基础剑法",
        "description": "基础的剑术攻击",
        "damage": 10,
        "mp_cost": 5,
        "element": "金",
        "price": 0,
        "required_realm": "练气",
    },
    "烈火剑": {
        "name": "烈火剑",
        "description": "火系剑术攻击",
        "damage": 25,
        "mp_cost": 15,
        "element": "火",
        "price": 200,
        "required_realm": "筑基",
    },
    "寒冰诀": {
        "name": "寒冰诀",
        "description": "冰系法术攻击",
        "damage": 30,
        "mp_cost": 20,
        "element": "水",
        "price": 250,
        "required_realm": "筑基",
    },
    "雷霆术": {
        "name": "雷霆术",
        "description": "雷系法术攻击",
        "damage": 40,
        "mp_cost": 25,
        "element": "金",
        "price": 400,
        "required_realm": "结丹",
    },
    "土遁术": {
        "name": "土遁术",
        "description": "土系法术攻击",
        "damage": 35,
        "mp_cost": 20,
        "element": "土",
        "price": 350,
        "required_realm": "结丹",
    },
    "木遁术": {
        "name": "木遁术",
        "description": "木系法术攻击",
        "damage": 35,
        "mp_cost": 20,
        "element": "木",
        "price": 350,
        "required_realm": "结丹",
    },
    "天罡剑气": {
        "name": "天罡剑气",
        "description": "天罡剑气攻击",
        "damage": 60,
        "mp_cost": 40,
        "element": "金",
        "price": 800,
        "required_realm": "元婴",
    },
    "地煞魔功": {
        "name": "地煞魔功",
        "description": "地煞魔功攻击",
        "damage": 70,
        "mp_cost": 45,
        "element": "土",
        "price": 900,
        "required_realm": "元婴",
    },
    "焚天烈焰": {
        "name": "焚天烈焰",
        "description": "焚天烈焰攻击",
        "damage": 80,
        "mp_cost": 50,
        "element": "火",
        "price": 1200,
        "required_realm": "化神",
    },
    "冰封万里": {
        "name": "冰封万里",
        "description": "冰封万里攻击",
        "damage": 85,
        "mp_cost": 55,
        "element": "水",
        "price": 1300,
        "required_realm": "化神",
    },
    "万剑归宗": {
        "name": "万剑归宗",
        "description": "万剑归宗攻击",
        "damage": 100,
        "mp_cost": 70,
        "element": "金",
        "price": 2000,
        "required_realm": "炼虚",
    },
    "混沌神雷": {
        "name": "混沌神雷",
        "description": "混沌神雷攻击",
        "damage": 120,
        "mp_cost": 80,
        "element": "金",
        "price": 3000,
        "required_realm": "合体",
    },
}

# 技能系统（战斗主动技能）
SKILL_DB = {
    # ── 剑法进阶（免费，随使用升级）──
    "基础剑法":     {"element": Element.METAL, "damage": 15, "cost": 0, "atk_mult": 0.3, "is_sword": True, "sword_tier": 1, "desc": "基础剑法，随使用提升", "price": 0},
    "入门剑法":     {"element": Element.METAL, "damage": 25, "cost": 0, "atk_mult": 0.4, "is_sword": True, "sword_tier": 2, "desc": "入门级剑法", "price": 0},
    "熟练剑法":     {"element": Element.METAL, "damage": 40, "cost": 0, "atk_mult": 0.5, "is_sword": True, "sword_tier": 3, "desc": "熟练的剑法", "price": 0},
    "登堂入室-剑法": {"element": Element.METAL, "damage": 60, "cost": 0, "atk_mult": 0.6, "is_sword": True, "sword_tier": 4, "desc": "登堂入室之境", "price": 0},
    "出神入化-剑法": {"element": Element.METAL, "damage": 85, "cost": 0, "atk_mult": 0.8, "is_sword": True, "sword_tier": 5, "desc": "出神入化之境", "price": 0},
    # ── 金属性技能 ──
    "金刃术":   {"element": Element.METAL, "damage": 18, "cost": 12, "atk_mult": 0.3, "desc": "金属性基础法术", "price": 100},
    "天罡剑诀": {"element": Element.METAL, "damage": 45, "cost": 30, "atk_mult": 0.5, "desc": "金属性高级剑法", "price": 500},
    "金虹贯日": {"element": Element.METAL, "damage": 70, "cost": 50, "atk_mult": 0.7, "desc": "金属性进阶法术", "price": 1200},
    # ── 木属性技能 ──
    "木刺术":     {"element": Element.WOOD, "damage": 16, "cost": 10, "atk_mult": 0.3, "desc": "木属性基础法术", "price": 100},
    "回春术":     {"element": Element.WOOD, "damage": -40, "cost": 20, "atk_mult": 0, "desc": "木属性恢复技能", "price": 150},
    "万叶飞花":   {"element": Element.WOOD, "damage": 50, "cost": 35, "atk_mult": 0.5, "desc": "木属性进阶法术", "price": 500},
    "青木长生诀": {"element": Element.WOOD, "damage": -80, "cost": 45, "atk_mult": 0, "desc": "木属性高级恢复", "price": 1000},
    # ── 水属性技能 ──
    "水弹术":   {"element": Element.WATER, "damage": 18, "cost": 12, "atk_mult": 0.3, "desc": "水属性基础法术", "price": 100},
    "玄冰诀":   {"element": Element.WATER, "damage": 48, "cost": 32, "atk_mult": 0.5, "desc": "水属性冰系法术", "price": 500},
    "寒潮涌动": {"element": Element.WATER, "damage": 72, "cost": 52, "atk_mult": 0.7, "desc": "水属性进阶法术", "price": 1200},
    # ── 火属性技能 ──
    "火球术":   {"element": Element.FIRE, "damage": 22, "cost": 15, "atk_mult": 0.3, "desc": "火属性基础法术", "price": 100},
    "五雷正法": {"element": Element.FIRE, "damage": 55, "cost": 38, "atk_mult": 0.5, "desc": "火属性雷法", "price": 500},
    "赤焰焚天": {"element": Element.FIRE, "damage": 78, "cost": 55, "atk_mult": 0.7, "desc": "火属性进阶法术", "price": 1200},
    # ── 土属性技能 ──
    "落石术":   {"element": Element.EARTH, "damage": 20, "cost": 14, "atk_mult": 0.3, "desc": "土属性基础法术", "price": 100},
    "厚土盾":   {"element": Element.EARTH, "damage": 0, "cost": 18, "atk_mult": 0, "desc": "土属性防御技能，本回合防御翻倍", "price": 150},
    "碎岩掌":   {"element": Element.EARTH, "damage": 52, "cost": 35, "atk_mult": 0.5, "desc": "土属性进阶掌法", "price": 500},
    "山崩地裂": {"element": Element.EARTH, "damage": 80, "cost": 58, "atk_mult": 0.7, "desc": "土属性高级法术", "price": 1200},
    # ── 高阶金属性 ──
    "万剑归宗": {"element": Element.METAL, "damage": 120, "cost": 80, "atk_mult": 0.9, "desc": "金属性顶级剑法", "price": 5000},
    "诛仙剑阵": {"element": Element.METAL, "damage": 180, "cost": 120, "atk_mult": 1.2, "desc": "金属性仙级剑阵", "price": 0},
    # ── 高阶木属性 ──
    "万木归春": {"element": Element.WOOD, "damage": -200, "cost": 80, "atk_mult": 0, "desc": "木属性顶级恢复", "price": 5000},
    "生命之树": {"element": Element.WOOD, "damage": 100, "cost": 70, "atk_mult": 0.8, "desc": "木属性仙级法术", "price": 0},
    # ── 高阶水属性 ──
    "北冥神功": {"element": Element.WATER, "damage": 150, "cost": 100, "atk_mult": 1.0, "desc": "水属性顶级法术", "price": 5000},
    "沧海桑田": {"element": Element.WATER, "damage": 200, "cost": 130, "atk_mult": 1.2, "desc": "水属性仙级法术", "price": 0},
    # ── 高阶火属性 ──
    "天火焚世": {"element": Element.FIRE, "damage": 160, "cost": 110, "atk_mult": 1.0, "desc": "火属性顶级法术", "price": 5000},
    "焚天大道": {"element": Element.FIRE, "damage": 220, "cost": 140, "atk_mult": 1.3, "desc": "火属性仙级法术", "price": 0},
    # ── 高阶土属性 ──
    "乾坤一掷": {"element": Element.EARTH, "damage": 140, "cost": 90, "atk_mult": 0.9, "desc": "土属性顶级法术", "price": 5000},
    "混沌破灭": {"element": Element.EARTH, "damage": 190, "cost": 125, "atk_mult": 1.1, "desc": "土属性仙级法术", "price": 0},
    # ── 混合属性 ──
    "五行轮转": {"element": Element.FIRE, "damage": 170, "cost": 100, "atk_mult": 1.0, "desc": "五行合一，威力倍增", "price": 0},
    "天地同寿": {"element": Element.EARTH, "damage": 250, "cost": 150, "atk_mult": 1.5, "desc": "以命换命的终极法术", "price": 0},
    "造化之力": {"element": Element.WOOD, "damage": -300, "cost": 120, "atk_mult": 0, "desc": "造化之力，起死回生", "price": 0},
}


def learn_ability(character: dict, ability_name: str) -> dict:
    """学习神通"""
    ability = ABILITY_DB.get(ability_name)
    if not ability:
        return {"success": False, "message": f"未知神通: {ability_name}"}

    # 检查是否已学习
    if ability_name in character.get("abilities", []):
        return {"success": False, "message": f"已经学会了 {ability_name}"}

    # 检查境界要求
    from .realms import Realm
    current_realm = Realm(character["realm"])
    required_realm = Realm(ability["required_realm"])
    realm_names = ["练气", "筑基", "结丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "飞升"]

    if realm_names.index(current_realm.value) < realm_names.index(required_realm.value):
        return {"success": False, "message": f"需要达到 {ability['required_realm']} 境界"}

    # 学习神通
    character.setdefault("abilities", []).append(ability_name)

    return {"success": True, "message": f"学会了 {ability_name}"}


def buy_skill(character: dict, npc_name: str, skill_name: str) -> dict:
    """购买技能"""
    from .npc import NPC_DB

    npc = NPC_DB.get(npc_name)
    if not npc:
        return {"success": False, "message": f"未知NPC: {npc_name}"}

    if not npc.get("shop") or skill_name not in npc["shop"]:
        return {"success": False, "message": f"{npc_name} 不卖 {skill_name}"}

    ability = ABILITY_DB.get(skill_name)
    if not ability:
        return {"success": False, "message": f"未知技能: {skill_name}"}

    price = npc["shop"][skill_name]

    # 检查灵石
    current_coins = character["inventory"].get("灵石", 0)
    if current_coins < price:
        return {"success": False, "message": f"灵石不足，需要 {price} 灵石"}

    # 检查是否已学习
    if skill_name in character.get("abilities", []):
        return {"success": False, "message": f"已经学会了 {skill_name}"}

    # 购买并学习
    character["inventory"]["灵石"] = current_coins - price
    character.setdefault("abilities", []).append(skill_name)

    return {
        "success": True,
        "message": f"购买并学会了 {skill_name}，花费 {price} 灵石",
        "ability": skill_name,
        "price": price,
    }
