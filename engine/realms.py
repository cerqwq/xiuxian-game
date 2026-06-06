"""
境界系统
"""
from enum import Enum


class Realm(Enum):
    LIANQI = "练气"
    ZHUJI = "筑基"
    JIEDAN = "结丹"
    YUANYING = "元婴"
    HUASHEN = "化神"
    LIANXU = "炼虚"
    HETI = "合体"
    DACHENG = "大乘"
    DUJIE = "渡劫"
    FEISHENG = "飞升"


REALM_ORDER = [Realm.LIANQI, Realm.ZHUJI, Realm.JIEDAN, Realm.YUANYING, Realm.HUASHEN, Realm.LIANXU, Realm.HETI, Realm.DACHENG, Realm.DUJIE, Realm.FEISHENG]


REALM_DATA = {
    Realm.LIANQI: {
        "name": "练气",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 180,
        "base_cultivation_speed": 1.0,
        "breakthrough_base_rate": 0.85,
        "breakthrough_materials": {"灵石": 50, "聚气丹": 1},
        "description": "感应天地灵气，引气入体",
    },
    Realm.ZHUJI: {
        "name": "筑基",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 350,
        "base_cultivation_speed": 0.8,
        "breakthrough_base_rate": 0.65,
        "breakthrough_materials": {"灵石": 200, "筑基丹": 2, "灵芝": 1},
        "description": "凝聚真元，筑就道基",
    },
    Realm.JIEDAN: {
        "name": "结丹",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 600,
        "base_cultivation_speed": 0.6,
        "breakthrough_base_rate": 0.50,
        "breakthrough_materials": {"灵石": 500, "金丹丹": 3, "千年灵芝": 1, "天雷珠": 1},
        "description": "真元凝聚成丹，金丹大道",
    },
    Realm.YUANYING: {
        "name": "元婴",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 1000,
        "base_cultivation_speed": 0.45,
        "breakthrough_base_rate": 0.35,
        "breakthrough_materials": {"灵石": 2000, "元婴丹": 5, "天材地宝": 3},
        "description": "金丹化婴，元神出窍",
    },
    Realm.HUASHEN: {
        "name": "化神",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 2500,
        "base_cultivation_speed": 0.35,
        "breakthrough_base_rate": 0.25,
        "breakthrough_materials": {"灵石": 10000, "化神丹": 10, "仙器碎片": 5},
        "description": "元婴化神，掌控天地",
    },
    Realm.LIANXU: {
        "name": "炼虚",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 5000,
        "base_cultivation_speed": 0.28,
        "breakthrough_base_rate": 0.20,
        "breakthrough_materials": {"灵石": 50000, "炼虚丹": 15, "天道碎片": 3, "仙器碎片": 10},
        "description": "炼化虚空，合道天地",
    },
    Realm.HETI: {
        "name": "合体",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 10000,
        "base_cultivation_speed": 0.22,
        "breakthrough_base_rate": 0.15,
        "breakthrough_materials": {"灵石": 200000, "合体丹": 20, "天道碎片": 8, "混沌精华": 2},
        "description": "肉身与元神合一，天人合一",
    },
    Realm.DACHENG: {
        "name": "大乘",
        "stages": ["初期", "中期", "后期", "圆满"],
        "max_lifespan": 20000,
        "base_cultivation_speed": 0.18,
        "breakthrough_base_rate": 0.12,
        "breakthrough_materials": {"灵石": 500000, "大乘丹": 30, "天道碎片": 15, "混沌精华": 5, "造化玉碟": 1},
        "description": "大道圆满，功德无量",
    },
    Realm.DUJIE: {
        "name": "渡劫",
        "stages": ["一重天劫", "二重天劫", "三重天劫", "九重天劫"],
        "max_lifespan": 50000,
        "base_cultivation_speed": 0.15,
        "breakthrough_base_rate": 0.10,
        "breakthrough_materials": {"灵石": 1000000, "渡劫丹": 50, "天道碎片": 30, "混沌精华": 10, "造化玉碟": 3},
        "description": "承受天劫洗礼，超脱凡尘",
    },
    Realm.FEISHENG: {
        "name": "飞升",
        "stages": ["仙人", "真仙", "金仙", "大罗金仙"],
        "max_lifespan": -1,
        "base_cultivation_speed": 0.12,
        "breakthrough_base_rate": 0.08,
        "breakthrough_materials": {},
        "description": "飞升仙界，长生不老",
    },
}


def get_realm_full_name(realm: Realm, stage_index: int) -> str:
    data = REALM_DATA[realm]
    return f"{data['name']}{data['stages'][stage_index]}"
