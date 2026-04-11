extends CanvasLayer
## Handles smooth scene transitions with a fade animation.

signal transition_midpoint
signal transition_finished

var _color_rect: ColorRect
var _is_transitioning := false

const FADE_DURATION := 0.4


func _ready() -> void:
	layer = 100
	_color_rect = ColorRect.new()
	_color_rect.color = Color(0.15, 0.12, 0.1, 1.0)
	_color_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	_color_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_color_rect.modulate.a = 0.0
	add_child(_color_rect)


func change_scene(scene_path: String) -> void:
	if _is_transitioning:
		return
	_is_transitioning = true
	_color_rect.mouse_filter = Control.MOUSE_FILTER_STOP

	var tween := create_tween()
	tween.tween_property(_color_rect, "modulate:a", 1.0, FADE_DURATION)\
		.set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_CUBIC)
	tween.tween_callback(func():
		transition_midpoint.emit()
		get_tree().change_scene_to_file(scene_path)
	)
	tween.tween_interval(0.1)
	tween.tween_property(_color_rect, "modulate:a", 0.0, FADE_DURATION)\
		.set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
	tween.tween_callback(func():
		_is_transitioning = false
		_color_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		transition_finished.emit()
	)
