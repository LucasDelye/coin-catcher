import { sizes, MAX_TOTAL_TARGETS, MAX_PENALTY_TARGETS } from './constants.js'
import * as gameSetup from './gameSetup.js'

export function handleTargetSpawning(scene) {
  scene.targets.forEach((target, index) => {
    if (target.y > sizes.height) {
      scene.targets.splice(index, 1)
      target.destroy()
      if (
        scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < MAX_TOTAL_TARGETS
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
        scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < MAX_TOTAL_TARGETS
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
        scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length < MAX_TOTAL_TARGETS &&
        scene.penaltyTargets.length < MAX_PENALTY_TARGETS
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
  const newTargetCount = Math.min(Math.floor(scene.points / 10) + 1, MAX_TOTAL_TARGETS)

  if (newTargetCount > scene.targetCount) {
    const currentTotal =
      scene.targets.length + scene.bonusTargets.length + scene.penaltyTargets.length
    const targetsToAdd = Math.min(newTargetCount - scene.targetCount, MAX_TOTAL_TARGETS - currentTotal)

    for (let i = 0; i < targetsToAdd; i++) {
      gameSetup.createTarget(scene)
    }
    scene.targetCount = newTargetCount
  }
}
