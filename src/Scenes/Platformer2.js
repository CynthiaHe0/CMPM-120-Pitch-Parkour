class Platformer2 extends Phaser.Scene {
    constructor() {
        super("platformerScene2");
    }
    init() {
        // variables and settings
        //If you have extra time, make it so you can instantly turn
        this.ACCELERATION = 800;
        this.DRAG = 2400;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.BASE_JUMP_VELOCITY = -100;
        this.MAX_Y_SPEED = 500;
        this.MAX_X_SPEED = 300;
        this.score = 0;
        this.spawnX = game.config.width/10;
        this.spawnY = 5*game.config.height/6;
        this.playerStates = {
            onGround : false,
            platform : null,
            stepSounds: false,
            jumping: false,
            falling: false,
            readSign: false,
            sign: null,
            bossMusic: false,
            chaseStart: false,
        };
        this.flagCount = 0;
        this.SCALE = 1.5;
        this.jumpTimer = this.time.addEvent({ delay: 250, callback: this.finishJump, callbackScope: this });
        this.monsterBodyX = 300;
        this.monsterBodyY = 300;
    }
    create(){
        //Set up level       
        this.map = this.add.tilemap("Level2", 18, 18, 120, 25);
        
        //First parameter is the name we gave it in tiled
        //Second parameter is the name we gave it in load.js
        this.rainbowNotes = this.map.addTilesetImage("tile_sheet_128px_by_128px", "rainbowNotes");
        this.kennyTileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");

        this.groundLayer = this.map.createLayer("Platforms", [this.rainbowNotes, this.kennyTileset], 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        this.groundLayer.setScale(SCALE);
        let fall_through = this.groundLayer.filterTiles((tile) => {
            if (tile.collides == true){
                return true;
            }
            return false;
        });

        for (let tile of fall_through){
            if (tile.properties.note != "rest"){
                tile.collideLeft = false;
                tile.collideRight = false;
                tile.collideDown = false;
            }
        }

        //Set up player
        my.sprite.player = this.physics.add.sprite(this.spawnX, this.spawnY, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxVelocity(this.MAX_X_SPEED, this.MAX_Y_SPEED);
        this.noteSounds = {};
        this.noteSounds.do = this.sound.add("do");
        this.noteSounds.re = this.sound.add("re");
        this.noteSounds.mi = this.sound.add("mi");
        this.noteSounds.fa = this.sound.add("fa");
        this.noteSounds.so = this.sound.add("so");
        this.noteSounds.la = this.sound.add("la");
        this.noteSounds.ti = this.sound.add("ti");
        this.noteSounds.high_do = this.sound.add("high do");
        this.noteSounds.rest = this.sound.add("rest");


        //Scale up the world boundaries because we zoomed into the size of the objects
        this.physics.world.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2 + 40);

        this.physics.add.collider(my.sprite.player, this.groundLayer, (player, tile)=>{
            //This is for detecting what platform the player is on and eventually lets them fall through
            if (this.playerStates.platform != null){
                this.resetCollision();
            }
            this.playerStates.platform = tile;
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        // set up music monster
        // MAKE THEM PATH FOLLOWERS
        this.musicMonster = [];
        this.musicMonster[0] = this.add.sprite(this.monsterBodyX, this.monsterBodyY, "monsterParts", "meteorGrey_big2.png");
        this.musicMonster[1] = this.add.sprite(this.monsterBodyX + 90, this.monsterBodyY - 25, "monsterParts", "wingBlue_0.png");
        this.musicMonster[1].setFlipX(true);
        this.musicMonster[1].rotation += 1.5;
        this.musicMonster[2] = this.add.sprite(this.monsterBodyX + 80, this.monsterBodyY, "monsterParts", "wingBlue_0.png");
        this.musicMonster[2].setFlipX(true);
        this.musicMonster[2].rotation += 2;
        this.musicMonster[3] = this.add.sprite(this.monsterBodyX + 50, this.monsterBodyY + 25, "monsterParts", "wingBlue_0.png");
        this.musicMonster[3].setFlipX(true);
        this.musicMonster[3].rotation += 3;
        this.musicMonsterHead = this.add.sprite(this.game.config.width/2, 600, "platformer_characters", "tile_0025.png");
        this.musicMonsterHead.setScale(8);
        this.musicMonsterHead.visible = false;

        for (let part of this.musicMonster){
            part.setScrollFactor(0);
            part.visible = false;
        }

        //Have camera follow player
        this.cameras.main.setZoom(1.5);
        this.cameras.main.centerOn(my.sprite.player.x, my.sprite.player.y);
        this.cameras.main.startFollow(my.sprite.player, false, 0.5, 0.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);

        this.bossMusic = this.sound.add("boss music", {volume:0.5});

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        this.cutSceneTrigger = new Phaser.Events.EventEmitter();
        this.cutSceneTrigger.on('start', this.startCutscene, this);
        this.cutSceneTrigger.on('end', this.endCutscene, this);
        this.timedEvent = this.time.addEvent({delay: 1000, callback: this.destroyBlock, callbackScope:this, loop: true});
        this.timedEvent.paused = true;
    }
    update(){
        //Check if the player fell off the map
        if (my.sprite.player.y >= this.map.heightInPixels*2){
            //Play funny death thingy
            this.respawn();
        }
        if(cursors.left.isDown) {
            // TODO: have the player accelerate to the left
            //my.sprite.player.body.setVelocityX(-400);
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            //my.sprite.player.body.setVelocityX(400);
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        //Player + ground interactions
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        } else {
            //This is for the walking sounds
            if (!(this.playerStates.stepSounds) && (my.sprite.player.body.velocity.x != 0)){
                //PLAY ASSOCIATED NOTE
                this.playNote();
            }
            //This is for the landing noise
            if (this.playerStates.falling == true){
                this.playerStates.falling = false;
                this.playNote();
            }
            if(Phaser.Input.Keyboard.JustDown(cursors.up)){
                this.playerStates.jumping = true;
                this.jumpTimer.reset({ delay: 300, callback: this.finishJump, callbackScope: this });
                this.time.addEvent(this.jumpTimer);
                this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
                //PLAY JUMP SOUND EFFECT
            }
            if (Phaser.Input.Keyboard.JustDown(cursors.down)){
                if (this.playerStates.platform.properties.note != "rest"){
                    this.playerStates.platform.collideUp = false;
                    //This is so if the player is stepping on 2 tiles at once, they will still be able to fall through
                    //I am kinda cheating with my design because since it's based around notes, I made sure all the same notes
                    //are at the same height
                    let sameTiles = this.groundLayer.filterTiles((tile) => {
                        if (tile.index == this.playerStates.platform.index){
                            return true;
                        }
                        return false;
                    });
                    for (let tile of sameTiles){
                        tile.collideUp = false;
                    }
                }
            }
        }
        if (this.playerStates.jumping == true){
            if (cursors.up.isDown){
                this.JUMP_VELOCITY -= 20 + 20*(this.BASE_JUMP_VELOCITY/this.JUMP_VELOCITY);
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            } else {
                //This is in case the player wants to do a short jump;
                this.playerStates.jumping = false;
                this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
            }
        }
        if (my.sprite.player.body.velocity.y > 0){
            this.playerStates.falling = true;
        }
        if (my.sprite.player.x > 18*18 && this.playerStates.chaseStart == false){
            this.cutSceneTrigger.emit('start');
        }
        if (my.sprite.player.x > 109*18 && this.playerStates.chaseStart == true){
            this.cutSceneTrigger.emit('end');
        }
    }
    playNote(){
        this.playerStates.stepSounds = true;
        this.noteSounds[this.playerStates.platform.properties.note].play();
        this.noteSounds[this.playerStates.platform.properties.note].on('complete', () => {
            this.playerStates.stepSounds = false;
        });
    }
    finishJump(){
        this.playerStates.jumping = false;
        this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
    }
    respawn(){
        //this.physics.world.gravity.y = 1500;
        this.resetCollision();
        my.sprite.player.x = this.spawnX;
        my.sprite.player.y = this.spawnY;
    }
    resetCollision(){
        let sameTiles = this.groundLayer.filterTiles((tile) => {
            if (tile.index == this.playerStates.platform.index){
                return true;
            }
            return false;
        });
        for (let tile of sameTiles){
            tile.collideUp = true;
        }
    }
    startCutscene(){
        this.playerStates.chaseStart = true;
        for (let key in cursors){
            cursors[key].enabled = false;
            //This is to prevent the character from continously moving right if they were holding it before entering the trigger
            cursors[key].isDown = false;
        }
        //Have boss jump up and smash floor (TODO: have tween better than tween below)
        this.musicMonsterHead.visible = true;
        const bossJump = this.tweens.add({
            targets: this.musicMonsterHead,
            y: 500,
            ease: "Power1",
            duration: 1000,
            yoyo: true,
        });
        //Launch the player up to first note
        const playerLaunch = this.tweens.add({
            targets: my.sprite.player,
            x: 600,
            y: 100,
            duration: 1000,
        });
        //playerLaunch.on('complete', function);
        /* TODO
        Need to delay the music start just a bit so it starts when the player lands on the first tile.
        */
        this.timedEvent.paused = false;
        //Start the music
        this.playerStates.bossMusic = true;
        this.bossMusic.play();
        for (let part of this.musicMonster){
            part.visible = true;
        }
        for (let key in cursors){
            cursors[key].enabled = true;
        }
    }
    endCutscene(){
        //TODO Have the monster disappear or smth
        this.timedEvent.paused = true;
    }
    destroyBlock(){
        //TODO: add fancy destroy animation
        if(this.playerStates.chaseStart){
            let destroy = this.groundLayer.filterTiles((tile) => {
                if (tile.x == this.flagCount){
                    return true;
                }
                return false;
            });
            for (let tile of destroy){
                tile.visible = false;
                this.map.removeTile(tile);
            }
            this.flagCount++;
        }
    }
}