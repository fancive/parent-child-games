extends PanelContainer
## A tappable game card in the selection grid.

signal pressed

@onready var icon_label: Label = %Icon
@onready var title_label: Label = %Title
@onready var desc_label: Label = %Description

var _game_color := Color.WHITE
var _style: StyleBoxFlat


func _ready() -> void:
	_style = StyleBoxFlat.new()
	_style.bg_color = Color.WHITE
	_style.corner_radius_top_left = 20
	_style.corner_radius_top_right = 20
	_style.corner_radius_bottom_left = 20
	_style.corner_radius_bottom_right = 20
	_style.shadow_color = Color(0, 0, 0, 0.08)
	_style.shadow_size = 8
	_style.shadow_offset = Vector2(0, 4)
	add_theme_stylebox_override("panel", _style)

	gui_input.connect(_on_gui_input)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)


func setup(data: Dictionary) -> void:
	_game_color = data.get("color", Color.WHITE)

	# Defer label assignment in case setup is called before _ready
	if not is_node_ready():
		await ready
	icon_label.text = data.get("icon", "?")
	title_label.text = data.get("title", "")
	desc_label.text = data.get("description", "")


func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		# Press animation
		var tween := create_tween()
		tween.tween_property(self, "scale", Vector2(0.95, 0.95), 0.08)
		tween.tween_property(self, "scale", Vector2.ONE, 0.12)\
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
		tween.tween_callback(func(): pressed.emit())


func _on_mouse_entered() -> void:
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2(1.03, 1.03), 0.15)\
		.set_ease(Tween.EASE_OUT)


func _on_mouse_exited() -> void:
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2.ONE, 0.15)
