import sweetalert2 from "sweetalert2";

export function customAlertError(message){
    sweetalert2.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
    })
}

export function customAlertSuccess(message){
    Swal.fire({
        position: 'center',
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer: 1500
    })
}