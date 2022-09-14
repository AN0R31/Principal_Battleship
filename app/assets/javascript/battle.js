import axios from "axios";

let homeButton = document.getElementById('button-home')

homeButton.addEventListener("click", ev => {
    window.location.href = '/'
})

function placeBoatOnBoard(coordinates) {
    let boatPosition = [coordinates.map(item => parseInt(item))];
    let boatSize = boat.getAttribute("data-size");
    let vertical = boat.children;
    vertical = vertical[vertical.length - 1].checked
    let deltaX = vertical === true ? 1 : 0;
    let deltaY = vertical === true ? 0 : 1;

    for (let i = 1; i < boatSize; i++) {
        boatPosition.push([boatPosition[0][0] + i * deltaX, boatPosition[0][1] + i * deltaY]);
    }

    boat.setAttribute("data-position", vertical);
    boatPosition = boatPosition.map(item => item.join(""));

    for (let i = 0; i < boatSize; i++) {
        let tableCell = document.getElementById(boatPosition[i]);
        tableCell.innerText = boatNumber;
    }
}

let boatNumber = null;
let boat = null;
let placedBoats = {};
for (let li of document.getElementsByClassName("cell")) {
    li.addEventListener("click", function () {
        if (boatNumber) {
            let coordinates = this.getAttribute("id").split("");

            placeBoatOnBoard(coordinates);

            placedBoats[`${boatNumber}`] = {
                'coordinates': coordinates.join("_"),
                'health': boat.getAttribute('data-size'),
                'vertical': boat.getAttribute('data-position')
            }

        }
    });
}

for (let ship of document.getElementsByClassName("ship")) {
    ship.addEventListener("click", function () {
        boatNumber = this.innerText;
        boat = this.parentElement;
    })
}

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