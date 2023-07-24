export default class ConfettiParticle extends Phaser.GameObjects.Particles.Particle {
    public startX: number
    public startY: number
    public endX: number
    public endY: number
    public isInit = false

    constructor(emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
        super(emitter)
    }

    public update(
        delta: number,
        step: number,
        processors: Phaser.GameObjects.Particles.ParticleProcessor[]
    ): boolean {
        const x = this.x,
            y = this.y

        const val = super.update(delta, step, processors)

        const ease = this.lifeCurrent / this.life
        const ease2 = Phaser.Math.Easing.Quartic.In(ease)

        this.x = x + ((delta * this.velocityX) / 1000) * ease2
        this.y = y + ((delta * this.velocityY) / 1000) * ease2

        this.angle += (delta / 1000) * 20

        return val
    }
}