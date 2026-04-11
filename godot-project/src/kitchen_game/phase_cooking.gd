extends Control
## Cooking phase — realistic 2D kitchen scene.
## Click the pot directly to perform each cooking step.
## Left panel shows recipe steps, current step highlighted above the stove.

signal cooking_done

@onready var dish_display: Label = %DishDisplay
@onready var step_panel: Control = %StepPanel
@onready var cooking_pot: Button = %CookingPot
@onready var pot_label: Label = %PotLabel
@onready var current_step_hint: Label = %CurrentStepHint
@onready var tap_hint: Label = %TapHint
@onready var particle_layer: Control = %ParticleLayer
@onready var completion_overlay: Control = %CompletionOverlay
@onready var stove_burner: Control = %StoveBurner

var recipe: Dictionary = {}
var current_step := 0
var steps: Array = []
var _step_labels: Array[Label] = []
var _flame_labels: Array[Label] = []
var _is_animating := false


func _ready() -> void:
	steps = recipe.get("steps", [])
	dish_display.text = "%s  %s" % [recipe.get("icon", ""), recipe.get("name", "")]
	cooking_pot.pressed.connect(_on_pot_pressed)
	_build_step_panel()
	_build_stove_flames()
	_show_current_step()


## ===== STEP PANEL — recipe card pinned to wall =====
func _build_step_panel() -> void:
	var card_bg := ColorRect.new()
	card_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	card_bg.color = Color(1.0, 0.99, 0.93, 1)
	step_panel.add_child(card_bg)

	var border := ReferenceRect.new()
	border.set_anchors_preset(Control.PRESET_FULL_RECT)
	border.border_color = Color(0.8, 0.7, 0.55)
	border.border_width = 3.0
	border.editor_only = false
	step_panel.add_child(border)

	var pin := Label.new()
	pin.text = "📌"
	pin.add_theme_font_size_override("font_size", 40)
	pin.position = Vector2(10, -12)
	step_panel.add_child(pin)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 28)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 16)
	step_panel.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	margin.add_child(vbox)

	var title := Label.new()
	title.text = "做菜步骤"
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_color_override("font_color", Color(0.4, 0.3, 0.15))
	vbox.add_child(title)

	var sep := HSeparator.new()
	vbox.add_child(sep)

	for i in steps.size():
		var step_lbl := Label.new()
		step_lbl.text = "%d. %s" % [i + 1, steps[i]]
		step_lbl.add_theme_font_size_override("font_size", 30)
		step_lbl.add_theme_color_override("font_color", Color(0.5, 0.45, 0.35))
		step_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		vbox.add_child(step_lbl)
		_step_labels.append(step_lbl)


## ===== STOVE FLAMES =====
func _build_stove_flames() -> void:
	var ring := ColorRect.new()
	ring.set_anchors_preset(Control.PRESET_FULL_RECT)
	ring.color = Color(0.15, 0.15, 0.18)
	stove_burner.add_child(ring)

	var inner := ColorRect.new()
	inner.anchor_left = 0.15
	inner.anchor_top = 0.15
	inner.anchor_right = 0.85
	inner.anchor_bottom = 0.85
	inner.color = Color(0.2, 0.2, 0.22)
	stove_burner.add_child(inner)

	for i in 8:
		var flame := Label.new()
		flame.text = "🔥"
		flame.add_theme_font_size_override("font_size", 44)
		var angle := i * TAU / 8.0
		flame.anchor_left = 0.5 + cos(angle) * 0.35
		flame.anchor_top = 0.5 + sin(angle) * 0.35
		flame.modulate.a = 0.3
		stove_burner.add_child(flame)
		_flame_labels.append(flame)


## ===== STEP CONTROL =====
func _show_current_step() -> void:
	if current_step >= steps.size():
		_finish_cooking()
		return

	# Highlight current step in panel
	for i in _step_labels.size():
		if i == current_step:
			_step_labels[i].add_theme_color_override("font_color", Color(0.85, 0.3, 0.1))
			_step_labels[i].text = "▶ %d. %s" % [i + 1, steps[i]]
		elif i < current_step:
			_step_labels[i].add_theme_color_override("font_color", Color(0.45, 0.65, 0.4))
			_step_labels[i].text = "✓ %d. %s" % [i + 1, steps[i]]
		else:
			_step_labels[i].add_theme_color_override("font_color", Color(0.5, 0.45, 0.35))

	# Show current action above the stove
	current_step_hint.text = "👉 %s" % steps[current_step]

	# Animate flames based on progress
	var intensity: float = float(current_step + 1) / float(steps.size())
	for flame in _flame_labels:
		flame.modulate.a = 0.2 + intensity * 0.8


func _on_pot_pressed() -> void:
	if _is_animating:
		return
	_is_animating = true

	# Pot shake animation
	var tween := create_tween()
	tween.tween_property(pot_label, "rotation_degrees", 10.0, 0.06)
	tween.tween_property(pot_label, "rotation_degrees", -10.0, 0.06)
	tween.tween_property(pot_label, "rotation_degrees", 5.0, 0.05)
	tween.tween_property(pot_label, "rotation_degrees", 0.0, 0.05)

	# Spawn steam particles
	for i in 4:
		_spawn_particle()

	current_step += 1

	await get_tree().create_timer(0.5).timeout
	_is_animating = false
	_show_current_step()


func _spawn_particle() -> void:
	var particle := Label.new()
	particle.text = ["♨️", "✨", "💫", "🌟", "💨"].pick_random()
	particle.add_theme_font_size_override("font_size", 56)
	particle.position = cooking_pot.global_position + Vector2(
		randf_range(-60, 60) + cooking_pot.size.x * 0.5,
		randf_range(-20, 10)
	)
	particle_layer.add_child(particle)

	var tween := create_tween().set_parallel(true)
	tween.tween_property(particle, "position:y", particle.position.y - 160, 1.0)\
		.set_ease(Tween.EASE_OUT)
	tween.tween_property(particle, "position:x", particle.position.x + randf_range(-40, 40), 1.0)
	tween.tween_property(particle, "modulate:a", 0.0, 1.0).set_delay(0.3)
	tween.chain().tween_callback(particle.queue_free)


func _finish_cooking() -> void:
	cooking_pot.visible = false
	tap_hint.visible = false
	current_step_hint.text = ""

	# Flames off
	for flame in _flame_labels:
		var tween := create_tween()
		tween.tween_property(flame, "modulate:a", 0.0, 0.5)

	# Show completion overlay
	completion_overlay.visible = true

	var overlay_bg := ColorRect.new()
	overlay_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay_bg.color = Color(0, 0, 0, 0.35)
	completion_overlay.add_child(overlay_bg)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	completion_overlay.add_child(center)

	var result_vbox := VBoxContainer.new()
	result_vbox.add_theme_constant_override("separation", 20)
	result_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(result_vbox)

	var dish_icon := Label.new()
	dish_icon.text = recipe.get("icon", "🍽️")
	dish_icon.add_theme_font_size_override("font_size", 200)
	dish_icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_vbox.add_child(dish_icon)

	var congrats := Label.new()
	congrats.text = "做好啦！真棒！ 🎉"
	congrats.add_theme_font_size_override("font_size", 64)
	congrats.add_theme_color_override("font_color", Color(1, 1, 1))
	congrats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_vbox.add_child(congrats)

	# Animate entrance
	result_vbox.scale = Vector2(0.5, 0.5)
	result_vbox.modulate.a = 0.0
	var tween := create_tween().set_parallel(true)
	tween.tween_property(result_vbox, "scale", Vector2.ONE, 0.4)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tween.tween_property(result_vbox, "modulate:a", 1.0, 0.3)
	tween.chain().tween_interval(2.0)
	tween.chain().tween_callback(func(): cooking_done.emit())
