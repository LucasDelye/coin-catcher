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

const speedDown = 500

const gameStartDiv = document.querySelector('#gameStartDiv')
const gameStartBtn = document.querySelector('#gameStartBtn')
const gameEndDiv = document.querySelector('#gameEndDiv')
const gameEndScoreSpan = document.querySelector('#gameEndScoreSpan')
const gameWinLoseSpan = document.querySelector('#gameWinLoseSpan')

class GameScene extends Phaser.Scene {
  constructor() {
    super('gameScene')
    this.player
    this.cursor
    this.target
    this.playerSpeed = speedDown + 50
    this.points = 0
    this.textScore
    this.textTime
    this.timedEvent
    this.remainingTime
    this.coinMusic
    this.bgMusic
    this.emitter
  }

  // ========================================
  // MAIN PHASER LIFECYCLE METHODS
  // ========================================
  
  preload() {
    this.load.image('bg', '/public/assets/cryptoBgd.png')
    this.load.image('basket', '/public/assets/wallet.png')
    this.load.image('apple', '/public/assets/coin.png')
    this.load.image('money', '/public/assets/money.png')
    
    this.load.audio('coinMusic', '/public/assets/coin.mp3')
    this.load.audio('bgMusic', '/public/assets/bgMusic.mp3')
  }

  create() {
    this.scene.pause('gameScene')
    this.initializeAudio()
    this.createBackground()
    this.createPlayer()
    this.createTarget()
    this.setupCollisions()
    this.createUI()
    this.createParticles()
    this.startGameTimer()
  }

  update(){
    this.updateTimer()
    this.handleTargetSpawning()
    this.handlePlayerMovement()
  }

  // ========================================
  // GAME SETUP HELPER METHODS
  // ========================================

  initializeAudio() {
    this.coinMusic = this.sound.add('coinMusic')
    this.bgMusic = this.sound.add('bgMusic')
    this.bgMusic.play()
  }

  createBackground() {
    this.add.image(0, 0, 'bg').setOrigin(0, 0)
  }

  createPlayer() {
    this.player = this.physics.add
      .image(0, sizes.height - (100 * scale), 'basket')
      .setOrigin(0, 0)
      .setCollideWorldBounds(true)
      .setScale(scale)
      
    this.player.setSize(this.player.width - this.player.width/4, this.player.height/3)
      .setOffset(this.player.width/10, this.player.height - this.player.height/3)
    this.player.body.allowGravity = false
  }

  createTarget() {
    this.target = this.physics.add
      .image(0, 0, 'apple')
      .setOrigin(0, 0)
      .setScale(scale)
      .setMaxVelocity(0, speedDown)
  }

  setupCollisions() {
    this.physics.add.overlap(this.target, this.player, this.targetHit, null, this)
  }

  createUI() {
    this.textScore = this.add.text(sizes.width - 120, 10, 'Score: 0', {
      font: '25xp  Arial',
      fill: "#000000"
    })

    this.textTime = this.add.text(10, 10, 'Remaining Time: 00', {
      font: '25xp Arial',
      fill: '#000000'
    })
  }

  createParticles() {
    this.emitter = this.add.particles(0, 0, 'money', {
      speed: 100,
      gravityY: speedDown - 200,
      scale: 0.04,
      duration: 100,
      emitting: false
    })
    this.emitter.startFollow(this.player, this.player.width / 2, this.player.height / 2, true)
  }

  startGameTimer() {
    this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this)
  }

  // ========================================
  // GAME UPDATE HELPER METHODS
  // ========================================

  updateTimer() {
    this.remainingTime = this.timedEvent.getRemainingSeconds()
    this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`)
  }

  handleTargetSpawning() {
    if(this.target.y > sizes.height){
      this.spawnTarget()
    }
  }

  handlePlayerMovement() {
    if(this.input.activePointer.isDown){
      const mouseX = this.input.activePointer.x
      this.player.setX(mouseX - this.player.width / 2)
    }
  }

  // ========================================
  // GAME LOGIC HELPER METHODS
  // ========================================

  spawnTarget() {
    this.target.setY(0)
    this.target.setX(this.getRandomX())
  }

  getRandomX(){
    return Math.random() * (sizes.width - (100 * scale))
  }

  targetHit(){
    this.coinMusic.play()
    this.emitter.start()
    this.spawnTarget()
    this.updateScore()
  }

  updateScore() {
    this.points++
    this.textScore.setText(`Score: ${this.points}`)
  }

  gameOver() {
    this.sys.game.destroy(true)
    this.displayGameResults()
  }

  displayGameResults() {
    gameEndScoreSpan.textContent = this.points
    gameWinLoseSpan.textContent = this.points >= 10 ? 'You did the thing!' : 'You suck b*tch!'
    gameEndDiv.style.display = 'flex'
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
      gravity: { y: speedDown },
      debug:true
    }
  },
  scene: [GameScene]
}

const game = new Phaser.Game(config)

gameStartBtn.addEventListener('click', () => {
  gameStartDiv.style.display = 'none'
  game.scene.resume('gameScene')
})