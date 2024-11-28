const Taiko = {
    Beatmap: class Beatmap {
        constructor() {
            // Data that directly controls the gameplay
            this.hitObjects   = [];
            this.timingPoints = [];
            
            // Data that indirectly impacts the map's difficulty
            this.settings = {soulDifficulty: null, timingDifficulty: null, baseSV: null};

            // External info that doesn't impact the gameplay
            this.meta = {song: null, author: null, mapper: null, difficulty: null};
        }
    },

    // Idea is that will do  `<li class="${HitObjectCSSTypes[HitObject.type][gameplayStateVariable]}"></li>`    when adding this to the active hitobjects html element

    HitObject: class HitObject {
        constructor(type, timing) {
            this.type   = type;   // Controls the kind of note 
            this.timing = timing; // Controls when, in ms and from the start of the song, this note should reach the hitzone
            
            // When creating note elements in HTML, make sure to set the relavent 
            // class to control the design/display properties of the note

            // General HTML formatting for any hitobject should look like this
            /*
            hitObjectContainerHTML.innerHTML += `<li class=""></li>`

            // an example of adding a don element to the playfield
            hitObjectContainerHTML.innerHTML += `<li class="_don"></li>`
            */
            
            // CSS class names for each type of hitObject (note, classes applied during JS execution start with an underscore)
            // _don-static & _don-big-static   --after reachng 50 combo--> _don-anim & _don-big-anim --after reaching 150 combo-->  _don-anim-fast & _don-big-anim-fast
            // _katsu-static & _katsu-big-static   --after reachng 50 combo--> _katsu-anim & _katsu-big-anim --after reaching 150 combo-->  _katsu-anim-fast & _katsu-big-anim-fast
        }
    },

    TimingPoint: class TimingPoint {
        constructor(timing, sv, volume, kiai) {
            this.timing = timing; // Number (in ms)
            this.sv     = sv;     // Number ("Slider Velocity" or how fast the beats move from right to left)
            this.volume = volume; // Number
            this.kiai   = kiai;   // Bool
        }
    },
}

const Util = {
    GetRawText: function (file) {
        let reader = new FileReader();
        reader.onload = e => {
            let raw = e.target.result;
            Util.ConvertOSU(raw);
        }
        reader.readAsText(file);
    },

    ConvertOSU: function (raw) {
        BEATMAP = new Taiko.Beatmap();
        
        let lines = raw.split('\n');
        if (!lines || lines.length == 0 || !lines[0].includes("osu file format v"))
            return null;
    
        for (let index = 0; index < lines.length; index++) {
            let line = lines[index];
    
            if (line.includes("TitleUnicode:"))
                BEATMAP.meta.title = line.slice(13, line.length - 1);
    
            else if (line.includes("ArtistUnicode:"))
                BEATMAP.meta.artist = line.slice(14, line.length - 1);
    
            else if (line.includes("Creator:"))
                BEATMAP.meta.mapper = line.slice(8, line.length - 1);
    
            else if (line.includes("Version:"))
                BEATMAP.meta.difficulty = line.slice(8, line.length - 1);


            else if (line.includes("HPDrainRate:"))
                BEATMAP.settings.soulDifficulty = Number(line.slice(12, line.length - 1));
    
            else if (line.includes("OverallDifficulty:"))
                BEATMAP.settings.timingDifficulty = Number(line.slice(18, line.length - 1));

            else if (line.includes("SliderMultiplier:"))
                BEATMAP.settings.baseSV = Number(line.slice(17, line.length - 1));


            else if (line.includes("[TimingPoints]")) {
                let timingPoint;

                for (index++; lines[index].length != 1; index++) {
                    timingPoint = lines[index].split(',');
                    BEATMAP.timingPoints.push(new Taiko.TimingPoint(
                        Number(timingPoint[0]),      // Timing in ms
                        
                        Number(timingPoint[1]) > 0 ? Number(timingPoint[1]) : Number(timingPoint[1]) / 50,

                        Number(timingPoint[6]),      // Volumne
                        timingPoint[8] == '1'));     // In kiai time
                }
            }

            else if (line.includes("[HitObjects]")) { 
                let hitObject;

                for (index++; index < lines.length && lines[index].length != 1; index++) {
                    hitObject = lines[index].split(',');
                    switch(hitObject[4]) {
                        case '0':  // don
                            BEATMAP.hitObjects.push(new Taiko.HitObject(0, Number(hitObject[2])));
                            break;
                        case '8':  // katu
                            BEATMAP.hitObjects.push(new Taiko.HitObject(1, Number(hitObject[2])));
                            break;
    
                        case '4':  // big don
                            BEATMAP.hitObjects.push(new Taiko.HitObject(2, Number(hitObject[2])));
                            break;
                        case '12': // big katu
                            BEATMAP.hitObjects.push(new Taiko.HitObject(3, Number(hitObject[2])));
                            break;
    
                        default: // Type not implemented, currently: drumrolls and dandans
                            //data.hitObjects.push(new Taiko.HitObject(-1, Number(hitObject[2])));
                            break;
                        }
                }
                    

                // No important data should be following hitObjects, so stop searching here
                break;
            }
        }

    },
    ConvertOSZ: function (rawData) {

    },
}

const Setup = {
    GetGameHTML: function () {
        return { 
            game: document.querySelector("#game-window"),

            soulBar:    document.querySelector("#soul-bar"),
            soulFilled: document.querySelector("#soul-filled"),

            score: document.querySelector("#score"),
            combo: document.querySelector("#combo"),

            gameField: document.querySelector("#game-field"),

            lr: document.querySelector("#drum-lr"),
            rr: document.querySelector("#drum-rr"),
            lc: document.querySelector("#drum-lc"),
            rc: document.querySelector("#drum-rc"),

            scrollImage: document.querySelector("#top"),
            bgImage:     document.querySelector("#bottom"),
        }
    }
}