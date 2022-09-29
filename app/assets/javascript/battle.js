import axios from "axios";
import {customAlertError, customAlertSuccess} from "./customAlerts";
import Pusher from "pusher-js";

import shipBack from '/public/img/shipBack.png'
import shipBody from '/public/img/shipBody.png'
import shipFront from '/public/img/shipFront.png'
import fire from '/public/img/fire.gif'
import stars from '/public/img/stars.jpg'
import scraps from '/public/img/scraps.png'
import blackHole from '/public/img/blackHole.gif'

turn = turn === 'host' ? 1 : 2; //WHICH USER'S TURN IT IS; 1 -> User1, 2 -> User2;

let status = null;

let isFlipping = false;

function setStatus() {
    const dataToSend = new FormData()
    dataToSend.set('battle_id', battle_id)
    axios.post('/battle/refreshGlobals', dataToSend).then(function (response) {
        haveBoatsBeenSet = response.data.haveBoatsBeenSet
        haveOpponentsBoatsBeenSet = response.data.haveOpponentsBoatsBeenSet
        hasMatchEnded = response.data.hasMatchEnded
        console.log(response.data)

        if (isFlipping === true) {
            return null;
        }

        if (Number(hasMatchEnded) === 1) {
            status = 'This match has ended!'
        } else if (Number(haveBoatsBeenSet) === 1 && Number(haveOpponentsBoatsBeenSet) === 1) {
            if (Number(isHost) === 1) {
                if (turn === 1) {
                    status = 'It\'s your turn!'
                } else {
                    status = 'Opponent is shooting...'
                }
            } else {
                if (turn === 1) {
                    status = 'Opponent is shooting...'
                } else {
                    status = 'It\'s your turn!'
                }
            }
        } else if (Number(haveBoatsBeenSet) === 0 && Number(haveOpponentsBoatsBeenSet) === 0) {
            status = 'Waiting for all players to place their boats...'
        } else if (Number(haveBoatsBeenSet) === 0) {
            status = 'Waiting for you to place your boats...'
        } else if (Number(haveOpponentsBoatsBeenSet) === 0) {
            status = 'Waiting for opponent to place his boats...'
        }

        if (Number(isSpectator) === 1 && Number(haveBoatsBeenSet) === 1 && Number(haveOpponentsBoatsBeenSet) === 1 && Number(hasMatchEnded) === 0) {
            if (turn === 1) {
                status = 'Player 1 is shooting'
            } else {
                status = 'Player 2 is shooting'
            }
        } else if (Number(isSpectator) === 1 && Number(hasMatchEnded) === 0) {
            status = 'Waiting for all players to place their boats...'
        } else if (Number(isSpectator) === 1) {
            status = 'This match has ended!'
        }

        console.log(status)
        document.getElementById('status-box').innerHTML = status
    })
}

setStatus()

let opponentCells = document.querySelectorAll(".cells");

if (Number(isSpectator) === 0) {
    loadBoats();

    if (Number(haveBoatsBeenSet) === 1) {
        hideElementById('grid-options')
        hideElementById('boats')
    }

    document.getElementById("send").addEventListener('click', function () {
        // if (Object.keys(boatCoordinates).length === 3) {
        const dataToSend = new FormData()
        for (const boatNumber in placedBoats) {
            let ship = placedBoats[`${boatNumber}`]
            dataToSend.set(ship.coordinates, [boatNumber, ship.health, ship.vertical]);
        }
        dataToSend.set('battle_id', battle_id)
        dataToSend.set('channel', channelName)
        axios.post('/battle/load', dataToSend).then(function (response) {
            if (response.data.status === true) {
                if (response.data.haveUser1BoatsBeenSet === false || response.data.haveUser2BoatsBeenSet === false)
                    customAlertSuccess('Boats have been set!')
            } else {
                customAlertError('Boats have already been set!')
            }

            setStatus()

            hideElementById('grid-options')
            hideElementById('boats')
        })
    })

    document.getElementById("reset-board").addEventListener('click', function () {
        placedBoats = {};
        for (let li of document.getElementsByClassName("cell")) {
            li.innerText = '0';
            li.style.backgroundColor = 'gray'
        }
        for (let child of document.getElementById('boats').children) {
            child.style.display = 'flex'
            child.classList.add('boat-to-select')
        }

        setStatus()
    });
}

loadHits();

function hideElementById(id) {
    document.getElementById(id).style.display = 'none';
}

function hit(coordinates) {

    let cellId = coordinates[0] + coordinates[1]

    let targetCell = document.getElementById(cellId)

    targetCell.style.backgroundImage = "url('" + blackHole + "')"
    targetCell.style.backgroundSize = '100% 100%';
    if (Boolean(Math.round(Math.random()))) {
        targetCell.style.transform = "scaleX(-1)"
    }
    targetCell.setAttribute('data-hit', "true");

}

function hitBoat(coordinates) {
    let cellId = coordinates[0] + coordinates[1]

    let targetCell = document.getElementById(cellId)

    targetCell.style.backgroundImage = "url('" + scraps + "'), " + "url('" + fire + "'), " + "url('" + stars + "')"
    targetCell.style.backgroundSize = '100% 100%';
    if (Boolean(Math.round(Math.random()))) {
        targetCell.style.transform = "scaleX(-1)"
    }
    targetCell.setAttribute('data-hit', "true");
}

///////////////////////////PUSHER///////////////////////////////////////
let channelName = battle_id;
var pusher = new Pusher('7cb53bc01cb5c9f74363', {
    cluster: 'eu'
});
const channel = pusher.subscribe(channelName);
channel.bind('new-greeting', function (params) {

    turn = params.turn === 'host' ? 1 : 2;
    adjustEventListenersBasedOnTurn()
    setStatus()


    if (Number(isHost) === 1 && params.board === 'hostBoard') {
        if (params.isHit === true) {
            hitBoat(params.coordinates)
        } else {
            hit(params.coordinates)
        }
    } else if (Number(isHost) === 0 && params.board === 'guestBoard' && Number(isSpectator) === 0) {
        if (params.isHit === true) {
            hitBoat(params.coordinates)
        } else {
            hit(params.coordinates)
        }
        /////////////// FOR SPECTATOR ////////////////////
    } else if (Number(isSpectator) === 1) {
        console.log(params)
        if (params.board === 'guestBoard') {
            if (params.isHit === true) {
                hitBoat(params.coordinates)
            } else {
                hit(params.coordinates)
            }
        } else {
            if (params.isHit === true) {
                let cellId = params.coordinates[0] + " " + params.coordinates[1]

                let targetCell = document.getElementById(cellId)

                targetCell.style.backgroundImage = "url('" + scraps + "'), " + "url('" + fire + "'), " + "url('" + stars + "')"
                targetCell.style.backgroundSize = '100% 100%';
                if (Boolean(Math.round(Math.random()))) {
                    targetCell.style.transform = "scaleX(-1)"
                }
                targetCell.setAttribute('data-hit', "true");
            } else {
                let cellId = params.coordinates[0] + " " + params.coordinates[1]

                let targetCell = document.getElementById(cellId)

                targetCell.style.backgroundImage = "url('" + blackHole + "')"
                targetCell.style.backgroundSize = '100% 100%';
                if (Boolean(Math.round(Math.random()))) {
                    targetCell.style.transform = "scaleX(-1)"
                }
                targetCell.setAttribute('data-hit', "true");
            }
        }
    }
});

channel.bind('join', function (params) {
    document.getElementById('vs').innerHTML = params.user1Username + " VS " + params.user2Username;

    setStatus()
});

channel.bind('start', function (params) {
    if (params.haveUser1BoatsBeenSet && params.haveUser2BoatsBeenSet) {

        console.log(params)

        document.getElementById('coin-flip-container').style.display = 'block';
        document.getElementById('status-box').innerHTML = 'Flipping coin...'
        isFlipping = true;


        let coin = document.querySelector(".coin");
        let i = turn === 1 ? 0 : 1;

        coin.style.animation = "none";
        if (i) {
            setTimeout(function () {
                coin.style.animation = "spin-heads 3s forwards";
            }, 1000);
        } else {
            setTimeout(function () {
                coin.style.animation = "spin-tails 3s forwards";
            }, 1000);
        }
        setTimeout(updateStats, 5000);

        function updateStats() {
            let winner = null;
            if (i === 0) {
                winner = params.user1Username;
            } else {
                winner = params.user2Username;
            }
            document.querySelector("#coin-flip-status").textContent = 'First move: ' + winner;

            setTimeout(removeCoinFlipModal, 1500);
        }

        function removeCoinFlipModal() {
            document.getElementById('coin-flip-container').style.display = 'none';
            isFlipping = false;
            setStatus()
        }


        if ((Number(isHost) === 1 && turn === 1) || (Number(isHost) === 0 && turn === 2)) {
            addEventListenersToGrid()
        }
    } else {
        setStatus()
    }
});

channel.bind('declare_loser', function (params) {
    if (params.isHostWinner === true && Number(isHost) === 1) {
        document.getElementById('vs').innerHTML = 'YOU WON!';
    } else if (params.isHostWinner === false && Number(isHost) === 0) {
        document.getElementById('vs').innerHTML = 'YOU WON!';
    } else if (Number(isSpectator) === 1) {
        document.getElementById('spectator-mode-h').innerHTML = 'WINNER: ' + params.winner + '!';
    } else {
        document.getElementById('vs').innerHTML = 'YOU LOST!';
    }
    removeEventListenersFromGrid();
    setStatus()
});
///////////////////////////////////////////////////////////////////////

let homeButton = document.getElementById('button-home')

homeButton.addEventListener("click", ev => {
    window.location.href = '/'
})

let dragged = null;

let boats = document.querySelectorAll('.boats')

for (let boat of boats) {
    boat.addEventListener("dragstart", (event) => {
        if (document.getElementById('vertical').checked) {
            document.getElementById(boat.getAttribute('id')).style.display = 'block'
            for (let child of document.getElementById(boat.getAttribute('id')).children) {
                child.style.transform = "rotate(90deg)"
            }
            boat.setAttribute('data-rotation', "1")
        } else {
            document.getElementById(boat.getAttribute('id')).style.display = 'flex'
            for (let child of document.getElementById(boat.getAttribute('id')).children) {
                child.style.removeProperty('transform')
            }
            boat.setAttribute('data-rotation', "0")
        }
        event.dataTransfer.setDragImage(document.getElementById(boat.getAttribute('id')), 25, 25);
        dragged = event.target;
    });
}

function doesGivenBoatFitOnGrid(boat, cellId, rotation) {
    let boatSize = boat.getAttribute('data-size')

    let cellX = cellId[1]
    let cellY = cellId[0]

    if (rotation === 0) {
        if (10 - cellX < boatSize) {
            return false
        }
        return true
    } else if (rotation === 1) {
        if (10 - cellY < boatSize) {
            return false
        }
        return true
    }
}

function doesGivenBoatOverlapTheOthers(boat, cellId, rotation) {
    let boatSize = boat.getAttribute('data-size')

    let cellX = cellId[1]
    let cellY = cellId[0]

    if (rotation === 0) {
        for (let x = 0; x < boatSize; x++) {
            let cellId = cellY + (Number(cellX) + x)

            if (document.getElementById(cellId).innerHTML[0] !== '0') {
                return true
            }
        }
        return false
    } else if (rotation === 1) {
        for (let y = 0; y < boatSize; y++) {
            let cellId = (Number(cellY) + y) + cellX

            if (document.getElementById(cellId).innerHTML[0] !== '0') {
                return true
            }
        }
        return false
    }
}

let cells = document.querySelectorAll('.cell')

for (let cell of cells) {
    cell.addEventListener("dragover", (event) => {
        // prevent default to allow drop
        event.preventDefault();
    });
    cell.addEventListener("drop", (event) => {
        // prevent default action (open as link for some elements)
        event.preventDefault();
        // move dragged element to the selected drop target
        if (doesGivenBoatFitOnGrid(dragged, cell.getAttribute('id'), Number(dragged.getAttribute('data-rotation')))) {
            if (!doesGivenBoatOverlapTheOthers(dragged, cell.getAttribute('id'), Number(dragged.getAttribute('data-rotation')))) {
                dragged.parentElement.style.display = 'none'
                dragged.parentElement.classList.remove('boat-to-select')

                if (Number(dragged.getAttribute('data-rotation')) === 0) {
                    for (let i = 0; i < dragged.getAttribute('data-size'); i++) {
                        let cellId = cell.getAttribute('id')[0] + (Number(cell.getAttribute('id')[1]) + i)

                        document.getElementById(cellId).innerHTML = dragged.getAttribute('id')[5]
                        if (i === 0) {
                            document.getElementById(cellId).style.backgroundImage = "url('" + shipBack + "')"
                        } else if (i === dragged.getAttribute('data-size') - 1) {
                            document.getElementById(cellId).style.backgroundImage = "url('" + shipFront + "')"
                        } else {
                            document.getElementById(cellId).style.backgroundImage = "url('" + shipBody + "')"
                        }
                        document.getElementById(cellId).classList.add('ship')
                    }
                    let startingCellOfBoat = cell.getAttribute('id')[0] + (Number(cell.getAttribute('id')[1]))

                    placedBoats[`${startingCellOfBoat}`] = {
                        'coordinates': dragged.getAttribute('id'),
                        'health': dragged.getAttribute('data-size'),
                        'vertical': dragged.getAttribute('data-rotation')
                    }

                    let remainingBoatsToSelect = document.getElementsByClassName('boat-to-select')
                    if (remainingBoatsToSelect.item(0) === null) {
                        customAlertSuccess('All ships are now placed on the board!')
                    }
                } else if (Number(dragged.getAttribute('data-rotation')) === 1) { ///////
                    for (let i = 0; i < dragged.getAttribute('data-size'); i++) {
                        let cellId = (Number(cell.getAttribute('id')[0]) + i) + cell.getAttribute('id')[1]

                        document.getElementById(cellId).innerHTML = dragged.getAttribute('id')[5]
                        if (i === 0) {
                            document.getElementById(cellId).style.backgroundImage = "url('" + shipBack + "')"
                        } else if (i === dragged.getAttribute('data-size') - 1) {
                            document.getElementById(cellId).style.backgroundImage = "url('" + shipFront + "')"
                        } else {
                            document.getElementById(cellId).style.backgroundImage = "url('" + shipBody + "')"
                        }
                        document.getElementById(cellId).style.transform = "rotate(90deg)"
                        document.getElementById(cellId).classList.add('ship')
                    }
                    let startingCellOfBoat = (Number(cell.getAttribute('id')[0])) + cell.getAttribute('id')[1]

                    placedBoats[`${startingCellOfBoat}`] = {
                        'coordinates': dragged.getAttribute('id'),
                        'health': dragged.getAttribute('data-size'),
                        'vertical': dragged.getAttribute('data-rotation')
                    }

                    let remainingBoatsToSelect = document.getElementsByClassName('boat-to-select')
                    if (remainingBoatsToSelect.item(0) === null) {
                        customAlertSuccess('All ships are now placed on the board!')
                    }
                }

            } else {
                customAlertError('You cannot place boats on top of each other!')
            }
        } else {
            customAlertError('Boats must be placed inside the board!')
        }
    });
}

function loadBoats() {
    loadedBoats = JSON.parse(loadedBoats)
    let nrOfProperties = Object.keys(loadedBoats).length;
    if (nrOfProperties > 0) {
        for (let boatNr in loadedBoats) {
            let deltaX = loadedBoats[boatNr].vertical ? 0 : 1;
            let deltaY = loadedBoats[boatNr].vertical ? 1 : 0;

            for (let j = 0; j < loadedBoats[boatNr].size; j++) {
                let coordY = Number(loadedBoats[boatNr].coordinates.posY) + Number(j * deltaY);
                let coordX = Number(loadedBoats[boatNr].coordinates.posX) + Number(j * deltaX);
                let cell = document.getElementById(coordY + "" + coordX);
                cell.innerHTML = boatNr
                if (j === 0) {
                    cell.style.backgroundImage = "url('" + shipBack + "')"
                    if (loadedBoats[boatNr].vertical) {
                        cell.style.transform = "rotate(90deg)"
                    }
                } else if (j === loadedBoats[boatNr].size - 1) {
                    cell.style.backgroundImage = "url('" + shipFront + "')"
                    if (loadedBoats[boatNr].vertical) {
                        cell.style.transform = "rotate(90deg)"
                    }
                } else {
                    cell.style.backgroundImage = "url('" + shipBody + "')"
                    if (loadedBoats[boatNr].vertical) {
                        cell.style.transform = "rotate(90deg)"
                    }
                }
                cell.classList.add('ship')
            }

        }
    }
}

function loadHits() {
    hitsTaken = JSON.parse(hitsTaken);
    hitsSent = JSON.parse(hitsSent);

    if (Number(isSpectator) === 0) {
        for (let index in hitsTaken) {
            if (hitsTaken[index].isHit) {
                hitBoat(hitsTaken[index].posY + hitsTaken[index].posX);
            } else {
                hit(hitsTaken[index].posY + hitsTaken[index].posX);
            }
        }
    } else {
        for (let index in hitsTaken) {
            if (hitsTaken[index].isHit) {
                hit(hitsTaken[index].posY + hitsTaken[index].posX);
            } else {
                hitBoat(hitsTaken[index].posY + hitsTaken[index].posX);
            }
        }
    }

    for (let index in hitsSent) {
        let cell = document.getElementById(hitsSent[index].posY + " " + hitsSent[index].posX)

        if (hitsSent[index].isHit) {
            cell.style.backgroundImage = "url('" + scraps + "'), " + "url('" + fire + "'), " + "url('" + stars + "')"
            cell.style.backgroundSize = '100% 100%';
            if (Boolean(Math.round(Math.random()))) {
                cell.style.transform = "scaleX(-1)"
            }
            cell.setAttribute('data-hit', 'true')
        } else {
            cell.style.backgroundImage = "url('" + blackHole + "')"
            cell.style.backgroundSize = '100% 100%';
            if (Boolean(Math.round(Math.random()))) {
                cell.style.transform = "scaleX(-1)"
            }
            cell.setAttribute('data-hit', 'true')
        }
    }
}

let placedBoats = {};

function removeEventListenersFromGrid() {
    for (let cell of opponentCells) {
        cell.removeEventListener('click', cellEvent)
    }
}

function adjustEventListenersBasedOnTurn() {
    if (Number(isHost) === 1) {
        if (turn === 1) {
            addEventListenersToGrid()
        } else {
            removeEventListenersFromGrid()
        }
    } else {
        if (turn === 2) {
            addEventListenersToGrid()
        } else {
            removeEventListenersFromGrid()
        }
    }
}

if ((Number(isHost) === 1 && turn === 1) || (Number(isHost) === 0 && turn === 2)) {
    addEventListenersToGrid()
}


function cellEvent(event) {
    let cell = event.currentTarget;
    if (!cell.getAttribute('data-hit')) {
        cell.setAttribute('data-hit', "true");

        const dataToSend = new FormData;
        dataToSend.set('hit', cell.getAttribute('id'))
        dataToSend.set('channel', channelName)
        dataToSend.set('battle_id', battle_id)
        if (Number(isSpectator) !== 1)
            axios.post("/battle/hit", dataToSend).then(function (response) {

                if (response.data.isHit === true) {
                    cell.style.backgroundImage = "url('" + scraps + "'), " + "url('" + fire + "'), " + "url('" + stars + "')"
                    cell.style.backgroundSize = '100% 100%';
                    if (Boolean(Math.round(Math.random()))) {
                        cell.style.transform = "scaleX(-1)"
                    }
                } else {
                    cell.style.backgroundImage = "url('" + blackHole + "')"
                    cell.style.backgroundSize = '100% 100%';
                    if (Boolean(Math.round(Math.random()))) {
                        cell.style.transform = "scaleX(-1)"
                    }
                }

                if (response.data.allBoatsAreDestroyed === true) {
                    document.getElementById('vs').innerHTML = 'YOU WON!'

                    const dataToSendToEnd = new FormData;
                    dataToSendToEnd.set('battle_id', battle_id)
                    dataToSendToEnd.set('channel', channelName)
                    axios.post("/battle/end", dataToSendToEnd)

                }

            });

    }
}

function addEventListenersToGrid() {
    for (let cell of opponentCells) {
        cell.addEventListener('click', cellEvent)
    }
}

if (Number(hasMatchEnded) === 1 || Number(haveBoatsBeenSet) === 0 || Number(haveOpponentsBoatsBeenSet) === 0) {
    removeEventListenersFromGrid()
}

/////////////////////////////////////////EMOJI CHAT///////////////////////////////////////////////////////////////
let emojiElements = document.getElementsByClassName('emoji');
var container = document.getElementById('test');
let index = 0;
var emoji = []
var circles = [];

channel.bind('emoji', function (param) {
    emoji = [];
    emoji.push(param.emoji);
    index = 0;

    addCircle(0, [0, 12], emoji[0]);
    animate();
});

function animate() {
    for (var i in circles) {
        circles[i].update();
    }
    index++;
    if (index < 700) {
        requestAnimationFrame(animate);
    } else {
        cancelAnimationFrame(animate);
        container.replaceChildren();
    }
}

function addCircle(delay, range, color) {
    setTimeout(function () {
        var c = new Circle(range[0] + Math.random() * range[1], 80 + Math.random() * 4, color, {
            x: -0.15 + Math.random() * 0.3,
            y: 1 + Math.random()
        }, range);
        circles.push(c);
    }, delay);
}

function Circle(x, y, c, v, range) {
    var _this = this;
    this.x = 0;
    this.y = y;
    this.color = c;
    this.v = v;
    this.range = range;
    this.element = document.createElement('span');
    this.element.style.position = 'absolute';
    this.element.style.fontSize = '35px';
    this.element.innerHTML = c;
    container.appendChild(this.element);

    this.update = function () {
        if (_this.y > window.screen.availHeight) {
            this.element.remove();
        }
        _this.y += _this.v.y;
        _this.x += _this.v.x;
        this.element.style.opacity = 1;
        this.element.style.transform = 'translate3d(' + _this.x + 'px, ' + _this.y + 'px, 0px)';
        this.element.style.webkitTransform = 'translate3d(' + _this.x + 'px, ' + _this.y + 'px, 0px)';
        this.element.style.mozTransform = 'translate3d(' + _this.x + 'px, ' + _this.y + 'px, 0px)';
    };
}

for (const emojiElement of emojiElements) {
    emojiElement.addEventListener('click', function () {
        let dataToSend = new FormData;
        dataToSend.set('channel', channelName);
        dataToSend.set('emoji', this.getAttribute('data-emoji'));
        axios.post('/emoji', dataToSend);
    });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////