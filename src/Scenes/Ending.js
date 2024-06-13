class Ending extends Phaser.Scene{
    constructor(){
        super("endingScene");
    }
    init(data){
        if (data.health > 0){
            this.isDead = false;
        } else {
            this.isDead = true;
        }
    }
    create(){
        my.sprite.player = this.add.sprite(game.config.width/2, game.config.height/2 + 10, "platformer_characters", "tile_0000.png").setScale(10);
        
        my.sprite.hat = this.add.sprite(game.config.width/2, game.config.height/3, "hat");
        my.sprite.hat.setScale(2, 1);
        my.sprite.puff = this.add.sprite(game.config.width/2, game.config.height/4, "pink puff");
        this.youWin = this.add.bitmapText(game.config.width/2, game.config.height/5, "text", "You Win!");
        this.youWin.setOrigin(0.5);

        this.youLose = this.add.bitmapText(game.config.width/2, game.config.height/5, "text", "You Lose");
        this.youLose.setOrigin(0.5);
        this.x1 = this.add.sprite(game.config.width/2 + 10, game.config.height/2 + 20, "monsterParts", "laserRed11.png");
        //this.x1.setScale(10);
        this.x2 = this.add.sprite(game.config.width/2 - 30, game.config.height/2 + 20, "monsterParts", "laserRed11.png");

        if (this.isDead){
            this.youLose.visible = true;
            this.x1.visible = true;
            this.x2.visible = true;
            my.sprite.hat.visible = false;
            my.sprite.puff.visible = false;
            this.youWin.visible = false;
        } else {
            this.youLose.visible = false;
            this.x1.visible = false;
            this.x2.visible = false;
            my.sprite.hat.visible = true;
            my.sprite.puff.visible = true;
            this.youWin.visible = true;
        }
        this.toMainMenu = this.add.text(game.config.width - 300, 0, "Go back to main menu" );
        this.toMainMenu.setInteractive();
        this.toMainMenu.setDisplaySize(300, 50);
        this.toMainMenu.on('pointerdown', () => {
            this.scene.start("mainMenuScene");
        });
    }
}