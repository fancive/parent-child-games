extends Control
## Shopping phase — realistic supermarket shelf UI.
## Left: wooden shelf with items sitting on planks. Right: recipe book + cart.

signal shopping_done(items: Array)

@onready var shelf_container: Control = %ShelfContainer
@onready var recipe_book: Control = %RecipeBook
@onready var cart_area: Control = %CartArea
@onready var checkout_btn: Button = %CheckoutBtn

var recipe: Dictionary = {}
var cart: Array[String] = []

const ALL_ITEMS: Array = [
	{"name": "番茄", "icon": "🍅"},
	{"name": "鸡蛋", "icon": "🥚"},
	{"name": "葱", "icon": "🧅"},
	{"name": "米饭", "icon": "🍚"},
	{"name": "火腿", "icon": "🥓"},
	{"name": "苹果", "icon": "🍎"},
	{"name": "香蕉", "icon": "🍌"},
	{"name": "草莓", "icon": "🍓"},
	{"name": "酸奶", "icon": "🥛"},
	{"name": "面包", "icon": "🍞"},
	{"name": "牛奶", "icon": "🧈"},
	{"name": "胡萝卜", "icon": "🥕"},
	{"name": "土豆", "icon": "🥔"},
	{"name": "西瓜", "icon": "🍉"},
	{"name": "奶酪", "icon": "🧀"},
	{"name": "玉米", "icon": "🌽"},
	{"name": "蘑菇", "icon": "🍄"},
	{"name": "巧克力", "icon": "🍫"},
]


func _ready() -> void:
	checkout_btn.pressed.connect(_on_checkout)
	_build_recipe_book()
	_build_shelf()
	_build_cart()


## ===== RECIPE BOOK =====
func _build_recipe_book() -> void:
	var book_bg := ColorRect.new()
	book_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	book_bg.color = Color(1.0, 0.98, 0.92, 1)
	recipe_book.add_child(book_bg)

	# Left spine
	var spine := ColorRect.new()
	spine.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	spine.offset_right = 14
	spine.color = Color(0.6, 0.4, 0.25)
	recipe_book.add_child(spine)

	# Border
	var border := ReferenceRect.new()
	border.set_anchors_preset(Control.PRESET_FULL_RECT)
	border.border_color = Color(0.72, 0.58, 0.4)
	border.border_width = 4.0
	border.editor_only = false
	recipe_book.add_child(border)

	# Content
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 30)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 16)
	recipe_book.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	margin.add_child(vbox)

	# Title
	var title := Label.new()
	title.text = "📖 今日菜谱"
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color(0.4, 0.28, 0.15))
	vbox.add_child(title)

	# Dish name
	var dish := Label.new()
	dish.text = "%s %s" % [recipe.get("icon", ""), recipe.get("name", "")]
	dish.add_theme_font_size_override("font_size", 42)
	dish.add_theme_color_override("font_color", Color(0.2, 0.15, 0.05))
	vbox.add_child(dish)

	var sep := HSeparator.new()
	vbox.add_child(sep)

	# Ingredient header
	var header := Label.new()
	header.text = "需要食材："
	header.add_theme_font_size_override("font_size", 26)
	header.add_theme_color_override("font_color", Color(0.5, 0.4, 0.3))
	vbox.add_child(header)

	# Ingredient list
	var needed: Array = recipe.get("ingredients", [])
	for ingredient_name in needed:
		var item_icon := _get_icon_for(ingredient_name)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		vbox.add_child(row)

		var check := Label.new()
		check.name = "check_" + ingredient_name
		check.text = "⬜"
		check.add_theme_font_size_override("font_size", 30)
		row.add_child(check)

		var lbl := Label.new()
		lbl.text = "%s %s" % [item_icon, ingredient_name]
		lbl.add_theme_font_size_override("font_size", 32)
		lbl.add_theme_color_override("font_color", Color(0.3, 0.25, 0.15))
		row.add_child(lbl)


## ===== SHELF — container-based layout so items sit on planks =====
func _build_shelf() -> void:
	var needed: Array = recipe.get("ingredients", [])
	var items_to_show: Array[Dictionary] = []

	for item_data in ALL_ITEMS:
		if item_data["name"] in needed:
			items_to_show.append(item_data)

	# Fill up to 15 items (3 rows × 5) with distractors
	var distractors: Array[Dictionary] = []
	for item_data in ALL_ITEMS:
		if item_data["name"] not in needed:
			distractors.append(item_data)
	distractors.shuffle()
	var fill_count := 15 - items_to_show.size()
	for i in mini(fill_count, distractors.size()):
		items_to_show.append(distractors[i])
	items_to_show.shuffle()

	# Main shelf structure using VBoxContainer
	var shelf_vbox := VBoxContainer.new()
	shelf_vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	shelf_vbox.add_theme_constant_override("separation", 0)
	shelf_container.add_child(shelf_vbox)

	# Wooden back panel behind everything
	var wood_back := ColorRect.new()
	wood_back.set_anchors_preset(Control.PRESET_FULL_RECT)
	wood_back.color = Color(0.45, 0.32, 0.18)
	shelf_container.add_child(wood_back)
	shelf_container.move_child(wood_back, 0)

	# Side boards
	var left_side := ColorRect.new()
	left_side.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	left_side.offset_right = 18
	left_side.color = Color(0.55, 0.38, 0.2)
	shelf_container.add_child(left_side)

	var right_side := ColorRect.new()
	right_side.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	right_side.offset_left = -18
	right_side.color = Color(0.55, 0.38, 0.2)
	shelf_container.add_child(right_side)

	# Split items into rows (shelves) of 5, 3 rows total
	var items_per_row := 5
	var row_count := ceili(items_to_show.size() / float(items_per_row))
	var item_idx := 0

	for row_i in row_count:
		# Each shelf row: items area + plank board
		var row_container := VBoxContainer.new()
		row_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
		row_container.add_theme_constant_override("separation", 0)
		shelf_vbox.add_child(row_container)

		# HBox holding items — alignment at bottom so they rest on the plank
		var shelf_row := HBoxContainer.new()
		shelf_row.size_flags_vertical = Control.SIZE_EXPAND_FILL
		shelf_row.alignment = BoxContainer.ALIGNMENT_CENTER
		shelf_row.add_theme_constant_override("separation", 8)
		row_container.add_child(shelf_row)

		for col_i in items_per_row:
			if item_idx >= items_to_show.size():
				break
			var item_data: Dictionary = items_to_show[item_idx]

			# Each item: a VBox with a spacer on top so item sits at bottom
			var item_slot := VBoxContainer.new()
			item_slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			item_slot.size_flags_vertical = Control.SIZE_EXPAND_FILL
			item_slot.add_theme_constant_override("separation", 0)
			shelf_row.add_child(item_slot)

			# Top spacer pushes content down
			var spacer := Control.new()
			spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
			item_slot.add_child(spacer)

			# The clickable item button — big emoji + name below
			var item_btn := Button.new()
			item_btn.flat = true
			item_btn.custom_minimum_size = Vector2(160, 160)
			item_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER

			# Use a VBoxContainer inside the button for layout
			var btn_content := VBoxContainer.new()
			btn_content.set_anchors_preset(Control.PRESET_FULL_RECT)
			btn_content.alignment = BoxContainer.ALIGNMENT_END
			btn_content.add_theme_constant_override("separation", 4)
			btn_content.mouse_filter = Control.MOUSE_FILTER_IGNORE
			item_btn.add_child(btn_content)

			var icon_lbl := Label.new()
			icon_lbl.text = item_data["icon"]
			icon_lbl.add_theme_font_size_override("font_size", 80)
			icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			icon_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
			btn_content.add_child(icon_lbl)

			var name_lbl := Label.new()
			name_lbl.text = item_data["name"]
			name_lbl.add_theme_font_size_override("font_size", 24)
			name_lbl.add_theme_color_override("font_color", Color(1, 1, 1, 0.9))
			name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			name_lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
			btn_content.add_child(name_lbl)

			item_btn.pressed.connect(_on_item_pressed.bind(item_data, item_btn))
			item_slot.add_child(item_btn)

			item_idx += 1

		# Plank board at the bottom of this row
		var plank := ColorRect.new()
		plank.custom_minimum_size = Vector2(0, 22)
		plank.color = Color(0.62, 0.44, 0.25)
		row_container.add_child(plank)

		# Plank front edge (darker strip for 3D effect)
		var plank_edge := ColorRect.new()
		plank_edge.custom_minimum_size = Vector2(0, 8)
		plank_edge.color = Color(0.5, 0.35, 0.18)
		row_container.add_child(plank_edge)


## ===== SHOPPING CART =====
func _build_cart() -> void:
	var cart_bg := ColorRect.new()
	cart_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	cart_bg.color = Color(0.96, 0.96, 0.93, 1)
	cart_area.add_child(cart_bg)

	var cart_border := ReferenceRect.new()
	cart_border.set_anchors_preset(Control.PRESET_FULL_RECT)
	cart_border.border_color = Color(0.75, 0.75, 0.7)
	cart_border.border_width = 3.0
	cart_border.editor_only = false
	cart_area.add_child(cart_border)

	var cart_title := Label.new()
	cart_title.text = "🛒 购物车"
	cart_title.add_theme_font_size_override("font_size", 28)
	cart_title.add_theme_color_override("font_color", Color(0.35, 0.3, 0.25))
	cart_title.position = Vector2(20, 10)
	cart_area.add_child(cart_title)

	var items_container := HBoxContainer.new()
	items_container.name = "CartItemsFlow"
	items_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	items_container.offset_top = 55
	items_container.offset_left = 20
	items_container.offset_right = -20
	items_container.offset_bottom = -10
	items_container.add_theme_constant_override("separation", 16)
	items_container.alignment = BoxContainer.ALIGNMENT_CENTER
	cart_area.add_child(items_container)


## ===== INTERACTIONS =====
func _on_item_pressed(item_data: Dictionary, btn: Button) -> void:
	var item_name: String = item_data["name"]
	if item_name in cart:
		return

	var needed: Array = recipe.get("ingredients", [])
	if item_name in needed:
		cart.append(item_name)
		btn.modulate = Color(0.5, 0.5, 0.5, 0.4)
		btn.disabled = true

		# Add to cart
		var cart_container := cart_area.get_node("CartItemsFlow") as HBoxContainer
		var cart_item := Label.new()
		cart_item.text = item_data["icon"]
		cart_item.add_theme_font_size_override("font_size", 64)
		cart_container.add_child(cart_item)

		# Bounce
		cart_item.scale = Vector2(0.2, 0.2)
		var tween := create_tween()
		tween.tween_property(cart_item, "scale", Vector2(1.2, 1.2), 0.15)\
			.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
		tween.tween_property(cart_item, "scale", Vector2.ONE, 0.1)

		# Update recipe check
		_update_recipe_check(item_name)

		# Check if done
		if cart.size() >= needed.size():
			checkout_btn.disabled = false
			var btn_tween := create_tween().set_loops(3)
			btn_tween.tween_property(checkout_btn, "scale", Vector2(1.05, 1.05), 0.2)
			btn_tween.tween_property(checkout_btn, "scale", Vector2.ONE, 0.2)
	else:
		# Wrong — shake
		var tween := create_tween()
		tween.tween_property(btn, "position:x", btn.position.x + 14, 0.04)
		tween.tween_property(btn, "position:x", btn.position.x - 14, 0.04)
		tween.tween_property(btn, "position:x", btn.position.x + 7, 0.04)
		tween.tween_property(btn, "position:x", btn.position.x, 0.04)


func _update_recipe_check(ingredient_name: String) -> void:
	var check_node := recipe_book.find_child("check_" + ingredient_name, true, false)
	if check_node and check_node is Label:
		check_node.text = "✅"


func _on_checkout() -> void:
	shopping_done.emit(cart)


func _get_icon_for(ingredient_name: String) -> String:
	for item in ALL_ITEMS:
		if item["name"] == ingredient_name:
			return item["icon"]
	return "❓"
