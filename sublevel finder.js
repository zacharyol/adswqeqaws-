// =========================================================
// GRAB RECURSIVE SUBLEVEL DOWNLOADER (Injected GUI Version)
// =========================================================

const GrabSubLevelModule = (() => {

    const SETTINGS = {
        recursive: true,
        autoDownload: true,
        log: true,
        proxy: null,
        delayBetweenDownloads: 500
    };

    const scanned = new Set();
    const found = [];

    function log(...args) {
        if (SETTINGS.log) {
            console.log("[GrabSubLevelModule]", ...args);
        }
        const logEl = document.getElementById('grab-gui-log');
        if (logEl) {
            const msg = args.join(" ");
            const div = document.createElement('div');
            div.textContent = msg;
            if (msg.includes("Failed") || msg.includes("Error") || msg.includes("Invalid")) {
                div.style.color = "#ff5555";
            }
            logEl.appendChild(div);
            logEl.scrollTop = logEl.scrollHeight;
            updateResultsUI();
        }
    }

    function updateResultsUI() {
        const resEl = document.getElementById('grab-gui-results');
        if (!resEl) return;
        resEl.innerHTML = `<strong style="margin-bottom:8px; display:block; color:#fff;">Found Sublevels (${found.length}):</strong>`;
        found.forEach(f => {
            const d = document.createElement('div');
            d.style.cssText = "background:#2d2d2d; padding:8px; border-radius:4px; font-family:monospace; font-size:11px; word-break:break-all; border-left:3px solid #0d6efd; margin-bottom:5px; color:#eee;";
            d.textContent = f;
            resEl.appendChild(d);
        });
    }

    let LevelMessage = null;

    const PROTO_DEF = String.raw`syntax = "proto3";

package COD.GASM;

message OperandData
{
	enum Type
	{
		OpInputRegister = 0;
		OpOutputRegister = 1;
		OpWorkingRegister = 2;
		OpSpecialRegister = 3;
		OpConstant = 4;
		OpLabel = 5;
		OpJumpAddress = 6;
		OpInOutRegister = 7;
	}
	Type type = 1;
	oneof content
	{
		uint32 index = 2;
		float value = 3;
	}
}

message InstructionData
{
	enum Type
	{
		InNoop = 0;
		InSet = 1;
		InSwap = 2;
		InAdd = 3;
		InSub = 4;
		InMul = 5;
		InDiv = 6;
		InEqual = 7;
		InLess = 8;
		InGreater = 9;
		InAnd = 10;
		InOr = 11;
		InNot = 12;
		InLabel = 13;
		InGoto = 14;
		InIf = 15;
		InSleep = 16;
		InEnd = 17;
		InRand = 18;
		InFloor = 19;
		InMod = 20;
		InSin = 21;
		InCos = 22;
		InSqrt = 23;
		InAtan2 = 24;
	}
	Type type = 1;
	repeated OperandData operands = 2;
}

message RegisterData
{
	string name = 1;
}

message LabelData
{
	string name = 1;
}

message ProgramData
{
	repeated RegisterData inputRegisters = 1;
	repeated RegisterData outputRegisters = 2;
	repeated RegisterData workingRegisters = 3;
	repeated RegisterData inoutRegisters = 6;
	
	repeated LabelData labels = 4;
	
	repeated InstructionData instructions = 5;
}

message ProgrammablePositionData
{
}

message ProgrammableRotationData
{
}

message ProgrammableScaleData
{
}

message ProgrammableTriggerActive
{
}

message ProgrammablePlayerData
{
}

message ProgrammableSignData
{
}

message ProgrammableColorData
{
}

message ProgrammablePhysicsData
{
}

message ProgrammableLightData
{
}

message ProgrammablePropertyData
{
	message Component
	{
		int32 inputRegisterIndex = 1;
		int32 outputRegisterIndex = 2;
		int32 inoutRegisterIndex = 3;
	}

	uint64 objectID = 1;
	repeated Component components = 2;
	
	oneof content
	{
		ProgrammablePositionData position = 3;
		ProgrammableTriggerActive triggerActive = 4;
		ProgrammableRotationData rotation = 5;
		ProgrammablePlayerData player = 6;
		ProgrammableSignData sign = 7;
		ProgrammableColorData color = 8;
		ProgrammableScaleData scale = 9;
		ProgrammablePhysicsData physics = 10;
		ProgrammableLightData light = 11;
	}
}

message ProgrammableSignUpdateData
{
	string text = 1;
}

message ProgrammablePropertyUpdateData
{
	repeated float components = 1;

	oneof content
	{
		ProgrammableSignUpdateData sign = 2;
	}
}


syntax = "proto3";

package COD.Types;



message Vector
{
	float x = 1;
	float y = 2;
	float z = 3;
}

message Vector2
{
	float x = 1;
	float y = 2;
}

message Quaternion
{
	float x = 1;
	float y = 2;
	float z = 3;
	float w = 4;
}

message Color
{
	float r = 1;
	float g = 2;
	float b = 3;
	float a = 4;
}

message AmbienceSettings
{
	Color skyZenithColor = 1;
	Color skyHorizonColor = 2;

	float sunAltitude = 3;
	float sunAzimuth = 4;
	float sunSize = 5;

	float fogDensity = 6;

	optional bool useAdvancedSunSettings = 7;
	Color sunColor = 8;
	optional float sunBrightness = 9;

	Color ambientColor = 10;
	optional float ambientBrightness = 11;
}

enum LevelNodeShape
{
	START = 0;
	FINISH = 1;
	SIGN = 2;
	GRAVITY = 3;
	LOBBYTERMINAL = 4;
	PARTICLE_EMITTER = 5;
	SOUND = 6;
	GASM = 7;
	LIGHT = 8;

	__END_OF_SPECIAL_PARTS__ = 9;

	CUBE = 1000;
	SPHERE = 1001;
	CYLINDER = 1002;
	PYRAMID = 1003;
	PRISM = 1004;
	CONE = 1005;
	PYRAMIDSQUARE = 1006;
}

enum LevelNodeMaterial
{
	DEFAULT = 0;
	GRABBABLE = 1;
	ICE = 2;
	LAVA = 3;
	WOOD = 4;
	GRAPPLABLE = 5;
	GRAPPLABLE_LAVA = 6;

	GRABBABLE_CRUMBLING = 7;
	DEFAULT_COLORED = 8;
	BOUNCING = 9;
	SNOW = 10;

	TRIGGER = 11; //Not actually written into files and the number on this could be changed without issues. Only used as enum value internally.
}

enum InterpolationType
{
	LINEAR = 0;
	QUADRATIC_EASE_IN = 1;
	QUADRATIC_EASE_OUT = 2;
	QUADRATIC_EASE_IN_OUT = 3;
	SINUSOIDAL_EASE_IN = 4;
	SINUSOIDAL_EASE_OUT = 5;
	SINUSOIDAL_EASE_IN_OUT = 6;
	EXPONENTIAL_EASE_IN = 7;
	EXPONENTIAL_EASE_OUT = 8;
	EXPONENTIAL_EASE_IN_OUT = 9;
	CIRCULAR_EASE_IN = 10;
	CIRCULAR_EASE_OUT = 11;
	CIRCULAR_EASE_IN_OUT = 12;
	CUBIC_EASE_IN = 13;
	CUBIC_EASE_OUT = 14;
	CUBIC_EASE_IN_OUT = 15;
	QUARTIC_EASE_IN = 16;
	QUARTIC_EASE_OUT = 17;
	QUARTIC_EASE_IN_OUT = 18;
	QUINTIC_EASE_IN = 19;
	QUINTIC_EASE_OUT = 20;
	QUINTIC_EASE_IN_OUT = 21;
}

message LevelNodeGroup
{
	Vector position = 1;
	Vector scale = 2;
	Quaternion rotation = 3;

	//This is where level nodes that are part of the group are stored when saving to file / loading
	//It is ok to be empty when networking a groups transform
	//There is an additional message for networking grouping and ungrouping (LevelNodeGroupRequest, LevelNodeGroupResponse)
	//When sending the full level on a new player joining the editor, first the level nodes are sent on their own and then a group response to group them
	repeated LevelNode childNodes = 4;
	
	string name = 5;
	bool physicsObject = 6;
	bool localPhysicsObject = 7;
	float mass = 8;
}

message LevelNodeStart
{
	Vector position = 1;
	Quaternion rotation = 2; //Should always be upright and is meant to be used for the player rotation on spawn
	float radius = 3;
	string name = 4;
	bool isHidden = 5;
}

message LevelNodeFinish
{
	Vector position = 1;
	float radius = 2;
}

message LevelNodeStatic
{
	LevelNodeShape shape = 1; //Must be one of CUBE, SPHERE, CYLINDER, PYRAMID, PRISM
	LevelNodeMaterial material = 2; //Can not be GRABBABLE_CRUMBLING

	Vector position = 3;
	Vector scale = 4;
	Quaternion rotation = 5;

	Color color1 = 6;
	Color color2 = 9; //Used for colored lava blocks, blending between the two colors, but also used for specularity on colored default blocks!
	Vector gradientDirection = 14;

	optional float specularBrightness = 15;

	bool isNeon = 7;
	bool isTransparent = 8;
	bool isGradient = 13;
	bool isAdditive = 16;

	bool isGrabbable = 10; //Used for DEFAULT_COLORED material to allow grabbing it or not
	bool isGrapplable = 11; //Used for DEFAULT_COLORED material to allow grappling it or not
	bool isPassable = 12;
}

message LevelNodeCrumbling
{
	LevelNodeShape shape = 1; //Must be one of CUBE, SPHERE, CYLINDER, PYRAMID, PRISM
	LevelNodeMaterial material = 2; //Must be GRABBABLE_CRUMBLING

	Vector position = 3;
	Vector scale = 4;
	Quaternion rotation = 5;

	float stableTime = 6;
	float respawnTime = 7;
	
	bool isLocal = 8;
}

message LevelNodeSign
{
	enum SignFontWeight {
		REGULAR = 0;
		LIGHT = 1;
		SEMIBOLD = 2;
		BOLD = 3;
		ITALIC = 4;
	}

	Vector position = 1;
	Quaternion rotation = 2;
	float scale = 4;

	string text = 3;
	Color color = 5;
	SignFontWeight weight = 7;
	bool hideModel = 6;

	optional bool isNeon = 8;
}

message LevelNodeGravity
{
	enum Mode
	{
		DEFAULT = 0;
		NOLEGS = 1; //gtag like movement with the head on the ground, also no leg collisions with lava
	}

	Mode mode = 1;

	Vector position = 2;
	Vector scale = 3;
	Quaternion rotation = 4;

	Vector direction = 5;
}

message LevelNodeLobbyTerminal
{
	Vector position = 2;
	Quaternion rotation = 4;
}

message LevelNodeParticleEmitter
{
	Vector position = 1;
	Vector scale = 2;
	Quaternion rotation = 3;

	uint32 particlesPerSecond = 5;

	Vector2 lifeSpan = 6;
	Color startColor = 7;
	Color endColor = 8;
	Vector2 startSize = 9;
	Vector2 endSize = 10;
	
	Vector velocity = 14;
	Vector velocityMin = 15;
	Vector velocityMax = 16;
	Vector accelerationMin = 17;
	Vector accelerationMax = 18;
}

message TriggerSourceBasic
{
	enum Type
	{
		HAND = 0;
		HEAD = 1;
		GRAPPLE = 2;
		FEET = 3;
		BLOCK = 4;
	}

	Type type = 1;
}

message TriggerSourceBlockNames
{
	repeated string names = 1;
}

message TriggerSource
{
	oneof content
	{
		TriggerSourceBasic triggerSourceBasic = 1;
		TriggerSourceBlockNames triggerSourceBlockNames = 2;
	}
}

message TriggerTargetAnimation
{
	enum Mode
	{
		STOP = 0;
		START = 1;
		TOGGLE = 2; //Toggles between start and stop
		TOGGLE_REVERSE = 3; //Toggles between playing the animation forwards and backwards
		RESTART = 4; //Like start, but will always play from the beginning (or end if reverse is on)
		RESET = 5; //Reset to the initial state, playing looped default animation if there is one
	}

	uint64 objectID = 1;
	string animationName = 2;

	bool loop = 3; //Make the animation repeat endlessly until it is stopped
	bool reverse = 4; //Make the animation play backwards

	Mode mode = 10;
}

message TriggerTargetSound
{
	enum Mode
	{
		STOP = 0;
		START = 1;
		TOGGLE = 2; //Toggles between start and stop
		RESTART = 3; //Like start, but will always play from the beginning (or end if reverse is on)
		RESET = 4; //Reset to the initial state, playing looped default animation if there is one
	}

	uint64 objectID = 1;
	
	Mode mode = 2;
	bool repeat = 3;
}

message TriggerTargetGASM
{
	enum Mode
	{
		STOP = 0;
		START = 1;
		TOGGLE = 2;
		RESTART = 3;
		RESET = 4;
	}

	uint64 objectID = 1;
	
	Mode mode = 2;
}

message TriggerTargetLight
{
  uint64 objectID = 1;
  Color color = 2;
  float range = 3;
  float brightness = 4;
  float fadeDuration = 5;
}

message TriggerTargetSubLevel
{
	string levelIdentifier = 1;
	string spawnPoint = 2;
}

message TriggerTargetAmbience
{
	Color skyColor0 = 1;
	Color skyColor1 = 2;

	float sunAltitude = 3;
	float sunAzimuth = 4;
	float sunSize = 5;

	float fogDensity = 6;
	
	float changeDuration = 7;
	InterpolationType interpolationType = 8;

	optional bool useAdvancedSunSettings = 9;
	Color sunColor = 10;
	optional float sunBrightness = 11;

	Color ambientColor = 12;
	optional float ambientBrightness = 13;
}

message TriggerTarget
{
	enum Mode
	{
		ONENTER = 0; //Needs to be 0 for backwards compatibility
		ONLEAVE = 1;
		ONENTERONLEAVE = 2;
		NONE = 3;
	}

	Mode mode = 4;

	oneof content
	{
		TriggerTargetAnimation triggerTargetAnimation = 1;
		TriggerTargetSubLevel triggerTargetSubLevel = 2;
		TriggerTargetSound triggerTargetSound = 3;
		TriggerTargetAmbience triggerTargetAmbience = 6;
		TriggerTargetGASM triggerTargetGASM = 7;
		TriggerTargetLight triggerTargetLight = 8;
	}
}

message LevelNodeTrigger
{
	LevelNodeShape shape = 1; //Must be one of CUBE, SPHERE, CYLINDER, PYRAMID, PRISM

	Vector position = 2;
	Vector scale = 3;
	Quaternion rotation = 4;

	bool isShared = 5;

	repeated TriggerSource triggerSources = 6;
	repeated TriggerTarget triggerTargets = 7;
}

message SoundGeneratorParameters
{
	enum WaveType
	{
		Square = 0;
		Sawtooth = 1;
		Sine = 2;
		Noise = 3;
	}

	float volume = 1;

	WaveType waveType = 2;

	float envelopeAttack = 3;
	float envelopeSustain = 4;
	float envelopeRelease = 5;
	float envelopePunch = 6;

	float frequencyBase = 7;
	float frequencyLimit = 8;
	float frequencyRamp = 9;
	float frequencyDeltaRamp = 10;

	float vibratoStrength = 11;
	float vibratoSpeed = 12;

	float pitchJumpMod = 13;
	float pitchJumpSpeed = 14;

	float dutyCycle = 15;
	float dutyCycleRamp = 16;

	float repeatSpeed = 17;

	float flangerFrequency = 18;
	float flangerDepth = 19;

	float lowPassFilterFrequency = 20;
	float highPassFilterFrequency = 21;
	
	float reverbDelay = 22;
	float reverbDecayFactor = 23;
}

message LevelNodeSound
{
	Vector position = 1;
	Quaternion rotation = 7;

	SoundGeneratorParameters parameters = 2;
	string name = 3;
	bool repeat = 4;
	float volume = 5;
	bool startActive = 6;
	float maxRangeFactor = 8;
}

message LevelNodeGASM
{
	message Connection
	{
		enum Type
		{
			NODE = 0;
			PLAYER = 1;
		}
	
		Type type = 4;
		uint64 objectID = 1;
		string name = 2;
		repeated GASM.ProgrammablePropertyData properties = 3;
	}

	Vector position = 1;
	Vector scale = 5;
	Quaternion rotation = 6;
	
	GASM.ProgramData program = 2;
	
	repeated Connection connections = 3;
	
	bool startActive = 4;
	bool isShared = 7;
	bool lateUpdate = 8;
}

message LevelNodeLight {
	enum Type {
		POINT = 0;
		SPOT = 1;
	}

	Vector position = 1;
	Quaternion rotation = 2;

	Type type = 3;
	Color color = 4;
	float intensity = 5;
	float range = 6;
	float angle = 7;

	optional float distanceFalloffShape = 8;
	optional float coneFalloffShape = 9;
}

message AnimationFrame
{
	float time = 1;
	Vector position = 2;
	Quaternion rotation = 3;
}

message Animation
{
	enum Direction
	{
		RESTART = 0; //After the last frame, jump back to the first frame
		PINGPONG = 1; //After the last frame, play the animation backwards
	}

	enum Interpolation
	{
		LINEAR = 0;
		CATMULL_ROM = 1;
	}

	string name = 1;
	repeated AnimationFrame frames = 2;
	Direction direction = 3;
	float speed = 4;
	Interpolation interpolation = 5;
}

message LevelNode
{
	bool isLocked = 6;

	oneof content
	{
		LevelNodeStart levelNodeStart = 1;
		LevelNodeFinish levelNodeFinish = 2;
		LevelNodeStatic levelNodeStatic = 3;
		LevelNodeSign levelNodeSign = 4;
		LevelNodeCrumbling levelNodeCrumbling = 5;
		LevelNodeGroup levelNodeGroup = 7;
		LevelNodeGravity levelNodeGravity = 8;
		LevelNodeLobbyTerminal levelNodeLobbyTerminal = 9;
		LevelNodeTrigger levelNodeTrigger = 10;
		LevelNodeParticleEmitter levelNodeParticleEmitter = 11;
		LevelNodeSound levelNodeSound = 12;
		LevelNodeGASM levelNodeGASM = 13;
		LevelNodeLight levelNodeLight = 14;
	}

	repeated Animation animations = 15; //A level node can have any number (might limit it in the UI) of named animations
	int32 activeAnimation = 16; //Index into animations, -1 if it is not playing an animation at the start, ignored if there are no animations (so will default to 0 in that case)
	bool wantsCreationHistory = 17; //Player still dragging this from the menu and creation is yet to be added to the undo history.
}

syntax = "proto3";

package COD.Level;



message Level
{
	uint32 formatVersion = 1;

	string title = 2;
	repeated string tags = 9;
	string creators = 3;
	string description = 4;
	uint32 complexity = 5;
	uint32 maxCheckpointCount = 7;

	Types.AmbienceSettings ambienceSettings = 8;
	
	uint64 defaultSpawnPointID = 10;

	repeated Types.LevelNode levelNodes = 6;

	bool unlisted = 11;
	bool showReplays = 12;
}
`;

    async function initProto() {
        if (LevelMessage) return;
        log("Loading protobuf definitions...");
        
        // Auto-inject protobuf.js if it doesn't exist on the page
        if (typeof protobuf === 'undefined') {
            log("protobuf.js not found. Injecting from CDN...");
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = "https://cdn.jsdelivr.net/npm/protobufjs@7.2.5/dist/protobuf.min.js";
                script.onload = resolve;
                script.onerror = () => reject(new Error("Failed to load protobuf.js"));
                document.head.appendChild(script);
            });
        }

        const root = protobuf.parse(PROTO_DEF).root;
        LevelMessage = root.lookupType("COD.Level.Level");
        log("Proto loaded successfully.");
    }

    async function getDownloadNumber(userid, levelid) {
        const res = await fetch(`https://api.slin.dev/grab/v1/details/${userid}/${levelid}`);
        if (!res.ok) throw new Error("Failed to fetch details");
        const data = await res.json();
        if (!data.data_key) throw new Error("Missing data_key");
        const expected = `level_data:${userid}:${levelid}:`;
        if (!data.data_key.startsWith(expected)) throw new Error("Invalid data_key format");
        return data.data_key.substring(expected.length);
    }

    async function fetchLevelBuffer(userid, levelid, number) {
        let url = `https://api.slin.dev/grab/v1/download/${userid}/${levelid}/${number}`;
        if (SETTINGS.proxy) {
            url = `${SETTINGS.proxy}?userid=${userid}&levelid=${levelid}&num=${number}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return await res.arrayBuffer();
    }

    async function levelToJSON(arrayBuffer) {
        await initProto();
        const uint8 = new Uint8Array(arrayBuffer);
        const decoded = LevelMessage.decode(uint8);
        return LevelMessage.toObject(decoded, {
            longs: String,
            enums: String,
            defaults: true,
            arrays: true,
            objects: true
        });
    }

    async function downloadLevel(userid, levelid, number, version) {
        const url = `https://api.slin.dev/grab/v1/download/${userid}/${levelid}/${number}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `${levelid}_${version}.level`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        log("Downloaded:", levelid);
    }

    function findSubLevels(obj, output = []) {
        if (!obj || typeof obj !== "object") return output;
        for (const key in obj) {
            const value = obj[key];
            if (key === "triggerTargetSubLevel" && value?.levelIdentifier) {
                output.push(value.levelIdentifier);
            }
            if (typeof value === "object") {
                findSubLevels(value, output);
            }
        }
        return output;
    }

    async function scan(identifier) {
        if (scanned.has(identifier)) return;
        scanned.add(identifier);
        log("Scanning:", identifier);

        const split = identifier.split(":");
        if(split.length < 3) {
            log("Invalid ID format");
            return;
        }
        
        const userid = split[1];
        const levelid = split[2];
        const version = split[3] || "1";

        try {
            const number = await getDownloadNumber(userid, levelid);
            
            if (SETTINGS.autoDownload) {
                await downloadLevel(userid, levelid, number, version);
                await new Promise(r => setTimeout(r, SETTINGS.delayBetweenDownloads));
            }

            const buffer = await fetchLevelBuffer(userid, levelid, number);
            const json = await levelToJSON(buffer);
            const subLevels = findSubLevels(json);

            log(`Found ${subLevels.length} sublevels in ${levelid}`);

            for (const sub of subLevels) {
                if (!found.includes(sub)) found.push(sub);
                if (SETTINGS.recursive) await scan(sub);
            }
        } catch (err) {
            console.error("Failed scanning:", identifier, err);
            log(`Failed scanning: ${err.message}`);
        }
    }

    async function start(identifier) {
        found.length = 0;
        scanned.clear();
        await scan(identifier);
        console.log("======== ALL FOUND LEVELS ========");
        console.table(found);
        log("Scan Complete.");
        return found;
    }

    function createGUI() {
        if (document.getElementById('grab-sublevel-gui')) return;

        const container = document.createElement('div');
        container.id = 'grab-sublevel-gui';
        container.innerHTML = `
            <style>
                #grab-sublevel-gui {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 400px;
                    max-height: 85vh;
                    background: #1e1e1e;
                    color: #eee;
                    font-family: system-ui, -apple-system, sans-serif;
                    z-index: 2147483647; /* Max z-index to appear over any site */
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                    border: 1px solid #333;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    text-align: left;
                }
                #grab-gui-header {
                    background: #252525;
                    padding: 12px 15px;
                    font-weight: bold;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                    color: #fff;
                }
                #grab-gui-close {
                    background: none;
                    border: none;
                    color: #aaa;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                }
                #grab-gui-close:hover { color: #fff; }
                #grab-gui-body {
                    padding: 15px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                #grab-gui-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 10px;
                    background: #111;
                    color: #fff;
                    border: 1px solid #444;
                    border-radius: 6px;
                }
                #grab-gui-start {
                    width: 100%;
                    padding: 12px;
                    background: #0d6efd;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                }
                #grab-gui-start:hover { background: #0b5ed7; }
                #grab-gui-start:disabled { background: #555; cursor: not-allowed; }
                #grab-gui-log {
                    background: #000;
                    color: #0f0;
                    padding: 10px;
                    height: 150px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    border-radius: 6px;
                    border: 1px solid #333;
                    white-space: pre-wrap;
                }
            </style>
            <div id="grab-gui-header">
                🌍 GRAB Sublevel Explorer
                <button id="grab-gui-close">✖</button>
            </div>
            <div id="grab-gui-body">
                <input type="text" id="grab-gui-input" placeholder="community:userid:levelid:version" value="community:29wupc12h9q3g7yevy9e5p:1777615483:1">
                <label style="font-size:13px; display:flex; align-items:center; gap:8px; cursor:pointer; color:#ccc;">
                    <input type="checkbox" id="grab-gui-autodl" checked> Auto-download .level files
                </label>
                <button id="grab-gui-start">Start Scan</button>
                <div id="grab-gui-log">Waiting for input...</div>
                <div id="grab-gui-results"></div>
            </div>
        `;
        document.body.appendChild(container);

        document.getElementById('grab-gui-close').onclick = () => container.remove();
        
        document.getElementById('grab-gui-start').onclick = async () => {
            const input = document.getElementById('grab-gui-input').value.trim();
            if(!input) return alert('Please enter an ID');
            
            SETTINGS.autoDownload = document.getElementById('grab-gui-autodl').checked;
            document.getElementById('grab-gui-results').innerHTML = '';
            document.getElementById('grab-gui-log').innerHTML = '<div>Starting engine...</div>';
            document.getElementById('grab-gui-start').disabled = true;
            
            try {
                await start(input);
            } catch(e) {
                log("Fatal Error:", e.message);
            }
            
            document.getElementById('grab-gui-start').disabled = false;
        };
    }

    return {
        start,
        createGUI,
        settings: SETTINGS,
        found,
        scanned
    };

})();

// Auto-initialize the GUI as soon as the script is loaded on ANY page
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', GrabSubLevelModule.createGUI);
    } else {
        GrabSubLevelModule.createGUI();
    }
}

// Export for Node.js/CommonJS/ES Modules if applicable
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GrabSubLevelModule;
}
