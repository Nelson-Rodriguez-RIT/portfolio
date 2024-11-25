const Taiko = {
    Beatmap: class Beatmap {
        constructor(file) {
            // Accept both OSU and OSZ, but OSZ requires an unzip library
            // so only OSUs will be functional for this dev build
            let data = Util.ConvertOSU(Util.GetRawText(file))
            if (!data) {console.log(`Failed to convert file to beatmap, are you sure you uploaded an .OSU file?\n`); return;}


            // Data that directly controls the gameplay
            this.hitObjects       = data.hitObjects;
            this.sliderVelocities = data.sliderVelocities;
            
            // Data that indirectly impacts the map's difficulty
            this.settings = data.settings; // = {healthDifficulty, timingDifficulty}

            // External info that doesn't impact the gameplay
            this.meta = data.meta; // = {song, author, mapper, difficulty}
        }
    },

    // CSS class names
    HitObjectCSSTypes: [
        // HitObject.type directly correlates for the first array...
        /* Don 1 */ [ //...but the nested array is different varients/states (i.e. don w/ mouth closed, don w/ mouth open) 
            '_don-static',       '_don-anim',       '_don-anim-fast' 
        ],
        /* Don Big 2*/ [
            '_don-big-static',   '_don-big-anim',   '_don-big-anim-fast' 
        ],

        /* Katsu 3 */ [
            '_katsu-static',     '_katsu-anim',     '_katsu-anim-fast' 
        ],
        /* Katsu Big 4*/ [
            '_katsu-big-static', '_katsu-big-anim', '_katsu-big-anim-fast' 
        ],


        // Idea is that will do  `<li class="${HitObjectCSSTypes[HitObject.type][gameplayStateVariable]}"></li>`    when adding this to the active hitobjects html element
    ],

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
}

const Util = {
    GetRawText: function (file) {

    },

    ConvertOSU: function (rawData) {
        
    },
    ConvertOSZ: function (rawData) {

    },
}