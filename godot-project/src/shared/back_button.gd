extends Button
## Reusable back-to-menu button. Place in any game scene.
class_name BackButton


func _ready() -> void:
	text = "🏠 回首页"
	flat = true
	add_theme_font_size_override("font_size", 22)
	add_theme_color_override("font_color", Color(0.5, 0.4, 0.3))
	pressed.connect(_on_pressed)


func _on_pressed() -> void:
	GameManager.end_game()
