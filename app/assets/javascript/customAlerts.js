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
                if (response.data.status === true) {
                    window.location.href = '/battle?battle_id=' + response.data.battle_id + '&password=' + dataToSend.get('password')
                } else {
                    customAlertError(response.data.message)
                }
            });
        }
    })
}