// Cynthia He
// Created: 5/31/2024
// Phaser: 3.70.0
//
// Pitch Parkour
//
// My attempt at mashing a rhythm game together with a platformer game
// 
// Art assets from Kenny Assets 

// debug with extreme prejudice
"use strict"

// game config
// Using Phaser.Auto instead of Phaser.Canvas so I can tint color particles
let config = {
    parent: 'phaser-game',
    type: Phaser.AUTO,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    width: 1440,
    height: 720,
    scene: [Load, Platformer1, Platformer2, MainMenu, Credits, Ending]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);