extends Control
## Runner Game — "放学回家"
## Auto-runner: player jumps to avoid obstacles, collect stars.
## Based on Control nodes with Tween-based jumping (no physics engine).

@onready var player: Label = %Player
@onready var obstacle_layer: Control = %ObstacleLayer
@onready var collectible_layer: Control = %CollectibleLayer
@onready var far_bg_layer: Control = %FarBgLayer
@onready var stars_label: Label = %StarsLabel
@onready var progress_fill: ColorRect = %ProgressFill
@onready var jump_hint: Label = %JumpHint
@onready var obstacle_timer: Timer = %ObstacleTimer
@onready var collectible_timer: Timer = %CollectibleTimer

## Game state
var stars := 0
var distance := 0.0
var game_speed := 400.0  # pixels per second
var is_jumping := false
var is_hit := false
var game_over := false

## Player ground position (anchor-based, in pixels from top)
var player_ground_y := 0.0
var player_y := 0.0

## Constants
const TOTAL_DISTANCE := 100.0  # arbitrary units
const JUMP_HEIGHT := 260.0
const JUMP_DURATION := 0.55  # seconds for full jump arc
const HIT_SLOWDOWN_DURATION := 1.0
const SPEED_INCREMENT := 15.0  # speed increases over time

## Obstacle definitions — spawned from right edge
const OBSTACLES: Array = [
	{"icon": "🗑️", "name": "垃圾桶", "width": 80, "height": 80},
	{"icon": "🚧", "name": "路障", "width": 90, "height": 100},
	{"icon": "🐕", "name": "小狗", "width": 80, "height": 70},
	{"icon": "🪨", "name": "石头", "width": 70, "height": 60},
	{"icon": "📦", "name": "箱子", "width": 85, "height": 85},
	{"icon": "🛒", "name": "购物车", "width": 100, "height": 90},
]

## Background buildings/scenery (far layer, moves slowly)
const FAR_SCENERY := ["🏢", "🏠", "🏫", "🌳", "🌲", "⛪", "🏪", "🏥"]

## Segment themes
var _segment_index := 0
const SEGMENTS := [
	{"name": "学校门口", "sky": Color(0.55, 0.82, 0.95), "ground": Color(0.55, 0.75, 0.4)},
	{"name": "公园小路", "sky": Color(0.5, 0.85, 0.9), "ground": Color(0.45, 0.7, 0.35)},
	{"name": "居民区", "sky": Color(0.6, 0.78, 0.92), "ground": Color(0.5, 0.68, 0.4)},
]

var _far_items: Array[Label] = []
var _active_obstacles: Array[Dictionary] = []
var _active_collectibles: Array[Dictionary] = []


func _ready() -> void:
	# Calculate player ground Y from anchor position
	player_ground_y = player.position.y
	player_y = player_ground_y

	$TopBar/BackButton.pressed.connect(func(): GameManager.end_game())
	obstacle_timer.timeout.connect(_spawn_obstacle)
	collectible_timer.timeout.connect(_spawn_collectible)

	_create_far_bg()
	_fade_in_hint()


func _fade_in_hint() -> void:
	# Fade out the jump hint after a few seconds
	await get_tree().create_timer(3.0).timeout
	var tween := create_tween()
	tween.tween_property(jump_hint, "modulate:a", 0.0, 1.0)


func _input(event: InputEvent) -> void:
	if game_over:
		return
	# Jump on click, touch, or spacebar
	if (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT) \
		or (event is InputEventScreenTouch and event.pressed) \
		or (event is InputEventKey and event.pressed and event.keycode == KEY_SPACE):
		_jump()


func _jump() -> void:
	if is_jumping:
		return
	is_jumping = true

	# Tween-based jump: up then down (parabolic feel)
	var tween := create_tween()
	tween.tween_property(player, "position:y", player_ground_y - JUMP_HEIGHT, JUMP_DURATION * 0.45)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	tween.tween_property(player, "position:y", player_ground_y, JUMP_DURATION * 0.55)\
		.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	tween.tween_callback(func(): is_jumping = false)


func _process(delta: float) -> void:
	if game_over:
		return

	# Advance distance
	var effective_speed := game_speed * (0.3 if is_hit else 1.0)
	distance += effective_speed * delta * 0.01
	distance = minf(distance, TOTAL_DISTANCE)

	# Update progress bar
	var progress_ratio := distance / TOTAL_DISTANCE
	progress_fill.anchor_right = progress_ratio

	# Increase speed slightly over time
	game_speed += SPEED_INCREMENT * delta * 0.1

	# Update segment theme
	var new_segment := mini(int(progress_ratio * SEGMENTS.size()), SEGMENTS.size() - 1)
	if new_segment != _segment_index:
		_segment_index = new_segment
		# Could animate color change here

	# Move far background
	for item in _far_items:
		item.position.x -= effective_speed * 0.3 * delta
		if item.position.x < -100:
			item.position.x = get_viewport_rect().size.x + randf_range(50, 200)
			item.text = FAR_SCENERY[randi() % FAR_SCENERY.size()]

	# Move obstacles
	_update_obstacles(delta, effective_speed)

	# Move collectibles
	_update_collectibles(delta, effective_speed)

	# Check game completion
	if distance >= TOTAL_DISTANCE:
		_arrive_home()


## ===== OBSTACLES =====
func _spawn_obstacle() -> void:
	if game_over:
		return

	var obs_data: Dictionary = OBSTACLES[randi() % OBSTACLES.size()]
	var viewport_w := get_viewport_rect().size.x
	var ground_y := get_viewport_rect().size.y * 0.72  # road surface

	var obs_label := Label.new()
	obs_label.text = obs_data["icon"]
	obs_label.add_theme_font_size_override("font_size", 80)
	obs_label.position = Vector2(viewport_w + 50, ground_y - 100)
	obstacle_layer.add_child(obs_label)

	_active_obstacles.append({
		"node": obs_label,
		"width": obs_data["width"],
		"height": obs_data["height"],
	})

	# Vary timer for next obstacle
	obstacle_timer.wait_time = randf_range(1.2, 2.5)


func _update_obstacles(delta: float, speed: float) -> void:
	var player_rect := Rect2(
		player.position.x - 30,
		player.position.y - 80,
		60, 80
	)

	var to_remove: Array[int] = []
	for i in _active_obstacles.size():
		var obs: Dictionary = _active_obstacles[i]
		var node: Label = obs["node"]
		node.position.x -= speed * delta

		# Off screen left — remove
		if node.position.x < -150:
			to_remove.append(i)
			continue

		# Collision check (only if not already hit)
		if not is_hit:
			var obs_rect := Rect2(
				node.position.x,
				node.position.y,
				obs["width"], obs["height"]
			)
			if player_rect.intersects(obs_rect):
				_on_hit()

	# Remove off-screen obstacles (reverse order)
	for i in range(to_remove.size() - 1, -1, -1):
		var idx: int = to_remove[i]
		_active_obstacles[idx]["node"].queue_free()
		_active_obstacles.remove_at(idx)


## ===== COLLECTIBLES =====
func _spawn_collectible() -> void:
	if game_over:
		return

	var viewport_w := get_viewport_rect().size.x
	var ground_y := get_viewport_rect().size.y * 0.72

	var star := Label.new()
	star.text = "⭐"
	star.add_theme_font_size_override("font_size", 50)
	# Randomly place at ground level or in air (rewarding jumps)
	var in_air := randf() > 0.5
	var y_pos := ground_y - (220 if in_air else 80)
	star.position = Vector2(viewport_w + 30, y_pos)
	collectible_layer.add_child(star)

	_active_collectibles.append({
		"node": star,
	})

	collectible_timer.wait_time = randf_range(1.8, 3.5)


func _update_collectibles(delta: float, speed: float) -> void:
	var player_center := Vector2(
		player.position.x,
		player.position.y - 40
	)

	var to_remove: Array[int] = []
	for i in _active_collectibles.size():
		var col: Dictionary = _active_collectibles[i]
		var node: Label = col["node"]
		node.position.x -= speed * delta

		if node.position.x < -100:
			to_remove.append(i)
			continue

		# Collection check (distance-based)
		var col_center := node.position + Vector2(25, 25)
		if player_center.distance_to(col_center) < 80:
			# Collected!
			stars += 1
			stars_label.text = "⭐ %d" % stars
			to_remove.append(i)
			# Pop animation
			var tween := create_tween()
			tween.tween_property(node, "scale", Vector2(1.5, 1.5), 0.1)
			tween.tween_property(node, "modulate:a", 0.0, 0.15)
			tween.tween_callback(node.queue_free)
			continue

	for i in range(to_remove.size() - 1, -1, -1):
		var idx: int = to_remove[i]
		var node: Label = _active_collectibles[idx]["node"]
		if node.is_inside_tree() and node.modulate.a > 0.5:
			node.queue_free()
		_active_collectibles.remove_at(idx)


## ===== HIT =====
func _on_hit() -> void:
	is_hit = true
	stars = maxi(0, stars - 1)
	stars_label.text = "⭐ %d" % stars

	# Player flash red
	player.modulate = Color(1, 0.3, 0.3)
	var tween := create_tween()
	tween.tween_property(player, "modulate", Color.WHITE, 0.15)
	tween.tween_property(player, "modulate", Color(1, 0.3, 0.3), 0.15)
	tween.tween_property(player, "modulate", Color.WHITE, 0.15)
	tween.tween_property(player, "modulate", Color(1, 0.3, 0.3), 0.15)
	tween.tween_property(player, "modulate", Color.WHITE, 0.15)
	tween.tween_callback(func(): is_hit = false)


## ===== FAR BACKGROUND =====
func _create_far_bg() -> void:
	var viewport_w := get_viewport_rect().size.x
	if viewport_w == 0:
		viewport_w = 2880.0

	for i in 8:
		var item := Label.new()
		item.text = FAR_SCENERY[randi() % FAR_SCENERY.size()]
		item.add_theme_font_size_override("font_size", randi_range(60, 90))
		item.position = Vector2(
			i * (viewport_w / 6.0),
			get_viewport_rect().size.y * randf_range(0.35, 0.52)
		)
		item.modulate.a = 0.5  # Far away = slightly transparent
		far_bg_layer.add_child(item)
		_far_items.append(item)


## ===== ARRIVE HOME =====
func _arrive_home() -> void:
	game_over = true
	obstacle_timer.stop()
	collectible_timer.stop()

	# Stop obstacles
	for obs in _active_obstacles:
		obs["node"].queue_free()
	_active_obstacles.clear()

	# Player celebration
	player.text = "🎉"
	var tween := create_tween()
	tween.tween_property(player, "scale", Vector2(1.3, 1.3), 0.2)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tween.tween_property(player, "scale", Vector2.ONE, 0.2)

	# Show completion
	var overlay := ColorRect.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.color = Color(0, 0, 0, 0.0)
	add_child(overlay)

	var overlay_tween := create_tween()
	overlay_tween.tween_property(overlay, "color:a", 0.35, 0.5)

	await get_tree().create_timer(0.8).timeout

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 20)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var home_icon := Label.new()
	home_icon.text = "🏠"
	home_icon.add_theme_font_size_override("font_size", 180)
	home_icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(home_icon)

	var congrats := Label.new()
	congrats.text = "到家啦！收集了 %d 颗星！" % stars
	congrats.add_theme_font_size_override("font_size", 56)
	congrats.add_theme_color_override("font_color", Color(1, 1, 1))
	congrats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(congrats)

	vbox.scale = Vector2(0.5, 0.5)
	vbox.modulate.a = 0.0
	var result_tween := create_tween().set_parallel(true)
	result_tween.tween_property(vbox, "scale", Vector2.ONE, 0.4)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	result_tween.tween_property(vbox, "modulate:a", 1.0, 0.3)

	GameManager.add_coins(stars)
	await get_tree().create_timer(3.5).timeout
	GameManager.end_game()
