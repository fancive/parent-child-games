extends Node
## Global game state manager.
## Tracks player progress, coins, and shared state across all mini-games.

signal coins_changed(new_amount: int)
signal game_started(game_id: String)
signal game_ended(game_id: String)

## Persistent player data
var coins: int = 0:
	set(value):
		coins = max(0, value)
		coins_changed.emit(coins)

var player_name: String = "宝贝"

## Current game session
var current_game: String = ""
var games_played: int = 0

## Game registry — each game defines its metadata here
var game_registry: Array[Dictionary] = [
	{
		"id": "kitchen",
		"title": "小厨师做饭",
		"description": "去超市买食材，骑车回家，做出美味佳肴！",
		"icon": "🍳",
		"color": Color(0.93, 0.56, 0.18),
		"scene": "res://src/kitchen_game/kitchen_main.tscn",
		"unlocked": true,
	},
	{
		"id": "bear_shop",
		"title": "小熊超市",
		"description": "当小熊店员，帮顾客找商品、算账收钱！",
		"icon": "🧸",
		"color": Color(0.63, 0.43, 0.37),
		"scene": "res://src/bear_supermarket/bear_main.tscn",
		"unlocked": true,
	},
	{
		"id": "runner",
		"title": "放学回家",
		"description": "放学啦！跳过障碍，收集星星，跑回家！",
		"icon": "🏃",
		"color": Color(0.35, 0.7, 0.9),
		"scene": "res://src/runner_game/runner_main.tscn",
		"unlocked": true,
	},
]


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


func start_game(game_id: String) -> void:
	current_game = game_id
	games_played += 1
	game_started.emit(game_id)
	var game_data := _get_game_data(game_id)
	if game_data.is_empty():
		push_error("Unknown game: " + game_id)
		return
	SceneTransition.change_scene(game_data["scene"])


func end_game() -> void:
	var ended_game := current_game
	current_game = ""
	game_ended.emit(ended_game)
	SceneTransition.change_scene("res://src/shared/game_select.tscn")


func add_coins(amount: int) -> void:
	coins += amount


func _get_game_data(game_id: String) -> Dictionary:
	for game in game_registry:
		if game["id"] == game_id:
			return game
	return {}
