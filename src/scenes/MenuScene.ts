import { CONST, SCENE } from '../const/const'

export default class MenuScene extends Phaser.Scene {
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
  
        
    }

    public update(): void {
        //this.debugConsole()
    }
}
