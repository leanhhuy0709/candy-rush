import { GamePlayScene } from './scenes/GamePlayScene'
import { LoadingScene } from './scenes/LoadingScene'
import MenuScene from './scenes/MenuScene'

export const GameConfig: Phaser.Types.Core.GameConfig = {
    title: 'Candy Rush',
    url: 'https://github.com/leanhhuy0709/candy-rush',
    version: '2.0',
    type: Phaser.AUTO,
    parent: 'Game',
    scene: [LoadingScene, MenuScene, GamePlayScene],
    input: {
        keyboard: true,
    },
    width: 600,
    height: 800,
    backgroundColor: '#000000'
}
