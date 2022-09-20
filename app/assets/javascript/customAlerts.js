import sweetalert2 from "sweetalert2";
import axios from "axios";

export function customAlertError(message) {
    sweetalert2.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
    })
}

export function customAlertSuccess(message) {
    sweetalert2.fire({
        position: 'center',
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer: 1500
    })
}

export function customAlertQuestion(title, question, battle_id, password) {
    sweetalert2.fire(
        title,
        question,
        'question'
    ).then(response => {
        if (response.isConfirmed) {
            window.location.href = '/battle?battle_id=' + battle_id + '&password=' + password
        }
    })
}

export function customOneFieldForm(title, submitButtonName) {
    sweetalert2.fire({
        title: title,
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: submitButtonName,
    }).then(response => {
        if (response.isConfirmed) {
            const dataToSend = new FormData()
            dataToSend.set('password', response.value)

            axios.post(
                '/battle/join',
                dataToSend,
            ).then(function (response) {
                console.log(response.data)
                if (response.data.status === true) {
                    window.location.href = '/battle?battle_id=' + response.data.battle_id + '&password=' + dataToSend.get('password')
                } else if (response.data.status === null) {
                    customAlertQuestion(response.data.title, response.data.question, response.data.battle_id, dataToSend.get('password'))
                } else {
                    customAlertError(response.data.message)
                }
            });
        }
    })
}