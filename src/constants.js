export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Calculate scaling factors based on original 1080x1920 resolution
const scaleX = sizes.width / 1080
const scaleY = sizes.height / 1920
export const scale = Math.min(scaleX, scaleY)

export const speedDown = 500
