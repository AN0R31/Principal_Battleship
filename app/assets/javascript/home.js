let createMatchModal = document.getElementById('modal-create-match')

let shipsButtons = document.getElementById('form-section-ships-create-match').children

let shotsButtons = document.getElementById('form-section-shots-create-match').children

let submitModalButton = document.getElementById('button-submit-create-match')

let createMatchButton = document.getElementById('button-create-match')

createMatchButton.addEventListener("click", ev => {
    createMatchModal.style.display = 'block'
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
    // let numberOfBoats =
})

let closeModalButton = document.getElementById('modal-close-button')

closeModalButton.addEventListener("click", ev => {
    createMatchModal.style.display = 'none'
})