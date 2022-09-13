import axios from "axios";
import {del} from "@hotwired/stimulus";

let homeButton = document.getElementById('button-home')

homeButton.addEventListener("click", ev => {
    window.location.href = '/'
})
/////////////////////////////////////////////////////////////////////////
let boatNr = '';
let boat = null;
let boatCoordinates = {};

for (let li of document.getElementsByClassName("cell")) {
    li.addEventListener("click", function () {
        if (boatNr) {
            let coordinates = this.getAttribute("id").split("");

            boatCoordinates[`${boatNr}`] = coordinates.join("_");
            this.innerText = boatNr;

            let boatSize = boat.getAttribute("data-size");
            let boatOrientation = boat.getAttribute("data-position");

            let deltaX = 0;
            let deltaY = 1;

            if (boatOrientation === "1") {
                deltaX = 1;
                deltaY = 0;
            }

            let boatPosition = [coordinates.map(item => parseInt(item))];

            console.log(boatOrientation, deltaX, deltaY);

            for (let i = 1; i < boatSize; i++) {
                boatPosition.push([boatPosition[0][0] + i * deltaX, boatPosition[0][1] + i * deltaY]);
            }
            console.log(boatPosition);
            boatPosition = boatPosition.map(item => item.join(""));

            for (let i = 0; i < boatSize; i++) {
                let element = document.getElementById(boatPosition[i]);
                element.innerText = boatNr;
            }

            // console.log(boatPosition);
            // console.log(boatCoordinates);
            // console.log(boat);
            // console.log(coordinates);

        }

    });
}

for (let ship of document.getElementsByClassName("ship")) {
    ship.addEventListener("click", function () {
        boatNr = this.innerText;
        boat = this.parentElement;
    })
}

document.getElementById("send").addEventListener('click', function () {
    if (Object.keys(boatCoordinates).length === 3) {
        const dataToSend = new FormData()
        for (const item in boatCoordinates) {
            dataToSend.append(boatCoordinates[`${item}`], item)
        }
        axios.post('/battle/load', dataToSend).then(r => console.log(r.data))
    }
})