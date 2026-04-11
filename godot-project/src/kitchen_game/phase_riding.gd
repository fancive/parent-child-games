extends Control
## Riding phase: tap rapidly to pedal the bicycle home.
## Scenery scrolls past continuously; tapping makes you go faster.

signal ride_done

@onready var rider: Label = %Rider
@onready var progress_bar: ProgressBar = %ProgressBar
@onready var hint_label: Label = %Hint
@onready var scenery_layer: Control = %SceneryLayer

var progress := 0.0
var speed := 0.0
var _road_dashes: Array[ColorRect] = []
var _trees: Array[Label] = []
var _arrived := false

const TARGET_PROGRESS := 100.0
const TAP_BOOST := 12.0
const DRAG_FACTOR := 0.95
const BASE_SPEED := 15.0  # Always moving forward slowly
const DASH_COUNT := 12
const TREE_COUNT := 6

const SCENERY_ITEMS := ["🌳", "🌲", "🌻", "🏡", "🌺", "🪨", "🐦", "🌾"]


func _ready() -> void:
	_create_road_dashes()
	_create_scenery()


func _create_road_dashes() -> void:
	# Dashed yellow center-line on the road (road is at 0.6–0.85, center = 0.725)
	var viewport_w: float = get_viewport_rect().size.x
	var viewport_h: float = get_viewport_rect().size.y
	if viewport_w == 0:
		viewport_w = 2880.0
	if viewport_h == 0:
		viewport_h = 1800.0
	var dash_spacing := viewport_w / (DASH_COUNT - 1)
	var road_center_y := viewport_h * 0.725

	for i in DASH_COUNT:
		var dash := ColorRect.new()
		dash.size = Vector2(80, 8)
		dash.color = Color(1.0, 0.92, 0.3, 0.9)
		dash.position = Vector2(i * dash_spacing, road_center_y - 4)
		scenery_layer.add_child(dash)
		_road_dashes.append(dash)


func _create_scenery() -> void:
	# Trees/objects along the road sides — above and below the road
	var viewport_w: float = get_viewport_rect().size.x
	var viewport_h: float = get_viewport_rect().size.y
	if viewport_w == 0:
		viewport_w = 2880.0
	if viewport_h == 0:
		viewport_h = 1800.0

	# Road is at 0.6–0.85 of screen height
	# Place trees above road (in grass, 0.45–0.57) and below road (0.87–0.95)
	for i in TREE_COUNT:
		var tree := Label.new()
		tree.text = SCENERY_ITEMS[randi() % SCENERY_ITEMS.size()]
		tree.add_theme_font_size_override("font_size", randi_range(64, 96))
		var y_pos: float
		if i % 2 == 0:
			y_pos = randf_range(0.42, 0.56) * viewport_h  # Above road
		else:
			y_pos = randf_range(0.87, 0.95) * viewport_h  # Below road
		tree.position = Vector2(viewport_w * 0.2 + i * (viewport_w * 0.8 / TREE_COUNT), y_pos)
		scenery_layer.add_child(tree)
		_trees.append(tree)


func _input(event: InputEvent) -> void:
	if _arrived:
		return
	if (event is InputEventMouseButton and event.pressed) or \
	   (event is InputEventScreenTouch and event.pressed):
		_pedal()


func _pedal() -> void:
	speed += TAP_BOOST
	# Rider bob animation
	var tween := create_tween()
	tween.tween_property(rider, "position:y", rider.position.y - 10, 0.06)
	tween.tween_property(rider, "position:y", rider.position.y, 0.1)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BOUNCE)


func _process(delta: float) -> void:
	if _arrived:
		return

	# Always moving, tapping makes it faster
	speed *= DRAG_FACTOR
	var current_speed := BASE_SPEED + speed
	progress += current_speed * delta * 0.5
	progress = minf(progress, TARGET_PROGRESS)
	progress_bar.value = progress

	# Scroll road dashes
	var viewport_w: float = get_viewport_rect().size.x
	if viewport_w == 0:
		viewport_w = 1440.0
	for dash in _road_dashes:
		dash.position.x -= current_speed * 3.0 * delta
		if dash.position.x < -80:
			dash.position.x += viewport_w + 80

	# Scroll trees
	for tree in _trees:
		tree.position.x -= current_speed * 2.5 * delta
		if tree.position.x < -80:
			tree.position.x = viewport_w + randf_range(20, 100)
			tree.text = SCENERY_ITEMS[randi() % SCENERY_ITEMS.size()]

	# Gentle rider wobble based on speed
	rider.rotation = sin(Time.get_ticks_msec() * 0.008) * current_speed * 0.001

	# Done?
	if progress >= TARGET_PROGRESS:
		_arrive_home()


func _arrive_home() -> void:
	_arrived = true
	hint_label.text = "🏠 到家啦！"
	speed = 0.0

	var tween := create_tween()
	tween.tween_property(rider, "scale", Vector2(1.3, 1.3), 0.2)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tween.tween_property(rider, "scale", Vector2.ONE, 0.2)
	tween.tween_interval(1.2)
	tween.tween_callback(func(): ride_done.emit())
