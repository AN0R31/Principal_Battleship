import axios from "axios";

import {customAlertError, customOneFieldForm} from "./customAlerts";

let createMatchModal = document.getElementById('modal-create-match')

let shipsButtons = document.getElementById('form-section-ships-create-match').children

let shotsButtons = document.getElementById('form-section-shots-create-match').children

let submitModalButton = document.getElementById('button-submit-create-match')

let createMatchButton = document.getElementById('button-create-match')

let joinMatchButton = document.getElementById('button-join-match')

createMatchButton.addEventListener("click", ev => {
    let lastSelectedShot = document.getElementsByClassName('selected-shot')?.item(0)
    let lastSelectedShip = document.getElementsByClassName('selected-ship')?.item(0)

    if (lastSelectedShot !== null) {
        lastSelectedShot.classList.remove('selected-shot')
    }
    if (lastSelectedShip !== null) {
        lastSelectedShip.classList.remove('selected-ship')
    }

    createMatchModal.style.display = 'block'
})

joinMatchButton.addEventListener("click", ev => {
    customOneFieldForm('Insert Battle Key:', 'Join')
})

for (let shipsButton of shipsButtons) {
    shipsButton.addEventListener('click', ev => {
        let lastSelected = document.getElementsByClassName('selected-ship')
        for (let lastSelectedElement of lastSelected) {
            lastSelectedElement.classList.remove('selected-ship')
        }
        shipsButton.classList.add('selected-ship')
    })
}

for (let shotsButton of shotsButtons) {
    shotsButton.addEventListener('click', ev => {
        let lastSelected = document.getElementsByClassName('selected-shot')
        for (let lastSelectedElement of lastSelected) {
            lastSelectedElement.classList.remove('selected-shot')
        }
        shotsButton.classList.add('selected-shot')
    })
}


submitModalButton.addEventListener("click", ev => {
    let selectedShipsButton = document.getElementsByClassName('selected-ship')
    let selectedShotsButton = document.getElementsByClassName('selected-shot')

    if (selectedShipsButton.item(0) !== null && selectedShotsButton.item(0) !== null) {
        let numberOfShots = selectedShotsButton.item(0).getAttribute('data-value')
        let numberOfShips = selectedShipsButton.item(0).getAttribute('data-value')

        const dataToSend = new FormData()
        dataToSend.set('ships', numberOfShips)
        dataToSend.set('shots', numberOfShots)

        axios.post(
            '/battle/create',
            dataToSend,
        ).then(function (response) {
            if (response.data.status === true) {
                window.location.href = '/battle?battle_id='+response.data.battle_id+'&password='+response.data.password;
            } else {
                customAlertError('Something went wrong. Please try again!')
            }
        });

    } else {
        customAlertError('Please select all the boxes!')
    }
})

let closeModalButton = document.getElementById('modal-close-button')

closeModalButton.addEventListener("click", ev => {
    createMatchModal.style.display = 'none'
})