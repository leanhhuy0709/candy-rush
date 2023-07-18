import { CONST, SCENE } from '../const/const'

export default class MenuScene extends Phaser.Scene {
    stats: any
    constructor() {
        super({
            key: SCENE.MENU,
        })
    }

    preload() {
        this.load.atlas(
            'confetti',
            'assets\\confeti\\confetti.png',
            'assets\\confeti\\confetti.json'
        )
    }

    public create(): void {
        this.addStats()
        this.add.image(0, 0, 'bg').setOrigin(0, 0)
        
        this.add.image(470, 200, CONST.candyTypes[0])
        this.add.image(440, 210, CONST.candyTypes[1])
        this.add.image(430, 180, CONST.candyTypes[4])
        this.add.image(180, 170, CONST.candyTypes[3])
        this.add.image(300, 220, CONST.candyTypes[2])

        this.add
            .text(this.cameras.main.width / 2, 200, 'CANDY CRUSH', {
                fontFamily: 'Cambria',
                fontSize: 60,
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4,
            })
            .setDepth(4)
            .setOrigin(0.5, 0.5)
            .setAlign('center')

        const rectangle = this.add
            .rectangle(this.cameras.main.width / 2, 325, 150, 50, 0x002d66)
            .setStrokeStyle(3, 0xed3896)
            .setInteractive()
            .setName('PlayBtn')

        rectangle.on('pointerover', () => {
            rectangle.fillColor = 0x20b2aa
        })

        rectangle.on('pointerout', () => {
            rectangle.fillColor = 0x002d66
        })

        this.add
            .text(this.cameras.main.width / 2, 325, 'PLAY', {
                fontFamily: 'Cambria',
                fontSize: 30,
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setDepth(4)
            .setOrigin(0.5, 0.5)

        const rectangle1 = this.add
            .rectangle(this.cameras.main.width / 2, 400, 150, 50, 0x002d66)
            .setStrokeStyle(3, 0xed3896)
            .setInteractive()
            .setName('SettingBtn')

        rectangle1.on('pointerover', () => {
            rectangle1.fillColor = 0x20b2aa
        })

        rectangle1.on('pointerout', () => {
            rectangle1.fillColor = 0x002d66
        })
        this.add
            .text(this.cameras.main.width / 2, 400, 'SETTING', {
                fontFamily: 'Cambria',
                fontSize: 30,
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setDepth(4)
            .setOrigin(0.5, 0.5)
        const rectangle2 = this.add
            .rectangle(this.cameras.main.width / 2, 475, 150, 50, 0x002d66)
            .setStrokeStyle(3, 0xed3896)
            .setInteractive()
            .setName('SettingBtn')

        rectangle2.on('pointerover', () => {
            rectangle2.fillColor = 0x20b2aa
        })

        rectangle2.on('pointerout', () => {
            rectangle2.fillColor = 0x002d66
        })

        this.add
            .text(this.cameras.main.width / 2, 475, 'EXIT', {
                fontFamily: 'Cambria',
                fontSize: 30,
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setDepth(4)
            .setOrigin(0.5, 0.5)

        this.input.on(
            'gameobjectdown',
            (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Rectangle) => {
                if (gameObject.name == 'PlayBtn') this.scene.start(SCENE.GAMEPLAY)
                else if (gameObject.name == 'SettingBtn') this.scene.start(SCENE.GAMEPLAY)
            },
            this
        )
        //*/
    }

    public addStats() {
		this.stats = document.createElement("span")
		this.stats.style.position = "fixed"
		this.stats.style.left = "0"
		this.stats.style.bottom = "0"
		this.stats.style.backgroundColor = "black"
		this.stats.style.minWidth = "200px"
		this.stats.style.padding = "15px"

		this.stats.style.color = "white"
		this.stats.style.fontFamily = "Courier New"
		this.stats.style.textAlign = "center"
		this.stats.innerText = "Draw calls: ?"

		document.body.append(this.stats)
	}

    public showDrawCall(): void {
        const renderer = this.game.renderer
		if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
			let drawCalls = 0

			const pipelines = renderer.pipelines.pipelines.values()

			renderer.on(Phaser.Renderer.Events.PRE_RENDER, () => (drawCalls = 0))
			pipelines.forEach((p) => p.on(Phaser.Renderer.WebGL.Pipelines.Events.AFTER_FLUSH, () => drawCalls++))
			renderer.on(Phaser.Renderer.Events.POST_RENDER, () => this.redrawStats(drawCalls))
		} else {
			renderer.on(Phaser.Renderer.Events.POST_RENDER, () => this.redrawStats(renderer.drawCount))
		}
    }

    public redrawStats(drawCalls = 0): void {
        this.stats.innerText = `Draw calls: ${drawCalls}`
    }

    public update(): void {
        //this.debugConsole()
    }
}
