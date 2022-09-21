import axios from "axios";
import {customAlertError, customAlertSuccess} from "./customAlerts";
import Pusher from "pusher-js";

turn = turn === 'host' ? 1 : 2; //WHICH USER'S TURN IT IS; 1 -> User1, 2 -> User2; HOST (User1) ALWAYS HAS THE FIRST MOVE!

console.log(turn)

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
        axios.post('/battle/load', dataToSend).then(function (response) {
            if (response.data.status === true) {
                customAlertSuccess('Boats have been set!')
            } else {
                customAlertError('Boats have already been set!')
            }

            hideElementById('grid-options')
            hideElementById('boats')
        })
    })

    document.getElementById("reset-board").addEventListener('click', function () {
        placedBoats = {};
        for (let li of document.getElementsByClassName("cell")) {
            li.innerText = '0';
            li.style.backgroundColor = 'gray'
            li.style.color = 'black'
        }
        for (let child of document.getElementById('boats').children) {
            child.style.display = 'flex'
            child.classList.add('boat-to-select')
        }
    });
}

loadHits();

function hideElementById(id) {
    document.getElementById(id).style.display = 'none';
}

function hit(coordinates) {
    let cellId = coordinates[0] + coordinates[1]

    let targetCell = document.getElementById(cellId)

    targetCell.style.backgroundColor = 'green';
    targetCell.setAttribute('data-hit', "true");
}

function hitBoat(coordinates) {
    let cellId = coordinates[0] + coordinates[1]

    let targetCell = document.getElementById(cellId)

    targetCell.style.backgroundColor = 'red';
    targetCell.setAttribute('data-hit', "true");
}

///////////////////////////PUSHER///////////////////////////////////////
let channelName = battle_id;
var pusher = new Pusher('7cb53bc01cb5c9f74363', {
    cluster: 'eu'
});
const channel = pusher.subscribe(channelName);
channel.bind('new-greeting', function (params) {


    switchTurn()
    adjustEventListenersBasedOnTurn()
    console.log('TURN: ' + turn)
    console.log('-------------------------')


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
        if (params.board === 'guestBoard') {
            if (params.isHit === true) {
                hit(params.coordinates)
            } else {
                hitBoat(params.coordinates)
            }
        } else {
            if (params.isHit === true) {
                let cellId = params.coordinates[0] + " " + params.coordinates[1]

                let targetCell = document.getElementById(cellId)

                targetCell.style.backgroundColor = 'green';
                targetCell.setAttribute('data-hit', "true");
            } else {
                let cellId = params.coordinates[0] + " " + params.coordinates[1]

                let targetCell = document.getElementById(cellId)

                targetCell.style.backgroundColor = 'red';
                targetCell.setAttribute('data-hit', "true");
            }
        }

    }
});

channel.bind('join', function (params) {
    document.getElementById('vs').innerHTML = params.user1Username + " VS " + params.user2Username;
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
            boat.setAttribute('data-rotation', "1")
        } else {
            document.getElementById(boat.getAttribute('id')).style.display = 'flex'
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
                        document.getElementById(cellId).style.backgroundColor = 'black'
                        document.getElementById(cellId).style.color = 'white'
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
                        document.getElementById(cellId).style.backgroundColor = 'black'
                        document.getElementById(cellId).style.color = 'white'
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
                cell.style.backgroundColor = 'black'
                cell.style.color = 'white'
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
            cell.style.backgroundColor = 'green'
            cell.setAttribute('data-hit', 'true')
        } else {
            cell.style.backgroundColor = 'red'
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

function switchTurn() {
    turn = turn === 1 ? 2 : 1;
}

function adjustEventListenersBasedOnTurn() {
    if (Number(isHost) === 1) {
        if (turn === 1) {
            addEventListenersToGrid()
            console.log('ADDED PLAYER 1 LISTENERS')
        } else {
            removeEventListenersFromGrid()
            console.log('REMOVED PLAYER 1 LISTENERS')
        }
    } else {
        if (turn === 2) {
            addEventListenersToGrid()
            console.log('ADDED PLAYER 2 LISTENERS')
        } else {
            removeEventListenersFromGrid()
            console.log('REMOVED PLAYER 2 LISTENERS')
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
        axios.post("/battle/hit", dataToSend).then(function (response) {

            if (response.data.isHit === true) {
                cell.style.backgroundColor = 'green'
            } else {
                cell.style.backgroundColor = 'red'
            }

            if (response.data.allBoatsAreDestroyed === true) {
                document.getElementById('vs').innerHTML = 'YOU WON!'

                const dataToSendToEnd = new FormData;
                dataToSendToEnd.set('battle_id', battle_id)
                dataToSendToEnd.set('channel', channelName)
                axios.post("/battle/end", dataToSendToEnd)
                //     .then(function (response) {
                // });
            }

        });

    }
}

function addEventListenersToGrid() {
    console.log('ADDING........')
    for (let cell of opponentCells) {
        cell.addEventListener('click', cellEvent)
    }
}

console.log(haveBoatsBeenSet, haveOpponentsBoatsBeenSet)

if (Number(hasMatchEnded) === 1 || Number(haveBoatsBeenSet) === 0 || Number(haveOpponentsBoatsBeenSet) === 0) {
    removeEventListenersFromGrid()
}
