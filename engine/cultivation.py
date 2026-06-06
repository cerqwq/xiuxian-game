"""
修炼和突破系统
"""
import random
from .realms import Realm, REALM_DATA, REALM_ORDER


def cultivate(character: dict) -> dict:
    """修炼一次"""
    realm = Realm(character["realm"])
    realm_data = REALM_DATA[realm]

    # 基础修炼速度
    speed = realm_data["base_cultivation_speed"]

    # 悟性加成
    speed *= (1 + character["stats"]["悟性"] * 0.05)

    # 气运加成（随机）
    if random.random() < character["stats"]["气运"] * 0.02:
        speed *= 2
        character["last_cultivation"] = "顿悟！修炼速度翻倍"

    # 年龄影响
    age = character.get("age", 16)
    if age > 100:
        speed *= 0.9

    # 增加修为
    cultivation_gain = int(speed * 10)
    character["cultivation"] += cultivation_gain

    # 增加年龄
    character["age"] = character.get("age", 16) + 1

    return character


def check_idle_cultivation(character: dict) -> dict:
    """检查挂机修炼"""
    import time

    last_cultivate_time = character.get("last_cultivate_time")
    if not last_cultivate_time:
        character["last_cultivate_time"] = time.time()
        return character

    current_time = time.time()
    elapsed_seconds = current_time - last_cultivate_time

    # 每30秒算一次修炼
    if elapsed_seconds >= 30:
        cultivate_count = int(elapsed_seconds / 30)
        realm = Realm(character["realm"])
        realm_data = REALM_DATA[realm]
        speed = realm_data["base_cultivation_speed"]
        speed *= (1 + character["stats"]["悟性"] * 0.05)

        total_gain = int(speed * 10 * cultivate_count)
        character["cultivation"] += total_gain
        character["age"] = character.get("age", 16) + cultivate_count

        if cultivate_count > 0:
            character["idle_cultivation_gain"] = total_gain

    character["last_cultivate_time"] = current_time
    return character


def attempt_breakthrough(character: dict, use_items: list = None) -> dict:
    """尝试突破到下一个境界"""
    realm = Realm(character["realm"])
    realm_data = REALM_DATA[realm]

    # 检查是否已经是最高境界
    if realm == Realm.FEISHENG:
        character["breakthrough_result"] = {
            "success": False,
            "message": "已达最高境界，无法继续突破"
        }
        return character

    # 获取下一个境界
    current_index = REALM_ORDER.index(realm)
    next_realm = REALM_ORDER[current_index + 1]
    next_realm_data = REALM_DATA[next_realm]

    # 检查修为是否足够（需要当前境界的最大修为）
    required_cultivation = realm_data.get("max_cultivation", 1000)
    if character["cultivation"] < required_cultivation:
        character["breakthrough_result"] = {
            "success": False,
            "message": f"修为不足，需要 {required_cultivation} 点修为"
        }
        return character

    # 计算突破概率
    base_rate = realm_data["breakthrough_base_rate"]

    # 悟性加成
    wuxing_bonus = character["stats"]["悟性"] * 0.02

    # 气运加成
    qiyun_bonus = character["stats"]["气运"] * 0.01

    # 使用物品加成
    item_bonus = 0
    if use_items:
        for item_name in use_items:
            from .items import ITEM_DB
            item = ITEM_DB.get(item_name)
            if item and "effect" in item and "breakthrough_rate" in item["effect"]:
                item_bonus += item["effect"]["breakthrough_rate"]

    # 最终成功率
    final_rate = min(0.95, base_rate + wuxing_bonus + qiyun_bonus + item_bonus)

    # 尝试突破
    if random.random() < final_rate:
        # 突破成功
        character["realm"] = next_realm.value
        character["stage"] = 0
        character["cultivation"] = 0

        # 属性提升
        hp_increase = next_realm_data.get("hp_increase", 50)
        mp_increase = next_realm_data.get("mp_increase", 25)
        atk_increase = next_realm_data.get("atk_increase", 10)
        def_increase = next_realm_data.get("def_increase", 5)

        character["max_hp"] += hp_increase
        character["hp"] = character["max_hp"]
        character["max_mp"] += mp_increase
        character["mp"] = character["max_mp"]
        character["atk"] += atk_increase
        character["def"] += def_increase

        character["breakthrough_result"] = {
            "success": True,
            "message": f"突破成功！晋升为{next_realm_data['name']}",
            "new_realm": next_realm.value,
            "new_stage": 0,
        }
    else:
        # 突破失败
        # 损失一些修为
        loss = int(character["cultivation"] * 0.1)
        character["cultivation"] = max(0, character["cultivation"] - loss)

        character["breakthrough_result"] = {
            "success": False,
            "message": f"突破失败，损失 {loss} 点修为",
            "loss": loss,
        }

    return character


def attempt_ascension(character: dict) -> dict:
    """尝试飞升"""
    realm = Realm(character["realm"])

    # 检查是否达到渡劫境界
    if realm != Realm.DUJIE:
        character["ascension_result"] = {
            "success": False,
            "message": "必须达到渡劫境界才能尝试飞升"
        }
        return character

    # 检查修为
    required_cultivation = 1000000
    if character["cultivation"] < required_cultivation:
        character["ascension_result"] = {
            "success": False,
            "message": f"修为不足，需要 {required_cultivation} 点修为"
        }
        return character

    # 飞升概率（非常低）
    base_rate = 0.01

    # 悟性加成
    wuxing_bonus = character["stats"]["悟性"] * 0.005

    # 气运加成
    qiyun_bonus = character["stats"]["气运"] * 0.003

    # 最终成功率
    final_rate = min(0.1, base_rate + wuxing_bonus + qiyun_bonus)

    # 尝试飞升
    if random.random() < final_rate:
        # 飞升成功
        character["realm"] = Realm.FEISHENG.value
        character["stage"] = 0
        character["cultivation"] = 0
        character["max_lifespan"] = -1  # 长生不老

        character["ascension_result"] = {
            "success": True,
            "message": "飞升成功！你已飞升仙界，长生不老！",
            "new_realm": Realm.FEISHENG.value,
        }
    else:
        # 飞升失败
        # 严重惩罚
        loss = int(character["cultivation"] * 0.5)
        character["cultivation"] = max(0, character["cultivation"] - loss)

        # 可能受伤
        damage = int(character["max_hp"] * 0.3)
        character["hp"] = max(1, character["hp"] - damage)

        character["ascension_result"] = {
            "success": False,
            "message": f"飞升失败，遭受天劫反噬，损失 {loss} 修为和 {damage} 生命",
            "loss": loss,
            "damage": damage,
        }

    return character
