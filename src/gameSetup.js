import { sizes, scale, speedDown, MAX_TOTAL_TARGETS, MAX_PENALTY_TARGETS } from './constants.js'

export function initializeAudio(scene) {
  scene.coinMusic = scene.sound.add('coinMusic')
  scene.bgMusic = scene.sound.add('bgMusic')
  scene.penaltySound = scene.sound.add('penaltySound')
  scene.bgMusic.play()
}

export function createBackground(scene) {
  const bg = scene.add.image(0, 0, 'bg').setOrigin(0, 0)
  const bgScaleY = sizes.height / bg.height
  const bgScaleX = sizes.width / bg.width
  const bgScale = Math.max(bgScaleX, bgScaleY)
  bg.setScale(bgScale)
}

export function createPlayer(scene) {
  scene.player = scene.physics.add
    .image(sizes.width / 2, sizes.height * (2 / 3) - (100 * scale), 'wallet')
    .setOrigin(0.5, 0)
    .setCollideWorldBounds(true)
    .setScale(scale)

  scene.player
    .setSize(scene.player.width - scene.player.width / 4, scene.player.height / 3)
    .setOffset(scene.player.width / 10, scene.player.height - scene.player.height / 3)
  scene.player.body.allowGravity = false
}

export function createInitialTargets(scene) {
  for (let i = 0; i < scene.targetCount; i++) {
    createTarget(scene)
  }
}

export function createTarget(scene) {
  const target = scene.physics.add
    .image(0, 0, 'coin')
    .setOrigin(0, 0)
    .setScale(scale)
    .setMaxVelocity(0, speedDown)

  target.setY(0)
  target.setX(getRandomX(scene))
  target.targetType = 'regular'
  scene.targets.push(target)

  setupTargetCollision(scene, target)

  if (
    shouldSpawnBonusTarget(scene) &&
    scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < MAX_TOTAL_TARGETS
  ) {
    createBonusTarget(scene)
  }

  if (
    shouldSpawnPenaltyTarget(scene) &&
    scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < MAX_TOTAL_TARGETS &&
    scene.penaltyTargets.length < MAX_PENALTY_TARGETS
  ) {
    createPenaltyTarget(scene)
  }

  return target
}

export function createBonusTarget(scene) {
  const bonusTarget = scene.physics.add
    .image(0, 0, 'bonusCoin')
    .setOrigin(0, 0)
    .setScale(scale)
    .setMaxVelocity(0, speedDown)

  bonusTarget.setY(0)
  bonusTarget.setX(getRandomX(scene))
  bonusTarget.targetType = 'bonus'
  scene.bonusTargets.push(bonusTarget)

  setupBonusTargetCollision(scene, bonusTarget)
  return bonusTarget
}

export function createPenaltyTarget(scene) {
  const penaltyTarget = scene.physics.add
    .image(0, 0, 'penaltyTarget')
    .setOrigin(0, 0)
    .setScale(scale)
    .setMaxVelocity(0, speedDown)

  penaltyTarget.setY(0)
  penaltyTarget.setX(getRandomX(scene))
  penaltyTarget.targetType = 'penalty'
  scene.penaltyTargets.push(penaltyTarget)

  setupPenaltyTargetCollision(scene, penaltyTarget)
  return penaltyTarget
}

export function setupCollisions(scene) {
  scene.targets.forEach((target) => setupTargetCollision(scene, target))
  scene.bonusTargets.forEach((bonusTarget) => setupBonusTargetCollision(scene, bonusTarget))
  scene.penaltyTargets.forEach((penaltyTarget) => setupPenaltyTargetCollision(scene, penaltyTarget))
}

export function setupTargetCollision(scene, target) {
  scene.physics.add.overlap(target, scene.player, scene.targetHit, null, scene)
}

export function setupBonusTargetCollision(scene, bonusTarget) {
  scene.physics.add.overlap(bonusTarget, scene.player, scene.bonusTargetHit, null, scene)
}

export function setupPenaltyTargetCollision(scene, penaltyTarget) {
  scene.physics.add.overlap(penaltyTarget, scene.player, scene.penaltyTargetHit, null, scene)
}

export function createUI(scene) {
  const fontSize = Math.max(20, Math.min(35, sizes.width / 30))
  const strokeThickness = Math.max(1, Math.min(3, sizes.width / 400))
  const padding = 10

  // Score on the left
  scene.textScore = scene.add.text(10, 10, 'Score: 0', {
    font: `bold ${fontSize}px Arial`,
    fill: '#000000',
    stroke: '#000000',
    strokeThickness
  })
  scene.textScore.setDepth(1)

  // Lives on the right (origin 1,0 = right-align so x is the right edge)
  scene.textLives = scene.add.text(sizes.width - 10, 10, 'Lives: 5', {
    font: `bold ${fontSize}px Arial`,
    fill: '#000000',
    stroke: '#000000',
    strokeThickness
  })
  scene.textLives.setOrigin(1, 0)
  scene.textLives.setDepth(1)

  // White boxes behind text for readability (depth 0 so below text at depth 1)
  drawScoreBox(scene, padding)
  drawLivesBox(scene, padding)
  scene.scoreBox.setDepth(0)
  scene.livesBox.setDepth(0)
}

export function drawScoreBox(scene, padding) {
  if (scene.scoreBox) scene.scoreBox.destroy()
  scene.scoreBox = scene.add.graphics()
  scene.scoreBox.fillStyle(0xffffff, 0.92)
  const w = Math.max(scene.textScore.width + padding * 2, 120)
  const h = scene.textScore.height + padding * 2
  scene.scoreBox.fillRoundedRect(
    scene.textScore.x - padding,
    scene.textScore.y - padding,
    w,
    h,
    6
  )
  scene.scoreBox.setDepth(0)
}

export function drawLivesBox(scene, padding) {
  if (scene.livesBox) scene.livesBox.destroy()
  scene.livesBox = scene.add.graphics()
  scene.livesBox.fillStyle(0xffffff, 0.92)
  const w = Math.max(scene.textLives.width + padding * 2, 100)
  const h = scene.textLives.height + padding * 2
  // textLives has origin (1,0) so x is the right edge; left edge = x - width
  scene.livesBox.fillRoundedRect(
    scene.textLives.x - scene.textLives.width - padding,
    scene.textLives.y - padding,
    w,
    h,
    6
  )
  scene.livesBox.setDepth(0)
}

export function createParticles(scene) {
  scene.successEmitter = scene.add.particles(0, 0, 'success', {
    speed: 100,
    gravityY: speedDown - 200,
    scale: 0.04,
    duration: 100,
    emitting: false
  })
  // Emit from middle of phone: origin (0.5,0) so (0,0) is top-center; displayHeight/2 is vertical center
  scene.successEmitter.startFollow(scene.player, 0, scene.player.displayHeight / 2, true)

  scene.penaltyEmitter = scene.add.particles(0, 0, 'penaltyTarget', {
    speed: 100,
    gravityY: speedDown - 200,
    scale: 0.04,
    duration: 100,
    emitting: false
  })
  scene.penaltyEmitter.startFollow(scene.player, 0, scene.player.displayHeight / 2, true)

  const scoreCenterX = scene.textScore.x + scene.textScore.width / 2
  const scoreBurstY = scene.textScore.y + scene.textScore.height + 12
  scene.bonusBurstEmitter = scene.add.particles(scoreCenterX, scoreBurstY, 'bonusCoin', {
    speed: { min: 100, max: 220 },
    angle: { min: 250, max: 290 },
    scale: { start: 0.28, end: 0.06 },
    lifespan: 700,
    gravityY: 220,
    quantity: 10,
    emitting: false
  })
}

export function shouldSpawnBonusTarget(scene) {
  scene.targetSpawnCounter++
  if (scene.targetSpawnCounter >= 5) {
    scene.targetSpawnCounter = 0
    return true
  }
  return false
}

export function shouldSpawnPenaltyTarget(scene) {
  scene.penaltySpawnCounter++
  if (scene.penaltySpawnCounter >= 6) {
    scene.penaltySpawnCounter = 0
    return true
  }
  return false
}

export function getRandomX(scene) {
  return Math.random() * (sizes.width - 100 * scale)
}
