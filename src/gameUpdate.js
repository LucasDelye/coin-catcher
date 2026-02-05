import { sizes } from './constants.js'
import * as gameSetup from './gameSetup.js'

export function handleTargetSpawning(scene) {
  scene.targets.forEach((target, index) => {
    if (target.y > sizes.height) {
      scene.targets.splice(index, 1)
      target.destroy()
      if (
        scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < 10
      ) {
        gameSetup.createTarget(scene)
      }
    }
  })

  scene.bonusTargets.forEach((bonusTarget, index) => {
    if (bonusTarget.y > sizes.height) {
      scene.bonusTargets.splice(index, 1)
      bonusTarget.destroy()
      if (
        scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < 10
      ) {
        gameSetup.createBonusTarget(scene)
      }
    }
  })

  scene.penaltyTargets.forEach((penaltyTarget, index) => {
    if (penaltyTarget.y > sizes.height) {
      scene.penaltyTargets.splice(index, 1)
      penaltyTarget.destroy()
      if (
        scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < 10 &&
        scene.penaltyTargets.length < 3
      ) {
        gameSetup.createPenaltyTarget(scene)
      }
    }
  })

  updateTargetCount(scene)
}

export function handlePlayerMovement(scene) {
  if (scene.input.activePointer.isDown) {
    const mouseX = scene.input.activePointer.x
    scene.player.setX(mouseX)
  }
}

export function updateTargetCount(scene) {
  const newTargetCount = Math.min(Math.floor(scene.points / 10) + 1, 10)

  if (newTargetCount > scene.targetCount) {
    const currentTotal =
      scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length
    const targetsToAdd = Math.min(newTargetCount - scene.targetCount, 10 - currentTotal)

    for (let i = 0; i < targetsToAdd; i++) {
      gameSetup.createTarget(scene)
    }
    scene.targetCount = newTargetCount
  }
}
