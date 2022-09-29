import axios from "axios";

import picture1 from '/public/img/p1.png'
let p1 = picture1;
import picture2 from '/public/img/p2.png'
let p2 = picture2;
import picture3 from '/public/img/p3.png'
let p3 = picture3;
import picture4 from '/public/img/p4.png'
let p4 = picture4;
import picture5 from '/public/img/p5.png'
let p5 = picture5;
import picture6 from '/public/img/p6.png'
let p6 = picture6;
import picture7 from '/public/img/p7.png'
let p7 = picture7;
import picture8 from '/public/img/p8.png'
let p8 = picture8;
import picture9 from '/public/img/p9.png'
let p9 = picture9;
import picture10 from '/public/img/p10.png'
let p10 = picture10;

document.getElementById('change-profile-picture-button').addEventListener("click", ev => {
    document.getElementById('profile-picture-modal-container').style.display = 'flex';
})

for (let picture of document.getElementById('profile-picture-modal').children) {
    picture.addEventListener("click", ev => {
        let dataToSend = new FormData()
        dataToSend.set('picture_tag', picture.getAttribute('data-picture'))
        axios.post('/profile/setProfilePicture', dataToSend).then(function (response) {
            document.getElementById('profile-picture').style.backgroundImage = "url('" + eval(picture.getAttribute('data-path')) + "')";
            document.getElementById('profile-picture-modal-container').style.display = 'none';
        })
    })
}