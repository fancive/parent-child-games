extends Control
## Kitchen Game main controller.
## Manages the three gameplay phases: shopping → ride → cooking.

@onready var phase_container: Control = %PhaseContainer
@onready var phase_label: Label = %PhaseLabel

enum Phase { SHOPPING, RIDING, COOKING }

var current_phase: Phase = Phase.SHOPPING
var cart: Array[String] = []  # Items bought at the shop

const ShoppingScene := preload("res://src/kitchen_game/phase_shopping.tscn")
const RidingScene := preload("res://src/kitchen_game/phase_riding.tscn")
const CookingScene := preload("res://src/kitchen_game/phase_cooking.tscn")

## Recipe data — each recipe needs specific ingredients
var recipes: Array[Dictionary] = [
	{
		"name": "番茄炒蛋",
		"icon": "🍅",
		"ingredients": ["番茄", "鸡蛋", "葱"],
		"steps": ["打鸡蛋搅拌", "切番茄", "热锅倒油", "炒鸡蛋", "加番茄翻炒", "加盐出锅"],
	},
	{
		"name": "蛋炒饭",
		"icon": "🍚",
		"ingredients": ["米饭", "鸡蛋", "火腿", "葱"],
		"steps": ["打鸡蛋搅拌", "切火腿丁", "热锅倒油", "炒鸡蛋", "加米饭翻炒", "加火腿和葱"],
	},
	{
		"name": "水果沙拉",
		"icon": "🥗",
		"ingredients": ["苹果", "香蕉", "草莓", "酸奶"],
		"steps": ["洗水果", "切苹果", "切香蕉", "摆盘", "淋上酸奶", "完成！"],
	},
]

var current_recipe: Dictionary = {}


func _ready() -> void:
	# Pick a random recipe for this session
	current_recipe = recipes[randi() % recipes.size()]
	_start_phase(Phase.SHOPPING)


func _start_phase(phase: Phase) -> void:
	current_phase = phase
	# Clear current phase scene
	for child in phase_container.get_children():
		child.queue_free()

	match phase:
		Phase.SHOPPING:
			phase_label.text = "📍 超市购物"
			var shopping := ShoppingScene.instantiate()
			shopping.recipe = current_recipe
			shopping.shopping_done.connect(_on_shopping_done)
			phase_container.add_child(shopping)

		Phase.RIDING:
			phase_label.text = "🚲 骑车回家"
			var riding := RidingScene.instantiate()
			riding.ride_done.connect(_on_ride_done)
			phase_container.add_child(riding)

		Phase.COOKING:
			phase_label.text = "🍳 开始做菜"
			var cooking := CookingScene.instantiate()
			cooking.recipe = current_recipe
			cooking.cooking_done.connect(_on_cooking_done)
			phase_container.add_child(cooking)


func _on_shopping_done(items: Array) -> void:
	cart = []
	for item in items:
		cart.append(item)
	_start_phase(Phase.RIDING)


func _on_ride_done() -> void:
	_start_phase(Phase.COOKING)


func _on_cooking_done() -> void:
	GameManager.add_coins(10)
	# Show completion, then return to menu after a moment
	phase_label.text = "🎉 做好啦！好棒！"
	await get_tree().create_timer(2.5).timeout
	GameManager.end_game()
