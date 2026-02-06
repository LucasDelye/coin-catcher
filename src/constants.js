export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Calculate scaling factors based on original 1080x1920 resolution
const scaleX = sizes.width / 1080
const scaleY = sizes.height / 1920
export const scale = Math.min(scaleX, scaleY)

export const speedDown = 500

// Max coins on screen at once (regular + bonus + penalty)
export const MAX_TOTAL_TARGETS = 24
// Max penalty (red) coins on screen at once
export const MAX_PENALTY_TARGETS = 8
