import './style.css'
import Phaser from 'phaser'
import phaserJuice from '../phaser3-juice-plugin-master/docs/lib/phaserJuice.min.js'
import { sizes, speedDown, MAX_TOTAL_TARGETS, MAX_PENALTY_TARGETS } from './constants.js'
import * as gameSetup from './gameSetup.js'
import * as gameUpdate from './gameUpdate.js'

const gameStartDiv = document.querySelector('#gameStartDiv')
const gameStartBtn = document.querySelector('#gameStartBtn')
const gameEndDiv = document.querySelector('#gameEndDiv')
const gameEndScoreSpan = document.querySelector('#gameEndScoreSpan')

class GameScene extends Phaser.Scene {
  constructor() {
    super('gameScene')
    this.player
    this.cursor
    this.targets = []
    this.bonusTargets = []
    this.penaltyTargets = []
    this.playerSpeed = speedDown + 50
    this.points = 0
    this.lives = 5
    this.textScore
    this.textLives
    this.scoreBox
    this.livesBox
    this.bonusBurstEmitter
    this.coinMusic
    this.bgMusic
    this.successEmitter
    this.penaltyEmitter
    this.targetCount = 1
    this.targetSpawnCounter = 0
    this.penaltySpawnCounter = 0
    this.hitTargets = new Set()
    this.isGameOver = false
  }

  preload() {
    this.load.image('bg', '/assets/cryptoBgd.png')
    this.load.image('wallet', '/assets/wallet.png')
    this.load.image('coin', '/assets/coin.png')
    this.load.image('bonusCoin', '/assets/bonusCoin.png')
    this.load.image('penaltyTarget', '/assets/penaltyCoin.png')
    this.load.image('money', '/assets/money.png')
    this.load.image('success', '/assets/success.png')
    this.load.image('penalty', '/assets/penalty.png')

    this.load.audio('coinMusic', '/assets/coin.mp3')
    this.load.audio('bgMusic', '/assets/bgMusic.mp3')
    this.load.audio('penaltySound', '/assets/incorrect.mp3')
  }

  create() {
    this.juice = new phaserJuice(this)
    this.scene.pause('gameScene')
    gameSetup.initializeAudio(this)
    gameSetup.createBackground(this)
    gameSetup.createPlayer(this)
    // Create targets on first resume so physics/overlap are active and first coin triggers
    gameSetup.createUI(this)
    gameSetup.createParticles(this)

    this.events.once('resume', () => {
      gameSetup.createInitialTargets(this)
      gameSetup.setupCollisions(this)
      this.juice.wobble(this.player, { x: 8 })
    })

    // Delegate methods so collision handlers and updateScore/loseLife can call them
    this.createTarget = () => gameSetup.createTarget(this)
    this.createBonusTarget = () => gameSetup.createBonusTarget(this)
    this.createPenaltyTarget = () => gameSetup.createPenaltyTarget(this)
    this.drawScoreBox = (padding) => gameSetup.drawScoreBox(this, padding)
    this.drawLivesBox = (padding) => gameSetup.drawLivesBox(this, padding)
    this.updateTargetCount = () => gameUpdate.updateTargetCount(this)
  }

  update() {
    if (this.isGameOver) return
    // Stop phone wobble as soon as the user drags so the hitbox follows the finger
    if (this.input.activePointer.isDown && this.juice.wobbleTween?.isPlaying()) {
      this.juice.wobbleTween.stop()
    }
    gameUpdate.handleTargetSpawning(this)
    gameUpdate.handlePlayerMovement(this)
  }

  targetHit(target, player) {
    if (this.isGameOver) return
    this.coinMusic.play()
    this.successEmitter.start()
    this.updateScore(1)

    const targetIndex = this.targets.indexOf(target)
    if (targetIndex !== -1) this.targets.splice(targetIndex, 1)
    target.destroy()

    if (this.targets.length + this.bonusTargets.length + this.penaltyTargets.length < MAX_TOTAL_TARGETS) {
      this.createTarget()
    }
  }

  bonusTargetHit(bonusTarget, player) {
    if (this.isGameOver) return
    this.coinMusic.play()
    this.successEmitter.start()
    this.updateScore(3)

    this.time.delayedCall(0, () => {
      const x = this.player.x
      const y = this.player.y + this.player.displayHeight / 2
      this.bonusBurstEmitter.setPosition(x, y)
      this.bonusBurstEmitter.explode(10, x, y)
    })

    const bonusIndex = this.bonusTargets.indexOf(bonusTarget)
    if (bonusIndex !== -1) this.bonusTargets.splice(bonusIndex, 1)
    bonusTarget.destroy()

    if (this.targets.length + this.bonusTargets.length + this.penaltyTargets.length < MAX_TOTAL_TARGETS) {
      this.createBonusTarget()
    }
  }

  penaltyTargetHit(penaltyTarget, player) {
    if (this.isGameOver) return
    this.penaltySound.play()
    this.penaltyEmitter.start()
    this.loseLife()

    const penaltyIndex = this.penaltyTargets.indexOf(penaltyTarget)
    if (penaltyIndex !== -1) this.penaltyTargets.splice(penaltyIndex, 1)
    penaltyTarget.destroy()

    if (
      this.targets.length + this.bonusTargets.length + this.penaltyTargets.length < MAX_TOTAL_TARGETS &&
      this.penaltyTargets.length < MAX_PENALTY_TARGETS
    ) {
      this.createPenaltyTarget()
    }
  }

  updateScore(points = 1) {
    this.points += points
    this.textScore.setText(`Score: ${this.points}`)
    this.drawScoreBox(10)
    this.updateTargetCount()

    // Stop any existing pulse so it doesn't stack, reset scale, then short pulse
    this.tweens.getTweensOf(this.textScore).forEach((t) => t.stop())
    this.juice.reset(this.textScore)
    this.juice.pulse(this.textScore, { duration: 120, repeat: 1 })
  }

  loseLife() {
    this.lives--
    this.textLives.setText(`Lives: ${this.lives}`)
    this.drawLivesBox(10)

    this.juice.shake(this.textLives, { x: 0, y: 4, duration: 35, repeat: 4 })

    if (this.lives <= 0) {
      this.isGameOver = true
      const allVisible = [
        this.player,
        ...this.targets,
        ...this.bonusTargets,
        ...this.penaltyTargets
      ]
      this.tweens.add({
        targets: allVisible,
        alpha: 0,
        duration: 1500,
        onComplete: () => this.gameOver()
      })
    }
  }

  gameOver() {
    this.displayGameResults()
  }

  displayGameResults() {
    gameEndScoreSpan.textContent = this.points
    gameEndDiv.setAttribute('aria-hidden', 'false')
  }
}

const gameCanvas = document.querySelector('#gameCanvas')
const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: speedDown },
      debug: false
    }
  },
  scene: [GameScene]
}

const game = new Phaser.Game(config)

gameStartBtn.addEventListener('click', () => {
  gameStartDiv.style.display = 'none'
  game.scene.resume('gameScene')
})
