class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }
    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    init() {
        // variables and settings
        //If you have extra time, make it so you can instantly turn
        this.ACCELERATION = 800;
        this.DRAG = 2400;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.BASE_JUMP_VELOCITY = -100;
        this.MAX_SPEED = 500;
        this.score = 0;
        this.spawnX = game.config.width/10;
        this.spawnY = 5*game.config.height/6;
        this.playerStates = {
            onGround : false,
            platform : null,
            stepSounds: false,
            jumping: false,
            falling: false,
        };
        this.flagCount = 0;
        this.SCALE = 1.5;
    }

    create() {
        //Set up level       
        this.map = this.add.tilemap("Level1", 18, 18, 120, 25);
        
        //First parameter is the name we gave it in tiled
        //Second parameter is the name we gave it in load.js
        this.rainbowNotes = this.map.addTilesetImage("rainbow_notes", "rainbowNotes");
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

        //Set up checkpoints
        this.flags = this.map.createLayer("Flags", this.kennyTileset, 0, 0);
        this.flags.setScale(SCALE);
        /*let checkpoints = this.flags.filterTiles((tile) =>{
            if (tile.index != -1){
                return true;
            }
            return false;
        });
        console.log(this.flags);
        console.log(checkpoints);*/
        this.flags.setCollisionByProperty({
            collides : true
        });


        //Scale up the world boundaries because we zoomed into the size of the objects
        this.physics.world.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2 + 40);


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawnX, this.spawnY, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxSpeed(this.MAX_SPEED);
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


        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer, (player, tile)=>{
            //This if statement resets the collision for the tiles
            if (this.playerStates.platform != null){
                this.resetCollision();
            }
            //This is for detecting what platform the player is on and eventually lets them fall through
            this.playerStates.platform = tile;
        });
        this.physics.add.overlap(my.sprite.player, this.flags, (player, tile) => {
            if (tile.index == 112 || tile.index == 132){
                this.spawnX = tile.x * 36;
                this.spawnY = 36 * (tile.index == 112 ? tile.y : tile.y-1);
            } else if (tile.index == 10){
                console.log("Onto the next area!");
            }
        });
        this.jumpTimer = this.time.addEvent({ delay: 250, callback: this.finishJump, callbackScope: this });


        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        
        //Have camera follow player
        this.cameras.main.setZoom(1.5);
        this.cameras.main.centerOn(my.sprite.player.x, my.sprite.player.y);
        this.cameras.main.startFollow(my.sprite.player, false, 0.5, 0.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);
        //this.cameras.main.setScroll(game.config.width/2, game.config.height/2);

        
        //PUT THE INIT AFTER ALL LAYERS CREATED
        //this.animatedTiles.init(this.map);

        

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
    }

    update() {
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

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
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
                this.jumpTimer.reset({ delay: 250, callback: this.finishJump, callbackScope: this });
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
                this.JUMP_VELOCITY -= 10 + 20*(this.BASE_JUMP_VELOCITY/this.JUMP_VELOCITY);
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
    respawn(){
        //this.physics.world.gravity.y = 1500;
        this.resetCollision();
        my.sprite.player.x = this.spawnX;
        my.sprite.player.y = this.spawnY;
    }
    finishJump(){
        this.playerStates.jumping = false;
        this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
    }
    playNote(){
        this.playerStates.stepSounds = true;
        this.noteSounds[this.playerStates.platform.properties.note].play();
        this.noteSounds[this.playerStates.platform.properties.note].on('complete', () => {
            this.playerStates.stepSounds = false;
        });
    }
}