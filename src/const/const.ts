export const CONST = {
    score: 0,
    highscore: 0,
    gridWidth: 8,
    gridHeight: 8,
    tileWidth: 64,
    tileHeight: 72,
    margin: 10,
    candyTypes: [
        //'cookie1',
        'cookie2',
        //'croissant',
        'cupcake',
        //'donut',
        'eclair',
        //'macaroon',
        'pie',
        'poptart1',
        //'poptart2',
        //'starcookie1',
        'starcookie2'
    ],
}

export enum SCENE {
    LOADING = "LoadingScene",
    GAMEPLAY = "GamePlayScene",
    MENU = 'MenuScene'
}