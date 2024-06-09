//איבנטים

window.addEventListener('load',async ()=>{
    // make on load the event to request all the logged user data and show 
    // it in the panel according to the login data
    const currentURL = window.location.href;
    const response = await fetch(currentURL,{method:'POST'});
    const data = await response.json();

    const firstName = data[0]["first_name"];
    const lastName = data[0]["last_name"];
    const ssn = data[0]["ssn"];
    const username = data[0]["username"];
    const emailAddress = data[0]["email_address"];
    const phone_number = data[0]["phone_number"];
    const privilege = "User";

    document.getElementById("fullnameTXT").innerHTML = `Hello ${firstName} ${lastName}`;
    document.getElementById("ssnTXT").innerHTML = `SSN: ${ssn}`;
    document.getElementById("usernameTXT").innerHTML = `Username: ${username}`;
    document.getElementById("emailaddressTXT").innerHTML = `Email Address: ${emailAddress}`;
    document.getElementById("phonenumberTXT").innerHTML = `Phone Number: ${phone_number}`;
    document.getElementById("privilegeTXT").innerHTML = `Privilege: ${privilege}`;

});
document.getElementById("changePhoneNumber").addEventListener('click',async()=>{
    const blocker = document.createElement('div');
    blocker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.1);z-index:10;";
    const response = await fetch('/externalHTMLs/account/changePhoneNumber.html');
    blocker.innerHTML = await response.text();
    document.body.appendChild(blocker);

    document.getElementById("close").addEventListener('click',()=>{
        blocker.remove();
    });
    document.getElementById("changePhoneNumberForm").addEventListener('submit',(event)=>{
        event.preventDefault();

        const newPhoneNumber = document.getElementsByName('phonenumber')[0].value;
        const validation = document.getElementsByName('confirm')[0].value;

        if(!isValidPhoneNumber(newPhoneNumber)){
            document.getElementsByName('phonenumber')[0].style.cssText = "background-color:rgb(255, 180, 180)";
            return false;
        }
        if(newPhoneNumber!=validation){
            document.getElementsByName('phonenumber')[0].style.cssText = "background-color:white";
            document.getElementsByName('confirm')[0].style.cssText = "background-color:rgb(255, 180, 180)";
            return false;
        }
        document.getElementById("changePhoneNumberForm").submit();
    })
});
document.getElementById("changeEmailAddress").addEventListener('click',async()=>{
    const blocker = document.createElement('div');
    blocker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.1);z-index:10;";
    const response = await fetch('/externalHTMLs/account/changeEmailAddress.html');
    blocker.innerHTML = await response.text();
    document.body.appendChild(blocker);
    
    document.getElementById("close").addEventListener('click',()=>{
        blocker.remove();
    });
    document.getElementById("changeEmailAddressForm").addEventListener('submit',(event)=>{
        event.preventDefault();

        const newEmailAddress = document.getElementsByName('emailaddress')[0].value;
        const validation = document.getElementsByName('confirm')[0].value;

        if(!isValidEmail(newEmailAddress)){
            document.getElementsByName('emailaddress')[0].style.cssText = "background-color:rgb(255, 180, 180)";
            return false;
        }
        if(newEmailAddress!=validation){
            document.getElementsByName('emailaddress')[0].style.cssText = "background-color:white";
            document.getElementsByName('confirm')[0].style.cssText = "background-color:rgb(255, 180, 180)";
            return false;
        }
        document.getElementById("changeEmailAddressForm").submit();
    })
});
document.getElementById("cahngePassword").addEventListener('click',async()=>{
    const blocker = document.createElement('div');
    blocker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.1);z-index:10;";
    const response = await fetch('/externalHTMLs/account/changePassword.html');
    blocker.innerHTML = await response.text();
    document.body.appendChild(blocker);

    document.getElementById("close").addEventListener('click',()=>{
        blocker.remove();
    });
    document.getElementById("changePasswordform").addEventListener('submit',async (event)=>{
        event.preventDefault();

        const currentPassword = document.getElementsByName("currentPassword")[0].value;
        const newPassword = document.getElementsByName("newPassword")[0].value;
        const validation = document.getElementsByName("confirm")[0].value;

        if(currentPassword.length<1){
            document.getElementsByName("currentPassword")[0].style.cssText = "background-color:rgb(255, 180, 180)";
            return;
        }else{
            document.getElementsByName("currentPassword")[0].style.cssText = "background-color:white";
            if(newPassword.length<1){
                document.getElementsByName("newPassword")[0].style.cssText = "background-color:rgb(255, 180, 180)";
                return;
            }else{
                document.getElementsByName("newPassword")[0].style.cssText = "background-color:white";
                if(validation.length<1){
                    document.getElementsByName("confirm")[0].style.cssText = "background-color:rgb(255, 180, 180)";
                    return;
                }else{
                    document.getElementsByName("confirm")[0].style.cssText = "background-color:white";
                }
            }
        }

        if(newPassword!=validation){
            document.getElementsByName("confirm")[0].style.cssText = "background-color:rgb(255, 180, 180)";
            document.getElementsByName("newPassword")[0].style.cssText = "background-color:rgb(255, 180, 180)";
            return;
        }else{

            const currentURL = window.location.href+'/changePassword';
            const response = await fetch(currentURL,{
                method:'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({
                    "currentPassword":currentPassword,
                    "newPassword":newPassword,
                })
            });
            const jsonSTR = await response.json();
            var data = JSON.parse(jsonSTR);

            if(data["error"]==406){
                alert("Current Password Is Wrong");
            }else{
                alert("Password has changed");
                window.location.replace("")
            }
        }
    })
});

//functions

function isValidPhoneNumber(str){
    if(str.length!=10||str[0]!='0'||str[1]!='5'){
        return false;
    }
    for(let i=0;i<10;i++){
        if(!(str[i]>='0'&&str[i]<='9')){
            return false;
        }
    }
    return true;
}
function isValidEmail(str){
    if(str.length<5){
        return false;
    }
    lastDotIndex = -1;
    shtrudelIndex = -1;
    shtrudeCNT = 0;
    for(let i=0;i<str.length;i++){
        if(str[i]=='@'){
            shtrudelIndex = i;
            shtrudeCNT++;
        }
        if(str[i]=='.'){
            lastDotIndex = i;
        }
    }
    if(shtrudelIndex==-1||lastDotIndex==-1||lastDotIndex==str.length-1||shtrudelIndex==0||shtrudeCNT!=1){
        return false;
    }
    return true;
}
