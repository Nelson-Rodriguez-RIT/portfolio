import {SETUP, LOAD, ENV, CONFIG, USER, HTML, TAIKO, LINKS} from "./util.js"

async function onload() {
    SETUP.SetHTMLEvents();
    LOAD.LoadLocalStorage();

    update();
}

function update() {
    window.requestAnimationFrame(update);

    // Update deltatime
    ENV.currentTime = window.performance.now();
    ENV.delta = (ENV.currentTime - ENV.previousTime); // These means that if deltatime was cumulative it would equal 1 after 1 second
    ENV.previousTime = ENV.currentTime;

    //console.log(ENV)
    if (ENV.uploadingFiles && ENV.uploadedFiles == ENV.filesToUpload) {
        LOAD.FinishUploadCallback(ENV.beatmapUploadBuffer);
        ENV.uploadingFiles = false;
    }

    if (ENV.initBeatmap) {
        HTML.game.self.className       = '';
        HTML.songSelect.self.className = 'inactive';
        HTML.menu.self.className       = 'inactive';


        ENV.score = 0;
        ENV.combo = 0;
        ENV.soul  = 0;

        // To the kind gentlemen who made window.structuredClone, I thank you (so much worked saved)
        ENV.hitObjectsQueue   = window.structuredClone(ENV.loadedBeatmap.beatmap.hitObjects)
        ENV.timingPoints      = window.structuredClone(ENV.loadedBeatmap.beatmap.timingPoints);

        ENV.progression = -1000;
        ENV.scoreUIQueue =  []; 
        ENV.inputQueue   =  [];
        ENV.soundEffects =  [];

        for (let ui of ENV.timingUIQueue)
            ui.anim.html.remove();
        ENV.timingUIQueue = [],

        ENV.baseSV = ENV.loadedBeatmap.beatmap.settings.baseSV;

        ENV.audioPlayer = new Audio(ENV.loadedBeatmap.audio);

        // Set difficulty settings
        ENV.soulDifficulty = 100 / ENV.hitObjectsQueue.length;

        HTML.game.soulBar.className = '';


        // Set inital SV from the first inherited timing point
        if (ENV.multiplierSV == null) {
            for (let tp of ENV.timingPoints)
                if (tp.sv < 0) {
                    ENV.multiplierSV = -tp.sv;
                    break;
                }
        }

        ENV.initBeatmap = false;
        ENV.beatmapStarted = true;

        HTML.game.bottom.style.backgroundImage = `url(${ENV.loadedBeatmap.img})`;
    }

    if (ENV.beatmapStarted) {
        
        // Remove deactivated hit objects
        ENV.hitObjects = ENV.hitObjects.filter(o => { if (!o.active) o.html.remove(); return o.active;});


        if (ENV.audioPlayer.paused && !ENV.audioPlayer.ended && ENV.progression >= USER.offset)
            ENV.audioPlayer.play();


        
            

        


        // Audio -> Update sound effects
        ENV.soundEffects = ENV.soundEffects.filter(s => {if (s.ended) s.remove(); return !s.ended});
        for (let sound of ENV.soundEffects)
            if (sound.paused) {
                sound.play();
                sound.volume = ENV.volume;
                sound.loop = false;
            }

        // Load more hitObjects until active cap is reached or if remaining hitObject queue is less than cap, use that
        while (ENV.hitObjectsQueue.length && ENV.hitObjects.length < CONFIG.maxLoadedHitObjects) {
            let hitObject            = ENV.hitObjectsQueue.shift();
            hitObject.html           = document.createElement('li');
            hitObject.html.className = TAIKO.HitObjectTypes[hitObject.type];

            // Check if the next timing point has been reached
            if (ENV.timingPoints.length && ENV.timingPoints[0].timing <= hitObject.timing) {
                let timingPoint = ENV.timingPoints.shift();

                ENV.volume = timingPoint.volume;
                ENV.inKiai = timingPoint.kiai;

                if (timingPoint.sv > 0) // Intreprete as BPM change
                    ENV.BPM = 0; // TODO
                if (timingPoint.sv < 0) // Intreprete as SV change
                    ENV.multiplierSV = -timingPoint.sv;
            }
            hitObject.inKiai = ENV.inKiai
            hitObject.sv = ENV.multiplierSV;

            HTML.game.gameField.insertBefore(hitObject.html, HTML.game.gameField.firstChild);
            ENV.hitObjects.push(hitObject);
        }
           



        // Update hit objects i.e. moves, checks InputQueue (and follows up)
        for (let o of ENV.hitObjects) {
            let position = o.timing - ENV.progression;

            //if (Math.abs(position) <= 10)
                //o.active = false;

            // Only check notes if they can be hit in the first place
            if (position > -CONFIG.defaultOkTiming && position < CONFIG.defaultBadTiming) {
                let timingDifference = null;

                for (let input of ENV.inputQueue)
                    if (input.active) {
                        // TODO: Add double note functionality
                        if ((input.type == 'lr' || input.type == 'rr') && (o.type == 1 || o.type == 3)) {
                            timingDifference = Math.abs((input.at - ENV.progression) + position);
                        }
                        if ((input.type == 'lc' || input.type == 'rc') && (o.type == 0 || o.type == 2)) {
                            timingDifference = Math.abs((input.at - ENV.progression) + position);
                        }

                        if (timingDifference != null) {
                            if (timingDifference <= CONFIG.defaultGoodTiming) {
                                ENV.timingUIQueue.unshift({at: ENV.progression, anim: new TAIKO.Animation(LINKS.goodJudgement, 0.5, 'judgement'), type: `good${o.type == 2 || o.type == 3 ? (o.type == 2 ? '-big-don' : '-big-katu') : ''}`})
                                ENV.combo++;
                                ENV.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    ENV.combo > 10 ? (ENV.combo > 30 ? (ENV.combo > 50 ? (ENV.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0)) * (ENV.inKiai ? 1.20 : 1);
                                ENV.soul += ENV.soulDifficulty * 1.5;
                            }
                            else if (timingDifference <= CONFIG.defaultOkTiming) {
                                ENV.timingUIQueue.unshift({at: ENV.progression, anim: new TAIKO.Animation(LINKS.okJudgement, 0.5, 'judgement'), type: `ok${o.type == 2 || o.type == 3 ? (o.type == 2 ? '-big-don' : '-big-katu') : ''}`})
                                ENV.combo++;
                                ENV.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    ENV.combo > 10 ? (ENV.combo > 30 ? (ENV.combo > 50 ? (ENV.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0)) * 0.5 * (ENV.inKiai ? 1.20 : 1) // half as many points rewarded for ok timing
                                ENV.soul += ENV.soulDifficulty * 0.75;
                            }
                            else {
                                ENV.timingUIQueue.unshift({at: ENV.progression, anim: new TAIKO.Animation(LINKS.poorJudgement, 0.5, 'judgement'), type: ''})
                                if (combo > 30) {
                                    // Play combobreak sound effect
                                }

                                ENV.combo = 0; // No points and combo is broken/reset
                                ENV.soul -= ENV.soulDifficulty * 2;
                            }

                            // Play combo milestone sound effect
                            switch(combo) {
                                case 50: break;
                                case 100: break;
                                case 200: break;
                                case 300: break;
                                case 400: break;  
                                case 500: break;
                                case 600: break;  
                                case 700: break;
                                case 800: break;  
                                case 900: break;
                                case 1000: break;
                                case 1100: break;
                                case 1200: break;  
                                case 1300: break;
                                case 1400: break;  
                                case 1500: break;
                            }

                            o.active = false;
                            input.active = false;   
                        }
                    }
                        
            }


            // Check for input
        // Remove inputs from queue if it has existed longer than the input duration
        ENV.inputQueue = ENV.inputQueue.filter(i => i.at + CONFIG.inputDuration > ENV.progression); 
        // Check for double hits
        for(let i = 0; i < ENV.inputQueue.length - 1; i++)
            if (ENV.inputQueue[i] && ENV.inputQueue[i + 1].at - ENV.inputQueue[i].at < CONFIG.doubleInputWindow)
                switch(ENV.inputQueue[i].type) {
                    case 'lc': 
                        if (ENV.inputQueue[i + 1].type == 'rc') {
                            ENV.soundEffects[i].pause();           // Stop playing regular audio
                            ENV.soundEffects[i + 1].pause();           // Stop playing regular audio

                            if (ENV.timingUIQueue[0]?.type.includes('big-don')) {
                                ENV.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    ENV.combo > 10 ? (ENV.combo > 30 ? (ENV.combo > 50 ? (ENV.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0)) * (ENV.timingUIQueue[0].type.includes('good') ? 1 : 0.5) * (ENV.inKiai ? 1.20 : 1) // half as many points rewarded for ok timing

                                //GAME.timingUIQueue.shift().html.className = 'inactive'; // Remove added UI element since this one below replaces it
                                ENV.timingUIQueue.unshift({at: ENV.progression, anim: new TAIKO.Animation((ENV.timingUIQueue[0].type.includes('good') ? LINKS.goodBigJudgement : LINKS.okBigJudgement), 0.5, 'judgement'), type: ''})
                                
                            }
                            
                            ENV.soundEffects.push(new Audio('./assets/audio/taiko-drum-heavy.wav'));
                            ENV.inputQueue[i + 1].type = 'dc';
                            ENV.inputQueue[i + 1].active = false;  
                        } 
                        break;
                    case 'rc':
                        if (ENV.inputQueue[i + 1].type == 'lc')  {
                            ENV.soundEffects[i].pause();
                            ENV.soundEffects[i + 1].pause();           // Stop playing regular audio

                            if (ENV.timingUIQueue[0]?.type.includes('big-don')) {
                                ENV.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    ENV.combo > 10 ? (ENV.combo > 30 ? (ENV.combo > 50 ? (ENV.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0)) * (ENV.timingUIQueue[0].type.includes('good') ? 1 : 0.5) * (ENV.inKiai ? 1.20 : 1) // half as many points rewarded for ok timing
                                //GAME.timingUIQueue.shift().html.className = 'inactive';
                                ENV.timingUIQueue.unshift({at: ENV.progression, anim: new TAIKO.Animation((ENV.timingUIQueue[0].type.includes('good') ? LINKS.goodBigJudgement : LINKS.okBigJudgement), 0.5, 'judgement'), type: ''})
                            }

                            ENV.inputQueue[i + 1].type = 'dc';
                            ENV.soundEffects[i + 1] = new Audio('./assets/audio/taiko-drum-heavy.wav');
                            ENV.inputQueue[i + 1].active = false;  
                        } 
                        break;
                    case 'lr': 
                        if (ENV.inputQueue[i + 1].type == 'rr')  {
                            ENV.soundEffects[i].pause();
                            ENV.soundEffects[i + 1].pause();           // Stop playing regular audio
                

                            if (ENV.timingUIQueue[0]?.type.includes('big-katu')) {
                                ENV.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    ENV.combo > 10 ? (ENV.combo > 30 ? (ENV.combo > 50 ? (ENV.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0)) * (ENV.timingUIQueue[0].type.includes('good') ? 1 : 0.5) * (ENV.inKiai ? 1.20 : 1) // half as many points rewarded for ok timing
                                //GAME.timingUIQueue.shift().html.className = 'inactive';
                                ENV.timingUIQueue.unshift({at: ENV.progression, anim: new TAIKO.Animation((ENV.timingUIQueue[0].type.includes('good') ? LINKS.goodBigJudgement : LINKS.okBigJudgement), 0.5, 'judgement'), type: ''})
                            }

                            ENV.inputQueue[i + 1].type = 'dr';
                            ENV.soundEffects[i + 1] = new Audio('./assets/audio/taiko-rim-heavy.wav');
                            ENV.inputQueue[i + 1].active = false;  
                        } 
                        break;
                    case 'rr': 
                        if (ENV.inputQueue[i + 1].type == 'lr')  {
                            ENV.soundEffects[i].pause();
                            ENV.soundEffects[i + 1].pause();           // Stop playing regular audio

                            if (ENV.timingUIQueue[0]?.type.includes('big-katu')) {
                                ENV.score += (380 + 90 * ( // Higher combo higher score gained. (380 + 90 * comboBonus) combos is 0 at <10, 1 >10, 2 >30, 4 >50, and 8 >100 (combo)
                                    ENV.combo > 10 ? (ENV.combo > 30 ? (ENV.combo > 50 ? (ENV.combo > 100 ? 
                                        8 : 4) : 2) : 1) : 0)) * (ENV.timingUIQueue[0].type.includes('good') ? 1 : 0.5) * (ENV.inKiai ? 1.20 : 1) // half as many points rewarded for ok timing
                                //GAME.timingUIQueue.shift().html.className = 'inactive';
                                ENV.timingUIQueue.unshift({at: ENV.progression, anim: new TAIKO.Animation((ENV.timingUIQueue[0].type.includes('good') ? LINKS.goodBigJudgement : LINKS.okBigJudgement), 0.5, 'judgement'), type: ''})
                            }

                            ENV.inputQueue[i + 1].type = 'dr';
                            ENV.soundEffects[i + 1] = new Audio('./assets/audio/taiko-rim-heavy.wav');
                            ENV.inputQueue[i + 1].active = false;  
                        } 
                        break;
            }
            
            // Break combo is note is missed (different from poor timing but same result: no points and a broken combo)
            // Checks if a 
            if (position < -CONFIG.defaultOkTiming && position + ENV.delta > -CONFIG.defaultOkTiming) {
                if (combo > 30) {
                    // Play combobreak sound effect
                }

                ENV.soul -= ENV.soulDifficulty * 2;
                ENV.combo = 0;
            }
                

            if (position < -CONFIG.noteDespawnXOffset) // If note moves offscreen, despawn it {}
                o.active = false;
            else
                o.html.style.left = `${(o.timing * CONFIG.baseSV * o.sv) - (ENV.progression * CONFIG.baseSV * o.sv) + CONFIG.hitZoneXOffset}px`;
        }

        // Drum UI hit indicators
        HTML.game.lr.className = "inactive"; HTML.game.rr.className = "inactive"; 
        HTML.game.lc.className = "inactive"; HTML.game.rc.className = "inactive";
        
        for (let input of ENV.inputQueue) {
            switch (input.type) {
                case 'lr': HTML.game.lr.className = ""; break;
                case 'rr': HTML.game.rr.className = ""; break;
                case 'lc': HTML.game.lc.className = ""; break;
                case 'rc': HTML.game.rc.className = ""; break;

                case 'dr': HTML.game.rr.className = ""; HTML.game.lr.className = ""; break;
                case 'dc': HTML.game.rc.className = ""; HTML.game.lc.className = "";break;
            }
        }


        
            


        // Update hit objects in storage thats not active or in queue

        // Change a hit objects storage location depending if it is hit or missed via lack of input



        // Update UI
        // Move top bg, it is 2x vw so set upon moving it half distance
        // Remeber style.left is a string!
        let topScrollX = Number(HTML.game.scrollImage.style.left.replace('px', ''));
        HTML.game.scrollImage.style.left = `${
            (topScrollX < -HTML.game.scrollImage.offsetWidth / 2) ? 
            0 : topScrollX - ENV.delta * CONFIG.scrollBGMoveSpeed
        }px`;


        // use TAIKO.Animation
        for (let judgement of ENV.timingUIQueue) {
            if (judgement.at == ENV.progression) { // change to https://www.w3schools.com/jsref/met_node_insertbefore.asp
                
                // Puts new judgement ui animations on top of previous ones
                if (HTML.game.hitZone.children.length == 0)
                    HTML.game.hitZone.appendChild(judgement.anim.html);
                else
                    HTML.game.hitZone.insertBefore(judgement.anim.html, HTML.game.hitZone.firstChild);
            }

            judgement.anim.update();
        }
        ENV.timingUIQueue = ENV.timingUIQueue.filter(j => {if (j.at + CONFIG.judgementLength < ENV.progression) {j.anim.html.remove(); return false} return true})


        // Updating these per update loop seem ok for performance. 
        // Chrome handles it fine but Firefox handles it a little worse

        
        // Update score display
        // Note: Only made to handle score values up to 9 999 999. Taiko scoring really only reaches 1 mil for longer songs, let alone anything above like 3mil
        HTML.game.score.innerHTML = // Shows all 7 digits
            `
            <li class="ui-${Math.floor(ENV.score             / 1000000)}-score"></li>
            <li class="ui-${Math.floor((ENV.score % 1000000) / 100000) }-score"></li>
            <li class="ui-${Math.floor((ENV.score % 100000)  / 10000)  }-score"></li>
            <li class="ui-${Math.floor((ENV.score % 10000)   / 1000)   }-score"></li>
            <li class="ui-${Math.floor((ENV.score % 1000)    / 100)    }-score"></li>
            <li class="ui-${Math.floor((ENV.score % 100)     / 10)     }-score"></li>
            <li class="ui-${Math.floor((ENV.score % 10))               }-score"></li>
            `

        // Update combo display,
        // Note: Only made to handle combo values up to 9999 (i dont know of a beatmap longer than 3000)
        HTML.game.combo.innerHTML = // Shows only relavent digits, additionally after reaching 100 combo, use gold letter (since combo bonus stops increasing after 100 anyways)
            `
            <li class="ui-${ENV.combo > 999 ? Math.floor(ENV.combo / 1000)         + (ENV.combo >= 100 ? '-gold' : '') : ''}"></li>
            <li class="ui-${ENV.combo > 99  ? Math.floor((ENV.combo % 1000) / 100) + (ENV.combo >= 100 ? '-gold' : '') : ''}"></li>
            <li class="ui-${ENV.combo > 9   ? Math.floor((ENV.combo % 100) / 10)   + (ENV.combo >= 100 ? '-gold' : '') : ''}"></li>
            <li class="ui-${ENV.combo > 0   ? Math.floor(ENV.combo % 10)           + (ENV.combo >= 100 ? '-gold' : '') : ''}"></li>
            `


        if (ENV.soul > 100) ENV.soul = 100;
        if (ENV.soul < 0) ENV.soul = 0;

        if (ENV.soul == 100) {
            HTML.game.soulFilled.style.backgroundImage = "url(./assets/ui/soul-completed.png)";
            HTML.game.soulIndicator.style.backgroundImage = "url(./assets/ui/soul-indicator-pass.png)";
            HTML.game.soulIndicator.innerHTML = `<span id="soul-indicator-complete"></span>`
            HTML.game.soulFilled.style.clipPath = `rect(0 ${ENV.soul}% 100% 0)`
        }
        else {
            HTML.game.soulFilled.style.backgroundImage = "url(./assets/ui/soul-completion.png)";
            HTML.game.soulFilled.style.clipPath = `rect(0 ${ENV.soul}% 100% 0)`
            HTML.game.soulIndicator.innerHTML = '';

            if (ENV.soul >= 77.6) { // 77.6% is passing. Technically you'd only need 75% but we dont get that luxury with this current soul guage implementation
                HTML.game.soulIndicator.style.backgroundImage = "url(./assets/ui/soul-indicator-pass.png)";
                //HTML.scrollImageOverlay.style.left = HTML.scrollImage.style.left //`${(topScrollX < -HTML.scrollImage.offsetWidth / 2) ? 0 : topScrollX - GAME.delta * CONFIG.scrollBGMoveSpeed}px`
                HTML.game.scrollImageOverlay.style.opacity = (ENV.soul - 77.6) / 17.4;

            }
            else {
                HTML.game.soulIndicator.style.backgroundImage = "url(./assets/ui/soul-indicator.png)";
                HTML.game.scrollImageOverlay.style.opacity = 0;
            }
                
        }

        if (ENV.hitObjects[0]?.inKiai) {
            HTML.game.hitZoneKiai.className = '';
        }
        else
            HTML.game.hitZoneKiai.className = 'inactive';

            // Is SV just backwards?? update: it was but osu!taiko seems to have an additional modifier on some sv to ease transition so TODO look that up


        //debugger
        ENV.progression += ENV.delta;
    }

    if (ENV.beatmapStarted && !ENV.hitObjects.length) { // End map and return to song select
        HTML.game.self.className       = 'inactive';
        HTML.songSelect.self.className = '';

        ENV.beatmapStarted = false;
        ENV.initBeatmap = false;
        ENV.loadedBeatmap = null;
    }
}

window.onkeydown = (event) => {
    let __key = event.key; 
    let key = event.key.toLowerCase();


    if (ENV.readingKeybindInputs) {
        let duplicateKeybindFlag = false;

        switch (ENV.keybindInputType) {
            case "don-l":
                ENV.keybindInputType = "don-r";

                if (key == USER.keybinds.donR) // If user inputs key used for right varient as left, just swap the two
                    USER.keybinds.donR = USER.keybinds.donL;
                

                for (let input in USER.keybinds) // Prevent duplicate inputs
                    if (key == USER.keybinds[input])
                        duplicateKeybindFlag = true;

                if (!duplicateKeybindFlag)
                    USER.keybinds.donL = key;
                break;
            case "don-r":
                ENV.readingKeybindInputs = false;
                HTML.menu.keybindWindow.className = "inactive";

                duplicateKeybindFlag = false;
                for (let input in USER.keybinds)
                    if (key == USER.keybinds[input])
                        duplicateKeybindFlag = true;


                if (!duplicateKeybindFlag)
                    USER.keybinds.donR = key;

                
                HTML.menu.keybindDon.innerHTML = `${USER.keybinds.donL.toUpperCase()} ${USER.keybinds.donR.toUpperCase()}`;
                localStorage.setItem(CONFIG.localStorageTag + "keybinds", JSON.stringify(USER.keybinds));
                break;

            case "katsu-l":
                ENV.keybindInputType = "katsu-r";

                if (key == USER.keybinds.donR)
                    USER.keybinds.katsuR = USER.keybinds.katsuL;

                for (let input in USER.keybinds)
                    if (key == USER.keybinds[input])
                        duplicateKeybindFlag = true;

                if (!duplicateKeybindFlag)
                    USER.keybinds.katsuL = key;
                break;
            case "katsu-r":
                ENV.readingKeybindInputs = false;
                HTML.menu.keybindWindow.className = "inactive";

                duplicateKeybindFlag = false;
                for (let input in USER.keybinds)
                    if (key == USER.keybinds[input])
                        duplicateKeybindFlag = true;

                if (!duplicateKeybindFlag)
                    USER.keybinds.katsuR = key;

                HTML.menu.keybindKatsu.innerHTML = `${USER.keybinds.katsuL.toUpperCase()} ${USER.keybinds.katsuR.toUpperCase()}`;
                localStorage.setItem(CONFIG.localStorageTag + "keybinds", JSON.stringify(USER.keybinds));
                break;
        }
    }


    if (ENV.beatmapStarted)
        switch(event.key.toLowerCase()) {
            case USER.keybinds.donL: if (!ENV.input.lc) {
                ENV.input.lc = true; 
                ENV.inputQueue.push({type: 'lc', at: ENV.progression, active: true}); 
                ENV.soundEffects.push(new Audio('./assets/audio/taiko-drum.wav'));} 
                break;
            case USER.keybinds.donR: if (!ENV.input.rc) {ENV.input.rc = true; ENV.inputQueue.push({type: 'rc', at: ENV.progression, active: true}); ENV.soundEffects.push(new Audio('./assets/audio/taiko-drum.wav'));} break;
            case USER.keybinds.katsuL: if (!ENV.input.lr) {ENV.input.lr = true; ENV.inputQueue.push({type: 'lr', at: ENV.progression, active: true}); ENV.soundEffects.push(new Audio('./assets/audio/taiko-rim.wav'));} break;
            case USER.keybinds.katsuR: if (!ENV.input.rr) {ENV.input.rr = true; ENV.inputQueue.push({type: 'rr', at: ENV.progression, active: true}); ENV.soundEffects.push(new Audio('./assets/audio/taiko-rim.wav'));} break;
        }
}
window.onkeyup = e => {
    if (ENV.beatmapStarted)
        switch(e.key.toLowerCase()) {
            case USER.keybinds.donL: if (ENV.input.lc) ENV.input.lc = false; break;
            case USER.keybinds.donR: if (ENV.input.rc) ENV.input.rc = false; break;
            case USER.keybinds.katsuL: if (ENV.input.lr) ENV.input.lr = false; break;
            case USER.keybinds.katsuR: if (ENV.input.rr) ENV.input.rr = false; break;
        }
}


onload();


// Add pop up transition for showing/hiddening windows (i.e. clicking the settings button to access the settings menu)
// Add a slide transition for switching contexts (i.e. song select to in game) 


// TODO rememeber to read first sv multiplier 
// TODO For music preview, use longest kiai time (or if no kiai then just start from begininining)

// use curtains in game to help have a better video box size for resolution purposes

// reset keybind menu when clicking back