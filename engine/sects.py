"""
宗门系统
"""


# 宗门系统
SECT_DB = {
    "青云宗": {
        "name": "青云宗",
        "description": "正道大宗，以剑法著称",
        "required_realm": "筑基",
        "benefits": {"atk_pct": 0.1, "cultivation_speed": 0.1},
        "ranks": ["外门弟子", "内门弟子", "核心弟子", "长老", "掌门"],
        "tasks": [
            {"name": "宗门巡逻", "reward": {"灵石": 50}, "requirement": {"kills": 5}},
            {"name": "采集灵草", "reward": {"灵石": 80, "灵芝": 3}, "requirement": {"collect": {"灵芝": 3}}},
        ],
    },
    "天剑宗": {
        "name": "天剑宗",
        "description": "剑修圣地，剑法精深",
        "required_realm": "结丹",
        "benefits": {"atk_pct": 0.15, "crit_rate": 0.1},
        "ranks": ["剑童", "剑士", "剑师", "剑圣", "剑仙"],
        "tasks": [
            {"name": "剑术切磋", "reward": {"灵石": 100}, "requirement": {"kills": 10}},
            {"name": "寻找剑谱", "reward": {"灵石": 150, "天剑诀": 1}, "requirement": {"collect": {"仙器碎片": 2}}},
        ],
    },
    "丹霞宗": {
        "name": "丹霞宗",
        "description": "炼丹大宗，丹药丰富",
        "required_realm": "筑基",
        "benefits": {"alchemy_mastery": 0.2, "crafting_mastery": 0.2},
        "ranks": ["丹童", "丹师", "丹王", "丹皇", "丹仙"],
        "tasks": [
            {"name": "炼制丹药", "reward": {"灵石": 60, "聚气丹": 5}, "requirement": {"craft": 3}},
            {"name": "收集药材", "reward": {"灵石": 100, "灵芝": 5}, "requirement": {"collect": {"灵芝": 5}}},
        ],
    },
    "玄天宗": {
        "name": "玄天宗",
        "description": "神秘宗门，功法独特",
        "required_realm": "元婴",
        "benefits": {"hp_pct": 0.2, "mp_pct": 0.2, "def_pct": 0.1},
        "ranks": ["玄徒", "玄士", "玄师", "玄圣", "玄仙"],
        "tasks": [
            {"name": "探索秘境", "reward": {"灵石": 200, "天道碎片": 1}, "requirement": {"explore": 3}},
            {"name": "击杀魔物", "reward": {"灵石": 300, "混沌精华": 1}, "requirement": {"kills": 20}},
        ],
    },
}

# 宗门任务
SECT_TASKS = [
    {"name": "宗门巡逻", "desc": "在宗门周围巡逻，击败入侵者", "type": "kill", "count": 3,
     "reward": {"contribution": 50, "灵石": 200}},
    {"name": "采集灵草", "desc": "为宗门采集灵草", "type": "collect", "target": "灵芝", "count": 5,
     "reward": {"contribution": 30, "灵石": 100}},
    {"name": "宗门试炼", "desc": "完成宗门试炼", "type": "explore", "count": 3,
     "reward": {"contribution": 80, "灵石": 300}},
    {"name": "宗门大比", "desc": "在宗门大比中获胜", "type": "kill", "count": 5,
     "reward": {"contribution": 150, "灵石": 500}},
    {"name": "宗门建设", "desc": "捐献灵石建设宗门", "type": "donate", "count": 1000,
     "reward": {"contribution": 100}},
]


def join_sect(character: dict, sect_name: str) -> dict:
    """加入宗门"""
    sect = SECT_DB.get(sect_name)
    if not sect:
        return {"success": False, "message": f"未知宗门: {sect_name}"}

    # 检查是否已有宗门
    if character.get("sect"):
        return {"success": False, "message": f"已经加入了 {character['sect']}，需要先退出"}

    # 检查境界要求
    from .realms import Realm
    current_realm = Realm(character["realm"])
    required_realm = Realm(sect["required_realm"])
    realm_names = ["练气", "筑基", "结丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "飞升"]

    if realm_names.index(current_realm.value) < realm_names.index(required_realm.value):
        return {"success": False, "message": f"需要达到 {sect['required_realm']} 境界"}

    # 加入宗门
    character["sect"] = sect_name
    character["sect_rank"] = sect["ranks"][0]  # 最低职位

    # 应用宗门加成
    for stat, value in sect["benefits"].items():
        if stat.endswith("_pct"):
            base_stat = stat.replace("_pct", "")
            character[base_stat] = int(character.get(base_stat, 0) * (1 + value))
        else:
            character[stat] = character.get(stat, 0) + value

    return {"success": True, "message": f"加入了 {sect_name}，职位: {sect['ranks'][0]}"}


def leave_sect(character: dict) -> dict:
    """退出宗门"""
    if not character.get("sect"):
        return {"success": False, "message": "还没有加入任何宗门"}

    sect_name = character["sect"]
    sect = SECT_DB.get(sect_name)

    # 移除宗门加成
    if sect:
        for stat, value in sect["benefits"].items():
            if stat.endswith("_pct"):
                base_stat = stat.replace("_pct", "")
                character[base_stat] = int(character.get(base_stat, 0) / (1 + value))
            else:
                character[stat] = max(0, character.get(stat, 0) - value)

    character["sect"] = None
    character["sect_rank"] = None

    return {"success": True, "message": f"退出了 {sect_name}"}


def get_sect_info(character: dict) -> dict:
    """获取宗门信息"""
    sect_name = character.get("sect")
    if not sect_name:
        return {"success": False, "message": "还没有加入任何宗门"}

    sect = SECT_DB.get(sect_name)
    if not sect:
        return {"success": False, "message": f"未知宗门: {sect_name}"}

    return {
        "success": True,
        "sect": {
            "name": sect["name"],
            "description": sect["description"],
            "rank": character.get("sect_rank", "无"),
            "ranks": sect["ranks"],
            "tasks": sect["tasks"],
            "benefits": sect["benefits"],
        },
    }
