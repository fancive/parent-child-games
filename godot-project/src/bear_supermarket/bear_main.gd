extends Control
## Bear Supermarket — player is the bear shopkeeper.
## Left: customer with speech bubble. Right: wooden shelf with products.
## Bottom-left: payment area for calculating totals.

@onready var score_label: Label = %ScoreLabel
@onready var customer_area: Control = %CustomerArea
@onready var feedback_area: Control = %FeedbackArea
@onready var payment_area: Control = %PaymentArea
@onready var right_panel: Control = %RightPanel

var score := 0
var customers_served := 0
var current_order: Array[Dictionary] = []
var order_total := 0
var items_picked: Array[String] = []

enum State { PICKING, PAYING, FEEDBACK }
var state: State = State.PICKING

var _customer_emoji_lbl: Label
var _speech_bubble_lbl: Label
var _feedback_lbl: Label
var _shelf_buttons: Array[Button] = []

const SHOP_ITEMS: Array = [
	{"name": "苹果", "icon": "🍎", "price": 3},
	{"name": "面包", "icon": "🍞", "price": 5},
	{"name": "牛奶", "icon": "🥛", "price": 4},
	{"name": "饼干", "icon": "🍪", "price": 2},
	{"name": "香蕉", "icon": "🍌", "price": 3},
	{"name": "果汁", "icon": "🧃", "price": 6},
	{"name": "蛋糕", "icon": "🎂", "price": 8},
	{"name": "糖果", "icon": "🍬", "price": 1},
	{"name": "冰淇淋", "icon": "🍦", "price": 4},
]

const CUSTOMERS := ["🐰", "🐱", "🐶", "🐼", "🦊", "🐸", "🐧", "🐮"]
const MAX_CUSTOMERS := 5


func _ready() -> void:
	$TopBar/BackButton.pressed.connect(func(): GameManager.end_game())
	_build_customer_area()
	_build_feedback_area()
	_build_payment_area()
	_build_shelf()
	_next_customer()


## ===== CUSTOMER AREA — left top, shows animal + speech bubble =====
func _build_customer_area() -> void:
	# Background — looks like the shop floor
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.98, 0.96, 0.9, 1)
	customer_area.add_child(bg)

	var vbox := VBoxContainer.new()
	vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 12)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	customer_area.add_child(vbox)

	# Customer emoji
	_customer_emoji_lbl = Label.new()
	_customer_emoji_lbl.text = "🐰"
	_customer_emoji_lbl.add_theme_font_size_override("font_size", 150)
	_customer_emoji_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(_customer_emoji_lbl)

	# Speech bubble background
	var bubble_container := PanelContainer.new()
	var bubble_style := StyleBoxFlat.new()
	bubble_style.bg_color = Color(1, 1, 1, 0.95)
	bubble_style.corner_radius_top_left = 16
	bubble_style.corner_radius_top_right = 16
	bubble_style.corner_radius_bottom_left = 16
	bubble_style.corner_radius_bottom_right = 16
	bubble_style.border_color = Color(0.75, 0.65, 0.5)
	bubble_style.border_width_top = 3
	bubble_style.border_width_bottom = 3
	bubble_style.border_width_left = 3
	bubble_style.border_width_right = 3
	bubble_style.content_margin_left = 20
	bubble_style.content_margin_right = 20
	bubble_style.content_margin_top = 14
	bubble_style.content_margin_bottom = 14
	bubble_container.add_theme_stylebox_override("panel", bubble_style)
	vbox.add_child(bubble_container)

	_speech_bubble_lbl = Label.new()
	_speech_bubble_lbl.text = "你好！"
	_speech_bubble_lbl.add_theme_font_size_override("font_size", 36)
	_speech_bubble_lbl.add_theme_color_override("font_color", Color(0.25, 0.2, 0.12))
	_speech_bubble_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_speech_bubble_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	bubble_container.add_child(_speech_bubble_lbl)


## ===== FEEDBACK AREA =====
func _build_feedback_area() -> void:
	_feedback_lbl = Label.new()
	_feedback_lbl.set_anchors_preset(Control.PRESET_FULL_RECT)
	_feedback_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_feedback_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_feedback_lbl.add_theme_font_size_override("font_size", 44)
	feedback_area.add_child(_feedback_lbl)


## ===== PAYMENT AREA — shows price options =====
func _build_payment_area() -> void:
	# Initially hidden content, shown during PAYING state
	payment_area.visible = false


## ===== SHELF — wooden shelf with 9 items (3 rows × 3) =====
func _build_shelf() -> void:
	# Wooden back panel
	var wood_back := ColorRect.new()
	wood_back.set_anchors_preset(Control.PRESET_FULL_RECT)
	wood_back.color = Color(0.45, 0.32, 0.18)
	right_panel.add_child(wood_back)

	# Side boards
	var left_board := ColorRect.new()
	left_board.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	left_board.offset_right = 16
	left_board.color = Color(0.55, 0.38, 0.2)
	right_panel.add_child(left_board)

	var right_board := ColorRect.new()
	right_board.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	right_board.offset_left = -16
	right_board.color = Color(0.55, 0.38, 0.2)
	right_panel.add_child(right_board)

	# VBox for shelf rows
	var shelf_vbox := VBoxContainer.new()
	shelf_vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	shelf_vbox.offset_left = 20
	shelf_vbox.offset_right = -20
	shelf_vbox.offset_top = 10
	shelf_vbox.offset_bottom = -10
	shelf_vbox.add_theme_constant_override("separation", 0)
	right_panel.add_child(shelf_vbox)

	# 3 rows × 3 items
	var items_per_row := 3
	var item_idx := 0

	for row_i in 3:
		var row_container := VBoxContainer.new()
		row_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
		row_container.add_theme_constant_override("separation", 0)
		shelf_vbox.add_child(row_container)

		# Items row
		var shelf_row := HBoxContainer.new()
		shelf_row.size_flags_vertical = Control.SIZE_EXPAND_FILL
		shelf_row.alignment = BoxContainer.ALIGNMENT_CENTER
		shelf_row.add_theme_constant_override("separation", 6)
		row_container.add_child(shelf_row)

		for col_i in items_per_row:
			if item_idx >= SHOP_ITEMS.size():
				break
			var item_data: Dictionary = SHOP_ITEMS[item_idx]

			# Item slot — pushes content to bottom
			var item_slot := VBoxContainer.new()
			item_slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			item_slot.size_flags_vertical = Control.SIZE_EXPAND_FILL
			shelf_row.add_child(item_slot)

			var spacer := Control.new()
			spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
			item_slot.add_child(spacer)

			# The item button
			var item_btn := Button.new()
			item_btn.flat = true
			item_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER

			var btn_content := VBoxContainer.new()
			btn_content.set_anchors_preset(Control.PRESET_FULL_RECT)
			btn_content.alignment = BoxContainer.ALIGNMENT_END
			btn_content.add_theme_constant_override("separation", 2)
			btn_content.mouse_filter = Control.MOUSE_FILTER_IGNORE
			item_btn.add_child(btn_content)

			var icon_lbl := Label.new()
			icon_lbl.text = item_data["icon"]
			icon_lbl.add_theme_font_size_override("font_size", 72)
			icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			icon_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
			btn_content.add_child(icon_lbl)

			var name_lbl := Label.new()
			name_lbl.text = item_data["name"]
			name_lbl.add_theme_font_size_override("font_size", 26)
			name_lbl.add_theme_color_override("font_color", Color(1, 1, 1, 0.9))
			name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			name_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
			btn_content.add_child(name_lbl)

			var price_lbl := Label.new()
			price_lbl.text = "%d元" % item_data["price"]
			price_lbl.add_theme_font_size_override("font_size", 22)
			price_lbl.add_theme_color_override("font_color", Color(1, 0.85, 0.4))
			price_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			price_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
			btn_content.add_child(price_lbl)

			item_btn.custom_minimum_size = Vector2(160, 180)
			item_btn.pressed.connect(_on_shelf_item_pressed.bind(item_data, item_btn))
			item_slot.add_child(item_btn)
			_shelf_buttons.append(item_btn)

			item_idx += 1

		# Plank board
		var plank := ColorRect.new()
		plank.custom_minimum_size = Vector2(0, 18)
		plank.color = Color(0.62, 0.44, 0.25)
		row_container.add_child(plank)

		var plank_edge := ColorRect.new()
		plank_edge.custom_minimum_size = Vector2(0, 7)
		plank_edge.color = Color(0.5, 0.35, 0.18)
		row_container.add_child(plank_edge)


## ===== GAME LOGIC =====
func _next_customer() -> void:
	if customers_served >= MAX_CUSTOMERS:
		_game_over()
		return

	state = State.PICKING
	items_picked.clear()
	current_order.clear()
	order_total = 0
	payment_area.visible = false
	_feedback_lbl.text = ""

	# Re-enable all shelf buttons
	for btn in _shelf_buttons:
		btn.modulate = Color.WHITE
		btn.disabled = false

	# Random customer and items (1-3)
	_customer_emoji_lbl.text = CUSTOMERS[randi() % CUSTOMERS.size()]
	var num_items := randi_range(1, 3)
	var available := SHOP_ITEMS.duplicate()
	available.shuffle()

	for i in mini(num_items, available.size()):
		current_order.append(available[i])
		order_total += available[i]["price"]

	# Speech bubble
	var want_list := ""
	for item in current_order:
		want_list += "%s %s  " % [item["icon"], item["name"]]
	_speech_bubble_lbl.text = "你好！我想买：\n%s" % want_list.strip_edges()

	# Customer entrance animation
	_customer_emoji_lbl.modulate.a = 0.0
	_customer_emoji_lbl.scale = Vector2(0.5, 0.5)
	var tween := create_tween().set_parallel(true)
	tween.tween_property(_customer_emoji_lbl, "modulate:a", 1.0, 0.3)
	tween.tween_property(_customer_emoji_lbl, "scale", Vector2.ONE, 0.4)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)


func _on_shelf_item_pressed(item_data: Dictionary, btn: Button) -> void:
	if state != State.PICKING:
		return

	var item_name: String = item_data["name"]

	# Check if needed
	var needed := false
	for order_item in current_order:
		if order_item["name"] == item_name and item_name not in items_picked:
			needed = true
			break

	if needed:
		items_picked.append(item_name)
		btn.modulate = Color(0.5, 0.5, 0.5, 0.4)
		btn.disabled = true
		_feedback_lbl.text = "✅ %s 拿到了！" % item_data["icon"]
		_animate_feedback(true)

		if items_picked.size() >= current_order.size():
			_start_payment()
	else:
		_feedback_lbl.text = "❌ 客人没要这个哦"
		_animate_feedback(false)
		# Shake the button
		var tween := create_tween()
		tween.tween_property(btn, "position:x", btn.position.x + 10, 0.04)
		tween.tween_property(btn, "position:x", btn.position.x - 10, 0.04)
		tween.tween_property(btn, "position:x", btn.position.x + 5, 0.04)
		tween.tween_property(btn, "position:x", btn.position.x, 0.04)


func _start_payment() -> void:
	state = State.PAYING
	_feedback_lbl.text = ""
	_speech_bubble_lbl.text = "谢谢！一共多少钱呀？"

	# Build payment UI
	payment_area.visible = true
	# Clear old children
	for child in payment_area.get_children():
		child.queue_free()

	var pay_bg := ColorRect.new()
	pay_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	pay_bg.color = Color(0.92, 0.95, 0.88, 1)
	payment_area.add_child(pay_bg)

	var pay_vbox := VBoxContainer.new()
	pay_vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	pay_vbox.add_theme_constant_override("separation", 14)
	pay_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	payment_area.add_child(pay_vbox)

	var total_lbl := Label.new()
	total_lbl.text = "💰 收多少钱？"
	total_lbl.add_theme_font_size_override("font_size", 36)
	total_lbl.add_theme_color_override("font_color", Color(0.3, 0.5, 0.25))
	total_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pay_vbox.add_child(total_lbl)

	# Options
	var options_hbox := HBoxContainer.new()
	options_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	options_hbox.add_theme_constant_override("separation", 24)
	pay_vbox.add_child(options_hbox)

	var options: Array[int] = [order_total]
	while options.size() < 3:
		var wrong := order_total + randi_range(-3, 5)
		if wrong > 0 and wrong != order_total and wrong not in options:
			options.append(wrong)
	options.shuffle()

	for opt in options:
		var btn := Button.new()
		btn.text = "🪙 %d元" % opt
		btn.custom_minimum_size = Vector2(180, 80)
		btn.add_theme_font_size_override("font_size", 40)
		btn.pressed.connect(_on_payment_selected.bind(opt))
		options_hbox.add_child(btn)


func _on_payment_selected(amount: int) -> void:
	if state != State.PAYING:
		return

	state = State.FEEDBACK
	if amount == order_total:
		score += 1
		score_label.text = "⭐ %d" % score
		_feedback_lbl.text = "🎉 正确！真棒！"
		_speech_bubble_lbl.text = "谢谢小熊店员！再见~ 👋"
		_animate_feedback(true)
		GameManager.add_coins(3)
	else:
		_feedback_lbl.text = "🤔 不对哦，应该是 %d 元" % order_total
		_speech_bubble_lbl.text = "再算算看？应该是 %d 元哦~" % order_total
		_animate_feedback(false)

	customers_served += 1
	await get_tree().create_timer(2.2).timeout
	_next_customer()


func _animate_feedback(success: bool) -> void:
	_feedback_lbl.scale = Vector2(1.3, 1.3)
	_feedback_lbl.modulate = Color.GREEN if success else Color(1, 0.3, 0.2)
	var tween := create_tween()
	tween.tween_property(_feedback_lbl, "scale", Vector2.ONE, 0.2)\
		.set_ease(Tween.EASE_OUT)
	tween.tween_property(_feedback_lbl, "modulate", Color.WHITE, 0.6)


func _game_over() -> void:
	state = State.FEEDBACK
	payment_area.visible = false
	_customer_emoji_lbl.text = "🎊"
	_speech_bubble_lbl.text = ""

	# Hide shelf
	right_panel.modulate.a = 0.3

	_feedback_lbl.add_theme_font_size_override("font_size", 44)
	_feedback_lbl.text = "🧸 营业结束！\n服务了 %d 位客人\n答对 %d 题！太棒了！" % [MAX_CUSTOMERS, score]

	await get_tree().create_timer(3.5).timeout
	GameManager.end_game()
