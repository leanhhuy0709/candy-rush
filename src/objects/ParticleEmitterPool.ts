export default class ParticleEmitterPool {
    public static scene: Phaser.Scene
    public static particleEmitterList: Phaser.GameObjects.Particles.ParticleEmitter[] = []
    public static explodeEmitterList: Phaser.GameObjects.Particles.ParticleEmitter[] = []

    public static init(scene: Phaser.Scene): void {
        this.scene = scene
    }

    public static getParticleEmitter(
        x: number,
        y: number,
        textures: string,
        config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
    ): Phaser.GameObjects.Particles.ParticleEmitter {
        return this.scene.add.particles(x, y, textures, config) /*

        if (ParticleEmitterPool.particleEmitterList.length > 0) {
            const emitter =
                ParticleEmitterPool.particleEmitterList.pop() as Phaser.GameObjects.Particles.ParticleEmitter
            
            emitter.setTexture(textures).setConfig(config)
            return emitter
        }

        return this.scene.add.particles(x, y, textures, config)*/
    }

    public static removeParticleEmitter(
        emitter: Phaser.GameObjects.Particles.ParticleEmitter
    ): void {
        emitter.destroy()
        /*

        emitter.stop()
        ParticleEmitterPool.particleEmitterList.push(emitter)*/
    }

    public static getExplodeEmitter(
        x: number,
        y: number,
        textures: string,
        config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
    ) {
        return this.scene.add.particles(x, y, textures, config) /*
        if (ParticleEmitterPool.explodeEmitterList.length > 0) {
            const emitter =
                ParticleEmitterPool.explodeEmitterList.pop() as Phaser.GameObjects.Particles.ParticleEmitter
            emitter.x = x
            emitter.y = y
            emitter.setTexture(textures).setConfig(config).setVisible(true)
            return emitter
        }

        return this.scene.add.particles(x, y, textures, config)*/
    }

    public static removeExplodeEmitter(
        emitter: Phaser.GameObjects.Particles.ParticleEmitter
    ): void {
        emitter.destroy()
        /*
        ParticleEmitterPool.explodeEmitterList.push(emitter)*/
    }
}
