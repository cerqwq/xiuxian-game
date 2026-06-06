"""
拍卖行系统
"""
import random


# 拍卖行系统
AUCTION_HOUSE = {
    "refresh_interval": 3600,  # 1小时刷新一次
    "items": [
        {"name": "聚气丹", "price": 25, "stock": 10},
        {"name": "回春丹", "price": 35, "stock": 8},
        {"name": "灵芝", "price": 90, "stock": 5},
        {"name": "千年灵芝", "price": 550, "stock": 3},
        {"name": "铁剑", "price": 55, "stock": 5},
        {"name": "灵剑", "price": 320, "stock": 3},
        {"name": "布衣", "price": 35, "stock": 5},
        {"name": "灵甲", "price": 270, "stock": 3},
    ],
    "last_refresh": 0,
}


def refresh_auction() -> list:
    """刷新拍卖行"""
    import time

    current_time = time.time()
    AUCTION_HOUSE["last_refresh"] = current_time

    # 随机生成拍卖物品
    from .items import ITEM_DB
    all_items = list(ITEM_DB.keys())
    random_items = random.sample(all_items, min(10, len(all_items)))

    auction_items = []
    for item_name in random_items:
        item_data = ITEM_DB[item_name]
        price = int(item_data.get("price", 100) * random.uniform(0.8, 1.2))
        stock = random.randint(1, 5)

        auction_items.append({
            "name": item_name,
            "price": price,
            "stock": stock,
            "rarity": item_data.get("rarity", "凡品"),
        })

    AUCTION_HOUSE["items"] = auction_items
    return auction_items


def buy_auction(character: dict, item_name: str, price: int) -> dict:
    """从拍卖行购买物品"""
    # 查找物品
    item = None
    for auction_item in AUCTION_HOUSE["items"]:
        if auction_item["name"] == item_name and auction_item["price"] == price:
            item = auction_item
            break

    if not item:
        return {"success": False, "message": "物品不存在或价格已变"}

    # 检查库存
    if item["stock"] <= 0:
        return {"success": False, "message": "物品已售罄"}

    # 检查灵石
    current_coins = character["inventory"].get("灵石", 0)
    if current_coins < price:
        return {"success": False, "message": f"灵石不足，需要 {price} 灵石"}

    # 购买
    character["inventory"]["灵石"] = current_coins - price
    character["inventory"][item_name] = character["inventory"].get(item_name, 0) + 1

    # 减少库存
    item["stock"] -= 1

    return {
        "success": True,
        "message": f"购买了 {item_name}，花费 {price} 灵石",
        "item": item_name,
        "price": price,
    }


def sell_auction(character: dict, item_name: str, count: int = 1) -> dict:
    """在拍卖行出售物品"""
    # 检查物品
    current_count = character["inventory"].get(item_name, 0)
    if current_count < count:
        return {"success": False, "message": f"没有足够的 {item_name}"}

    # 获取物品价格
    from .items import ITEM_DB
    item_data = ITEM_DB.get(item_name)
    if not item_data:
        return {"success": False, "message": f"未知物品: {item_name}"}

    # 计算出售价格（70%原价）
    sell_price = int(item_data.get("price", 10) * 0.7) * count

    # 出售
    character["inventory"][item_name] -= count
    if character["inventory"][item_name] <= 0:
        del character["inventory"][item_name]

    # 获得灵石
    character["inventory"]["灵石"] = character["inventory"].get("灵石", 0) + sell_price

    return {
        "success": True,
        "message": f"出售了 {count} 个 {item_name}，获得 {sell_price} 灵石",
        "item": item_name,
        "count": count,
        "price": sell_price,
    }
