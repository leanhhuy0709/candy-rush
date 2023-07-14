import { GamePlayScene } from '../scenes/GamePlayScene'
import ParticleEmitterPool from './ParticleEmitterPool'

const progressBarX = 30
const progressBarY = 50
const progressBarWidth = 175
const progressBarHeight = 20

class ConfettiParticle extends Phaser.GameObjects.Particles.Particle {
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

        this.angle += delta/1000 * 20

        return val
    }
}

export default class ScoreBoard {
    private scene: Phaser.Scene

    private score: number

    private scoreText: Phaser.GameObjects.Text
    private targetText: Phaser.GameObjects.Text

    private progressBar: Phaser.GameObjects.Graphics

    private progressBarEmitter: Phaser.GameObjects.Particles.ParticleEmitter

    private level = 1
    private levels: number[] = []

    private confettiEmitter: Phaser.GameObjects.Particles.ParticleEmitter

    public constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.score = 0

        this.scoreText = scene.add
            .text(scene.cameras.main.width / 2, progressBarY, '0', {
                fontFamily: 'Cambria',
                fontSize: 55,
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setDepth(6)
            .setOrigin(0.5, 0.5)

        for (let i = 1; i < 1000; i++) {
            this.levels.push(((i * (i + 1)) / 2) * 500)
        }

        this.progressBarEmitter = ParticleEmitterPool.getParticleEmitter(
            progressBarX,
            progressBarY + progressBarHeight / 2,
            'flares',
            {
                frame: 'white',
                color: [0x96e0da, 0x937ef3],
                colorEase: 'quad.out',
                lifespan: 500,
                angle: { min: -190, max: -170 },
                scale: { start: 0.2, end: 0, ease: 'sine.out' },
                speed: 100,
                advance: 2000,
                blendMode: 'ADD',
            }
        ).setDepth(6).start(undefined, -1)

        this.scene.add
            .graphics()
            .lineStyle(3, 0xed3896)
            .setDepth(9)
            .strokeRoundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5)
            .fillStyle(0x002d66)
            .fillRoundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5)
            .setDepth(4)

        this.progressBar = this.scene.add
            .graphics()
            .fillStyle(0xf5d1b6)
            .fillRoundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5)
            .setDepth(5)
        this.updateProgressBar(0)

        this.targetText = scene.add
            .text(
                progressBarX + progressBarWidth / 2,
                progressBarY - 20,
                `${this.levels[this.level]}`,
                {
                    fontFamily: 'Cambria',
                    fontSize: 20,
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2,
                }
            )
            .setDepth(6)
            .setOrigin(0.5, 0.5)

        this.confettiEmitter = this.scene.add.particles(0, 300, 'confetti', {
            frame: ['1', '2', '3', '4', '5'],
            lifespan: 3500,
            scale: { start: 0.3, end: 0.5 },
            alpha: { start: 75, end: 100 },
            angle: { min: -180, max: 180 },
            speedX: { min: 300, max: 800 }, 
            speedY: { min: -1000, max: -500 }, 
            gravityY: 1800,
            quantity: 1,
            particleClass: ConfettiParticle,
        }).setDepth(7).stop()
    }

    public addScore(score: number): void {
        this.score += score
        this.scoreText.setText(this.score.toString())

        this.updateProgressBar(
            (this.score - this.levels[this.level - 1]) /
                (this.levels[this.level] - this.levels[this.level - 1])
        )
    }

    public updateProgressBar(percent: number): void {
        if (percent <= 0.05) percent = 0.05
        if (percent > 1) percent = 1
        this.progressBar.clear()
        this.progressBar
            .fillStyle(0xf5d1b6)
            .fillRoundedRect(
                progressBarX,
                progressBarY,
                percent * progressBarWidth,
                progressBarHeight,
                5
            )
            .setDepth(5)

        this.progressBarEmitter.setPosition(
            progressBarX + percent * progressBarWidth - 5,
            progressBarY + progressBarHeight / 2
        )

        if (percent >= 0.1) this.progressBarEmitter.setVisible(true)
        else this.progressBarEmitter.setVisible(false)
    }

    public handleGoToNextLevel(): void {
        while (this.score >= this.levels[this.level]) {
            this.level++
            this.targetText.setText(`${this.levels[this.level]}`)
            this.updateProgressBar(
                (this.score - this.levels[this.level - 1]) /
                    (this.levels[this.level] - this.levels[this.level - 1])
            )
            const scene = this.scene as GamePlayScene
            scene.shuffle()

            this.confettiEmitter.start(undefined, 1000)
        }
    }

    public emitterScoreEffect(x: number, y: number, onComplete?: Function): void {
        const tempObj = this.scene.add.image(x, y, '').setVisible(false)

        const emitter = ParticleEmitterPool.getParticleEmitter(0, 0, 'flares', {
            frame: { frames: ['red', 'green', 'blue', 'yellow'], cycle: true },
            blendMode: Phaser.BlendModes.ADD,
            follow: tempObj,
            speed: 100,
            gravityY: 300,
            lifespan: 1000,
            quantity: 1,
            scale: { start: 0.3, end: 0.1 },
        }).setDepth(6).start(undefined, 1000)

        let percent =
            (this.score - this.levels[this.level - 1]) /
            (this.levels[this.level] - this.levels[this.level - 1])

        if (percent <= 0.05) percent = 0.05
        if (percent > 1) percent = 1

        const tween = this.scene.tweens.add({
            targets: tempObj,
            x: progressBarX + percent * progressBarWidth,
            y: progressBarY + progressBarHeight,
            duration: 1000,
            onComplete: () => {
                tempObj.destroy()
                ParticleEmitterPool.removeParticleEmitter(emitter)
                tween.destroy()

                if (onComplete) onComplete()
            },
        })
    }
}
