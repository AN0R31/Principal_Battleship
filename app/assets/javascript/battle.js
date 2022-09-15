import axios from "axios";
import {customAlertError, customAlertSuccess} from "./customAlerts";

let homeButton = document.getElementById('button-home')

homeButton.addEventListener("click", ev => {
    window.location.href = '/'
})

let dragged = null;

let boats = document.querySelectorAll('.boats')

for (let boat of boats) {
    boat.addEventListener("dragstart", (event) => {
        event.dataTransfer.setDragImage(document.getElementById(boat.getAttribute('id')), 0, 25);
        // store a ref. on the dragged elem
        dragged = event.target;
    });
}

function doesGivenBoatFitOnGrid(boat, cellId) {
    let boatSize = boat.getAttribute('data-size')

    let cellX = cellId[1]
    let cellY = cellId[0]

    if (10 - cellX < boatSize) {
        return false
    }
    return true
}

function doesGivenBoatOverlapTheOthers(boat, cellId) {
    console.log(boat)
    let boatSize = boat.getAttribute('data-size')

    let cellX = cellId[1]
    let cellY = cellId[0]

    for (let x = 0; x < boatSize; x++) {
        let cellId = cellY + (Number(cellX) + x)

        console.log(cellId)

        if (document.getElementById(cellId).innerHTML !== '0') {
            console.log(cellId, typeof document.getElementById(cellId).innerHTML, document.getElementById(cellId).innerHTML, typeof '0', '0')
            return true
        }
    }
    return false
}

let cells = document.querySelectorAll('li')

for (let cell of cells) {
    cell.addEventListener("dragover", (event) => {
        // prevent default to allow drop
        event.preventDefault();
    });
    cell.addEventListener("drop", (event) => {
        // prevent default action (open as link for some elements)
        event.preventDefault();
        // move dragged element to the selected drop target
        if (doesGivenBoatFitOnGrid(dragged, cell.getAttribute('id'))) {
            if (!doesGivenBoatOverlapTheOthers(dragged, cell.getAttribute('id'))) {
                dragged.parentElement.style.display = 'none'
                dragged.parentElement.classList.remove('boat-to-select')

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
                    'vertical': dragged.getAttribute('data-position')
                }

                let remainingBoatsToSelect = document.getElementsByClassName('boat-to-select')
                if (remainingBoatsToSelect.item(0) === null) {
                    customAlertSuccess('All ships are now placed on the board!')
                }
            } else {
                customAlertError('You cannot place boats on top of each other!')
            }
        } else {
            customAlertError('Boats must be placed inside the board!')
        }
    });
}

let placedBoats = {};

document.getElementById("send").addEventListener('click', function () {
    // if (Object.keys(boatCoordinates).length === 3) {
    const dataToSend = new FormData()
    for (const boatNumber in placedBoats) {
        let ship = placedBoats[`${boatNumber}`]
        dataToSend.set(ship.coordinates, [boatNumber, ship.health, ship.vertical]);
    }
    axios.post('/battle/load', dataToSend).then(r => console.log(r.data))
    // }
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