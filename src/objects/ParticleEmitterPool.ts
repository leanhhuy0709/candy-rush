export default class ParticleEmitterPool {
    public static scene: Phaser.Scene
    public static particleEmitterList: Phaser.GameObjects.Particles.ParticleEmitter[] = []

    public static init(scene: Phaser.Scene): void {
        this.scene = scene
    }

    public static getParticleEmitter(
        x: number,
        y: number,
        textures: string,
        config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
    ): Phaser.GameObjects.Particles.ParticleEmitter {
        if (ParticleEmitterPool.particleEmitterList.length > 0) {
            const emitter =
                ParticleEmitterPool.particleEmitterList.pop() as Phaser.GameObjects.Particles.ParticleEmitter
            emitter.setPosition(x, y).setTexture(textures).setConfig(config)
            return emitter
        }

        return this.scene.add.particles(x, y, textures, config)
    }

    public static removeParticleEmitter(
        emitter: Phaser.GameObjects.Particles.ParticleEmitter
    ): void {
        ParticleEmitterPool.particleEmitterList.push(emitter)
    }
}
