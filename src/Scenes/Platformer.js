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
        this.MAX_SPEED = 800;
        this.score = 0;
        this.spawnX = game.config.width/10;
        this.spawnY = 5*game.config.height/6;
        this.playerStates = {
            onGround : false,
            platform : null,
            stepSounds: false,
            jumping: false,
        };
        this.flagCount = 0;
        this.SCALE = 2;
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
            tile.collideDown = false;
        }

        //Scale up the world boundaries because we zoomed into the size of the objects
        this.physics.world.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2 + 40);


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawnX, this.spawnY, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxSpeed(this.MAX_SPEED);
        this.cMajor = {};
        this.cMajor.do = this.sound.add("do");
        this.cMajor.re = this.sound.add("re");
        this.cMajor.mi = this.sound.add("mi");
        this.cMajor.fa = this.sound.add("fa");
        this.cMajor.so = this.sound.add("so");
        this.cMajor.la = this.sound.add("la");
        this.cMajor.ti = this.sound.add("ti");
        this.cMajor.high_do = this.sound.add("high do");


        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer, (player, tile)=>{
            //This if statement resets the collision for the tiles
            if (this.playerStates.platform != null){
                this.resetCollision();
            }
            //This is for detecting what platform the player is on and eventually lets them fall through
            this.playerStates.platform = tile;
        });
        this.jumpTimer = this.time.addEvent({ delay: 2000, callback: this.onJump, callbackScope: this });


        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        
        //Have camera follow player
        this.cameras.main.setZoom(1.5);
        this.cameras.main.centerOn(my.sprite.player.x, my.sprite.player.y);
        this.cameras.main.startFollow(my.sprite.player, false, 0.5, 0.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);
        //this.cameras.main.setScroll(game.config.width/2, game.config.height/2);

        
        //PUT THE INIT AFTER ALL LAYERS CREATED
        this.animatedTiles.init(this.map);

        

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
    }

    update() {
        //check if coin object is visible
        //If visible, play animation
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
            if (!(this.playerStates.stepSounds) && (my.sprite.player.body.velocity.x != 0) && this.playerStates.platform.properties.note != "rest"){
                //PLAY ASSOCIATED NOTE
                this.playerStates.stepSounds = true;
                this.cMajor[this.playerStates.platform.properties.note].play();
                this.cMajor[this.playerStates.platform.properties.note].on('complete', () => {
                    this.playerStates.stepSounds = false;
                });
            }
            if(Phaser.Input.Keyboard.JustDown(cursors.up)){
                this.playerStates.jumping = true;
                this.jumpTimer.reset({ delay: 250, callback: this.onJump, callbackScope: this });
                this.time.addEvent(this.jumpTimer);
                this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
                //PLAY JUMP SOUND EFFECT
            }
            if (Phaser.Input.Keyboard.JustDown(cursors.down)){
                console.log(this.playerStates.platform);
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
    onJump(){
        console.log("on Jump called!");
        this.playerStates.jumping = false;
        this.JUMP_VELOCITY = this.BASE_JUMP_VELOCITY;
    }
}