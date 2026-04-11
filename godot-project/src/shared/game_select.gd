extends Control
## Game selection menu — shows all available mini-games as tappable cards.

@onready var game_grid: GridContainer = %GameGrid
@onready var coin_display: Label = %CoinDisplay

const CARD_SCENE := preload("res://src/shared/game_card.tscn")


func _ready() -> void:
	_update_coins(GameManager.coins)
	GameManager.coins_changed.connect(_update_coins)
	_populate_games()


func _update_coins(amount: int) -> void:
	coin_display.text = "🪙 %d" % amount


func _populate_games() -> void:
	for child in game_grid.get_children():
		child.queue_free()

	for i in GameManager.game_registry.size():
		var game_data: Dictionary = GameManager.game_registry[i]
		var card: Control = CARD_SCENE.instantiate()
		card.setup(game_data)
		card.pressed.connect(_on_game_card_pressed.bind(game_data["id"]))
		game_grid.add_child(card)

		# Stagger entrance animation
		card.modulate.a = 0.0
		card.scale = Vector2(0.8, 0.8)
		var tween := create_tween()
		tween.set_parallel(true)
		tween.tween_property(card, "modulate:a", 1.0, 0.3).set_delay(i * 0.15)
		tween.tween_property(card, "scale", Vector2.ONE, 0.4)\
			.set_delay(i * 0.15).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)


func _on_game_card_pressed(game_id: String) -> void:
	GameManager.start_game(game_id)
