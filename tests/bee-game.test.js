import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.runInNewContext(readFileSync(new URL('../bee-game/model.js', import.meta.url), 'utf8'), sandbox);
const BeeGame = sandbox.window.BeeGameModel;
const tick = (game, seconds, direction = 0) => {
  for (let i = 0; i < seconds * 60; i++) game.update(1 / 60, direction);
};

test('does not fire until started, then fires automatically and clamps movement', () => {
  const game = new BeeGame(400);
  tick(game, 1);
  assert.equal(game.shots.length, 0);
  game.start();
  tick(game, 0.2, -1);
  assert.ok(game.shots.length > 0);
  tick(game, 2, -1);
  assert.equal(game.player.x, 30);
  tick(game, 2, 1);
  assert.equal(game.player.x, 370);
});

test('star hits score once and remove the target', () => {
  const game = new BeeGame();
  game.start();
  const enemy = game.enemies[0];
  game.shots.push({ x: enemy.x, y: enemy.y + 2 }, { x: enemy.x, y: enemy.y + 2 });
  game.update(0.001);
  assert.equal(game.score, 10);
  assert.equal(game.enemies.length, 9);
});

test('bubbles cost one heart, shield prevents repeated damage, then expires', () => {
  const game = new BeeGame();
  game.start();
  game.bubbles.push({ x: game.player.x, y: game.player.y });
  game.update(0.001);
  assert.equal(game.hearts, 2);
  assert.ok(game.player.shield > 0);
  game.hit();
  assert.equal(game.hearts, 2);
  game.bubbleIn = 100;
  tick(game, 2.6);
  game.hit();
  assert.equal(game.hearts, 1);
  game.player.shield = 0;
  game.hit();
  assert.equal(game.status, 'rest');
  const score = game.score;
  tick(game, 4);
  assert.equal(game.score, score);
});

test('pause freezes all simulation state and resumes without a catch-up jump', () => {
  const game = new BeeGame();
  game.start();
  tick(game, 0.5);
  game.pause();
  const snapshot = JSON.stringify(game);
  tick(game, 20, 1);
  game.moveTo(30);
  assert.equal(JSON.stringify(game), snapshot);
  game.resume();
  const x = game.player.x;
  game.update(100, 1);
  assert.ok(game.player.x - x <= 16.5);
});

test('all three waves can be cleared via shot collisions and game ends in a win', () => {
  const game = new BeeGame(600, () => 0);
  game.start();
  for (let level = 1; level <= 3; level++) {
    assert.equal(game.level, level);
    assert.equal(game.enemies.length, (level + 1) * 5);
    for (const enemy of game.enemies) game.shots.push({ x: enemy.x, y: enemy.y + 1 });
    game.update(0.001);
    assert.equal(game.enemies.length, 0);
    assert.equal(game.bubbles.length, 0);
    if (level < 3) tick(game, 1.6);
  }
  assert.equal(game.status, 'won');
  assert.equal(game.score, 450);
});

test('restart resets score, health, projectiles, shield and wave after a loss', () => {
  const game = new BeeGame();
  game.start();
  game.score = 120;
  for (let i = 0; i < 3; i++) {
    game.player.shield = 0;
    game.hit();
  }
  game.reset();
  assert.equal(game.status, 'ready');
  assert.equal(game.score, 0);
  assert.equal(game.level, 1);
  assert.equal(game.hearts, 3);
  assert.equal(game.player.shield, 0);
  assert.equal(game.shots.length, 0);
  assert.equal(game.bubbles.length, 0);
  assert.equal(game.enemies.length, 10);
});

test('resize preserves relative player and projectile positions and keeps formation inside', () => {
  const game = new BeeGame(900);
  game.shots.push({ x: 450, y: 400 });
  game.resize(380);
  assert.equal(game.player.x, 190);
  assert.equal(game.shots[0].x, 190);
  for (const enemy of game.enemies) assert.ok(enemy.x > 28 && enemy.x < 352);
});
