import './style.css'
import Phaser from 'phaser'

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Calculate scaling factors based on original 1080x1920 resolution
const scaleX = sizes.width / 1080
const scaleY = sizes.height / 1920
const scale = Math.min(scaleX, scaleY) // Use the smaller scale to maintain aspect ratio

// Game parameters
const GRAVITY = 800
const JUMP_FORCE = -250
const OBSTACLE_SPEED = 200
const OBSTACLE_GAP_MIN = 150
const OBSTACLE_GAP_MAX = 250
const OBSTACLE_SPAWN_DISTANCE = 300

const gameStartDiv = document.querySelector('#gameStartDiv')
const gameStartBtn = document.querySelector('#gameStartBtn')
const gameEndDiv = document.querySelector('#gameEndDiv')
const gameEndScoreSpan = document.querySelector('#gameEndScoreSpan')
const gameWinLoseSpan = document.querySelector('#gameWinLoseSpan')
const retryBtn = document.querySelector('#retryBtn')

class GameScene extends Phaser.Scene {
  constructor() {
    super('gameScene')
    this.player
    this.obstacles = []
    this.score = 0
    this.textScore
    this.gameStarted = false
    this.gameOver = false
    this.lastObstacleX = sizes.width + OBSTACLE_SPAWN_DISTANCE
    this.passedObstacles = new Set() // Track obstacles that have been passed for scoring
    this.tapTimes = [] // Track tap timestamps for combo detection
    this.comboWindow = 300 // Time window for combo taps (milliseconds)
  }

  // ========================================
  // MAIN PHASER LIFECYCLE METHODS
  // ========================================
  
  preload() {
    // Load background
    this.load.image('bg', '/public/assets/cryptoBgd.png')
    
    // Load player sprite (rocket)
    this.load.image('player', '/public/assets/rocket.png')
    
    // Load obstacle sprite
    this.load.image('obstacle', '/public/assets/obstacle.png')
    
    // Load audio
    this.load.audio('flapSound', '/public/assets/coin.mp3')
    this.load.audio('bgMusic', '/public/assets/bgMusic.mp3')
    this.load.audio('collisionSound', '/public/assets/incorrect.mp3')
  }

  create() {
    this.scene.pause('gameScene')
    this.initializeAudio()
    this.createBackground()
    this.createPlayer()
    this.createUI()
    this.setupInput()
  }

  update() {
    if (!this.gameStarted || this.gameOver) return
    
    this.spawnObstacles()
    this.updateObstacles()
    this.checkScoring()
    this.checkCollisions()
  }

  // ========================================
  // GAME SETUP HELPER METHODS
  // ========================================

  initializeAudio() {
    this.flapSound = this.sound.add('flapSound')
    this.bgMusic = this.sound.add('bgMusic')
    this.collisionSound = this.sound.add('collisionSound')
    this.bgMusic.play({ loop: true })
  }

  createBackground() {
    const bg = this.add.image(0, 0, 'bg').setOrigin(0, 0)
    
    // Calculate scale to ensure full height coverage
    const bgScaleY = sizes.height / bg.height
    const bgScaleX = sizes.width / bg.width
    
    // Use the larger scale to ensure full coverage, prioritizing height
    const bgScale = Math.max(bgScaleX, bgScaleY)
    
    bg.setScale(bgScale)
  }

  createPlayer() {
    this.player = this.physics.add
      .image(sizes.width / 3, sizes.height / 2, 'player')
      .setOrigin(0.5, 0.5)
      .setScale(scale * 0.8)
      .setCollideWorldBounds(true)
    
    // Enable gravity for the player
    this.player.body.setGravityY(GRAVITY)
    this.player.body.setMaxVelocity(0, 500)
  }

  createUI() {
    // Calculate responsive font size based on screen width
    const fontSize = Math.max(20, Math.min(35, sizes.width / 30))
    const strokeThickness = Math.max(1, Math.min(3, sizes.width / 400))
    
    this.textScore = this.add.text(sizes.width / 2, 50, 'Score: 0', {
      font: `${fontSize}px Arial`,
      fill: "#FFFFFF",
      stroke: "#000000",
      strokeThickness: strokeThickness
    }).setOrigin(0.5, 0.5)
  }

  setupInput() {
    // Tap/click to flap
    this.input.on('pointerdown', () => {
      if (this.gameStarted && !this.gameOver) {
        this.flap()
      }
    })
    
    // Spacebar to flap
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameStarted && !this.gameOver) {
        this.flap()
      }
    })
  }

  // ========================================
  // GAME LOGIC METHODS
  // ========================================

  flap() {
    const currentTime = this.time.now
    
    // Add current tap time
    this.tapTimes.push(currentTime)
    
    // Remove taps outside the combo window
    this.tapTimes = this.tapTimes.filter(time => currentTime - time <= this.comboWindow)
    
    // Calculate jump force based on combo
    const comboCount = this.tapTimes.length
    let jumpForce = JUMP_FORCE
    
    if (comboCount >= 2) {
      // Combo bonus: each additional tap adds more force
      const comboBonus = (comboCount - 1) * 50
      jumpForce = JUMP_FORCE - comboBonus
    }
    
    // Apply the jump force
    this.player.body.setVelocityY(jumpForce)
    this.flapSound.play()
    
    // Reset combo after a short delay
    this.time.delayedCall(500, () => {
      this.tapTimes = []
    })
  }

  spawnObstacles() {
    // Spawn obstacles more fluently
    // Check if we need to spawn a new obstacle pair
    if (this.obstacles.length === 0 || 
        (this.obstacles.length > 0 && this.obstacles[this.obstacles.length - 1].top.x < sizes.width - OBSTACLE_SPAWN_DISTANCE)) {
      this.createObstaclePair()
    }
  }

  createObstaclePair() {
    const gapSize = Phaser.Math.Between(OBSTACLE_GAP_MIN, OBSTACLE_GAP_MAX)
    const gapY = Phaser.Math.Between(
      gapSize / 2 + 50, 
      sizes.height - gapSize / 2 - 50
    )
    
    // Top obstacle
    const topObstacle = this.physics.add
      .image(sizes.width, gapY - gapSize / 2, 'obstacle')
      .setOrigin(0.5, 1)
      .setScale(scale)
    
    // Bottom obstacle
    const bottomObstacle = this.physics.add
      .image(sizes.width, gapY + gapSize / 2, 'obstacle')
      .setOrigin(0.5, 0)
      .setScale(scale)
    
    // Set velocity to move left
    topObstacle.body.setVelocityX(-OBSTACLE_SPEED)
    bottomObstacle.body.setVelocityX(-OBSTACLE_SPEED)
    
    // Store obstacles as a pair
    const obstaclePair = {
      top: topObstacle,
      bottom: bottomObstacle,
      passed: false
    }
    
    this.obstacles.push(obstaclePair)
    
    // Set up collision detection
    this.physics.add.overlap(this.player, topObstacle, this.hitObstacle, null, this)
    this.physics.add.overlap(this.player, bottomObstacle, this.hitObstacle, null, this)
  }

  updateObstacles() {
    // Remove obstacles that have moved off screen
    this.obstacles = this.obstacles.filter(obstaclePair => {
      if (obstaclePair.top.x < -200) {
        obstaclePair.top.destroy()
        obstaclePair.bottom.destroy()
        return false
      }
      return true
    })
  }

  checkScoring() {
    // Check if player has passed through any obstacle pairs
    this.obstacles.forEach(obstaclePair => {
      if (!obstaclePair.passed && this.player.x > obstaclePair.top.x + 50) {
        obstaclePair.passed = true
        this.updateScore()
      }
    })
  }

  checkCollisions() {
    // Check if player hit the ground or ceiling
    if (this.player.y >= sizes.height - 50 || this.player.y <= 50) {
      this.hitObstacle()
    }
  }

  hitObstacle() {
    if (this.gameOver) return
    
    this.gameOver = true
    this.collisionSound.play()
    this.endGame()
  }

  updateScore() {
    this.score++
    this.textScore.setText(`Score: ${this.score}`)
  }

  endGame() {
    this.game.scene.pause('gameScene')
    this.displayGameResults()
  }

  displayGameResults() {
    gameEndScoreSpan.textContent = this.score
    gameWinLoseSpan.textContent = `Final Score: ${this.score}`
    gameEndDiv.style.display = 'flex'
  }

  resetGame() {
    // Reset game state
    this.score = 0
    this.gameStarted = false
    this.gameOver = false
    this.obstacles = []
    this.passedObstacles.clear()
    this.lastObstacleX = sizes.width + OBSTACLE_SPAWN_DISTANCE
    this.tapTimes = [] // Reset combo tap tracking
    
    // Reset player position
    this.player.setPosition(sizes.width / 3, sizes.height / 2)
    this.player.body.setVelocity(0, 0)
    
    // Reset UI
    this.textScore.setText('Score: 0')
    
    // Hide game over screen
    gameEndDiv.style.display = 'none'
    
    // Resume scene
    this.scene.resume('gameScene')
  }

  startGame() {
    this.gameStarted = true
    this.gameOver = false
    // Create first obstacle immediately
    this.createObstaclePair()
  }
}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // We'll handle gravity manually for the player
      debug: false
    }
  },
  scene: [GameScene]
}

const game = new Phaser.Game(config)

// Get reference to the game scene
let gameScene

game.events.on('ready', () => {
  gameScene = game.scene.getScene('gameScene')
})

gameStartBtn.addEventListener('click', () => {
  gameStartDiv.style.display = 'none'
  game.scene.resume('gameScene')
  gameScene.startGame()
})

retryBtn.addEventListener('click', () => {
  gameScene.resetGame()
})