class Credits extends Phaser.Scene{
    constructor(){
        super("creditsScene");
    }
    create(){
        this.credit = this.add.bitmapText(0, 0, "text", `Created by Cynthia He \n
            Art assets from Kenny's Assets collection\n
            Music, rainbow tiles and programming done by Cynthia He\n
            Game engine - Phaser 3 (Version 3.8)\n\n
            Editing Software Used\n
            Tiled - Level design\n
            Audacity - Sound editting\n
            MuseScore4 - Music and notes\n
            Piskel-0.14.0 - Pixel art\n
            Vscode - All the gawd darn programming
            `);
        
        
        this.goBack = this.add.text(game.config.width - 300, 0, "Go back to main menu");
        this.goBack.setInteractive();
        this.goBack.setDisplaySize(300, 75);
        this.goBack.on('pointerdown', () => {
            this.scene.start("mainMenuScene");
        });
    }
}