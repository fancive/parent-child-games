extends Control
## Splash / loading screen shown at app launch.
## Animates a progress bar, then transitions to game select.

@onready var loading_bar: ProgressBar = %LoadingBar
@onready var timer: Timer = %Timer

var _tween: Tween


func _ready() -> void:
	# Animate the icon bouncing
	var icon := $CenterContainer/VBoxContainer/Icon
	var bounce_tween := create_tween().set_loops()
	bounce_tween.tween_property(icon, "position:y", -12.0, 0.6)\
		.as_relative().set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_SINE)
	bounce_tween.tween_property(icon, "position:y", 12.0, 0.6)\
		.as_relative().set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_SINE)

	# Animate loading bar
	_tween = create_tween()
	_tween.tween_property(loading_bar, "value", 1.0, 1.8)\
		.set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_CUBIC)

	timer.timeout.connect(_on_timer_timeout)


func _on_timer_timeout() -> void:
	SceneTransition.change_scene("res://src/shared/game_select.tscn")
