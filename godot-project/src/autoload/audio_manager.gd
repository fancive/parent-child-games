extends Node
## Global audio manager.
## Handles BGM and SFX with simple crossfade support.

var _bgm_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _bgm_tween: Tween

const MAX_SFX_CHANNELS := 4
const BGM_FADE_DURATION := 0.8


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_bgm_player = AudioStreamPlayer.new()
	_bgm_player.bus = "Music"
	_bgm_player.volume_db = -6.0
	add_child(_bgm_player)

	for i in MAX_SFX_CHANNELS:
		var player := AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		_sfx_players.append(player)


## Play background music with optional crossfade
func play_bgm(stream: AudioStream, fade_in := true) -> void:
	if _bgm_player.stream == stream and _bgm_player.playing:
		return

	if _bgm_tween:
		_bgm_tween.kill()

	if fade_in and _bgm_player.playing:
		_bgm_tween = create_tween()
		_bgm_tween.tween_property(_bgm_player, "volume_db", -40.0, BGM_FADE_DURATION)
		_bgm_tween.tween_callback(func():
			_bgm_player.stream = stream
			_bgm_player.play()
			var fade_tween := create_tween()
			fade_tween.tween_property(_bgm_player, "volume_db", -6.0, BGM_FADE_DURATION)
		)
	else:
		_bgm_player.stream = stream
		_bgm_player.volume_db = -6.0
		_bgm_player.play()


func stop_bgm(fade_out := true) -> void:
	if not _bgm_player.playing:
		return
	if fade_out:
		if _bgm_tween:
			_bgm_tween.kill()
		_bgm_tween = create_tween()
		_bgm_tween.tween_property(_bgm_player, "volume_db", -40.0, BGM_FADE_DURATION)
		_bgm_tween.tween_callback(_bgm_player.stop)
	else:
		_bgm_player.stop()


## Play a one-shot sound effect
func play_sfx(stream: AudioStream, volume_db := 0.0) -> void:
	for player in _sfx_players:
		if not player.playing:
			player.stream = stream
			player.volume_db = volume_db
			player.play()
			return
	# All channels busy — steal the oldest
	_sfx_players[0].stream = stream
	_sfx_players[0].volume_db = volume_db
	_sfx_players[0].play()
