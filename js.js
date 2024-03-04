// ==UserScript==
// @name         Wurst - Miniblox.io
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Wurst is a free and hacked client for https://blockcraft.online/
// @author       Motion
// @match        https://blockcraft.online/*
// @icon         https://www.wurstclient.net/favicon.ico
// @require      https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js#sha256-ec0a84377f1dce9d55b98f04ac7057376fa5371c33ab1cd907b85ae5f18fab7e
// @require      https://code.jquery.com/jquery-3.7.0.min.js
// @grant        none
// ==/UserScript==

window.wurst = {
    game: null,
};

window.wurstSettings = {
    jumpVelocity: 1.5,
    charmsIntervalDelay: 300,
    funnyChatMsgs: ['testing1', 'testing2', 'testing3', 'testing4', 'testing5', 'testing6', 'testing7', 'testing8', 'testing9', 'testing10'],
    funnyChatIntervalDelay: 1000,
    killAuraIntervalDelay: 3,
    espIntervalDelay: 3,
    autoClickIntervalDelay: 120,
    aimbotIntervalDelay: 3,
    bunnyHopIntervalDelay: 3,
    autoEatIntervalDelay: 3,
    antiAFKIntervalDelay: 5000,
    quickSwitchDelay: 3,
    killAllIntervalDelay: 3,
    spiderIntervalDelay: 3
};

const proto = Object.prototype;
const handler = {
    apply: function (target, thisArgs, argumentsList) {
        argumentsList[0].updateNameTag ? wurst.game = argumentsList[0] : false;
        return target.apply(thisArgs, argumentsList);
    }
};

Object.defineProperty = new Proxy(Object.defineProperty, handler);

wurst = new Proxy(wurst, {
    get(data) {
        console.log('Setting wurst To Game Object.');
        return data.game.entity.world.scene.sun.game;
    }
});

window.getAllPlayers = function () {
    let players = [];

    Array.from(wurst.game.world.players.entries()).forEach(plr => {
        players.push({
            playerName: plr[1].name,
            playerObject: plr[1]
        })
    });

    return players;
};

function calculateDistance(player1, player2) {
    const dx = player1.pos.x - player2.pos.x;
    const dy = player1.pos.y - player2.pos.y;
    const dz = player1.pos.z - player2.pos.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

window.getClosestPlayer = function () {
    const players = getAllPlayers();
    const localPlayer = wurst.game.player;

    let minDistance = Infinity;
    let closestPlayer;

    players.forEach(plr => {
        if (plr.playerObject.getHealth() <= 0) return;

        if (localPlayer.name === plr.playerName) {
            return;
        }
        const distance = calculateDistance(localPlayer, plr.playerObject);

        if (distance < minDistance) {
            minDistance = distance;
            closestPlayer = plr;
        }
    });

    return closestPlayer;
};

// Fly  \u2705
let flyEnabled = false;

window.toggleFly = function () {
    flyEnabled = !flyEnabled;

    Object.defineProperty(wurst.game.player, 'onGround', {
        get() {
            if (flyEnabled) {
                return true;
            }
            else {
                delete wurst.game.player.onGround;
            }
        },
        set() {
            if (flyEnabled) {
                return true;
            } else {
                delete wurst.game.player.onGround;
            }
        }
    });
};


// High Jump  \u2705
let highJumpEnabled = false;

window.toggleHighJump = function () {
    highJumpEnabled = !highJumpEnabled;
    highJumpEnabled ? wurst.game.player.initialJumpVelocity = wurstSettings.jumpVelocity : wurst.game.player.initialJumpVelocity = .42;
};

// Charms \u2705
let charmsEnabled = false;
let charmsInterval;

window.toggleCharms = function () {
    charmsEnabled = !charmsEnabled;

    if (charmsEnabled) {
        charmsInterval = setInterval(() => {
            getAllPlayers().forEach(plr => {
                const player = plr.playerObject;
                const meshes = Object.entries(player.mesh.meshes);
                console.log(meshes);

                meshes.forEach(mesh => {
                    mesh[1].material.emissive.setRGB(0, 128, 0);
                    mesh[1].material.fog = !charmsEnabled;
                    mesh[1].material.alphaTest = !charmsEnabled ? 0.99 : 1;
                    mesh[1].material.depthTest = !charmsEnabled;
                });
            });
        }, wurstSettings.charmsIntervalDelay);
    } else {
        getAllPlayers().forEach(plr => {
            const player = plr.playerObject;
            const meshes = Object.entries(player.mesh.meshes);
            console.log(meshes);

            meshes.forEach(mesh => {
                mesh[1].material.emissive.setRGB(0, 0, 0);
                mesh[1].material.fog = !charmsEnabled;
                mesh[1].material.alphaTest = !charmsEnabled ? 0.99 : 1;
                mesh[1].material.depthTest = !charmsEnabled;
            });
            clearInterval(charmsInterval);
        });
    }
};


// Funny Chat \u2705
let funnyChatEnabled = false;
let funnyChatInterval;
let oldFunnyChatMessage;

window.toggleFunnyChat = function () {
    funnyChatEnabled = !funnyChatEnabled;

    if (funnyChatEnabled) {
        funnyChatInterval = setInterval(() => {
            let randomMessage = wurstSettings.funnyChatMsgs[Math.floor(Math.random() * wurstSettings.funnyChatMsgs.length)];

            if (randomMessage === oldFunnyChatMessage) {
                randomMessage += '.';
            }

            wurst.game.chat.setInputValue(randomMessage);
            wurst.game.chat.submit()
            console.log(randomMessage);

            oldFunnyChatMessage = randomMessage;
        }, wurstSettings.funnyChatIntervalDelay);
    } else {
        clearInterval(funnyChatInterval);
    }
};

window.getRotationToPlayer = function (localPlayer, enemyPlayer) {
    const smoothingFactor = 1

    const {
        Vector3: e
    } = THREE;
    const s = new e(localPlayer.getEyePos().x, localPlayer.getEyePos().y, localPlayer.getEyePos().z);
    const o = new e();

    console.log(s);
    console.log(o);

    new e().subVectors(s, enemyPlayer.pos).normalize();
    o.lerp(enemyPlayer.pos, smoothingFactor);
    const i = new e().subVectors(s, o).normalize();
    console.log(i);

    return {
        x: Math.asin(-i.y),
        y: Math.atan2(i.x, i.z),
        z: i.z
    };
};

// KillAura \u2705
let killAuraEnabled = false;
let killAuraInterval;

window.toggleKillAura = function () {
    killAuraEnabled = !killAuraEnabled;

    if (killAuraEnabled) {
        toggleAutoClick();
        killAuraInterval = setInterval(() => {
            const closestPlayer = getClosestPlayer();
            const localPlayer = wurst.game.player;
            const distance = calculateDistance(localPlayer, closestPlayer.playerObject);

            console.log('Distance:', distance);

            if (distance > 4.5) return; // Make killaura only work in close quarters

            console.log('ClosestPlayer:', closestPlayer);
            const newRotation = getRotationToPlayer(localPlayer, closestPlayer.playerObject);
            console.log(newRotation);

            // setRotation(_,$){this.yaw=_,this.pitch=$}
            localPlayer.attackingPlayer = closestPlayer.playerObject;

            localPlayer.setRotation(newRotation.y, newRotation.x); // X is up and down y is left to right
            localPlayer.yawHead = newRotation.y;
            localPlayer.newYaw = newRotation.y;
            localPlayer.attackedAtYaw = newRotation.y;
            localPlayer.lastReportedYaw = newRotation.y;
            localPlayer.prevRotationYawHead = newRotation.y;
            localPlayer.prevYaw = newRotation.y;


            localPlayer.newPitch = newRotation.x;
            localPlayer.lastReportedPitch = newRotation.x;
            localPlayer.prevPitch = newRotation.x;
        }, wurstSettings.killAuraIntervalDelay);
    } else {
        toggleAutoClick();
        clearInterval(killAuraInterval);
    }
};


// Aimbot \u2705
let aimbotEnabled = false;
let aimbotInterval;

window.toggleAimbot = function () {
    aimbotEnabled = !aimbotEnabled;

    if (aimbotEnabled) {
        aimbotInterval = setInterval(() => {
            const closestPlayer = getClosestPlayer();
            const localPlayer = wurst.game.player;
            const distance = calculateDistance(localPlayer, closestPlayer.playerObject);

            console.log('Distance:', distance);

            if (distance > 4.5) return; // Make aimbot only work in close quarters

            console.log('ClosestPlayer:', closestPlayer);
            const newRotation = getRotationToPlayer(localPlayer, closestPlayer.playerObject);
            console.log(newRotation);

            // setRotation(_,$){this.yaw=_,this.pitch=$}
            localPlayer.attackingPlayer = closestPlayer.playerObject;

            localPlayer.setRotation(newRotation.y, newRotation.x); // X is up and down y is left to right
            localPlayer.yawHead = newRotation.y;
            localPlayer.newYaw = newRotation.y;
            localPlayer.attackedAtYaw = newRotation.y;
            localPlayer.lastReportedYaw = newRotation.y;
            localPlayer.prevRotationYawHead = newRotation.y;
            localPlayer.prevYaw = newRotation.y;

            localPlayer.newPitch = newRotation.x;
            localPlayer.lastReportedPitch = newRotation.x;
            localPlayer.prevPitch = newRotation.x;
        }, wurstSettings.aimbotIntervalDelay);
    } else {
        clearInterval(aimbotInterval);
    }
};


// ESP \u2705
window.worldToScene = function (player, camera) {
    const ndc = player.playerObject.pos.clone().project(camera);

    ndc.x = (ndc.x + 1) / 2;
    ndc.y = (1 - ndc.y) / 2;

    const xPixels = ndc.x * window.innerWidth;
    const yPixels = ndc.y * window.innerHeight;

    return { x: xPixels, y: yPixels, z: ndc.z };
}

function drawESPBox(x, y, playerName, color, cords) {
    const espBox = document.createElement('div');
    espBox.style.position = 'absolute';
    espBox.style.width = '35px';
    espBox.style.height = '75px';
    espBox.style.left = `${x - 30}px`;
    espBox.style.top = `${y - 73}px`;
    espBox.style.border = `2px solid ${color}`;
    espBox.style.pointerEvents = 'none';

    const nameTitle = document.createElement('p');
    nameTitle.style.position = 'absolute';
    nameTitle.innerHTML = playerName;
    nameTitle.style.left = `${x - 30}px`;
    nameTitle.style.top = `${y - 110}px`;
    nameTitle.style.fontWeight = 'bold';
    nameTitle.style.color = 'white';
    nameTitle.style.textShadow = '1.5px 1px 2px rgba(60, 60, 60, 0.8), 2.5px 2px 2px rgba(60, 60, 60, 0.8), 0px 0px 4px rgba(0, 0, 0, 0.6)';
    nameTitle.style.fontFamily = 'Tahoma, Verdana, Roboto, sans-serif';
    nameTitle.style.pointerEvents = 'none';

    const playerCoordinates = document.createElement('p');
    playerCoordinates.style.position = 'absolute';
    playerCoordinates.innerHTML = `x:${cords.x} y:${cords.y}: z:${cords.y}`;
    playerCoordinates.style.fontSize = '10px';
    playerCoordinates.style.left = `${x - 30}px`;
    playerCoordinates.style.top = `${y - 80}px`;
    playerCoordinates.style.color = 'white';
    playerCoordinates.style.fontFamily = 'Tahoma, Verdana, Roboto, sans-serif';
    playerCoordinates.style.pointerEvents = 'none';

    document.body.appendChild(espBox);
    document.body.appendChild(nameTitle);
    document.body.appendChild(playerCoordinates);

    setTimeout(() => {
        espBox.remove();
        nameTitle.remove();
        playerCoordinates.remove();
    }, wurst.espIntervalDelay);
};

function drawGraphLine(x1, y1, x2, y2, color, widthMultiplier) {
    const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    const adjustedWidth = dist * widthMultiplier;

    const div = document.createElement('div');
    div.style.border = `1px solid ${color}`;
    div.style.position = 'absolute';
    div.style.left = x1 + 'px';
    div.style.top = y1 + 'px';
    div.style.width = adjustedWidth + 'px';
    div.style.transformOrigin = '0 100%';
    div.style.transform = 'rotate(' + angle + 'deg)';

    document.body.appendChild(div);
    setTimeout(() => {
        div.remove();
    }, wurst.espIntervalDelay);
};

let espEnabled = false;
let espInterval;

window.toggleESP = function () {
    espEnabled = !espEnabled;

    if (espEnabled) {
        espInterval = setInterval(() => {
            const localPlayer = wurst.game.player;
            getAllPlayers().forEach(plr => {
                const playerToCanvas = worldToScene(plr, wurst.game.gameScene.camera);
                console.log(playerToCanvas);

                if (plr.playerName === localPlayer.name) {
                    return;
                }

                const distance = calculateDistance(localPlayer, plr.playerObject);

                if (distance > 4.5 && playerToCanvas.z <= 1.0) {
                    drawESPBox(playerToCanvas.x, playerToCanvas.y, plr.playerName, 'green', plr.playerObject.pos);
                    drawGraphLine(window.innerWidth / 2, window.innerHeight / 2, playerToCanvas.x, playerToCanvas.y, 'white', 1);
                } else if (distance < 4.5 && playerToCanvas.z <= 1.0) {
                    drawESPBox(playerToCanvas.x, playerToCanvas.y, plr.playerName, 'red', plr.playerObject.pos);
                    drawGraphLine(window.innerWidth / 2, window.innerHeight / 2, playerToCanvas.x, playerToCanvas.y, 'red', 1);
                }
            });
        });
    } else {
        clearInterval(espInterval);
    }
};


// Speed \u2705
// Make it so yo dou dont have to be in the air. Fixed all!!
let speedEnabled = false;

window.toggleSpeed = function () {
    speedEnabled = !speedEnabled;

    Object.defineProperty(wurst.game.player, 'landMovementFactor', {
        get() {
            return speedEnabled ? 1 : 0.13;
        },
        set() {
            return speedEnabled ? 1 : 0.13;
        }
    });

    Object.defineProperty(wurst.game.player, 'speedInAir', {
        // Make it so your player is always like +5 vertically, but make it so the you don't go up continuously
        get() {
            return speedEnabled ? 0.3 : 0.02;
        },
        set() {
            return speedEnabled ? 0.3 : 0.02;
        }
    });
};


// Autoclick \u2705
let autoClickEnabled = false;
let autoClickInterval;

function triggerMouseEvent(node, eventType) {
    var clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent(eventType, true, true);
    node.dispatchEvent(clickEvent);
};

window.toggleAutoClick = function () {
    autoClickEnabled = !autoClickEnabled;

    if (autoClickEnabled) {
        autoClickInterval = setInterval(() => {
            triggerMouseEvent(document, 'mousedown');
        }, wurstSettings.autoClickIntervalDelay);
    } else {
        clearInterval(autoClickInterval);
    }
};


// BunnyHop \u2705
let bunnyHopEnabled = false;
let bunnyHopInterval;


window.toggleBunnyHop = function () {
    bunnyHopEnabled = !bunnyHopEnabled;

    if (bunnyHopEnabled) {
        bunnyHopInterval = setInterval(() => {
            wurst.game.player.onGround && !flyEnabled ? wurst.game.player.jump() : false;
        }, wurstSettings.bunnyHopIntervalDelay);
    } else {
        clearInterval(bunnyHopInterval);
    }
}

// AutoEat
// wurst.game.player.foodStats.foodLevel
// Set a define property on feedLevel to see if it changed and if its not equal to 20 call 

let autoEatEnabled = false;
let autoEatInterval;

// wurst.game.player.inventory.main[2].useItemRightClick(wurst.game.player, wurst.game.player);
// wurst.game.player.inventory.main[2]
// wurst.game.player.setItemInUse(wurst.game.player.inventory.main[2])
// wurst.game.player.inventory.consumeInventoryItem(new Items().constructor.porkchop)
window.toggleAutoEat = function () {
    autoEatEnabled = !autoClickEnabled;

    if (autoEatEnabled) {
        autoEatInterval = setInterval(() => {
            if (wurst.game.player.foodStats.needFood()) {
                wurst.game.player.inventory.main.forEach(i => {
                    if (i.item.healAmount) {

                    };
                })
            };
        }, wurstSettings.autoEatIntervalDelay);
    } else {
        clearInterval(autoEatInterval);
    }
};


// Fling Player \u2705
window.flingPlayer = function() {
    wurst.game.player.motion.y = 5;
    wurst.game.player.motion.x = 5;
};


// Anti AFk \u2705
let antiAFkEnabled = false;
let antiAFKInterval;

window.toggleAntiAFK = function() {
    antiAFkEnabled = !antiAFkEnabled;

    if (antiAFkEnabled) {
        antiAFKInterval = setInterval(() => {
            const localPlayer = wurst.game.player;

            Math.random() * 1 < 0.5 ? localPlayer.motion.x = 0.1 : localPlayer.motion.z = -0.1;
            Math.random() * 1 < 0.5 ? localPlayer.motion.z = 0.1 : localPlayer.motion.z = -0.1;
        }, wurstSettings.antiAFKIntervalDelay);
    } else {
        clearInterval(antiAFKInterval);
    }
};


// Quick Switch \u2705
let quickSwitchEnabled = false;
let quickSwitchInterval;

window.toggleQuickSwitch = function() {
    quickSwitchEnabled = !quickSwitchEnabled;

    if (quickSwitchEnabled) {
        quickSwitchInterval = setInterval(() => {
            const items = Array.from(wurst.game.player.inventory.main).filter(item => item != null);
            const amountOfItems = items.length;
            const randomItem = Math.floor(Math.random() * amountOfItems);

            wurst.game.player.inventory.currentItem = randomItem;
        }, wurstSettings.quickSwitchDelay);
    } else {
        clearInterval(quickSwitchInterval);
    }
};


// Kill All \u2705
let killAllEnabled = false;
let killAllInterval;

window.toggleKillAll = function() {
    killAllEnabled = !killAllEnabled;

    if (killAllEnabled) {
        killAllInterval = setInterval(() => {
            const localPlayer = wurst.game.player;
            const closestPlayer = getClosestPlayer().playerObject;
        
            if (localPlayer.world != null) {
                localPlayer.setPosition(closestPlayer.pos.x - 0.1, closestPlayer.pos.y, closestPlayer.pos.z - 0.1);
            }
        }, wurstSettings.killAllIntervalDelay);
    } else {
        clearInterval(killAllInterval);
    }
};

// Red Sky \u2705
let redSkyEnabled = false;

window.toggleRedSky = function() {
    redSkyEnabled = !redSkyEnabled;
    redSkyEnabled ? wurst.game.gameScene.sun.daySpeed = 0 : wurst.game.gameScene.sun.daySpeed = 0.0002617993877991494;
};

// Spider
let spiderEnabled = false;
let spiderInterval;

window.toggleSpider = function() {
    spiderEnabled = !spiderEnabled;

    if (spiderEnabled) {
        spiderInterval = setInterval(() => {
            const localPlayer = wurst.game.player;
            if (localPlayer.isCollidedHorizontally) {
                localPlayer.motion.y = 0.2;
            };
        }, wurstSettings.spiderIntervalDelay);
    } else {
        clearInterval(spiderInterval);
    }
};

// Initiate UI
function initUI() {
    const wurstUI = `<div class="wurst">
    <div id="wurst-icon">
        <img src="https://cloud.githubusercontent.com/assets/10100202/23872350/47e8462e-082e-11e7-8ac2-07a66e4beaaa.png">
    </div>

    <div class="module">
        <span class="module-header">Movement</span>

        <span class="module-selector">Fly</span>
        <span class="module-selector">Speed</span>
        <span class="module-selector">High Jump</span>
        <span class="module-selector">Spider</span>
        <span class="module-selector">Fling</span>
    </div>
    <div class="module">
        <span class="module-header">Combat</span>

        <span class="module-selector">Auto Clicker</span>
        <span class="module-selector">KillAura</span>
        <span class="module-selector">Aimbot</span>
        <span class="module-selector">KillAll</span>
        <span class="module-selector">BunnyHop</span>
    </div>
    <div class="module">
        <span class="module-header">Render</span>

        <span class="module-selector">ESP</span>
        <span class="module-selector">Charms</span>
    </div>
    <div class="module">
        <span class="module-header">Chat</span>

        <span class="module-selector">Funny Chat</span>
    </div>
    <div class="module">
        <span class="module-header">Extra</span>

        <span class="module-selector">Anti AFK</span>
        <span class="module-selector">Quick Switch</span>
        <span class="module-selector">Red Sky</span>
    </div>

    <div class="selected-modules">
    </div>
</div>
<style>
    @font-face {
        font-family: 'wurst-font';
        src: url(data:font/truetype;base64,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gICAAQD/AAAABQAAAAACAAOAAAMABwALAA8AEwAAITUhFSU1MxUlETMZATUzFT0BIRUBAAEA/oCA/wCAgAEAgICAgICAAYD+gAGAgICAgIAABQAAAAACAAOAAAMABwALAA8AEwAAMTUhFT0BMxU1ETMRATUzFSU1IRUBAICA/wCA/oABAICAgICAgAGA/oABgICAgICAAAAABQAAAQACAAKAAAMABwALAA8AEwAAETUzFSE1MxUlNSEVJTUzFSE1MxWAAQCA/oABAP6AgAEAgAEAgICAgICAgICAgICAAAAAAQAAAIACgAMAAAsAACURITUhETMRIRUhEQEA/wABAIABAP8AgAEAgAEA/wCA/wAAAQAA/4AAgAEAAAMAABURMxGAgAGA/oAAAQAAAYACgAIAAAMAABE1IRUCgAGAgIAAAQAAAAAAgAEAAAMAADERMxGAAQD/AAAABQAAAAACgAOAAAMABwALAA8AEwAAMTUzFTURMxkBNTMVNREzGQE1MxWAgICAgICAgAEA/wABAICAgAEA/wABAICAAAAFAAAAAAKAA4AAAwAHAA8AFwAbAAAzNSEVATUzFQERMxEzFSMVIREjNTM1MxEBNSEVgAGA/wCA/oCAgIABgICAgP4AAYCAgAGAgID/AAKA/oCAgAGAgID9gAKAgIAAAAABAAAAAAKAA4AACwAAMTUhESM1MzUzESEVAQCAgIABAIACAICA/QCAAAAAAAYAAAAAAoADgAAHAAsADwATABcAGwAAMREzFSE1MxEBNTMVPQEhFQE1MxUFETMRATUhFYABgID+AIABAP4AgAGAgP4AAYABAICA/wABAICAgICAAQCAgIABAP8AAQCAgAAAAAAHAAAAAAKAA4AAAwAHAAsADwATABcAGwAAMzUhFSU1MxUhETMRATUhFQE1MxUFETMRATUhFYABgP4AgAGAgP6AAQD+AIABgID+AAGAgICAgIABAP8AAQCAgAEAgICAAQD/AAEAgIAAAAMAAAAAAoADgAADAAcAEwAAEzUzFT0BMxUTESERMxUhESM1IRGAgICA/gCAAYCAAQACAICAgICA/YABAAEAgAGAgPyAAAAAAAQAAAAAAoADgAADAAcACwATAAAzNSEVJTUzFSERMxEBESEVIRUhFYABgP4AgAGAgP2AAoD+AAGAgICAgIABgP6AAYABgICAgAAAAAAFAAAAAAKAA4AAAwAHAA8AEwAXAAAzNSEVNREzESERMxUhFSEZATUzFT0BIRWAAYCA/YCAAYD+gIABAICAgAEA/wACAICA/wACAICAgICAAAMAAAAAAoADgAADAAcADwAAIREzGQE1MxU1ESEVIxEhEQEAgID+gIACgAGA/oABgICAgAEAgAEA/oAAAAcAAAAAAoADgAADAAcACwAPABMAFwAbAAAzNSEVJREzESERMxEBNSEVJREzESERMxEBNSEVgAGA/gCAAYCA/gABgP4AgAGAgP4AAYCAgIABAP8AAQD/AAEAgICAAQD/AAEA/wABAICAAAAAAAUAAAAAAoADgAADAAcACwATABcAADM1IRU9ATMVAREzEQE1ITUhETMRATUhFYABAID+AIABgP6AAYCA/gABgICAgICAAYABAP8A/wCAgAEA/gACAICAAAACAAAAAACAAwAAAwAHAAAxETMRAxEzEYCAgAEA/wACAAEA/wAAAAAAAgAA/4AAgAMAAAMABwAAFREzEQMRMxGAgICAAYD+gAKAAQD/AAAAAAcAAAAAAgADgAADAAcACwAPABMAFwAbAAAhNTMVJTUzFSU1MxUlNTMVPQEzFT0BMxU9ATMVAYCA/wCA/wCA/wCAgICAgICAgICAgICAgICAgICAgICAgIAAAAAAAgAAAIACgAKAAAMABwAAPQEhFQE1IRUCgP2AAoCAgIABgICAAAAAAAcAAAAAAgADgAADAAcACwAPABMAFwAbAAAxNTMVPQEzFT0BMxU9ATMVJTUzFSU1MxUlNTMVgICAgP8AgP8AgP8AgICAgICAgICAgICAgICAgICAgICAAAAGAAAAAAKAA4AAAwAHAAsADwATABcAACE1MxUDNTMVPQEzFQE1MxUFETMRATUhFQEAgICAgP4AgAGAgP4AAYCAgAEAgICAgIABAICAgAEA/wABAICAAAAABAAAAAADAAOAAAMABwAPABMAADM1IRUlETMRNxEhETMRMxEBNSEVgAIA/YCAgAEAgID9gAIAgICAAoD9gIABgP8AAYD+AAIAgIAAAAIAAAAAAoADgAALAA8AADERMxEhETMRIxEhGQE1IRWAAYCAgP6AAYADAP8AAQD9AAGA/oADAICAAAAAAAMAAAAAAoADgAADAAcAEwAAJREzEQM1MxUBESEVIRUhFSERIRUCAICAgP2AAgD+gAGA/oABgIABgP6AAgCAgP2AA4CAgID+gIAAAAAFAAAAAAKAA4AAAwAHAAsADwATAAAzNSEVPQEzFSERMxEBNTMVJTUhFYABgID9gIABgID+AAGAgICAgIACgP2AAgCAgICAgAACAAAAAAKAA4AAAwALAAAlETMRBREhFSERIRUCAID9gAIA/oABgIACgP2AgAOAgP2AgAAAAQAAAAACgAOAAAsAADERIRUhFSEVIREhFQKA/gABAP8AAgADgICAgP6AgAABAAAAAAKAA4AACQAAMREhFSEVIRUhEQKA/gABAP8AA4CAgID+AAAABAAAAAACgAOAAAMACQANABEAADM1IRU1ESE1IREhETMZATUhFYABgP8AAYD9gIACAICAgAGAgP4AAoD9gAKAgIAAAAABAAAAAAKAA4AACwAAMREzESERMxEjESERgAGAgID+gAOA/wABAPyAAgD+AAAAAAABAAAAAAGAA4AACwAAMTUzESM1IRUjETMVgIABgICAgAKAgID9gIAAAwAAAAACgAOAAAMABwALAAAzNSEVJTUzFSERMxGAAYD+AIABgICAgICAgAMA/QAABQAAAAACgAOAAAMABwALABMAFwAAIREzEQE1MxUDNTMVAREzESEVIREBNTMVAgCA/wCAgID+AIABAP8AAYCAAYD+gAGAgIABAICA/YADgP8AgP4AAwCAgAAAAAABAAAAAAKAA4AABQAAMREzESEVgAIAA4D9AIAAAwAAAAACgAOAAAMACwATAAABNTMVAREzFTMVIxEhESM1MzUzEQEAgP6AgICAAYCAgIACAICA/gADgICA/YACgICA/IAAAAAAAwAAAAACgAOAAAMACwATAAABNTMVAREzFTMVIxEhESM1MxEzEQEAgP6AgICAAYCAgIACAICA/gADgICA/YABgIABgPyAAAAABAAAAAACgAOAAAMABwALAA8AADM1IRUlETMRIREzEQE1IRWAAYD+AIABgID+AAGAgICAAoD9gAKA/YACgICAAAIAAAAAAoADgAADAA0AAAE1MxUBESEVIRUhFSERAgCA/YACAP6AAYD+gAKAgID9gAOAgICA/gAABgAAAAACgAOAAAMABwALAA8AEwAXAAAzNSEVMzUzFSU1MxUhETMRJREzEQE1IRWAAQCAgP8AgP4AgAGAgP4AAYCAgICAgICAAoD9gIACAP4AAgCAgAAAAAMAAAAAAoADgAADAAcAEQAAIREzEQM1MxUBESEVIRUhFSERAgCAgID9gAIA/oABgP6AAgD+AAKAgID9gAOAgICA/gAABgAAAAACgAOAAAMABwALAA8AEwAXAAAzNSEVJTUzFSERMxEBNSEVJTUzFT0BIRWAAYD+AIABgID+AAGA/gCAAgCAgICAgAGA/oABgICAgICAgICAAAAAAAEAAAAAAoADgAAHAAAhESE1IRUhEQEA/wACgP8AAwCAgP0AAAMAAAAAAoADgAADAAcACwAAMzUhFSURMxEhETMRgAGA/gCAAYCAgICAAwD9AAMA/QAAAAAFAAAAAAKAA4AAAwAHAAsADwATAAAhNTMVJREzETMRMxEBETMRIREzEQEAgP8AgICA/gCAAYCAgICAAQD/AAEA/wABAAIA/gACAP4AAAAAAAMAAAAAAoADgAADAAsAEwAAATUzFQERMxEzFSMVITUjNTMRMxEBAID+gICAgAGAgICAAQCAgP8AA4D9gICAgIACgPyAAAAAAAkAAAAAAoADgAADAAcACwAPABMAFwAbAB8AIwAAMREzESERMxEBNTMVMzUzFSU1MxUlNTMVMzUzFSU1MxUhNTMVgAGAgP4AgICA/wCA/wCAgID+AIABgIABgP6AAYD+gAGAgICAgICAgICAgICAgICAgIAABQAAAAACgAOAAAMABwALAA8AEwAAIREzEQE1MxUzNTMVJTUzFSE1MxUBAID/AICAgP4AgAGAgAKA/YACgICAgICAgICAgAAABQAAAAACgAOAAAUACQANABEAFwAAMREzFSEVATUzFT0BMxU9ATMVPQEhNSERgAH//gGAgID+AAKAAQCAgAEAgICAgICAgICAgID/AAAAAAABAAAAAAGAA4AABwAAMREhFSERIRUBgP8AAQADgID9gIAAAAAFAAAAAAKAA4AAAwAHAAsADwATAAAhNTMVJREzEQE1MxUlETMRATUzFQIAgP8AgP8AgP8AgP8AgICAgAEA/wABAICAgAEA/wABAICAAAAAAAEAAAAAAYADgAAHAAAxNSERITUhEQEA/wABgIACgID8gAAAAAUAAAIAAoADgAADAAcACwAPABMAABE1MxUhNTMVJTUzFTM1MxUlNTMVgAGAgP4AgICA/wCAAgCAgICAgICAgICAgIAAAQAAAAACgACAAAMAADE1IRUCgICAAAAAAgAAAgABAAOAAAMABwAAEzUzFSURMxGAgP8AgAIAgICAAQD/AAAAAAMAAAAAAoACgAADAA0AEQAAPQEzHQE1ITUhNSE1MxEBNSEVgAGA/oABgID+AAGAgICAgICAgID+AAIAgIAAAAADAAAAAAKAA4AAAwAHABEAACURMxEBNSEVAREzETMVIxEhFQIAgP6AAQD+AICAgAGAgAGA/oABgICA/gADgP6AgP8AgAAAAAAFAAAAAAKAAoAAAwAHAAsADwATAAAzNSEVPQEzFSERMxEBNTMVJTUhFYABgID9gIABgID+AAGAgICAgIABgP6AAQCAgICAgAADAAAAAAKAA4AAAwAHABEAADURMxkBNSEVATUhESM1MxEzEYABAP8AAYCAgICAAYD+gAGAgID+AIABAIABgPyAAAAAAAMAAAAAAoACgAADAA0AEQAAMzUhFSURMxUhNTMRIRURNSEVgAIA/YCAAYCA/gABgICAgAGAgID/AIABgICAAAACAAAAAAIAA4AACwAPAAAzESM1MzUzFSEVIRkBNSEVgICAgAEA/wABAAIAgICAgP4AAwCAgAAAAAMAAP+AAoACgAADAAcAEQAAFTUhFQERMxEBNSE1IREhNSERAgD+AIABgP6AAYD+gAIAgICAAYABAP8A/wCAgAEAgP2AAAAAAAMAAAAAAoADgAADAAcADwAAIREzEQE1IRUBETMRMxUjEQIAgP6AAQD+AICAgAIA/gACAICA/gADgP6AgP6AAAACAAAAAACAA4AAAwAHAAAxETMRAzUzFYCAgAKA/YADAICAAAAEAAD/gAKAA4AAAwAHAAsADwAAFzUhFSURMxEhETMRAzUzFYABgP4AgAGAgICAgICAgAEA/wACgP2AAwCAgAAABQAAAAACAAOAAAMABwALAA8AFwAAITUzFSU1MxUDNTMVPQEzFQERMxEzFSMRAYCA/wCAgICA/gCAgICAgICAgAEAgICAgID+AAOA/gCA/wAAAAAAAgAAAAABAAOAAAMABwAAMzUzFSURMxGAgP8AgICAgAMA/QAABAAAAAACgAKAAAMABwANABEAAAERMxETETMRIREhFSMRATUzFQEAgICA/YABAIABAIABAAEA/wD/AAIA/gACgID+AAIAgIAAAgAAAAACgAKAAAMACQAAIREzESERIRUhEQIAgP2AAgD+gAIA/gACgID+AAAEAAAAAAKAAoAAAwAHAAsADwAAMzUhFSURMxEhETMRATUhFYABgP4AgAGAgP4AAYCAgIABgP6AAYD+gAGAgIAAAwAA/4ACgAKAAAMADwATAAABETMRAREzFTMVIxUhFSEREzUhFQIAgP2AgICAAYD+gIABAAEAAQD/AP6AAwCAgICA/wACgICAAAAAAAMAAP+AAoACgAADAAcAEwAAGQEzGQE1IRUTESE1ITUjNTM1MxGAAQCA/oABgICAgAEAAQD/AAEAgID9gAEAgICAgP0AAAAAAAMAAAAAAoACgAADAAsADwAAATUzFQERMxUzFSMREzUhFQIAgP2AgICAgAEAAYCAgP6AAoCAgP6AAgCAgAAAAAAFAAAAAAKAAoAAAwAHAAsADwATAAAxNSEVPQEzFSU1IRUlNTMVPQEhFQIAgP4AAYD+AIACAICAgICAgICAgICAgICAAAIAAAAAAYADgAADAA8AACE1MxUlESM1MxEzETMVIxEBAID/AICAgICAgICAAYCAAQD/AID+gAAAAgAAAAACgAKAAAMACQAANREzERU1IREzEYABgICAAgD+AICAAgD9gAAAAAAFAAAAAAKAAoAAAwAHAAsADwATAAAhNTMVJTUzFTM1MxUlETMRIREzEQEAgP8AgICA/gCAAYCAgICAgICAgIABgP6AAYD+gAACAAAAAAKAAoAAAwANAAA1ETMRFTUzETMRMxEzEYCAgICAgAIA/gCAgAEA/wACAP2AAAAACQAAAAACgAKAAAMABwALAA8AEwAXABsAHwAjAAAxNTMVITUzFSU1MxUzNTMVJTUzFSU1MxUzNTMVJTUzFSE1MxWAAYCA/gCAgID/AID/AICAgP4AgAGAgICAgICAgICAgICAgICAgICAgICAgIAAAAMAAP+AAoACgAADAAcADwAAFTUhFQERMxEBNSE1IREzEQIA/gCAAYD+gAGAgICAgAGAAYD+gP8AgIABgP2AAAADAAAAAAKAAoAABwALABMAADE1MzUzFSEVATUzFT0BITUhFSMVgIABgP6AgP6AAoCAgICAgAEAgICAgICAgAAABQAAAAACAAOAAAMABwALAA8AEwAAITUhFSURMxEBNTMVNREzGQE1IRUBAAEA/oCA/wCAgAEAgICAAQD/AAEAgICAAQD/AAEAgIAAAAIAAAAAAIADgAADAAcAADERMxEDETMRgICAAYD+gAIAAYD+gAAAAAAFAAAAAAIAA4AAAwAHAAsADwATAAAxNSEVNREzGQE1MxUlETMRATUhFQEAgID/AID+gAEAgICAAQD/AAEAgICAAQD/AAEAgIAAAAAABAAAAoADAAOAAAMABwALAA8AABE1MxUhNSEVJTUhFSE1MxWAAQABAP4AAQABAIACgICAgICAgICAgAAAAgAAAAAAgAMAAAMABwAAMREzEQM1MxWAgIACAP4AAoCAgAAABAAAAAACgAOAAAMABwALAB8AAAE1MxUhETMRATUzFQE1IzUzESM1MzUzFTMVIxEzFSMVAgCA/YCAAYCA/oCAgICAgICAgIABAICAAYD+gAEAgID+AICAAYCAgICA/oCAgAAAAAMAAAAAAoADgAAPABMAFwAAMTUzESM1MxEzESEVIREhFQM1MxUlNSEVgICAgAEA/wABgICA/oABAIABAIABAP8AgP8AgAKAgICAgIAAAAAACAAAAIACAAMAAAMABwALAA8AEwAXABsAHwAAPQEzFSE1MxUlNSEVJTUzFSE1MxUlNSEVJTUzFSE1MxWAAQCA/oABAP6AgAEAgP6AAQD+gIABAICAgICAgICAgICAgICAgICAgICAgIAAAAAABQAAAAACgAOAABMAFwAbAB8AIwAAITUjNTM1IzUzNTMVMxUjFTMVIxUBNTMVMzUzFSU1MxUhNTMVAQCAgICAgICAgID/AICAgP4AgAGAgICAgICAgICAgIACgICAgICAgICAgAAAAAACAAAAAACAA4AAAwAHAAAxETMRAxEzEYCAgAGA/oACAAGA/oAAAAAACAAAAAACAAOAAAMABwALAA8AEwAXABsAHwAAMTUhFT0BMxUlNSEVJTUzFSE1MxUlNSEVJTUzFT0BIRUBgID+gAEA/oCAAQCA/oABAP6AgAGAgICAgICAgICAgICAgICAgICAgICAgAACAAADAAKAA4AAAwAHAAARNSEVMzUhFQEAgAEAAwCAgICAAAADAAAAAAMAAoAADQARABsAADM1IxEzETMVMzUzFTMVNREzESURIzUhFSMVIxWAgICAgICAgP4AgAIAgICAAYD/AICAgICAAYD+gIABAICAgIAAAAABAAACAAGAA4AACQAAETUzNSM1IRUzEYCAAQCAAgCAgICA/wAAAAAACgAAAAACgAKAAAMABwALAA8AEwAXABsAHwAjACcAACE1MxUzNTMVJTUzFTM1MxUlNTMVMzUzFSU1MxUzNTMVJTUzFTM1MxUBAICAgP4AgICA/gCAgID/AICAgP8AgICAgICAgICAgICAgICAgICAgICAgICAgICAAAAAAAEAAAAAAoABgAAFAAAhESE1IRECAP4AAoABAID+gAAAAQAAAgACgAKAAAMAABE1IRUCgAIAgIAAAwAAAQADAAOAAAMABwAZAAABNSMVIREzERU1MxEzNSE1IRUjFTM1MxEjFQIAgP6AgICA/wACAICAgIABgICAAYD+gICAAQCAgICAgP6AgAABAAADAAKAA4AAAwAAETUhFQKAAwCAgAAEAAACAAGAA4AAAwAHAAsADwAAEzUzFSU1MxUzNTMVJTUzFYCA/wCAgID/AIACAICAgICAgICAgIAAAAACAAAAAAMAA4AAAwAPAAAxNSEVAREhNSERIREhFSERAwD+AP8AAQABAAEA/wCAgAEAAQCAAQD/AID/AAABAAABAAIAA4AAEQAAGQEzNTM1ITUhFTMVIxUjFSEVgID/AAGAgICAAQABAAEAgICAgICAgIAAAAEAAAEAAgADgAAPAAARNSE1IzUzNSE1IRUzESMVAQCAgP8AAYCAgAEAgICAgICA/oCAAAACAAACAAEAA4AAAwAHAAARNTMVNREzEYCAAgCAgIABAP8AAAABAAAAgAOAA4AADwAAPQEzESERIREhESMVIRUjFYABAAEAAQCA/oCAgIACgP6AAYD+gICAgAAAAAIAAAAABAADgAADABEAAAERIxETESE1IxEzNSERIREjEQGAgID/AICAA4D/AIACAAEA/wD+AAGAgAEAgPyAAwD9AAAAAQAAAQABAAGAAAMAABE1IRUBAAEAgIAAAwAAAAABgAIAAAMABwANAAAxNSEVPQEzFSU1MzUzEQEAgP6AgICAgICAgICAgP8AAAAAAAEAAAIAAQADgAAFAAATESM1IRGAgAEAAgABAID+gAAABAAAAgABgAOAAAMABwALAA8AABM1MxUlNTMVMzUzFSU1MxWAgP8AgICA/wCAAgCAgICAgICAgICAAAAACgAAAAACgAKAAAMABwALAA8AEwAXABsAHwAjACcAADE1MxUzNTMVJTUzFTM1MxUlNTMVMzUzFSU1MxUzNTMVJTUzFTM1MxWAgID/AICAgP8AgICA/gCAgID+AICAgICAgICAgICAgICAgICAgICAgICAgICAgAAABwAAAAACgAOAAAMABwANABEAFQAZAB0AADE1MxU1ETMRBTUjESERATUzFTURMxElETMRJTUzFYCAAQCAAQD+gICA/gCAAYCAgICAAQD/AICAAQD+gAGAgICAAQD/AIABAP8AgICAAAAIAAAAAAKAA4AAAwAJAA0AEQAVABkAHQAhAAAxNTMVIREzFTMVJREzESU1MxUlNTMVNREzESURMxElNTMVgAEAgID+AIABAID+gICA/gCAAYCAgIABAICAgAEA/wCAgICAgICAAQD/AIABAP8AgICAAAAAAAUAAAAAAoADgAADAAkADQAbAB8AADE1MxUhNSMRIREBETMRAREjNTM1IxEhETMVIxEBNTMVgAGAgAEA/wCA/oCAgIABAICAAQCAgICAAQD+gAIAAQD/AP6AAQCAgAEA/oCA/wACgICAAAAAAAYAAAAAAoADgAADAAcACwAPABMAFwAAMzUhFT0BMxUhETMZATUzFT0BMxUDNTMVgAGAgP2AgICAgICAgICAgAEA/wABAICAgICAAQCAgAAABAAAAAACgAUAAAsADwATABcAADERMxEhETMRIxEhGQE1IRUBNTMVJTUzFYABgICA/oABgP8AgP8AgAMA/wABAP0AAYD+gAMAgIABAICAgICAAAAABAAAAAACgAUAAAsADwATABcAADERMxEhETMRIxEhGQE1IRUBNTMVPQEzFYABgICA/oABgP8AgIADAP8AAQD9AAGA/oADAICAAQCAgICAgAAFAAAAAAKABQAACwAPABMAFwAbAAAxETMRIREzESMRIRkBNSEVATUzFTM1MxUlNTMVgAGAgID+gAGA/oCAgID/AIADAP8AAQD9AAGA/oADAICAAQCAgICAgICAAAMAAAAAAoAEgAALAA8AEwAAMREzESERMxEjESEZATUhFQE1IRWAAYCAgP6AAYD+gAGAAwD/AAEA/QABgP6AAwCAgAEAgIAAAAQAAAAAAoAEgAALAA8AEwAXAAAxETMRIREzESMRIRkBNSEVATUhFTM1IRWAAYCAgP6AAYD+AAEAgAEAAwD/AAEA/QABgP6AAwCAgAEAgICAgAAAAAMAAAAAAoAEgAALABMAFwAAMREzESERMxEjESEZAjMVMzUzEQE1MxWAAYCAgP6AgICA/wCAAwD/AAEA/QABgP6AAwABAICA/wABAICAAAAAAQAAAAACgAOAABUAADERMxUzNSM1IRUhFTMVIxEhFSERIxGAgIACAP8AgIABAP6AgAMAgICAgICA/oCAAgD+AAAAAAAHAAD/AAKAA4AABwALAA8AEwAXABsAHwAAATUjNSEVMxUDNTMVJTUhFT0BMxUhETMRATUzFSU1IRUBgIABAICAgP4AAYCA/YCAAYCA/gABgP8AgICAgAEAgICAgICAgIACAP4AAYCAgICAgAADAAAAAAKABQAACwAPABMAADERIRUhFSEVIREhFQE1MxUlNTMVAoD+AAEA/wACAP6AgP8AgAOAgICA/oCABACAgICAgAAAAAADAAAAAAKABQAACwAPABMAADERIRUhFSEVIREhFQE1MxU9ATMVAoD+AAEA/wACAP6AgIADgICAgP6AgAQAgICAgIAAAAQAAAAAAoAFAAALAA8AEwAXAAAxESEVIRUhFSERIRUBNTMVMzUzFSU1MxUCgP4AAQD/AAIA/gCAgID/AIADgICAgP6AgAQAgICAgICAgAAAAwAAAAACgASAAAsADwATAAAxESEVIRUhFSERIRUBNSEVMzUhFQKA/gABAP8AAgD9gAEAgAEAA4CAgID+gIAEAICAgIAAAAAAAwAAAAABAAQAAAMABwALAAAzETMRAzUzFSU1MxWAgICA/wCAAoD9gAMAgICAgIAAAwCAAAABgAQAAAMABwALAAAzETMRAzUzFT0BMxWAgICAgAKA/YADAICAgICAAAAABAAAAAABgAQAAAMABwALAA8AADMRMxEBNTMVMzUzFSU1MxWAgP8AgICA/wCAAoD9gAMAgICAgICAgAAAAwAAAAABgAOAAAMABwALAAAzETMRATUzFTM1MxWAgP8AgICAAoD9gAMAgICAgAAAAv+AAAACgAOAAAMAEwAAJREzEQURIzUzESEVIREhFSERIRUCAID9gICAAgD+gAEA/wABgIACgP2AgAGAgAGAgP8AgP8AgAAABAAAAAACgASAAAMACwATABcAAAE1MxUBETMVMxUjESERIzUzETMRATUhFQEAgP6AgICAAYCAgID+AAGAAgCAgP4AA4CAgP2AAYCAAYD8gAQAgIAABgAAAAACgAUAAAMABwALAA8AEwAXAAAzNSEVJREzESERMxEBNSEVATUzFSU1MxWAAYD+AIABgID+AAGA/wCA/wCAgICAAoD9gAKA/YACgICAAQCAgICAgAAAAAAGAAAAAAKABQAAAwAHAAsADwATABcAADM1IRUlETMRIREzEQE1IRUBNTMVPQEzFYABgP4AgAGAgP4AAYD/AICAgICAAoD9gAKA/YACgICAAQCAgICAgAAABgAAAAACgAUAAAMABwALAA8AFQAZAAAzNSEVJREzESERMxEBNTMVAzUhETMRATUzFYABgP4AgAGAgP4AgIABAID/AICAgIACgP2AAoD9gAOAgID/AIABAP6AAYCAgAAABQAAAAACgASAAAMABwALAA8AEwAAMzUhFSURMxEhETMRATUhFQE1IRWAAYD+AIABgID+AAGA/oABgICAgAKA/YACgP2AAoCAgAEAgIAAAAAGAAAAAAKABIAAAwAHAAsADwATABcAADM1IRUlETMRIREzEQE1IRUBNSEVMzUhFYABgP4AgAGAgP4AAYD+AAEAgAEAgICAAoD9gAKA/YACgICAAQCAgICAAAAAAAkAAACAAoADAAADAAcACwAPABMAFwAbAB8AIwAAPQEzFSE1MxUlNTMVMzUzFSU1MxUlNTMVMzUzFSU1MxUhNTMVgAGAgP4AgICA/wCA/wCAgID+AIABgICAgICAgICAgICAgICAgICAgICAgICAgAAFAAAAAAKAA4AAAwAHAA8AFwAbAAAzNSEVATUzFQERMxEzFSMVIREjNTM1MxEBNSEVgAGA/wCA/oCAgIABgICAgP4AAYCAgAGAgID/AAKA/oCAgAGAgID9gAKAgIAAAAAFAAAAAAKABIAAAwAHAAsADwATAAAzNSEVJREzESERMxEBNTMVJTUzFYABgP4AgAGAgP6AgP8AgICAgAMA/QADAP0AAwCAgICAgAAABQAAAAACgASAAAMABwALAA8AEwAAMzUhFSURMxEhETMRATUzFT0BMxWAAYD+AIABgID+gICAgICAAwD9AAMA/QADAICAgICAAAAAAAQAAAAAAoAEgAADAAcACwAPAAAzNSEVJREzESERMxEBNSEVgAGA/gCAAYCA/gABgICAgAMA/QADAP0AA4CAgAAFAAAAAAKA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AAACgAOAAAMABwALAA8AEwAXAAAzNSEVJREzESERMxEBNSEVPQEzFSU1IRWAAYD+AIABgID+AAGAgP4AAYCAgIABgP6AAYD+gAGAgICAgICAgIAAAAUAAAAAAoADgAADAAcACwAPABMAADM1IRUlETMRIREzEQE1IRUBNSEVgAGA/gCAAYCA/gABgP6AAYCAgIABgP6AAYD+gAGAgIABAICAAAAABgAAAAACgAOAAAMABwALAA8AEwAXAAAzNSEVJREzESERMxEBNSEVATUhFTM1IRWAAYD+AIABgID+AAGA/gABAIABAICAgAGA/oABgP6AAYCAgAEAgICAgAAAAAADAAAAAAMAA4AAAwAHAAsAACERIREBNSEVAREhEQEAAQD+AAMA/gABAAEA/wABgICAAQABAP8AAAMAAAAAAoACgAADAA0AFwAAATUzFQE1IxEzETMVIRU1ESM1ITUhFTMRAQCA/wCAgIABAID/AAGAgAEAgID/AIABgP8AgICAAQCAgID+gAAAAwAAAAACgAOAAAMACQANAAA1ETMRFTUhETMRATUhFYABgID9gAEAgAIA/gCAgAIA/YADAICAAAADAAAAAAKAA4AAAwAJAA0AADURMxEVNSERMxEBNSEVgAGAgP8AAQCAAgD+AICAAgD9gAMAgIAAAAMAAAAAAoADgAADAAkADQAANREzERU1IREzEQE1MxWAAYCA/oCAgAIA/gCAgAIA/YADAICAAAAABAAAAAACgAOAAAMACQANABEAADURMxEVNSERMxEBNTMVMzUzFYABgID+AICAgIACAP4AgIACAP2AAwCAgICAAAUAAP+AAoADgAADAAcADwATABcAABU1IRUBETMRATUhNSERMxEBNTMVPQEzFQIA/gCAAYD+gAGAgP6AgICAgIABgAGA/oD/AICAAYD9gAKAgICAgIAAAAACAAD/gAGAAwAAAwAPAAABNTMVAREzETMVIxUzFSMRAQCA/oCAgICAgAEAgID+gAOA/wCAgID/AAAAAAAFAAD/gAKAA4AAAwAHAA8AEwAXAAAVNSEVAREzEQE1ITUhETMRATUzFTM1MxUCAP4AgAGA/oABgID+AICAgICAgAGAAYD+gP8AgIABgP2AAwCAgICAAAAABwAAAAACgASAAAMABwALAA8AEwAXABsAACERMxEBNTMVMzUzFSU1MxUhNTMVATUhFTM1IRUBAID/AICAgP4AgAGAgP2AAQCAAQACgP2AAoCAgICAgICAgIABAICAgIAAAwAAAAACgAOAAAMACwARAAAhNSEVNREjNTMRMxEFESEVIREBAAEAgICA/YACAP6AgICAAQCAAQD9gIADgID9AAAAAAABAAABgAKAAgAAAwAAETUhFQKAAYCAgAACAAACAAEAA4AAAwAHAAARNTMVNREzEYCAAgCAgIABAP8AAAACAAACAAEAA4AAAwAHAAARNTMVNREzEYCAAgCAgIABAP8AAAACAAAAAAEAAYAAAwAHAAAxNTMVNREzEYCAgICAAQD/AAAAAAACAAACAAEAA4AAAwAHAAATNTMVJREzEYCA/wCAAgCAgIABAP8AAAAABAAAAgACAAOAAAMABwALAA8AABE1MxUzNTMVJREzETMRMxGAgID/AICAgAIAgICAgIABAP8AAQD/AAAABAAAAgACAAOAAAMABwALAA8AABE1MxUzNTMVJREzETMRMxGAgID/AICAgAIAgICAgIABAP8AAQD/AAAABAAAAAACAAGAAAMABwALAA8AADE1MxUzNTMVJREzETMRMxGAgID/AICAgICAgICAAQD/AAEA/wAAAAAAAQAAAAACgAOAAAsAACERITUhETMRIRUhEQEA/wABAIABAP8AAgCAAQD/AID+AAAAAQAAAQABgAKAAAsAABM1IzUzNTMVMxUjFYCAgICAgAEAgICAgICAAAMAAAAAAoABAAADAAcACwAAMREzETMRMxEzETMRgICAgIABAP8AAQD/AAEA/wAAAAUAAACAAYADAAADAAcACwAPABMAACU1MxUlNTMVJTUzFT0BMxU9ATMVAQCA/wCA/wCAgICAgICAgICAgICAgICAgIAABQAAAIABgAMAAAMABwALAA8AEwAAPQEzFT0BMxU9ATMVJTUzFSU1MxWAgID/AID/AICAgICAgICAgICAgICAgIAAAAABAAAAAAKAA4AAFwAAITUjNSMRMzUzNSEVIRUjFSEVIRUzFSEVAQCAgICAAYD/AIABgP6AgAEAgIABgICAgICAgICAgAAAAAABAAACAAMAA4AADwAAExEjNSEVMzUzFTMRITUjFYCAAYCAgID/AIACAAEAgICAgP8AgIAAAwAAAAACgAOAAA0AEQAVAAAzESM1MzUzFSER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);
    };

    .wurst {
        position: absolute;
        top: 10px;
        left: 10px;
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */
        z-index: 999999;
    }

    #wurst-icon, #wurst-icon img {
        position: absolute;
        width: 150px;
        z-index: -1;
    }

    .module {
        width: 100px;
        height: 250px;
        display: inline-block;
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */
        background-color: rgba(104, 101, 101, 0.5);
        color: white;
        vertical-align: top;
    }

    .module-header, .module-selector {
        font-size: 12px;
        font-family: 'wurst-font';
        text-align: center;
        display: block;
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */
        border: 1px solid black;
        margin: 3px 2px 3px 2px;
    }

    .module-selector {
        cursor: pointer
    }
    
    .module-header {
        background-color: rgba(28, 28, 28, 0.7);
    }

    .selected {
        background-color: green;
    }

    .hide {
        display: none
    }

    .selected-modules {
        position: absolute;
        top: 150px;
        left: 20px;
    }
    </style>`;

    const $ = window.jQuery;
    $(document.body).append(wurstUI);

    document.querySelector('.wurst').style.position = 'absolute';
    document.querySelector('.wurst').style.top = '10px';
    document.querySelector('.wurst').style.left = '10px';
    document.querySelector('.wurst').style.zIndex = '9999999';
};



console.log('Initiating Wurst');
initUI();

// Make a the module text have a id aand when u click again remove the id 

function toggleModule(e, name) {
    if (!Array.from(e.classList).includes('selected')) {
        const selectedModule = document.createElement('span');
        selectedModule.innerHTML = name;
        selectedModule.id = name;
        selectedModule.style.position = 'relative';
        selectedModule.style.zIndex = -1;
        selectedModule.style.pointerEvents = 'none';
        selectedModule.style.fontSize = '11px';
        selectedModule.style.fontFamily = 'wurst-font';
        selectedModule.style.display = 'block';

        document.querySelector('.selected-modules').appendChild(selectedModule);
        e.classList.add('selected')
    } else {
        document.getElementById(name).remove();
        e.classList.remove('selected');
    };
};

// Event Listeners 
document.addEventListener('keypress', e => {
    if (e.key === 'v') {
        document.querySelectorAll('.module').forEach(e => {
            console.log(e);
            !Array.from(e.classList).includes('hide') ? e.classList.add('hide') : e.classList.remove('hide');
        })
    };
});


// Fly
document.querySelectorAll('.module-selector')[0].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[0], 'Fly');
    toggleFly();
});

// Speed
document.querySelectorAll('.module-selector')[1].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[1], 'Speed');
    toggleSpeed();
});

// High Jump
document.querySelectorAll('.module-selector')[2].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[2], 'HighJump');
    toggleHighJump();
});

// Spider
document.querySelectorAll('.module-selector')[3].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[3], 'Spider');
    toggleSpider();
});

// Fling Player
document.querySelectorAll('.module-selector')[4].addEventListener('click', () => {
    flingPlayer();
});


// Auto Clicker
document.querySelectorAll('.module-selector')[5].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[5], 'AutoClicker');
    toggleAutoClick();
});

// KillAura
document.querySelectorAll('.module-selector')[6].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[6], 'KillAura');
    toggleKillAura();
});

// Aimbot
document.querySelectorAll('.module-selector')[7].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[7], 'Aimbot');
    toggleAimbot();
});

// Kill All
document.querySelectorAll('.module-selector')[8].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[8], 'KillAll');
    toggleKillAll();
});

// Bunny Hop
document.querySelectorAll('.module-selector')[9].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[9], 'BunnyHop');
    toggleBunnyHop();
});

// ESP
document.querySelectorAll('.module-selector')[10].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[10], 'ESP');
    toggleESP();
});

// Charms
document.querySelectorAll('.module-selector')[11].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[11], 'Charms');
    toggleCharms();
});

// Funny Chat
document.querySelectorAll('.module-selector')[12].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[12], 'FunnyChat');
    toggleFunnyChat();
});

// Anti AFK
document.querySelectorAll('.module-selector')[13].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[13], 'AntiAFK');
    toggleAntiAFK();
});

// Quick Switch
document.querySelectorAll('.module-selector')[14].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[14], 'QuickSwitch');
    toggleQuickSwitch();
});

// Red Sky
document.querySelectorAll('.module-selector')[15].addEventListener('click', () => {
    toggleModule(document.querySelectorAll('.module-selector')[15], 'RedSky');
    toggleRedSky();
});
