import { create as createFeatures } from './features'

const create = () => {
  const features = createFeatures()

  return {
    start: features.start,
    stop: features.stop,
  }
}

export { create }
