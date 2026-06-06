"""
世界BOSS系统
"""
import random
import time


# 世界BOSS系统
WORLD_BOSS_DB = {
    "妖皇": {
        "name": "妖皇",
        "description": "万妖之皇，实力恐怖",
        "hp": 100000,
        "atk": 500,
        "def": 200,
        "element": "火",
        "required_realm": "化神",
        "rewards": {
            "damage_rewards": {
                1000: {"灵石": 1000, "天道碎片": 1},
                5000: {"灵石": 3000, "天道碎片": 3, "混沌精华": 1},
                10000: {"灵石": 5000, "天道碎片": 5, "混沌精华": 3},
                50000: {"灵石": 10000, "造化玉碟": 1},
            },
            "kill_reward": {"灵石": 20000, "天道碎片": 10, "混沌精华": 5, "造化玉碟": 2},
        },
    },
    "魔尊": {
        "name": "魔尊",
        "description": "魔界至尊，魔气冲天",
        "hp": 200000,
        "atk": 800,
        "def": 300,
        "element": "暗",
        "required_realm": "大乘",
        "rewards": {
            "damage_rewards": {
                2000: {"灵石": 2000, "天道碎片": 2},
                10000: {"灵石": 5000, "天道碎片": 5, "混沌精华": 2},
                20000: {"灵石": 10000, "天道碎片": 8, "混沌精华": 5},
                100000: {"灵石": 30000, "造化玉碟": 3},
            },
            "kill_reward": {"灵石": 50000, "天道碎片": 20, "混沌精华": 10, "造化玉碟": 5},
        },
    },
}


def get_world_boss() -> dict:
    """获取当前世界BOSS"""
    # 简单实现：返回固定的BOSS
    boss_name = "妖皇"
    boss_data = WORLD_BOSS_DB[boss_name]

    # 随机剩余血量（模拟）
    current_hp = random.randint(int(boss_data["hp"] * 0.3), boss_data["hp"])

    return {
        "name": boss_name,
        "description": boss_data["description"],
        "current_hp": current_hp,
        "max_hp": boss_data["hp"],
        "element": boss_data["element"],
        "required_realm": boss_data["required_realm"],
    }


def attack_world_boss(character: dict, boss: dict) -> dict:
    """攻击世界BOSS"""
    boss_data = WORLD_BOSS_DB.get(boss["name"])
    if not boss_data:
        return {"success": False, "message": "未知BOSS"}

    # 检查境界要求
    from .realms import Realm
    current_realm = Realm(character["realm"])
    required_realm = Realm(boss_data["required_realm"])
    realm_names = ["练气", "筑基", "结丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫", "飞升"]

    if realm_names.index(current_realm.value) < realm_names.index(required_realm.value):
        return {"success": False, "message": f"需要达到 {boss_data['required_realm']} 境界"}

    # 计算伤害
    base_damage = character["atk"] - boss_data["def"] // 2
    damage = max(1, base_damage + random.randint(-10, 10))

    # 更新BOSS血量
    boss["current_hp"] = max(0, boss["current_hp"] - damage)

    # 记录伤害
    character["world_boss_damage"] = character.get("world_boss_damage", 0) + damage

    # 检查奖励
    rewards = {}
    damage_rewards = boss_data["rewards"]["damage_rewards"]
    for threshold, reward in damage_rewards.items():
        if character["world_boss_damage"] >= threshold:
            rewards.update(reward)

    # 检查是否击杀
    killed = boss["current_hp"] <= 0
    if killed:
        rewards.update(boss_data["rewards"]["kill_reward"])

    # 发放奖励
    for item, amount in rewards.items():
        character["inventory"][item] = character["inventory"].get(item, 0) + amount

    return {
        "success": True,
        "damage": damage,
        "total_damage": character["world_boss_damage"],
        "boss_hp": boss["current_hp"],
        "boss_max_hp": boss["max_hp"],
        "killed": killed,
        "rewards": rewards,
    }
