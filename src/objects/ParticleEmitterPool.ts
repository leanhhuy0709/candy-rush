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
        //return this.scene.add.particles(x, y, textures, config)
        
        if (ParticleEmitterPool.particleEmitterList.length > 0) {
            const emitter =
                ParticleEmitterPool.particleEmitterList.pop() as Phaser.GameObjects.Particles.ParticleEmitter
            emitter.x = x
            emitter.y = y
            emitter.setTexture(textures).setConfig(config).setVisible(true).setActive(true)
            emitter.start()
            return emitter
        }

        return this.scene.add.particles(x, y, textures, config)
    }

    public static removeParticleEmitter(
        emitter: Phaser.GameObjects.Particles.ParticleEmitter
    ): void {
        emitter.setVisible(false)
        emitter.setActive(false)
        ParticleEmitterPool.particleEmitterList.push(emitter)
    }
}
